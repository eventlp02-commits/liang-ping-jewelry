type Colour = readonly [number, number, number];

export type Pigments = readonly [Colour, Colour, Colour];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const light = (pixels: Uint8ClampedArray, i: number) =>
  (pixels[i] * 0.27 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.14) / 255;

// Work in short strips and yield between batches so input stays responsive.
// Nothing is recomputed when scrolling or reversing the camera.
export function* pullMaterialPlate(
  photo: HTMLImageElement,
  plate: HTMLCanvasElement,
  inks: Pigments,
  focus: readonly [number, number],
  seed: number,
  longEdge: number,
): Generator<void, boolean> {
  const ratio = Math.min(1, longEdge / Math.max(photo.naturalWidth, photo.naturalHeight));
  const w = Math.max(1, Math.round(photo.naturalWidth * ratio));
  const h = Math.max(1, Math.round(photo.naturalHeight * ratio));
  plate.width = w;
  plate.height = h;
  const work = document.createElement("canvas");
  const thumb = document.createElement("canvas");
  work.width = w;
  work.height = h;
  thumb.width = Math.max(2, Math.round(w / 7));
  thumb.height = Math.max(2, Math.round(h / 7));
  const dest = plate.getContext("2d");
  const sampler = work.getContext("2d", { willReadFrequently: true });
  const small = thumb.getContext("2d");
  if (!dest || !sampler || !small) return false;

  let state = seed * 197 + 51;
  const random = () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
  try {
    sampler.drawImage(photo, 0, 0, w, h);
    const source = sampler.getImageData(0, 0, w, h).data;
    yield;
    small.drawImage(work, 0, 0, thumb.width, thumb.height);
    sampler.drawImage(thumb, 0, 0, w, h);
    const wash = sampler.getImageData(0, 0, w, h).data;
    const output = dest.createImageData(w, h);
    const pixels = output.data;
    const tooth = Float32Array.from({ length: 128 * 128 }, () => random() - 0.5);
    const [carbon, mineral, stock] = inks;
    const pitch = w / 180;
    const dx2 = Float32Array.from({ length: w }, (_, x) => ((x / w - focus[0]) / 0.68) ** 2);
    const dy2 = Float32Array.from({ length: h }, (_, y) => ((y / h - focus[1]) / 0.51) ** 2);

    // Quantised pigment separates the masses. Cut two sets of hatch marks
    // only into their shadow values; keep paper white at real specular edges.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const coarse = light(wash, i);
        const fine = light(source, i);
        const dx = coarse - light(wash, x > 2 ? i - 12 : i);
        const dy = coarse - light(wash, y > 2 ? i - w * 12 : i);
        const grain = tooth[((y & 127) << 7) + (x & 127)];
        const fibre = tooth[(((y >> 1) & 127) << 7) + ((x >> 3) & 127)];
        const dry = coarse + fibre * 0.027 + (fine - coarse) * 0.34;
        const value = clamp((Math.round(dry * 9) / 9 * 0.76 + dry * 0.24 - 0.04) * 1.12);
        const band = value < 0.44 ? carbon : mineral;
        const next = value < 0.44 ? mineral : stock;
        const t = value < 0.44 ? value / 0.44 : (value - 0.44) / 0.56;

        const bend = coarse * 4.5 + fibre * 0.32;
        const hatch = Math.abs(((x * 0.88 + y * 0.49 + bend) / pitch) % 1 - 0.5);
        const cross = Math.abs(((y * 0.92 + (w - x) * 0.41 + bend) / (pitch * 1.38)) % 1 - 0.5);
        const cut = clamp((0.48 - coarse) * 2.3) * Math.max(0, 1 - hatch * 7)
          + clamp((0.25 - coarse) * 3) * Math.max(0, 1 - cross * 8);
        const outline = clamp((coarse - fine) * 4 + (Math.abs(dx) + Math.abs(dy)) * 0.75);
        const ink = Math.min(0.83, outline * 0.77 + cut * 0.34);
        const glint = clamp((fine - coarse - 0.035) * 3.2);
        const granulation = grain * 13 + fibre * 7;
        // Unpainted paper opens up away from the measured object. Break its
        // edge along image values; graphite still records lines across the wash.
        const perimeter = dx2[x] + dy2[y] + (coarse - 0.5) * 0.16 + fibre * 0.045;
        const reserve = clamp((perimeter - 0.10) * 1.26);
        const lifted = reserve * reserve * (3 - 2 * reserve) * 0.91;
        for (let c = 0; c < 3; c++) {
          const tint = (source[i + c] - fine * 255) * 0.10;
          let paint = band[c] + (next[c] - band[c]) * t + tint;
          paint += (stock[c] - paint) * lifted;
          paint += (carbon[c] - paint) * ink * (1 - lifted * 0.58);
          pixels[i + c] = paint + (stock[c] - paint) * glint + granulation;
        }
        pixels[i + 3] = 255;
      }
      if ((y & 7) === 7) yield;
    }
    dest.putImageData(output, 0, 0);
    yield;

    // Broken, tapered filaments follow the local contour, not a decorative
    // screen-space pattern. Real edges determine both their bearing and ink.
    for (let n = 0, count = Math.floor(w * h / 55); n < count; n++) {
      const x = 2 + Math.floor(random() * (w - 4));
      const y = 2 + Math.floor(random() * (h - 4));
      const i = (y * w + x) * 4;
      const dx = light(wash, i + 8) - light(wash, i - 8);
      const dy = light(wash, i + w * 8) - light(wash, i - w * 8);
      const edge = Math.abs(dx) + Math.abs(dy);
      const angle = edge > 0.014 ? Math.atan2(dy, dx) + Math.PI / 2 : -0.3 + random() * 0.45;
      const length = (2 + random() * 8) * w / 760;
      const ax = Math.cos(angle) * length;
      const ay = Math.sin(angle) * length;
      const deposit = random() < (edge > 0.08 ? 0.40 : 0.65) ? stock : carbon;
      dest.strokeStyle = `rgba(${deposit.join(",")},${0.04 + Math.min(0.25, edge * 0.8) + random() * 0.07})`;
      dest.lineWidth = (0.45 + random() * 0.9) * w / 760;
      dest.beginPath();
      dest.moveTo(x - ax * 0.5, y - ay * 0.5);
      dest.quadraticCurveTo(x + ay * 0.10, y - ax * 0.10, x + ax * 0.5, y + ay * 0.5);
      dest.stroke();
      if ((n & 255) === 255) yield;
    }
    return true;
  } finally {
    work.width = work.height = thumb.width = thumb.height = 0;
  }
}
