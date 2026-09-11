import { useEffect, useRef } from 'react';

import {
  Renderer,
  Program,
  Mesh,
  Geometry,
  Triangle,
  Texture,
  RenderTarget,
} from 'ogl';

import './RippleDistortion.css';

const MAX_WAVES = 20;

const QUALITY = {
  low: 0.45,
  medium: 0.7,
  high: 1,
};

/* =========================
   WAVE VERTEX SHADER
========================= */

const waveVertex = `
precision highp float;

attribute vec2 position;
attribute vec2 uv;
attribute vec2 iOffset;
attribute vec2 iScale;
attribute float iOpacity;

varying vec2 vUv;
varying float vOpacity;

void main() {
  vUv = uv;
  vOpacity = iOpacity;

  gl_Position = vec4(
    iOffset + position * iScale,
    0.0,
    1.0
  );
}
`;

/* =========================
   WAVE FRAGMENT SHADER
========================= */

const waveFragment = `
precision highp float;

varying vec2 vUv;
varying float vOpacity;

uniform float uRings;

const float PI = 3.14159265359;
const float EDGE = 0.006737947;

void main() {

  vec2 p = vUv * 2.0 - 1.0;

  float r = dot(p, p);

  if (r > 1.0) {
    discard;
  }

  float brush =
    (exp(-r * 5.0) - EDGE)
    / (1.0 - EDGE);

  brush *=
    0.55 +
    0.45 *
    cos(
      sqrt(r) *
      PI *
      2.0 *
      uRings
    );

  gl_FragColor = vec4(
    vec3(brush * vOpacity * vOpacity),
    1.0
  );
}
`;

/* =========================
   SCREEN VERTEX SHADER
========================= */

const screenVertex = `
precision highp float;

attribute vec2 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position = vec4(
    position,
    0.0,
    1.0
  );
}
`;

/* =========================
   DISTORTION FRAGMENT SHADER
========================= */

const distortionFragment = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform sampler2D uDisplacement;

uniform vec2 uResolution;
uniform vec2 uTextureSize;

uniform float uStrength;
uniform float uHorizontal;
uniform float uVertical;

vec2 coverUV(vec2 uv) {

  vec2 safeSize =
    max(uTextureSize, vec2(1.0));

  vec2 scale =
    uResolution / safeSize;

  vec2 scaledSize =
    safeSize * max(scale.x, scale.y);

  vec2 offset =
    (uResolution - scaledSize) * 0.5;

  return (
    uv * uResolution - offset
  ) / scaledSize;
}

void main() {

  float displacement =
    texture2D(
      uDisplacement,
      vUv
    ).r;

  vec2 base =
    coverUV(vUv);

  float x =
    displacement *
    uStrength *
    uHorizontal;

  float y =
    displacement *
    uStrength *
    uVertical;

  vec2 distortion =
    vec2(x, y);

  vec3 color =
    texture2D(
      uTexture,
      base + distortion
    ).rgb;

  gl_FragColor =
    vec4(color, 1.0);
}
`;

/* =========================
   COMPONENT
========================= */

function RippleDistortion({
  src = '/images/hero/hero-restaurant.jpg',

  trigger = 'scroll',

  strength = 0.18,
  horizontal = 4,
  vertical = 0.5,

  rings = 5,

  brushSize = 320,
  spread = 5,

  fade = 0.9,

  quality = 'medium',

  enabled = true,

  className = '',
  style,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    let destroyed = false;

    /* =========================
       RENDERER
    ========================= */

    const renderer = new Renderer({
      alpha: true,
      antialias: false,
      dpr: Math.min(
        window.devicePixelRatio || 1,
        2
      ),
    });

    const gl = renderer.gl;

    /*
      IMPORTANT:
      Transparent canvas allows the fallback image
      underneath to remain visible if WebGL texture
      is still loading.
    */
    gl.clearColor(
      0,
      0,
      0,
      0
    );

    const canvas = gl.canvas;

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';

    mount.appendChild(canvas);

    /* =========================
       FALLBACK IMAGE
    ========================= */

    const fallbackImage =
      document.createElement('img');

    fallbackImage.src = src;

    fallbackImage.alt = '';

    fallbackImage.setAttribute(
      'aria-hidden',
      'true'
    );

    fallbackImage.style.position =
      'absolute';

    fallbackImage.style.inset = '0';

    fallbackImage.style.width = '100%';

    fallbackImage.style.height = '100%';

    fallbackImage.style.objectFit =
      'cover';

    fallbackImage.style.objectPosition =
      'center';

    fallbackImage.style.transform =
      'scale(1.03)';

    fallbackImage.style.filter =
      'brightness(0.72)';

    fallbackImage.style.display =
      'block';

    fallbackImage.style.zIndex =
      '0';

    mount.insertBefore(
      fallbackImage,
      canvas
    );

    canvas.style.zIndex = '1';

    /* =========================
       IMAGE TEXTURE
    ========================= */

    const imageTexture =
      new Texture(gl, {
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
      });

    /* =========================
       WAVES
    ========================= */

    const offsets =
      new Float32Array(
        MAX_WAVES * 2
      );

    const scales =
      new Float32Array(
        MAX_WAVES * 2
      );

    const opacities =
      new Float32Array(
        MAX_WAVES
      );

    const waves = Array.from(
      { length: MAX_WAVES },
      () => ({
        x: 0,
        y: 0,
        scale: 1,
        target: 1,
        opacity: 0,
        size: 1,
      })
    );

    let currentWave = 0;

    /* =========================
       GEOMETRY
    ========================= */

    const geometry =
      new Geometry(gl, {
        position: {
          size: 2,

          data: new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,

            -1,  1,
             1, -1,
             1,  1,
          ]),
        },

        uv: {
          size: 2,

          data: new Float32Array([
            0, 0,
            1, 0,
            0, 1,

            0, 1,
            1, 0,
            1, 1,
          ]),
        },

        iOffset: {
          instanced: 1,
          size: 2,
          data: offsets,
        },

        iScale: {
          instanced: 1,
          size: 2,
          data: scales,
        },

        iOpacity: {
          instanced: 1,
          size: 1,
          data: opacities,
        },
      });

    /* =========================
       RIPPLE PROGRAM
    ========================= */

    const waveUniforms = {
      uRings: {
        value: rings,
      },
    };

    const waveProgram =
      new Program(gl, {
        vertex: waveVertex,
        fragment: waveFragment,
        uniforms: waveUniforms,

        transparent: true,

        depthTest: false,
        depthWrite: false,

        cullFace: false,
      });

    waveProgram.setBlendFunc(
      gl.ONE,
      gl.ONE
    );

    const waveMesh =
      new Mesh(gl, {
        geometry,
        program: waveProgram,
        frustumCulled: false,
      });

    /* =========================
       DISPLACEMENT TARGET
    ========================= */

    const displacementTarget =
      new RenderTarget(gl, {
        width: 2,
        height: 2,

        depth: false,

        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,

        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
      });

    /* =========================
       COMPOSITE UNIFORMS
    ========================= */

    const compositeUniforms = {
      uTexture: {
        value: imageTexture,
      },

      uDisplacement: {
        value:
          displacementTarget.texture,
      },

      uResolution: {
        value: [1, 1],
      },

      uTextureSize: {
        value: [1, 1],
      },

      uStrength: {
        value: strength,
      },

      uHorizontal: {
        value: horizontal,
      },

      uVertical: {
        value: vertical,
      },
    };

    /* =========================
       RESIZE
    ========================= */

    let width = 1;
    let height = 1;

    const resize = () => {
      width =
        Math.max(
          1,
          mount.clientWidth
        );

      height =
        Math.max(
          1,
          mount.clientHeight
        );

      renderer.setSize(
        width,
        height
      );

      compositeUniforms
        .uResolution
        .value = [
          width,
          height,
        ];

      const scale =
        QUALITY[quality] ||
        QUALITY.high;

      displacementTarget.setSize(
        Math.max(
          2,
          Math.round(
            width * scale
          )
        ),

        Math.max(
          2,
          Math.round(
            height * scale
          )
        )
      );
    };

    const resizeObserver =
      new ResizeObserver(resize);

    resizeObserver.observe(
      mount
    );

    resize();

    /* =========================
       CREATE RIPPLE
    ========================= */

    const createRipple = (
      x,
      y,
      power = 1
    ) => {
      const wave =
        waves[currentWave];

      currentWave =
        (currentWave + 1) %
        MAX_WAVES;

      wave.x = x;
      wave.y = y;

      wave.scale =
        1 * power;

      wave.target =
        spread * power;

      wave.size =
        Math.max(
          1,
          brushSize
        );

      wave.opacity = 1;
    };

    /* =========================
       IMAGE LOAD
    ========================= */

    const image =
      new Image();

    image.decoding = 'async';

    image.onload = () => {
      if (destroyed) {
        return;
      }

      imageTexture.image =
        image;

      /*
        Force texture update.
      */
      imageTexture.needsUpdate =
        true;

      compositeUniforms
        .uTextureSize
        .value = [
          image.naturalWidth || 1,
          image.naturalHeight || 1,
        ];

      /*
        Hide fallback only after
        WebGL image texture is ready.
      */
      fallbackImage.style.opacity =
        '0';

      fallbackImage.style.pointerEvents =
        'none';
    };

    image.onerror = () => {
      console.error(
        'RippleDistortion: Image failed to load:',
        src
      );

      /*
        Keep fallback image visible.
      */
      fallbackImage.style.opacity =
        '1';
    };

    image.src = src;

    /* =========================
       COMPOSITE PROGRAM
    ========================= */

    const compositeProgram =
      new Program(gl, {
        vertex: screenVertex,

        fragment:
          distortionFragment,

        uniforms:
          compositeUniforms,

        transparent: true,

        depthTest: false,
        depthWrite: false,
      });

    const compositeMesh =
      new Mesh(gl, {
        geometry:
          new Triangle(gl),

        program:
          compositeProgram,
      });

    /* =========================
       SCROLL TRANSITION
    ========================= */

    let lastScrollY =
      window.scrollY;

    let hasTriggered = false;

    let scrollCooldown = false;

    let cooldownTimer = null;

    const handleScroll = () => {
      if (
        !enabled ||
        prefersReducedMotion ||
        trigger !== 'scroll'
      ) {
        return;
      }

      const currentScrollY =
        window.scrollY;

      const heroHeight =
        window.innerHeight;

      const transitionStart =
        heroHeight * 0.25;

      const transitionEnd =
        heroHeight * 0.95;

      const scrollingDown =
        currentScrollY >
        lastScrollY;

      if (
        scrollingDown &&
        currentScrollY >
          transitionStart &&
        currentScrollY <
          transitionEnd &&
        !hasTriggered &&
        !scrollCooldown
      ) {
        createRipple(
          width * 0.5,
          height * 0.5,
          1
        );

        hasTriggered = true;

        scrollCooldown = true;

        cooldownTimer =
          window.setTimeout(() => {
            scrollCooldown = false;
          }, 650);
      }

      if (
        currentScrollY <
        heroHeight * 0.12
      ) {
        hasTriggered = false;
      }

      lastScrollY =
        currentScrollY;
    };

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      }
    );

    /* =========================
       ANIMATION
    ========================= */

    let animationFrame = 0;

    let previousTime = 0;

    const render = (time) => {
      animationFrame =
        requestAnimationFrame(
          render
        );

      const delta =
        previousTime
          ? Math.min(
              0.05,
              (time - previousTime) /
                1000
            )
          : 0;

      previousTime = time;

      /* =========================
         RIPPLE GROWTH
      ========================= */

      const growth =
        1 -
        Math.exp(
          -delta * 8
        );

      /* =========================
         RIPPLE FADE
      ========================= */

      const decay =
        Math.exp(
          (-delta * 6.2) /
          Math.max(
            0.15,
            fade
          )
        );

      for (
        let i = 0;
        i < MAX_WAVES;
        i++
      ) {
        const wave =
          waves[i];

        if (
          wave.opacity <= 0
        ) {
          opacities[i] = 0;
          continue;
        }

        wave.opacity *=
          decay;

        wave.scale +=
          (
            wave.target -
            wave.scale
          ) * growth;

        if (
          wave.opacity <
          0.002
        ) {
          wave.opacity = 0;
          opacities[i] = 0;
          continue;
        }

        const half =
          (
            wave.scale *
            wave.size
          ) / 2;

        offsets[i * 2] =
          (wave.x / width) *
          2 -
          1;

        offsets[
          i * 2 + 1
        ] =
          (wave.y / height) *
          2 -
          1;

        scales[i * 2] =
          (half / width) *
          2 *
          2.4;

        scales[
          i * 2 + 1
        ] =
          (half / height) *
          2 *
          0.45;

        opacities[i] =
          wave.opacity;
      }

      geometry.attributes
        .iOffset
        .needsUpdate = true;

      geometry.attributes
        .iScale
        .needsUpdate = true;

      geometry.attributes
        .iOpacity
        .needsUpdate = true;

      /* =========================
         DISPLACEMENT
      ========================= */

      renderer.render({
        scene: waveMesh,

        target:
          displacementTarget,

        clear: true,
      });

      /* =========================
         FINAL IMAGE
      ========================= */

      renderer.render({
        scene: compositeMesh,
      });
    };

    animationFrame =
      requestAnimationFrame(
        render
      );

    /* =========================
       CLEANUP
    ========================= */

    return () => {
      destroyed = true;

      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        'scroll',
        handleScroll
      );

      if (cooldownTimer) {
        clearTimeout(
          cooldownTimer
        );
      }

      resizeObserver.disconnect();

      if (
        canvas.parentNode ===
        mount
      ) {
        mount.removeChild(
          canvas
        );
      }

      if (
        fallbackImage.parentNode ===
        mount
      ) {
        mount.removeChild(
          fallbackImage
        );
      }

      const extension =
        gl.getExtension(
          'WEBGL_lose_context'
        );

      if (extension) {
        extension.loseContext();
      }
    };
  }, [
    src,
    quality,
    strength,
    horizontal,
    vertical,
    rings,
    brushSize,
    spread,
    fade,
    trigger,
    enabled,
  ]);

  return (
    <div
      ref={mountRef}
      className={
        `ripple-distortion ${className}`.trim()
      }
      style={style}
    />
  );
}

export default RippleDistortion;