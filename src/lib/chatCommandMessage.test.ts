import { describe, expect, it } from "vitest";

import { asPhantomBotCommandMessage } from "./chatCommandMessage";

describe("asPhantomBotCommandMessage", () => {
	it("returns empty string for blank input", () => {
		expect(asPhantomBotCommandMessage("")).toBe("");
		expect(asPhantomBotCommandMessage("   ")).toBe("");
	});

	it("prefixes bare command with !", () => {
		expect(asPhantomBotCommandMessage("follow")).toBe("!follow");
		expect(asPhantomBotCommandMessage("  points  ")).toBe("!points");
	});

	it("keeps leading !", () => {
		expect(asPhantomBotCommandMessage("!raid")).toBe("!raid");
		expect(asPhantomBotCommandMessage("  !clip  ")).toBe("!clip");
	});
});
