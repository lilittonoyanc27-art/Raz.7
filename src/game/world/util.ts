import * as THREE from 'three';

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Scale the UVs of a BoxGeometry so textures repeat per metre-ish. */
export function boxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number, unitU: number, unitV: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const faces = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    const [fu, fv] = faces[f];
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      uv.setXY(idx, uv.getX(idx) * Math.max(1, Math.round(fu / unitU)), uv.getY(idx) * Math.max(1, Math.round(fv / unitV)));
    }
  }
  uv.needsUpdate = true;
}

export function signTexture(text: string, bg: string, fg: string) {
  return canvasTex(512, 128, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let size = 64;
    g.font = `800 ${size}px Inter, Arial, sans-serif`;
    while (g.measureText(text).width > 470 && size > 20) {
      size -= 4;
      g.font = `800 ${size}px Inter, Arial, sans-serif`;
    }
    g.fillText(text, 256, 68);
  });
}

export const angleLerp = (a: number, b: number, t: number) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

export const damp = (a: number, b: number, lambda: number, dt: number) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
