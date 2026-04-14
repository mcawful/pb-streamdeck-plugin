import streamDeck from "@elgato/streamdeck";

import { PhantomCommand } from "./actions/phantomCommand";
import { testPhantomBotConnection } from "./lib/phantomBot";
import type { PluginGlobalSettings } from "./settings";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new PhantomCommand());

type InspectorRequest = {
	event?: string;
	settings?: PluginGlobalSettings;
};

streamDeck.ui.onSendToPlugin<InspectorRequest>(async (ev) => {
	const payload = ev.payload ?? {};
	if (payload.event !== "testConnection") return;

	const s = payload.settings ?? {};
	const baseUrl = (s.baseUrl ?? "").trim();
	const webauth = (s.webauth ?? "").trim();
	const allowInsecureTls = s.allowInsecureTls === true;

	if (!baseUrl || !webauth) {
		await streamDeck.ui.sendToPropertyInspector({
			event: "connectionResult",
			ok: false,
			message: "Enter URL and token."
		});
		return;
	}

	try {
		const result = await testPhantomBotConnection({ baseUrl, webauth, allowInsecureTls });
		if (result.ok) {
			await streamDeck.ui.sendToPropertyInspector({
				event: "connectionResult",
				ok: true,
				message: "Connected."
			});
		} else {
			await streamDeck.ui.sendToPropertyInspector({
				event: "connectionResult",
				ok: false,
				message: `Failed (HTTP ${result.status}). Check URL and token.`
			});
		}
	} catch (err) {
		await streamDeck.ui.sendToPropertyInspector({
			event: "connectionResult",
			ok: false,
			message: `Can't reach bot. ${String(err)}`
		});
	}
});

streamDeck.connect();
