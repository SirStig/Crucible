import { describe, expect, it } from "vitest";
import { LoopController } from "../src/loop-controller.js";
import type { GradeResult } from "../src/types.js";

function grade(status: GradeResult["status"]): GradeResult {
  return { status, findings: [], summary: {}, gradedAt: new Date().toISOString() };
}

describe("LoopController", () => {
  it("rejects a non-positive-integer default iteration budget", () => {
    expect(() => new LoopController({ defaultMaxIterations: 0 })).toThrow(RangeError);
    expect(() => new LoopController({ defaultMaxIterations: -1 })).toThrow(RangeError);
    expect(() => new LoopController({ defaultMaxIterations: 1.5 })).toThrow(RangeError);
  });

  it("rejects an empty sessionId", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 3 });
    expect(() => controller.record("", "x", grade("pass"))).toThrow(RangeError);
    expect(() => controller.record("   ", "x", grade("pass"))).toThrow(RangeError);
  });

  it("returns undefined for a session that was never recorded", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 3 });
    expect(controller.getSession("nope")).toBeUndefined();
  });

  it("numbers iterations starting at 1 and reports pass on a passing grade", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 3 });
    const { record, session } = controller.record("s1", "draft one", grade("pass"));
    expect(record.iteration).toBe(1);
    expect(session.status).toBe("pass");
    expect(session.iterations).toHaveLength(1);
  });

  it("treats a warn grade as passing the loop gate, while still recording it", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 3 });
    const { session } = controller.record("s1", "draft", grade("warn"));
    expect(session.status).toBe("pass");
    expect(session.iterations[0]?.result.status).toBe("warn");
  });

  it("reports fail only on a failing grade", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 3 });
    const { session } = controller.record("s1", "draft", grade("fail"));
    expect(session.status).toBe("fail");
  });

  it("fixes maxIterations on the first call and ignores later overrides", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 5 });
    controller.record("s1", "v1", grade("fail"), { maxIterations: 2 });
    controller.record("s1", "v2", grade("fail"), { maxIterations: 10 });
    const session = controller.getSession("s1");
    expect(session?.maxIterations).toBe(2);
  });

  it("switches to exceeded once the iteration count passes the budget", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 2 });
    controller.record("s1", "v1", grade("fail"));
    const second = controller.record("s1", "v2", grade("fail"));
    expect(second.session.status).toBe("fail");
    const third = controller.record("s1", "v3", grade("fail"));
    expect(third.session.status).toBe("exceeded");
    expect(third.record.iteration).toBe(3);
  });

  it("keeps separate sessions independent", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 2 });
    controller.record("a", "a1", grade("fail"));
    const b = controller.record("b", "b1", grade("pass"));
    expect(b.record.iteration).toBe(1);
    expect(controller.getSession("a")?.iterations).toHaveLength(1);
  });

  it("stores the diff passed in, and omits it when not provided", () => {
    const controller = new LoopController<string>({ defaultMaxIterations: 3 });
    const diff = [{ type: "changed" as const, lineIndex: 0, before: "a", after: "b" }];
    const withDiff = controller.record("s1", "v2", grade("pass"), { diff });
    expect(withDiff.record.diff).toEqual(diff);

    const withoutDiff = controller.record("s2", "v1", grade("pass"));
    expect(withoutDiff.record.diff).toBeUndefined();
  });
});
