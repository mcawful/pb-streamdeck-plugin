/**
 * Stream Deck action that sends a PhantomBot chat command on key press.
 *
 * @module
 */
import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

import { sendPhantomCommand } from "../lib/phantomBot";
import { toBool } from "../lib/toBool";
import type { PhantomCommandActionSettings, PluginGlobalSettings } from "../settings";

/** Runs one configured `!command` against PhantomBot using global URL, token, and bot user. */
@action({ UUID: "com.mcawful.pbstreamdeck.command" })
export class PhantomCommand extends SingletonAction<PhantomCommandActionSettings> {
	/**
	 * Reads global and per-key settings, validates them, then `PUT`s to PhantomBot `/dbquery`.
	 *
	 * @param ev Stream Deck key-down event with this key’s `command` setting.
	 */
	override async onKeyDown(ev: KeyDownEvent<PhantomCommandActionSettings>): Promise<void> {
		if (!ev.action.isKey()) return;

		const globals = await streamDeck.settings.getGlobalSettings<PluginGlobalSettings>();
		const baseUrl = (globals.baseUrl ?? "").trim();
		const webauth = (globals.webauth ?? "").trim();
		const phantomUser = (globals.phantomUser ?? "").trim();
		const command = (ev.payload.settings.command ?? "").trim();

		if (!baseUrl || !webauth || !phantomUser) {
			streamDeck.logger.warn("PhantomBot: fill URL, token, and Bot Twitch user (Bot section in inspector).");
			await ev.action.showAlert();
			return;
		}

		if (!command) {
			streamDeck.logger.warn("PhantomBot: no command on this key.");
			await ev.action.showAlert();
			return;
		}

		const message = asPhantomBotCommandMessage(command);

		const allowInsecureTls = toBool(globals.allowInsecureTls);
		if (baseUrl.toLowerCase().startsWith("http://")) {
			streamDeck.logger.warn("PhantomBot: HTTP URL in use (unencrypted transport). Prefer HTTPS when possible.");
		}
		if (allowInsecureTls && baseUrl.toLowerCase().startsWith("https:")) {
			streamDeck.logger.warn(
				"PhantomBot: HTTPS without certificate verification (option enabled). Untrusted networks can impersonate your bot (MITM).",
			);
		}

		try {
			const result = await sendPhantomCommand({
				baseUrl,
				webauth,
				phantomUser,
				message,
				allowInsecureTls,
			});

			if (result.ok) {
				await ev.action.showOk();
			} else {
				streamDeck.logger.warn(`PhantomBot HTTP ${result.status}: ${result.body}`);
				await ev.action.showAlert();
			}
		} catch (err) {
			streamDeck.logger.error(`PhantomBot request failed: ${err}`);
			await ev.action.showAlert();
		}
	}
}

/**
 * Normalizes user input for PhantomBot’s `message` header (chat commands must start with `!`).
 *
 * @param raw Command from the property inspector (with or without leading `!`).
 * @returns Trimmed string with a leading `!` when non-empty and not already present.
 */
function asPhantomBotCommandMessage(raw: string): string {
	const t = raw.trim();
	if (!t) return "";
	return t.startsWith("!") ? t : `!${t}`;
}
