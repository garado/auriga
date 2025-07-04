/**
 * Use Levenshtein distance to sort
 * A lower score is better
 */
export const Levenshtein = (a: string, b: string): number => {
  const tmp: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }

  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }

  return tmp[a.length][b.length];
};

/**
 * FuzzyFind using the Levenshtein distance
 */
export const FuzzyFind = (query: string, items: string[]): string[] => {
  const results = items.map((item) => ({
    item,
    score: Levenshtein(query, item),
  }));

  /* Sort results by the score (lower score means better match) */
  results.sort((a, b) => a.score - b.score);

  return results.map((result) => result.item);
};
