import streamDeck from "@elgato/streamdeck";

import { PhantomCommand } from "./actions/phantomCommand";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new PhantomCommand());

streamDeck.connect();
