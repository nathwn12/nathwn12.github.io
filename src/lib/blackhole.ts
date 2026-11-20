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

/**
 * One geometry owner. The fragment shader draws the horizon from the uv
 * values here, and the DOM figure is positioned from the CSS-pixel values
 * here. No second centre and no decorative ring can drift away from it.
 */
const GEO = {
  narrowAt: 900,
  cxDesktop: 0.46,
  cxNarrow: 0.0,
  cyDesktop: 0.02,
  cyNarrow: -0.026,
  rDesktop: 0.1,
  rNarrow: 0.066,
  drift: 0.01,
  driftRate: 1.05,
} as const;

export interface HorizonGeometry {
  /** Centre in CSS pixels, viewport top-left origin. */
  cx: number;
  cy: number;
  /** Live event-horizon radius in CSS pixels. */
  radius: number;
  /** Radius without progress drift, for sizing so the figure never overflows. */
  baseRadius: number;
  /** Centre and radius in the shader's height-normalised uv space. */
  ux: number;
  uy: number;
  ur: number;
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function horizonGeometry(
  cssWidth: number,
  cssHeight: number,
  progress: number,
): HorizonGeometry {
  const narrow = cssWidth <= GEO.narrowAt ? 1 : 0;
  const ux = mix(GEO.cxDesktop, GEO.cxNarrow, narrow);
  const uy = mix(GEO.cyDesktop, GEO.cyNarrow, narrow);
  const ur =
    mix(GEO.rDesktop, GEO.rNarrow, narrow) +
    GEO.drift * Math.sin(progress * GEO.driftRate);
  return {
    cx: cssWidth / 2 + ux * cssHeight,
    cy: cssHeight / 2 - uy * cssHeight,
    radius: ur * cssHeight,
    baseRadius: mix(GEO.rDesktop, GEO.rNarrow, narrow) * cssHeight,
    ux,
    uy,
    ur,
  };
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
uniform vec3 uGround;
uniform float uFlash;
uniform vec2 uCenter;
uniform float uRadius;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Three octaves of value noise. Cost is bounded; the shape is not downgraded
// by adaptive quality, only the backing-store scale is.
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = p * 2.07 + vec2(13.1, 7.3);
    a *= 0.5;
  }
  return v;
}

// One sparse star plane. Drift is parallax; soft is depth-of-field blur.
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

// Hard inner edge, short bright core, controlled outer falloff.
float ringLine(float x) {
  return smoothstep(0.0, 0.0018, x) * (1.0 - smoothstep(0.0018, 0.0065, x));
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  float prog = uProgress;

  // The horizon is owned by horizonGeometry() in TypeScript. The DOM figure
  // reads the same numbers, so the numeral can never drift off the shadow.
  vec2 d = uv - uCenter;
  float r = length(d);
  float R = uRadius;
  vec2 dir = d / max(r, 0.0001);

  // Point-mass lens equation. Near the hole the source plane is pulled inward,
  // so background stars arc into an Einstein ring and the far side of the disc
  // lifts over the shadow instead of sitting flat.
  float theta2 = R * R * 1.18;
  vec2 src = d - dir * (theta2 / max(r, 0.012));
  float near = 1.0 - smoothstep(R * 1.2, R * 4.5, r);

  float s0 = plane(uCenter + src, 16.0, 0.72, prog * 0.055, 0.000) * 0.55;
  float s1 = plane(uCenter + src, 31.0, 0.82, prog * 0.130 + 4.0, 0.008) * 0.42;
  float s2 = plane(uCenter + src * 0.72 + dir * 0.03, 53.0, 0.88, prog * 0.210 + 9.0, 0.018) * 0.30;
  // Smear the far field along the tangential direction at the lensing radius.
  vec2 tang = vec2(-dir.y, dir.x);
  float arcZone = exp(-abs(r - R * 1.22) * (6.0 / R));
  vec2 smear = tang * R * 0.020 * arcZone;
  float s3 = plane(uCenter + src + smear, 22.0, 0.76, prog * 0.090 + 2.0, 0.009) * 0.34;
  float star = s0 + s1 + s2 + s3;
  vec3 starTint = mix(vec3(0.92, 0.96, 0.94), vec3(0.18, 0.24, 0.21), uTheme);
  vec3 light = star * starTint * mix(1.65, 1.10, uTheme);

  // Lensed background light forms its own faint ring. It is never accent-tinted.
  float einstein = exp(-abs(r - R * 1.13) * (95.0 / R) * 0.12) * (0.16 + 0.26 * near);
  light += starTint * einstein;
  float ang = atan(dir.y, dir.x);
  float arcNoise = vnoise(vec2(ang * 2.5 + t * 0.02, 3.7));
  float arcs = smoothstep(0.52, 0.82, arcNoise) * exp(-abs(r - R * 1.20) * (12.0 / R)) * near;
  light += starTint * arcs * 0.42;

  // Thin inclined disc in the deflected source plane. The inclination makes the
  // band thin; the deflection makes its far side arc above and below the hole.
  float tilt = -0.20 + 0.06 * sin(prog * 0.7);
  float ct = cos(tilt), st = sin(tilt);
  vec2 sr = mat2(ct, st, -st, ct) * src;
  vec2 dp = vec2(sr.x, sr.y / 0.26);
  float rd = length(dp);
  float inner = R * 1.25;
  float outer = R * (2.60 + 0.06 * sin(prog * 0.8));
  float outerFade = 1.0 - smoothstep(outer - R * 0.45, outer, rd);
  float band = smoothstep(inner, inner + R * 0.05, rd) * outerFade;

  // Turbulent filaments. A domain warp bends the Keplerian shear into patches,
  // so the gas never resolves into concentric contour hairlines.
  float orbit = t * 0.42 / pow(max(rd / R, 0.5), 1.5);
  float co = cos(orbit), so = sin(orbit);
  vec2 spun = mat2(co, so, -so, co) * dp;
  vec2 warp = vec2(
    vnoise(spun * (2.2 / R) + vec2(5.2, 1.3)),
    vnoise(spun * (2.2 / R) + vec2(9.7, 4.1))
  ) - 0.5;
  vec2 flow = spun + warp * R * 0.55;
  float fil = fbm(flow * (9.0 / R) + vec2(2.3, 7.1));
  float texture = (0.26 + 0.85 * fil * fil) * (0.35 + 0.65 * outerFade);

  // Relativistic beaming: a power curve on the line-of-sight velocity. The
  // approaching side is bright and cool; the receding side is dim and warm.
  // The cap keeps filaments readable after ACES in the light sky.
  float vlos = clamp(-dp.x / max(rd, 0.001), -1.0, 1.0);
  float beam = pow(clamp(1.0 + 0.40 * vlos, 0.14, 1.30), 1.9);
  float approach = smoothstep(0.0, 1.0, vlos);

  // Temperature: white-hot inner, amber mid, phosphor green only as the outer
  // gas tint. The accent never paints the whole disc.
  float temp = clamp((outer - rd) / max(outer - inner, 0.001), 0.0, 1.0);
  vec3 discColor = mix(uAccent, vec3(1.0, 0.56, 0.22), smoothstep(0.05, 0.55, temp));
  discColor = mix(discColor, vec3(1.0, 0.97, 0.90), smoothstep(0.55, 1.0, temp));
  discColor = mix(discColor, vec3(0.78, 0.88, 1.0), approach * 0.30);

  float disc = band * texture * beam;
  float tight = exp(-abs(rd - (inner + outer) * 0.5) * (9.0 / R)) * 0.09 * band;
  light += discColor * (disc + tight) * mix(1.0, 0.48, uTheme);

  // Photon ring: a hard inner edge and a thin near-white core.
  float ringR = R * 1.05;
  float dr = r - ringR;
  vec3 split = vec3(ringLine(dr - 0.0020), ringLine(dr), ringLine(dr + 0.0020));
  vec3 ringLight = mix(vec3(dot(split, vec3(0.3333))), split, 0.24) * 1.50;
  light += ringLight;
  light += vec3(0.90, 0.95, 1.0) * exp(-abs(dr) * (80.0 / R)) * 0.07;

  // Every bright edge feathers before the viewport boundary.
  vec2 edge = min(gl_FragCoord.xy, uRes - gl_FragCoord.xy) / min(uRes.x, uRes.y);
  float feather = smoothstep(0.0, 0.06, edge.x) * smoothstep(0.0, 0.06, edge.y);
  light *= feather;

  // The sky is never tone-mapped; the live field and the CSS still share it.
  float shadow = 1.0 - smoothstep(R * 0.96, R * 2.30, r);
  vec3 sky = uGround * (1.0 - shadow * mix(0.92, 0.97, uTheme));
  // On a light sky gas reads by absorption. Darken under the disc first, then
  // add the emissive cusp, so the form survives the highlight shoulder.
  sky *= 1.0 - uTheme * 0.62 * clamp(disc * 0.9 + tight, 0.0, 1.0);
  vec3 col = sky + aces(light * mix(1.06, 0.92, uTheme));
  // A photographic shoulder. The light sky is near white, so an additive
  // highlight would merge with it; compress into 0.80..0.96 instead.
  if (uTheme > 0.5) {
    vec3 over = max(col - vec3(0.80), vec3(0.0));
    col = vec3(0.80) + vec3(0.16) * (vec3(1.0) - exp(-over / 0.16));
  }
  // The event horizon stays black in both skies.
  float horizon = 1.0 - smoothstep(R - 0.002, R + 0.001, r);
  col = mix(col, vec3(0.0), horizon);
  // The near side passes in front of the lower face. It is drawn after the
  // shadow so the lens has depth, not a flat hole cut out of a ribbon.
  float nearLane = exp(-abs(d.y + R * 0.32) * (26.0 / R));
  float nearSpan = (1.0 - smoothstep(R * 1.1, R * 2.7, abs(d.x)))
                 * (1.0 - smoothstep(-R * 0.04, R * 0.14, d.y));
  float nearTex = vnoise(vec2(d.x * (16.0 / R), d.y * (34.0 / R)) + vec2(t * 0.15, 0.0));
  float nearCross = nearLane * nearSpan * (0.35 + 0.65 * nearTex) * feather;
  col += discColor * nearCross * mix(0.30, 0.14, uTheme);
  col += uAccent * uFlash * 0.55 + vec3(uFlash * 0.22);
  col *= 1.0 - 0.28 * smoothstep(0.22, 0.80, length(uv));
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

/** A CSS hex custom property as a vec3. */
function tokenVector(name: string, fallback: [number, number, number]): [number, number, number] {
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
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
    /* a DOM without a palette keeps the fallback */
  }
  return fallback;
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
      preserveDrawingBuffer: false,
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
  const uGround = context.getUniformLocation(program, "uGround");
  const uFlash = context.getUniformLocation(program, "uFlash");
  const uCenter = context.getUniformLocation(program, "uCenter");
  const uRadius = context.getUniformLocation(program, "uRadius");

  let progress = 0;
  let frame = 0;
  let visible = document.visibilityState !== "hidden";
  let onScreen = true;
  let theme = "";
  let accent = tokenVector("--rec-signal", [0.29, 0.89, 0.61]);
  let ground = tokenVector("--rec-ground", [0.039, 0.051, 0.043]);
  let disposed = false;
  let flash = 0;
  let lastNow = 0;

  // Canvas size is measured on mount and on resize only. The draw loop never
  // reads clientWidth or clientHeight, so scrolling cannot force layout.
  let cssWidth = 1;
  let cssHeight = 1;
  let dpr = 1;
  const measureCanvas = () => {
    cssWidth = Math.max(1, canvas.clientWidth);
    cssHeight = Math.max(1, canvas.clientHeight);
    dpr = Math.max(1, window.devicePixelRatio || 1);
  };
  measureCanvas();
  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      measureCanvas();
      resize();
    });
    resizeObserver.observe(canvas);
  }

  // Adaptive quality changes only the field's resolution, never its shape.
  // It starts at the device pixel ratio and steps down when the measured frame
  // time cannot hold, then steps back up with hysteresis.
  let quality = 1;
  let ema = 16;
  let slowFrames = 0;
  let fastFrames = 0;
  let cooldown = 0;
  let pendingResize = false;
  let lastScroll = 0;
  let warmup = 60;
  const qualityState = { scale: 1, ema: 16 };
  const publishQuality = () => {
    const target = window as Window & { __stageQuality?: typeof qualityState };
    target.__stageQuality = qualityState;
  };
  publishQuality();

  // The centre and the layout radius are width-only. Progress drift stays in
  // the shader, so these properties change on resize, never while scrolling.
  let lastGeometry = "";
  const root = document.documentElement;
  const publishGeometry = (geometry: HorizonGeometry) => {
    (window as Window & { __bhGeometry?: HorizonGeometry }).__bhGeometry =
      geometry;
    const key = `${geometry.cx.toFixed(2)}|${geometry.cy.toFixed(2)}|${geometry.baseRadius.toFixed(2)}`;
    if (key === lastGeometry) return;
    lastGeometry = key;
    root.style.setProperty("--bh-cx", `${geometry.cx.toFixed(2)}px`);
    root.style.setProperty("--bh-cy", `${geometry.cy.toFixed(2)}px`);
    root.style.setProperty("--bh-r", `${geometry.baseRadius.toFixed(2)}px`);
  };

  const resize = () => {
    const width = Math.max(1, Math.round(cssWidth * dpr * quality));
    const height = Math.max(1, Math.round(cssHeight * dpr * quality));
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
    ema = ema * 0.9 + elapsed * 0.1;
    if (cooldown > 0) cooldown -= 1;
    // Ignore the first second of load spikes so a capable GPU is not downscaled
    // for a start-up frame. After that, react quickly and then cool down.
    if (warmup > 0) {
      warmup -= 1;
    } else if (cooldown === 0 && ema > 19) {
      fastFrames = 0;
      slowFrames += 1;
      if (slowFrames > 12 && quality > 0.5) {
        quality = Math.max(0.5, quality - 0.15);
        slowFrames = 0;
        cooldown = 60;
        pendingResize = true;
      }
    } else if (cooldown === 0 && ema < 14) {
      slowFrames = 0;
      fastFrames += 1;
      if (fastFrames > 240 && quality < 1) {
        quality = Math.min(1, quality + 0.1);
        fastFrames = 0;
        cooldown = 90;
        pendingResize = true;
      }
    }
    qualityState.scale = Number(quality.toFixed(2));
    qualityState.ema = Number(ema.toFixed(1));
    // A reallocation during a scroll is a visible hitch. Wait for the scroll to
    // settle before applying the new scale.
    if (pendingResize && now - lastScroll > 250) {
      pendingResize = false;
      resize();
    }
    const nextTheme = document.documentElement.dataset.theme ?? "dark";
    if (nextTheme !== theme) {
      theme = nextTheme;
      accent = tokenVector("--rec-signal", [0.29, 0.89, 0.61]);
      ground = tokenVector("--rec-ground", [0.039, 0.051, 0.043]);
    }
    flash = Math.max(0, flash - elapsed * 0.0022);
    resize();
    const geometry = horizonGeometry(cssWidth, cssHeight, progress);
    publishGeometry(geometry);
    context.uniform2f(uRes, canvas.width, canvas.height);
    context.uniform2f(uCenter, geometry.ux, geometry.uy);
    context.uniform1f(uRadius, geometry.ur);
    context.uniform1f(uTime, now * 0.001);
    context.uniform1f(uProgress, progress);
    context.uniform1f(uTheme, theme === "light" ? 1 : 0);
    context.uniform3f(uAccent, accent[0], accent[1], accent[2]);
    context.uniform3f(uGround, ground[0], ground[1], ground[2]);
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
  const onScroll = () => {
    lastScroll = performance.now();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
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

  // Publish before the canvas reports live, so the figure never appears at a
  // CSS fallback position and then jumps to the shader centre.
  publishGeometry(horizonGeometry(cssWidth, cssHeight, progress));
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
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      resizeObserver?.disconnect();
      context.deleteBuffer(buffer);
      context.deleteProgram(program);
      context.deleteShader(vert);
      context.deleteShader(frag);
    },
  };
}
