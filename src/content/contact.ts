/**
 * Contact content — the address single-sourced from src/lib/contact.ts and
 * the Web3Forms relay key.
 *
 * `WEB3FORMS_KEY` is empty until the owner pastes a Web3Forms access key:
 * empty keeps the page on the keyless mailto + copy + GitHub-issue path;
 * non-empty renders the relay form posting to api.web3forms.com/submit.
 */
export { CONTACT_EMAIL } from "../lib/contact";

/** Web3Forms access key. Empty until the owner opts into the relay form. */
export const WEB3FORMS_KEY = "";
