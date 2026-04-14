export function toBool(value: unknown): boolean {
	return value === true || value === "true" || value === 1 || value === "1";
}
