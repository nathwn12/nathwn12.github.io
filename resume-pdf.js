'use strict';

(function initResumePdfDownload() {
  const button = document.getElementById('downloadResumeBtn');

  if (!button) {
    return;
  }

  function setGeneratingState(isGenerating) {
    if (isGenerating) {
      if (!button.dataset.originalLabel) {
        button.dataset.originalLabel = button.innerHTML;
      }
      button.classList.add('is-generating');
      button.innerHTML = 'Generating PDF...';
      return;
    }

    button.classList.remove('is-generating');
    if (button.dataset.originalLabel) {
      button.innerHTML = button.dataset.originalLabel;
    }
  }

  function triggerFallbackDownload() {
    const fallbackHref = button.getAttribute('data-fallback-href') || button.getAttribute('href');
    const fallbackName = button.getAttribute('download') || '';

    if (!fallbackHref) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = fallbackHref;
    if (fallbackName) {
      anchor.download = fallbackName;
    }
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  async function fetchPackagedPdfBlob() {
    const fallbackHref = button.getAttribute('data-fallback-href') || button.getAttribute('href');

    if (!fallbackHref) {
      throw new Error('Packaged PDF path is missing.');
    }

    const response = await fetch(fallbackHref, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Packaged PDF fetch failed with status ${response.status}.`);
    }

    return response.blob();
  }

  function getManifest() {
    return window.resumePdfManifest || null;
  }

  async function waitForFonts() {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  }

  function drawRect(ctx, rect, fill) {
    const [x0, y0, x1, y1] = rect;
    ctx.fillStyle = fill;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }

  function drawEllipse(ctx, rect, fill) {
    const [x0, y0, x1, y1] = rect;
    const width = x1 - x0;
    const height = y1 - y0;
    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.ellipse(x0 + (width / 2), y0 + (height / 2), width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTextSpan(ctx, span) {
    const [x0, y0] = span.bbox;
    const fontStyle = span.style === 'italic' ? 'italic ' : '';
    const fontWeight = span.weight ? `${span.weight} ` : '';
    const fontFamily = span.family || 'Segoe UI';

    ctx.fillStyle = span.color;
    ctx.font = `${fontStyle}${fontWeight}${span.size}px "${fontFamily}", "Segoe UI", Tahoma, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(span.text, x0, y0);
  }

  function renderResumeCanvas(manifest) {
    const pageWidth = manifest.page.width;
    const pageHeight = manifest.page.height;
    const scale = 3;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(pageWidth * scale);
    canvas.height = Math.round(pageHeight * scale);

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.textRendering = 'optimizeLegibility';
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = manifest.page.background || '#ffffff';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    manifest.shapes.forEach((shape) => {
      if (shape.kind === 'ellipse') {
        drawEllipse(ctx, shape.rect, shape.fill);
        return;
      }
      drawRect(ctx, shape.rect, shape.fill);
    });

    manifest.textSpans.forEach((span) => {
      drawTextSpan(ctx, span);
    });

    return canvas;
  }

  async function buildPdfBlob() {
    return fetchPackagedPdfBlob();
  }

  async function savePdf() {
    const manifest = getManifest();
    const blob = await buildPdfBlob();
    const url = URL.createObjectURL(blob);
    const fileName = (manifest && manifest.page && manifest.page.filename)
      || button.getAttribute('download')
      || 'Nathaniel-Nikolai-Ladero-Resume.pdf';

    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function handleClick(event) {
    if (button.dataset.busy === 'true') {
      return;
    }

    event.preventDefault();
    button.dataset.busy = 'true';
    setGeneratingState(true);

    try {
      await savePdf();
    } catch (error) {
      console.error('Resume PDF download failed. Falling back to the packaged PDF.', error);
      triggerFallbackDownload();
    } finally {
      delete button.dataset.busy;
      setGeneratingState(false);
    }
  }

  button.addEventListener('click', handleClick);

  window.generateResumePdfBlob = buildPdfBlob;

  async function maybeRunDebugExport() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('pdf-debug')) {
      return;
    }

    const marker = document.createElement('pre');
    marker.id = 'pdf-debug-status';
    marker.style.position = 'fixed';
    marker.style.inset = '12px auto auto 12px';
    marker.style.zIndex = '99999';
    marker.style.background = '#ffffff';
    marker.style.color = '#111827';
    marker.style.padding = '8px 10px';
    marker.style.border = '1px solid #cbd5e1';
    marker.textContent = 'pdf-debug:pending';
    document.body.append(marker);

    try {
      const blob = await buildPdfBlob();
      marker.textContent = `pdf-debug:ok:${blob.size}`;
    } catch (error) {
      marker.textContent = `pdf-debug:error:${error && error.message ? error.message : String(error)}`;
    }
  }

  maybeRunDebugExport();
})();
