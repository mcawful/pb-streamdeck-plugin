/**
 * Low-level Stream Deck plugin connection singleton.
 *
 * Re-exported from the SDK package path (bundled by Rollup) because it is not part of the
 * public `@elgato/streamdeck` API surface. Use this to emit `sendToPropertyInspector` with an
 * explicit action `context` when `streamDeck.ui.sendToPropertyInspector` would no-op without a
 * focused inspector controller.
 *
 * @module
 */
export { connection } from "../../node_modules/@elgato/streamdeck/dist/plugin/connection.js";
