/**
 * Boca contínua calibrada para assets/torso.png (510x850).
 *
 * A arte original continua sendo a única fonte visual: durante a fala, a
 * região abaixo da linha real entre os lábios é deslocada suavemente e a
 * cavidade usa cores amostradas da própria boca. Em abertura zero, o canvas
 * contém somente a imagem-base, sem recomposição do patch.
 */

export const MOUTH_GEOMETRY = Object.freeze({
  image: Object.freeze({ width: 510, height: 850 }),
  patch: Object.freeze({ x: 174, y: 244, width: 102, height: 94 }),
  leftCorner: 187,
  rightCorner: 258,
  maxOpeningPx: 11,
  skinRecoveryPx: 52,
  edgeDissolvePx: 10,
  lipLine: Object.freeze([
    [187, 260], [191, 261], [195, 263], [199, 265], [203, 267],
    [207, 269], [211, 271], [215, 272.5], [219, 273.5], [223, 274],
    [227, 274.3], [231, 274.3], [235, 274], [239, 273.4], [243, 272.3],
    [247, 270.5], [251, 268.5], [255, 266.5], [258, 265],
  ]),
});

const imageCache = new WeakMap();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smooth01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function interpolateLipLine(x) {
  const points = MOUTH_GEOMETRY.lipLine;
  if (x <= points[0][0]) return points[0][1];
  if (x >= points.at(-1)[0]) return points.at(-1)[1];

  let index = 0;
  while (index + 1 < points.length && x > points[index + 1][0]) index += 1;

  const p0 = points[Math.max(0, index - 1)][1];
  const p1 = points[index][1];
  const p2 = points[index + 1][1];
  const p3 = points[Math.min(points.length - 1, index + 2)][1];
  const t = (x - points[index][0]) / (points[index + 1][0] - points[index][0]);
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    2 * p1
    + (-p0 + p2) * t
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function horizontalProfile(x, speechWidth) {
  const { leftCorner, rightCorner } = MOUTH_GEOMETRY;
  const u = (x - leftCorner) / (rightCorner - leftCorner);
  if (u <= 0 || u >= 1) return 0;
  const width = clamp(speechWidth, 0.9, 1.08);
  const exponent = 1.3 - (width - 1) * 2.2;
  return Math.pow(Math.sin(Math.PI * u), exponent);
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.round((sorted.length - 1) * fraction)];
}

function cavityColorFromArt(pixels) {
  const { patch, lipLine } = MOUTH_GEOMETRY;
  const channels = [[], [], []];

  for (const [absoluteX, absoluteY] of lipLine.slice(2, -2)) {
    const x = clamp(Math.round(absoluteX - patch.x), 0, patch.width - 1);
    const y = clamp(Math.round(absoluteY - patch.y), 0, patch.height - 1);
    const i = (y * patch.width + x) * 4;
    channels[0].push(pixels[i]);
    channels[1].push(pixels[i + 1]);
    channels[2].push(pixels[i + 2]);
  }

  return [
    clamp(Math.round(percentile(channels[0], 0.28) * 0.68), 72, 112),
    clamp(Math.round(percentile(channels[1], 0.28) * 0.68), 24, 42),
    clamp(Math.round(percentile(channels[2], 0.28) * 0.58), 22, 40),
  ];
}

function sampleVertical(pixels, x, y, output) {
  const { width, height } = MOUTH_GEOMETRY.patch;
  const integerX = clamp(Math.round(x), 0, width - 1);
  const boundedY = clamp(y, 0, height - 1);
  const y0 = Math.floor(boundedY);
  const y1 = Math.min(height - 1, y0 + 1);
  const mix = boundedY - y0;
  const i0 = (y0 * width + integerX) * 4;
  const i1 = (y1 * width + integerX) * 4;
  output[0] = pixels[i0] + (pixels[i1] - pixels[i0]) * mix;
  output[1] = pixels[i0 + 1] + (pixels[i1 + 1] - pixels[i0 + 1]) * mix;
  output[2] = pixels[i0 + 2] + (pixels[i1 + 2] - pixels[i0 + 2]) * mix;
  output[3] = pixels[i0 + 3] + (pixels[i1 + 3] - pixels[i0 + 3]) * mix;
  return output;
}

function sourceToDestination(sourceY, lipY, openingPx, recoveryPx) {
  const q = clamp((sourceY - lipY) / recoveryPx, 0, 1);
  return sourceY + openingPx * (1 - smooth01(q));
}

function destinationToSource(destinationY, lipY, openingPx, recoveryPx) {
  let low = lipY;
  let high = lipY + recoveryPx;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const middle = (low + high) / 2;
    if (sourceToDestination(middle, lipY, openingPx, recoveryPx) < destinationY) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}

function deformPixels(source, destination, opening, speechWidth, forcedCavityColor) {
  const geometry = MOUTH_GEOMETRY;
  const { patch } = geometry;
  const progress = smooth01(clamp(Number.isFinite(opening) ? opening : 0, 0, 1));
  destination.set(source);
  if (progress === 0) return destination;

  const cavity = forcedCavityColor ?? cavityColorFromArt(source);
  const tongue = [
    clamp(cavity[0] * 1.42, 116, 148),
    clamp(cavity[1] * 1.62, 42, 62),
    clamp(cavity[2] * 1.7, 44, 66),
  ];
  const centralOpening = geometry.maxOpeningPx * progress;
  const tongueEntry = smooth01((centralOpening - 6.2) / 3.2);
  const sample = [0, 0, 0, 0];

  for (let x = 0; x < patch.width; x += 1) {
    const absoluteX = patch.x + x + 0.5;
    const profile = horizontalProfile(absoluteX, speechWidth);
    if (profile <= 0) continue;

    const lipY = interpolateLipLine(absoluteX);
    const openingPx = geometry.maxOpeningPx * progress * profile;
    const recoveryEnd = lipY + geometry.skinRecoveryPx;
    const u = clamp(
      (absoluteX - geometry.leftCorner) / (geometry.rightCorner - geometry.leftCorner),
      0,
      1,
    );
    const horizontalCenter = Math.pow(Math.sin(Math.PI * u), 0.84);

    for (let y = 0; y < patch.height; y += 1) {
      const absoluteTop = patch.y + y;
      const absoluteCenter = absoluteTop + 0.5;
      if (absoluteTop + 1 <= lipY || absoluteTop >= recoveryEnd) continue;

      const cavityBottom = lipY + openingPx;
      const coverage = clamp(
        Math.min(absoluteTop + 1, cavityBottom) - Math.max(absoluteTop, lipY),
        0,
        1,
      );

      let sourceY = absoluteCenter;
      if (absoluteCenter >= cavityBottom && absoluteCenter < recoveryEnd) {
        sourceY = destinationToSource(
          absoluteCenter,
          lipY,
          openingPx,
          geometry.skinRecoveryPx,
        );
      } else if (absoluteCenter > lipY && absoluteCenter < cavityBottom) {
        sourceY = lipY;
      }

      sampleVertical(source, x, sourceY - patch.y - 0.5, sample);
      const i = (y * patch.width + x) * 4;
      const depth = openingPx > 0
        ? clamp((absoluteCenter - lipY) / openingPx, 0, 1)
        : 0;
      const internalLight = 0.62 + horizontalCenter * 0.16 + depth * 0.1;
      let interiorR = cavity[0] * internalLight;
      let interiorG = cavity[1] * internalLight;
      let interiorB = cavity[2] * internalLight;

      const tongueBand = smooth01((depth - 0.56) / 0.3);
      const tongueWeight = clamp(
        tongueEntry * Math.pow(horizontalCenter, 1.7) * tongueBand * 0.34,
        0,
        1,
      );
      interiorR += (tongue[0] - interiorR) * tongueWeight;
      interiorG += (tongue[1] - interiorG) * tongueWeight;
      interiorB += (tongue[2] - interiorB) * tongueWeight;

      destination[i] = sample[0] * (1 - coverage) + interiorR * coverage;
      destination[i + 1] = sample[1] * (1 - coverage) + interiorG * coverage;
      destination[i + 2] = sample[2] * (1 - coverage) + interiorB * coverage;
      destination[i + 3] = sample[3];
    }
  }

  return destination;
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function prepareImage(image) {
  const cached = imageCache.get(image);
  if (cached) return cached;

  const { image: expected, patch } = MOUTH_GEOMETRY;
  if (image.naturalWidth !== expected.width || image.naturalHeight !== expected.height) {
    throw new RangeError(
      `torso inesperado: ${image.naturalWidth}x${image.naturalHeight}; esperado ${expected.width}x${expected.height}`,
    );
  }

  const sourceCanvas = createCanvas(patch.width, patch.height);
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceContext.drawImage(
    image,
    patch.x,
    patch.y,
    patch.width,
    patch.height,
    0,
    0,
    patch.width,
    patch.height,
  );
  const source = sourceContext.getImageData(0, 0, patch.width, patch.height).data;

  const frameCanvas = createCanvas(patch.width, patch.height);
  const frameContext = frameCanvas.getContext("2d");
  const state = {
    source,
    cavityColor: cavityColorFromArt(source),
    frameCanvas,
    frameContext,
    frameImage: frameContext.createImageData(patch.width, patch.height),
  };
  imageCache.set(image, state);
  return state;
}

function dissolvePatchEdges(frameData) {
  const { width, height } = MOUTH_GEOMETRY.patch;
  const edge = MOUTH_GEOMETRY.edgeDissolvePx;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const distance = Math.min(x, y, width - 1 - x, height - 1 - y);
      if (distance >= edge) continue;
      const i = (y * width + x) * 4 + 3;
      frameData[i] = Math.round(frameData[i] * smooth01(distance / edge));
    }
  }
}

export function drawAvatarFrame(context, image, opening = 0, speechWidth = 1) {
  const { image: size, patch } = MOUTH_GEOMETRY;
  context.clearRect(0, 0, size.width, size.height);
  context.drawImage(image, 0, 0);

  const boundedOpening = clamp(Number.isFinite(opening) ? opening : 0, 0, 1);
  if (boundedOpening === 0) return;

  const state = prepareImage(image);
  deformPixels(
    state.source,
    state.frameImage.data,
    boundedOpening,
    clamp(Number.isFinite(speechWidth) ? speechWidth : 1, 0.9, 1.08),
    state.cavityColor,
  );
  dissolvePatchEdges(state.frameImage.data);
  state.frameContext.putImageData(state.frameImage, 0, 0);
  context.drawImage(state.frameCanvas, patch.x, patch.y);
}

export function getDeformedPatch(image, opening = 0, speechWidth = 1) {
  const state = prepareImage(image);
  deformPixels(
    state.source,
    state.frameImage.data,
    opening,
    speechWidth,
    state.cavityColor,
  );
  return new Uint8ClampedArray(state.frameImage.data);
}
