const assert = require('node:assert/strict');
const { normalize, stagePoint, previewRect } = require('../src/js/pose-coordinates.js');

assert.deepEqual(normalize({ x: 320, y: 180 }, 640, 360), { x: 0.5, y: 0.5 });
assert.deepEqual(stagePoint(normalize({ x: 320, y: 180 }, 640, 360), 1920, 1080), { x: 960, y: 540 });
assert.deepEqual(stagePoint(normalize({ x: 320, y: 180 }, 640, 360), 390, 844), { x: 195, y: 422 });
assert.deepEqual(normalize({ x: 1000, y: -20 }, 640, 360), { x: 1, y: 0 });
for (const [width, height] of [[390, 844], [1280, 720], [1920, 1080]]) {
  const rect = previewRect(width, height);
  assert.ok(rect.x >= 0 && rect.y >= 0);
  assert.ok(rect.x + rect.width <= width);
  assert.ok(rect.y + rect.height <= height);
}
console.log('Pose coordinates scale to desktop and mobile stages.');
