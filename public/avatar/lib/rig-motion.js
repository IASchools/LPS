export const POSES = Object.freeze({
  rest: Object.freeze({
    body: 0,
    shoulderY: 0,
    left: Object.freeze({ upper: 9, elbow: -92 }),
    right: Object.freeze({ upper: -6, elbow: 90 }),
  }),
  open: Object.freeze({
    body: -1.2,
    shoulderY: -5,
    left: Object.freeze({ upper: 25, elbow: 6 }),
    right: Object.freeze({ upper: -24, elbow: -6 }),
  }),
  emphasisRight: Object.freeze({
    body: 1.1,
    shoulderY: -3,
    left: Object.freeze({ upper: 20, elbow: -4 }),
    right: Object.freeze({ upper: -18, elbow: -32 }),
  }),
  emphasisLeft: Object.freeze({
    body: -1.1,
    shoulderY: -3,
    left: Object.freeze({ upper: 18, elbow: 32 }),
    right: Object.freeze({ upper: -20, elbow: 4 }),
  }),
  explain: Object.freeze({
    body: -0.6,
    shoulderY: -4,
    left: Object.freeze({ upper: 15, elbow: -18 }),
    right: Object.freeze({ upper: -24, elbow: -4 }),
  }),
  explainRight: Object.freeze({
    body: 0.6,
    shoulderY: -4,
    left: Object.freeze({ upper: 24, elbow: 4 }),
    right: Object.freeze({ upper: -15, elbow: 18 }),
  }),
  inviteLeft: Object.freeze({
    body: -0.9,
    shoulderY: -4,
    left: Object.freeze({ upper: 28, elbow: -38 }),
    right: Object.freeze({ upper: -18, elbow: 10 }),
  }),
  inviteRight: Object.freeze({
    body: 0.9,
    shoulderY: -4,
    left: Object.freeze({ upper: 18, elbow: -10 }),
    right: Object.freeze({ upper: -28, elbow: 38 }),
  }),
});

export function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum));
}

function mix(from, to, amount) {
  return from + (to - from) * amount;
}

function smoothstep(value) {
  const amount = clamp(value);
  return amount * amount * (3 - 2 * amount);
}

export function copyPose(pose) {
  return {
    body: pose.body,
    shoulderY: pose.shoulderY,
    left: { ...pose.left },
    right: { ...pose.right },
  };
}

export function interpolatePose(from, to, progress) {
  const bodyProgress = smoothstep(progress);
  const upperProgress = smoothstep(clamp((progress - 0.02) / 0.94));
  const elbowProgress = smoothstep(clamp((progress - 0.05) / 0.92));
  return {
    body: mix(from.body, to.body, bodyProgress),
    shoulderY: mix(from.shoulderY, to.shoulderY, upperProgress),
    left: {
      upper: mix(from.left.upper, to.left.upper, upperProgress),
      elbow: mix(from.left.elbow, to.left.elbow, elbowProgress),
    },
    right: {
      upper: mix(from.right.upper, to.right.upper, upperProgress),
      elbow: mix(from.right.elbow, to.right.elbow, elbowProgress),
    },
  };
}

function choreography(steps) {
  let fromName = "rest";
  const sequence = steps.map(([toName, duration, pause]) => {
    const segment = Object.freeze([fromName, toName, duration, pause]);
    fromName = toName;
    return segment;
  });
  return Object.freeze({
    duration: sequence.reduce((total, segment) => total + segment[2] + segment[3], 0),
    sequence: Object.freeze(sequence),
  });
}

const CHOREOGRAPHIES = Object.freeze([
  choreography([
    ["inviteLeft", 1150, 850],
    ["explainRight", 1100, 1050],
    ["emphasisLeft", 950, 750],
    ["inviteRight", 1150, 950],
    ["rest", 1300, 1050],
  ]),
  choreography([
    ["inviteRight", 1200, 800],
    ["explain", 1150, 1000],
    ["emphasisRight", 950, 800],
    ["inviteLeft", 1100, 1000],
    ["rest", 1350, 1100],
  ]),
  choreography([
    ["explain", 1100, 1050],
    ["emphasisRight", 950, 800],
    ["inviteLeft", 1200, 950],
    ["explainRight", 1100, 1050],
    ["rest", 1300, 1150],
  ]),
  choreography([
    ["explainRight", 1100, 1000],
    ["emphasisLeft", 950, 850],
    ["inviteRight", 1200, 950],
    ["explain", 1100, 1050],
    ["rest", 1350, 1100],
  ]),
]);

// Uma fala longa percorre as quatro coreografias antes de repetir. Todas terminam
// em repouso, então a troca de sequência também é uma transição contínua.
const CONTINUOUS_ORDER = Object.freeze([0, 2, 3, 1]);
const CONTINUOUS_SUPERCYCLE_MS = CHOREOGRAPHIES.reduce(
  (total, item) => total + item.duration,
  0,
);

// O offset muda uma vez por carregamento. Falas seguintes avançam nesta ordem
// não mecânica; não há sorteio por frame nem troca de lado no meio da transição.
const UTTERANCE_ORDER = Object.freeze([0, 3, 1, 2, 0, 2, 1, 3]);
const SESSION_OFFSET = Math.floor(Math.random() * UTTERANCE_ORDER.length);
let automaticUtterance = 0;
let lastAutomaticElapsed = null;

export const SPEAKING_CYCLE_MS = CHOREOGRAPHIES[0].duration;

function publicGesture(poseName) {
  if (poseName === "rest") return "repouso";
  if (poseName.startsWith("emphasis")) return "enfase";
  return "explicacao";
}

function normalizeIndex(value, length) {
  return ((value % length) + length) % length;
}

function startingChoreography(elapsed, options) {
  if (Number.isInteger(options?.planIndex)) {
    return normalizeIndex(options.planIndex, CHOREOGRAPHIES.length);
  }

  if (lastAutomaticElapsed !== null && elapsed + 1 < lastAutomaticElapsed) {
    automaticUtterance += 1;
  }
  lastAutomaticElapsed = elapsed;
  const orderIndex = normalizeIndex(
    SESSION_OFFSET + automaticUtterance,
    UTTERANCE_ORDER.length,
  );
  return UTTERANCE_ORDER[orderIndex];
}

export function speakingFrame(elapsedMs, options = null) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const startingIndex = startingChoreography(elapsed, options);
  let cursor = elapsed % CONTINUOUS_SUPERCYCLE_MS;
  let selected = CHOREOGRAPHIES[startingIndex];

  for (const offset of CONTINUOUS_ORDER) {
    const candidate = CHOREOGRAPHIES[
      normalizeIndex(startingIndex + offset, CHOREOGRAPHIES.length)
    ];
    selected = candidate;
    if (cursor <= candidate.duration) break;
    cursor -= candidate.duration;
  }

  for (const [fromName, toName, duration, pause] of selected.sequence) {
    if (cursor <= duration) {
      return {
        pose: interpolatePose(POSES[fromName], POSES[toName], cursor / duration),
        gesture: publicGesture(toName),
        internal: `${fromName}->${toName}`,
      };
    }
    cursor -= duration;
    if (cursor <= pause) {
      return {
        pose: copyPose(POSES[toName]),
        gesture: publicGesture(toName),
        internal: toName,
      };
    }
    cursor -= pause;
  }

  return { pose: copyPose(POSES.rest), gesture: "repouso", internal: "rest" };
}

export function approachPose(current, target, elapsedMs, timeConstantMs = 145) {
  const boundedElapsed = clamp(elapsedMs, 0, 50);
  const amount = 1 - Math.exp(-boundedElapsed / Math.max(1, timeConstantMs));
  return {
    body: mix(current.body, target.body, amount),
    shoulderY: mix(current.shoulderY, target.shoulderY, amount),
    left: {
      upper: mix(current.left.upper, target.left.upper, amount),
      elbow: mix(current.left.elbow, target.left.elbow, amount),
    },
    right: {
      upper: mix(current.right.upper, target.right.upper, amount),
      elbow: mix(current.right.elbow, target.right.elbow, amount),
    },
  };
}

export function poseDistance(from, to) {
  const parts = [
    Math.abs(from.body - to.body) / 3,
    Math.abs(from.shoulderY - to.shoulderY) / 8,
    Math.abs(from.left.upper - to.left.upper) / 35,
    Math.abs(from.left.elbow - to.left.elbow) / 190,
    Math.abs(from.right.upper - to.right.upper) / 35,
    Math.abs(from.right.elbow - to.right.elbow) / 190,
  ];
  return clamp(Math.max(...parts));
}

export function addMicroMotion(pose, elapsedMs, strength = 1) {
  const slow = Math.sin(elapsedMs * 0.00047 + 0.8) * strength;
  const counter = Math.sin(elapsedMs * 0.00061 + 2.1) * strength;
  return {
    body: pose.body + slow * 0.22,
    shoulderY: pose.shoulderY + counter * 0.7,
    left: {
      upper: pose.left.upper + counter * 0.34,
      elbow: pose.left.elbow + slow * 0.42,
    },
    right: {
      upper: pose.right.upper - counter * 0.31,
      elbow: pose.right.elbow - slow * 0.38,
    },
  };
}
