import { describe, expect, it } from "vitest";
import { toYarn } from "../../src/export/yarn.js";
import { makeLine } from "../helpers.js";

describe("toYarn", () => {
  it("wraps lines in a titled node with the default title", () => {
    const output = toYarn([makeLine("Get out.", 1, "Marta")]);
    const lines = output.split("\n");
    expect(lines[0]).toBe("title: CanvasLoopExport");
    expect(lines[1]).toBe("---");
    expect(lines[2]).toBe("Marta: Get out.");
    expect(lines[3]).toBe("===");
  });

  it("uses a custom, sanitized node title", () => {
    const output = toYarn([makeLine("Get out.", 1)], { node: "Blacksmith Reject!" });
    expect(output.split("\n")[0]).toBe("title: Blacksmith_Reject_");
  });

  it("falls back to the default title when the custom one is empty after trimming", () => {
    const output = toYarn([makeLine("Get out.", 1)], { node: "   " });
    expect(output.split("\n")[0]).toBe("title: CanvasLoopExport");
  });

  it("escapes braces and hashtags anywhere in the line", () => {
    const output = toYarn([makeLine("The cost is {price} gold, #final.", 1)]);
    expect(output).toContain("The cost is \\{price\\} gold, \\#final.");
  });

  it("escapes a leading divert or shortcut marker", () => {
    const arrow = toYarn([makeLine("-> not actually a divert", 1)]);
    expect(arrow).toContain("\\-> not actually a divert");

    const shortcut = toYarn([makeLine("<< not a command", 1)]);
    expect(shortcut).toContain("\\<< not a command");
  });
});
