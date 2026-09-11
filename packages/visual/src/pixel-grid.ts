import type { RGBA } from "./color.js";
import { rgbaEqual, rgbaKey } from "./color.js";

export interface Point {
  x: number;
  y: number;
}

export interface Region {
  color: RGBA;
  pixels: Point[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * A color-agnostic connected blob of opaque pixels (or, for
 * `enclosedTransparentRegions`, of enclosed transparent pixels) — unlike
 * `Region`, this deliberately has no `color` field, since it can span many
 * colors. Used for structural "does this look like one attached object"
 * checks rather than shading-pattern checks.
 */
export interface Component {
  pixels: Point[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

/**
 * Indexed pixel access plus the two shared analysis primitives every
 * detector builds on: connected-region flood-fill and outer-contour
 * tracing. Out-of-bounds reads return fully transparent rather than
 * throwing, so edge/contour logic can treat the canvas boundary the same
 * way it treats an actual transparent neighbor.
 */
export class PixelGrid {
  readonly width: number;
  readonly height: number;
  private readonly data: Buffer;

  constructor(width: number, height: number, data: Buffer) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  colorAt(x: number, y: number): RGBA {
    if (!this.inBounds(x, y)) return TRANSPARENT;
    const i = (y * this.width + x) * 4;
    return {
      r: this.data[i]!,
      g: this.data[i + 1]!,
      b: this.data[i + 2]!,
      a: this.data[i + 3]!,
    };
  }

  alphaAt(x: number, y: number): number {
    return this.colorAt(x, y).a;
  }

  /** Any non-zero alpha counts as "drawn" — crisp rendering keeps this a clean binary in practice. */
  isOpaque(x: number, y: number): boolean {
    return this.alphaAt(x, y) > 0;
  }

  opaquePixelCount(): number {
    let count = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.isOpaque(x, y)) count++;
      }
    }
    return count;
  }

  /** Every distinct opaque color used, in first-seen (row-major) order. */
  uniqueColors(): RGBA[] {
    const seen = new Map<string, RGBA>();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.isOpaque(x, y)) continue;
        const color = this.colorAt(x, y);
        const key = rgbaKey(color);
        if (!seen.has(key)) seen.set(key, color);
      }
    }
    return [...seen.values()];
  }

  /**
   * 4-connected flood fill over opaque pixels, grouped by exact color
   * match — the shared segmentation step for the banding and dithering
   * detectors (which need contiguous same-color/same-pattern blobs, not
   * just per-pixel reads).
   */
  floodFillRegions(): Region[] {
    const visited = new Uint8Array(this.width * this.height);
    const regions: Region[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const startIdx = y * this.width + x;
        if (visited[startIdx]) continue;
        if (!this.isOpaque(x, y)) {
          visited[startIdx] = 1;
          continue;
        }

        const startColor = this.colorAt(x, y);
        const stack: Point[] = [{ x, y }];
        visited[startIdx] = 1;
        const pixels: Point[] = [];
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;

        while (stack.length > 0) {
          const current = stack.pop()!;
          pixels.push(current);
          minX = Math.min(minX, current.x);
          maxX = Math.max(maxX, current.x);
          minY = Math.min(minY, current.y);
          maxY = Math.max(maxY, current.y);

          const neighbors: Point[] = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 },
          ];
          for (const neighbor of neighbors) {
            if (!this.inBounds(neighbor.x, neighbor.y)) continue;
            const neighborIdx = neighbor.y * this.width + neighbor.x;
            if (visited[neighborIdx]) continue;
            if (!this.isOpaque(neighbor.x, neighbor.y)) continue;
            if (!rgbaEqual(this.colorAt(neighbor.x, neighbor.y), startColor)) continue;
            visited[neighborIdx] = 1;
            stack.push(neighbor);
          }
        }

        regions.push({ color: startColor, pixels, minX, maxX, minY, maxY });
      }
    }

    return regions;
  }

  /**
   * Color-agnostic connected blobs of opaque pixels, 8-connectivity (a
   * corner touch counts as attached — the more permissive choice, since the
   * point is catching pieces that clearly aren't touching at all, not
   * penalizing legitimate thin diagonal joins). Used by the
   * disconnected-fragment ("attachment") detector; unlike `floodFillRegions`,
   * a single component can span many colors — this is about physical
   * touching, not shading segmentation.
   */
  connectedComponents(): Component[] {
    const visited = new Uint8Array(this.width * this.height);
    const components: Component[] = [];
    const offsets8 = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as const;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const startIdx = y * this.width + x;
        if (visited[startIdx]) continue;
        if (!this.isOpaque(x, y)) {
          visited[startIdx] = 1;
          continue;
        }

        const stack: Point[] = [{ x, y }];
        visited[startIdx] = 1;
        const pixels: Point[] = [];
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;

        while (stack.length > 0) {
          const current = stack.pop()!;
          pixels.push(current);
          minX = Math.min(minX, current.x);
          maxX = Math.max(maxX, current.x);
          minY = Math.min(minY, current.y);
          maxY = Math.max(maxY, current.y);

          for (const [dx, dy] of offsets8) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            if (!this.inBounds(nx, ny)) continue;
            const neighborIdx = ny * this.width + nx;
            if (visited[neighborIdx]) continue;
            if (!this.isOpaque(nx, ny)) continue;
            visited[neighborIdx] = 1;
            stack.push({ x: nx, y: ny });
          }
        }

        components.push({ pixels, minX, maxX, minY, maxY });
      }
    }

    return components;
  }

  /**
   * Transparent pixels fully enclosed by opaque ones — reachable neither
   * from the canvas border nor from off-canvas, via 4-connected transparent
   * flood fill. A single stray fully-surrounded pixel is a common
   * "accidental gap" signature; a large enclosed region is more likely an
   * intentional design feature (a window, a hole in a ring shape) — the
   * caller decides the size cutoff, this just finds every enclosed blob.
   */
  enclosedTransparentRegions(): Component[] {
    const outside = new Uint8Array(this.width * this.height);
    const outsideStack: Point[] = [];
    for (let x = 0; x < this.width; x++) {
      if (!this.isOpaque(x, 0)) outsideStack.push({ x, y: 0 });
      if (!this.isOpaque(x, this.height - 1)) outsideStack.push({ x, y: this.height - 1 });
    }
    for (let y = 0; y < this.height; y++) {
      if (!this.isOpaque(0, y)) outsideStack.push({ x: 0, y });
      if (!this.isOpaque(this.width - 1, y)) outsideStack.push({ x: this.width - 1, y });
    }
    for (const p of outsideStack) outside[p.y * this.width + p.x] = 1;

    while (outsideStack.length > 0) {
      const current = outsideStack.pop()!;
      const neighbors: Point[] = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];
      for (const n of neighbors) {
        if (!this.inBounds(n.x, n.y)) continue;
        const idx = n.y * this.width + n.x;
        if (outside[idx]) continue;
        if (this.isOpaque(n.x, n.y)) continue;
        outside[idx] = 1;
        outsideStack.push(n);
      }
    }

    const visited = new Uint8Array(this.width * this.height);
    const components: Component[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        if (visited[idx]) continue;
        if (this.isOpaque(x, y) || outside[idx]) {
          visited[idx] = 1;
          continue;
        }

        const stack: Point[] = [{ x, y }];
        visited[idx] = 1;
        const pixels: Point[] = [];
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;

        while (stack.length > 0) {
          const current = stack.pop()!;
          pixels.push(current);
          minX = Math.min(minX, current.x);
          maxX = Math.max(maxX, current.x);
          minY = Math.min(minY, current.y);
          maxY = Math.max(maxY, current.y);

          const neighbors: Point[] = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 },
          ];
          for (const n of neighbors) {
            if (!this.inBounds(n.x, n.y)) continue;
            const neighborIdx = n.y * this.width + n.x;
            if (visited[neighborIdx]) continue;
            if (this.isOpaque(n.x, n.y) || outside[neighborIdx]) continue;
            visited[neighborIdx] = 1;
            stack.push(n);
          }
        }

        components.push({ pixels, minX, maxX, minY, maxY });
      }
    }

    return components;
  }

  /** Opaque pixels 4-adjacent to a transparent (or off-canvas) neighbor — the sprite's outer contour. */
  contourPixels(): Point[] {
    const result: Point[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.isOpaque(x, y)) continue;
        const hasTransparentNeighbor =
          !this.isOpaque(x + 1, y) ||
          !this.isOpaque(x - 1, y) ||
          !this.isOpaque(x, y + 1) ||
          !this.isOpaque(x, y - 1);
        if (hasTransparentNeighbor) result.push({ x, y });
      }
    }
    return result;
  }
}
