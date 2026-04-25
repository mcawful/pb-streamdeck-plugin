import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { action, SingletonAction } from "./test/streamDeckSdkMock";

const { streamDeckMock, testPhantomBotConnection, connectionSend, getInspectorHandler } = vi.hoisted(() => {
	const testPhantomBotConnection = vi.fn();
	const connectionSend = vi.fn().mockResolvedValue(undefined);
	let inspectorHandler: ((ev: unknown) => Promise<void>) | undefined;

	const streamDeckMock = {
		logger: { setLevel: vi.fn(), warn: vi.fn(), error: vi.fn() },
		actions: { registerAction: vi.fn() },
		ui: {
			onSendToPlugin: vi.fn((fn: (ev: unknown) => Promise<void>) => {
				inspectorHandler = fn;
			}),
		},
		connect: vi.fn(),
		settings: { getGlobalSettings: vi.fn() },
	};

	return {
		streamDeckMock,
		testPhantomBotConnection,
		connectionSend,
		getInspectorHandler: () => {
			if (!inspectorHandler) {
				throw new Error("Inspector handler was not registered (plugin not loaded?)");
			}
			return inspectorHandler;
		},
	};
});

vi.mock("@elgato/streamdeck", () => ({
	default: streamDeckMock,
	action,
	SingletonAction,
}));

vi.mock("./lib/streamDeckConnection", () => ({
	connection: {
		send: (...args: unknown[]) => connectionSend(...args),
	},
}));

vi.mock("./lib/phantomBot", () => ({
	testPhantomBotConnection: (...args: unknown[]) => testPhantomBotConnection(...args),
}));

describe("plugin inspector (testConnection)", () => {
	beforeAll(async () => {
		vi.resetModules();
		await import("./plugin");
	});

	beforeEach(() => {
		vi.clearAllMocks();
		testPhantomBotConnection.mockReset();
		connectionSend.mockResolvedValue(undefined);
	});

	it("does nothing when event is not testConnection", async () => {
		await getInspectorHandler()({
			payload: { event: "somethingElse", settings: {} },
			action: { id: "ctx-1" },
		});
		expect(connectionSend).not.toHaveBeenCalled();
		expect(testPhantomBotConnection).not.toHaveBeenCalled();
	});

	it("sends failure when URL or token is missing", async () => {
		await getInspectorHandler()({
			payload: {
				event: "testConnection",
				settings: { baseUrl: "", webauth: "x" },
			},
			action: { id: "ctx-2" },
		});
		expect(testPhantomBotConnection).not.toHaveBeenCalled();
		expect(connectionSend).toHaveBeenCalledWith({
			event: "sendToPropertyInspector",
			context: "ctx-2",
			payload: {
				event: "connectionResult",
				ok: false,
				message: "Enter URL and token.",
			},
		});
	});

	it("sends success when the probe returns ok", async () => {
		testPhantomBotConnection.mockResolvedValue({ ok: true, status: 405, body: "" });
		await getInspectorHandler()({
			payload: {
				event: "testConnection",
				settings: { baseUrl: "https://bot/", webauth: "secret" },
			},
			action: { id: "ctx-3" },
		});
		expect(testPhantomBotConnection).toHaveBeenCalledWith({
			baseUrl: "https://bot/",
			webauth: "secret",
			allowInsecureTls: false,
		});
		expect(connectionSend).toHaveBeenCalledWith({
			event: "sendToPropertyInspector",
			context: "ctx-3",
			payload: {
				event: "connectionResult",
				ok: true,
				message: "Connected.",
			},
		});
	});

	it("sends failure with HTTP status when the probe is not ok", async () => {
		testPhantomBotConnection.mockResolvedValue({ ok: false, status: 401, body: "" });
		await getInspectorHandler()({
			payload: {
				event: "testConnection",
				settings: { baseUrl: "https://bot/", webauth: "bad" },
			},
			action: { id: "ctx-4" },
		});
		expect(connectionSend).toHaveBeenCalledWith({
			event: "sendToPropertyInspector",
			context: "ctx-4",
			payload: {
				event: "connectionResult",
				ok: false,
				message: "Failed (HTTP 401). Check URL and token.",
			},
		});
	});

	it("maps AbortError to timeout message", async () => {
		const err = new Error("aborted");
		err.name = "AbortError";
		testPhantomBotConnection.mockRejectedValue(err);
		await getInspectorHandler()({
			payload: {
				event: "testConnection",
				settings: { baseUrl: "https://bot/", webauth: "x" },
			},
			action: { id: "ctx-5" },
		});
		expect(connectionSend).toHaveBeenCalledWith({
			event: "sendToPropertyInspector",
			context: "ctx-5",
			payload: {
				event: "connectionResult",
				ok: false,
				message: "Timed out. Check URL and network.",
			},
		});
	});

	it("maps other errors to a generic failure message", async () => {
		testPhantomBotConnection.mockRejectedValue(new Error("ECONNREFUSED"));
		await getInspectorHandler()({
			payload: {
				event: "testConnection",
				settings: { baseUrl: "http://localhost:1", webauth: "x" },
			},
			action: { id: "ctx-6" },
		});
		expect(connectionSend).toHaveBeenCalledWith(
			expect.objectContaining({
				context: "ctx-6",
				payload: expect.objectContaining({
					ok: false,
					message: expect.stringMatching(/^Can't reach bot\./) as string,
				}),
			}),
		);
	});

	it("passes allowInsecureTls from inspector settings", async () => {
		testPhantomBotConnection.mockResolvedValue({ ok: true, status: 405, body: "" });
		await getInspectorHandler()({
			payload: {
				event: "testConnection",
				settings: {
					baseUrl: "https://bot/",
					webauth: "x",
					allowInsecureTls: 1,
				},
			},
			action: { id: "ctx-7" },
		});
		expect(testPhantomBotConnection).toHaveBeenCalledWith(expect.objectContaining({ allowInsecureTls: true }));
	});
});
