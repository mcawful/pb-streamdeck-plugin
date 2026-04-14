import streamdeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

import { sendPhantomCommand } from "../lib/phantomBot";
import { toBool } from "../lib/toBool";
import type { PhantomCommandActionSettings, PluginGlobalSettings } from "../settings";

@action({ UUID: "com.mcawful.pbstreamdeck.command" })
export class PhantomCommand extends SingletonAction<PhantomCommandActionSettings> {
	override async onKeyDown(ev: KeyDownEvent<PhantomCommandActionSettings>): Promise<void> {
		if (!ev.action.isKey()) return;

		const globals = await streamdeck.settings.getGlobalSettings<PluginGlobalSettings>();
		const baseUrl = (globals.baseUrl ?? "").trim();
		const webauth = (globals.webauth ?? "").trim();
		const phantomUser = (globals.phantomUser ?? "").trim();
		const command = (ev.payload.settings.command ?? "").trim();

		if (!baseUrl || !webauth || !phantomUser) {
			streamdeck.logger.warn("PhantomBot: fill URL, token, and Bot Twitch user (Bot section in inspector).");
			await ev.action.showAlert();
			return;
		}

		if (!command) {
			streamdeck.logger.warn("PhantomBot: no command on this key.");
			await ev.action.showAlert();
			return;
		}

		const message = asPhantomBotCommandMessage(command);

		try {
			const result = await sendPhantomCommand({
				baseUrl,
				webauth,
				phantomUser,
				message,
				allowInsecureTls: toBool(globals.allowInsecureTls)
			});

			if (result.ok) {
				await ev.action.showOk();
			} else {
				streamdeck.logger.warn(`PhantomBot HTTP ${result.status}: ${result.body}`);
				await ev.action.showAlert();
			}
		} catch (err) {
			streamdeck.logger.error(`PhantomBot request failed: ${err}`);
			await ev.action.showAlert();
		}
	}
}

/** PhantomBot treats messages starting with `!` as chat commands; we add it if the user omitted it. */
function asPhantomBotCommandMessage(raw: string): string {
	const t = raw.trim();
	if (!t) return "";
	return t.startsWith("!") ? t : `!${t}`;
}
