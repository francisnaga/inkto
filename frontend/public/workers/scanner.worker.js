/* eslint-disable no-undef */
// Web Worker for CamScanner-Grade Computer Vision (WebAssembly + OpenCV.js)

let cvReady = false;

function initOpenCV() {
  try {
    try {
      importScripts('/opencv.js');
    } catch {
      importScripts('/workers/opencv.js');
    }

    if (typeof cv !== 'undefined') {
      if (cv.onRuntimeInitialized) {
        cv.onRuntimeInitialized = () => {
          cvReady = true;
          self.postMessage({ type: 'CV_READY' });
        };
      } else {
        cvReady = true;
        self.postMessage({ type: 'CV_READY' });
      }
    }
  } catch (err) {
    console.error('Failed to load opencv.js in worker:', err);
    self.postMessage({ type: 'CV_ERROR', error: err.message });
  }
}

initOpenCV();

// ── Geometry Helpers ────────────────────────────────────────────────────────
function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function orderCorners(pts) {
  if (!pts || pts.length !== 4) return pts;
  // Sort by Y coordinate
  const sortedY = [...pts].sort((a, b) => a.y - b.y);
  const top = sortedY.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sortedY.slice(2, 4).sort((a, b) => a.x - b.x);

  return [
    top[0],     // Top-Left (TL)
    top[1],     // Top-Right (TR)
    bottom[1],  // Bottom-Right (BR)
    bottom[0]   // Bottom-Left (BL)
  ];
}

function getDefaultCorners(w, h) {
  const p = 0.08; // 8% inset fallback
  return [
    { x: Math.round(w * p), y: Math.round(h * p) },
    { x: Math.round(w * (1 - p)), y: Math.round(h * p) },
    { x: Math.round(w * (1 - p)), y: Math.round(h * (1 - p)) },
    { x: Math.round(w * p), y: Math.round(h * (1 - p)) }
  ];
}

// ── A. Automatic Quad Detection (DETECT_EDGES) ──────────────────────────────
function detectEdges(imageData) {
  if (!cvReady || typeof cv === 'undefined') {
    return getDefaultCorners(imageData.width, imageData.height);
  }

  let src = null, small = null, gray = null, blurred = null, edges = null;
  let dilated = null, kernel = null, contours = null, hierarchy = null, approx = null;

  try {
    src = cv.matFromImageData(imageData);
    const origW = imageData.width;
    const origH = imageData.height;

    // 1. Downscale to max dimension 800px
    const maxDim = 800;
    const scale = Math.min(1.0, maxDim / Math.max(origW, origH));
    const smallW = Math.round(origW * scale);
    const smallH = Math.round(origH * scale);

    small = new cv.Mat();
    cv.resize(src, small, new cv.Size(smallW, smallH), 0, 0, cv.INTER_AREA);

    // 2. Grayscale
    gray = new cv.Mat();
    cv.cvtColor(small, gray, cv.COLOR_RGBA2GRAY);

    // 3. Gaussian Blur
    blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    // 4. Canny Edge
    edges = new cv.Mat();
    cv.Canny(blurred, edges, 75, 200);

    // 5. Morphological Dilation with 3x3 kernel
    dilated = new cv.Mat();
    kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.dilate(edges, dilated, kernel);

    // 6. Find Contours
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let bestQuad = null;
    approx = new cv.Mat();
    const minAreaThreshold = (smallW * smallH) * 0.15; // At least 15% area threshold per spec

    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const area = cv.contourArea(c);
      if (area > minAreaThreshold) {
        const peri = cv.arcLength(c, true);
        cv.approxPolyDP(c, approx, 0.02 * peri, true);

        if (approx.rows === 4 && cv.isContourConvex(approx)) {
          if (area > maxArea) {
            maxArea = area;
            const pts = [];
            for (let j = 0; j < 4; j++) {
              pts.push({
                x: Math.round(approx.data32S[j * 2] / scale),
                y: Math.round(approx.data32S[j * 2 + 1] / scale)
              });
            }
            bestQuad = orderCorners(pts);
          }
        }
      }
      c.delete();
    }

    if (bestQuad) {
      return bestQuad;
    }
  } catch (err) {
    console.warn('Worker edge detection warning:', err);
  } finally {
    if (src) src.delete();
    if (small) small.delete();
    if (gray) gray.delete();
    if (blurred) blurred.delete();
    if (edges) edges.delete();
    if (dilated) dilated.delete();
    if (kernel) kernel.delete();
    if (contours) contours.delete();
    if (hierarchy) hierarchy.delete();
    if (approx) approx.delete();
  }

  return getDefaultCorners(imageData.width, imageData.height);
}

// ── B. Perspective Homography Transform (WARP_PERSPECTIVE) ───────────────────
function warpPerspective(imageData, corners) {
  if (!cvReady || typeof cv === 'undefined') {
    throw new Error('OpenCV is not initialized');
  }

  let src = null, dst = null, M = null, srcPts = null, dstPts = null;

  try {
    src = cv.matFromImageData(imageData);
    const [tl, tr, br, bl] = corners;

    const width = Math.max(100, Math.round(Math.max(distance(br, bl), distance(tr, tl))));
    const height = Math.max(100, Math.round(Math.max(distance(tr, br), distance(tl, bl))));

    srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tl.x, tl.y,
      tr.x, tr.y,
      br.x, br.y,
      bl.x, bl.y
    ]);

    dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      width, 0,
      width, height,
      0, height
    ]);

    M = cv.getPerspectiveTransform(srcPts, dstPts);
    dst = new cv.Mat();
    cv.warpPerspective(src, dst, M, new cv.Size(width, height), cv.INTER_CUBIC, cv.BORDER_CONSTANT, new cv.Scalar());

    const outData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
    return outData;
  } finally {
    if (src) src.delete();
    if (dst) dst.delete();
    if (M) M.delete();
    if (srcPts) srcPts.delete();
    if (dstPts) dstPts.delete();
  }
}

// ── C. CamScanner Filter Pipelines (APPLY_FILTER) ───────────────────────────

// 1. Magic Color (CamScanner Signature Shadow-Removal)
function applyMagicColor(imageData) {
  let src = null, rgb = null, lab = null, l = null, a = null, b = null;
  let bgKernel = null, bgDilated = null, bgSmooth = null, diff = null;
  let normL = null, claheL = null, clahe = null;
  let mergedLab = null, finalRgb = null, sharpened = null, sharpKernel = null;
  let channels = null, mergedChans = null, outRgba = null;

  try {
    src = cv.matFromImageData(imageData);
    rgb = new cv.Mat();
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);

    lab = new cv.Mat();
    cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);

    channels = new cv.MatVector();
    cv.split(lab, channels);
    l = channels.get(0);
    a = channels.get(1);
    b = channels.get(2);

    // Illumination estimation via 25x25 morphological dilation
    bgKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(25, 25));
    bgDilated = new cv.Mat();
    cv.morphologyEx(l, bgDilated, cv.MORPH_DILATE, bgKernel);

    // Median blur smoothing
    bgSmooth = new cv.Mat();
    cv.medianBlur(bgDilated, bgSmooth, 21);

    // Background division: normalized_L = 255 - absdiff(L, bg_smooth)
    diff = new cv.Mat();
    cv.absdiff(l, bgSmooth, diff);
    normL = new cv.Mat(l.rows, l.cols, cv.CV_8UC1, new cv.Scalar(255));
    cv.subtract(normL, diff, normL);

    // CLAHE contrast enhancement
    claheL = new cv.Mat();
    clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    clahe.apply(normL, claheL);

    // Merge channels
    mergedChans = new cv.MatVector();
    mergedChans.push_back(claheL);
    mergedChans.push_back(a);
    mergedChans.push_back(b);

    mergedLab = new cv.Mat();
    cv.merge(mergedChans, mergedLab);

    finalRgb = new cv.Mat();
    cv.cvtColor(mergedLab, finalRgb, cv.COLOR_Lab2RGB);

    // Unsharp mask stroke sharpening: [0, -1, 0; -1, 5, -1; 0, -1, 0]
    sharpKernel = cv.matFromArray(3, 3, cv.CV_32F, [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ]);
    sharpened = new cv.Mat();
    cv.filter2D(finalRgb, sharpened, -1, sharpKernel);

    outRgba = new cv.Mat();
    cv.cvtColor(sharpened, outRgba, cv.COLOR_RGB2RGBA);

    return new ImageData(new Uint8ClampedArray(outRgba.data), outRgba.cols, outRgba.rows);
  } finally {
    if (src) src.delete();
    if (rgb) rgb.delete();
    if (lab) lab.delete();
    if (l) l.delete();
    if (a) a.delete();
    if (b) b.delete();
    if (bgKernel) bgKernel.delete();
    if (bgDilated) bgDilated.delete();
    if (bgSmooth) bgSmooth.delete();
    if (diff) diff.delete();
    if (normL) normL.delete();
    if (claheL) claheL.delete();
    if (clahe) clahe.delete();
    if (mergedLab) mergedLab.delete();
    if (finalRgb) finalRgb.delete();
    if (sharpened) sharpened.delete();
    if (sharpKernel) sharpKernel.delete();
    if (channels) channels.delete();
    if (mergedChans) mergedChans.delete();
    if (outRgba) outRgba.delete();
  }
}

// 2. Clean B&W (Monochrome High Contrast)
function applyCleanBW(imageData) {
  let src = null, gray = null, bgKernel = null, bgDilated = null, bgSmooth = null;
  let diff = null, norm = null, thresh = null, openKernel = null, clean = null, outRgba = null;

  try {
    src = cv.matFromImageData(imageData);
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    bgKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(25, 25));
    bgDilated = new cv.Mat();
    cv.morphologyEx(gray, bgDilated, cv.MORPH_DILATE, bgKernel);

    bgSmooth = new cv.Mat();
    cv.medianBlur(bgDilated, bgSmooth, 21);

    diff = new cv.Mat();
    cv.absdiff(gray, bgSmooth, diff);
    norm = new cv.Mat(gray.rows, gray.cols, cv.CV_8UC1, new cv.Scalar(255));
    cv.subtract(norm, diff, norm);

    // Otsu's binarization threshold
    thresh = new cv.Mat();
    cv.threshold(norm, thresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

    // Morphological opening with 2x2 kernel
    openKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    clean = new cv.Mat();
    cv.morphologyEx(thresh, clean, cv.MORPH_OPEN, openKernel);

    outRgba = new cv.Mat();
    cv.cvtColor(clean, outRgba, cv.COLOR_GRAY2RGBA);

    return new ImageData(new Uint8ClampedArray(outRgba.data), outRgba.cols, outRgba.rows);
  } finally {
    if (src) src.delete();
    if (gray) gray.delete();
    if (bgKernel) bgKernel.delete();
    if (bgDilated) bgDilated.delete();
    if (bgSmooth) bgSmooth.delete();
    if (diff) diff.delete();
    if (norm) norm.delete();
    if (thresh) thresh.delete();
    if (openKernel) openKernel.delete();
    if (clean) clean.delete();
    if (outRgba) outRgba.delete();
  }
}

// 3. No Shadow (Color Preserved, Illumination Normalized)
function applyNoShadow(imageData) {
  let src = null, rgb = null, channels = null, normChannels = null;
  let bgKernel = null, merged = null, outRgba = null;

  try {
    src = cv.matFromImageData(imageData);
    rgb = new cv.Mat();
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);

    channels = new cv.MatVector();
    cv.split(rgb, channels);

    bgKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(25, 25));
    normChannels = new cv.MatVector();

    for (let c = 0; c < 3; c++) {
      const ch = channels.get(c);
      const bgDil = new cv.Mat();
      cv.morphologyEx(ch, bgDil, cv.MORPH_DILATE, bgKernel);
      const bgSm = new cv.Mat();
      cv.medianBlur(bgDil, bgSm, 21);

      const diff = new cv.Mat();
      cv.absdiff(ch, bgSm, diff);
      const norm = new cv.Mat(ch.rows, ch.cols, cv.CV_8UC1, new cv.Scalar(255));
      cv.subtract(norm, diff, norm);

      normChannels.push_back(norm);

      ch.delete();
      bgDil.delete();
      bgSm.delete();
      diff.delete();
    }

    merged = new cv.Mat();
    cv.merge(normChannels, merged);

    outRgba = new cv.Mat();
    cv.cvtColor(merged, outRgba, cv.COLOR_RGB2RGBA);

    return new ImageData(new Uint8ClampedArray(outRgba.data), outRgba.cols, outRgba.rows);
  } finally {
    if (src) src.delete();
    if (rgb) rgb.delete();
    if (channels) channels.delete();
    if (normChannels) {
      for (let i = 0; i < normChannels.size(); i++) {
        normChannels.get(i).delete();
      }
      normChannels.delete();
    }
    if (bgKernel) bgKernel.delete();
    if (merged) merged.delete();
    if (outRgba) outRgba.delete();
  }
}

// 4. Lighten
function applyLighten(imageData) {
  let src = null, rgb = null, lab = null, l = null, a = null, b = null;
  let brightL = null, channels = null, mergedChans = null, mergedLab = null, rgbOut = null, outRgba = null;

  try {
    src = cv.matFromImageData(imageData);
    rgb = new cv.Mat();
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);

    lab = new cv.Mat();
    cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);

    channels = new cv.MatVector();
    cv.split(lab, channels);
    l = channels.get(0);
    a = channels.get(1);
    b = channels.get(2);

    brightL = new cv.Mat();
    l.convertTo(brightL, -1, 1.15, 20);

    mergedChans = new cv.MatVector();
    mergedChans.push_back(brightL);
    mergedChans.push_back(a);
    mergedChans.push_back(b);

    mergedLab = new cv.Mat();
    cv.merge(mergedChans, mergedLab);

    rgbOut = new cv.Mat();
    cv.cvtColor(mergedLab, rgbOut, cv.COLOR_Lab2RGB);

    outRgba = new cv.Mat();
    cv.cvtColor(rgbOut, outRgba, cv.COLOR_RGB2RGBA);

    return new ImageData(new Uint8ClampedArray(outRgba.data), outRgba.cols, outRgba.rows);
  } finally {
    if (src) src.delete();
    if (rgb) rgb.delete();
    if (lab) lab.delete();
    if (l) l.delete();
    if (a) a.delete();
    if (b) b.delete();
    if (brightL) brightL.delete();
    if (channels) channels.delete();
    if (mergedChans) mergedChans.delete();
    if (mergedLab) mergedLab.delete();
    if (rgbOut) rgbOut.delete();
    if (outRgba) outRgba.delete();
  }
}

// ── Message Handler ──────────────────────────────────────────────────────────
self.onmessage = async function(e) {
  const { id, type, payload } = e.data;
  const startTime = performance.now();

  try {
    switch (type) {
      case 'DETECT_EDGES':
      case 'DETECT_CORNERS': {
        const corners = detectEdges(payload.imageData);
        self.postMessage({ id, type: 'SUCCESS', result: corners, durationMs: performance.now() - startTime });
        break;
      }

      case 'WARP_PERSPECTIVE':
      case 'WARP': {
        const warped = warpPerspective(payload.imageData, payload.corners);
        self.postMessage(
          { id, type: 'SUCCESS', result: warped, durationMs: performance.now() - startTime },
          [warped.data.buffer]
        );
        break;
      }

      case 'APPLY_FILTER':
      case 'FILTER': {
        const { imageData, filter } = payload;
        let processed;
        switch (filter) {
          case 'magic_color':
            processed = applyMagicColor(imageData);
            break;
          case 'clean_bw':
          case 'bw':
            processed = applyCleanBW(imageData);
            break;
          case 'no_shadow':
            processed = applyNoShadow(imageData);
            break;
          case 'lighten':
            processed = applyLighten(imageData);
            break;
          case 'original':
          default:
            processed = imageData;
            break;
        }

        self.postMessage(
          { id, type: 'SUCCESS', result: processed, durationMs: performance.now() - startTime },
          [processed.data.buffer]
        );
        break;
      }

      default:
        self.postMessage({ id, type: 'ERROR', error: `Unknown worker action: ${type}` });
    }
  } catch (err) {
    self.postMessage({ id, type: 'ERROR', error: err.message });
  }
};
