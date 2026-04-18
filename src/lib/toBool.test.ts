import { describe, expect, it } from "vitest";

import { toBool } from "./toBool";

describe("toBool", () => {
	it("treats boolean true as true", () => {
		expect(toBool(true)).toBe(true);
	});

	it("treats string true as true", () => {
		expect(toBool("true")).toBe(true);
	});

	it("treats number 1 as true", () => {
		expect(toBool(1)).toBe(true);
	});

	it('treats string "1" as true', () => {
		expect(toBool("1")).toBe(true);
	});

	it("treats false, other strings, numbers, null, undefined as false", () => {
		expect(toBool(false)).toBe(false);
		expect(toBool("false")).toBe(false);
		expect(toBool("")).toBe(false);
		expect(toBool(0)).toBe(false);
		expect(toBool(-1)).toBe(false);
		expect(toBool(null)).toBe(false);
		expect(toBool(undefined)).toBe(false);
		expect(toBool({})).toBe(false);
		expect(toBool([])).toBe(false);
	});
});
