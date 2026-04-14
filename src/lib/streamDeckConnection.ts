/**
 * Not exported from `@elgato/streamdeck`; this path is bundled by Rollup.
 * Used to send `sendToPropertyInspector` with a specific action `context`, because
 * `streamDeck.ui.sendToPropertyInspector` can no-op when the UI controller has no current action.
 */
export { connection } from "../../node_modules/@elgato/streamdeck/dist/plugin/connection.js";
