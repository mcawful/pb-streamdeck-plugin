import streamDeck from "@elgato/streamdeck";
// Not exported from `@elgato/streamdeck` package entry; relative path so Rollup bundles it.
// Used so replies use this action's `context` (streamDeck.ui.sendToPropertyInspector can no-op if UI has no current action).
import { connection } from "../node_modules/@elgato/streamdeck/dist/plugin/connection.js";

import { PhantomCommand } from "./actions/phantomCommand";
import { testPhantomBotConnection } from "./lib/phantomBot";
import type { PluginGlobalSettings } from "./settings";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new PhantomCommand());

type InspectorRequest = {
	event?: string;
	settings?: PluginGlobalSettings;
};

type ConnectionResultPayload = {
	event: "connectionResult";
	ok: boolean;
	message: string;
};

function toBool(value: unknown): boolean {
	return value === true || value === "true" || value === 1 || value === "1";
}

async function sendConnectionResultToInspector(context: string, payload: ConnectionResultPayload): Promise<void> {
	await connection.send({
		event: "sendToPropertyInspector",
		context,
		payload
	});
}

streamDeck.ui.onSendToPlugin<InspectorRequest>(async (ev) => {
	const payload = ev.payload ?? {};
	if (payload.event !== "testConnection") return;

	const context = ev.action.id;
	const s = payload.settings ?? {};
	const baseUrl = (s.baseUrl ?? "").trim();
	const webauth = (s.webauth ?? "").trim();
	const allowInsecureTls = toBool(s.allowInsecureTls);

	if (!baseUrl || !webauth) {
		await sendConnectionResultToInspector(context, {
			event: "connectionResult",
			ok: false,
			message: "Enter URL and token."
		});
		return;
	}

	try {
		const result = await testPhantomBotConnection({ baseUrl, webauth, allowInsecureTls });
		if (result.ok) {
			await sendConnectionResultToInspector(context, {
				event: "connectionResult",
				ok: true,
				message: "Connected."
			});
		} else {
			await sendConnectionResultToInspector(context, {
				event: "connectionResult",
				ok: false,
				message: `Failed (HTTP ${result.status}). Check URL and token.`
			});
		}
	} catch (err) {
		const aborted = err instanceof Error && err.name === "AbortError";
		await sendConnectionResultToInspector(context, {
			event: "connectionResult",
			ok: false,
			message: aborted ? "Timed out. Check URL and network." : `Can't reach bot. ${String(err)}`
		});
	}
});

streamDeck.connect();
