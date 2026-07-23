import '@testing-library/jest-dom/vitest';

// jsdom has no 2D canvas implementation; qrcode.react's QRCodeCanvas needs one.
// Provide a minimal stub so components render in tests without a native canvas.
const canvasCtxBase: Record<string | symbol, unknown> = {
  measureText: () => ({ width: 0 }),
  getImageData: () => ({ data: new Uint8ClampedArray(0) }),
};
const ctxStub = new Proxy(canvasCtxBase, {
  get: (target, prop) => (prop in target ? target[prop] : () => {}),
});
// @ts-expect-error - override for the jsdom test environment
HTMLCanvasElement.prototype.getContext = () => ctxStub;
HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,iVBORw0KGgo=';
