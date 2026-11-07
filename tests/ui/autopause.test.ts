// @vitest-environment happy-dom
import { installAutoPause } from '../../src/ui/autopause';

function setHidden(v: boolean) { Object.defineProperty(document, 'hidden', { configurable: true, get: () => v }); document.dispatchEvent(new Event('visibilitychange')); }

test('hiding the tab pauses, showing it again does not', () => {
  let n = 0; installAutoPause(document, () => n++);
  setHidden(true); expect(n).toBe(1);
  setHidden(false); expect(n).toBe(1);
});
test('window blur also pauses', () => {
  let n = 0; installAutoPause(document, () => n++, window);
  window.dispatchEvent(new Event('blur')); expect(n).toBe(1);
});
