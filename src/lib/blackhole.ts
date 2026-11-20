/**
 * blackhole — one canvas, one program, one fragment shader.
 *
 * The scene is a descent through orbital shells. A gravitational lens bends a
 * three-layer star field; an accretion disc in the one accent hue turns around
 * a horizon that stays black in both themes. There is no scene graph and no
 * 3D library: one full-screen triangle, a handful of uniforms, and CSS for the
 * dust parallax in front of it.
 *
 * Colour is not owned here. The accent is read from the Phosphor token at run
 * time, so the shader paints the same signal the rest of the document uses.
 *
 * The loop is a guest, not a tenant. It runs only while the document is visible
 * and the canvas is on screen, and it stops for good if WebGL is unavailable —
 * the caller then shows the designed CSS still instead of a blank hero.
 */

export interface BlackHoleHandle {
  /** True when a GL context and a linked program exist. */
  readonly live: boolean;
  /** Continuous chapter position, 0 .. 4. */
  setProgress(position: number): void;
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

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// One sparse star plane. The offset is the parallax: each plane travels at a
// different rate as the reader descends, so depth is geometric, not a fade.
float plane(vec2 uv, float scale, float density, float drift) {
  vec2 g = uv * scale + vec2(drift, -drift * 0.32);
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float seed = hash21(id);
  if (seed < density) return 0.0;
  vec2 jitter = vec2(hash21(id + 1.7), hash21(id + 9.1)) - 0.5;
  float d = length(f - jitter * 0.72);
  float core = smoothstep(0.052, 0.0, d);
  float twinkle = 0.72 + 0.28 * sin(uTime * 1.3 + seed * 60.0);
  return core * twinkle * (0.35 + 0.65 * hash21(id + 4.3));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  float prog = uProgress;

  // The hole drifts a little on its orbit; it never leaves the frame.
  vec2 center = vec2(0.015 * sin(prog * 0.85), 0.012 * cos(prog * 0.62));
  vec2 d = uv - center;
  float r = length(d);
  float R = 0.108 + 0.010 * sin(prog * 1.05);

  // Lensing. Sample coordinates are pushed outward near the mass, so the
  // background bends around the horizon instead of being painted over it.
  float bend = 0.00042 / (r * r + 0.0045);
  vec2 lensed = uv + (d / max(r, 0.0001)) * bend;

  float s1 = plane(lensed, 13.0, 0.84, prog * 0.055);
  float s2 = plane(lensed, 24.0, 0.90, prog * 0.115 + 4.0);
  float s3 = plane(lensed, 42.0, 0.94, prog * 0.205 + 11.0);
  float star = s1 * 0.52 + s2 * 0.34 + s3 * 0.23;

  // Two skies, authored separately. Light is a bright field, not an inverted
  // dark; the hole keeps its own shadow in both.
  vec3 sky = mix(vec3(0.014, 0.020, 0.020), vec3(0.885, 0.915, 0.880), uTheme);
  vec3 starTint = mix(vec3(0.86, 0.92, 0.89), vec3(0.19, 0.25, 0.21), uTheme);
  vec3 col = sky + star * starTint * mix(0.95, 0.62, uTheme);

  // Gravitational shadow: a dark well around the hole that holds the readout
  // legible in both skies and gives the disc something to glow against.
  float shadow = 1.0 - smoothstep(R * 0.98, R * 2.5, r);
  col = mix(col, vec3(0.0), shadow * mix(0.90, 0.96, uTheme));

  // Accretion disc — a tilted ellipse. One hue, the accent, and nothing else
  // on the page is this saturated.
  float tilt = -0.38 + 0.09 * sin(prog * 0.75);
  mat2 rot = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt));
  vec2 e = rot * d;
  vec2 discP = vec2(e.x, e.y * 3.05);
  float rd = length(discP);
  float inner = R * 1.12;
  float outer = R * (2.85 + 0.10 * sin(prog * 0.9));
  float ring = smoothstep(inner, inner + 0.014, rd) *
               (1.0 - smoothstep(outer - 0.055, outer, rd));
  float theta = atan(discP.y, discP.x);
  float swirl = 0.5 + 0.5 * sin(theta * 8.0 - t * 1.15 + rd * 38.0);
  float grain = hash21(vec2(floor(theta * 26.0 + t * 0.7), floor(rd * 70.0)));
  float doppler = 0.55 + 0.75 * smoothstep(-1.0, 1.0, d.x / max(r, 0.0001));
  float disc = ring * (0.30 + 0.55 * swirl + 0.24 * grain) * doppler;

  // Photon ring: the thin rim where light cannot escape.
  float photon = smoothstep(0.011, 0.0, abs(r - R * 1.045)) * 0.85;

  // Far half of the disc sits behind the hole, near half in front of it.
  float front = step(0.0, e.y);
  col += uAccent * (disc * mix(0.42, 1.0, front) + photon);

  // The event horizon is black in both themes. Non-negotiable.
  float horizon = 1.0 - smoothstep(R - 0.003, R + 0.002, r);
  col = mix(col, vec3(0.0), horizon);

  // A quiet vignette keeps the corners calm behind the type.
  col *= 1.0 - 0.22 * smoothstep(0.22, 0.78, length(uv));
  gl_FragColor = vec4(col, 1.0);
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
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    }) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) return { live: false, setProgress() {}, destroy() {} };

  const context: WebGLRenderingContext = gl;
  const vert = compile(context, context.VERTEX_SHADER, VERT);
  const frag = compile(context, context.FRAGMENT_SHADER, FRAG);
  const program = context.createProgram();
  if (!vert || !frag || !program) {
    return { live: false, setProgress() {}, destroy() {} };
  }
  context.attachShader(program, vert);
  context.attachShader(program, frag);
  context.linkProgram(program);
  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    return { live: false, setProgress() {}, destroy() {} };
  }
  context.useProgram(program);

  // One triangle covers the clip volume; two triangles would be a second draw.
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

  let progress = 0;
  let frame = 0;
  let visible = document.visibilityState !== "hidden";
  let onScreen = true;
  let theme = "";
  let accent = accentVector();
  let disposed = false;

  const resize = () => {
    // Cap the backing store at 1x: the shader is cheap, but a retina buffer is
    // four times the fragments for no visible gain on a field of points.
    const scale = 1;
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
    const nextTheme = document.documentElement.dataset.theme ?? "dark";
    if (nextTheme !== theme) {
      theme = nextTheme;
      accent = accentVector();
    }
    resize();
    context.uniform2f(uRes, canvas.width, canvas.height);
    context.uniform1f(uTime, now * 0.001);
    context.uniform1f(uProgress, progress);
    context.uniform1f(uTheme, theme === "light" ? 1 : 0);
    context.uniform3f(uAccent, accent[0], accent[1], accent[2]);
    context.drawArrays(context.TRIANGLES, 0, 3);
    frame = requestAnimationFrame(draw);
  };

  const resume = () => {
    if (disposed || frame || !visible || !onScreen) return;
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
