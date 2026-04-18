/**
 * Normalizes user input for PhantomBot's `message` header (chat commands must start with `!`).
 *
 * @param raw Command from the property inspector (with or without leading `!`).
 * @returns Trimmed string with a leading `!` when non-empty and not already present.
 */
export function asPhantomBotCommandMessage(raw: string): string {
	const t = raw.trim();
	if (!t) return "";
	return t.startsWith("!") ? t : `!${t}`;
}
