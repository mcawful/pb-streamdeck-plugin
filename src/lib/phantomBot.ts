import { Agent, fetch as undiciFetch, type RequestInit } from "undici";

export type SendPhantomCommandOptions = {
	baseUrl: string;
	/** PhantomBot panel webauth token. */
	webauth: string;
	phantomUser: string;
	message: string;
	allowInsecureTls?: boolean;
};

/**
 * PhantomBot accepts an authenticated PUT on paths like /dbquery and runs chat commands when the message starts with "!".
 * The plugin ensures the `message` header includes a leading `!` when needed.
 * @see https://github.com/PhantomBot/PhantomBot/blob/master/source/tv/phantombot/httpserver/HTTPAuthenticatedHandler.java
 */
export async function sendPhantomCommand(
	options: SendPhantomCommandOptions
): Promise<{ ok: boolean; status: number; body: string }> {
	const base = options.baseUrl.replace(/\/$/, "");
	const url = `${base}/dbquery`;

	const headers: Record<string, string> = {
		user: options.phantomUser,
		message: options.message,
		webauth: options.webauth
	};

	const init: RequestInit = {
		method: "PUT",
		headers
	};

	if (options.allowInsecureTls) {
		init.dispatcher = new Agent({
			connect: {
				rejectUnauthorized: false
			}
		});
	}

	const res = await undiciFetch(url, init);
	const body = await res.text();
	return { ok: res.ok, status: res.status, body };
}
