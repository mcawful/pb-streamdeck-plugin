import streamdeck, {
	action,
	DidReceiveSettingsEvent,
	KeyAction,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent
} from "@elgato/streamdeck";

import { sendPhantomCommand } from "../lib/phantomBot";
import type { PhantomCommandActionSettings, PluginGlobalSettings } from "../settings";

@action({ UUID: "com.mcawful.pbstreamdeck.command" })
export class PhantomCommand extends SingletonAction<PhantomCommandActionSettings> {
	override async onWillAppear(ev: WillAppearEvent<PhantomCommandActionSettings>): Promise<void> {
		if (!ev.action.isKey()) return;
		await this.refreshTitle(ev.payload.settings, ev.action);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<PhantomCommandActionSettings>): Promise<void> {
		if (!ev.action.isKey()) return;
		await this.refreshTitle(ev.payload.settings, ev.action);
	}

	override async onKeyDown(ev: KeyDownEvent<PhantomCommandActionSettings>): Promise<void> {
		if (!ev.action.isKey()) return;

		const globals = await streamdeck.settings.getGlobalSettings<PluginGlobalSettings>();
		const baseUrl = (globals.baseUrl ?? "").trim();
		const webauth = (globals.webauth ?? "").trim();
		const phantomUser = (globals.phantomUser ?? "").trim();
		const command = (ev.payload.settings.command ?? "").trim();

		if (!baseUrl || !webauth || !phantomUser) {
			streamdeck.logger.warn("PhantomBot plugin settings incomplete (Base URL, token, or As user). Open plugin settings.");
			await ev.action.showAlert();
			return;
		}

		if (!command) {
			streamdeck.logger.warn("PhantomBot key missing command");
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

	private async refreshTitle(settings: PhantomCommandActionSettings, action: KeyAction<PhantomCommandActionSettings>) {
		const cmd = (settings.command ?? "").trim();
		const title = cmd ? truncate(cmd, 24) : "PB";
		await action.setTitle(title);
	}
}

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max - 1)}…`;
}

function toBool(value: unknown): boolean {
	return value === true || value === "true" || value === 1 || value === "1";
}

/** PhantomBot treats messages starting with `!` as chat commands; we add it if the user omitted it. */
function asPhantomBotCommandMessage(raw: string): string {
	const t = raw.trim();
	if (!t) return "";
	return t.startsWith("!") ? t : `!${t}`;
}
