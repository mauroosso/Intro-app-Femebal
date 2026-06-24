// SVG path → Lottie bezier converter + animation builder
// Outputs: femebal-splash-simple.json, femebal-splash-complex.json, femebal-logo-optimized.svg

const fs = require('fs');
const path = require('path');

// ─── SVG path parser ──────────────────────────────────────────────────────────

function tokenize(d) {
  const re = /([MmCcLlZzHhVvSsQqTtAa])|(-?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)/gi;
  const tokens = [];
  let m;
  while ((m = re.exec(d)) !== null) {
    if (m[1]) tokens.push({ type: 'cmd', val: m[1] });
    else tokens.push({ type: 'num', val: parseFloat(m[2]) });
  }
  return tokens;
}

function parseNums(tokens, idx, count) {
  const nums = [];
  for (let i = 0; i < count; i++) {
    while (tokens[idx] && tokens[idx].type !== 'num') idx++;
    if (!tokens[idx]) break;
    nums.push(tokens[idx].val);
    idx++;
  }
  return { nums, idx };
}

// Convert SVG path string to Lottie shape {v, i, o, c}
function svgPathToLottie(d) {
  const tokens = tokenize(d);
  const shapes = [];   // one shape per subpath (M...Z)
  let v = [], i = [], o = [];
  let cx = 0, cy = 0; // current point
  let sx = 0, sy = 0; // subpath start
  let idx = 0;

  function pushVertex(x, y, ix, iy, ox, oy) {
    v.push([x, y]);
    i.push([ix, iy]);
    o.push([ox, oy]);
  }

  function finishSubpath(closed) {
    if (v.length > 0) {
      shapes.push({ v: [...v], i: [...i], o: [...o], c: closed });
    }
    v = []; i = []; o = [];
  }

  while (idx < tokens.length) {
    const tok = tokens[idx];
    if (tok.type !== 'cmd') { idx++; continue; }
    const cmd = tok.val;
    idx++;

    if (cmd === 'M' || cmd === 'm') {
      // implicit lineto after first moveto
      let first = true;
      while (idx < tokens.length && tokens[idx].type === 'num') {
        const r = parseNums(tokens, idx, 2);
        let [x, y] = r.nums; idx = r.idx;
        if (cmd === 'm') { x += cx; y += cy; }
        if (first) {
          if (v.length > 0) finishSubpath(false);
          sx = x; sy = y; cx = x; cy = y;
          pushVertex(x, y, 0, 0, 0, 0);
          first = false;
        } else {
          // implicit L
          if (v.length > 0) o[o.length - 1] = [0, 0];
          pushVertex(x, y, 0, 0, 0, 0);
          cx = x; cy = y;
        }
      }
    } else if (cmd === 'C' || cmd === 'c') {
      while (idx < tokens.length && tokens[idx].type === 'num') {
        const r = parseNums(tokens, idx, 6);
        let [x1, y1, x2, y2, x, y] = r.nums; idx = r.idx;
        if (cmd === 'c') { x1+=cx; y1+=cy; x2+=cx; y2+=cy; x+=cx; y+=cy; }
        // out-tangent of current (last) vertex
        if (o.length > 0) o[o.length - 1] = [x1 - cx, y1 - cy];
        pushVertex(x, y, x2 - x, y2 - y, 0, 0);
        cx = x; cy = y;
      }
    } else if (cmd === 'L' || cmd === 'l') {
      while (idx < tokens.length && tokens[idx].type === 'num') {
        const r = parseNums(tokens, idx, 2);
        let [x, y] = r.nums; idx = r.idx;
        if (cmd === 'l') { x += cx; y += cy; }
        if (o.length > 0) o[o.length - 1] = [0, 0];
        pushVertex(x, y, 0, 0, 0, 0);
        cx = x; cy = y;
      }
    } else if (cmd === 'H' || cmd === 'h') {
      while (idx < tokens.length && tokens[idx].type === 'num') {
        let x = tokens[idx].val; idx++;
        if (cmd === 'h') x += cx;
        if (o.length > 0) o[o.length - 1] = [0, 0];
        pushVertex(x, cy, 0, 0, 0, 0);
        cx = x;
      }
    } else if (cmd === 'V' || cmd === 'v') {
      while (idx < tokens.length && tokens[idx].type === 'num') {
        let y = tokens[idx].val; idx++;
        if (cmd === 'v') y += cy;
        if (o.length > 0) o[o.length - 1] = [0, 0];
        pushVertex(cx, y, 0, 0, 0, 0);
        cy = y;
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      finishSubpath(true);
      cx = sx; cy = sy;
    }
  }
  if (v.length > 0) finishSubpath(false);
  return shapes;
}

// ─── Load and parse SVG ───────────────────────────────────────────────────────

const svgRaw = fs.readFileSync(
  path.join(__dirname, 'logo-femebal.svg'), 'utf8'
);

const pathMatches = [...svgRaw.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*\/>/g)];
const rawPaths = pathMatches.map(m => m[1]);

// Parse all paths into Lottie bezier shapes
const allPathShapes = rawPaths.map(d => svgPathToLottie(d));

// SVG viewport: 162 × 191
// Lottie canvas: 1080 × 1920
// Center the logo on canvas with scale
const SVG_W = 162, SVG_H = 191;
const CANVAS_W = 1080, CANVAS_H = 1920;

// Scale to fit nicely centered (~400px wide)
const TARGET_W = 400;
const scale = TARGET_W / SVG_W;
const offsetX = (CANVAS_W - SVG_W * scale) / 2;
const offsetY = (CANVAS_H - SVG_H * scale) / 2;

function transformPoint([x, y]) {
  return [x * scale + offsetX, y * scale + offsetY];
}
function transformDelta([dx, dy]) {
  return [dx * scale, dy * scale];
}
function transformShape(shape) {
  return {
    v: shape.v.map(transformPoint),
    i: shape.i.map(transformDelta),
    o: shape.o.map(transformDelta),
    c: shape.c,
  };
}

// All shapes in canvas space
const canvasShapes = allPathShapes.map(subpaths => subpaths.map(transformShape));

// Separate icon (paths 0-2) from wordmark (paths 3-12)
const iconShapes    = canvasShapes.slice(0, 3).flat();
const wordmarkShapes = canvasShapes.slice(3).flat();
const allShapes     = canvasShapes.flat();

// Center of logo on canvas
const logoCenterX = offsetX + (SVG_W * scale) / 2;
const logoCenterY = offsetY + (SVG_H * scale) / 2;
// Wordmark bounding box (paths 3-12, y ≈ 161-191 in SVG space)
const wordmarkTop = 161 * scale + offsetY;

// ─── Lottie helpers ───────────────────────────────────────────────────────────

const BG_COLOR = [0.05, 0.05, 0.05]; // #0D0D0D

function solidBgLayer(w, h, op) {
  return {
    ddd: 0, ind: 99, ty: 1,
    nm: "Background",
    sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
      p: { a: 0, k: [w/2, h/2, 0] }, a: { a: 0, k: [0,0,0] },
      s: { a: 0, k: [100,100,100] } },
    ao: 0, sw: w, sh: h,
    sc: "#0d0d0d",
    ip: 0, op, st: 0, bm: 0
  };
}

function shapeItem(lottieShape) {
  return {
    ty: "sh", ix: 1, nm: "Path",
    ks: { a: 0, k: { i: lottieShape.i, o: lottieShape.o,
                     v: lottieShape.v, c: lottieShape.c } }
  };
}

function fillItem(r, g, b, a = 1) {
  return {
    ty: "fl", nm: "Fill",
    c: { a: 0, k: [r, g, b, a] },
    o: { a: 0, k: 100 },
    r: 1, bm: 0
  };
}

function groupFromShapes(shapes, nm = "Group") {
  const items = [
    ...shapes.map((s, j) => shapeItem(s)),
    fillItem(0.996, 0.996, 0.996)
  ];
  return { ty: "gr", nm, it: items, ix: 1, np: items.length, cix: 2, bm: 0, hd: false };
}

// Easing: cubic ease-out [0,0, 0.2, 1]
function easeOut() {
  return { x: { a: 1, k: [{ i:{x:[0.2],y:[1]}, o:{x:[0],y:[0]}, n:["0p2_1_0_0"], t:0, s:[0], e:[1] }] },
           y: { a: 1, k: [{ i:{x:[0.2],y:[1]}, o:{x:[0],y:[0]}, n:["0p2_1_0_0"], t:0, s:[0], e:[1] }] } };
}

function kfOpacity(frameIn, frameOut, fromV, toV) {
  return {
    a: 1,
    k: [
      { t: frameIn,  s: [fromV], e: [toV],  i: {x:[0.2],y:[1]}, o: {x:[0],y:[0]} },
      { t: frameOut, s: [toV] }
    ]
  };
}

function kfScale(frameIn, frameOut, fromPct, toPct) {
  return {
    a: 1,
    k: [
      { t: frameIn,  s: [fromPct, fromPct, 100], e: [toPct, toPct, 100],
        i: {x:[0.2],y:[1]}, o: {x:[0],y:[0]} },
      { t: frameOut, s: [toPct, toPct, 100] }
    ]
  };
}

// ─── VERSION 1: SIMPLE ────────────────────────────────────────────────────────
// Duration 1100ms = 66 frames @60fps
// 0–150ms (0–9f):  empty
// 150–550ms (9–33f): logo fades+scales in, opacity 0→100, scale 90→100
// 550–850ms (33–51f): hold (mask reveal not needed for simple, logo is all-shapes)
// 850–1100ms (51–66f): hold

const SIMPLE_OP = 66; // 1100ms

function buildSimple() {
  const logoLayer = {
    ddd: 0, ind: 1, ty: 4,
    nm: "FEMEBAL Logo",
    sr: 1,
    ks: {
      o: kfOpacity(9, 33, 0, 100),
      r: { a: 0, k: 0 },
      p: { a: 0, k: [logoCenterX, logoCenterY, 0] },
      a: { a: 0, k: [logoCenterX, logoCenterY, 0] },
      s: kfScale(9, 33, 90, 100)
    },
    ao: 0,
    shapes: [groupFromShapes(allShapes, "FEMEBAL")],
    ip: 0, op: SIMPLE_OP, st: 0, bm: 0
  };

  return {
    v: "5.9.0",
    fr: 60,
    ip: 0,
    op: SIMPLE_OP,
    w: CANVAS_W,
    h: CANVAS_H,
    nm: "Femebal Splash — Simple",
    ddd: 0,
    assets: [],
    layers: [logoLayer, solidBgLayer(CANVAS_W, CANVAS_H, SIMPLE_OP)]
  };
}

// ─── VERSION 2: COMPLEX ───────────────────────────────────────────────────────
// Duration 1500ms = 90 frames @60fps
// 0–150ms  (0–9f):   empty
// 150–450ms (9–27f):  icon shapes reveal left→right mask
// 450–800ms (27–48f): continue revealing internal shapes
// 800–1200ms (48–72f): wordmark reveals left→right mask
// 1200–1500ms (72–90f): hold

const COMPLEX_OP = 90;

// Mask: rect that sweeps left to right over the logo
// Lottie mask shape is a rectangle in layer local coords
// We animate the right edge of the rect from logoLeft to logoRight

const logoLeft   = offsetX;
const logoRight  = offsetX + SVG_W * scale;
const logoTop    = offsetY - 10;
const logoBottom = offsetY + SVG_H * scale + 10;

function sweepMask(frameStart, frameEnd, top, bottom, fromX, toX) {
  // Returns a Lottie mask object: rect sweeps from fromX to toX
  // The rect's left is always logoLeft - 5
  const left = logoLeft - 5;
  function rectShape(rightX) {
    return {
      i: [[0,0],[0,0],[0,0],[0,0]],
      o: [[0,0],[0,0],[0,0],[0,0]],
      v: [[left, top],[rightX, top],[rightX, bottom],[left, bottom]],
      c: true
    };
  }
  return {
    inv: false, mode: "a", nm: "Sweep Mask",
    o: { a: 0, k: 100 },
    pt: {
      a: 1,
      k: [
        { t: frameStart, s: [rectShape(fromX)], e: [rectShape(toX)],
          i: {x:[0.2],y:[1]}, o: {x:[0],y:[0]} },
        { t: frameEnd, s: [rectShape(toX)] }
      ]
    },
    x: { a: 0, k: 0 }, expansion: 0
  };
}

function buildComplex() {
  // Icon layer: all icon shapes (paths 0-2), mask sweeps 9→48
  const iconLayer = {
    ddd: 0, ind: 1, ty: 4,
    nm: "Icon",
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [0, 0, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] }
    },
    ao: 0,
    shapes: [groupFromShapes(iconShapes, "Icon Shapes")],
    masksProperties: [sweepMask(9, 48, logoTop, wordmarkTop - 5, logoLeft, logoRight)],
    ip: 0, op: COMPLEX_OP, st: 0, bm: 0
  };

  // Wordmark layer: paths 3-12, mask sweeps 48→72
  const wordmarkLayer = {
    ddd: 0, ind: 2, ty: 4,
    nm: "Wordmark",
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [0, 0, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] }
    },
    ao: 0,
    shapes: [groupFromShapes(wordmarkShapes, "Wordmark Shapes")],
    masksProperties: [sweepMask(48, 72, wordmarkTop - 5, logoBottom, logoLeft, logoRight)],
    ip: 0, op: COMPLEX_OP, st: 0, bm: 0
  };

  return {
    v: "5.9.0",
    fr: 60,
    ip: 0,
    op: COMPLEX_OP,
    w: CANVAS_W,
    h: CANVAS_H,
    nm: "Femebal Splash — Complex",
    ddd: 0,
    assets: [],
    layers: [iconLayer, wordmarkLayer, solidBgLayer(CANVAS_W, CANVAS_H, COMPLEX_OP)]
  };
}

// ─── Write outputs ─────────────────────────────────────────────────────────────

const simple  = buildSimple();
const complex = buildComplex();

fs.writeFileSync(
  path.join(__dirname, 'femebal-splash-simple.json'),
  JSON.stringify(simple, null, 2)
);
fs.writeFileSync(
  path.join(__dirname, 'femebal-splash-complex.json'),
  JSON.stringify(complex, null, 2)
);

// ─── Optimized SVG ─────────────────────────────────────────────────────────────

const pathData = rawPaths.map((d, idx) => {
  const group = idx < 3 ? 'icon' : 'wordmark';
  return `  <path class="${group}" d="${d}" fill="#FEFEFE"/>`;
}).join('\n');

const optimizedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 162 191">
${pathData}
</svg>`;

fs.writeFileSync(path.join(__dirname, 'femebal-logo-optimized.svg'), optimizedSvg);

console.log('Generated:');
console.log('  femebal-splash-simple.json  —', JSON.stringify(simple).length, 'bytes');
console.log('  femebal-splash-complex.json —', JSON.stringify(complex).length, 'bytes');
console.log('  femebal-logo-optimized.svg');
console.log('Paths parsed:', rawPaths.length, '| Shapes:', allShapes.length);
