/* eslint-disable no-undef */
// Web Worker for CamScanner-Grade Image Processing via OpenCV.js (WebAssembly)

let cvReady = false;

// Initialize OpenCV.js
function initCv() {
  try {
    importScripts('/workers/opencv.js');
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
    console.error('Worker failed to load opencv.js:', err);
    self.postMessage({ type: 'CV_ERROR', error: err.message });
  }
}

initCv();

// Order 4 points: Top-Left, Top-Right, Bottom-Right, Bottom-Left
function orderCorners(pts) {
  if (!pts || pts.length !== 4) return pts;
  
  // Sort by y-coordinate
  const sortedByY = [...pts].sort((a, b) => a.y - b.y);
  const top = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sortedByY.slice(2, 4).sort((a, b) => a.x - b.x);

  return [
    top[0],     // Top-Left
    top[1],     // Top-Right
    bottom[1],  // Bottom-Right
    bottom[0]   // Bottom-Left
  ];
}

// Distance helper
function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

// ── 1. Edge & Contour Quad Detection ──────────────────────────────────────────
function detectDocumentCorners(imageData) {
  if (!cvReady || typeof cv === 'undefined') {
    return getDefaultCorners(imageData.width, imageData.height);
  }

  let src = null, small = null, gray = null, blur = null, edges = null, dilated = null;
  let kernel = null, contours = null, hierarchy = null, approx = null;

  try {
    src = cv.matFromImageData(imageData);
    const origW = imageData.width;
    const origH = imageData.height;

    // 1. Downscale to max dimension 800px for high-speed edge processing
    const maxDim = 800;
    const scale = Math.min(1.0, maxDim / Math.max(origW, origH));
    const smallW = Math.round(origW * scale);
    const smallH = Math.round(origH * scale);

    small = new cv.Mat();
    cv.resize(src, small, new cv.Size(smallW, smallH), 0, 0, cv.INTER_AREA);

    // 2. Convert to Grayscale
    gray = new cv.Mat();
    cv.cvtColor(small, gray, cv.COLOR_RGBA2GRAY);

    // 3. Gaussian Blur
    blur = new cv.Mat();
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

    // 4. Canny Edge Detection
    edges = new cv.Mat();
    cv.Canny(blur, edges, 75, 200);

    // 5. Morphological Dilation
    dilated = new cv.Mat();
    kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    cv.dilate(edges, dilated, kernel);

    // 6. Find contours
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let bestQuad = null;
    approx = new cv.Mat();

    const minAreaThreshold = (smallW * smallH) * 0.05; // At least 5% of viewport

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
                x: approx.data32S[j * 2] / scale,
                y: approx.data32S[j * 2 + 1] / scale
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
    console.warn('Contour detection error:', err);
  } finally {
    if (src) src.delete();
    if (small) small.delete();
    if (gray) gray.delete();
    if (blur) blur.delete();
    if (edges) edges.delete();
    if (dilated) dilated.delete();
    if (kernel) kernel.delete();
    if (contours) contours.delete();
    if (hierarchy) hierarchy.delete();
    if (approx) approx.delete();
  }

  return getDefaultCorners(imageData.width, imageData.height);
}

function getDefaultCorners(w, h) {
  const p = 0.08; // 8% inset per spec
  return [
    { x: Math.round(w * p), y: Math.round(h * p) },
    { x: Math.round(w * (1 - p)), y: Math.round(h * p) },
    { x: Math.round(w * (1 - p)), y: Math.round(h * (1 - p)) },
    { x: Math.round(w * p), y: Math.round(h * (1 - p)) }
  ];
}

// ── 2. Perspective Warp (Homography) ──────────────────────────────────────────
function warpPerspective(imageData, corners) {
  if (!cvReady || typeof cv === 'undefined') {
    throw new Error('OpenCV is not initialized yet');
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
    cv.warpPerspective(src, dst, M, new cv.Size(width, height), cv.INTER_CUBIC, cv.BORDER_REPLICATE);

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

// ── 3. CamScanner Filter Suite ───────────────────────────────────────────────

// 1. Magic Color (Morphological Background Division + CLAHE + Sharpening)
function applyMagicColor(imageData) {
  let src = null, rgb = null, lab = null, l = null, a = null, b = null;
  let bgKernel = null, bgDilated = null, bgSmooth = null;
  let normL = null, claheL = null, clahe = null;
  let mergedLab = null, finalRgb = null, sharpened = null;
  let channels = null, mergedChans = null, sharpKernel = null;

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

    // Morphological background dilation on L channel
    bgKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(25, 25));
    bgDilated = new cv.Mat();
    cv.dilate(l, bgDilated, bgKernel);

    // Median blur to smooth lighting gradients
    bgSmooth = new cv.Mat();
    cv.medianBlur(bgDilated, bgSmooth, 21);

    // Background division: normalized_L = 255 - absdiff(L, bg_smooth)
    const diff = new cv.Mat();
    cv.absdiff(l, bgSmooth, diff);
    normL = new cv.Mat(l.rows, l.cols, cv.CV_8UC1, new cv.Scalar(255));
    cv.subtract(normL, diff, normL);
    diff.delete();

    // CLAHE for crisp text contrast
    claheL = new cv.Mat();
    clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    clahe.apply(normL, claheL);

    // Merge back
    mergedChans = new cv.MatVector();
    mergedChans.push_back(claheL);
    mergedChans.push_back(a);
    mergedChans.push_back(b);

    mergedLab = new cv.Mat();
    cv.merge(mergedChans, mergedLab);

    finalRgb = new cv.Mat();
    cv.cvtColor(mergedLab, finalRgb, cv.COLOR_Lab2RGB);

    // Unsharp mask text sharpening kernel
    sharpKernel = cv.matFromArray(3, 3, cv.CV_32F, [
      0, -0.5, 0,
      -0.5, 3.0, -0.5,
      0, -0.5, 0
    ]);
    sharpened = new cv.Mat();
    cv.filter2D(finalRgb, sharpened, -1, sharpKernel);

    const outRgba = new cv.Mat();
    cv.cvtColor(sharpened, outRgba, cv.COLOR_RGB2RGBA);

    const result = new ImageData(new Uint8ClampedArray(outRgba.data), outRgba.cols, outRgba.rows);
    outRgba.delete();
    return result;
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
    if (normL) normL.delete();
    if (claheL) claheL.delete();
    if (clahe) clahe.delete();
    if (mergedLab) mergedLab.delete();
    if (finalRgb) finalRgb.delete();
    if (sharpened) sharpened.delete();
    if (channels) channels.delete();
    if (mergedChans) mergedChans.delete();
    if (sharpKernel) sharpKernel.delete();
  }
}

// 2. B&W / Clean Document (Shadow Division + Adaptive/Otsu Thresholding + Noise Cleanup)
function applyBW(imageData) {
  let src = null, gray = null, bgDilated = null, bgSmooth = null, norm = null;
  let bgKernel = null, thresh = null, clean = null, openKernel = null, outRgba = null;

  try {
    src = cv.matFromImageData(imageData);
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    bgKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(25, 25));
    bgDilated = new cv.Mat();
    cv.dilate(gray, bgDilated, bgKernel);

    bgSmooth = new cv.Mat();
    cv.medianBlur(bgDilated, bgSmooth, 21);

    const diff = new cv.Mat();
    cv.absdiff(gray, bgSmooth, diff);
    norm = new cv.Mat(gray.rows, gray.cols, cv.CV_8UC1, new cv.Scalar(255));
    cv.subtract(norm, diff, norm);
    diff.delete();

    thresh = new cv.Mat();
    cv.adaptiveThreshold(norm, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, 10);

    // Morphological opening (1x1 or 2x2) to remove isolated specs
    openKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    clean = new cv.Mat();
    cv.morphologyEx(thresh, clean, cv.MORPH_OPEN, openKernel);

    outRgba = new cv.Mat();
    cv.cvtColor(clean, outRgba, cv.COLOR_GRAY2RGBA);

    const result = new ImageData(new Uint8ClampedArray(outRgba.data), outRgba.cols, outRgba.rows);
    return result;
  } finally {
    if (src) src.delete();
    if (gray) gray.delete();
    if (bgDilated) bgDilated.delete();
    if (bgSmooth) bgSmooth.delete();
    if (norm) norm.delete();
    if (bgKernel) bgKernel.delete();
    if (thresh) thresh.delete();
    if (clean) clean.delete();
    if (openKernel) openKernel.delete();
    if (outRgba) outRgba.delete();
  }
}

// 3. No Shadow / Lighten (Morphological illumination normalization across RGB)
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
      cv.dilate(ch, bgDil, bgKernel);
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

    const result = new ImageData(new Uint8ClampedArray(outRgba.data), outRgba.cols, outRgba.rows);
    return result;
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
  let channels = null, mergedChans = null, mergedLab = null, outRgba = null;

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

    // Simple gamma / brightness boost
    const brightL = new cv.Mat();
    l.convertTo(brightL, -1, 1.15, 20);

    mergedChans = new cv.MatVector();
    mergedChans.push_back(brightL);
    mergedChans.push_back(a);
    mergedChans.push_back(b);

    mergedLab = new cv.Mat();
    cv.merge(mergedChans, mergedLab);

    const rgbOut = new cv.Mat();
    cv.cvtColor(mergedLab, rgbOut, cv.COLOR_Lab2RGB);

    outRgba = new cv.Mat();
    cv.cvtColor(rgbOut, outRgba, cv.COLOR_RGB2RGBA);

    const result = new ImageData(new Uint8ClampedArray(outRgba.data), outRgba.cols, outRgba.rows);

    brightL.delete();
    rgbOut.delete();
    return result;
  } finally {
    if (src) src.delete();
    if (rgb) rgb.delete();
    if (lab) lab.delete();
    if (l) l.delete();
    if (a) a.delete();
    if (b) b.delete();
    if (channels) channels.delete();
    if (mergedChans) mergedChans.delete();
    if (mergedLab) mergedLab.delete();
    if (outRgba) outRgba.delete();
  }
}

// ── Worker Message Dispatcher ────────────────────────────────────────────────
self.onmessage = async function(e) {
  const { id, type, payload } = e.data;
  const startTime = performance.now();

  try {
    switch (type) {
      case 'DETECT_CORNERS': {
        const corners = detectDocumentCorners(payload.imageData);
        self.postMessage({ id, type: 'SUCCESS', result: corners, durationMs: performance.now() - startTime });
        break;
      }

      case 'WARP': {
        const warpedData = warpPerspective(payload.imageData, payload.corners);
        self.postMessage(
          { id, type: 'SUCCESS', result: warpedData, durationMs: performance.now() - startTime },
          [warpedData.data.buffer]
        );
        break;
      }

      case 'FILTER': {
        const { imageData, filter } = payload;
        let processedData;
        switch (filter) {
          case 'magic_color':
            processedData = applyMagicColor(imageData);
            break;
          case 'bw':
            processedData = applyBW(imageData);
            break;
          case 'no_shadow':
            processedData = applyNoShadow(imageData);
            break;
          case 'lighten':
            processedData = applyLighten(imageData);
            break;
          case 'original':
          default:
            processedData = imageData;
            break;
        }

        self.postMessage(
          { id, type: 'SUCCESS', result: processedData, durationMs: performance.now() - startTime },
          [processedData.data.buffer]
        );
        break;
      }

      default:
        self.postMessage({ id, type: 'ERROR', error: `Unknown action: ${type}` });
    }
  } catch (err) {
    self.postMessage({ id, type: 'ERROR', error: err.message });
  }
};
