// Shared vocabulary (Finding, GradeResult, LoopController) is flat, since both
// tracks speak it. The tracks themselves are namespaced: they each define a
// SourceCitation and a few same-named types, and a flat re-export would
// silently drop the ambiguous ones.
export * from "./base/index.js";
export * as prose from "./prose/index.js";
export * as visual from "./visual/index.js";
