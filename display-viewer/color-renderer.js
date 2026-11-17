"use strict";

window.PatternColorRenderer = (() => {
  function contextFor(canvas, colorSpace) {
    const context = canvas.getContext("2d", { colorSpace });
    const actual = context?.getContextAttributes?.().colorSpace;
    if (actual !== colorSpace) {
      throw new Error(`Canvas color space unavailable: requested ${colorSpace}, received ${actual ?? "unknown"}.`);
    }
    return context;
  }

  function render(image, colorSpace) {
    if (!["srgb", "display-p3"].includes(colorSpace)) throw new Error("Unknown color space.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 600;
    canvas.dataset.file = image.alt;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${image.alt}, ${colorSpace}`);
    const context = contextFor(canvas, colorSpace);
    context.imageSmoothingEnabled = false;
    // Honor the source ICC profile and convert to the selected canvas space.
    // Do not relabel P3 samples as sRGB or apply gamma manually.
    context.drawImage(image, 0, 0);
    return canvas;
  }

  function supportsP3Canvas() {
    try {
      contextFor(document.createElement("canvas"), "display-p3");
      return true;
    } catch { return false; }
  }

  return { render, supportsP3Canvas };
})();
