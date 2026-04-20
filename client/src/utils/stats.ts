export function computeAverageFromDistribution(
  distribution: Record<number, number> | undefined
): number {
  const entries = Object.entries(distribution || {});
  if (entries.length === 0) {
    return 0;
  }

  let totalWeighted = 0;
  let totalCount = 0;

  for (const [guess, count] of entries) {
    const guessNum = Number(guess);
    totalWeighted += guessNum * count;
    totalCount += count;
  }

  return totalCount > 0 ? totalWeighted / totalCount : 0;
}
