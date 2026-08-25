import { drawAvatarFrame } from "./lib/mouth.js";
import "./lib/blink.js";
import {
  POSES,
  addMicroMotion,
  approachPose,
  clamp,
  copyPose,
  poseDistance,
  speakingFrame,
} from "./lib/rig-motion.js";

const DESIGN_WIDTH = 900;
const DESIGN_HEIGHT = 1000;
const TORSO_WIDTH = 510;
const TORSO_HEIGHT = 850;

const STATE_ZOOM = Object.freeze({
  parada: 0,
  ouvindo: 0.08,
  pensando: -0.03,
  falando: 0.035,
  executando: 0.02,
  sucesso: 0.06,
  erro: -0.05,
});

const MANUAL_POSES = Object.freeze({
  repouso: "rest",
  explicacao: "explain",
});

function assetUrl(relativePath) {
  return new URL(relativePath, import.meta.url).href;
}

function radians(degrees) {
  return degrees * Math.PI / 180;
}

function pulse(elapsed, duration, strength = 1) {
  if (elapsed < 0 || elapsed > duration) return 0;
  const closeEnd = duration * 0.34;
  const holdEnd = duration * 0.49;
  if (elapsed <= closeEnd) {
    const amount = elapsed / closeEnd;
    return amount * amount * (3 - 2 * amount) * strength;
  }
  if (elapsed <= holdEnd) return strength;
  const amount = (elapsed - holdEnd) / (duration - holdEnd);
  return (1 - amount * amount * (3 - 2 * amount)) * strength;
}

function safeNumber(value, fallback, minimum, maximum) {
  return Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback;
}

function cleanForearmEdges(image) {
  const surface = document.createElement("canvas");
  surface.width = image.naturalWidth || image.width;
  surface.height = image.naturalHeight || image.height;
  const surfaceContext = surface.getContext("2d", { willReadFrequently: true });
  surfaceContext.drawImage(image, 0, 0);

  const imageData = surfaceContext.getImageData(0, 0, surface.width, surface.height);
  const original = new Uint8ClampedArray(imageData.data);
  const offset = (x, y) => (y * surface.width + x) * 4;
  const alphaAt = (x, y) => {
    if (x < 0 || y < 0 || x >= surface.width || y >= surface.height) return 0;
    return original[offset(x, y) + 3];
  };
  const isInterior = (x, y) => {
    if (alphaAt(x, y) < 250) return false;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (alphaAt(x + dx, y + dy) < 245) return false;
      }
    }
    return true;
  };

  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const target = offset(x, y);
      if (original[target + 3] === 0) continue;

      let nearTransparency = false;
      for (let dy = -2; dy <= 2 && !nearTransparency; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          if (!dx && !dy) continue;
          if (alphaAt(x + dx, y + dy) < 16) {
            nearTransparency = true;
            break;
          }
        }
      }
      if (!nearTransparency) continue;

      let source = null;
      let bestDistance = Infinity;
      for (let radius = 2; radius <= 12 && source === null; radius += 1) {
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
            const candidateX = x + dx;
            const candidateY = y + dy;
            if (!isInterior(candidateX, candidateY)) continue;
            const distance = dx * dx + dy * dy;
            if (distance >= bestDistance) continue;
            bestDistance = distance;
            source = offset(candidateX, candidateY);
          }
        }
      }
      if (source === null) continue;
      imageData.data[target] = original[source];
      imageData.data[target + 1] = original[source + 1];
      imageData.data[target + 2] = original[source + 2];
    }
  }

  surfaceContext.putImageData(imageData, 0, 0);
  return surface;
}

function trimForearmJoint(image) {
  const surface = document.createElement("canvas");
  surface.width = image.naturalWidth || image.width;
  surface.height = image.naturalHeight || image.height;
  const surfaceContext = surface.getContext("2d", { willReadFrequently: true });
  surfaceContext.drawImage(image, 0, 0);

  const imageData = surfaceContext.getImageData(0, 0, surface.width, surface.height);
  const blendStart = 48;
  const blendEnd = 52;
  for (let y = 0; y < surface.height; y += 1) {
    for (let x = 0; x < Math.min(blendEnd, surface.width); x += 1) {
      const alpha = (y * surface.width + x) * 4 + 3;
      if (imageData.data[alpha] === 0) continue;
      if (x < blendStart) {
        imageData.data[alpha] = 0;
        continue;
      }
      const amount = (x - blendStart) / (blendEnd - blendStart);
      const eased = amount * amount * (3 - 2 * amount);
      imageData.data[alpha] = Math.round(imageData.data[alpha] * eased);
    }
  }
  surfaceContext.putImageData(imageData, 0, 0);
  return surface;
}

function roundUpperLeftTerminal(image) {
  const surface = document.createElement("canvas");
  surface.width = image.naturalWidth || image.width;
  surface.height = image.naturalHeight || image.height;
  const surfaceContext = surface.getContext("2d", { willReadFrequently: true });
  surfaceContext.drawImage(image, 0, 0);

  const imageData = surfaceContext.getImageData(0, 0, surface.width, surface.height);
  const centerX = 78;
  const radiusX = 39;
  const shoulderY = 310;
  const centerY = 318;
  for (let y = shoulderY; y < surface.height; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const alpha = (y * surface.width + x) * 4 + 3;
      if (imageData.data[alpha] === 0) continue;
      const normalizedX = (x - centerX) / radiusX;
      const depth = Math.abs(normalizedX) < 1
        ? Math.sqrt(1 - normalizedX * normalizedX)
        : 0;
      const limit = shoulderY + (centerY - shoulderY) * depth;
      const coverage = clamp(limit + 0.75 - y, 0, 1);
      imageData.data[alpha] = Math.round(imageData.data[alpha] * coverage);
    }
  }

  surfaceContext.putImageData(imageData, 0, 0);
  return surface;
}

function repairUpperRightTerminal(image) {
  const surface = document.createElement("canvas");
  surface.width = image.naturalWidth || image.width;
  surface.height = image.naturalHeight || image.height;
  const surfaceContext = surface.getContext("2d", { willReadFrequently: true });
  surfaceContext.drawImage(image, 0, 0);

  const imageData = surfaceContext.getImageData(0, 0, surface.width, surface.height);
  const original = new Uint8ClampedArray(imageData.data);
  const source = { x: 75, y: 272, width: 64, height: 48 };
  const target = { x: 49, y: 320, width: 66, height: 38 };
  const offset = (x, y) => (y * surface.width + x) * 4;

  for (let y = target.y; y < Math.min(target.y + target.height, surface.height); y += 1) {
    const vertical = (y - target.y) / Math.max(1, target.height - 1);
    const sourceY = Math.round(source.y + vertical * (source.height - 1));
    const transition = clamp((y - target.y) / 14, 0, 1);
    const blend = transition * transition * (3 - 2 * transition);
    for (let x = target.x; x < Math.min(target.x + target.width, surface.width); x += 1) {
      const targetOffset = offset(x, y);
      if (original[targetOffset + 3] === 0) continue;
      const horizontal = (x - target.x) / Math.max(1, target.width - 1);
      const sourceX = Math.round(source.x + horizontal * (source.width - 1));
      const sourceOffset = offset(sourceX, sourceY);
      for (let channel = 0; channel < 3; channel += 1) {
        imageData.data[targetOffset + channel] = Math.round(
          original[targetOffset + channel] * (1 - blend) + original[sourceOffset + channel] * blend,
        );
      }
    }
  }

  surfaceContext.putImageData(imageData, 0, 0);
  return surface;
}

function removeDuplicatedRightSleeve(image) {
  const surface = document.createElement("canvas");
  surface.width = image.naturalWidth || image.width;
  surface.height = image.naturalHeight || image.height;
  const surfaceContext = surface.getContext("2d", { willReadFrequently: true });
  surfaceContext.drawImage(image, 0, 0);

  // A manga já pertence ao torso. No asset articulado, ela aparecia novamente
  // atrás do ombro direito como um lóbulo azul. Removemos somente o tecido
  // azulado e preservamos toda a pele, inclusive as sombras da junção.
  const imageData = surfaceContext.getImageData(0, 0, surface.width, surface.height);
  const limitY = Math.min(232, surface.height);
  for (let y = 0; y < limitY; y += 1) {
    for (let x = 0; x < surface.width; x += 1) {
      const offset = (y * surface.width + x) * 4;
      if (imageData.data[offset + 3] === 0) continue;
      const red = imageData.data[offset];
      const blue = imageData.data[offset + 2];
      const duplicatedSleeve = blue - red >= -35;
      if (duplicatedSleeve) imageData.data[offset + 3] = 0;
    }
  }
  surfaceContext.putImageData(imageData, 0, 0);
  return surface;
}

export function criarAvatar(canvas, opcoes = {}) {
  const ctx = canvas?.getContext?.("2d", { alpha: true }) ?? null;
  const torsoSurface = document.createElement("canvas");
  torsoSurface.width = TORSO_WIDTH;
  torsoSurface.height = TORSO_HEIGHT;
  const torsoContext = torsoSurface.getContext("2d", { alpha: true });
  const deslocamentoHorizontal = safeNumber(opcoes.deslocamentoHorizontal, 0, -0.12, 0.12);
  const zoomBase = safeNumber(opcoes.zoomBase, 1, 0.78, 1.08);
  const respostaDoZoom = safeNumber(opcoes.respostaDoZoom, 1, 0, 1);
  const initialCanvasWidth = Math.max(1, canvas?.width || DESIGN_WIDTH);
  const initialCanvasHeight = Math.max(1, canvas?.height || DESIGN_HEIGHT);
  const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;

  const sources = Object.freeze({
    torso: opcoes.imagem ?? opcoes.torso ?? assetUrl("./assets-despill/torso.png"),
    upperLeft: opcoes.bracoSuperiorEsquerdo ?? assetUrl("./assets-despill/braco-superior-esq.png"),
    upperRight: opcoes.bracoSuperiorDireito ?? assetUrl("./assets-despill/braco-superior-dir.png"),
    forearmLeft: opcoes.antebracoEsquerdo ?? assetUrl("./assets-despill/antebraco-esq.png"),
    forearmRight: opcoes.antebracoDireito ?? assetUrl("./assets-despill/antebraco-dir.png"),
  });

  const images = {};
  const input = {
    estado: "parada",
    abertura: 0,
    largura: 1,
    piscarForcado: null,
    gestoBracos: "automatico",
  };
  const smooth = {
    abertura: 0,
    largura: 1,
    zoom: zoomBase,
    pose: copyPose(POSES.rest),
  };
  const status = {
    ready: false,
    source: "carregando",
    gestureTarget: "repouso",
    gestureRendered: "repouso",
    internalPose: "rest",
    progress: null,
    callbacksFalha: 0,
    frame: 0,
  };

  let stopped = false;
  let raf = 0;
  let lastFrame = null;
  let speakingStartedAt = null;
  let reducedMotion = mediaQuery?.matches ?? false;
  let emphasisRight = true;
  let nextBlinkAt = performance.now() + 3200 + Math.random() * 2300;
  let blinkEvent = null;
  let failureReported = false;

  function reportArtFailure(source) {
    if (stopped) return;
    status.callbacksFalha += 1;
    try {
      opcoes.aoFalharAArte?.(source);
    } catch {
      // Observability must not break the six-method contract.
    }
  }

  function reportRigFailure(error) {
    if (stopped || failureReported) return;
    failureReported = true;
    status.callbacksFalha += 1;
    try {
      opcoes.aoFalharRigBracos?.(error);
    } catch {
      // Observability must not break the visual fallback.
    }
  }

  function randomBlinkDelay() {
    const ranges = {
      falando: [2800, 6200],
      pensando: [2600, 5600],
      ouvindo: [3600, 7800],
      executando: [3200, 7000],
    };
    const [minimum, maximum] = ranges[input.estado] ?? [4300, 9000];
    return minimum + Math.random() * (maximum - minimum);
  }

  function scheduleBlink(now) {
    blinkEvent = null;
    nextBlinkAt = now + randomBlinkDelay();
  }

  function automaticBlink(now) {
    if (reducedMotion) return 0;
    if (!blinkEvent && now >= nextBlinkAt) {
      const duration = 175 + Math.random() * 45;
      blinkEvent = {
        start: now,
        duration,
        double: Math.random() < 0.16,
      };
    }
    if (!blinkEvent) return 0;
    const first = pulse(now - blinkEvent.start, blinkEvent.duration);
    const secondStart = blinkEvent.start + blinkEvent.duration + 78;
    const second = blinkEvent.double
      ? pulse(now - secondStart, blinkEvent.duration * 0.82, 0.78)
      : 0;
    const end = blinkEvent.double
      ? secondStart + blinkEvent.duration * 0.82
      : blinkEvent.start + blinkEvent.duration;
    if (now > end) scheduleBlink(now);
    return Math.max(first, second);
  }

  function onMotionPreference(event) {
    reducedMotion = Boolean(event.matches);
    blinkEvent = null;
    scheduleBlink(performance.now());
  }
  mediaQuery?.addEventListener?.("change", onMotionPreference);

  function loadImage(key, source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      images[key] = image;
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(Object.assign(
        new Error(`Falha ao carregar ${source}`),
        { source, key },
      ));
      image.src = source;
    });
  }

  function validateImages() {
    if (images.torso.naturalWidth !== TORSO_WIDTH || images.torso.naturalHeight !== TORSO_HEIGHT) {
      throw Object.assign(
        new RangeError(`torso inesperado: ${images.torso.naturalWidth}x${images.torso.naturalHeight}`),
        { source: sources.torso, key: "torso" },
      );
    }
    for (const key of ["upperLeft", "upperRight", "forearmLeft", "forearmRight"]) {
      if (images[key].naturalWidth < 1 || images[key].naturalHeight < 1) {
        throw Object.assign(new RangeError(`asset de braço inválido: ${key}`), { source: sources[key], key });
      }
    }
  }

  function clearRightSleeveCavity() {
    torsoContext.save();
    torsoContext.globalCompositeOperation = "destination-out";
    torsoContext.translate(419, 476);
    torsoContext.rotate(radians(-50));
    torsoContext.beginPath();
    torsoContext.ellipse(0, 0, 38, 16, 0, 0, Math.PI * 2);
    torsoContext.fill();
    torsoContext.restore();
  }

  function resizeCanvas() {
    const cssWidth = Math.max(1, Math.round(canvas.clientWidth || initialCanvasWidth));
    const cssHeight = Math.max(1, Math.round(canvas.clientHeight || initialCanvasHeight));
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    return { cssWidth, cssHeight, dpr };
  }

  function drawArm(side, shoulderX, shoulderY, upperAngle, elbowAngle) {
    const left = side === "left";
    const upper = left ? images.upperLeft : images.upperRight;
    const forearm = left ? images.forearmLeft : images.forearmRight;
    const upperWidth = upper.naturalWidth || upper.width;
    const upperNaturalHeight = upper.naturalHeight || upper.height;
    const upperHeight = upperNaturalHeight;
    const upperY = left ? -88 : -150;
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(radians(upperAngle));
    ctx.drawImage(upper, 0, 0, upperWidth, upperHeight, -95, upperY, upperWidth, upperHeight);
    const elbowPivotY = left ? 226 : 207;
    ctx.translate(0, elbowPivotY);
    ctx.rotate(radians(elbowAngle));
    if (left) ctx.scale(-1, 1);
    ctx.drawImage(forearm, left ? -78 : -82, left ? -72 : -80);
    ctx.restore();
  }

  function currentTarget(now) {
    if (reducedMotion) {
      return { pose: POSES.rest, gesture: "repouso", internal: "rest" };
    }
    if (input.gestoBracos !== "automatico") {
      let name = MANUAL_POSES[input.gestoBracos] ?? "rest";
      if (input.gestoBracos === "enfase") name = emphasisRight ? "emphasisRight" : "emphasisLeft";
      return { pose: POSES[name], gesture: input.gestoBracos, internal: name };
    }
    if (input.estado === "falando" && speakingStartedAt !== null) {
      return speakingFrame(now - speakingStartedAt);
    }
    return { pose: POSES.rest, gesture: "repouso", internal: "rest" };
  }

  function draw(now, elapsed) {
    const viewport = resizeCanvas();
    ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.cssWidth, viewport.cssHeight);
    if (!status.ready) return;

    const target = currentTarget(now);
    smooth.pose = approachPose(smooth.pose, target.pose, elapsed, reducedMotion ? 360 : 145);
    const mouthAmount = 1 - Math.exp(-clamp(elapsed, 0, 50) / 58);
    smooth.abertura += (input.abertura - smooth.abertura) * mouthAmount;
    smooth.largura += (input.largura - smooth.largura) * mouthAmount;
    const targetZoom = zoomBase + (STATE_ZOOM[input.estado] ?? 0) * respostaDoZoom;
    const zoomAmount = 1 - Math.exp(-clamp(elapsed, 0, 50) / 280);
    smooth.zoom += (targetZoom - smooth.zoom) * zoomAmount;

    const microStrength = reducedMotion ? 0 : (input.estado === "falando" ? 1 : 0.28);
    const renderedPose = addMicroMotion(smooth.pose, now, microStrength);
    drawAvatarFrame(torsoContext, images.torso, smooth.abertura, smooth.largura);
    const blink = input.piscarForcado === null
      ? automaticBlink(now)
      : input.piscarForcado;
    window.Blink?.drawBlinkOverlay(torsoContext, blink, images.torso);
    clearRightSleeveCavity();

    const fit = Math.min(viewport.cssWidth / DESIGN_WIDTH, viewport.cssHeight / DESIGN_HEIGHT);
    const scale = fit * smooth.zoom;
    const offsetX = (viewport.cssWidth - DESIGN_WIDTH * scale) / 2
      + DESIGN_WIDTH * scale * deslocamentoHorizontal;
    const offsetY = viewport.cssHeight - DESIGN_HEIGHT * scale;
    const breathing = reducedMotion ? 0 : Math.sin(now * (input.estado === "falando" ? 0.0022 : 0.0017))
      * (input.estado === "falando" ? 2.2 : 1.25);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(0, breathing);
    ctx.translate(450, 530);
    ctx.scale(0.82, 0.82);
    ctx.rotate(radians(renderedPose.body));
    ctx.translate(-450, -530);
    drawArm("left", 281, 519 + renderedPose.shoulderY, renderedPose.left.upper, renderedPose.left.elbow);
    drawArm("right", 612, 518 + renderedPose.shoulderY, renderedPose.right.upper, renderedPose.right.elbow);
    ctx.drawImage(torsoSurface, 195, 80);
    ctx.restore();

    const distance = poseDistance(smooth.pose, target.pose);
    status.gestureTarget = target.gesture;
    status.gestureRendered = target.gesture;
    status.internalPose = target.internal;
    status.progress = clamp(1 - distance);
    status.frame += 1;
  }

  function frame(now) {
    if (stopped) return;
    const elapsed = lastFrame === null ? 16.67 : Math.max(0, now - lastFrame);
    lastFrame = now;
    try {
      draw(now, elapsed);
    } catch (error) {
      status.ready = false;
      status.source = "indisponivel";
      reportRigFailure(error);
      reportArtFailure(sources.torso);
    }
    if (!stopped) raf = requestAnimationFrame(frame);
  }

  if (!ctx || !torsoContext) {
    status.source = "indisponivel";
    reportRigFailure(new Error("Canvas 2D indisponível"));
  } else {
    raf = requestAnimationFrame(frame);
    Promise.all(Object.entries(sources).map(([key, source]) => loadImage(key, source)))
      .then(() => {
        if (stopped) return;
        validateImages();
        images.upperLeft = roundUpperLeftTerminal(cleanForearmEdges(images.upperLeft));
        images.upperRight = repairUpperRightTerminal(
          removeDuplicatedRightSleeve(cleanForearmEdges(images.upperRight)),
        );
        images.forearmLeft = trimForearmJoint(cleanForearmEdges(images.forearmLeft));
        images.forearmRight = trimForearmJoint(cleanForearmEdges(images.forearmRight));
        status.ready = true;
        status.source = "segmentado-2d";
      })
      .catch((error) => {
        if (stopped) return;
        status.ready = false;
        status.source = "indisponivel";
        reportArtFailure(error.source ?? sources.torso);
        if (error.key !== "torso") reportRigFailure(error);
      });
  }

  return {
    definirEstado(estado) {
      if (input.estado === estado) return;
      const wasSpeaking = input.estado === "falando";
      input.estado = typeof estado === "string" ? estado : "parada";
      if (!wasSpeaking && input.estado === "falando") speakingStartedAt = performance.now();
      if (wasSpeaking && input.estado !== "falando") speakingStartedAt = null;
      if (!blinkEvent && input.piscarForcado === null) scheduleBlink(performance.now());
    },
    definirPiscar(fechamento) {
      input.piscarForcado = fechamento === null || fechamento === undefined
        ? null
        : clamp(Number(fechamento) || 0);
      if (input.piscarForcado === null) scheduleBlink(performance.now());
    },
    definirBoca(abertura, largura = 1) {
      input.abertura = clamp(Number(abertura) || 0);
      input.largura = safeNumber(Number(largura), 1, 0.9, 1.08);
    },
    definirGestoBracos(gesto = "automatico") {
      const safeGesture = ["automatico", "repouso", "respiracao", "explicacao", "enfase"].includes(gesto)
        ? gesto
        : "automatico";
      input.gestoBracos = safeGesture === "respiracao" ? "repouso" : safeGesture;
      if (input.gestoBracos === "enfase") emphasisRight = !emphasisRight;
    },
    diagnosticoRigBracos() {
      const transitioning = status.progress !== null && status.progress < 0.965;
      return {
        fonte: status.source,
        gestoAtual: transitioning ? "transicao" : status.gestureRendered,
        estado: input.estado,
        modo: input.gestoBracos === "automatico" ? "automatico" : "manual",
        gestoSolicitado: status.gestureTarget,
        gestoRenderizado: status.gestureRendered,
        poseRepouso: status.ready ? "disponivel" : status.source === "indisponivel" ? "erro" : "carregando",
        poseExplicacao: status.ready ? "disponivel" : status.source === "indisponivel" ? "erro" : "carregando",
        poseEnfase: status.ready ? "disponivel" : status.source === "indisponivel" ? "erro" : "carregando",
        transicaoCorporal: transitioning ? "em-curso" : "estavel",
        progressoTransicaoCorporal: status.progress,
        impactoTransicaoCorporal: Number(poseDistance(smooth.pose, POSES.rest).toFixed(4)),
        progressoParaAlvo: status.progress,
        callbacksFalha: status.callbacksFalha,
      };
    },
    parar() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      mediaQuery?.removeEventListener?.("change", onMotionPreference);
      for (const image of Object.values(images)) {
        image.onload = null;
        image.onerror = null;
      }
      status.source = "parado";
    },
  };
}
