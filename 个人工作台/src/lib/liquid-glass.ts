/* ═══════════════════════════════════════
   Liquid Glass — 直接照搬 看板/js/liquid-glass.js
   仅做 JS→TS 翻译，不做任何逻辑改动。
   原始实现：适配 liquidglass-main
   ═══════════════════════════════════════ */

const BLUR_ITERATIONS = 6;
const SHADOW_PAD = 20;

const DEFAULTS = {
  blurAmount: 0.0,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0.0,
  fresnel: 1.0,
  distortion: 0.0,
  cornerRadius: 24,  // 从 65 改为 24，避免圆角过大导致内容太靠边
  zRadius: 40,
  opacity: 1.0,
  saturation: 0.0,
  tintStrength: 0.0,
  brightness: 0.0,
  shadowOpacity: 0.30,
  shadowSpread: 10,
  shadowOffsetY: 1,
  floating: false,
  button: false,
  bevelMode: 0,
};

/* ── Shaders ── */
const VS_QUAD = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
	v_uv = a_pos * 0.5 + 0.5;
	gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FS_BLIT = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_scale;
uniform vec2 u_offset;
varying vec2 v_uv;
void main() {
	gl_FragColor = texture2D(u_tex, v_uv * u_scale + u_offset);
}`;

const FS_BLUR = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_dir;
varying vec2 v_uv;
void main() {
	vec4 s  = texture2D(u_tex, v_uv) * 0.227027;
	s += texture2D(u_tex, v_uv + u_dir * 1.0) * 0.194594;
	s += texture2D(u_tex, v_uv - u_dir * 1.0) * 0.194594;
	s += texture2D(u_tex, v_uv + u_dir * 2.0) * 0.121622;
	s += texture2D(u_tex, v_uv - u_dir * 2.0) * 0.121622;
	s += texture2D(u_tex, v_uv + u_dir * 3.0) * 0.054054;
	s += texture2D(u_tex, v_uv - u_dir * 3.0) * 0.054054;
	s += texture2D(u_tex, v_uv + u_dir * 4.0) * 0.016216;
	s += texture2D(u_tex, v_uv - u_dir * 4.0) * 0.016216;
	gl_FragColor = s;
}`;

const VS_GLASS = `
attribute vec2 a_pos;
uniform vec2 u_center;
uniform vec2 u_size;
uniform vec2 u_res;
uniform float u_pad;
varying vec2 v_localPx;
varying vec2 v_screenUV;
void main() {
	vec2 total = u_size + vec2(u_pad * 2.0);
	v_localPx = a_pos * total;
	vec2 px = u_center + a_pos * total;
	v_screenUV = vec2(px.x / u_res.x, 1.0 - px.y / u_res.y);
	vec2 ndc = (px / u_res) * 2.0 - 1.0;
	ndc.y = -ndc.y;
	gl_Position = vec4(ndc, 0.0, 1.0);
}`;

const FS_GLASS = `
precision highp float;
uniform sampler2D u_bgTex;
uniform sampler2D u_blurTex;
uniform vec2 u_size;
uniform float u_radius;
uniform vec2 u_res;
uniform float u_refract;
uniform float u_chroma;
uniform float u_edgeHL;
uniform float u_spec;
uniform float u_fresnel;
uniform float u_distort;
uniform float u_alpha;
uniform float u_sat;
uniform float u_tint;
uniform float u_zRadius;
uniform float u_brightness;
uniform float u_shadowAlpha;
uniform float u_shadowSpread;
uniform float u_shadowOffY;
uniform float u_bevelMode;
varying vec2 v_localPx;
varying vec2 v_screenUV;
float rrSDF(vec2 p, vec2 b, float r) {
	vec2 q = abs(p) - b + vec2(r);
	return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
}
float bevelHeight(float d, float zR) {
	if (d <= 0.0) return 0.0;
	if (d >= zR) return zR;
	return sqrt(d * (2.0 * zR - d));
}
float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
	vec2 half_ = u_size * 0.5;
	float r = min(u_radius, min(half_.x, half_.y));
	float sdf = rrSDF(v_localPx, half_, r);
	if (sdf > 0.0) {
		float sdfShadow = rrSDF(v_localPx - vec2(0.0, u_shadowOffY), half_, r);
		float d = max(sdfShadow - 1.0, 0.0);
		float spread = max(u_shadowSpread, 1.0);
		float falloff = 1.0 / (spread * spread);
		float outerShadow = exp(-d * d * falloff) * 0.65;
		float contactShadow = exp(-d * 0.08 / max(spread * 0.04, 0.01)) * 0.35;
		float shadow = (outerShadow + contactShadow) * u_shadowAlpha;
		gl_FragColor = vec4(0.0, 0.0, 0.0, shadow);
		return;
	}
	float mask = 1.0 - smoothstep(-1.5, 0.5, sdf);
	float maxD = min(half_.x, half_.y);
	float inside = -sdf;
	float edge = smoothstep(maxD * 0.35, 0.0, inside);
	float zR = u_zRadius;
	float e = 2.0;
	float dC = inside;
	float dR = -rrSDF(v_localPx + vec2(e, 0.0), half_, r);
	float dL = -rrSDF(v_localPx - vec2(e, 0.0), half_, r);
	float dU = -rrSDF(v_localPx + vec2(0.0, e), half_, r);
	float dD = -rrSDF(v_localPx - vec2(0.0, e), half_, r);
	float hC = bevelHeight(dC, zR);
	float hR = bevelHeight(dR, zR);
	float hL = bevelHeight(dL, zR);
	float hU = bevelHeight(dU, zR);
	float hD = bevelHeight(dD, zR);
	vec2 hGrad = vec2(hR - hL, hU - hD) / (2.0 * e);
	vec3 N = normalize(vec3(-hGrad, 1.0));
	float depth = smoothstep(0.0, zR, inside);
	vec2 pxToUV = vec2(1.0, -1.0) / u_res;
	float ior = 1.5;
	float refrPow = 1.0 - 1.0 / ior;
	float thickness = hC * 2.0;
	float thickNorm = thickness / max(zR * 2.0, 1.0);
	vec2 refrPx;
	if (u_bevelMode < 0.5) {
		vec2 exitRefr = hGrad * refrPow;
		vec2 entryRefr = hGrad * refrPow;
		vec2 throughRefr = entryRefr * thickNorm * 0.5;
		refrPx = (exitRefr + entryRefr + throughRefr) * u_refract * 30.0;
		vec2 centerDir = -v_localPx / max(half_, vec2(1.0));
		refrPx += centerDir * u_refract * 4.0 * depth;
	} else {
		refrPx = -v_localPx * u_refract * depth * 0.35;
	}
	vec2 refr = refrPx * pxToUV;
	vec2 ns = v_localPx * 0.08;
	vec2 absPxToUV = vec2(1.0) / u_res;
	vec2 micro = (vec2(hash(ns), hash(ns + vec2(37.0))) - 0.5) * u_distort * 4.0 * absPxToUV;
	float caS = u_chroma * 18.0 * (edge * 0.7 + 0.3) * 2.0;
	vec2 caD = N.xy * caS * pxToUV;
	vec2 base = v_screenUV + refr + micro;
	vec3 sharp = vec3(
		texture2D(u_bgTex,  base + caD).r,
		texture2D(u_bgTex,  base).g,
		texture2D(u_bgTex,  base - caD).b
	);
	vec3 blur = vec3(
		texture2D(u_blurTex, base + caD).r,
		texture2D(u_blurTex, base).g,
		texture2D(u_blurTex, base - caD).b
	);
	float edgeMix = (1.0 - edge * 0.15);
	vec3 col = mix(sharp, blur, edgeMix);
	col *= 1.0 + u_brightness;
	float lum = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(vec3(lum), col, 1.0 + u_sat);
	col = mix(col, col * vec3(0.92, 0.95, 1.05), u_tint);
	col *= 1.0 + 0.06 * depth;
	float fres = pow(1.0 - abs(N.z), 4.0) * u_fresnel;
	vec3 V = vec3(0.0, 0.0, 1.0);
	vec3 L1 = normalize(vec3(0.4, 0.7, 1.0));
	vec3 H1 = normalize(L1 + V);
	float sp1 = pow(max(dot(N, H1), 0.0), 90.0);
	vec3 L2 = normalize(vec3(-0.3, -0.5, 1.0));
	vec3 H2 = normalize(L2 + V);
	float sp2 = pow(max(dot(N, H2), 0.0), 50.0) * 0.3;
	vec3 L3 = normalize(vec3(0.1, 0.3, 1.0));
	float spB = pow(max(dot(N, L3), 0.0), 6.0) * 0.1;
	vec3 L4 = normalize(vec3(0.0, 0.9, 0.4));
	vec3 H4 = normalize(L4 + V);
	float sp4 = pow(max(dot(N, H4), 0.0), 120.0) * 0.6;
	float totalSpec = (sp1 + sp2 + spB + sp4) * u_spec;
	float borderWidth = 1.5;
	float innerStroke = smoothstep(-borderWidth - 1.0, -borderWidth, sdf)
	                  * (1.0 - smoothstep(-1.0, 0.0, sdf));
	float topBias = 0.5 + 0.5 * (-v_localPx.y / half_.y);
	innerStroke *= (0.4 + 0.6 * topBias);
	float rim = edge * u_edgeHL * 0.22;
	float innerGlow = smoothstep(5.0, 0.0, -sdf) * u_edgeHL * 0.15;
	float envRefl = (N.y * 0.5 + 0.5) * fres * 0.08;
	vec3 fin = col;
	fin += vec3(totalSpec);
	fin += vec3(rim + innerGlow);
	fin += vec3(innerStroke * u_edgeHL * 0.55);
	fin += vec3(envRefl);
	fin = mix(fin, vec3(1.0), fres * 0.2);
	gl_FragColor = vec4(fin, mask * u_alpha);
}`;

/* ── GlassRenderer ── */
class GlassRenderer {
  canvas: HTMLCanvasElement;
  cropCanvas: HTMLCanvasElement;
  cropCtx: CanvasRenderingContext2D;
  gl: WebGLRenderingContext;
  fboCache: Map<string, { bg: any; blurA: any; blurB: any }>;
  activeFBOs: any;
  bgTex: WebGLTexture | null;
  width: number;
  height: number;
  contextLost: boolean;
  blitP!: WebGLProgram;
  blitU: any;
  blurP!: WebGLProgram;
  blurU: any;
  glassP!: WebGLProgram;
  glassU: any;
  quadBuf!: WebGLBuffer;
  panelBuf!: WebGLBuffer;
  _onContextLost: (e: Event) => void;
  _onContextRestored: () => void;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'none';
    document.body.appendChild(this.canvas);
    this.cropCanvas = document.createElement('canvas');
    this.cropCtx = this.cropCanvas.getContext('2d')!;

    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('LiquidGlass: WebGL not supported');
    this.gl = gl;

    this.fboCache = new Map();
    this.activeFBOs = null;
    this.bgTex = null;
    this.width = 0;
    this.height = 0;
    this.contextLost = false;

    this._onContextLost = (e) => {
      e.preventDefault();
      this.contextLost = true;
    };
    this._onContextRestored = () => {
      this.contextLost = false;
      this._initPrograms();
      this._initBuffers();
      for (const fboSet of this.fboCache.values()) this._freeFBOSet(fboSet);
      this.fboCache.clear();
      this.activeFBOs = null;
      this.bgTex = null;
    };
    this.canvas.addEventListener('webglcontextlost', this._onContextLost);
    this.canvas.addEventListener('webglcontextrestored', this._onContextRestored);

    this._initPrograms();
    this._initBuffers();
  }

  _initPrograms() {
    this.blitP = this._link(VS_QUAD, FS_BLIT);
    this.blitU = this._uloc(this.blitP, ['u_tex', 'u_scale', 'u_offset']);
    this.blurP = this._link(VS_QUAD, FS_BLUR);
    this.blurU = this._uloc(this.blurP, ['u_tex', 'u_dir']);
    this.glassP = this._link(VS_GLASS, FS_GLASS);
    this.glassU = this._uloc(this.glassP, [
      'u_bgTex', 'u_blurTex', 'u_center', 'u_size', 'u_radius',
      'u_res', 'u_pad', 'u_refract', 'u_chroma',
      'u_edgeHL', 'u_spec', 'u_fresnel', 'u_distort', 'u_alpha',
      'u_sat', 'u_tint', 'u_zRadius', 'u_brightness',
      'u_shadowAlpha', 'u_shadowSpread', 'u_shadowOffY',
      'u_bevelMode',
    ]);
  }

  _initBuffers() {
    const gl = this.gl;
    this.quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.panelBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.panelBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.5, -.5, .5, -.5, -.5, .5, .5, .5]), gl.STATIC_DRAW);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    for (const fboSet of this.fboCache.values()) this._freeFBOSet(fboSet);
    this.fboCache.clear();
    this.activeFBOs = null;
    this.canvas.width = 0;
    this.canvas.height = 0;
  }

  uploadAndBlur(sourceCanvas: HTMLCanvasElement, sourceX: number, sourceY: number, width: number, height: number, blurAmount: number) {
    if (this.contextLost) return;
    const gl = this.gl;
    if (!this._setActiveSize(width, height)) return;
    const W = this.width;
    const H = this.height;
    const fboSet = this.activeFBOs;

    this.cropCanvas.width = W;
    this.cropCanvas.height = H;
    this.cropCtx.clearRect(0, 0, W, H);
    this.cropCtx.drawImage(sourceCanvas, -sourceX, -sourceY);

    if (!this.bgTex) this.bgTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.bgTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.cropCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fboSet.bg.fbo);
    gl.viewport(0, 0, W, H);
    gl.useProgram(this.blitP);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bgTex);
    gl.uniform1i(this.blitU.u_tex, 0);
    gl.uniform2f(this.blitU.u_scale, 1, 1);
    gl.uniform2f(this.blitU.u_offset, 0, 0);
    this._drawQuad(this.blitP, this.quadBuf);

    const bw = fboSet.blurA.w;
    const bh = fboSet.blurA.h;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboSet.blurA.fbo);
    gl.viewport(0, 0, bw, bh);
    gl.bindTexture(gl.TEXTURE_2D, fboSet.bg.tex);
    this._drawQuad(this.blitP, this.quadBuf);

    if (blurAmount > 0) {
      const spread = blurAmount * 2.5;
      gl.useProgram(this.blurP);
      gl.uniform1i(this.blurU.u_tex, 0);
      for (let i = 0; i < BLUR_ITERATIONS; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboSet.blurB.fbo);
        gl.viewport(0, 0, bw, bh);
        gl.bindTexture(gl.TEXTURE_2D, fboSet.blurA.tex);
        gl.uniform2f(this.blurU.u_dir, spread / bw, 0);
        this._drawQuad(this.blurP, this.quadBuf);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fboSet.blurA.fbo);
        gl.bindTexture(gl.TEXTURE_2D, fboSet.blurB.tex);
        gl.uniform2f(this.blurU.u_dir, 0, spread / bh);
        this._drawQuad(this.blurP, this.quadBuf);
      }
    }
  }

  renderGlassPanel(config: any, elW: number, elH: number, dpr: number) {
    if (this.contextLost) return;
    const gl = this.gl;
    const W = this.width;
    const H = this.height;
    const fboSet = this.activeFBOs;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.glassP);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboSet.bg.tex);
    gl.uniform1i(this.glassU.u_bgTex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fboSet.blurA.tex);
    gl.uniform1i(this.glassU.u_blurTex, 1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, this.canvas.height - H, W, H);
    gl.uniform2f(this.glassU.u_res, W, H);
    gl.uniform2f(this.glassU.u_center, W * 0.5, H * 0.5);
    gl.uniform2f(this.glassU.u_size, elW * dpr, elH * dpr);
    gl.uniform1f(this.glassU.u_radius, config.cornerRadius * dpr);
    gl.uniform1f(this.glassU.u_pad, SHADOW_PAD * dpr);
    gl.uniform1f(this.glassU.u_refract, config.refraction);
    gl.uniform1f(this.glassU.u_chroma, config.chromAberration);
    gl.uniform1f(this.glassU.u_edgeHL, config.edgeHighlight);
    gl.uniform1f(this.glassU.u_spec, config.specular);
    gl.uniform1f(this.glassU.u_fresnel, config.fresnel);
    gl.uniform1f(this.glassU.u_distort, config.distortion);
    gl.uniform1f(this.glassU.u_alpha, config.opacity);
    gl.uniform1f(this.glassU.u_sat, config.saturation);
    gl.uniform1f(this.glassU.u_tint, config.tintStrength);
    gl.uniform1f(this.glassU.u_zRadius, config.zRadius * dpr);
    gl.uniform1f(this.glassU.u_brightness, config.brightness);
    gl.uniform1f(this.glassU.u_shadowAlpha, config.shadowOpacity);
    gl.uniform1f(this.glassU.u_shadowSpread, config.shadowSpread * dpr);
    gl.uniform1f(this.glassU.u_shadowOffY, config.shadowOffsetY * dpr);
    gl.uniform1f(this.glassU.u_bevelMode, config.bevelMode);

    this._drawQuad(this.glassP, this.panelBuf);
    gl.disable(gl.BLEND);
  }

  clear() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, this.canvas.height - this.height, this.width, this.height);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, this.canvas.height - this.height, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);
  }

  destroy() {
    this.canvas.removeEventListener('webglcontextlost', this._onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this._onContextRestored);
    if (!this.contextLost) {
      const gl = this.gl;
      for (const fboSet of this.fboCache.values()) this._freeFBOSet(fboSet);
      this.fboCache.clear();
      if (this.bgTex) gl.deleteTexture(this.bgTex);
      gl.deleteBuffer(this.quadBuf);
      gl.deleteBuffer(this.panelBuf);
      gl.deleteProgram(this.blitP);
      gl.deleteProgram(this.blurP);
      gl.deleteProgram(this.glassP);
    }
    this.canvas.remove();
  }

  _setActiveSize(w: number, h: number) {
    if (w <= 0 || h <= 0) return false;
    this.width = w;
    this.height = h;
    if (this.canvas.width < w || this.canvas.height < h) {
      this.canvas.width = Math.max(this.canvas.width, w);
      this.canvas.height = Math.max(this.canvas.height, h);
    }
    const key = `${w}x${h}`;
    let fboSet = this.fboCache.get(key);
    if (!fboSet) {
      fboSet = { bg: this._makeFBO(w, h), blurA: this._makeFBO(w, h), blurB: this._makeFBO(w, h) };
      this.fboCache.set(key, fboSet);
    }
    this.activeFBOs = fboSet;
    return true;
  }

  _makeFBO(w: number, h: number) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, w, h };
  }

  _freeFBO(fboObj: any) {
    if (!fboObj) return;
    const gl = this.gl;
    gl.deleteFramebuffer(fboObj.fbo);
    gl.deleteTexture(fboObj.tex);
  }

  _freeFBOSet(fboSet: any) {
    this._freeFBO(fboSet.bg);
    this._freeFBO(fboSet.blurA);
    this._freeFBO(fboSet.blurB);
  }

  _compile(src: string, type: number) {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('LiquidGlass shader compile error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  _link(vsSrc: string, fsSrc: string) {
    const gl = this.gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, this._compile(vsSrc, gl.VERTEX_SHADER)!);
    gl.attachShader(p, this._compile(fsSrc, gl.FRAGMENT_SHADER)!);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('LiquidGlass program link error:', gl.getProgramInfoLog(p));
    }
    return p;
  }

  _uloc(prog: WebGLProgram, names: string[]) {
    const gl = this.gl;
    const u: any = {};
    for (const n of names) u[n] = gl.getUniformLocation(prog, n);
    return u;
  }

  _drawQuad(prog: WebGLProgram, buf: WebGLBuffer) {
    const gl = this.gl;
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

/* ── Loader ── */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export type LiquidGlassConfig = Partial<typeof DEFAULTS>;

export class LiquidGlass {
  bgUrl: string;
  renderer: GlassRenderer;
  bgCanvas: HTMLCanvasElement;
  bgCtx: CanvasRenderingContext2D;
  panels: Array<{
    el: HTMLElement;
    canvas: HTMLCanvasElement;
    config: typeof DEFAULTS;
    _forceFrames: number;
    _lastRender?: { w: number; h: number; left: number; top: number };
  }>;
  bgImage: HTMLImageElement | null;
  _raf: number;
  _onResize: () => void;
  _vwMeter: HTMLDivElement;
  _bgSizeCache: { w: number; h: number } | null = null;
  _lastDpr: number = 0;

  constructor(bgUrl: string) {
    this.bgUrl = bgUrl;
    this.renderer = new GlassRenderer();
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d')!;
    this.panels = [];
    this.bgImage = null;
    this._raf = 0;
    this._onResize = () => this._resizeBg();
    this._vwMeter = document.createElement('div');
    this._vwMeter.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(this._vwMeter);
  }

  async init() {
    this.bgImage = await loadImage(this.bgUrl);
    this._resizeBg();
    window.addEventListener('resize', this._onResize);
    // visualViewport: 监听从缩放触发的 DPR 变化
    window.visualViewport?.addEventListener('resize', this._onResize);
  }

  _resizeBg() {
    if (!this.bgImage) return;
    const w = this._vwMeter.offsetWidth || window.innerWidth;
    const viewH = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // 检测 DPR 变化，强制清缓存
    if (this._lastDpr !== dpr) {
      this._lastDpr = dpr;
      this._bgSizeCache = null;
      for (const panel of this.panels) panel._lastRender = undefined;
    }

    if (this._bgSizeCache && this._bgSizeCache.w === w && this._bgSizeCache.h === viewH) return;
    this._bgSizeCache = { w, h: viewH };

    const dprW = Math.round(w * dpr);
    const dprH = Math.round(viewH * dpr);
    this.bgCanvas.width = dprW;
    this.bgCanvas.height = dprH * 2;
    const img = this.bgImage;
    const imgRatio = img.width / img.height;
    const screenRatio = w / viewH;
    let sw: number, sh: number, sx: number, sy: number;
    if (imgRatio > screenRatio) {
      sh = img.height;
      sw = img.height * screenRatio;
      sy = 0;
      sx = (img.width - sw) / 2;
    } else {
      sw = img.width;
      sh = img.width / screenRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    this.bgCtx.drawImage(img, sx, sy, sw, sh, 0, 0, dprW, dprH);
    this.bgCtx.drawImage(img, sx, sy, sw, sh, 0, dprH, dprW, dprH);
  }

  addPanel(el: HTMLElement, overrides: LiquidGlassConfig = {}) {
    const canvas = document.createElement('canvas');
    canvas.className = 'lg-panel';
    canvas.style.cssText = 'position:absolute;pointer-events:none;z-index:-1;';
    const style = window.getComputedStyle(el);
    if (style.position === 'static') el.style.position = 'relative';
    el.insertBefore(canvas, el.firstChild);
    this.panels.push({ el, canvas, config: { ...DEFAULTS, ...overrides }, _forceFrames: 3 });
  }

  /**
   * 更新所有面板的配置参数（用于调参面板实时调节）
   */
  updateConfig(overrides: LiquidGlassConfig) {
    for (const panel of this.panels) {
      panel.config = { ...panel.config, ...overrides };
      panel._forceFrames = 3; // 强制重渲染
    }
  }

  start() {
    const loop = () => {
      this.render();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  render() {
    if (!this.bgImage) return;
    this._resizeBg();
    const dpr = window.devicePixelRatio || 1;
    for (const panel of this.panels) {
      const rect = panel.el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const pad = SHADOW_PAD;
      const cssW = rect.width + pad * 2;
      const cssH = rect.height + pad * 2;
      const w = Math.round(cssW * dpr);
      const h = Math.round(cssH * dpr);

      // Only re-render when position/size changed
      const last = panel._lastRender;
      const force = panel._forceFrames > 0;
      if (force) panel._forceFrames--;
      if (!force && last && last.w === w && last.h === h && last.left === rect.left && last.top === rect.top) {
        continue;
      }
      panel._lastRender = { w, h, left: rect.left, top: rect.top };

      if (panel.canvas.width !== w || panel.canvas.height !== h) {
        panel.canvas.width = w;
        panel.canvas.height = h;
      }

      const cssPad = SHADOW_PAD;
      panel.canvas.style.left = `${-cssPad}px`;
      panel.canvas.style.top = `${-cssPad}px`;
      panel.canvas.style.width = `${rect.width + cssPad * 2}px`;
      panel.canvas.style.height = `${rect.height + cssPad * 2}px`;

      const sourceX = Math.round((rect.left - 20) * dpr);  // 向左偏移20px，让采样区域右移
      const sourceY = Math.round((rect.top - 20) * dpr);

      this.renderer.resize(cssW, cssH);
      this.renderer.uploadAndBlur(this.bgCanvas, sourceX, sourceY, w, h, panel.config.blurAmount);
      this.renderer.clear();
      this.renderer.renderGlassPanel(panel.config, rect.width, rect.height, dpr);

      const ctx = panel.canvas.getContext('2d')!;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(this.renderer.canvas, 0, this.renderer.canvas.height - h, w, h, 0, 0, w, h);
    }
  }

  async changeBg(url: string) {
    this.bgImage = await loadImage(url);
    this._bgSizeCache = null;
    this._resizeBg();
    for (const panel of this.panels) panel._lastRender = undefined;
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    window.visualViewport?.removeEventListener('resize', this._onResize);
    for (const panel of this.panels) {
      if (panel.canvas.parentNode) panel.canvas.parentNode.removeChild(panel.canvas);
    }
    this.panels = [];
    this.renderer.destroy();
  }
}
