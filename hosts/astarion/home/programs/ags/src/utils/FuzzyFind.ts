/**
 * █▀▀ █░█ ▀█ ▀█ █▄█   █▀▀ █ █▄░█ █▀▄
 * █▀░ █▄█ █▄ █▄ ░█░   █▀░ █ █░▀█ █▄▀
 *
 * Fuzzy finding algorithm.
 */

/*****************************************************************************
 * Function definitions
 *****************************************************************************/

/**
 * Score a string match against a query. Lower is better.
 * Prioritizes: exact match > starts with > word boundary > contains > no match
 */
export const scoreMatch = (query: string, item: string): number => {
  const q = query.toLowerCase();
  const i = item.toLowerCase();

  // Exact match
  if (q === i) return 0;

  // Starts with query
  if (i.startsWith(q)) return 1;

  // Word boundary match (after space, dash, underscore, etc.)
  const wordBoundary = new RegExp(`[\\s\\-_]${q}`, "i");
  if (wordBoundary.test(item)) return 2;

  // Contains query
  if (i.includes(q)) return 3;

  // Character-by-character fuzzy match (all chars in order)
  let pos = 0;
  for (const char of q) {
    pos = i.indexOf(char, pos);
    if (pos === -1) return Infinity; // No match
    pos++;
  }

  return 10; // Fuzzy match found, but deprioritize
};

/**
 * FuzzyFind - returns items sorted by relevance
 *
 * @param query - search term
 * @param items - array of strings to search through
 * @returns sorted array with best matches first
 */
export const FuzzyFind = (query: string, items: string[]): string[] => {
  if (!query) return items;

  const results = items
    .map((item) => ({
      item,
      score: scoreMatch(query, item),
    }))
    .filter((result) => result.score !== Infinity)
    .sort((a, b) => a.score - b.score);

  return results.map((result) => result.item);
};
