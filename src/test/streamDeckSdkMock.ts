/**
 * Test doubles for `@elgato/streamdeck` (class decorator + base class only).
 * Default `streamDeck` object is supplied per test file via `vi.mock` + `vi.hoisted`.
 *
 * @module
 */

/** No-op class decorator used by the real SDK for `SingletonAction` subclasses. */
export function action(_opts: { UUID: string }) {
	return <T extends new (...args: never[]) => unknown>(ctor: T): T => ctor;
}

/** Minimal base class so action modules can extend `SingletonAction` under test. */
export class SingletonAction<_TSettings = unknown> {
	constructor() {}
}
