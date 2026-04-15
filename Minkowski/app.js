const canvas = document.getElementById("diagram");
let ctx = canvas.getContext("2d");
const canvasWrap = document.querySelector(".canvas-wrap");

const betaInput = document.getElementById("beta");
const betaValue = document.getElementById("betaValue");
const gammaValue = document.getElementById("gammaValue");
const rectifyViewInput = document.getElementById("rectifyView");
const rectifyRow = document.getElementById("rectifyRow");
const rectifyAmountInput = document.getElementById("rectifyAmount");
const rectifyValue = document.getElementById("rectifyValue");
const drawToolInput = document.getElementById("drawTool");
const strokeColorInput = document.getElementById("strokeColor");
const showReferenceGridInput = document.getElementById("showReferenceGrid");
const showLightConesInput = document.getElementById("showLightCones");
const showHyperbolesInput = document.getElementById("showHyperboles");
const hyperbolaClipLabel = document.getElementById("hyperbolaClipLabel");
const clipToHyperbolaeInput = document.getElementById("clipToHyperbolae");
const hyperbolaSpacingLabel = document.getElementById("hyperbolaSpacingLabel");
const hyperbolaSpacingInput = document.getElementById("hyperbolaSpacing");
const showHyperbolaPointsInput = document.getElementById("showHyperbolaPoints");
const showBellScenarioInput = document.getElementById("showBellScenario");
const bellScenarioControls = document.getElementById("bellScenarioControls");
const bellSeparationInput = document.getElementById("bellSeparation");
const bellAccelerationInput = document.getElementById("bellAcceleration");
const bellProbeRocketInput = document.getElementById("bellProbeRocket");
const bellProbeTimeInput = document.getElementById("bellProbeTime");
const bellProbeTimeValueInput = document.getElementById("bellProbeTimeValue");
const bellFollowProbeFrameInput = document.getElementById("bellFollowProbeFrame");
const bellPinProbeXInput = document.getElementById("bellPinProbeX");
const bellShowStringLengthInput = document.getElementById("bellShowStringLength");
const showTwinScenarioInput = document.getElementById("showTwinScenario");
const twinScenarioControls = document.getElementById("twinScenarioControls");
const twinTravelSpeedInput = document.getElementById("twinTravelSpeed");
const twinHalfTripProperTimeInput = document.getElementById("twinHalfTripProperTime");
const twinProbeProperTimeInput = document.getElementById("twinProbeProperTime");
const twinProbeProperTimeValueInput = document.getElementById("twinProbeProperTimeValue");
const twinFollowProbeFrameInput = document.getElementById("twinFollowProbeFrame");
const twinSmoothTurnaroundInput = document.getElementById("twinSmoothTurnaround");
const showAxisCoordinatesInput = document.getElementById("showAxisCoordinates");
const showReferenceAxisCoordinatesInput = document.getElementById("showReferenceAxisCoordinates");
const showBoostedPointGuidesInput = document.getElementById("showBoostedPointGuides");
const showReferencePointGuidesInput = document.getElementById("showReferencePointGuides");
const showLineLengthsInput = document.getElementById("showLineLengths");
const showPointCoordinatesInput = document.getElementById("showPointCoordinates");
const hideAxesAndLinesInput = document.getElementById("hideAxesAndLines");
const showBoostedGridInput = document.getElementById("showBoostedGrid");
const undoButton = document.getElementById("undo");
const clearButton = document.getElementById("clear");
const copyDiagramButton = document.getElementById("copyDiagram");
const textEditorPopover = document.getElementById("textEditorPopover");
const textEditorInput = document.getElementById("textEditorInput");
const confirmTextLabelButton = document.getElementById("confirmTextLabel");
const cancelTextLabelButton = document.getElementById("cancelTextLabel");
const copyDiagramStatus = document.getElementById("copyDiagramStatus");
const copyDiagramPopover = document.getElementById("copyDiagramPopover");
const copyXMinInput = document.getElementById("copyXMin");
const copyXMaxInput = document.getElementById("copyXMax");
const copyTMinInput = document.getElementById("copyTMin");
const copyTMaxInput = document.getElementById("copyTMax");
const confirmCopyDiagramButton = document.getElementById("confirmCopyDiagram");
const cancelCopyDiagramButton = document.getElementById("cancelCopyDiagram");
const axisVisibilityButton = document.getElementById("axisVisibilityButton");
const axisVisibilityPopover = document.getElementById("axisVisibilityPopover");
const axisHideLineModeInput = document.getElementById("axisHideLineMode");
const axisHideLabelModeInput = document.getElementById("axisHideLabelMode");
const gridParallelAxisInput = document.getElementById("gridParallelAxis");
const resetAxisVisibilityButton = document.getElementById("resetAxisVisibility");
const lastUpdatedNote = document.getElementById("lastUpdated");
const tutorialPopover = document.querySelector(".tutorial-popover");
const tutorialTrigger = document.getElementById("tutorialTrigger");
const tutorialPanel = document.getElementById("tutorialPanel");

function createAxisVisibilityState() {
  return {
    referenceX: { lineVisible: true, labelVisible: true },
    referenceT: { lineVisible: true, labelVisible: true },
    boostedX: { lineVisible: true, labelVisible: true },
    boostedT: { lineVisible: true, labelVisible: true }
  };
}

const state = {
  beta: 0,
  rectifyViewEnabled: false,
  rectifyAmount: 0,
  scale: 40,
  activeTool: "line",
  strokeColor: "#0d2e3c",
  showReferenceGrid: true,
  showLightCones: true,
  showHyperboles: false,
  hyperbolaSpacing: 2,
  clipToHyperbolae: false,
  showHyperbolaPoints: false,
  bell: {
    enabled: false,
    separation: 4,
    acceleration: 0.05,
    probeRocket: "front",
    probeTime: 6,
    followProbeFrame: false,
    pinProbeX: false,
    showStringLength: false
  },
  twin: {
    enabled: false,
    speed: 0.6,
    halfTripProperTime: 4,
    probeProperTime: 2,
    followProbeFrame: false,
    smoothTurnaround: false
  },
  showAxisCoordinates: true,
  showReferenceAxisCoordinates: true,
  showBoostedPointGuides: false,
  showReferencePointGuides: false,
  showLineLengths: true,
  showPointCoordinates: true,
  hideAxesAndLines: false,
  axisVisibilityEdit: {
    lines: false,
    labels: false
  },
  axisVisibility: createAxisVisibilityState(),
  gridParallelAxis: "all",
  showBoostedGrid: false,
  textEditor: {
    open: false,
    point: null,
    strokeIndex: -1
  },
  strokes: [],
  drawing: false,
  drawMode: null,
  draggingShape: false,
  currentPointerId: null,
  dragStrokeIndices: [],
  lastDragPoint: null,
  currentGroupId: null,
  nextGroupId: 1
};

const view = {
  width: 0,
  height: 0
};

let copyDiagramStatusTimeoutId = null;
let renderViewportOverride = null;
let axisVisibilityTargets = [];
let twinCurveCache = null;

const DEFAULT_HYPERBOLA_SPACING = 2;
const TEXT_STROKE_FONT_SIZE = 11;
const TEXT_STROKE_FONT = `${TEXT_STROKE_FONT_SIZE}px IBM Plex Sans, Segoe UI, sans-serif`;
const TEXT_STROKE_PADDING_X = 5;
const TEXT_STROKE_PADDING_Y = 4;
const TEXT_STROKE_LINE_HEIGHT = 14;
const MAX_HYPERBOLA_LEVEL = 21;
const MIN_HYPERBOLA_X_EXTENT = 21;
const HYPERBOLA_MARKER_RAPIDITY_STEP = 0.45;
const MIN_BELL_SEPARATION = 0.5;
const MAX_BELL_SEPARATION = 12;
const MIN_BELL_ACCELERATION = 0.05;
const MAX_BELL_ACCELERATION = 0.8;
const MAX_BELL_PROBE_TIME = 10;
const BELL_DRAG_THRESHOLD_PX = 11;
const MIN_TWIN_SPEED = 0.2;
const MAX_TWIN_SPEED = 0.95;
const MIN_TWIN_HALF_TRIP_PROPER_TIME = 1;
const MAX_TWIN_HALF_TRIP_PROPER_TIME = 12;
const TWIN_SAMPLE_DENSITY = 96;
const TWIN_MIN_SAMPLE_COUNT = 320;
const TWIN_DRAG_THRESHOLD_PX = 11;
const TWIN_TURN_SMOOTH_HALF_WIDTH = 0.6;
const TWIN_TURN_SMOOTH_FRACTION = 0.18;
const DEFAULT_COPY_VIEWPORT = {
  xMin: -13,
  xMax: 13,
  tMin: -11,
  tMax: 11
};

function gamma(beta) {
  return 1 / Math.sqrt(1 - beta * beta);
}

function clampBeta(beta) {
  const limit = 0.999999;
  if (!Number.isFinite(beta)) {
    return 0;
  }

  return Math.max(-limit, Math.min(limit, beta));
}

function rapidity(beta) {
  const normalizedBeta = clampBeta(beta);
  return 0.5 * Math.log((1 + normalizedBeta) / (1 - normalizedBeta));
}

function betaFromRapidity(value) {
  return Math.tanh(value);
}

function sanitizeHyperbolaSpacing(value) {
  if (!Number.isFinite(value)) {
    return DEFAULT_HYPERBOLA_SPACING;
  }

  return Math.max(1, Math.min(MAX_HYPERBOLA_LEVEL, Math.round(value)));
}

function getHyperbolaLevels() {
  const spacing = sanitizeHyperbolaSpacing(state.hyperbolaSpacing);
  const levels = [];

  for (let level = spacing; level <= MAX_HYPERBOLA_LEVEL; level += spacing) {
    levels.push(level);
  }

  return levels;
}

function getLightConeMarkerStep() {
  return sanitizeHyperbolaSpacing(state.hyperbolaSpacing);
}

function sanitizeBellSeparation(value) {
  if (!Number.isFinite(value)) {
    return 4;
  }

  return Math.max(MIN_BELL_SEPARATION, Math.min(MAX_BELL_SEPARATION, value));
}

function sanitizeBellAcceleration(value) {
  if (!Number.isFinite(value)) {
    return 0.05;
  }

  return Math.max(MIN_BELL_ACCELERATION, Math.min(MAX_BELL_ACCELERATION, value));
}

function sanitizeBellProbeTime(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_BELL_PROBE_TIME, value));
}

function otherBellRocket(rocket) {
  return rocket === "rear" ? "front" : "rear";
}

function bellRocketOffset(rocket) {
  return rocket === "front" ? state.bell.separation : 0;
}

function bellRocketXAtTime(rocket, referenceTime) {
  const offset = bellRocketOffset(rocket);
  if (referenceTime <= 0) {
    return offset;
  }

  const scaledTime = state.bell.acceleration * referenceTime;
  return offset + (Math.sqrt(1 + scaledTime * scaledTime) - 1) / state.bell.acceleration;
}

function bellRocketPointAtTime(rocket, referenceTime) {
  return {
    x: bellRocketXAtTime(rocket, referenceTime),
    t: referenceTime
  };
}

function bellRocketVelocityAtTime(referenceTime) {
  if (referenceTime <= 0) {
    return 0;
  }

  const scaledTime = state.bell.acceleration * referenceTime;
  return scaledTime / Math.sqrt(1 + scaledTime * scaledTime);
}

function bellRocketRapidityAtTime(referenceTime) {
  if (referenceTime <= 0) {
    return 0;
  }

  return Math.asinh(state.bell.acceleration * referenceTime);
}

function bellRocketProperTimeAtTime(referenceTime) {
  if (referenceTime < 0) {
    return null;
  }

  if (referenceTime === 0) {
    return 0;
  }

  return bellRocketRapidityAtTime(referenceTime) / state.bell.acceleration;
}

function getBellRocketState(rocket, referenceTime) {
  const safeTime = Number.isFinite(referenceTime) ? referenceTime : 0;
  return {
    rocket,
    referenceTime: safeTime,
    point: bellRocketPointAtTime(rocket, safeTime),
    velocity: bellRocketVelocityAtTime(safeTime),
    rapidity: bellRocketRapidityAtTime(safeTime),
    properTime: bellRocketProperTimeAtTime(safeTime)
  };
}

function getBellProbeState() {
  return getBellRocketState(state.bell.probeRocket, state.bell.probeTime);
}

function findBellSimultaneousReferenceTime(probeState, rocket) {
  const beta = probeState.velocity;
  if (Math.abs(beta) < 1e-9) {
    return probeState.referenceTime;
  }

  const f = (referenceTime) => (
    referenceTime -
    probeState.referenceTime -
    beta * (bellRocketXAtTime(rocket, referenceTime) - probeState.point.x)
  );
  let lower = -Math.max(8, state.bell.separation * 2 + probeState.referenceTime + 2);
  let upper = Math.max(8, state.bell.separation * 2 + probeState.referenceTime + 2);

  while (f(lower) > 0) {
    lower *= 1.8;
  }

  while (f(upper) < 0) {
    upper *= 1.8;
  }

  for (let i = 0; i < 70; i += 1) {
    const midpoint = (lower + upper) * 0.5;
    if (f(midpoint) < 0) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }

  return (lower + upper) * 0.5;
}

function getBellScenarioGeometry() {
  if (!state.bell.enabled) {
    return null;
  }

  const probe = getBellProbeState();
  const otherRocket = otherBellRocket(probe.rocket);
  const simultaneousTime = findBellSimultaneousReferenceTime(probe, otherRocket);
  const simultaneous = getBellRocketState(otherRocket, simultaneousTime);
  const labSimultaneous = getBellRocketState(otherRocket, probe.referenceTime);

  return {
    probe,
    otherRocket,
    simultaneous,
    labSimultaneous,
    localGap: intervalMetrics(probe.point, simultaneous.point),
    labGap: intervalMetrics(probe.point, labSimultaneous.point)
  };
}

function sanitizeTwinSpeed(value) {
  if (!Number.isFinite(value)) {
    return 0.6;
  }

  return Math.max(MIN_TWIN_SPEED, Math.min(MAX_TWIN_SPEED, value));
}

function sanitizeTwinHalfTripProperTime(value) {
  if (!Number.isFinite(value)) {
    return 4;
  }

  return Math.max(MIN_TWIN_HALF_TRIP_PROPER_TIME, Math.min(MAX_TWIN_HALF_TRIP_PROPER_TIME, value));
}

function getTwinTotalProperTime(halfTripProperTime = state.twin.halfTripProperTime) {
  return sanitizeTwinHalfTripProperTime(halfTripProperTime) * 2;
}

function sanitizeTwinProbeProperTime(value, halfTripProperTime = state.twin.halfTripProperTime) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(getTwinTotalProperTime(halfTripProperTime), value));
}

function getTwinTurnHalfWidth(parameters) {
  if (!parameters.smoothTurnaround) {
    return 0;
  }

  return Math.min(
    TWIN_TURN_SMOOTH_HALF_WIDTH,
    parameters.halfTripProperTime * TWIN_TURN_SMOOTH_FRACTION,
    parameters.halfTripProperTime * 0.45
  );
}

function twinPhaseAtProperTime(properTime, parameters) {
  const halfWidth = getTwinTurnHalfWidth(parameters);
  const turnStart = parameters.halfTripProperTime - halfWidth;
  const turnEnd = parameters.halfTripProperTime + halfWidth;
  if (properTime < turnStart) {
    return "outbound";
  }
  if (properTime > turnEnd) {
    return "inbound";
  }
  return halfWidth > 1e-6 ? "turnaround" : "turnaround";
}

function twinFrameDefinedAtProperTime(properTime, parameters) {
  return parameters.smoothTurnaround || Math.abs(properTime - parameters.halfTripProperTime) > 1e-4;
}

function getTwinSharpKinematics(parameters) {
  const rapidityValue = rapidity(parameters.speed);
  return {
    rapidity: rapidityValue,
    dx: Math.sinh(rapidityValue),
    dt: Math.cosh(rapidityValue)
  };
}

function sharpTwinPointAtProperTime(properTime, parameters) {
  const tau = sanitizeTwinProbeProperTime(properTime, parameters.halfTripProperTime);
  const { dx, dt } = getTwinSharpKinematics(parameters);
  if (tau <= parameters.halfTripProperTime) {
    return {
      x: dx * tau,
      t: dt * tau
    };
  }

  return {
    x: dx * (2 * parameters.halfTripProperTime - tau),
    t: dt * tau
  };
}

function sharpTwinTangentAtProperTime(properTime, parameters) {
  const { dx, dt } = getTwinSharpKinematics(parameters);
  return {
    x: properTime <= parameters.halfTripProperTime ? dx : -dx,
    t: dt
  };
}

function hermiteBasis(u) {
  return {
    h00: 2 * u * u * u - 3 * u * u + 1,
    h10: u * u * u - 2 * u * u + u,
    h01: -2 * u * u * u + 3 * u * u,
    h11: u * u * u - u * u
  };
}

function hermiteDerivativeBasis(u) {
  return {
    h00: 6 * u * u - 6 * u,
    h10: 3 * u * u - 4 * u + 1,
    h01: -6 * u * u + 6 * u,
    h11: 3 * u * u - 2 * u
  };
}

function smoothTwinConnectorAtProperTime(properTime, parameters) {
  const halfWidth = getTwinTurnHalfWidth(parameters);
  if (halfWidth < 1e-6) {
    const point = sharpTwinPointAtProperTime(properTime, parameters);
    const tangent = sharpTwinTangentAtProperTime(properTime, parameters);
    return { point, tangent };
  }

  const turnStart = parameters.halfTripProperTime - halfWidth;
  const turnEnd = parameters.halfTripProperTime + halfWidth;
  const duration = turnEnd - turnStart;
  const u = Math.max(0, Math.min(1, (properTime - turnStart) / duration));
  const startPoint = sharpTwinPointAtProperTime(turnStart, parameters);
  const endPoint = sharpTwinPointAtProperTime(turnEnd, parameters);
  const startTangent = sharpTwinTangentAtProperTime(turnStart, parameters);
  const endTangent = sharpTwinTangentAtProperTime(turnEnd, parameters);
  const basis = hermiteBasis(u);
  const derivativeBasis = hermiteDerivativeBasis(u);

  const point = {
    x:
      basis.h00 * startPoint.x +
      basis.h10 * duration * startTangent.x +
      basis.h01 * endPoint.x +
      basis.h11 * duration * endTangent.x,
    t:
      basis.h00 * startPoint.t +
      basis.h10 * duration * startTangent.t +
      basis.h01 * endPoint.t +
      basis.h11 * duration * endTangent.t
  };
  const tangent = {
    x:
      (derivativeBasis.h00 * startPoint.x +
        derivativeBasis.h10 * duration * startTangent.x +
        derivativeBasis.h01 * endPoint.x +
        derivativeBasis.h11 * duration * endTangent.x) / duration,
    t:
      (derivativeBasis.h00 * startPoint.t +
        derivativeBasis.h10 * duration * startTangent.t +
        derivativeBasis.h01 * endPoint.t +
        derivativeBasis.h11 * duration * endTangent.t) / duration
  };

  return { point, tangent };
}

function twinCurveStateAtProperTime(properTime, parameters) {
  const tau = sanitizeTwinProbeProperTime(properTime, parameters.halfTripProperTime);
  const halfWidth = getTwinTurnHalfWidth(parameters);
  const turnStart = parameters.halfTripProperTime - halfWidth;
  const turnEnd = parameters.halfTripProperTime + halfWidth;

  let point;
  let tangent;
  if (halfWidth > 1e-6 && tau > turnStart && tau < turnEnd) {
    ({ point, tangent } = smoothTwinConnectorAtProperTime(tau, parameters));
  } else {
    point = sharpTwinPointAtProperTime(tau, parameters);
    tangent = sharpTwinTangentAtProperTime(tau, parameters);
  }

  const velocity = Math.abs(tangent.t) < 1e-9 ? 0 : clampBetaToControlRange(tangent.x / tangent.t);
  return {
    properTime: tau,
    point,
    tangent,
    rapidity: rapidity(velocity),
    velocity,
    phase: twinPhaseAtProperTime(tau, parameters),
    frameDefined: twinFrameDefinedAtProperTime(tau, parameters)
  };
}

function getTwinCurveParameters() {
  return {
    speed: sanitizeTwinSpeed(state.twin.speed),
    halfTripProperTime: sanitizeTwinHalfTripProperTime(state.twin.halfTripProperTime),
    smoothTurnaround: state.twin.smoothTurnaround
  };
}

function buildTwinCurveData(parameters) {
  const totalProperTime = getTwinTotalProperTime(parameters.halfTripProperTime);
  const sampleCount = Math.max(TWIN_MIN_SAMPLE_COUNT, Math.ceil(totalProperTime * TWIN_SAMPLE_DENSITY));
  const step = totalProperTime / sampleCount;
  const samples = [];
  for (let i = 0; i <= sampleCount; i += 1) {
    const tau = i * step;
    const sample = twinCurveStateAtProperTime(tau, parameters);
    samples.push({
      tau,
      x: sample.point.x,
      t: sample.point.t
    });
  }

  return {
    key: JSON.stringify(parameters),
    parameters,
    totalProperTime,
    sampleCount,
    step,
    turnHalfWidth: getTwinTurnHalfWidth(parameters),
    samples
  };
}

function getTwinCurveData() {
  const parameters = getTwinCurveParameters();
  const key = JSON.stringify(parameters);
  if (twinCurveCache && twinCurveCache.key === key) {
    return twinCurveCache;
  }

  twinCurveCache = buildTwinCurveData(parameters);
  return twinCurveCache;
}

function sampleTwinCurveAtProperTime(properTime, curveData = getTwinCurveData()) {
  return twinCurveStateAtProperTime(properTime, curveData.parameters);
}

function getTwinScenarioGeometry() {
  if (!state.twin.enabled) {
    return null;
  }

  const curve = getTwinCurveData();
  const probe = sampleTwinCurveAtProperTime(state.twin.probeProperTime, curve);
  const departure = sampleTwinCurveAtProperTime(0, curve);
  const turnaround = sampleTwinCurveAtProperTime(curve.parameters.halfTripProperTime, curve);
  const reunion = sampleTwinCurveAtProperTime(curve.totalProperTime, curve);
  const homeSimultaneousAge = probe.frameDefined
    ? probe.point.t - probe.velocity * probe.point.x
    : null;
  const homeSimultaneousPoint = homeSimultaneousAge == null
    ? null
    : { x: 0, t: homeSimultaneousAge };

  return {
    curve,
    probe,
    departure,
    turnaround,
    reunion,
    homeSimultaneousAge,
    homeSimultaneousPoint,
    localGap: homeSimultaneousPoint ? intervalMetrics(probe.point, homeSimultaneousPoint) : null,
    reunionAgeGap: reunion.point.t - curve.totalProperTime
  };
}

function findNearestTwinProbeProperTime(screenPoint) {
  const curve = getTwinCurveData();
  let bestProperTime = curve.samples[0]?.tau ?? 0;
  let bestDistanceSquared = Infinity;

  for (const sample of curve.samples) {
    const samplePoint = worldToScreen({ x: sample.x, t: sample.t });
    const distanceSquared = pointDistanceSquared(screenPoint, samplePoint);
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestProperTime = sample.tau;
    }
  }

  return sanitizeTwinProbeProperTime(bestProperTime, curve.parameters.halfTripProperTime);
}

function findNearestBellProbeTime(screenPoint, rocket) {
  let bestTime = sanitizeBellProbeTime(screenToWorld(screenPoint).t);
  let bestDistanceSquared = Infinity;
  let span = 2.2;

  for (let pass = 0; pass < 5; pass += 1) {
    const start = Math.max(0, bestTime - span);
    const end = Math.min(MAX_BELL_PROBE_TIME, bestTime + span);
    const steps = 16;

    for (let i = 0; i <= steps; i += 1) {
      const sampleTime = start + ((end - start) * i) / steps;
      const samplePoint = worldToScreen(bellRocketPointAtTime(rocket, sampleTime));
      const distanceSquared = pointDistanceSquared(screenPoint, samplePoint);
      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestTime = sampleTime;
      }
    }

    span *= 0.35;
  }

  return sanitizeBellProbeTime(bestTime);
}

function applyBellProbeFrameLock() {
  if (!state.bell.enabled || !state.bell.followProbeFrame) {
    return false;
  }

  const lockedBeta = clampBetaToControlRange(getBellProbeState().velocity);
  if (Math.abs(lockedBeta - state.beta) < 1e-9) {
    return false;
  }

  state.beta = lockedBeta;
  return true;
}

function applyTwinProbeFrameLock() {
  if (!state.twin.enabled || !state.twin.followProbeFrame) {
    return false;
  }

  const geometry = getTwinScenarioGeometry();
  if (!geometry || !geometry.probe.frameDefined) {
    return false;
  }

  const lockedBeta = clampBetaToControlRange(geometry.probe.velocity);
  if (Math.abs(lockedBeta - state.beta) < 1e-9) {
    return false;
  }

  state.beta = lockedBeta;
  return true;
}

function applyScenarioProbeFrameLock() {
  if (state.twin.enabled && state.twin.followProbeFrame) {
    return applyTwinProbeFrameLock();
  }
  return applyBellProbeFrameLock();
}

function velocityControlsLockedByScenario() {
  return (
    (state.bell.enabled && state.bell.followProbeFrame) ||
    (state.twin.enabled && state.twin.followProbeFrame)
  );
}

function getBellBoostedFrameXShift() {
  if (
    !state.bell.enabled ||
    !state.bell.followProbeFrame ||
    !state.bell.pinProbeX
  ) {
    return 0;
  }

  const probe = getBellProbeState();
  return bellRocketOffset(probe.rocket) - lorentz(probe.point, state.beta).x;
}

function worldToBoostedFrame(point) {
  const boostedPoint = lorentz(point, state.beta);
  return {
    x: boostedPoint.x + getBellBoostedFrameXShift(),
    t: boostedPoint.t
  };
}

function boostedFrameToWorld(point) {
  return lorentz({
    x: point.x - getBellBoostedFrameXShift(),
    t: point.t
  }, renderBeta());
}

function getBellDisplayXTranslation(amount, transform) {
  if (
    !state.bell.enabled ||
    !state.bell.followProbeFrame ||
    !state.bell.pinProbeX
  ) {
    return 0;
  }

  const probe = getBellProbeState();
  const transformedProbeX = transform.a * probe.point.x + transform.b * probe.point.t;
  const launchX = bellRocketOffset(probe.rocket);
  return launchX - transformedProbeX;
}

function renderBeta() {
  return -state.beta;
}

function displayRectificationAmount() {
  return state.rectifyViewEnabled ? state.rectifyAmount : 0;
}

function displayBetaForAmount(amount) {
  if (amount < 1e-9 || Math.abs(state.beta) < 1e-9) {
    return 0;
  }

  return betaFromRapidity(rapidity(state.beta) * amount);
}

function lorentz(point, beta) {
  const g = gamma(beta);
  return {
    x: g * (point.x - beta * point.t),
    t: g * (point.t - beta * point.x)
  };
}

function getDisplayTransformMatrixForAmount(amount) {
  const displayBeta = displayBetaForAmount(amount);
  if (Math.abs(displayBeta) < 1e-9) {
    const identityTransform = {
      a: 1,
      b: 0,
      determinant: 1
    };
    return {
      ...identityTransform,
      offsetX: getBellDisplayXTranslation(amount, identityTransform),
      offsetT: 0
    };
  }

  const g = gamma(displayBeta);
  const a = g;
  const b = -g * displayBeta;
  const linearTransform = {
    a,
    b,
    determinant: a * a - b * b
  };
  return {
    ...linearTransform,
    offsetX: getBellDisplayXTranslation(amount, linearTransform),
    offsetT: 0
  };
}

function getDisplayTransformMatrix() {
  return getDisplayTransformMatrixForAmount(displayRectificationAmount());
}

function applyDisplayTransform(point) {
  const { a, b, offsetX = 0, offsetT = 0 } = getDisplayTransformMatrix();
  return {
    x: a * point.x + b * point.t + offsetX,
    t: b * point.x + a * point.t + offsetT
  };
}

function invertDisplayTransformWithMatrix(point, matrix) {
  const { a, b, determinant, offsetX = 0, offsetT = 0 } = matrix;
  if (Math.abs(determinant) < 1e-9) {
    return point;
  }

  const translatedPoint = {
    x: point.x - offsetX,
    t: point.t - offsetT
  };

  return {
    x: (a * translatedPoint.x - b * translatedPoint.t) / determinant,
    t: (-b * translatedPoint.x + a * translatedPoint.t) / determinant
  };
}

function invertDisplayTransform(point) {
  return invertDisplayTransformWithMatrix(point, getDisplayTransformMatrix());
}

function worldToScreen(point) {
  const displayPoint = applyDisplayTransform(point);
  if (renderViewportOverride) {
    return {
      x: (displayPoint.x - renderViewportOverride.xMin) * renderViewportOverride.scale,
      y: (renderViewportOverride.tMax - displayPoint.t) * renderViewportOverride.scale
    };
  }

  return {
    x: view.width * 0.5 + displayPoint.x * state.scale,
    y: view.height * 0.5 - displayPoint.t * state.scale
  };
}

function referenceWorldToScreen(point) {
  if (renderViewportOverride) {
    return {
      x: (point.x - renderViewportOverride.xMin) * renderViewportOverride.scale,
      y: (renderViewportOverride.tMax - point.t) * renderViewportOverride.scale
    };
  }

  return {
    x: view.width * 0.5 + point.x * state.scale,
    y: view.height * 0.5 - point.t * state.scale
  };
}

function screenToWorld(point) {
  if (renderViewportOverride) {
    const displayPoint = {
      x: renderViewportOverride.xMin + point.x / renderViewportOverride.scale,
      t: renderViewportOverride.tMax - point.y / renderViewportOverride.scale
    };
    return invertDisplayTransform(displayPoint);
  }

  const displayPoint = {
    x: (point.x - view.width * 0.5) / state.scale,
    t: (view.height * 0.5 - point.y) / state.scale
  };
  return invertDisplayTransform(displayPoint);
}

function getReferenceWorldBounds() {
  if (renderViewportOverride) {
    return {
      maxX: Math.max(Math.abs(renderViewportOverride.xMin), Math.abs(renderViewportOverride.xMax)),
      maxT: Math.max(Math.abs(renderViewportOverride.tMin), Math.abs(renderViewportOverride.tMax))
    };
  }

  return {
    maxX: view.width * 0.5 / state.scale,
    maxT: view.height * 0.5 / state.scale
  };
}

function getWorldBoundsForDisplayAmount(amount) {
  const matrix = getDisplayTransformMatrixForAmount(amount);
  const corners = [
    { x: 0, y: 0 },
    { x: view.width, y: 0 },
    { x: 0, y: view.height },
    { x: view.width, y: view.height }
  ].map((corner) => {
    let displayPoint;
    if (renderViewportOverride) {
      displayPoint = {
        x: renderViewportOverride.xMin + corner.x / renderViewportOverride.scale,
        t: renderViewportOverride.tMax - corner.y / renderViewportOverride.scale
      };
    } else {
      displayPoint = {
        x: (corner.x - view.width * 0.5) / state.scale,
        t: (view.height * 0.5 - corner.y) / state.scale
      };
    }

    return invertDisplayTransformWithMatrix(displayPoint, matrix);
  });

  let maxX = 0;
  let maxT = 0;
  for (const corner of corners) {
    maxX = Math.max(maxX, Math.abs(corner.x));
    maxT = Math.max(maxT, Math.abs(corner.t));
  }

  return {
    maxX,
    maxT
  };
}

function getStableHyperbolaExtents() {
  const referenceBounds = getReferenceWorldBounds();
  const fullyRectifiedBounds = getWorldBoundsForDisplayAmount(1);
  return {
    xExtent: Math.max(referenceBounds.maxX * 1.1, fullyRectifiedBounds.maxX * 1.1, MIN_HYPERBOLA_X_EXTENT),
    tExtent: Math.max(referenceBounds.maxT * 1.1, fullyRectifiedBounds.maxT * 1.1, MIN_HYPERBOLA_X_EXTENT)
  };
}

function getWorldBounds() {
  const corners = [
    { x: 0, y: 0 },
    { x: view.width, y: 0 },
    { x: 0, y: view.height },
    { x: view.width, y: view.height }
  ].map((corner) => screenToWorld(corner));

  let maxX = 0;
  let maxT = 0;
  for (const corner of corners) {
    maxX = Math.max(maxX, Math.abs(corner.x));
    maxT = Math.max(maxT, Math.abs(corner.t));
  }

  return {
    maxX,
    maxT
  };
}

function getBoostedFrameBounds() {
  const corners = [
    { x: 0, y: 0 },
    { x: view.width, y: 0 },
    { x: 0, y: view.height },
    { x: view.width, y: view.height }
  ].map((corner) => worldToBoostedFrame(screenToWorld(corner)));

  let maxX = 0;
  let maxT = 0;
  for (const corner of corners) {
    maxX = Math.max(maxX, Math.abs(corner.x));
    maxT = Math.max(maxT, Math.abs(corner.t));
  }

  return {
    maxX,
    maxT
  };
}

function getCurrentReferenceViewport() {
  return {
    xMin: -view.width * 0.5 / state.scale,
    xMax: view.width * 0.5 / state.scale,
    tMin: -view.height * 0.5 / state.scale,
    tMax: view.height * 0.5 / state.scale
  };
}

function setCopyDiagramStatus(message, options = {}) {
  const { isError = false, persist = false } = options;
  if (!copyDiagramStatus) {
    return;
  }

  copyDiagramStatus.textContent = message;
  copyDiagramStatus.classList.toggle("error", isError);

  if (copyDiagramStatusTimeoutId != null) {
    window.clearTimeout(copyDiagramStatusTimeoutId);
    copyDiagramStatusTimeoutId = null;
  }

  if (!message || persist) {
    return;
  }

  copyDiagramStatusTimeoutId = window.setTimeout(() => {
    copyDiagramStatus.textContent = "";
    copyDiagramStatus.classList.remove("error");
    copyDiagramStatusTimeoutId = null;
  }, 2200);
}

function canvasToBlob(sourceCanvas, type = "image/png") {
  return new Promise((resolve) => {
    sourceCanvas.toBlob((blob) => resolve(blob), type);
  });
}

function syncLastUpdatedNote() {
  if (!lastUpdatedNote) {
    return;
  }

  const rawLastModified = document.lastModified;
  const parsedDate = rawLastModified ? new Date(rawLastModified) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    lastUpdatedNote.textContent = "";
    return;
  }

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(parsedDate);
  lastUpdatedNote.textContent = `Last updated: ${formattedDate}`;
}

function setTutorialOpen(isOpen) {
  if (!tutorialPopover || !tutorialTrigger || !tutorialPanel) {
    return;
  }

  tutorialPopover.classList.toggle("is-open", isOpen);
  tutorialPanel.hidden = !isOpen;
  tutorialTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function openCopyDiagramPopover() {
  if (!copyDiagramPopover) {
    return;
  }

  copyXMinInput.value = DEFAULT_COPY_VIEWPORT.xMin.toFixed(1);
  copyXMaxInput.value = DEFAULT_COPY_VIEWPORT.xMax.toFixed(1);
  copyTMinInput.value = DEFAULT_COPY_VIEWPORT.tMin.toFixed(1);
  copyTMaxInput.value = DEFAULT_COPY_VIEWPORT.tMax.toFixed(1);
  copyDiagramPopover.hidden = false;
  setCopyDiagramStatus("");
  copyXMinInput.focus();
  copyXMinInput.select();
}

function closeCopyDiagramPopover() {
  if (!copyDiagramPopover) {
    return;
  }

  copyDiagramPopover.hidden = true;
}

function getTextStrokeLayout(stroke, context = ctx) {
  if (!stroke || stroke.kind !== "text" || !stroke.points?.length) {
    return null;
  }

  const anchor = worldToScreen(stroke.points[0]);
  const text = String(stroke.text || "").trim();
  if (!text) {
    return null;
  }

  context.save();
  context.font = stroke.style?.font || TEXT_STROKE_FONT;
  const width = context.measureText(text).width;
  context.restore();

  return {
    anchor,
    text,
    width,
    height: TEXT_STROKE_FONT_SIZE,
    box: {
      x: anchor.x,
      y: anchor.y,
      width: width + TEXT_STROKE_PADDING_X * 2,
      height: TEXT_STROKE_LINE_HEIGHT + TEXT_STROKE_PADDING_Y * 2 - 1
    }
  };
}

function positionTextEditorPopover() {
  if (!textEditorPopover || !state.textEditor.open || !state.textEditor.point) {
    return;
  }

  const screenPoint = worldToScreen(state.textEditor.point);
  const wrapRect = canvasWrap?.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  if (!wrapRect || !canvasRect) {
    return;
  }

  const offsetLeft = canvasRect.left - wrapRect.left;
  const offsetTop = canvasRect.top - wrapRect.top;
  const popoverWidth = textEditorPopover.offsetWidth || 176;
  const popoverHeight = textEditorPopover.offsetHeight || 74;
  const maxLeft = Math.max(8, canvas.clientWidth - popoverWidth - 8);
  const maxTop = Math.max(8, canvas.clientHeight - popoverHeight - 8);
  const left = offsetLeft + Math.max(8, Math.min(screenPoint.x + 10, maxLeft));
  const top = offsetTop + Math.max(8, Math.min(screenPoint.y + 10, maxTop));

  textEditorPopover.style.left = `${left}px`;
  textEditorPopover.style.top = `${top}px`;
}

function openTextEditor(point, options = {}) {
  if (!textEditorPopover || !textEditorInput) {
    return;
  }

  const { strokeIndex = -1, initialText = "" } = options;
  state.textEditor.open = true;
  state.textEditor.point = { ...point };
  state.textEditor.strokeIndex = strokeIndex;
  textEditorPopover.hidden = false;
  textEditorInput.value = initialText;
  positionTextEditorPopover();
  textEditorInput.focus();
  textEditorInput.select();
}

function closeTextEditor() {
  if (!textEditorPopover) {
    return;
  }

  state.textEditor.open = false;
  state.textEditor.point = null;
  state.textEditor.strokeIndex = -1;
  textEditorPopover.hidden = true;
}

function commitTextEditor() {
  if (!state.textEditor.open || !textEditorInput) {
    return;
  }

  const text = textEditorInput.value.trim();
  const strokeIndex = state.textEditor.strokeIndex;
  const anchorPoint = state.textEditor.point ? { ...state.textEditor.point } : null;

  if (!text || !anchorPoint) {
    if (strokeIndex >= 0 && strokeIndex < state.strokes.length && !text) {
      state.strokes.splice(strokeIndex, 1);
    }
    closeTextEditor();
    draw();
    return;
  }

  if (strokeIndex >= 0 && strokeIndex < state.strokes.length) {
    const stroke = state.strokes[strokeIndex];
    if (stroke?.kind === "text") {
      stroke.text = text;
      stroke.points[0] = anchorPoint;
      stroke.style = {
        ...(stroke.style || {}),
        color: state.strokeColor,
        font: TEXT_STROKE_FONT,
        fontSize: TEXT_STROKE_FONT_SIZE
      };
    }
  } else {
    const groupId = state.nextGroupId;
    state.nextGroupId += 1;
    state.strokes.push({
      points: [anchorPoint],
      kind: "text",
      text,
      groupId,
      style: {
        color: state.strokeColor,
        font: TEXT_STROKE_FONT,
        fontSize: TEXT_STROKE_FONT_SIZE,
        dash: []
      }
    });
  }

  closeTextEditor();
  draw();
}

function syncAxisVisibilityEditControls() {
  if (axisHideLineModeInput) {
    axisHideLineModeInput.checked = state.axisVisibilityEdit.lines;
  }
  if (axisHideLabelModeInput) {
    axisHideLabelModeInput.checked = state.axisVisibilityEdit.labels;
  }
  if (gridParallelAxisInput) {
    gridParallelAxisInput.value = state.gridParallelAxis;
  }
}

function setAxisVisibilityPopoverOpen(isOpen) {
  if (!axisVisibilityPopover) {
    return;
  }

  axisVisibilityPopover.hidden = !isOpen;
  axisVisibilityButton?.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function closeAxisVisibilityPopover() {
  if (!axisVisibilityPopover) {
    return;
  }

  setAxisVisibilityPopoverOpen(false);
  state.axisVisibilityEdit.lines = false;
  state.axisVisibilityEdit.labels = false;
  syncAxisVisibilityEditControls();
  syncToolControls();
}

function openAxisVisibilityPopover() {
  if (!axisVisibilityPopover) {
    return;
  }

  setAxisVisibilityPopoverOpen(true);
  axisHideLineModeInput?.focus();
}

function getCopyDiagramViewport() {
  const xMin = Number.parseFloat(copyXMinInput.value);
  const xMax = Number.parseFloat(copyXMaxInput.value);
  const tMin = Number.parseFloat(copyTMinInput.value);
  const tMax = Number.parseFloat(copyTMaxInput.value);
  if (![xMin, xMax, tMin, tMax].every(Number.isFinite)) {
    throw new Error("Enter numeric crop bounds.");
  }

  if (xMax <= xMin || tMax <= tMin) {
    throw new Error("Max bounds must be greater than min bounds.");
  }

  let exportScale = Math.max(state.scale, 30);
  let width = Math.max(1, Math.round((xMax - xMin) * exportScale));
  let height = Math.max(1, Math.round((tMax - tMin) * exportScale));
  const maxDimension = 2400;
  const largestDimension = Math.max(width, height);
  if (largestDimension > maxDimension) {
    const factor = maxDimension / largestDimension;
    exportScale *= factor;
    width = Math.max(1, Math.round((xMax - xMin) * exportScale));
    height = Math.max(1, Math.round((tMax - tMin) * exportScale));
  }

  return {
    xMin,
    xMax,
    tMin,
    tMax,
    scale: exportScale,
    width,
    height
  };
}

function renderDiagramToCanvas(targetCanvas, viewport) {
  const exportContext = targetCanvas.getContext("2d");
  const previousContext = ctx;
  const previousWidth = view.width;
  const previousHeight = view.height;
  const previousViewportOverride = renderViewportOverride;

  targetCanvas.width = viewport.width;
  targetCanvas.height = viewport.height;
  ctx = exportContext;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  view.width = viewport.width;
  view.height = viewport.height;
  renderViewportOverride = viewport;
  draw();

  renderViewportOverride = previousViewportOverride;
  view.width = previousWidth;
  view.height = previousHeight;
  ctx = previousContext;
  draw();
}

async function copyDiagramToClipboard(viewport) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    setCopyDiagramStatus("Clipboard unavailable", { isError: true });
    return;
  }

  copyDiagramButton.disabled = true;
  confirmCopyDiagramButton.disabled = true;
  cancelCopyDiagramButton.disabled = true;
  setCopyDiagramStatus("Copying...", { persist: true });

  try {
    const exportCanvas = document.createElement("canvas");
    renderDiagramToCanvas(exportCanvas, viewport);

    const blob = await canvasToBlob(exportCanvas);
    if (!blob) {
      throw new Error("Unable to export diagram image.");
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    setCopyDiagramStatus("Copied");
    closeCopyDiagramPopover();
  } catch (error) {
    console.error(error);
    setCopyDiagramStatus(error.message || "Copy failed", { isError: true });
  } finally {
    copyDiagramButton.disabled = false;
    confirmCopyDiagramButton.disabled = false;
    cancelCopyDiagramButton.disabled = false;
  }
}

function eventToScreenPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function pointDistanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function snapPointToOrigin(point, thresholdPx = 10) {
  const origin = { x: 0, t: 0 };
  const screenPoint = worldToScreen(point);
  const originScreenPoint = worldToScreen(origin);
  if (pointDistanceSquared(screenPoint, originScreenPoint) > thresholdPx * thresholdPx) {
    return point;
  }

  return origin;
}

function snapPointToReferenceGrid(point, thresholdPx = 10) {
  const snappedPoint = {
    x: Math.round(point.x),
    t: Math.round(point.t)
  };
  const screenPoint = worldToScreen(point);
  const snappedScreenPoint = worldToScreen(snappedPoint);
  if (pointDistanceSquared(screenPoint, snappedScreenPoint) > thresholdPx * thresholdPx) {
    return point;
  }

  return snappedPoint;
}

function snapPointToBoostedGrid(point, thresholdPx = 10) {
  const boostedPoint = worldToBoostedFrame(point);
  const snappedBoostedPoint = {
    x: Math.round(boostedPoint.x),
    t: Math.round(boostedPoint.t)
  };
  const snappedPoint = boostedFrameToWorld(snappedBoostedPoint);
  const screenPoint = worldToScreen(point);
  const snappedScreenPoint = worldToScreen(snappedPoint);
  if (pointDistanceSquared(screenPoint, snappedScreenPoint) > thresholdPx * thresholdPx) {
    return point;
  }

  return snappedPoint;
}

function nearestHyperbolaLevel(level) {
  if (!Number.isFinite(level)) {
    return null;
  }

  const hyperbolaLevels = getHyperbolaLevels();
  let bestLevel = null;
  let bestDelta = Infinity;
  for (const candidate of hyperbolaLevels) {
    const delta = Math.abs(candidate - level);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestLevel = candidate;
    }
  }

  return bestLevel;
}

function snapPointToDisplayedHyperbola(point, thresholdPx = 10) {
  const originSnappedPoint = snapPointToOrigin(point, thresholdPx);
  if (originSnappedPoint.x === 0 && originSnappedPoint.t === 0) {
    return originSnappedPoint;
  }

  const s2 = point.t * point.t - point.x * point.x;
  const magnitude = Math.sqrt(Math.abs(s2));
  if (!Number.isFinite(magnitude) || magnitude < 1e-6) {
    return point;
  }

  const snappedMagnitude = nearestHyperbolaLevel(magnitude);
  if (snappedMagnitude == null) {
    return point;
  }

  const scale = snappedMagnitude / magnitude;
  const snappedPoint = {
    x: point.x * scale,
    t: point.t * scale
  };
  const screenPoint = worldToScreen(point);
  const snappedScreenPoint = worldToScreen(snappedPoint);
  if (pointDistanceSquared(screenPoint, snappedScreenPoint) > thresholdPx * thresholdPx) {
    return point;
  }

  return snappedPoint;
}

function snapPointToActiveGrid(point, thresholdPx = 10) {
  if (state.showReferenceGrid) {
    return snapPointToReferenceGrid(point, thresholdPx);
  }

  if (state.showBoostedGrid) {
    return snapPointToBoostedGrid(point, thresholdPx);
  }

  return point;
}

function hyperbolaClipActive() {
  return state.showHyperboles && state.clipToHyperbolae;
}

function maybeSnapPoint(point, event, options = {}) {
  const { preferHyperbolae = false } = options;
  if (event.altKey) {
    return point;
  }

  if (preferHyperbolae && hyperbolaClipActive()) {
    return snapPointToDisplayedHyperbola(point);
  }

  return snapPointToActiveGrid(point);
}

function pointToSegmentDistanceSquared(point, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const lengthSquared = vx * vx + vy * vy;
  if (lengthSquared < 1e-9) {
    return pointDistanceSquared(point, a);
  }

  const t = ((point.x - a.x) * vx + (point.y - a.y) * vy) / lengthSquared;
  const clamped = Math.max(0, Math.min(1, t));
  const projection = {
    x: a.x + clamped * vx,
    y: a.y + clamped * vy
  };

  return pointDistanceSquared(point, projection);
}

function pointToRectDistanceSquared(point, rect) {
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
  return dx * dx + dy * dy;
}

function transformedStrokeScreenDistance(stroke, screenPoint) {
  if (!stroke || !stroke.points.length) {
    return Infinity;
  }

  if (stroke.kind === "text") {
    const layout = getTextStrokeLayout(stroke);
    if (!layout) {
      return Infinity;
    }
    return Math.sqrt(pointToRectDistanceSquared(screenPoint, layout.box));
  }

  const screenPoints = stroke.points.map((p) => worldToScreen(p));
  if (screenPoints.length === 1) {
    return Math.sqrt(pointDistanceSquared(screenPoint, screenPoints[0]));
  }

  let minDistanceSquared = Infinity;
  for (let i = 1; i < screenPoints.length; i += 1) {
    const d2 = pointToSegmentDistanceSquared(screenPoint, screenPoints[i - 1], screenPoints[i]);
    if (d2 < minDistanceSquared) {
      minDistanceSquared = d2;
    }
  }

  return Math.sqrt(minDistanceSquared);
}

function canRenderStroke(stroke) {
  if (!stroke) {
    return false;
  }

  return !(state.hideAxesAndLines && (stroke.kind === "line" || stroke.kind === "text"));
}

function findTopmostStrokeAtScreenPoint(screenPoint, thresholdPx = 10) {
  let bestIndex = -1;
  let bestDistance = thresholdPx;

  for (let i = state.strokes.length - 1; i >= 0; i -= 1) {
    const stroke = state.strokes[i];
    if (!canRenderStroke(stroke)) {
      continue;
    }

    const d = transformedStrokeScreenDistance(stroke, screenPoint);
    if (d <= bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function getStrokeGroupIndices(strokeIndex) {
  const stroke = state.strokes[strokeIndex];
  if (!stroke) {
    return [];
  }

  const { groupId } = stroke;
  if (groupId == null) {
    return [strokeIndex];
  }

  const indices = [];
  for (let i = 0; i < state.strokes.length; i += 1) {
    if (state.strokes[i].groupId === groupId) {
      indices.push(i);
    }
  }
  return indices;
}

function intervalMetrics(a, b) {
  const dx = b.x - a.x;
  const dt = b.t - a.t;
  const s2 = dt * dt - dx * dx;
  const absS = Math.sqrt(Math.abs(s2));
  let kind = "lightlike";
  if (s2 > 1e-6) {
    kind = "timelike";
  } else if (s2 < -1e-6) {
    kind = "spacelike";
  }

  return {
    dx,
    dt,
    s2,
    absS,
    kind
  };
}

function formatIntervalSquareRoot(metrics) {
  if (metrics.kind === "spacelike") {
    return `${metrics.absS.toFixed(3)}i`;
  }

  if (metrics.kind === "lightlike") {
    return "0";
  }

  return metrics.absS.toFixed(3);
}

function axisVisibilityEditActive() {
  return state.axisVisibilityEdit.lines || state.axisVisibilityEdit.labels;
}

function axisLineVisible(axisId) {
  return state.axisVisibility[axisId]?.lineVisible !== false;
}

function axisLabelVisible(axisId) {
  return state.axisVisibility[axisId]?.labelVisible !== false;
}

function resetAxisVisibilityTargets() {
  axisVisibilityTargets = [];
}

function registerAxisLineTarget(axisId, start, end) {
  axisVisibilityTargets.push({
    type: "line",
    axisId,
    start,
    end
  });
}

function registerAxisLabelTarget(axisId, layout) {
  if (!layout) {
    return;
  }

  axisVisibilityTargets.push({
    type: "label",
    axisId,
    left: layout.x - layout.textWidth * 0.5 - 6,
    right: layout.x + layout.textWidth * 0.5 + 6,
    top: layout.y - layout.halfHeight - 4,
    bottom: layout.y + layout.halfHeight + 4
  });
}

function findAxisVisibilityTarget(screenPoint) {
  if (!axisVisibilityEditActive()) {
    return null;
  }

  if (state.axisVisibilityEdit.labels) {
    for (let i = axisVisibilityTargets.length - 1; i >= 0; i -= 1) {
      const target = axisVisibilityTargets[i];
      if (target.type !== "label") {
        continue;
      }

      if (
        screenPoint.x >= target.left &&
        screenPoint.x <= target.right &&
        screenPoint.y >= target.top &&
        screenPoint.y <= target.bottom
      ) {
        return target;
      }
    }
  }

  if (state.axisVisibilityEdit.lines || state.axisVisibilityEdit.labels) {
    let bestTarget = null;
    let bestDistanceSquared = 11 * 11;
    for (let i = axisVisibilityTargets.length - 1; i >= 0; i -= 1) {
      const target = axisVisibilityTargets[i];
      if (target.type !== "line") {
        continue;
      }

      const distanceSquared = pointToSegmentDistanceSquared(screenPoint, target.start, target.end);
      if (distanceSquared <= bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  return null;
}

function hideAxisVisibilityTarget(target) {
  if (!target) {
    return false;
  }

  const axis = state.axisVisibility[target.axisId];
  if (!axis) {
    return false;
  }

  if (state.axisVisibilityEdit.labels && !state.axisVisibilityEdit.lines) {
    axis.labelVisible = false;
  } else if (target.type === "line") {
    axis.lineVisible = false;
    axis.labelVisible = false;
  } else if (target.type === "label") {
    axis.labelVisible = false;
  } else {
    return false;
  }

  draw();
  return true;
}

function resetAxisVisibility() {
  state.axisVisibility = createAxisVisibilityState();
  draw();
}

function pointIsAtOrigin(point, epsilon = 1e-6) {
  return Math.abs(point.x) < epsilon && Math.abs(point.t) < epsilon;
}

function getHyperbolaClippedIntervalOverride(stroke) {
  if (!stroke || stroke.kind !== "line" || stroke.points.length < 2) {
    return null;
  }

  const [start, end] = stroke.points;
  const startAtOrigin = pointIsAtOrigin(start);
  const endAtOrigin = pointIsAtOrigin(end);
  if (startAtOrigin === endAtOrigin) {
    return null;
  }

  const measuredPoint = startAtOrigin ? end : start;
  const s2 = measuredPoint.t * measuredPoint.t - measuredPoint.x * measuredPoint.x;
  const magnitude = Math.sqrt(Math.abs(s2));
  const snappedMagnitude = nearestHyperbolaLevel(magnitude);
  if (snappedMagnitude == null || Math.abs(magnitude - snappedMagnitude) > 1e-4) {
    return null;
  }

  return {
    absS: snappedMagnitude,
    kind: s2 >= 0 ? "timelike" : "spacelike"
  };
}

function collectIntervalMarkers(points, spacing = 1, maxMarkers = 900) {
  if (!points || points.length < 2) {
    return [];
  }

  const markers = [];
  let distanceToNext = spacing;

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const metrics = intervalMetrics(a, b);
    if (metrics.absS <= 1e-8) {
      distanceToNext = spacing;
      continue;
    }

    const segmentIntervalLength = metrics.absS;
    let travelled = distanceToNext;
    while (travelled <= segmentIntervalLength + 1e-8) {
      const u = travelled / segmentIntervalLength;
      markers.push({
        x: a.x + (b.x - a.x) * u,
        t: a.t + (b.t - a.t) * u
      });

      if (markers.length >= maxMarkers) {
        return markers;
      }

      travelled += spacing;
    }

    distanceToNext = travelled - segmentIntervalLength;
  }

  return markers;
}

function syncToolControls() {
  if (axisVisibilityEditActive()) {
    canvas.style.cursor = "pointer";
    return;
  }

  if (state.activeTool === "move") {
    canvas.style.cursor = "grab";
    return;
  }

  if (state.activeTool === "text") {
    canvas.style.cursor = "text";
    return;
  }

  if (state.activeTool === "point" || state.activeTool === "eraser") {
    canvas.style.cursor = "crosshair";
    return;
  }

  canvas.style.cursor = "default";
}

function shouldDrawGridFamily(parallelAxisId) {
  return state.gridParallelAxis === "all" || state.gridParallelAxis === parallelAxisId;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  view.width = rect.width;
  view.height = rect.height;
  state.scale = Math.min(view.width, view.height) / 22;

  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
  positionTextEditorPopover();
}

function drawGrid() {
  const { maxX, maxT } = getWorldBounds();
  const minX = -maxX;
  const minT = -maxT;
  const xExtent = maxX * 1.1;
  const tExtent = maxT * 1.1;

  ctx.save();
  ctx.lineWidth = 1;

  if (shouldDrawGridFamily("referenceT")) {
    for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += 1) {
      const start = worldToScreen({ x, t: -tExtent });
      const end = worldToScreen({ x, t: tExtent });
      ctx.strokeStyle = x % 5 === 0 ? "#d5dde3" : "#edf1f4";
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  if (shouldDrawGridFamily("referenceX")) {
    for (let t = Math.ceil(minT); t <= Math.floor(maxT); t += 1) {
      const start = worldToScreen({ x: -xExtent, t });
      const end = worldToScreen({ x: xExtent, t });
      ctx.strokeStyle = t % 5 === 0 ? "#d5dde3" : "#edf1f4";
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawBoostedGrid() {
  const { maxX, maxT } = getBoostedFrameBounds();
  const xExtent = Math.max(maxX * 1.35, 2);
  const tExtent = Math.max(maxT * 1.35, 2);
  const xGridLimit = Math.ceil(xExtent);
  const tGridLimit = Math.ceil(tExtent);

  ctx.save();

  if (shouldDrawGridFamily("boostedX")) {
    for (let t = -tGridLimit; t <= tGridLimit; t += 1) {
      const start = worldToScreen(boostedFrameToWorld({ x: -xExtent, t }));
      const end = worldToScreen(boostedFrameToWorld({ x: xExtent, t }));
      const isMajor = t % 5 === 0;
      ctx.strokeStyle = isMajor ? "rgba(21, 71, 96, 0.18)" : "rgba(21, 71, 96, 0.10)";
      ctx.lineWidth = isMajor ? 1 : 0.8;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  if (shouldDrawGridFamily("boostedT")) {
    for (let x = -xGridLimit; x <= xGridLimit; x += 1) {
      const start = worldToScreen(boostedFrameToWorld({ x, t: -tExtent }));
      const end = worldToScreen(boostedFrameToWorld({ x, t: tExtent }));
      const isMajor = x % 5 === 0;
      ctx.strokeStyle = isMajor ? "rgba(102, 65, 28, 0.18)" : "rgba(102, 65, 28, 0.10)";
      ctx.lineWidth = isMajor ? 1 : 0.8;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function clipScreenSegmentToInsetRect(start, end, inset = 24) {
  const left = inset;
  const right = view.width - inset;
  const top = inset;
  const bottom = view.height - inset;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let t0 = 0;
  let t1 = 1;

  const checks = [
    [-dx, start.x - left],
    [dx, right - start.x],
    [-dy, start.y - top],
    [dy, bottom - start.y]
  ];

  for (const [p, q] of checks) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) {
        return null;
      }
      continue;
    }

    const ratio = q / p;
    if (p < 0) {
      if (ratio > t1) {
        return null;
      }
      t0 = Math.max(t0, ratio);
    } else {
      if (ratio < t0) {
        return null;
      }
      t1 = Math.min(t1, ratio);
    }
  }

  return {
    start: {
      x: start.x + dx * t0,
      y: start.y + dy * t0
    },
    end: {
      x: start.x + dx * t1,
      y: start.y + dy * t1
    }
  };
}

function drawClampedAxisLabel(text, lineStart, lineEnd, options = {}) {
  const {
    inset = 24,
    alongOffset = 16,
    normalOffset = 10
  } = options;
  const clippedSegment = clipScreenSegmentToInsetRect(lineStart, lineEnd, inset);
  if (!clippedSegment) {
    return null;
  }

  const dx = clippedSegment.end.x - clippedSegment.start.x;
  const dy = clippedSegment.end.y - clippedSegment.start.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) {
    return null;
  }

  const direction = {
    x: dx / length,
    y: dy / length
  };
  const normal = {
    x: -direction.y,
    y: direction.x
  };
  const anchor = {
    x: clippedSegment.end.x - direction.x * alongOffset + normal.x * normalOffset,
    y: clippedSegment.end.y - direction.y * alongOffset + normal.y * normalOffset
  };

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const ascent = metrics.actualBoundingBoxAscent || Number.parseFloat(ctx.font) || 12;
  const descent = metrics.actualBoundingBoxDescent || ascent * 0.25;
  const halfHeight = (ascent + descent) * 0.5;
  const padding = inset * 0.5;
  const x = Math.max(
    padding + textWidth * 0.5,
    Math.min(view.width - padding - textWidth * 0.5, anchor.x)
  );
  const y = Math.max(
    padding + halfHeight,
    Math.min(view.height - padding - halfHeight, anchor.y)
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  return {
    x,
    y,
    textWidth,
    halfHeight
  };
}

function drawAxes() {
  const { maxX, maxT } = getWorldBounds();
  const extent = Math.max(maxX, maxT) * 1.6;
  const referenceXAxis = [
    { x: -extent, t: 0 },
    { x: extent, t: 0 }
  ];
  const referenceTAxis = [
    { x: 0, t: -extent },
    { x: 0, t: extent }
  ];
  const baseXAxis = [
    { x: -extent, t: 0 },
    { x: extent, t: 0 }
  ];
  const baseTAxis = [
    { x: 0, t: -extent },
    { x: 0, t: extent }
  ];
  const transformedXAxis = baseXAxis.map((p) => boostedFrameToWorld(p));
  const transformedTAxis = baseTAxis.map((p) => boostedFrameToWorld(p));

  const refXStart = worldToScreen(referenceXAxis[0]);
  const refXEnd = worldToScreen(referenceXAxis[1]);
  const refTStart = worldToScreen(referenceTAxis[0]);
  const refTEnd = worldToScreen(referenceTAxis[1]);
  const xStart = worldToScreen(transformedXAxis[0]);
  const xEnd = worldToScreen(transformedXAxis[1]);
  const tStart = worldToScreen(transformedTAxis[0]);
  const tEnd = worldToScreen(transformedTAxis[1]);
  const referenceOrigin = worldToScreen({ x: 0, t: 0 });
  const boostedOrigin = worldToScreen(boostedFrameToWorld({ x: 0, t: 0 }));
  const showBoostedAxes = Math.abs(state.beta) > 1e-6;
  const anyAxisLineVisible = (
    axisLineVisible("referenceX") ||
    axisLineVisible("referenceT") ||
    (showBoostedAxes && axisLineVisible("boostedX")) ||
    (showBoostedAxes && axisLineVisible("boostedT"))
  );

  ctx.save();
  if (showBoostedAxes && axisLineVisible("boostedX")) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#154760";
    ctx.beginPath();
    ctx.moveTo(xStart.x, xStart.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();
    registerAxisLineTarget("boostedX", xStart, xEnd);
  }

  if (showBoostedAxes && axisLineVisible("boostedT")) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#66411c";
    ctx.beginPath();
    ctx.moveTo(tStart.x, tStart.y);
    ctx.lineTo(tEnd.x, tEnd.y);
    ctx.stroke();
    registerAxisLineTarget("boostedT", tStart, tEnd);
  }

  if (anyAxisLineVisible) {
    ctx.fillStyle = "#1f2f3a";
    if (axisLineVisible("referenceX") || axisLineVisible("referenceT")) {
      ctx.beginPath();
      ctx.arc(referenceOrigin.x, referenceOrigin.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (showBoostedAxes && (axisLineVisible("boostedX") || axisLineVisible("boostedT"))) {
      ctx.beginPath();
      ctx.arc(boostedOrigin.x, boostedOrigin.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (showBoostedAxes && axisLabelVisible("boostedX")) {
    ctx.font = "20px IBM Plex Sans, Segoe UI, sans-serif";
    ctx.fillStyle = "#154760";
    const boostedXLabel = drawClampedAxisLabel("x'", xStart, xEnd, { alongOffset: 18, normalOffset: 12 });
    registerAxisLabelTarget("boostedX", boostedXLabel);
  }

  if (showBoostedAxes && axisLabelVisible("boostedT")) {
    ctx.font = "20px IBM Plex Sans, Segoe UI, sans-serif";
    ctx.fillStyle = "#66411c";
    const boostedTLabel = drawClampedAxisLabel("t'", tStart, tEnd, { alongOffset: 18, normalOffset: 12 });
    registerAxisLabelTarget("boostedT", boostedTLabel);
  }

  if (axisLineVisible("referenceX") || axisLineVisible("referenceT")) {
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "rgba(58, 68, 76, 0.72)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (axisLineVisible("referenceX")) {
      ctx.moveTo(refXStart.x, refXStart.y);
      ctx.lineTo(refXEnd.x, refXEnd.y);
      registerAxisLineTarget("referenceX", refXStart, refXEnd);
    }
    if (axisLineVisible("referenceT")) {
      ctx.moveTo(refTStart.x, refTStart.y);
      ctx.lineTo(refTEnd.x, refTEnd.y);
      registerAxisLineTarget("referenceT", refTStart, refTEnd);
    }
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(58, 68, 76, 0.9)";
  ctx.font = "17px IBM Plex Sans, Segoe UI, sans-serif";
  if (axisLabelVisible("referenceX")) {
    const referenceXLabel = drawClampedAxisLabel("x", refXStart, refXEnd, { alongOffset: 18, normalOffset: 12 });
    registerAxisLabelTarget("referenceX", referenceXLabel);
  }
  if (axisLabelVisible("referenceT")) {
    const referenceTLabel = drawClampedAxisLabel("t", refTStart, refTEnd, { alongOffset: 18, normalOffset: 12 });
    registerAxisLabelTarget("referenceT", referenceTLabel);
  }
  ctx.restore();
}

function getAxisScreenTextAlignment(normal) {
  if (Math.abs(normal.x) > 0.45) {
    return {
      textAlign: normal.x > 0 ? "left" : "right",
      textBaseline: "middle"
    };
  }

  return {
    textAlign: "center",
    textBaseline: normal.y > 0 ? "top" : "bottom"
  };
}

function drawAxisCoordinateValuesForAxis(getScreenPointForValue, color) {
  const origin = getScreenPointForValue(0);
  const unitPoint = getScreenPointForValue(1);
  const axisVector = {
    x: unitPoint.x - origin.x,
    y: unitPoint.y - origin.y
  };
  const axisLength = Math.hypot(axisVector.x, axisVector.y);
  if (axisLength < 1e-6) {
    return;
  }

  const direction = {
    x: axisVector.x / axisLength,
    y: axisVector.y / axisLength
  };
  const normal = {
    x: -direction.y,
    y: direction.x
  };
  const tickSpacingPx = axisLength;
  const labelStep = Math.max(1, Math.ceil(72 / tickSpacingPx));
  const valueLimit = Math.ceil(Math.max(view.width, view.height) / Math.max(tickSpacingPx, 1)) + labelStep;
  const tickHalfLength = 4;
  const labelGap = 9;
  const boundsMargin = 18;
  const alignment = getAxisScreenTextAlignment(normal);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2;
  ctx.font = "11px IBM Plex Sans, Segoe UI, sans-serif";
  ctx.textAlign = alignment.textAlign;
  ctx.textBaseline = alignment.textBaseline;

  for (const sign of [1, -1]) {
    for (let value = labelStep; value <= valueLimit; value += labelStep) {
      const signedValue = sign * value;
      const point = getScreenPointForValue(signedValue);

      if (
        point.x < -boundsMargin ||
        point.x > view.width + boundsMargin ||
        point.y < -boundsMargin ||
        point.y > view.height + boundsMargin
      ) {
        break;
      }

      ctx.beginPath();
      ctx.moveTo(point.x - normal.x * tickHalfLength, point.y - normal.y * tickHalfLength);
      ctx.lineTo(point.x + normal.x * tickHalfLength, point.y + normal.y * tickHalfLength);
      ctx.stroke();

      const labelX = point.x + normal.x * (tickHalfLength + labelGap);
      const labelY = point.y + normal.y * (tickHalfLength + labelGap);
      ctx.fillText(String(signedValue), labelX, labelY);
    }
  }

  ctx.restore();
}

function drawAxisCoordinateValues() {
  if (axisLineVisible("boostedX") && axisLabelVisible("boostedX")) {
    drawAxisCoordinateValuesForAxis(
      (value) => worldToScreen(boostedFrameToWorld({ x: value, t: 0 })),
      "rgba(21, 71, 96, 0.88)"
    );
  }
  if (axisLineVisible("boostedT") && axisLabelVisible("boostedT")) {
    drawAxisCoordinateValuesForAxis(
      (value) => worldToScreen(boostedFrameToWorld({ x: 0, t: value })),
      "rgba(102, 65, 28, 0.88)"
    );
  }
}

function canShowReferenceAxisCoordinateValues() {
  if (Math.abs(state.beta) < 1e-6) {
    return false;
  }

  const sampleValue = 4;
  const referenceXPoint = worldToScreen({ x: sampleValue, t: 0 });
  const boostedXPoint = worldToScreen(boostedFrameToWorld({ x: sampleValue, t: 0 }));
  const referenceTPoint = worldToScreen({ x: 0, t: sampleValue });
  const boostedTPoint = worldToScreen(boostedFrameToWorld({ x: 0, t: sampleValue }));
  const minSeparation = Math.min(
    Math.sqrt(pointDistanceSquared(referenceXPoint, boostedXPoint)),
    Math.sqrt(pointDistanceSquared(referenceTPoint, boostedTPoint))
  );

  return minSeparation >= 28;
}

function drawReferenceAxisCoordinateValues() {
  const color = "rgba(58, 68, 76, 0.88)";
  if (axisLineVisible("referenceX") && axisLabelVisible("referenceX")) {
    drawAxisCoordinateValuesForAxis(
      (value) => worldToScreen({ x: value, t: 0 }),
      color
    );
  }
  if (axisLineVisible("referenceT") && axisLabelVisible("referenceT")) {
    drawAxisCoordinateValuesForAxis(
      (value) => worldToScreen({ x: 0, t: value }),
      color
    );
  }
}

function drawLightCones() {
  const { xExtent, tExtent } = getStableHyperbolaExtents();
  const m = Math.max(xExtent, tExtent);

  ctx.save();
  ctx.strokeStyle = "#dc3a4a";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([7, 5]);
  ctx.lineDashOffset = 0;

  const a1 = referenceWorldToScreen({ x: -m, t: -m });
  const b1 = referenceWorldToScreen({ x: m, t: m });
  const a2 = referenceWorldToScreen({ x: -m, t: m });
  const b2 = referenceWorldToScreen({ x: m, t: -m });

  ctx.beginPath();
  ctx.moveTo(a1.x, a1.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.moveTo(a2.x, a2.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.stroke();

  ctx.restore();
}

function plotWorldCurve(samples, color, width = 1.1, dash = [], projectToScreen = worldToScreen) {
  if (samples.length < 2) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();

  const first = projectToScreen(samples[0]);
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < samples.length; i += 1) {
    const p = projectToScreen(samples[i]);
    ctx.lineTo(p.x, p.y);
  }

  ctx.stroke();
  ctx.restore();
}

function drawHyperboles() {
  const { xExtent, tExtent: baseTExtent } = getStableHyperbolaExtents();
  const dx = 0.04;
  const dt = 0.04;
  const hyperbolaLevels = getHyperbolaLevels();

  for (const a of hyperbolaLevels) {
    const timelikeTop = [];
    const timelikeBottom = [];

    for (let x = -xExtent; x <= xExtent; x += dx) {
      const t = Math.sqrt(a * a + x * x);
      timelikeTop.push({ x, t });
      timelikeBottom.push({ x, t: -t });
    }

    plotWorldCurve(timelikeTop, "#1a87a7", 1, [4, 4], referenceWorldToScreen);
    plotWorldCurve(timelikeBottom, "#1a87a7", 1, [4, 4], referenceWorldToScreen);

    const spacelikeRight = [];
    const spacelikeLeft = [];
    const requiredTExtent = Math.sqrt(Math.max(0, xExtent * xExtent - a * a));
    const tExtent = Math.max(baseTExtent, requiredTExtent);

    for (let t = -tExtent; t <= tExtent; t += dt) {
      const x = Math.sqrt(a * a + t * t);
      spacelikeRight.push({ x, t });
      spacelikeLeft.push({ x: -x, t });
    }

    plotWorldCurve(spacelikeRight, "#49a35e", 1, [4, 4], referenceWorldToScreen);
    plotWorldCurve(spacelikeLeft, "#49a35e", 1, [4, 4], referenceWorldToScreen);
  }
}

function getHyperbolaMarkerRapidities(xExtent) {
  const minLevel = getHyperbolaLevels()[0] ?? 1;
  const etaMax = Math.asinh(xExtent / Math.max(minLevel, 1e-6));
  const sampleCount = Math.max(1, Math.ceil(etaMax / HYPERBOLA_MARKER_RAPIDITY_STEP));
  const rapidities = [];

  for (let i = -sampleCount; i <= sampleCount; i += 1) {
    rapidities.push((i / sampleCount) * etaMax);
  }

  return rapidities;
}

function getHyperbolaMarkerData() {
  const markers = [];
  const { xExtent, tExtent } = getStableHyperbolaExtents();
  const rayRapidities = getHyperbolaMarkerRapidities(xExtent);
  const hyperbolaLevels = getHyperbolaLevels();

  for (const level of hyperbolaLevels) {
    // Shared rapidity samples make the marker families align along rays from the origin.
    for (const eta of rayRapidities) {
      const sinhEta = Math.sinh(eta);
      const coshEta = Math.cosh(eta);
      const timelikePoints = [
        { x: level * sinhEta, t: level * coshEta },
        { x: level * sinhEta, t: -level * coshEta }
      ];

      for (const point of timelikePoints) {
        markers.push({
          point,
          color: "#1a87a7"
        });
      }

      const spacelikePoints = [
        { x: level * coshEta, t: level * sinhEta },
        { x: -level * coshEta, t: level * sinhEta }
      ];

      for (const point of spacelikePoints) {
        markers.push({
          point,
          color: "#49a35e"
        });
      }
    }
  }

  const coneExtent = Math.max(xExtent, tExtent);
  const coneMarkerStep = getLightConeMarkerStep();
  const maxConeLevel = Math.ceil(coneExtent / coneMarkerStep) * coneMarkerStep;

  for (let level = coneMarkerStep; level <= maxConeLevel; level += coneMarkerStep) {
    const lightConePoints = [
      { x: level, t: level },
      { x: -level, t: level },
      { x: level, t: -level },
      { x: -level, t: -level }
    ];

    for (const point of lightConePoints) {
      markers.push({
        point,
        color: "#dc3a4a"
      });
    }
  }

  return markers;
}

function drawHyperbolaPoints() {
  const markers = getHyperbolaMarkerData();

  ctx.save();
  ctx.lineWidth = 1;

  for (const marker of markers) {
    const screenPoint = worldToScreen(marker.point);
    if (
      screenPoint.x < -8 ||
      screenPoint.y < -8 ||
      screenPoint.x > view.width + 8 ||
      screenPoint.y > view.height + 8
    ) {
      continue;
    }

    ctx.fillStyle = marker.color;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.94)";
    ctx.beginPath();
    ctx.arc(screenPoint.x, screenPoint.y, 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawBellWorldlineSegment(samples, color, width, dash = []) {
  if (samples.length < 2) {
    return;
  }

  plotWorldCurve(samples, color, width, dash, worldToScreen);
}

function drawBellEventMarker(point, options = {}) {
  const {
    radius = 4.8,
    fill = "#ffffff",
    stroke = "rgba(17, 32, 43, 0.85)",
    lineWidth = 1.5
  } = options;
  const screenPoint = worldToScreen(point);
  if (
    screenPoint.x < -12 ||
    screenPoint.x > view.width + 12 ||
    screenPoint.y < -12 ||
    screenPoint.y > view.height + 12
  ) {
    return;
  }

  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(screenPoint.x, screenPoint.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBellFrameAxis(point, direction, color, label) {
  const extent = Math.max(getWorldBounds().maxX, getWorldBounds().maxT, 6) * 2.5;
  const startWorld = {
    x: point.x - direction.x * extent,
    t: point.t - direction.t * extent
  };
  const endWorld = {
    x: point.x + direction.x * extent,
    t: point.t + direction.t * extent
  };
  const start = worldToScreen(startWorld);
  const end = worldToScreen(endWorld);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "15px IBM Plex Sans, Segoe UI, sans-serif";
  drawClampedAxisLabel(label, start, end, {
    inset: 22,
    alongOffset: 18,
    normalOffset: 9
  });
  ctx.restore();
}

function drawBellSegmentLabel(startPoint, endPoint, text, color, verticalOffset = -20) {
  const start = worldToScreen(startPoint);
  const end = worldToScreen(endPoint);
  const midpoint = {
    x: (start.x + end.x) * 0.5,
    y: (start.y + end.y) * 0.5
  };

  ctx.save();
  ctx.font = "11px IBM Plex Sans, Segoe UI, sans-serif";
  const paddingX = 5;
  const textWidth = ctx.measureText(text).width;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = 16;
  const boxX = midpoint.x - boxWidth * 0.5;
  const boxY = midpoint.y + verticalOffset;

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.strokeStyle = "rgba(40, 55, 66, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(boxX, boxY, boxWidth, boxHeight);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.fillText(text, boxX + paddingX, boxY + 11.5);
  ctx.restore();
}

function drawBellScenarioOverlay(geometry) {
  const probeLabel = geometry.probe.rocket === "front" ? "front" : "rear";
  const otherLabel = geometry.otherRocket === "front" ? "front" : "rear";
  const simultaneousClock = geometry.simultaneous.properTime == null
    ? "before ignition"
    : `tau = ${formatCoordinateValue(geometry.simultaneous.properTime)}`;
  const lines = [
    `Bell probe: ${probeLabel} rocket at lab t = ${formatCoordinateValue(geometry.probe.referenceTime)}`,
    `probe clock tau = ${formatCoordinateValue(geometry.probe.properTime ?? 0)}, v = ${formatVelocityPercent(geometry.probe.velocity)} of c`,
    `${otherLabel} simultaneous event: lab t = ${formatCoordinateValue(geometry.simultaneous.referenceTime)}, ${simultaneousClock}`,
    `launch-frame gap = ${geometry.labGap.absS.toFixed(3)}`,
    `probe-frame gap = ${geometry.localGap.absS.toFixed(3)}`
  ];

  if (state.bell.followProbeFrame) {
    lines.push("boosted frame locked to probe velocity");
  }
  if (state.bell.followProbeFrame && state.bell.pinProbeX) {
    lines.push("probe rocket pinned to launch x");
  }

  ctx.save();
  ctx.font = "12px IBM Plex Sans, Segoe UI, sans-serif";
  const paddingX = 8;
  const lineHeight = 15;
  const boxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width)) + paddingX * 2;
  const boxHeight = lines.length * lineHeight + 10;
  const boxX = 12;
  const boxY = 12;

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.strokeStyle = "rgba(40, 55, 66, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(boxX, boxY, boxWidth, boxHeight);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(17, 32, 43, 0.96)";
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], boxX + paddingX, boxY + 15 + i * lineHeight);
  }
  ctx.restore();
}

function drawBellScenario() {
  const geometry = getBellScenarioGeometry();
  if (!geometry) {
    return;
  }

  const bounds = getWorldBounds();
  const minT = -Math.max(bounds.maxT * 1.05, 1.5);
  const maxT = Math.max(bounds.maxT * 1.05, 1.5);
  const sampleStep = Math.max(0.05, (maxT - Math.max(0, minT)) / 220);
  const rocketColors = {
    rear: "#1765a3",
    front: "#bb6b18"
  };

  for (const rocket of ["rear", "front"]) {
    const color = rocketColors[rocket];
    const beforeSamples = [];
    if (minT < 0) {
      for (let t = minT; t <= Math.min(0, maxT); t += sampleStep) {
        beforeSamples.push(bellRocketPointAtTime(rocket, t));
      }
      beforeSamples.push(bellRocketPointAtTime(rocket, Math.min(0, maxT)));
      drawBellWorldlineSegment(beforeSamples, `${color}88`, 1.5, [6, 5]);
    }

    if (maxT > 0) {
      const afterSamples = [];
      for (let t = 0; t <= maxT; t += sampleStep) {
        afterSamples.push(bellRocketPointAtTime(rocket, t));
      }
      afterSamples.push(bellRocketPointAtTime(rocket, maxT));
      drawBellWorldlineSegment(afterSamples, color, 2.5);
    }
  }

  ctx.save();
  ctx.font = "12px IBM Plex Sans, Segoe UI, sans-serif";
  for (const rocket of ["rear", "front"]) {
    const labelTime = Math.max(0.6, Math.min(maxT * 0.72, MAX_BELL_PROBE_TIME));
    const labelPoint = worldToScreen(bellRocketPointAtTime(rocket, labelTime));
    ctx.fillStyle = rocketColors[rocket];
    ctx.fillText(rocket === "rear" ? "Rear" : "Front", labelPoint.x + 7, labelPoint.y - 7);
  }
  ctx.restore();

  const probeRapidity = geometry.probe.rapidity;
  const localXAxisDirection = {
    x: Math.cosh(probeRapidity),
    t: Math.sinh(probeRapidity)
  };
  const localTAxisDirection = {
    x: Math.sinh(probeRapidity),
    t: Math.cosh(probeRapidity)
  };
  drawBellFrameAxis(geometry.probe.point, localXAxisDirection, "rgba(13, 122, 141, 0.62)", "x*");
  drawBellFrameAxis(geometry.probe.point, localTAxisDirection, "rgba(154, 88, 16, 0.62)", "t*");

  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = "rgba(78, 91, 101, 0.6)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const labStart = worldToScreen(geometry.probe.point);
  const labEnd = worldToScreen(geometry.labSimultaneous.point);
  ctx.moveTo(labStart.x, labStart.y);
  ctx.lineTo(labEnd.x, labEnd.y);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(194, 102, 28, 0.95)";
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  const localEnd = worldToScreen(geometry.simultaneous.point);
  ctx.moveTo(labStart.x, labStart.y);
  ctx.lineTo(localEnd.x, localEnd.y);
  ctx.stroke();
  ctx.restore();

  drawBellEventMarker(geometry.labSimultaneous.point, {
    radius: 3.2,
    fill: "rgba(255, 255, 255, 0.92)",
    stroke: "rgba(78, 91, 101, 0.72)",
    lineWidth: 1.2
  });
  drawBellEventMarker(geometry.simultaneous.point, {
    radius: 4.4,
    fill: "rgba(255, 249, 239, 0.96)",
    stroke: "rgba(194, 102, 28, 0.95)",
    lineWidth: 1.8
  });
  drawBellEventMarker(geometry.probe.point, {
    radius: 5.2,
    fill: "#ffffff",
    stroke: rocketColors[geometry.probe.rocket],
    lineWidth: 2.5
  });

  drawBellSegmentLabel(geometry.probe.point, geometry.labSimultaneous.point, "launch frame", "rgba(78, 91, 101, 0.84)");
  drawBellSegmentLabel(geometry.probe.point, geometry.simultaneous.point, "probe frame", "rgba(194, 102, 28, 0.95)");
  if (state.bell.showStringLength) {
    drawBellSegmentLabel(
      geometry.probe.point,
      geometry.simultaneous.point,
      `string length (acc. to front ship) = ${geometry.localGap.absS.toFixed(3)}`,
      "rgba(194, 102, 28, 0.95)",
      4
    );
  }

  drawBellScenarioOverlay(geometry);
}

function drawTwinScenarioOverlay(geometry) {
  const lines = [
    `Traveler tau = ${formatCoordinateValue(geometry.probe.properTime)}, lab t = ${formatCoordinateValue(geometry.probe.point.t)}`,
    `traveler phase = ${geometry.probe.phase}`
  ];

  if (geometry.probe.frameDefined) {
    lines.splice(1, 0, `instantaneous v = ${formatVelocityPercent(geometry.probe.velocity)} of c`);
  } else {
    lines.splice(
      1,
      0,
      `instantaneous frame jumps from +${formatVelocityPercent(geometry.curve.parameters.speed)} to -${formatVelocityPercent(geometry.curve.parameters.speed)}`
    );
  }

  if (geometry.homeSimultaneousAge != null) {
    lines.push(`home age simultaneous for traveler = ${formatCoordinateValue(geometry.homeSimultaneousAge)}`);
    lines.push(`age gap at this slice = ${(geometry.homeSimultaneousAge - geometry.probe.properTime).toFixed(3)}`);
  } else {
    lines.push("sharp turnaround: no unique instantaneous rest frame at the exact reversal");
  }

  lines.push(
    `reunion ages: home = ${formatCoordinateValue(geometry.reunion.point.t)}, traveler = ${formatCoordinateValue(geometry.curve.totalProperTime)}`
  );

  if (state.twin.followProbeFrame) {
    lines.push("boosted frame locked to traveler velocity");
  }
  if (state.twin.smoothTurnaround) {
    lines.push("turnaround smoothed for continuous frame changes");
  }

  ctx.save();
  ctx.font = "12px IBM Plex Sans, Segoe UI, sans-serif";
  const paddingX = 8;
  const lineHeight = 15;
  const boxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width)) + paddingX * 2;
  const boxHeight = lines.length * lineHeight + 10;
  const boxX = 12;
  const boxY = 12;

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.strokeStyle = "rgba(40, 55, 66, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(boxX, boxY, boxWidth, boxHeight);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(17, 32, 43, 0.96)";
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], boxX + paddingX, boxY + 15 + i * lineHeight);
  }
  ctx.restore();
}

function drawTwinScenario() {
  const geometry = getTwinScenarioGeometry();
  if (!geometry) {
    return;
  }

  const worldBounds = getWorldBounds();
  const visibleTop = Math.max(worldBounds.maxT * 1.05, geometry.reunion.point.t + 0.5, 1.5);
  const rocketColors = {
    home: "#33404b",
    outbound: "#1765a3",
    turnaround: "#8d5c99",
    inbound: "#bb6b18"
  };
  const homeSamples = [
    { x: 0, t: 0 },
    { x: 0, t: visibleTop }
  ];

  drawBellWorldlineSegment(homeSamples, rocketColors.home, 2.4);

  const outboundSamples = [];
  const turnaroundSamples = [];
  const inboundSamples = [];
  const turnStart = geometry.curve.parameters.halfTripProperTime - geometry.curve.turnHalfWidth;
  const turnEnd = geometry.curve.parameters.halfTripProperTime + geometry.curve.turnHalfWidth;

  for (const sample of geometry.curve.samples) {
    const worldPoint = { x: sample.x, t: sample.t };
    if (sample.tau <= turnStart + 1e-6) {
      outboundSamples.push(worldPoint);
      continue;
    }
    if (sample.tau >= turnEnd - 1e-6) {
      inboundSamples.push(worldPoint);
      continue;
    }
    turnaroundSamples.push(worldPoint);
  }

  if (geometry.curve.turnHalfWidth > 1e-6 && turnaroundSamples.length > 1) {
    if (
      Math.abs(turnaroundSamples[0].x - outboundSamples[outboundSamples.length - 1].x) > 1e-6 ||
      Math.abs(turnaroundSamples[0].t - outboundSamples[outboundSamples.length - 1].t) > 1e-6
    ) {
      turnaroundSamples.unshift(outboundSamples[outboundSamples.length - 1]);
    }
    if (
      Math.abs(turnaroundSamples[turnaroundSamples.length - 1].x - inboundSamples[0].x) > 1e-6 ||
      Math.abs(turnaroundSamples[turnaroundSamples.length - 1].t - inboundSamples[0].t) > 1e-6
    ) {
      turnaroundSamples.push(inboundSamples[0]);
    }
  } else {
    if (
      !outboundSamples.length ||
      Math.abs(outboundSamples[outboundSamples.length - 1].x - geometry.turnaround.point.x) > 1e-6 ||
      Math.abs(outboundSamples[outboundSamples.length - 1].t - geometry.turnaround.point.t) > 1e-6
    ) {
      outboundSamples.push(geometry.turnaround.point);
    }
    if (
      !inboundSamples.length ||
      Math.abs(inboundSamples[0].x - geometry.turnaround.point.x) > 1e-6 ||
      Math.abs(inboundSamples[0].t - geometry.turnaround.point.t) > 1e-6
    ) {
      inboundSamples.unshift(geometry.turnaround.point);
    }
  }

  drawBellWorldlineSegment(outboundSamples, rocketColors.outbound, 2.6);
  if (geometry.curve.turnHalfWidth > 1e-6 && turnaroundSamples.length > 1) {
    drawBellWorldlineSegment(turnaroundSamples, rocketColors.turnaround, 3);
  }
  drawBellWorldlineSegment(inboundSamples, rocketColors.inbound, 2.6);

  ctx.save();
  ctx.font = "12px IBM Plex Sans, Segoe UI, sans-serif";
  const homeLabelPoint = worldToScreen({ x: 0, t: Math.min(visibleTop, Math.max(1.8, geometry.reunion.point.t * 0.78)) });
  ctx.fillStyle = rocketColors.home;
  ctx.fillText("Home", homeLabelPoint.x + 7, homeLabelPoint.y - 7);
  const travelerLabelSample = sampleTwinCurveAtProperTime(
    Math.min(geometry.curve.totalProperTime * 0.28, geometry.curve.parameters.halfTripProperTime * 0.82),
    geometry.curve
  );
  const travelerLabelPoint = worldToScreen(travelerLabelSample.point);
  ctx.fillStyle = rocketColors.outbound;
  ctx.fillText("Traveler", travelerLabelPoint.x + 7, travelerLabelPoint.y - 7);
  ctx.restore();

  drawBellEventMarker(geometry.departure.point, {
    radius: 3.9,
    fill: "#ffffff",
    stroke: "rgba(51, 64, 75, 0.9)",
    lineWidth: 1.5
  });
  drawBellEventMarker(geometry.reunion.point, {
    radius: 4.3,
    fill: "#ffffff",
    stroke: "rgba(51, 64, 75, 0.9)",
    lineWidth: 1.7
  });
  drawBellEventMarker(geometry.turnaround.point, {
    radius: 3.6,
    fill: "rgba(255, 255, 255, 0.94)",
    stroke: rocketColors.turnaround,
    lineWidth: 1.4
  });

  if (geometry.homeSimultaneousPoint) {
    const localXAxisDirection = {
      x: Math.cosh(geometry.probe.rapidity),
      t: Math.sinh(geometry.probe.rapidity)
    };
    const localTAxisDirection = {
      x: Math.sinh(geometry.probe.rapidity),
      t: Math.cosh(geometry.probe.rapidity)
    };
    drawBellFrameAxis(geometry.probe.point, localXAxisDirection, "rgba(13, 122, 141, 0.62)", "x*");
    drawBellFrameAxis(geometry.probe.point, localTAxisDirection, "rgba(154, 88, 16, 0.62)", "t*");

    ctx.save();
    ctx.strokeStyle = "rgba(194, 102, 28, 0.95)";
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    const start = worldToScreen(geometry.probe.point);
    const end = worldToScreen(geometry.homeSimultaneousPoint);
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore();

    drawBellEventMarker(geometry.homeSimultaneousPoint, {
      radius: 4.2,
      fill: "rgba(255, 249, 239, 0.96)",
      stroke: "rgba(194, 102, 28, 0.95)",
      lineWidth: 1.8
    });
    drawBellSegmentLabel(
      geometry.probe.point,
      geometry.homeSimultaneousPoint,
      `traveler τ = ${formatCoordinateValue(geometry.probe.properTime)}`,
      rocketColors.outbound,
      -42
    );
    drawBellSegmentLabel(
      geometry.probe.point,
      geometry.homeSimultaneousPoint,
      `traveler simultaneity: home age = ${formatCoordinateValue(geometry.homeSimultaneousAge)}`,
      "rgba(194, 102, 28, 0.95)",
      -20
    );
  }

  drawBellEventMarker(geometry.probe.point, {
    radius: 5.1,
    fill: "#ffffff",
    stroke: geometry.probe.phase === "inbound"
      ? rocketColors.inbound
      : geometry.probe.phase === "turnaround"
        ? rocketColors.turnaround
        : rocketColors.outbound,
    lineWidth: 2.5
  });

  drawTwinScenarioOverlay(geometry);
}

function drawStrokes() {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const stroke of state.strokes) {
    if (!canRenderStroke(stroke)) {
      continue;
    }

    const { points } = stroke;
    if (!points.length) {
      continue;
    }

    const style = stroke.style || {};
    const strokeColor = style.color || "#0d2e3c";
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = style.width ?? 2.2;
    ctx.setLineDash(style.dash || []);

    if (stroke.kind === "text") {
      const layout = getTextStrokeLayout(stroke);
      if (!layout) {
        continue;
      }

      ctx.save();
      ctx.font = style.font || TEXT_STROKE_FONT;
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
      ctx.strokeStyle = "rgba(40, 55, 66, 0.24)";
      ctx.beginPath();
      ctx.rect(layout.box.x, layout.box.y, layout.box.width, layout.box.height);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = strokeColor;
      ctx.fillText(
        layout.text,
        layout.box.x + TEXT_STROKE_PADDING_X,
        layout.box.y + TEXT_STROKE_PADDING_Y + TEXT_STROKE_FONT_SIZE
      );
      ctx.restore();
      continue;
    }

    if (points.length === 1) {
      const dot = worldToScreen(points[0]);
      const radius = stroke.kind === "point" ? 4.2 : 2.2;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fill();
      if (stroke.kind === "point") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.stroke();
      }
      continue;
    }

    const first = worldToScreen(points[0]);
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i += 1) {
      const p = worldToScreen(points[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawIntervalMarkers() {
  ctx.save();

  for (const stroke of state.strokes) {
    const points = stroke.points || [];
    if (stroke.kind !== "line" || !canRenderStroke(stroke) || points.length < 2) {
      continue;
    }

    const markers = collectIntervalMarkers(points, 1, 900);
    if (!markers.length) {
      continue;
    }

    const style = stroke.style || {};
    const markerColor = style.color || "#0d2e3c";

    ctx.fillStyle = markerColor;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 0.8;
    for (const marker of markers) {
      const screenPoint = worldToScreen(marker);
      if (screenPoint.x < -6 || screenPoint.y < -6 || screenPoint.x > view.width + 6 || screenPoint.y > view.height + 6) {
        continue;
      }

      ctx.beginPath();
      ctx.arc(screenPoint.x, screenPoint.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawLineLengthLabels() {
  ctx.save();
  ctx.font = "12px IBM Plex Sans, Segoe UI, sans-serif";

  for (const stroke of state.strokes) {
    if (stroke.kind !== "line" || stroke.points.length < 2) {
      continue;
    }

    const start = stroke.points[0];
    const end = stroke.points[1];
    const metrics = intervalMetrics(start, end);
    const displayMetrics = getHyperbolaClippedIntervalOverride(stroke) || metrics;

    const transformedStart = worldToScreen(start);
    const transformedEnd = worldToScreen(end);
    const midpoint = {
      x: (transformedStart.x + transformedEnd.x) * 0.5,
      y: (transformedStart.y + transformedEnd.y) * 0.5
    };

    const label = `I = ${formatIntervalSquareRoot(displayMetrics)}`;
    const width = ctx.measureText(label).width;
    const boxX = midpoint.x + 10;
    const boxY = midpoint.y - 22;
    const boxWidth = width + 10;
    const boxHeight = 18;

    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.strokeStyle = "rgba(40, 55, 66, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(17, 32, 43, 0.95)";
    ctx.fillText(label, boxX + 5, boxY + 13);
  }

  ctx.restore();
}

function formatCoordinateValue(value) {
  if (Math.abs(value) < 0.005) {
    return "0.00";
  }
  return value.toFixed(2);
}

function drawPointGuideSegments(segments) {
  for (const segment of segments) {
    const start = worldToScreen(segment.start);
    const end = worldToScreen(segment.end);
    if (pointDistanceSquared(start, end) < 1) {
      continue;
    }

    ctx.strokeStyle = segment.color;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}

function drawReferencePointGuides() {
  ctx.save();
  ctx.lineWidth = 1.15;
  ctx.setLineDash([6, 4]);

  for (const stroke of state.strokes) {
    if (stroke.kind !== "point" || stroke.points.length !== 1) {
      continue;
    }

    const point = stroke.points[0];
    drawPointGuideSegments([
      {
        start: { x: point.x, t: 0 },
        end: point,
        color: "rgba(58, 68, 76, 0.42)"
      },
      {
        start: { x: 0, t: point.t },
        end: point,
        color: "rgba(58, 68, 76, 0.42)"
      }
    ]);
  }

  ctx.restore();
}

function drawBoostedPointGuides() {
  ctx.save();
  ctx.lineWidth = 1.15;
  ctx.setLineDash([6, 4]);

  for (const stroke of state.strokes) {
    if (stroke.kind !== "point" || stroke.points.length !== 1) {
      continue;
    }

    const point = stroke.points[0];
    const boostedPoint = worldToBoostedFrame(point);
    drawPointGuideSegments([
      {
        start: boostedFrameToWorld({ x: boostedPoint.x, t: 0 }),
        end: point,
        color: "rgba(21, 71, 96, 0.36)"
      },
      {
        start: boostedFrameToWorld({ x: 0, t: boostedPoint.t }),
        end: point,
        color: "rgba(102, 65, 28, 0.36)"
      }
    ]);
  }

  ctx.restore();
}

function drawPointCoordinateLabels() {
  ctx.save();
  ctx.font = "12px IBM Plex Sans, Segoe UI, sans-serif";

  for (const stroke of state.strokes) {
    if (stroke.kind !== "point" || stroke.points.length !== 1) {
      continue;
    }

    const point = stroke.points[0];
    const screenPoint = worldToScreen(point);
    const boostedPoint = worldToBoostedFrame(point);
    const lines = [
      `(t, x) = (${formatCoordinateValue(point.t)}, ${formatCoordinateValue(point.x)})`
    ];

    if (Math.abs(state.beta) > 1e-6) {
      lines.push(`(t', x') = (${formatCoordinateValue(boostedPoint.t)}, ${formatCoordinateValue(boostedPoint.x)})`);
    }

    const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const paddingX = 6;
    const lineHeight = 14;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = lines.length * lineHeight + 6;
    const preferRight = screenPoint.x < view.width - boxWidth - 18;
    const preferAbove = screenPoint.y > boxHeight + 18;
    const boxX = preferRight ? screenPoint.x + 10 : screenPoint.x - boxWidth - 10;
    const boxY = preferAbove ? screenPoint.y - boxHeight - 10 : screenPoint.y + 10;

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = "rgba(40, 55, 66, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(17, 32, 43, 0.96)";
    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i], boxX + paddingX, boxY + 14 + i * lineHeight);
    }
  }

  ctx.restore();
}

function drawOverlay() {
  ctx.save();
  const g = gamma(state.beta);
  ctx.fillStyle = "rgba(14, 25, 32, 0.82)";
  ctx.font = "12px IBM Plex Sans, Segoe UI, sans-serif";
  const lines = [
    `frame v = ${formatVelocityPercent(state.beta)} of c`,
    `gamma = ${g.toFixed(3)}`
  ];

  if (state.rectifyViewEnabled) {
    lines.unshift(`view rectification = ${Math.round(state.rectifyAmount * 100)}%`);
  }

  for (let i = 0; i < lines.length; i += 1) {
    const y = view.height - 10 - (lines.length - 1 - i) * 16;
    ctx.fillText(lines[i], 12, y);
  }

  ctx.restore();
}

function draw() {
  resetAxisVisibilityTargets();
  ctx.clearRect(0, 0, view.width, view.height);
  if (state.showReferenceGrid) {
    drawGrid();
  }
  if (state.showBoostedGrid) {
    drawBoostedGrid();
  }
  if (state.showHyperboles) {
    drawHyperboles();
  }
  if (state.showLightCones) {
    drawLightCones();
  }
  if (!state.hideAxesAndLines) {
    drawAxes();
  }
  if (state.bell.enabled) {
    drawBellScenario();
  }
  if (state.twin.enabled) {
    drawTwinScenario();
  }
  if (state.showHyperbolaPoints) {
    drawHyperbolaPoints();
  }
  if (state.showReferencePointGuides) {
    drawReferencePointGuides();
  }
  if (state.showBoostedPointGuides) {
    drawBoostedPointGuides();
  }
  drawStrokes();
  if (!state.hideAxesAndLines && state.showLineLengths) {
    drawLineLengthLabels();
  }
  if (state.showPointCoordinates) {
    drawPointCoordinateLabels();
  }
  if (!state.hideAxesAndLines && state.showAxisCoordinates) {
    drawAxisCoordinateValues();
  }
  if (
    !state.hideAxesAndLines &&
    state.showReferenceAxisCoordinates &&
    canShowReferenceAxisCoordinateValues()
  ) {
    drawReferenceAxisCoordinateValues();
  }
  drawOverlay();
}

function eventToBaseFramePoint(event) {
  const screenPoint = eventToScreenPoint(event);
  return screenToWorld(screenPoint);
}

function startStroke(event) {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  const screenPoint = eventToScreenPoint(event);
  const point = eventToBaseFramePoint(event);
  if (axisVisibilityEditActive()) {
    const axisTarget = findAxisVisibilityTarget(screenPoint);
    if (axisTarget) {
      hideAxisVisibilityTarget(axisTarget);
    }
    return;
  }
  if (state.twin.enabled) {
    const twinGeometry = getTwinScenarioGeometry();
    const probeScreenPoint = twinGeometry ? worldToScreen(twinGeometry.probe.point) : null;
    if (
      probeScreenPoint &&
      pointDistanceSquared(screenPoint, probeScreenPoint) <= TWIN_DRAG_THRESHOLD_PX * TWIN_DRAG_THRESHOLD_PX
    ) {
      state.drawing = true;
      state.drawMode = "twinProbe";
      state.draggingShape = false;
      state.currentPointerId = event.pointerId;
      state.currentGroupId = null;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      return;
    }
  }
  if (state.bell.enabled) {
    const bellGeometry = getBellScenarioGeometry();
    const probeScreenPoint = bellGeometry ? worldToScreen(bellGeometry.probe.point) : null;
    if (
      probeScreenPoint &&
      pointDistanceSquared(screenPoint, probeScreenPoint) <= BELL_DRAG_THRESHOLD_PX * BELL_DRAG_THRESHOLD_PX
    ) {
      state.drawing = true;
      state.drawMode = "bellProbe";
      state.draggingShape = false;
      state.currentPointerId = event.pointerId;
      state.currentGroupId = null;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      return;
    }
  }

  if (state.activeTool === "eraser") {
    state.draggingShape = false;
    state.drawing = true;
    state.drawMode = "erase";
    state.currentPointerId = event.pointerId;
    state.currentGroupId = null;
    canvas.setPointerCapture(event.pointerId);
    removeShapeGroupAtScreenPoint(screenPoint);
    return;
  }

  if (state.activeTool === "text") {
    if (state.textEditor.open) {
      return;
    }

    const hitIndex = findTopmostStrokeAtScreenPoint(screenPoint, 12);
    const hitStroke = hitIndex >= 0 ? state.strokes[hitIndex] : null;
    if (hitStroke?.kind === "text") {
      openTextEditor(hitStroke.points[0], {
        strokeIndex: hitIndex,
        initialText: hitStroke.text || ""
      });
    } else {
      openTextEditor(point);
    }
    return;
  }

  const dragRequested = event.shiftKey || state.activeTool === "move";
  if (dragRequested) {
    const hitIndex = findTopmostStrokeAtScreenPoint(screenPoint);
    if (hitIndex !== -1) {
      state.draggingShape = true;
      state.drawing = false;
      state.drawMode = null;
      state.currentPointerId = event.pointerId;
      state.dragStrokeIndices = getStrokeGroupIndices(hitIndex);
      state.lastDragPoint = point;
      state.currentGroupId = null;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      return;
    }

    if (state.activeTool === "move") {
      return;
    }
  }

  if (state.activeTool === "point") {
    const snappedPoint = maybeSnapPoint(point, event);
    const groupId = state.nextGroupId;
    state.nextGroupId += 1;
    state.strokes.push({
      points: [snappedPoint],
      kind: "point",
      groupId,
      style: {
        color: state.strokeColor,
        width: 2.4,
        dash: []
      }
    });
    draw();
    return;
  }

  const groupId = state.nextGroupId;

  state.nextGroupId += 1;
  state.drawing = true;
  state.drawMode = "stroke";
  state.draggingShape = false;
  state.currentPointerId = event.pointerId;
  state.currentGroupId = groupId;
  canvas.setPointerCapture(event.pointerId);
  const startPoint = maybeSnapPoint(point, event, { preferHyperbolae: true });

  state.strokes.push({
    points: [startPoint, startPoint],
    kind: "line",
    groupId,
    style: {
      color: state.strokeColor,
      width: 2.2,
      dash: []
    }
  });

  draw();
}

function updateStroke(event) {
  if (event.pointerId !== state.currentPointerId) {
    return;
  }

  if (state.draggingShape) {
    const point = eventToBaseFramePoint(event);
    const last = state.lastDragPoint;
    if (!last) {
      return;
    }

    const dx = point.x - last.x;
    const dt = point.t - last.t;
    if (dx * dx + dt * dt < 0.0005) {
      return;
    }

    for (const index of state.dragStrokeIndices) {
      const stroke = state.strokes[index];
      if (!stroke) {
        continue;
      }
      for (const p of stroke.points) {
        p.x += dx;
        p.t += dt;
      }
    }

    state.lastDragPoint = point;
    draw();
    return;
  }

  if (!state.drawing) {
    return;
  }

  if (state.drawMode === "erase") {
    removeShapeGroupAtScreenPoint(eventToScreenPoint(event));
    return;
  }

  if (state.drawMode === "twinProbe") {
    state.twin.probeProperTime = findNearestTwinProbeProperTime(eventToScreenPoint(event));
    if (twinProbeProperTimeInput) {
      twinProbeProperTimeInput.value = String(state.twin.probeProperTime);
    }
    if (twinProbeProperTimeValueInput) {
      twinProbeProperTimeValueInput.value = state.twin.probeProperTime.toFixed(2);
    }
    if (applyScenarioProbeFrameLock()) {
      syncVelocityLabels();
      betaInput.value = String(state.beta);
    }
    draw();
    return;
  }

  if (state.drawMode === "bellProbe") {
    state.bell.probeTime = findNearestBellProbeTime(eventToScreenPoint(event), state.bell.probeRocket);
    if (bellProbeTimeInput) {
      bellProbeTimeInput.value = String(state.bell.probeTime);
    }
    if (bellProbeTimeValueInput) {
      bellProbeTimeValueInput.value = state.bell.probeTime.toFixed(2);
    }
    if (applyScenarioProbeFrameLock()) {
      syncVelocityLabels();
      betaInput.value = String(state.beta);
    }
    draw();
    return;
  }

  if (state.drawMode !== "stroke") {
    return;
  }

  const stroke = state.strokes[state.strokes.length - 1];
  if (!stroke) {
    return;
  }

  const point = eventToBaseFramePoint(event);
  stroke.points[1] = maybeSnapPoint(point, event, { preferHyperbolae: true });
  draw();
}

function endStroke(event) {
  if (event.pointerId !== state.currentPointerId) {
    return;
  }

  if (state.draggingShape) {
    state.draggingShape = false;
    state.drawing = false;
    state.currentPointerId = null;
    state.dragStrokeIndices = [];
    state.lastDragPoint = null;
    state.currentGroupId = null;
    state.drawMode = null;
    canvas.releasePointerCapture(event.pointerId);
    syncToolControls();
    draw();
    return;
  }

  if (!state.drawing) {
    return;
  }

  if (state.drawMode === "erase") {
    state.drawing = false;
    state.drawMode = null;
    state.currentPointerId = null;
    state.currentGroupId = null;
    canvas.releasePointerCapture(event.pointerId);
    return;
  }

  if (state.drawMode === "twinProbe") {
    state.drawing = false;
    state.drawMode = null;
    state.currentPointerId = null;
    state.currentGroupId = null;
    canvas.releasePointerCapture(event.pointerId);
    syncToolControls();
    draw();
    return;
  }

  if (state.drawMode === "bellProbe") {
    state.drawing = false;
    state.drawMode = null;
    state.currentPointerId = null;
    state.currentGroupId = null;
    canvas.releasePointerCapture(event.pointerId);
    syncToolControls();
    draw();
    return;
  }

  if (state.drawMode === "stroke") {
    const stroke = state.strokes[state.strokes.length - 1];
    if (stroke && stroke.groupId === state.currentGroupId && stroke.kind === "line") {
      const metrics = intervalMetrics(stroke.points[0], stroke.points[1]);
      if (metrics.dx * metrics.dx + metrics.dt * metrics.dt < 0.0016) {
        state.strokes.pop();
      }
    }
  }

  state.drawing = false;
  state.drawMode = null;
  state.currentPointerId = null;
  state.currentGroupId = null;
  canvas.releasePointerCapture(event.pointerId);
  syncToolControls();
  draw();
}

function formatVelocityPercent(beta) {
  return `${Math.round(beta * 100)}%`;
}

function clampBetaToControlRange(beta) {
  const min = Number.parseFloat(betaInput.min);
  const max = Number.parseFloat(betaInput.max);
  return Math.max(min, Math.min(max, clampBeta(beta)));
}

function syncBetaDrivenState() {
  betaInput.value = String(state.beta);
  syncVelocityLabels();
  draw();
}

function syncVelocityLabels() {
  const g = gamma(state.beta);
  betaValue.value = String(Math.round(state.beta * 100));
  gammaValue.value = g.toFixed(2);
}

function syncRectifyLabels() {
  rectifyValue.textContent = `${Math.round(state.rectifyAmount * 100)}%`;
}

function syncRectifyControls() {
  rectifyRow.hidden = !state.rectifyViewEnabled;
  rectifyAmountInput.disabled = !state.rectifyViewEnabled;
  rectifyAmountInput.value = String(state.rectifyAmount);
  syncRectifyLabels();
}

function syncVelocityLockControls() {
  const lockVelocityControls = velocityControlsLockedByScenario();
  betaInput.disabled = lockVelocityControls;
  betaValue.disabled = lockVelocityControls;
  gammaValue.disabled = lockVelocityControls;
}

function syncBellControls() {
  const controlsVisible = state.bell.enabled;
  if (showBellScenarioInput) {
    showBellScenarioInput.checked = state.bell.enabled;
  }
  if (bellScenarioControls) {
    bellScenarioControls.hidden = !controlsVisible;
    bellScenarioControls.setAttribute("aria-hidden", controlsVisible ? "false" : "true");
    bellScenarioControls.style.display = controlsVisible ? "grid" : "none";
  }
  if (bellSeparationInput) {
    bellSeparationInput.value = state.bell.separation.toFixed(1);
    bellSeparationInput.disabled = !controlsVisible;
  }
  if (bellAccelerationInput) {
    bellAccelerationInput.value = state.bell.acceleration.toFixed(2);
    bellAccelerationInput.disabled = !controlsVisible;
  }
  if (bellProbeRocketInput) {
    bellProbeRocketInput.value = state.bell.probeRocket;
    bellProbeRocketInput.disabled = !controlsVisible;
  }
  if (bellProbeTimeInput) {
    bellProbeTimeInput.value = String(state.bell.probeTime);
    bellProbeTimeInput.disabled = !controlsVisible;
  }
  if (bellProbeTimeValueInput) {
    bellProbeTimeValueInput.value = state.bell.probeTime.toFixed(2);
    bellProbeTimeValueInput.disabled = !controlsVisible;
  }
  if (bellFollowProbeFrameInput) {
    bellFollowProbeFrameInput.checked = state.bell.followProbeFrame;
    bellFollowProbeFrameInput.disabled = !controlsVisible;
  }
  if (bellPinProbeXInput) {
    bellPinProbeXInput.checked = state.bell.pinProbeX;
    bellPinProbeXInput.disabled = !controlsVisible;
  }
  if (bellShowStringLengthInput) {
    bellShowStringLengthInput.checked = state.bell.showStringLength;
    bellShowStringLengthInput.disabled = !controlsVisible;
  }
  syncVelocityLockControls();
}

function syncTwinControls() {
  state.twin.speed = sanitizeTwinSpeed(state.twin.speed);
  state.twin.halfTripProperTime = sanitizeTwinHalfTripProperTime(state.twin.halfTripProperTime);
  const controlsVisible = state.twin.enabled;
  const totalProperTime = getTwinTotalProperTime();
  state.twin.probeProperTime = sanitizeTwinProbeProperTime(state.twin.probeProperTime);
  if (showTwinScenarioInput) {
    showTwinScenarioInput.checked = state.twin.enabled;
  }
  if (twinScenarioControls) {
    twinScenarioControls.hidden = !controlsVisible;
    twinScenarioControls.setAttribute("aria-hidden", controlsVisible ? "false" : "true");
    twinScenarioControls.style.display = controlsVisible ? "grid" : "none";
  }
  if (twinTravelSpeedInput) {
    twinTravelSpeedInput.value = state.twin.speed.toFixed(2);
    twinTravelSpeedInput.disabled = !controlsVisible;
  }
  if (twinHalfTripProperTimeInput) {
    twinHalfTripProperTimeInput.value = state.twin.halfTripProperTime.toFixed(1);
    twinHalfTripProperTimeInput.disabled = !controlsVisible;
  }
  if (twinProbeProperTimeInput) {
    twinProbeProperTimeInput.max = String(totalProperTime);
    twinProbeProperTimeInput.value = String(state.twin.probeProperTime);
    twinProbeProperTimeInput.disabled = !controlsVisible;
  }
  if (twinProbeProperTimeValueInput) {
    twinProbeProperTimeValueInput.max = String(totalProperTime);
    twinProbeProperTimeValueInput.value = state.twin.probeProperTime.toFixed(2);
    twinProbeProperTimeValueInput.disabled = !controlsVisible;
  }
  if (twinFollowProbeFrameInput) {
    twinFollowProbeFrameInput.checked = state.twin.followProbeFrame;
    twinFollowProbeFrameInput.disabled = !controlsVisible;
  }
  if (twinSmoothTurnaroundInput) {
    twinSmoothTurnaroundInput.checked = state.twin.smoothTurnaround;
    twinSmoothTurnaroundInput.disabled = !controlsVisible;
  }
  syncVelocityLockControls();
}

function syncHyperbolaControls() {
  const shouldShow = state.showHyperboles;
  hyperbolaClipLabel.classList.toggle("is-hidden", !shouldShow);
  hyperbolaClipLabel.hidden = !shouldShow;
  hyperbolaClipLabel.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  clipToHyperbolaeInput.disabled = !state.showHyperboles;
  hyperbolaSpacingLabel?.classList.toggle("is-hidden", !shouldShow);
  if (hyperbolaSpacingLabel) {
    hyperbolaSpacingLabel.hidden = !shouldShow;
    hyperbolaSpacingLabel.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    hyperbolaSpacingLabel.style.display = shouldShow ? "inline-flex" : "none";
  }
  if (hyperbolaSpacingInput) {
    hyperbolaSpacingInput.disabled = !shouldShow;
    hyperbolaSpacingInput.value = String(sanitizeHyperbolaSpacing(state.hyperbolaSpacing));
  }
}

function removeLastShapeGroup() {
  if (!state.strokes.length) {
    return false;
  }

  const groupId = state.strokes[state.strokes.length - 1].groupId;
  if (groupId == null) {
    state.strokes.pop();
    draw();
    return true;
  }

  while (state.strokes.length && state.strokes[state.strokes.length - 1].groupId === groupId) {
    state.strokes.pop();
  }

  draw();
  return true;
}

function removeShapeGroupAtScreenPoint(screenPoint, thresholdPx = 12) {
  const hitIndex = findTopmostStrokeAtScreenPoint(screenPoint, thresholdPx);
  if (hitIndex === -1) {
    return false;
  }

  const hitStroke = state.strokes[hitIndex];
  if (!hitStroke) {
    return false;
  }

  const { groupId } = hitStroke;
  if (groupId == null) {
    state.strokes.splice(hitIndex, 1);
    draw();
    return true;
  }

  const initialLength = state.strokes.length;
  state.strokes = state.strokes.filter((stroke) => stroke.groupId !== groupId);
  if (state.strokes.length === initialLength) {
    return false;
  }

  draw();
  return true;
}

function isEditableElement(element) {
  if (!element) {
    return false;
  }

  if (element.isContentEditable) {
    return true;
  }

  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

betaInput.addEventListener("input", () => {
  state.beta = clampBetaToControlRange(Number.parseFloat(betaInput.value));
  syncBetaDrivenState();
});

betaValue.addEventListener("change", () => {
  const percent = Number.parseFloat(betaValue.value);
  if (!Number.isFinite(percent)) {
    syncVelocityLabels();
    return;
  }

  state.beta = clampBetaToControlRange(percent / 100);
  syncBetaDrivenState();
});

gammaValue.addEventListener("change", () => {
  const nextGamma = Number.parseFloat(gammaValue.value);
  if (!Number.isFinite(nextGamma) || nextGamma < 1) {
    syncVelocityLabels();
    return;
  }

  const magnitude = Math.sqrt(Math.max(0, 1 - 1 / (nextGamma * nextGamma)));
  const sign = state.beta < -1e-9 ? -1 : 1;
  state.beta = clampBetaToControlRange(sign * magnitude);
  syncBetaDrivenState();
});

rectifyViewInput.addEventListener("change", () => {
  state.rectifyViewEnabled = rectifyViewInput.checked;
  syncRectifyControls();
  draw();
});

rectifyAmountInput.addEventListener("input", () => {
  state.rectifyAmount = Number.parseFloat(rectifyAmountInput.value);
  syncRectifyLabels();
  draw();
});

showReferenceGridInput.addEventListener("change", () => {
  state.showReferenceGrid = showReferenceGridInput.checked;
  draw();
});

showLightConesInput.addEventListener("change", () => {
  state.showLightCones = showLightConesInput.checked;
  draw();
});

showHyperbolesInput.addEventListener("change", () => {
  state.showHyperboles = showHyperbolesInput.checked;
  if (!state.showHyperboles) {
    state.clipToHyperbolae = false;
    clipToHyperbolaeInput.checked = false;
  }
  syncHyperbolaControls();
  draw();
});

clipToHyperbolaeInput.addEventListener("change", () => {
  state.clipToHyperbolae = clipToHyperbolaeInput.checked;
});

hyperbolaSpacingInput?.addEventListener("change", () => {
  state.hyperbolaSpacing = sanitizeHyperbolaSpacing(
    Number.parseFloat(hyperbolaSpacingInput.value)
  );
  syncHyperbolaControls();
  draw();
});

showBellScenarioInput?.addEventListener("change", () => {
  state.bell.enabled = showBellScenarioInput.checked;
  if (state.bell.enabled) {
    state.twin.enabled = false;
  }
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncBellControls();
  syncTwinControls();
  draw();
});

bellSeparationInput?.addEventListener("change", () => {
  state.bell.separation = sanitizeBellSeparation(Number.parseFloat(bellSeparationInput.value));
  syncBellControls();
  draw();
});

bellAccelerationInput?.addEventListener("change", () => {
  state.bell.acceleration = sanitizeBellAcceleration(Number.parseFloat(bellAccelerationInput.value));
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncBellControls();
  draw();
});

bellProbeRocketInput?.addEventListener("change", () => {
  state.bell.probeRocket = bellProbeRocketInput.value === "rear" ? "rear" : "front";
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncBellControls();
  draw();
});

bellProbeTimeInput?.addEventListener("input", () => {
  state.bell.probeTime = sanitizeBellProbeTime(Number.parseFloat(bellProbeTimeInput.value));
  if (bellProbeTimeValueInput) {
    bellProbeTimeValueInput.value = state.bell.probeTime.toFixed(2);
  }
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  draw();
});

bellProbeTimeValueInput?.addEventListener("change", () => {
  state.bell.probeTime = sanitizeBellProbeTime(Number.parseFloat(bellProbeTimeValueInput.value));
  if (bellProbeTimeInput) {
    bellProbeTimeInput.value = String(state.bell.probeTime);
  }
  syncBellControls();
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  draw();
});

bellFollowProbeFrameInput?.addEventListener("change", () => {
  state.bell.followProbeFrame = bellFollowProbeFrameInput.checked;
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncBellControls();
  draw();
});

bellPinProbeXInput?.addEventListener("change", () => {
  state.bell.pinProbeX = bellPinProbeXInput.checked;
  syncBellControls();
  draw();
});

bellShowStringLengthInput?.addEventListener("change", () => {
  state.bell.showStringLength = bellShowStringLengthInput.checked;
  syncBellControls();
  draw();
});

showTwinScenarioInput?.addEventListener("change", () => {
  state.twin.enabled = showTwinScenarioInput.checked;
  if (state.twin.enabled) {
    state.bell.enabled = false;
  }
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncBellControls();
  syncTwinControls();
  draw();
});

twinTravelSpeedInput?.addEventListener("change", () => {
  state.twin.speed = sanitizeTwinSpeed(Number.parseFloat(twinTravelSpeedInput.value));
  twinCurveCache = null;
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncTwinControls();
  draw();
});

twinHalfTripProperTimeInput?.addEventListener("change", () => {
  state.twin.halfTripProperTime = sanitizeTwinHalfTripProperTime(Number.parseFloat(twinHalfTripProperTimeInput.value));
  state.twin.probeProperTime = sanitizeTwinProbeProperTime(state.twin.probeProperTime, state.twin.halfTripProperTime);
  twinCurveCache = null;
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncTwinControls();
  draw();
});

twinProbeProperTimeInput?.addEventListener("input", () => {
  state.twin.probeProperTime = sanitizeTwinProbeProperTime(Number.parseFloat(twinProbeProperTimeInput.value));
  if (twinProbeProperTimeValueInput) {
    twinProbeProperTimeValueInput.value = state.twin.probeProperTime.toFixed(2);
  }
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  draw();
});

twinProbeProperTimeValueInput?.addEventListener("change", () => {
  state.twin.probeProperTime = sanitizeTwinProbeProperTime(Number.parseFloat(twinProbeProperTimeValueInput.value));
  if (twinProbeProperTimeInput) {
    twinProbeProperTimeInput.value = String(state.twin.probeProperTime);
  }
  syncTwinControls();
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  draw();
});

twinFollowProbeFrameInput?.addEventListener("change", () => {
  state.twin.followProbeFrame = twinFollowProbeFrameInput.checked;
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncTwinControls();
  draw();
});

twinSmoothTurnaroundInput?.addEventListener("change", () => {
  state.twin.smoothTurnaround = twinSmoothTurnaroundInput.checked;
  twinCurveCache = null;
  if (applyScenarioProbeFrameLock()) {
    syncVelocityLabels();
    betaInput.value = String(state.beta);
  }
  syncTwinControls();
  draw();
});

showHyperbolaPointsInput.addEventListener("change", () => {
  state.showHyperbolaPoints = showHyperbolaPointsInput.checked;
  draw();
});

showAxisCoordinatesInput.addEventListener("change", () => {
  state.showAxisCoordinates = showAxisCoordinatesInput.checked;
  draw();
});

showReferenceAxisCoordinatesInput.addEventListener("change", () => {
  state.showReferenceAxisCoordinates = showReferenceAxisCoordinatesInput.checked;
  draw();
});

showReferencePointGuidesInput.addEventListener("change", () => {
  state.showReferencePointGuides = showReferencePointGuidesInput.checked;
  draw();
});

showBoostedPointGuidesInput.addEventListener("change", () => {
  state.showBoostedPointGuides = showBoostedPointGuidesInput.checked;
  draw();
});

showLineLengthsInput.addEventListener("change", () => {
  state.showLineLengths = showLineLengthsInput.checked;
  draw();
});

showPointCoordinatesInput.addEventListener("change", () => {
  state.showPointCoordinates = showPointCoordinatesInput.checked;
  draw();
});

hideAxesAndLinesInput.addEventListener("change", () => {
  state.hideAxesAndLines = hideAxesAndLinesInput.checked;
  draw();
});

showBoostedGridInput.addEventListener("change", () => {
  state.showBoostedGrid = showBoostedGridInput.checked;
  draw();
});

drawToolInput.addEventListener("change", () => {
  state.activeTool = drawToolInput.value;
  closeTextEditor();
  syncToolControls();
});

strokeColorInput.addEventListener("input", () => {
  state.strokeColor = strokeColorInput.value;
});

undoButton.addEventListener("click", () => {
  removeLastShapeGroup();
});

clearButton.addEventListener("click", () => {
  closeTextEditor();
  state.strokes = [];
  draw();
});

copyDiagramButton.addEventListener("click", () => {
  closeTextEditor();
  if (copyDiagramPopover?.hidden === false) {
    closeCopyDiagramPopover();
    return;
  }

  closeAxisVisibilityPopover();
  openCopyDiagramPopover();
});

confirmCopyDiagramButton?.addEventListener("click", () => {
  try {
    const viewport = getCopyDiagramViewport();
    copyDiagramToClipboard(viewport);
  } catch (error) {
    setCopyDiagramStatus(error.message || "Invalid crop bounds", { isError: true });
  }
});

cancelCopyDiagramButton?.addEventListener("click", () => {
  closeCopyDiagramPopover();
  setCopyDiagramStatus("");
});

axisVisibilityButton?.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

axisVisibilityButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  closeTextEditor();
  if (axisVisibilityPopover?.hidden === false) {
    closeAxisVisibilityPopover();
    return;
  }

  closeCopyDiagramPopover();
  openAxisVisibilityPopover();
});

axisHideLineModeInput?.addEventListener("change", () => {
  state.axisVisibilityEdit.lines = axisHideLineModeInput.checked;
  if (axisHideLineModeInput.checked) {
    state.axisVisibilityEdit.labels = false;
  }
  syncAxisVisibilityEditControls();
  syncToolControls();
});

axisHideLabelModeInput?.addEventListener("change", () => {
  state.axisVisibilityEdit.labels = axisHideLabelModeInput.checked;
  if (axisHideLabelModeInput.checked) {
    state.axisVisibilityEdit.lines = false;
  }
  syncAxisVisibilityEditControls();
  syncToolControls();
});

gridParallelAxisInput?.addEventListener("change", () => {
  state.gridParallelAxis = gridParallelAxisInput.value || "all";
  draw();
});

resetAxisVisibilityButton?.addEventListener("click", () => {
  resetAxisVisibility();
});

axisVisibilityPopover?.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

textEditorPopover?.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

confirmTextLabelButton?.addEventListener("click", () => {
  commitTextEditor();
});

cancelTextLabelButton?.addEventListener("click", () => {
  closeTextEditor();
  draw();
});

textEditorInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    commitTextEditor();
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeTextEditor();
    draw();
  }
});

tutorialPopover?.addEventListener("mouseenter", () => {
  setTutorialOpen(true);
});

tutorialPopover?.addEventListener("mouseleave", () => {
  setTutorialOpen(false);
});

tutorialPopover?.addEventListener("focusin", () => {
  setTutorialOpen(true);
});

tutorialPopover?.addEventListener("focusout", (event) => {
  if (tutorialPopover.contains(event.relatedTarget)) {
    return;
  }
  setTutorialOpen(false);
});

tutorialTrigger?.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

tutorialTrigger?.addEventListener("click", () => {
  setTutorialOpen(tutorialPanel?.hidden ?? true);
});

document.addEventListener("pointerdown", (event) => {
  if (!tutorialPopover || tutorialPanel?.hidden || tutorialPopover.contains(event.target)) {
  } else {
    setTutorialOpen(false);
  }

  if (
    axisVisibilityPopover &&
    !axisVisibilityPopover.hidden &&
    !axisVisibilityPopover.contains(event.target) &&
    !axisVisibilityButton.contains(event.target)
  ) {
    closeAxisVisibilityPopover();
  }

  if (
    !copyDiagramPopover ||
    copyDiagramPopover.hidden ||
    copyDiagramPopover.contains(event.target) ||
    copyDiagramButton.contains(event.target)
  ) {
    return;
  }

  closeCopyDiagramPopover();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state.textEditor.open) {
      closeTextEditor();
      draw();
      return;
    }

    if (axisVisibilityPopover && !axisVisibilityPopover.hidden) {
      closeAxisVisibilityPopover();
      return;
    }

    if (copyDiagramPopover && !copyDiagramPopover.hidden) {
      closeCopyDiagramPopover();
      setCopyDiagramStatus("");
      return;
    }

    if (tutorialPanel && !tutorialPanel.hidden) {
      setTutorialOpen(false);
      return;
    }
  }

  const isDeleteKey = event.key === "Backspace" || event.key === "Delete";
  if (!isDeleteKey) {
    return;
  }

  if (isEditableElement(document.activeElement)) {
    return;
  }

  event.preventDefault();
  removeLastShapeGroup();
});

canvas.addEventListener("pointerdown", startStroke);
canvas.addEventListener("pointermove", updateStroke);
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);
window.addEventListener("resize", resizeCanvas);

drawToolInput.value = state.activeTool;
rectifyViewInput.checked = state.rectifyViewEnabled;
clipToHyperbolaeInput.checked = state.clipToHyperbolae;
showHyperbolaPointsInput.checked = state.showHyperbolaPoints;
hideAxesAndLinesInput.checked = state.hideAxesAndLines;
syncAxisVisibilityEditControls();
syncToolControls();
syncLastUpdatedNote();
applyScenarioProbeFrameLock();
syncVelocityLabels();
syncRectifyControls();
syncBellControls();
syncTwinControls();
syncHyperbolaControls();
resizeCanvas();
