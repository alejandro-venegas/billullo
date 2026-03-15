import { useState, useEffect, useRef, memo } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import type { CategoryDto } from "@/api/data-contracts";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";
import CategorySelect from "@/features/categories/components/CategorySelect/CategorySelect";
import { DIALOG_ACTIONS_SX } from "@/shared/constants";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    parentCategoryId?: string | null,
    color?: string | null,
  ) => void | Promise<void>;
  category?: CategoryDto;
  parentCategoryId?: string;
}

const CategoryDialog = memo(
  ({ open, onClose, onSave, category, parentCategoryId }: CategoryDialogProps) => {
    const [name, setName] = useState("");
    const [parent, setParent] = useState("");
    const [color, setColor] = useState<string | null>(null);
    const [colorInput, setColorInput] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const colorPickerRef = useRef<HTMLInputElement>(null);
    const { notify } = useNotification();

    const isEdit = Boolean(category);
    const isRootCategory = isEdit
      ? category!.parentCategoryId == null
      : !parent;

    useEffect(() => {
      if (open) {
        setName(category?.name ?? "");
        setParent(
          category
            ? String(category.parentCategoryId ?? "")
            : parentCategoryId ?? "",
        );
        const initialColor = category?.color ?? null;
        setColor(initialColor);
        setColorInput(initialColor ?? "");
        setError("");
      }
    }, [open, category, parentCategoryId]);

    const handleSubmit = async () => {
      const trimmed = name.trim();
      if (!trimmed) {
        setError("Category name is required");
        return;
      }
      setSaving(true);
      try {
        await onSave(
          trimmed,
          isEdit ? undefined : parent || null,
          isRootCategory ? color : null,
        );
        onClose();
      } catch (e) {
        notify(
          e instanceof Error ? e.message : "Failed to save category",
        );
      } finally {
        setSaving(false);
      }
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        aria-labelledby="category-dialog-title"
      >
        <DialogTitle id="category-dialog-title">
          {isEdit ? "Edit Category" : "New Category"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Category Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            fullWidth
            error={Boolean(error)}
            helperText={error}
            sx={{ mt: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />

          {!isEdit && (
            <CategorySelect
              label="Parent Category"
              value={parent}
              onChange={setParent}
              allowNone
              fullWidth
              sx={{ mt: 2 }}
            />
          )}

          {isRootCategory && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Tooltip title="Pick a color">
                  <Box
                    onClick={() => colorPickerRef.current?.click()}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: color ?? "grey.400",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: "divider",
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
                <input
                  ref={colorPickerRef}
                  type="color"
                  value={color ?? "#9e9e9e"}
                  onChange={(e) => {
                    setColor(e.target.value);
                    setColorInput(e.target.value);
                  }}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: "none",
                  }}
                />
                <TextField
                  label="Hex color"
                  placeholder="#000000"
                  value={colorInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setColorInput(val);
                    if (val === "") {
                      setColor(null);
                    } else if (HEX_RE.test(val)) {
                      setColor(val);
                    }
                  }}
                  fullWidth
                  size="small"
                  inputProps={{ maxLength: 7, spellCheck: false }}
                />
              </Box>
            </Box>
          )}
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

CategoryDialog.displayName = "CategoryDialog";

export default CategoryDialog;
