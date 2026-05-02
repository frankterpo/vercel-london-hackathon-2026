/**
 * Single frozen MVP optimisation axis for scoring + copy.
 * Change only after updating PLAN_ENG_DIET.md ("MVP goal metric").
 */
export const MVP_GOAL_METRIC = "calorie" as const;

export type MvpFrozenGoalMetric = typeof MVP_GOAL_METRIC;

/** Reserved for phase 2; not active in MVP. */
export type DeferredGoalMetric = "protein";
