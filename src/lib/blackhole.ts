/**
 * blackhole — one canvas, one program, one fragment shader.
 *
 * The scene is the idea, not wallpaper: a gravitational lens bends a deep field
 * of stars, a doppler-beamed accretion disc turns around a horizon that stays
 * black in both skies, and the photon ring splits light at its rim. Bloom,
 * filmic tone mapping, grain, vignette and a lensed echo are part of the same
 * pass. There is no scene graph and no 3D library: one full-screen triangle,
 * one set of uniforms, and CSS for the dust planes in front.
 *
 * Colour comes from the Phosphor token at run time, so the shader paints the
 * same signal the rest of the document uses. The loop stops when the document
 * is hidden or the canvas leaves the viewport, and a failed context leaves the
 * designed CSS still in place. Nothing here is reduced for an imagined device:
 * the backing store uses the device pixel ratio as-is.
 */

export interface BlackHoleHandle {
  /** True when a GL context and a linked program exist. */
  readonly live: boolean;
  /** Continuous chapter position, 0 .. 4. */
  setProgress(position: number): void;
  /** Fire the chapter flash when the View Transitions API is unavailable. */
  flash(): void;
  /** Destroy the program and stop every observer. */
  destroy(): void;
}

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uProgress;
uniform float uTheme;
uniform vec3 uAccent;
uniform float uFlash;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// One sparse star plane. Drift is the parallax; soft is the depth-of-field
// blur applied to the distant layers.
float plane(vec2 uv, float scale, float density, float drift, float soft) {
  vec2 g = uv * scale + vec2(drift, -drift * 0.32);
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float seed = hash21(id);
  if (seed < density) return 0.0;
  vec2 jitter = vec2(hash21(id + 1.7), hash21(id + 9.1)) - 0.5;
  float d = length(f - jitter * 0.72);
  float core = smoothstep(0.055 + soft, 0.0, d);
  float twinkle = 0.65 + 0.35 * sin(uTime * 1.4 + seed * 60.0);
  return core * twinkle * (0.35 + 0.65 * hash21(id + 4.3));
}

// ACES filmic curve: keeps the bright ring from clipping to a flat disc.
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  float prog = uProgress;

  // Desktop puts the hole in the clear right third; portrait recentres it for
  // its own composition instead of cropping the desktop frame.
  float narrow = step(uRes.x, 500.0);
  vec2 center = vec2(
    mix(0.46, 0.0, narrow) + 0.02 * sin(prog * 0.85),
    mix(0.02, -0.04, narrow) + 0.012 * cos(prog * 0.62)
  );
  vec2 d = uv - center;
  float r = length(d);
  float R = mix(0.122, 0.17, narrow) + 0.010 * sin(prog * 1.05);
  vec2 dir = d / max(r, 0.0001);

  // Lensing: the primary ray bends outward, the secondary ray folds back and
  // draws the far stars again on the near side of the mass.
  float bend = 0.00052 / (r * r + 0.004);
  vec2 lensed = uv + dir * bend;
  vec2 echo = uv - dir * (bend * 0.42);

  float s0 = plane(lensed, 13.0, 0.70, prog * 0.055, 0.000) * 0.52;
  float s1 = plane(lensed, 27.0, 0.81, prog * 0.125 + 4.0, 0.010) * 0.44;
  float s2 = plane(lensed, 47.0, 0.87, prog * 0.210 + 9.0, 0.022) * 0.36;
  float s3 = plane(echo,  19.0, 0.90, -prog * 0.070 + 13.0, 0.014) * 0.24;
  float star = s0 + s1 + s2 + s3;

  // Two authored skies. Light is a bright field, not an inverted dark one.
  vec3 sky = mix(vec3(0.012, 0.018, 0.018), vec3(0.885, 0.915, 0.880), uTheme);
  vec3 starTint = mix(vec3(0.90, 0.95, 0.93), vec3(0.16, 0.22, 0.19), uTheme);
  vec3 col = sky + star * starTint * mix(1.55, 1.05, uTheme);

  // A slow, desaturated deep-field wash. It never competes with the disc.
  float neb = sin(uv.x * 3.2 + t * 0.03) * sin(uv.y * 2.6 - t * 0.02);
  col += uAccent * (neb * 0.5 + 0.5) * 0.022 * (1.0 - uTheme);

  // Gravitational shadow holds the readout legible in both skies.
  float shadow = 1.0 - smoothstep(R * 0.98, R * 2.45, r);
  col = mix(col, vec3(0.0), shadow * mix(0.92, 0.97, uTheme));

  // Accretion disc: tilted ellipse, doppler beaming on the approaching side,
  // a soft volumetric bloom and a hotter inner rim that tends toward white.
  float tilt = -0.38 + 0.09 * sin(prog * 0.75);
  mat2 rot = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt));
  vec2 e = rot * d;
  vec2 dp = vec2(e.x, e.y * 3.05);
  float rd = length(dp);
  float inner = R * 1.10;
  float outer = R * (3.20 + 0.10 * sin(prog * 0.9));
  float ring = smoothstep(inner, inner + 0.016, rd) *
               (1.0 - smoothstep(outer - 0.060, outer, rd));
  float swirl = 0.5 + 0.5 * sin(rd * 38.0 - t * 1.15 + d.x * 9.0);
  float doppler = 0.45 + 0.95 * smoothstep(-1.0, 1.0, d.x / max(r, 0.0001));
  float disc = ring * (0.30 + 0.70 * swirl) * doppler;
  float bloom = exp(-abs(rd - (inner + outer) * 0.5) * 7.0) * 0.17;
  float front = step(0.0, e.y);
  col += uAccent * (disc * mix(0.75, 1.75, front) + bloom);
  col += vec3(0.72, 0.86, 0.80) * ring *
         (1.0 - smoothstep(inner, inner + R * 0.5, rd)) * 0.26 * front;

  // Photon ring, split per channel for chromatic aberration at the rim.
  float pr = smoothstep(0.013, 0.0, abs(r - R * 1.045 - 0.004));
  float pg = smoothstep(0.013, 0.0, abs(r - R * 1.045));
  float pb = smoothstep(0.013, 0.0, abs(r - R * 1.045 + 0.004));
  col += vec3(pr, pg, pb) * uAccent * 1.40;

  // The event horizon is black in both themes. Non-negotiable.
  float horizon = 1.0 - smoothstep(R - 0.003, R + 0.002, r);
  col = mix(col, vec3(0.0), horizon);

  // Chapter flash: light bending through the lens on a click that has no view
  // transition to carry it.
  col += uAccent * uFlash * 0.55 + vec3(uFlash * 0.22);

  col *= 1.0 - 0.28 * smoothstep(0.22, 0.80, length(uv));
  col = aces(col * 1.08);
  float grain = hash21(gl_FragCoord.xy + fract(t) * vec2(37.0, 17.0));
  col += (grain - 0.5) * 0.022;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** `--rec-signal` as a vec3, read from the live palette. */
function accentVector(): [number, number, number] {
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--rec-signal")
      .trim();
    const hex = value.replace("#", "");
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
        number,
        number,
        number,
      ];
    }
  } catch {
    /* a DOM without a palette keeps the last accent */
  }
  return [0.29, 0.89, 0.61];
}

export function createBlackHole(canvas: HTMLCanvasElement): BlackHoleHandle {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    }) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return { live: false, setProgress() {}, flash() {}, destroy() {} };

  const context: WebGLRenderingContext = gl;
  const vert = compile(context, context.VERTEX_SHADER, VERT);
  const frag = compile(context, context.FRAGMENT_SHADER, FRAG);
  const program = context.createProgram();
  if (!vert || !frag || !program) {
    return { live: false, setProgress() {}, flash() {}, destroy() {} };
  }
  context.attachShader(program, vert);
  context.attachShader(program, frag);
  context.linkProgram(program);
  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    return { live: false, setProgress() {}, flash() {}, destroy() {} };
  }
  context.useProgram(program);

  const buffer = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, buffer);
  context.bufferData(
    context.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    context.STATIC_DRAW,
  );
  const aPos = context.getAttribLocation(program, "aPos");
  context.enableVertexAttribArray(aPos);
  context.vertexAttribPointer(aPos, 2, context.FLOAT, false, 0, 0);

  const uRes = context.getUniformLocation(program, "uRes");
  const uTime = context.getUniformLocation(program, "uTime");
  const uProgress = context.getUniformLocation(program, "uProgress");
  const uTheme = context.getUniformLocation(program, "uTheme");
  const uAccent = context.getUniformLocation(program, "uAccent");
  const uFlash = context.getUniformLocation(program, "uFlash");

  let progress = 0;
  let frame = 0;
  let visible = document.visibilityState !== "hidden";
  let onScreen = true;
  let theme = "";
  let accent = accentVector();
  let disposed = false;
  let flash = 0;
  let lastNow = 0;

  const resize = () => {
    // The backing store uses the device pixel ratio as the device reports it.
    const scale = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * scale));
    const height = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = (now: number) => {
    if (disposed || !visible || !onScreen) return;
    const elapsed = lastNow ? Math.min(64, now - lastNow) : 16;
    lastNow = now;
    const nextTheme = document.documentElement.dataset.theme ?? "dark";
    if (nextTheme !== theme) {
      theme = nextTheme;
      accent = accentVector();
    }
    flash = Math.max(0, flash - elapsed * 0.0022);
    resize();
    context.uniform2f(uRes, canvas.width, canvas.height);
    context.uniform1f(uTime, now * 0.001);
    context.uniform1f(uProgress, progress);
    context.uniform1f(uTheme, theme === "light" ? 1 : 0);
    context.uniform3f(uAccent, accent[0], accent[1], accent[2]);
    context.uniform1f(uFlash, flash);
    context.drawArrays(context.TRIANGLES, 0, 3);
    frame = requestAnimationFrame(draw);
  };

  const resume = () => {
    if (disposed || frame || !visible || !onScreen) return;
    lastNow = 0;
    frame = requestAnimationFrame(draw);
  };
  const pause = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };
  const onVisibility = () => {
    visible = document.visibilityState !== "hidden";
    if (visible) resume();
    else pause();
  };
  document.addEventListener("visibilitychange", onVisibility);

  let observer: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (onScreen) resume();
        else pause();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);
  }

  resume();

  return {
    live: true,
    setProgress(position: number) {
      progress = position;
    },
    flash() {
      flash = 1;
      if (!frame) resume();
    },
    destroy() {
      disposed = true;
      pause();
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      context.deleteBuffer(buffer);
      context.deleteProgram(program);
      context.deleteShader(vert);
      context.deleteShader(frag);
    },
  };
}
