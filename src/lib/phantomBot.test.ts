import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendPhantomCommand, testPhantomBotConnection } from "./phantomBot";

const { mockFetch } = vi.hoisted(() => ({
	mockFetch: vi.fn(),
}));

vi.mock("undici", async (importOriginal) => {
	const undici = await importOriginal<typeof import("undici")>();
	return {
		...undici,
		fetch: mockFetch,
	};
});

describe("sendPhantomCommand", () => {
	beforeEach(() => {
		mockFetch.mockReset();
		mockFetch.mockImplementation(() => Promise.resolve(new Response("{}", { status: 200 })));
	});

	it("PUTs to /dbquery with trailing slash stripped from base URL", async () => {
		await sendPhantomCommand({
			baseUrl: "https://bot.example:25000/",
			webauth: "token",
			phantomUser: "channel",
			message: "!ping",
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const [url, init] = mockFetch.mock.calls[0]!;
		expect(String(url)).toBe("https://bot.example:25000/dbquery");
		expect(init).toMatchObject({
			method: "PUT",
			headers: {
				user: "channel",
				message: "!ping",
				webauth: "token",
			},
		});
	});

	it("returns ok, status, and body text", async () => {
		mockFetch.mockResolvedValue(new Response("not ok", { status: 401, statusText: "Unauthorized" }));

		const result = await sendPhantomCommand({
			baseUrl: "http://127.0.0.1:25000",
			webauth: "w",
			phantomUser: "u",
			message: "!x",
		});

		expect(result).toEqual({ ok: false, status: 401, body: "not ok" });
	});

	it("passes a dispatcher when allowInsecureTls is true", async () => {
		await sendPhantomCommand({
			baseUrl: "https://selfsigned.local",
			webauth: "w",
			phantomUser: "u",
			message: "!x",
			allowInsecureTls: true,
		});

		const init = mockFetch.mock.calls[0]![1] as RequestInit;
		expect(init.dispatcher).toBeDefined();
	});

	it("does not set dispatcher when allowInsecureTls is false", async () => {
		await sendPhantomCommand({
			baseUrl: "https://ok.example",
			webauth: "w",
			phantomUser: "u",
			message: "!x",
			allowInsecureTls: false,
		});
		expect((mockFetch.mock.calls[0]![1] as RequestInit).dispatcher).toBeUndefined();
	});

	it("does not set dispatcher when allowInsecureTls is omitted", async () => {
		await sendPhantomCommand({
			baseUrl: "https://ok.example",
			webauth: "w",
			phantomUser: "u",
			message: "!x",
		});
		expect((mockFetch.mock.calls[0]![1] as RequestInit).dispatcher).toBeUndefined();
	});
});

describe("testPhantomBotConnection", () => {
	beforeEach(() => {
		mockFetch.mockReset();
		mockFetch.mockImplementation(() => Promise.resolve(new Response("[]", { status: 200 })));
	});

	it("GETs /games?search=a with webauth header", async () => {
		await testPhantomBotConnection({
			baseUrl: "https://host/",
			webauth: "abc",
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const [url, init] = mockFetch.mock.calls[0]!;
		expect(String(url)).toBe("https://host/games?search=a");
		expect(init).toMatchObject({
			method: "GET",
			headers: { webauth: "abc" },
		});
		expect((init as RequestInit).signal).toBeInstanceOf(AbortSignal);
	});

	it("fires client abort after 12s so the GET can be torn down", async () => {
		vi.useFakeTimers();
		try {
			mockFetch.mockImplementation((_url: string, init?: RequestInit) => {
				return new Promise<Response>((resolve) => {
					init?.signal?.addEventListener("abort", () => {
						resolve(new Response("timed out", { status: 408 }));
					});
				});
			});

			const p = testPhantomBotConnection({ baseUrl: "http://localhost:1", webauth: "x" });
			await vi.advanceTimersByTimeAsync(12_000);
			const result = await p;
			const init = mockFetch.mock.calls[0]![1] as RequestInit;
			expect(init.signal?.aborted).toBe(true);
			expect(result).toEqual({ ok: false, status: 408, body: "timed out" });
			await vi.runOnlyPendingTimersAsync();
		} finally {
			vi.useRealTimers();
		}
	});

	it("clears the timeout when the request finishes", async () => {
		vi.useFakeTimers();
		try {
			const clearSpy = vi.spyOn(globalThis, "clearTimeout");
			mockFetch.mockImplementation(() => Promise.resolve(new Response("ok", { status: 200 })));

			await testPhantomBotConnection({ baseUrl: "http://x", webauth: "y" });

			expect(clearSpy).toHaveBeenCalled();
			clearSpy.mockRestore();
			await vi.runOnlyPendingTimersAsync();
		} finally {
			vi.useRealTimers();
		}
	});

	it("passes dispatcher when allowInsecureTls is true", async () => {
		await testPhantomBotConnection({
			baseUrl: "https://x",
			webauth: "w",
			allowInsecureTls: true,
		});
		const init = mockFetch.mock.calls[0]![1] as RequestInit;
		expect(init.dispatcher).toBeDefined();
	});
});
