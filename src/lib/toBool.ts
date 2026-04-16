/**
 * Coerces persisted or JSON-like settings values to a boolean.
 * Treats `true`, the string `"true"`, `1`, and the string `"1"` as true; all other values as false.
 *
 * @param value Raw value from global settings or action payload.
 * @returns Whether the setting should be treated as enabled.
 */
export function toBool(value: unknown): boolean {
	return value === true || value === "true" || value === 1 || value === "1";
}
