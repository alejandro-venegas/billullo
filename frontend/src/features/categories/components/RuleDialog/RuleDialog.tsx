import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { useStore } from "@/app/stores/StoreContext";
import type { CategoryRuleDto } from "@/api/data-contracts";
import CategorySelect from "@/features/categories/components/CategorySelect/CategorySelect";
import { useRegexTest } from "@/shared/hooks/useRegexTest";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";
import { DIALOG_ACTIONS_SX } from "@/shared/constants";

interface RuleDialogProps {
  open: boolean;
  onClose: () => void;
  rule?: CategoryRuleDto;
  categoryId?: string;
}

const RuleDialog = observer(
  ({ open, onClose, rule, categoryId }: RuleDialogProps) => {
    const { ruleStore } = useStore();
    const { notify } = useNotification();
    const isEdit = Boolean(rule);

    const [pattern, setPattern] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [testText, setTestText] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const [saving, setSaving] = useState(false);

    const { isValidRegex, testResult, patternError } = useRegexTest(
      pattern,
      testText,
    );

    useEffect(() => {
      if (open) {
        if (rule) {
          setPattern(rule.pattern);
          setSelectedCategory(String(rule.categoryId));
        } else {
          setPattern("");
          setSelectedCategory(categoryId ?? "");
        }
        setTestText("");
        setCategoryError("");
      }
    }, [open, rule, categoryId]);

    const handleSubmit = async () => {
      let hasError = false;

      if (!pattern.trim() || !isValidRegex) {
        hasError = true;
      }

      if (!selectedCategory) {
        setCategoryError("Category is required");
        hasError = true;
      }

      if (hasError) return;

      setSaving(true);
      try {
        if (rule) {
          await ruleStore.updateRule(rule.id, {
            pattern: pattern.trim(),
            categoryId: selectedCategory,
          });
        } else {
          await ruleStore.addRule(pattern.trim(), selectedCategory);
        }
        onClose();
      } catch (e) {
        notify(
          e instanceof Error ? e.message : "Failed to save rule",
        );
      } finally {
        setSaving(false);
      }
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="rule-dialog-title"
      >
        <DialogTitle id="rule-dialog-title">
          {isEdit ? "Edit Rule" : "New Rule"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Regex Pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              fullWidth
              error={Boolean(patternError)}
              helperText={
                patternError ||
                "Case-insensitive regex. Use | to match multiple terms (e.g., mcdonald|burger king)"
              }
              placeholder="mcdonald|burger king|wendy"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />

            <CategorySelect
              label="Category"
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setCategoryError("");
              }}
              fullWidth
              error={Boolean(categoryError)}
              helperText={categoryError}
            />

            <div>
              <TextField
                label="Test description (optional)"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                fullWidth
                placeholder="Type a sample description to test the pattern"
                size="small"
              />
              {testResult !== null && (
                <Chip
                  icon={
                    testResult ? (
                      <CheckCircleOutlineIcon />
                    ) : (
                      <HighlightOffIcon />
                    )
                  }
                  label={testResult ? "Match" : "No match"}
                  color={testResult ? "success" : "default"}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              )}
              {testResult === null &&
                testText.trim() &&
                pattern.trim() &&
                !isValidRegex && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    Fix the pattern to test
                  </Typography>
                )}
            </div>
          </Stack>
        </DialogContent>
        <DialogActions sx={DIALOG_ACTIONS_SX}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? (
              <CircularProgress size={22} />
            ) : isEdit ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    );
  },
);

RuleDialog.displayName = "RuleDialog";

export default RuleDialog;
