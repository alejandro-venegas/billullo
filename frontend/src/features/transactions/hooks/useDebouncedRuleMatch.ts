import { useState, useCallback, useRef, useEffect } from "react";
import type { RuleStore } from "@/features/categories/stores/RuleStore";
import type { CategoryStore } from "@/features/categories/stores/CategoryStore";

interface RuleMatchState {
  matchInfo: string;
  ruleConflict: boolean;
  conflictDetails: string;
}

const INITIAL_STATE: RuleMatchState = {
  matchInfo: "",
  ruleConflict: false,
  conflictDetails: "",
};

export function useDebouncedRuleMatch(
  ruleStore: RuleStore,
  categoryStore: CategoryStore,
) {
  const [matchState, setMatchState] = useState<RuleMatchState>(INITIAL_STATE);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const checkMatch = useCallback(
    (description: string, setCategory: (id: string) => void) => {
      clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        const result = await ruleStore.matchCategory(description);

        if (result.categoryId && result.matches.length > 0) {
          setCategory(String(result.categoryId));

          if (result.conflicts) {
            const details = result.matches
              .map(
                (m) =>
                  `"${m.categoryName ?? categoryStore.getCategoryName(String(m.categoryId))}" (/${m.pattern}/)`,
              )
              .join(", ");
            setMatchState({
              ruleConflict: true,
              conflictDetails: details,
              matchInfo: "",
            });
          } else {
            setMatchState({
              ruleConflict: false,
              conflictDetails: "",
              matchInfo: `Auto-selected by rule: /${result.matches[0].pattern}/`,
            });
          }
        } else {
          setMatchState(INITIAL_STATE);
        }
      }, 300);
    },
    [ruleStore, categoryStore],
  );

  const resetMatch = useCallback(() => {
    setMatchState(INITIAL_STATE);
  }, []);

  return { ...matchState, checkMatch, resetMatch };
}
