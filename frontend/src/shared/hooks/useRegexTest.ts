import { useMemo, useEffect, useState } from "react";
import { validateRegexPattern, isSafeRegex } from "@/shared/utils/regex";

export function useRegexTest(pattern: string, testText: string) {
  const [patternError, setPatternError] = useState("");

  const isValidRegex = useMemo(() => {
    if (!pattern.trim()) return true;
    return validateRegexPattern(pattern) === null;
  }, [pattern]);

  useEffect(() => {
    if (pattern.trim()) {
      const error = validateRegexPattern(pattern);
      setPatternError(error ?? "");
    } else {
      setPatternError("");
    }
  }, [pattern]);

  const testResult = useMemo(() => {
    if (!pattern.trim() || !testText.trim() || !isValidRegex) return null;
    try {
      if (!isSafeRegex(pattern)) return null;
      const regex = new RegExp(pattern, "i");
      return regex.test(testText);
    } catch {
      return null;
    }
  }, [pattern, testText, isValidRegex]);

  return { isValidRegex, testResult, patternError };
}
