(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PoseCoordinates = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const clamp01 = (value) => Math.max(0, Math.min(1, value));

  function normalize(point, sourceWidth, sourceHeight) {
    if (!point || sourceWidth <= 0 || sourceHeight <= 0) return null;
    return { x: clamp01(point.x / sourceWidth), y: clamp01(point.y / sourceHeight) };
  }

  function stagePoint(point, stageWidth, stageHeight) {
    return { x: point.x * stageWidth, y: point.y * stageHeight };
  }

  function previewRect(stageWidth, stageHeight, sourceWidth = 16, sourceHeight = 9) {
    const margin = Math.max(20, Math.min(stageWidth, stageHeight) * 0.035);
    const width = Math.min(Math.max(stageWidth * 0.26, 150), 320);
    const height = width * sourceHeight / sourceWidth;
    return { x: stageWidth - width - margin, y: margin, width, height };
  }

  return { normalize, stagePoint, previewRect };
});
