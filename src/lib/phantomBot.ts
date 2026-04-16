/**
 * HTTP helpers for PhantomBot’s authenticated panel API (command execution and connection checks).
 *
 * @module
 */
import { Agent, type RequestInit, fetch as undiciFetch } from "undici";

/** Options for {@link sendPhantomCommand}. */
export type SendPhantomCommandOptions = {
	baseUrl: string;
	/** PhantomBot panel webauth token. */
	webauth: string;
	phantomUser: string;
	message: string;
	/** Skip TLS certificate verification for HTTPS only (insecure). */
	allowInsecureTls?: boolean;
};

/**
 * Sends a chat command to PhantomBot via authenticated `PUT /dbquery`.
 * PhantomBot runs chat commands when the `message` header starts with `!`; callers should pass text accordingly.
 *
 * @param options Base URL, auth headers, command text, and optional TLS behavior.
 * @returns HTTP outcome: `ok` mirrors `fetch` response ok, plus status code and response body text.
 * @see https://github.com/PhantomBot/PhantomBot/blob/master/source/tv/phantombot/httpserver/HTTPAuthenticatedHandler.java
 */
export async function sendPhantomCommand(
	options: SendPhantomCommandOptions,
): Promise<{ ok: boolean; status: number; body: string }> {
	const base = options.baseUrl.replace(/\/$/, "");
	const url = `${base}/dbquery`;

	const headers: Record<string, string> = {
		user: options.phantomUser,
		message: options.message,
		webauth: options.webauth,
	};

	const init: RequestInit = {
		method: "PUT",
		headers,
	};

	if (options.allowInsecureTls) {
		init.dispatcher = new Agent({
			connect: {
				rejectUnauthorized: false,
			},
		});
	}

	const res = await undiciFetch(url, init);
	const body = await res.text();
	return { ok: res.ok, status: res.status, body };
}

/** Options for {@link testPhantomBotConnection}. */
export type TestPhantomBotConnectionOptions = {
	baseUrl: string;
	/** PhantomBot panel webauth token. */
	webauth: string;
	/** Skip TLS certificate verification for HTTPS only (insecure). */
	allowInsecureTls?: boolean;
};

/**
 * Checks that the bot URL and webauth token work by calling authenticated `GET /games`.
 * Uses a short search query and a client-side timeout suitable for the property inspector.
 *
 * @param options Base URL, webauth header, and optional insecure HTTPS mode.
 * @returns HTTP outcome of the probe request (body is response text, often JSON).
 */
export async function testPhantomBotConnection(
	options: TestPhantomBotConnectionOptions,
): Promise<{ ok: boolean; status: number; body: string }> {
	const base = options.baseUrl.replace(/\/$/, "");
	const url = `${base}/games?search=a`;
	const headers: Record<string, string> = { webauth: options.webauth };

	const controller = new AbortController();
	const timeoutMs = 12_000;
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	const init: RequestInit = {
		method: "GET",
		headers,
		signal: controller.signal,
	};

	if (options.allowInsecureTls) {
		init.dispatcher = new Agent({
			connect: {
				rejectUnauthorized: false,
			},
		});
	}

	try {
		const res = await undiciFetch(url, init);
		const body = await res.text();
		return { ok: res.ok, status: res.status, body };
	} finally {
		clearTimeout(timeoutId);
	}
}
