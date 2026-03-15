/**
 * Check if a regex pattern is safe from catastrophic backtracking (ReDoS).
 * Rejects patterns with nested quantifiers like (a+)+, (a*)*b, etc.
 * Returns true if the pattern is safe, false if it's dangerous or invalid.
 */
export function isSafeRegex(pattern: string): boolean {
  // First check if it's valid at all
  try {
    new RegExp(pattern);
  } catch {
    return false;
  }

  // Reject patterns with nested quantifiers that cause catastrophic backtracking.
  // This is a heuristic: detect groups followed by quantifiers that contain quantifiers.
  // Patterns like (a+)+, (a+)*, (a*)+, ([^x]+)*, (\w+)+ etc.
  const nestedQuantifier = /(\([^)]*[+*][^)]*\))[+*{]/;
  if (nestedQuantifier.test(pattern)) {
    return false;
  }

  // Reject overlapping alternation with quantifiers: (a|a)+
  // and repeated groups of single-char alternations: (a|b)+ is fine, but check length
  // Mainly guard against (.*.*) patterns
  const repeatedWildcard = /\.\*.*\.\*/;
  if (repeatedWildcard.test(pattern)) {
    return false;
  }

  return true;
}

/**
 * Validate a regex pattern: checks both syntax and ReDoS safety.
 * Returns an error message string, or null if the pattern is valid and safe.
 */
export function validateRegexPattern(pattern: string): string | null {
  if (!pattern.trim()) {
    return null; // empty is not an error at validation level
  }

  try {
    new RegExp(pattern, "i");
  } catch {
    return "Invalid regex syntax";
  }

  if (!isSafeRegex(pattern)) {
    return "Pattern may cause performance issues (nested quantifiers detected). Simplify the pattern.";
  }

  return null;
}
