// Guess normalization + fuzzy matching (SRD 2.4): lowercase, trim, strip
// punctuation, then allow minor typos via Levenshtein distance <= 2.

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

/** Classic iterative Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

const TYPO_TOLERANCE = 2;

export function isGuessCorrect(guess: string, acceptedAnswers: string[]): boolean {
  const normalizedGuess = normalize(guess);
  if (!normalizedGuess) return false;

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalize(answer);
    if (normalizedGuess === normalizedAnswer) return true;
    // Skip fuzzy matching on very short answers where distance <= 2 would
    // accept almost anything.
    if (normalizedAnswer.length <= 3) return false;
    return levenshtein(normalizedGuess, normalizedAnswer) <= TYPO_TOLERANCE;
  });
}
