/**
 * Cost table for point-buy system following D&D 5E rules
 */
export const POINT_BUY_COSTS: { [key: number]: number } = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

/**
 * Calculates ability score modifier per D&D 5E rules
 */
export const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

/**
 * Calculates point cost difference between scores
 */
export const getPointCostDifference = (currentScore: number, targetScore: number): number => {
  return POINT_BUY_COSTS[targetScore] - POINT_BUY_COSTS[currentScore];
};