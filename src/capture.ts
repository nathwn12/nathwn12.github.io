/**
 * Dev-only capture harness. The recorded loop is rendered by the same ported
 * multi-pass pipeline the hero used, never by the reference demo. Vite serves
 * this page in dev; the production build has index.html as its only entry.
 */
import { BlackHoleRenderer, type Quality } from "./lib/blackhole/renderer";

const canvas = document.getElementById("scene") as HTMLCanvasElement;
const params = new URLSearchParams(location.search);
const quality = (params.get("quality") ?? "high") as Quality;

const renderer = new BlackHoleRenderer(canvas, quality);
renderer.setFov(Number(params.get("fov") ?? 1));
renderer.resize(innerWidth, innerHeight, 1);

const api = {
  ready: true,
  renderAt(time: number) {
    renderer.render(time);
  },
  size() {
    return renderer.size;
  },
  frame() {
    return canvas.toDataURL("image/png");
  },
};

Object.assign(window, { __horizon: api });
renderer.render(0);
