import type { KeyDownEvent } from "@elgato/streamdeck";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunCommandActionSettings } from "../settings";
import { action, SingletonAction } from "../test/streamDeckSdkMock";
import { RunCommandAction } from "./runCommand";

const { streamDeckMock, sendPhantomCommandMock } = vi.hoisted(() => {
	const sendPhantomCommandMock = vi.fn();
	const streamDeckMock = {
		logger: { warn: vi.fn(), error: vi.fn() },
		settings: {
			getGlobalSettings: vi.fn(),
		},
	};
	return { streamDeckMock, sendPhantomCommandMock };
});

vi.mock("@elgato/streamdeck", () => ({
	default: streamDeckMock,
	action,
	SingletonAction,
}));

vi.mock("../lib/phantomBot", () => ({
	sendPhantomCommand: sendPhantomCommandMock,
}));

function keyEvent(
	settings: RunCommandActionSettings,
	actionMocks: {
		isKey: () => boolean;
		showAlert: ReturnType<typeof vi.fn>;
		showOk: ReturnType<typeof vi.fn>;
	},
): KeyDownEvent<RunCommandActionSettings> {
	return {
		action: actionMocks,
		payload: { settings },
	} as unknown as KeyDownEvent<RunCommandActionSettings>;
}

describe("RunCommandAction", () => {
	let run: RunCommandAction;

	beforeEach(() => {
		vi.clearAllMocks();
		sendPhantomCommandMock.mockReset();
		streamDeckMock.settings.getGlobalSettings.mockResolvedValue({
			baseUrl: "https://bot.example/",
			webauth: "tok",
			phantomUser: "streamer",
		});
		run = new RunCommandAction();
	});

	it("returns early when the control is not a key", async () => {
		const ev = keyEvent(
			{ command: "!hi" },
			{
				isKey: () => false,
				showAlert: vi.fn(),
				showOk: vi.fn(),
			},
		);
		await run.onKeyDown(ev);
		expect(streamDeckMock.settings.getGlobalSettings).not.toHaveBeenCalled();
		expect(sendPhantomCommandMock).not.toHaveBeenCalled();
	});

	it("shows alert when global URL, token, or bot user is missing", async () => {
		streamDeckMock.settings.getGlobalSettings.mockResolvedValue({
			baseUrl: " ",
			webauth: "tok",
			phantomUser: "streamer",
		});
		const showAlert = vi.fn();
		await run.onKeyDown(keyEvent({ command: "!a" }, { isKey: () => true, showAlert, showOk: vi.fn() }));
		expect(showAlert).toHaveBeenCalledOnce();
		expect(streamDeckMock.logger.warn).toHaveBeenCalled();
		expect(sendPhantomCommandMock).not.toHaveBeenCalled();
	});

	it("shows alert when command is empty", async () => {
		const showAlert = vi.fn();
		await run.onKeyDown(keyEvent({ command: "  " }, { isKey: () => true, showAlert, showOk: vi.fn() }));
		expect(showAlert).toHaveBeenCalledOnce();
		expect(sendPhantomCommandMock).not.toHaveBeenCalled();
	});

	it("calls PhantomBot and shows OK on HTTP success", async () => {
		sendPhantomCommandMock.mockResolvedValue({ ok: true, status: 200, body: "{}" });
		const showOk = vi.fn();
		const showAlert = vi.fn();
		await run.onKeyDown(keyEvent({ command: "follow" }, { isKey: () => true, showAlert, showOk }));
		expect(sendPhantomCommandMock).toHaveBeenCalledWith({
			baseUrl: "https://bot.example/",
			webauth: "tok",
			phantomUser: "streamer",
			message: "!follow",
			allowInsecureTls: false,
		});
		expect(showOk).toHaveBeenCalledOnce();
		expect(showAlert).not.toHaveBeenCalled();
	});

	it("shows alert on HTTP error response", async () => {
		sendPhantomCommandMock.mockResolvedValue({ ok: false, status: 403, body: "nope" });
		const showAlert = vi.fn();
		await run.onKeyDown(keyEvent({ command: "!clip" }, { isKey: () => true, showAlert, showOk: vi.fn() }));
		expect(showAlert).toHaveBeenCalledOnce();
		expect(streamDeckMock.logger.warn).toHaveBeenCalled();
	});

	it("shows alert when sendPhantomCommand throws", async () => {
		sendPhantomCommandMock.mockRejectedValue(new Error("network down"));
		const showAlert = vi.fn();
		await run.onKeyDown(keyEvent({ command: "!raid" }, { isKey: () => true, showAlert, showOk: vi.fn() }));
		expect(showAlert).toHaveBeenCalledOnce();
		expect(streamDeckMock.logger.error).toHaveBeenCalled();
	});

	it("passes allowInsecureTls from globals", async () => {
		streamDeckMock.settings.getGlobalSettings.mockResolvedValue({
			baseUrl: "https://bot.example/",
			webauth: "tok",
			phantomUser: "streamer",
			allowInsecureTls: "true",
		});
		sendPhantomCommandMock.mockResolvedValue({ ok: true, status: 200, body: "" });
		await run.onKeyDown(
			keyEvent(
				{ command: "!x" },
				{
					isKey: () => true,
					showAlert: vi.fn(),
					showOk: vi.fn(),
				},
			),
		);
		expect(sendPhantomCommandMock).toHaveBeenCalledWith(expect.objectContaining({ allowInsecureTls: true }));
	});
});
