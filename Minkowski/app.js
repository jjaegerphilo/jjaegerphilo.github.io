const canvas = document.getElementById("diagram");
const ctx = canvas.getContext("2d");

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
const showHyperbolaPointsInput = document.getElementById("showHyperbolaPoints");
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
const copyDiagramStatus = document.getElementById("copyDiagramStatus");
const lastUpdatedNote = document.getElementById("lastUpdated");
const tutorialPopover = document.querySelector(".tutorial-popover");
const tutorialTrigger = document.getElementById("tutorialTrigger");
const tutorialPanel = document.getElementById("tutorialPanel");

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
  clipToHyperbolae: false,
  showHyperbolaPoints: false,
  showAxisCoordinates: true,
  showReferenceAxisCoordinates: true,
  showBoostedPointGuides: false,
  showReferencePointGuides: false,
  showLineLengths: true,
  showPointCoordinates: true,
  hideAxesAndLines: false,
  showBoostedGrid: false,
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

const HYPERBOLA_LEVELS = Array.from({ length: 10 }, (_, index) => (index + 1) * 2);
const LIGHT_CONE_MARKER_STEP = HYPERBOLA_LEVELS[0] ?? 2;
const MIN_HYPERBOLA_X_EXTENT = 21;
const HYPERBOLA_MARKER_RAPIDITY_STEP = 0.45;

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
    return {
      a: 1,
      b: 0,
      determinant: 1
    };
  }

  const g = gamma(displayBeta);
  const a = g;
  const b = -g * displayBeta;
  return {
    a,
    b,
    determinant: a * a - b * b
  };
}

function getDisplayTransformMatrix() {
  return getDisplayTransformMatrixForAmount(displayRectificationAmount());
}

function applyDisplayTransform(point) {
  const { a, b } = getDisplayTransformMatrix();
  return {
    x: a * point.x + b * point.t,
    t: b * point.x + a * point.t
  };
}

function invertDisplayTransformWithMatrix(point, matrix) {
  const { a, b, determinant } = matrix;
  if (Math.abs(determinant) < 1e-9) {
    return point;
  }

  return {
    x: (a * point.x - b * point.t) / determinant,
    t: (-b * point.x + a * point.t) / determinant
  };
}

function invertDisplayTransform(point) {
  return invertDisplayTransformWithMatrix(point, getDisplayTransformMatrix());
}

function worldToScreen(point) {
  const displayPoint = applyDisplayTransform(point);
  return {
    x: view.width * 0.5 + displayPoint.x * state.scale,
    y: view.height * 0.5 - displayPoint.t * state.scale
  };
}

function referenceWorldToScreen(point) {
  return {
    x: view.width * 0.5 + point.x * state.scale,
    y: view.height * 0.5 - point.t * state.scale
  };
}

function screenToWorld(point) {
  const displayPoint = {
    x: (point.x - view.width * 0.5) / state.scale,
    t: (view.height * 0.5 - point.y) / state.scale
  };
  return invertDisplayTransform(displayPoint);
}

function getReferenceWorldBounds() {
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
    const displayPoint = {
      x: (corner.x - view.width * 0.5) / state.scale,
      t: (view.height * 0.5 - corner.y) / state.scale
    };
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
  ].map((corner) => lorentz(screenToWorld(corner), state.beta));

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

async function copyDiagramToClipboard() {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    setCopyDiagramStatus("Clipboard unavailable", { isError: true });
    return;
  }

  copyDiagramButton.disabled = true;
  setCopyDiagramStatus("Copying...", { persist: true });

  try {
    draw();

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportContext = exportCanvas.getContext("2d");
    exportContext.drawImage(canvas, 0, 0);

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
  } catch (error) {
    console.error(error);
    setCopyDiagramStatus("Copy failed", { isError: true });
  } finally {
    copyDiagramButton.disabled = false;
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
  const boostedPoint = lorentz(point, state.beta);
  const snappedBoostedPoint = {
    x: Math.round(boostedPoint.x),
    t: Math.round(boostedPoint.t)
  };
  const snappedPoint = lorentz(snappedBoostedPoint, renderBeta());
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

  let bestLevel = null;
  let bestDelta = Infinity;
  for (const candidate of HYPERBOLA_LEVELS) {
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

function transformedStrokeScreenDistance(stroke, screenPoint) {
  if (!stroke || !stroke.points.length) {
    return Infinity;
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

  return !(state.hideAxesAndLines && stroke.kind === "line");
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
  if (state.activeTool === "point" || state.activeTool === "eraser") {
    canvas.style.cursor = "crosshair";
    return;
  }

  canvas.style.cursor = "default";
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
}

function drawGrid() {
  const { maxX, maxT } = getWorldBounds();
  const minX = -maxX;
  const minT = -maxT;
  const xExtent = maxX * 1.1;
  const tExtent = maxT * 1.1;

  ctx.save();
  ctx.lineWidth = 1;

  for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += 1) {
    const start = worldToScreen({ x, t: -tExtent });
    const end = worldToScreen({ x, t: tExtent });
    ctx.strokeStyle = x % 5 === 0 ? "#d5dde3" : "#edf1f4";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  for (let t = Math.ceil(minT); t <= Math.floor(maxT); t += 1) {
    const start = worldToScreen({ x: -xExtent, t });
    const end = worldToScreen({ x: xExtent, t });
    ctx.strokeStyle = t % 5 === 0 ? "#d5dde3" : "#edf1f4";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBoostedGrid() {
  const { maxX, maxT } = getBoostedFrameBounds();
  const xExtent = Math.max(maxX * 1.35, 2);
  const tExtent = Math.max(maxT * 1.35, 2);
  const xGridLimit = Math.ceil(xExtent);
  const tGridLimit = Math.ceil(tExtent);
  const betaToWorld = renderBeta();

  ctx.save();

  for (let t = -tGridLimit; t <= tGridLimit; t += 1) {
    const start = worldToScreen(lorentz({ x: -xExtent, t }, betaToWorld));
    const end = worldToScreen(lorentz({ x: xExtent, t }, betaToWorld));
    const isMajor = t % 5 === 0;
    ctx.strokeStyle = isMajor ? "rgba(21, 71, 96, 0.18)" : "rgba(21, 71, 96, 0.10)";
    ctx.lineWidth = isMajor ? 1 : 0.8;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  for (let x = -xGridLimit; x <= xGridLimit; x += 1) {
    const start = worldToScreen(lorentz({ x, t: -tExtent }, betaToWorld));
    const end = worldToScreen(lorentz({ x, t: tExtent }, betaToWorld));
    const isMajor = x % 5 === 0;
    ctx.strokeStyle = isMajor ? "rgba(102, 65, 28, 0.18)" : "rgba(102, 65, 28, 0.10)";
    ctx.lineWidth = isMajor ? 1 : 0.8;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
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
    return;
  }

  const dx = clippedSegment.end.x - clippedSegment.start.x;
  const dy = clippedSegment.end.y - clippedSegment.start.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) {
    return;
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
}

function drawAxes() {
  const { maxX, maxT } = getWorldBounds();
  const extent = Math.max(maxX, maxT) * 1.6;
  const beta = renderBeta();
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
  const transformedXAxis = baseXAxis.map((p) => lorentz(p, beta));
  const transformedTAxis = baseTAxis.map((p) => lorentz(p, beta));

  const refXStart = worldToScreen(referenceXAxis[0]);
  const refXEnd = worldToScreen(referenceXAxis[1]);
  const refTStart = worldToScreen(referenceTAxis[0]);
  const refTEnd = worldToScreen(referenceTAxis[1]);
  const xStart = worldToScreen(transformedXAxis[0]);
  const xEnd = worldToScreen(transformedXAxis[1]);
  const tStart = worldToScreen(transformedTAxis[0]);
  const tEnd = worldToScreen(transformedTAxis[1]);
  const origin = worldToScreen(lorentz({ x: 0, t: 0 }, beta));

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#154760";
  ctx.beginPath();
  ctx.moveTo(xStart.x, xStart.y);
  ctx.lineTo(xEnd.x, xEnd.y);
  ctx.stroke();

  ctx.strokeStyle = "#66411c";
  ctx.beginPath();
  ctx.moveTo(tStart.x, tStart.y);
  ctx.lineTo(tEnd.x, tEnd.y);
  ctx.stroke();

  ctx.fillStyle = "#1f2f3a";
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 2.8, 0, Math.PI * 2);
  ctx.fill();

  const showBoostedAxisLabels = Math.abs(beta) > 1e-6;
  if (showBoostedAxisLabels) {
    ctx.font = "20px IBM Plex Sans, Segoe UI, sans-serif";
    ctx.fillStyle = "#154760";
    drawClampedAxisLabel("x'", xStart, xEnd, { alongOffset: 18, normalOffset: 12 });
    ctx.fillStyle = "#66411c";
    drawClampedAxisLabel("t'", tStart, tEnd, { alongOffset: 18, normalOffset: 12 });
  }

  ctx.setLineDash([8, 4]);
  ctx.strokeStyle = "rgba(58, 68, 76, 0.72)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(refXStart.x, refXStart.y);
  ctx.lineTo(refXEnd.x, refXEnd.y);
  ctx.moveTo(refTStart.x, refTStart.y);
  ctx.lineTo(refTEnd.x, refTEnd.y);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(58, 68, 76, 0.9)";
  ctx.font = "17px IBM Plex Sans, Segoe UI, sans-serif";
  drawClampedAxisLabel("x", refXStart, refXEnd, { alongOffset: 18, normalOffset: 12 });
  drawClampedAxisLabel("t", refTStart, refTEnd, { alongOffset: 18, normalOffset: 12 });
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
  const beta = renderBeta();
  drawAxisCoordinateValuesForAxis(
    (value) => worldToScreen(lorentz({ x: value, t: 0 }, beta)),
    "rgba(21, 71, 96, 0.88)"
  );
  drawAxisCoordinateValuesForAxis(
    (value) => worldToScreen(lorentz({ x: 0, t: value }, beta)),
    "rgba(102, 65, 28, 0.88)"
  );
}

function canShowReferenceAxisCoordinateValues() {
  const beta = renderBeta();
  if (Math.abs(beta) < 1e-6) {
    return false;
  }

  const sampleValue = 4;
  const referenceXPoint = worldToScreen({ x: sampleValue, t: 0 });
  const boostedXPoint = worldToScreen(lorentz({ x: sampleValue, t: 0 }, beta));
  const referenceTPoint = worldToScreen({ x: 0, t: sampleValue });
  const boostedTPoint = worldToScreen(lorentz({ x: 0, t: sampleValue }, beta));
  const minSeparation = Math.min(
    Math.sqrt(pointDistanceSquared(referenceXPoint, boostedXPoint)),
    Math.sqrt(pointDistanceSquared(referenceTPoint, boostedTPoint))
  );

  return minSeparation >= 28;
}

function drawReferenceAxisCoordinateValues() {
  const color = "rgba(58, 68, 76, 0.88)";
  drawAxisCoordinateValuesForAxis(
    (value) => worldToScreen({ x: value, t: 0 }),
    color
  );
  drawAxisCoordinateValuesForAxis(
    (value) => worldToScreen({ x: 0, t: value }),
    color
  );
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

  for (const a of HYPERBOLA_LEVELS) {
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
  const minLevel = HYPERBOLA_LEVELS[0] ?? 1;
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

  for (const level of HYPERBOLA_LEVELS) {
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
  const maxConeLevel = Math.ceil(coneExtent / LIGHT_CONE_MARKER_STEP) * LIGHT_CONE_MARKER_STEP;

  for (let level = LIGHT_CONE_MARKER_STEP; level <= maxConeLevel; level += LIGHT_CONE_MARKER_STEP) {
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
  const boostedFrameBeta = state.beta;
  const inverseBeta = renderBeta();

  ctx.save();
  ctx.lineWidth = 1.15;
  ctx.setLineDash([6, 4]);

  for (const stroke of state.strokes) {
    if (stroke.kind !== "point" || stroke.points.length !== 1) {
      continue;
    }

    const point = stroke.points[0];
    const boostedPoint = lorentz(point, boostedFrameBeta);
    drawPointGuideSegments([
      {
        start: lorentz({ x: boostedPoint.x, t: 0 }, inverseBeta),
        end: point,
        color: "rgba(21, 71, 96, 0.36)"
      },
      {
        start: lorentz({ x: 0, t: boostedPoint.t }, inverseBeta),
        end: point,
        color: "rgba(102, 65, 28, 0.36)"
      }
    ]);
  }

  ctx.restore();
}

function drawPointCoordinateLabels() {
  const boostedFrameBeta = state.beta;

  ctx.save();
  ctx.font = "12px IBM Plex Sans, Segoe UI, sans-serif";

  for (const stroke of state.strokes) {
    if (stroke.kind !== "point" || stroke.points.length !== 1) {
      continue;
    }

    const point = stroke.points[0];
    const screenPoint = worldToScreen(point);
    const boostedPoint = lorentz(point, boostedFrameBeta);
    const lines = [
      `(t, x) = (${formatCoordinateValue(point.t)}, ${formatCoordinateValue(point.x)})`
    ];

    if (Math.abs(boostedFrameBeta) > 1e-6) {
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
  if (!state.hideAxesAndLines) {
    drawIntervalMarkers();
  }
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

  const dragRequested = event.shiftKey;
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

function syncHyperbolaClipControls() {
  const shouldShow = state.showHyperboles;
  hyperbolaClipLabel.classList.toggle("is-hidden", !shouldShow);
  hyperbolaClipLabel.hidden = !shouldShow;
  hyperbolaClipLabel.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  clipToHyperbolaeInput.disabled = !state.showHyperboles;
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
  syncHyperbolaClipControls();
  draw();
});

clipToHyperbolaeInput.addEventListener("change", () => {
  state.clipToHyperbolae = clipToHyperbolaeInput.checked;
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
  syncToolControls();
});

strokeColorInput.addEventListener("input", () => {
  state.strokeColor = strokeColorInput.value;
});

undoButton.addEventListener("click", () => {
  removeLastShapeGroup();
});

clearButton.addEventListener("click", () => {
  state.strokes = [];
  draw();
});

copyDiagramButton.addEventListener("click", () => {
  copyDiagramToClipboard();
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
    return;
  }

  setTutorialOpen(false);
});

window.addEventListener("keydown", (event) => {
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
syncToolControls();
syncLastUpdatedNote();
syncVelocityLabels();
syncRectifyControls();
syncHyperbolaClipControls();
resizeCanvas();
