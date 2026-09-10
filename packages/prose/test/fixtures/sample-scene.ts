/**
 * A small multi-speaker scene with deliberately seeded Tier 1 issues, reused
 * by the pattern-grader integration test and the export adapter tests so
 * they're all exercising the same realistic shape of input.
 */
export const MESSY_SCENE = `Marta: In today's fast-paced world, no one pays what steel is worth anymore.
Player: I don't have much, but take it.
Marta: "That's an insult, not an offer," she exclaimed.
Marta: This is not just a discount, it's an insult.
Marta: This isn't just about coin, it's about pride.
The door creaks shut behind them.`;

/** The same scene, hand-fixed, that should clear every Tier 1 check. */
export const CLEAN_SCENE = `Marta: Real coin, or don't waste my time.
Player: This is all I've got.
Marta: Then we're done here.
Marta: Go on. Get.
The door creaks shut behind them.`;
