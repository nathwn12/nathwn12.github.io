/**
 * Restore jsdom's `localStorage` when the Node runtime shadows it.
 *
 * Node 26 defines its own `globalThis.localStorage`, gated behind
 * `--localstorage-file`; without that flag every read is `undefined`. Because
 * the jsdom environment populates the same global object, Node's accessor wins
 * and `window.localStorage` is `undefined` even on a real origin, so any test
 * that stores a preference throws. jsdom keeps its own store on the window as
 * `_localStorage`, so re-expose that under the name the tests (and the app) use.
 *
 * Inert where the runtime does not define the global (CI runs Node 22/24).
 */
type JsdomWindow = {
  _localStorage?: Storage;
  localStorage?: Storage;
};

const jsdomWindow = globalThis as unknown as JsdomWindow;
const jsdomStorage = jsdomWindow._localStorage;

if (
  jsdomStorage !== undefined &&
  typeof jsdomWindow.localStorage === "undefined"
) {
  Object.defineProperty(jsdomWindow, "localStorage", {
    configurable: true,
    enumerable: true,
    get: () => jsdomStorage,
  });
}
