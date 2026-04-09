const canvas = document.getElementById("diagram");
const ctx = canvas.getContext("2d");

const betaInput = document.getElementById("beta");
const betaValue = document.getElementById("betaValue");
const gammaValue = document.getElementById("gammaValue");
const drawToolInput = document.getElementById("drawTool");
const strokeColorInput = document.getElementById("strokeColor");
const showReferenceGridInput = document.getElementById("showReferenceGrid");
const showLightConesInput = document.getElementById("showLightCones");
const showHyperbolesInput = document.getElementById("showHyperboles");
const showAxisCoordinatesInput = document.getElementById("showAxisCoordinates");
const showReferenceAxisCoordinatesInput = document.getElementById("showReferenceAxisCoordinates");
const showBoostedPointGuidesInput = document.getElementById("showBoostedPointGuides");
const showReferencePointGuidesInput = document.getElementById("showReferencePointGuides");
const showLineLengthsInput = document.getElementById("showLineLengths");
const showPointCoordinatesInput = document.getElementById("showPointCoordinates");
const showBoostedGridInput = document.getElementById("showBoostedGrid");
const undoButton = document.getElementById("undo");
const clearButton = document.getElementById("clear");

const state = {
  beta: 0,
  scale: 40,
  activeTool: "line",
  strokeColor: "#0d2e3c",
  showReferenceGrid: true,
  showLightCones: true,
  showHyperboles: false,
  showAxisCoordinates: true,
  showReferenceAxisCoordinates: true,
  showBoostedPointGuides: false,
  showReferencePointGuides: false,
  showLineLengths: true,
  showPointCoordinates: true,
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

function gamma(beta) {
  return 1 / Math.sqrt(1 - beta * beta);
}

function renderBeta() {
  return -state.beta;
}

function lorentz(point, beta) {
  const g = gamma(beta);
  return {
    x: g * (point.x - beta * point.t),
    t: g * (point.t - beta * point.x)
  };
}

function worldToScreen(point) {
  return {
    x: view.width * 0.5 + point.x * state.scale,
    y: view.height * 0.5 - point.t * state.scale
  };
}

function screenToWorld(point) {
  return {
    x: (point.x - view.width * 0.5) / state.scale,
    t: (view.height * 0.5 - point.y) / state.scale
  };
}

function getWorldBounds() {
  return {
    maxX: view.width * 0.5 / state.scale,
    maxT: view.height * 0.5 / state.scale
  };
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

function snapPointToActiveGrid(point, thresholdPx = 10) {
  if (state.showReferenceGrid) {
    return snapPointToReferenceGrid(point, thresholdPx);
  }

  if (state.showBoostedGrid) {
    return snapPointToBoostedGrid(point, thresholdPx);
  }

  return point;
}

function maybeSnapPointToActiveGrid(point, event) {
  if (event.altKey) {
    return point;
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

function findTopmostStrokeAtScreenPoint(screenPoint, thresholdPx = 10) {
  let bestIndex = -1;
  let bestDistance = thresholdPx;

  for (let i = state.strokes.length - 1; i >= 0; i -= 1) {
    const d = transformedStrokeScreenDistance(state.strokes[i], screenPoint);
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

  ctx.save();
  ctx.lineWidth = 1;

  for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += 1) {
    const sx = worldToScreen({ x, t: 0 }).x;
    ctx.strokeStyle = x % 5 === 0 ? "#d5dde3" : "#edf1f4";
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, view.height);
    ctx.stroke();
  }

  for (let t = Math.ceil(minT); t <= Math.floor(maxT); t += 1) {
    const sy = worldToScreen({ x: 0, t }).y;
    ctx.strokeStyle = t % 5 === 0 ? "#d5dde3" : "#edf1f4";
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(view.width, sy);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBoostedGrid() {
  const { maxX, maxT } = getWorldBounds();
  const extent = Math.max(maxX, maxT) * 3;
  const gridLimit = Math.ceil(extent);
  const beta = renderBeta();

  ctx.save();

  for (let t = -gridLimit; t <= gridLimit; t += 1) {
    const start = worldToScreen(lorentz({ x: -extent, t }, beta));
    const end = worldToScreen(lorentz({ x: extent, t }, beta));
    const isMajor = t % 5 === 0;
    ctx.strokeStyle = isMajor ? "rgba(21, 71, 96, 0.18)" : "rgba(21, 71, 96, 0.10)";
    ctx.lineWidth = isMajor ? 1 : 0.8;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  for (let x = -gridLimit; x <= gridLimit; x += 1) {
    const start = worldToScreen(lorentz({ x, t: -extent }, beta));
    const end = worldToScreen(lorentz({ x, t: extent }, beta));
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

  ctx.font = "13px IBM Plex Sans, Segoe UI, sans-serif";
  ctx.fillStyle = "#154760";
  ctx.fillText("x", xEnd.x + 6, xEnd.y - 6);
  ctx.fillStyle = "#66411c";
  ctx.fillText("t", tEnd.x + 6, tEnd.y - 6);

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
  ctx.font = "11px IBM Plex Sans, Segoe UI, sans-serif";
  ctx.fillText("x0", refXEnd.x + 6, refXEnd.y + 14);
  ctx.fillText("t0", refTEnd.x + 6, refTEnd.y + 14);
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
  const { maxX, maxT } = getWorldBounds();
  const m = Math.max(maxX, maxT) * 1.2;

  ctx.save();
  ctx.strokeStyle = "#dc3a4a";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([7, 5]);

  const a1 = worldToScreen({ x: -m, t: -m });
  const b1 = worldToScreen({ x: m, t: m });
  const a2 = worldToScreen({ x: -m, t: m });
  const b2 = worldToScreen({ x: m, t: -m });

  ctx.beginPath();
  ctx.moveTo(a1.x, a1.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.moveTo(a2.x, a2.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.stroke();

  ctx.restore();
}

function plotWorldCurve(samples, color, width = 1.1, dash = []) {
  if (samples.length < 2) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();

  const first = worldToScreen(samples[0]);
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < samples.length; i += 1) {
    const p = worldToScreen(samples[i]);
    ctx.lineTo(p.x, p.y);
  }

  ctx.stroke();
  ctx.restore();
}

function drawHyperboles() {
  const { maxX, maxT } = getWorldBounds();
  const levels = [1, 2, 3, 4, 5, 6, 7, 8];
  const dx = 0.04;
  const dt = 0.04;

  for (const a of levels) {
    const timelikeTop = [];
    const timelikeBottom = [];

    for (let x = -maxX * 1.1; x <= maxX * 1.1; x += dx) {
      const t = Math.sqrt(a * a + x * x);
      timelikeTop.push({ x, t });
      timelikeBottom.push({ x, t: -t });
    }

    plotWorldCurve(timelikeTop, "#1a87a7", 1, [4, 4]);
    plotWorldCurve(timelikeBottom, "#1a87a7", 1, [4, 4]);

    const spacelikeRight = [];
    const spacelikeLeft = [];

    for (let t = -maxT * 1.1; t <= maxT * 1.1; t += dt) {
      const x = Math.sqrt(a * a + t * t);
      spacelikeRight.push({ x, t });
      spacelikeLeft.push({ x: -x, t });
    }

    plotWorldCurve(spacelikeRight, "#49a35e", 1, [4, 4]);
    plotWorldCurve(spacelikeLeft, "#49a35e", 1, [4, 4]);
  }
}

function drawStrokes() {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const stroke of state.strokes) {
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
    if (points.length < 2) {
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

    const transformedStart = worldToScreen(start);
    const transformedEnd = worldToScreen(end);
    const midpoint = {
      x: (transformedStart.x + transformedEnd.x) * 0.5,
      y: (transformedStart.y + transformedEnd.y) * 0.5
    };

    const label = `I = ${formatIntervalSquareRoot(metrics)}`;
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
  ctx.fillText(`v = ${formatVelocityPercent(state.beta)} of c`, 12, view.height - 26);
  ctx.fillText(`gamma = ${g.toFixed(3)}`, 12, view.height - 10);
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
  drawAxes();
  if (state.showReferencePointGuides) {
    drawReferencePointGuides();
  }
  if (state.showBoostedPointGuides) {
    drawBoostedPointGuides();
  }
  drawStrokes();
  drawIntervalMarkers();
  if (state.showLineLengths) {
    drawLineLengthLabels();
  }
  if (state.showPointCoordinates) {
    drawPointCoordinateLabels();
  }
  if (state.showAxisCoordinates) {
    drawAxisCoordinateValues();
  }
  if (state.showReferenceAxisCoordinates && canShowReferenceAxisCoordinateValues()) {
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
    const snappedPoint = maybeSnapPointToActiveGrid(point, event);
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
  const startPoint = maybeSnapPointToActiveGrid(point, event);

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
  stroke.points[1] = maybeSnapPointToActiveGrid(point, event);
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

function syncVelocityLabels() {
  const g = gamma(state.beta);
  betaValue.textContent = `${formatVelocityPercent(state.beta)} of c`;
  gammaValue.textContent = `(gamma = ${g.toFixed(2)})`;
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
  state.beta = Number.parseFloat(betaInput.value);
  syncVelocityLabels();
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
syncToolControls();
syncVelocityLabels();
resizeCanvas();
