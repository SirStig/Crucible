const SVG_ROOT_TAG = /<svg\b([^>]*)>/i;
const QUOTED_ATTR = (name: string): RegExp => new RegExp(`\\s${name}=(?:"[^"]*"|'[^']*')`, "gi");

/**
 * Forces the SVG's declared size to exactly `width`x`height` regardless of
 * whatever width, height or viewBox the root element already has (or omits),
 * CanvasLoop is authoritative on pixel-grid size, not the SVG source, so
 * `gridWidth`/`gridHeight` always wins rather than silently depending on
 * the caller getting matching attributes right.
 */
export function normalizeSvgRoot(svg: string, width: number, height: number): string {
  if (!SVG_ROOT_TAG.test(svg)) {
    throw new Error("CanvasLoop: input does not contain an <svg> root element.");
  }
  return svg.replace(SVG_ROOT_TAG, (_match, attrs: string) => {
    let cleaned = attrs
      .replace(QUOTED_ATTR("width"), "")
      .replace(QUOTED_ATTR("height"), "")
      .replace(QUOTED_ATTR("viewBox"), "");
    if (!/xmlns=/i.test(cleaned)) {
      cleaned += ` xmlns="http://www.w3.org/2000/svg"`;
    }
    return `<svg${cleaned} width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  });
}
