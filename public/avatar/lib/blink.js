(function attachProceduralBlink(global) {
  "use strict";

  const WIDTH = 510;
  const HEIGHT = 850;

  // Coordinates are in the native 510 x 850 torso raster. Names follow the
  // viewer, not the avatar.
  const EYES = Object.freeze([
    Object.freeze({
      name: "viewer-left",
      bounds: Object.freeze({ x: 176, y: 171, width: 47, height: 45 }),
      left: Object.freeze({ x: 177.5, y: 191.5 }),
      right: Object.freeze({ x: 221.5, y: 194.0 }),
      top: Object.freeze({
        c1: Object.freeze({ x: 183.0, y: 172.5 }),
        c2: Object.freeze({ x: 211.5, y: 171.5 })
      }),
      bottom: Object.freeze({
        c1: Object.freeze({ x: 183.5, y: 213.0 }),
        c2: Object.freeze({ x: 211.5, y: 215.0 })
      }),
      closed: Object.freeze({
        left: Object.freeze({ x: 178.5, y: 193.0 }),
        c1: Object.freeze({ x: 189.0, y: 202.5 }),
        c2: Object.freeze({ x: 207.5, y: 204.5 }),
        right: Object.freeze({ x: 220.5, y: 195.0 })
      }),
      upperSample: Object.freeze({ x: 187, y: 159, width: 26, height: 13 }),
      lowerSample: Object.freeze({ x: 186, y: 217, width: 29, height: 11 }),
      lashSample: Object.freeze({ x: 181, y: 175, width: 38, height: 10 }),
      lashWidth: 1.9
    }),
    Object.freeze({
      name: "viewer-right",
      bounds: Object.freeze({ x: 240, y: 174, width: 70, height: 58 }),
      left: Object.freeze({ x: 241.5, y: 204.0 }),
      right: Object.freeze({ x: 308.5, y: 205.5 }),
      top: Object.freeze({
        c1: Object.freeze({ x: 251.0, y: 176.0 }),
        c2: Object.freeze({ x: 290.5, y: 174.0 })
      }),
      bottom: Object.freeze({
        c1: Object.freeze({ x: 253.5, y: 225.0 }),
        c2: Object.freeze({ x: 290.5, y: 232.0 })
      }),
      closed: Object.freeze({
        left: Object.freeze({ x: 243.0, y: 203.5 }),
        c1: Object.freeze({ x: 258.5, y: 216.5 }),
        c2: Object.freeze({ x: 290.0, y: 219.0 }),
        right: Object.freeze({ x: 307.0, y: 206.0 })
      }),
      upperSample: Object.freeze({ x: 258, y: 158, width: 35, height: 15 }),
      lowerSample: Object.freeze({ x: 257, y: 232, width: 39, height: 12 }),
      lashSample: Object.freeze({ x: 248, y: 180, width: 56, height: 14 }),
      lashWidth: 2.2
    })
  ]);

  function makeCanvas(width = WIDTH, height = HEIGHT) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function clamp01(value) {
    return Math.min(1, Math.max(0, Number(value) || 0));
  }

  function smoothstep(value) {
    return value * value * (3 - 2 * value);
  }

  function mix(a, b, amount) {
    return a + (b - a) * amount;
  }

  function mixPoint(a, b, amount) {
    return { x: mix(a.x, b.x, amount), y: mix(a.y, b.y, amount) };
  }

  function aperturePath(ctx, eye) {
    ctx.beginPath();
    ctx.moveTo(eye.left.x, eye.left.y);
    ctx.bezierCurveTo(
      eye.top.c1.x, eye.top.c1.y,
      eye.top.c2.x, eye.top.c2.y,
      eye.right.x, eye.right.y
    );
    ctx.bezierCurveTo(
      eye.bottom.c2.x, eye.bottom.c2.y,
      eye.bottom.c1.x, eye.bottom.c1.y,
      eye.left.x, eye.left.y
    );
    ctx.closePath();
  }

  function movingUpper(eye, progress) {
    return {
      left: mixPoint(eye.left, eye.closed.left, progress),
      c1: mixPoint(eye.top.c1, eye.closed.c1, progress),
      c2: mixPoint(eye.top.c2, eye.closed.c2, progress),
      right: mixPoint(eye.right, eye.closed.right, progress)
    };
  }

  function movingLower(eye, progress) {
    return {
      left: mixPoint(eye.left, eye.closed.left, progress),
      c1: mixPoint(eye.bottom.c1, eye.closed.c1, progress),
      c2: mixPoint(eye.bottom.c2, eye.closed.c2, progress),
      right: mixPoint(eye.right, eye.closed.right, progress)
    };
  }

  function clipUpperCover(ctx, eye, edge) {
    ctx.beginPath();
    ctx.moveTo(eye.left.x, eye.left.y);
    ctx.bezierCurveTo(
      eye.top.c1.x, eye.top.c1.y,
      eye.top.c2.x, eye.top.c2.y,
      eye.right.x, eye.right.y
    );
    ctx.lineTo(edge.right.x, edge.right.y);
    ctx.bezierCurveTo(
      edge.c2.x, edge.c2.y,
      edge.c1.x, edge.c1.y,
      edge.left.x, edge.left.y
    );
    ctx.closePath();
    ctx.clip();
  }

  function clipLowerCover(ctx, eye, edge) {
    ctx.beginPath();
    ctx.moveTo(edge.left.x, edge.left.y);
    ctx.bezierCurveTo(
      edge.c1.x, edge.c1.y,
      edge.c2.x, edge.c2.y,
      edge.right.x, edge.right.y
    );
    ctx.lineTo(eye.right.x, eye.right.y);
    ctx.bezierCurveTo(
      eye.bottom.c2.x, eye.bottom.c2.y,
      eye.bottom.c1.x, eye.bottom.c1.y,
      eye.left.x, eye.left.y
    );
    ctx.closePath();
    ctx.clip();
  }

  function sourcePixels(referenceCtx, sample) {
    const pixels = referenceCtx.getImageData(
      sample.x, sample.y, sample.width, sample.height
    ).data;
    const candidates = [];
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (pixels[offset + 3] < 240) continue;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      candidates.push({
        red,
        green,
        blue,
        luma: red * 0.2126 + green * 0.7152 + blue * 0.0722
      });
    }
    candidates.sort((a, b) => a.luma - b.luma);
    return candidates;
  }

  function averageColor(pixels) {
    const total = pixels.reduce((sum, pixel) => ({
      red: sum.red + pixel.red,
      green: sum.green + pixel.green,
      blue: sum.blue + pixel.blue
    }), { red: 0, green: 0, blue: 0 });
    return {
      red: Math.round(total.red / pixels.length),
      green: Math.round(total.green / pixels.length),
      blue: Math.round(total.blue / pixels.length)
    };
  }

  function cssColor(color) {
    return `rgb(${color.red} ${color.green} ${color.blue})`;
  }

  function mixColor(a, b, amount) {
    return {
      red: Math.round(mix(a.red, b.red, amount)),
      green: Math.round(mix(a.green, b.green, amount)),
      blue: Math.round(mix(a.blue, b.blue, amount))
    };
  }

  // The middle 60% rejects dark brows/lashes and isolated highlights while
  // keeping every resulting color derived from the immutable torso pixels.
  function robustSourceColor(referenceCtx, sample) {
    const candidates = sourcePixels(referenceCtx, sample);
    const start = Math.floor(candidates.length * 0.2);
    const end = Math.max(start + 1, Math.ceil(candidates.length * 0.8));
    return averageColor(candidates.slice(start, end));
  }

  function darkestSourceColor(referenceCtx, sample) {
    const candidates = sourcePixels(referenceCtx, sample);
    const selected = candidates.slice(0, Math.max(1, Math.floor(candidates.length * 0.18)));
    return cssColor(averageColor(selected));
  }

  function fillSkinCover(ctx, eye, upperColor, lowerColor, upper) {
    const midpoint = mixColor(upperColor, lowerColor, 0.48);
    const gradient = ctx.createLinearGradient(
      0, eye.bounds.y,
      0, eye.bounds.y + eye.bounds.height
    );
    if (upper) {
      gradient.addColorStop(0, cssColor(upperColor));
      gradient.addColorStop(1, cssColor(midpoint));
    } else {
      gradient.addColorStop(0, cssColor(midpoint));
      gradient.addColorStop(1, cssColor(lowerColor));
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(
      eye.bounds.x - 1,
      eye.bounds.y - 1,
      eye.bounds.width + 2,
      eye.bounds.height + 2
    );
  }

  /**
   * Draws a blink over a context that already contains the exact open torso.
   * amount: 0 = unchanged/open, 0.5 = half, 1 = closed.
   * source: optional CanvasImageSource used as the immutable texture reference.
   */
  function drawBlinkOverlay(ctx, amount, source = ctx.canvas) {
    const normalized = clamp01(amount);
    if (normalized === 0) return;
    if (ctx.canvas.width !== WIDTH || ctx.canvas.height !== HEIGHT) {
      throw new Error(`drawBlinkOverlay expects a ${WIDTH}x${HEIGHT} canvas`);
    }

    const reference = makeCanvas();
    const referenceCtx = reference.getContext("2d", { willReadFrequently: true });
    referenceCtx.drawImage(source, 0, 0, WIDTH, HEIGHT);
    const progress = smoothstep(normalized);
    const lowerProgress = Math.pow(progress, 1.45);

    for (const eye of EYES) {
      const upper = movingUpper(eye, progress);
      const lower = movingLower(eye, lowerProgress);
      const upperColor = robustSourceColor(referenceCtx, eye.upperSample);
      const lowerColor = robustSourceColor(referenceCtx, eye.lowerSample);

      ctx.save();
      aperturePath(ctx, eye);
      ctx.clip();
      ctx.save();
      clipUpperCover(ctx, eye, upper);
      fillSkinCover(ctx, eye, upperColor, lowerColor, true);
      ctx.restore();
      ctx.save();
      clipLowerCover(ctx, eye, lower);
      fillSkinCover(ctx, eye, upperColor, lowerColor, false);
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(upper.left.x, upper.left.y);
      ctx.bezierCurveTo(
        upper.c1.x, upper.c1.y,
        upper.c2.x, upper.c2.y,
        upper.right.x, upper.right.y
      );
      ctx.lineWidth = eye.lashWidth;
      ctx.lineCap = "round";
      ctx.strokeStyle = darkestSourceColor(referenceCtx, eye.lashSample);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBlinkMask(ctx) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    for (const eye of EYES) {
      aperturePath(ctx, eye);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  global.Blink = Object.freeze({
    VERSION: "procedural-2",
    WIDTH,
    HEIGHT,
    EYES,
    drawBlinkOverlay,
    drawBlinkMask
  });
})(window);
