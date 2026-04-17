/**
 * Plugin entry: registers Stream Deck actions and handles messages from the
 * property inspector (for example the PhantomBot connection test).
 *
 * @module
 */
import streamDeck from "@elgato/streamdeck";

import { RunCommandAction } from "./actions/runCommand";
import { testPhantomBotConnection } from "./lib/phantomBot";
import { connection } from "./lib/streamDeckConnection";
import { toBool } from "./lib/toBool";
import type { PluginGlobalSettings } from "./settings";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new RunCommandAction());

/** Payload shape the property inspector sends with `sendToPlugin`. */
type InspectorRequest = {
	event?: string;
	settings?: PluginGlobalSettings;
};

/** Reply the inspector listens for after a connection test. */
type ConnectionResultPayload = {
	event: "connectionResult";
	ok: boolean;
	message: string;
};

/**
 * Sends a connection test result to the property inspector for a given key.
 *
 * @param context Stream Deck action id whose inspector should receive the message.
 * @param payload Outcome and user-facing status line.
 */
async function sendConnectionResultToInspector(context: string, payload: ConnectionResultPayload): Promise<void> {
	await connection.send({
		event: "sendToPropertyInspector",
		context,
		payload,
	});
}

/** Handles inspector-driven requests such as `testConnection`. */
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
			message: "Enter URL and token.",
		});
		return;
	}

	try {
		if (baseUrl.toLowerCase().startsWith("http://")) {
			streamDeck.logger.warn(
				"PhantomBot connection test: HTTP URL in use (unencrypted transport). Prefer HTTPS when possible.",
			);
		}
		if (allowInsecureTls && baseUrl.toLowerCase().startsWith("https:")) {
			streamDeck.logger.warn(
				"PhantomBot connection test: HTTPS without certificate verification (option enabled). MITM risk on untrusted networks.",
			);
		}
		const result = await testPhantomBotConnection({ baseUrl, webauth, allowInsecureTls });
		if (result.ok) {
			await sendConnectionResultToInspector(context, {
				event: "connectionResult",
				ok: true,
				message: "Connected.",
			});
		} else {
			await sendConnectionResultToInspector(context, {
				event: "connectionResult",
				ok: false,
				message: `Failed (HTTP ${result.status}). Check URL and token.`,
			});
		}
	} catch (err) {
		const aborted = err instanceof Error && err.name === "AbortError";
		await sendConnectionResultToInspector(context, {
			event: "connectionResult",
			ok: false,
			message: aborted ? "Timed out. Check URL and network." : `Can't reach bot. ${String(err)}`,
		});
	}
});

streamDeck.connect();
