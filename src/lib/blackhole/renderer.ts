/**
 * WebGL2 renderer for the event-horizon shader. Ported from the MIT viewer;
 * see THIRD-PARTY-NOTICES.md. The passes are the viewer's: geodesic map (three
 * MRT float targets), plasma emission (half-float HDR), four separable bloom
 * levels, and the tone-mapping composite to the canvas.
 */

import {
  BLUR_SOURCE,
  COMPOSITE_SOURCE,
  EMISSION_SOURCE,
  GEOMETRY_SOURCE,
  OPTICS,
  VERTEX_SOURCE,
} from "./shaders";

export type Quality = "low" | "medium" | "high" | "ultra";

/** The viewer's render-size ladder, read as the render height in CSS px. */
export const QUALITY_HEIGHT: Record<Quality, number> = {
  low: 720,
  medium: 960,
  high: 1440,
  ultra: 1920,
};

export const MAX_DPR = 2;

type Program = {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
};

type Target = { texture: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("blackhole: cannot create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`blackhole: ${log ?? "shader compile failed"}`);
  }
  return shader;
}

function makeProgram(gl: WebGL2RenderingContext, fragmentSource: string): Program {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("blackhole: cannot create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "in_pos");
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`blackhole: ${log ?? "program link failed"}`);
  }
  return { program, uniforms: new Map() };
}

export class BlackHoleRenderer {
  readonly gl: WebGL2RenderingContext;

  private canvas: HTMLCanvasElement;
  private programs: Record<string, Program>;
  private vao: WebGLVertexArrayObject | null;
  private buffer: WebGLBuffer | null;
  private textures: WebGLTexture[] = [];
  private framebuffers: WebGLFramebuffer[] = [];
  private disposed = false;

  private renderW = 0;
  private renderH = 0;
  private quality: Quality;

  private maps: WebGLTexture[] = [];
  private hdr: Target | null = null;
  private blooms: Array<[Target, Target]> = [];

  constructor(canvas: HTMLCanvasElement, quality: Quality = "medium") {
    this.canvas = canvas;
    this.quality = quality;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("blackhole: WebGL2 unavailable");
    this.gl = gl;
    if (!gl.getExtension("EXT_color_buffer_float")) {
      throw new Error("blackhole: float framebuffers unavailable");
    }
    gl.getExtension("OES_texture_float_linear");

    this.programs = {
      geometry: makeProgram(gl, GEOMETRY_SOURCE),
      emission: makeProgram(gl, EMISSION_SOURCE),
      blur: makeProgram(gl, BLUR_SOURCE),
      composite: makeProgram(gl, COMPOSITE_SOURCE),
    };

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }

  get size(): { w: number; h: number } {
    return { w: this.renderW, h: this.renderH };
  }

  /** The viewer's quality ladder, capped by the device pixel ratio. */
  resize(cssW: number, cssH: number, dpr: number): void {
    if (this.disposed || cssW <= 0 || cssH <= 0) return;
    const cap = QUALITY_HEIGHT[this.quality];
    const h = Math.min(cap, Math.round(cssH * Math.min(dpr, MAX_DPR)));
    const w = Math.max(2, Math.round(h * (cssW / cssH)));
    if (w === this.renderW && h === this.renderH) return;
    this.renderW = w;
    this.renderH = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.allocate();
  }

  setQuality(quality: Quality): void {
    this.quality = quality;
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    this.renderW = 0;
    this.resize(width || this.canvas.clientWidth, height || this.canvas.clientHeight, dpr);
  }

  private texture(w: number, h: number, internal: number, type: number, linear: boolean): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("blackhole: cannot create texture");
    this.textures.push(texture);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const filter = linear ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, null);
    return texture;
  }

  private framebuffer(attachments: WebGLTexture[]): WebGLFramebuffer {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("blackhole: cannot create framebuffer");
    this.framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const draw: number[] = [];
    attachments.forEach((texture, i) => {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
      draw.push(gl.COLOR_ATTACHMENT0 + i);
    });
    gl.drawBuffers(draw);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("blackhole: incomplete float framebuffer");
    }
    return fbo;
  }

  private target(w: number, h: number): Target {
    const texture = this.texture(w, h, this.gl.RGBA16F, this.gl.HALF_FLOAT, true);
    return { texture, fbo: this.framebuffer([texture]), w, h };
  }

  private allocate(): void {
    const gl = this.gl;
    for (const texture of this.textures) gl.deleteTexture(texture);
    for (const fbo of this.framebuffers) gl.deleteFramebuffer(fbo);
    this.textures = [];
    this.framebuffers = [];

    const w = this.renderW;
    const h = this.renderH;
    this.maps = Array.from({ length: 3 }, () => this.texture(w, h, gl.RGBA32F, gl.FLOAT, false));
    this.mapFbo = this.framebuffer(this.maps);
    this.hdr = this.target(w, h);
    this.blooms = [2, 4, 12, 24].map((divisor) => {
      const bw = Math.max(8, Math.floor(w / divisor));
      const bh = Math.max(8, Math.floor(h / divisor));
      return [this.target(bw, bh), this.target(bw, bh)] as [Target, Target];
    });
    this.geometryDrawn = false;
  }

  private mapFbo: WebGLFramebuffer | null = null;

  private loc(program: Program, name: string): WebGLUniformLocation | null {
    if (!program.uniforms.has(name)) {
      program.uniforms.set(name, this.gl.getUniformLocation(program.program, name));
    }
    return program.uniforms.get(name) ?? null;
  }

  private f(program: Program, name: string, value: number): void {
    this.gl.uniform1f(this.loc(program, name), value);
  }

  private v2(program: Program, name: string, x: number, y: number): void {
    this.gl.uniform2f(this.loc(program, name), x, y);
  }

  private tex(program: Program, name: string, unit: number, texture: WebGLTexture): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.loc(program, name), unit);
  }

  private draw(program: Program, fbo: WebGLFramebuffer | null, w: number, h: number): void {
    const gl = this.gl;
    gl.useProgram(program.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, w, h);
  }

  private triangle(): void {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  private common(program: Program, time: number): void {
    this.v2(program, "uResolution", this.renderW, this.renderH);
    this.v2(program, "uCenter", OPTICS.center[0], OPTICS.center[1]);
    this.f(program, "uTilt", OPTICS.tilt);
    this.f(program, "uTime", ((time % OPTICS.loopSeconds) + OPTICS.loopSeconds) % OPTICS.loopSeconds);
  }

  /** The geometry pass is static; it only runs when the render targets change. */
  private drawGeometry(): void {
    const gl = this.gl;
    const program = this.programs.geometry;
    this.draw(program, this.mapFbo, this.renderW, this.renderH);
    this.common(program, 0);
    this.f(program, "uScale", OPTICS.scale);
    this.f(program, "uInclination", OPTICS.inclination);
    this.f(program, "uInner", OPTICS.inner);
    this.triangle();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private geometryDrawn = false;

  render(timeSeconds: number): void {
    if (this.disposed || !this.hdr || !this.mapFbo) return;
    if (!this.geometryDrawn) {
      this.drawGeometry();
      this.geometryDrawn = true;
    }

    let program = this.programs.emission;
    this.draw(program, this.hdr.fbo, this.renderW, this.renderH);
    this.common(program, timeSeconds);
    this.maps.forEach((texture, i) => this.tex(program, `uMap${i}`, i, texture));
    this.triangle();

    program = this.programs.blur;
    let source = this.hdr.texture;
    for (const [horizontal, vertical] of this.blooms) {
      this.draw(program, horizontal.fbo, horizontal.w, horizontal.h);
      this.v2(program, "uResolution", horizontal.w, horizontal.h);
      this.v2(program, "uDirection", 1 / horizontal.w, 0);
      this.tex(program, "uSource", 0, source);
      this.triangle();

      this.draw(program, vertical.fbo, vertical.w, vertical.h);
      this.v2(program, "uResolution", vertical.w, vertical.h);
      this.v2(program, "uDirection", 0, 1 / vertical.h);
      this.tex(program, "uSource", 0, horizontal.texture);
      this.triangle();
      source = vertical.texture;
    }

    program = this.programs.composite;
    this.draw(program, null, this.renderW, this.renderH);
    this.common(program, timeSeconds);
    this.tex(program, "uEmission", 0, this.hdr.texture);
    this.blooms.forEach((pair, i) => this.tex(program, `uBloom${i}`, i + 1, pair[1].texture));
    this.triangle();
  }

  /** After a context restore the caller constructs a fresh renderer. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    for (const texture of this.textures) gl.deleteTexture(texture);
    for (const fbo of this.framebuffers) gl.deleteFramebuffer(fbo);
    for (const { program } of Object.values(this.programs)) gl.deleteProgram(program);
    if (this.buffer) gl.deleteBuffer(this.buffer);
    if (this.vao) gl.deleteVertexArray(this.vao);
    this.textures = [];
    this.framebuffers = [];
  }
}
