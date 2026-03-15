import { useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import Chip from "@mui/material/Chip";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useStore } from "@/app/stores/StoreContext";

interface CategoryChipProps {
  categoryId: number | string;
}

const CategoryChip = observer(function CategoryChip({
  categoryId,
}: CategoryChipProps) {
  const { categoryStore } = useStore();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const category = categoryStore.getCategoryById(categoryId);
  if (!category) return null;

  const color = categoryStore.getRootColor(categoryId);
  const ancestors = categoryStore.getAncestors(categoryId);
  const hasAncestors = ancestors.length > 0;

  return (
    <>
      <Chip
        ref={anchorRef}
        label={category.name}
        size="small"
        variant="outlined"
        onMouseEnter={() => hasAncestors && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        sx={{
          borderColor: color ?? undefined,
          color: color ?? undefined,
          fontWeight: 500,
          maxWidth: 160,
        }}
      />
      {hasAncestors && (
        <Popover
          open={open}
          anchorEl={anchorRef.current}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          disableRestoreFocus
          sx={{ pointerEvents: "none" }}
          slotProps={{ paper: { sx: { px: 1.5, py: 0.75 } } }}
        >
          <Stack direction="row" alignItems="center" spacing={0.25}>
            {ancestors.map((a, i) => (
              <Stack key={a.id} direction="row" alignItems="center" spacing={0.25}>
                {i > 0 && (
                  <ChevronRightIcon
                    sx={{ fontSize: 14, color: "text.disabled" }}
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  {a.name}
                </Typography>
              </Stack>
            ))}
            <ChevronRightIcon
              sx={{ fontSize: 14, color: "text.disabled" }}
            />
            <Typography variant="caption" fontWeight={600}>
              {category.name}
            </Typography>
          </Stack>
        </Popover>
      )}
    </>
  );
});

CategoryChip.displayName = "CategoryChip";

export default CategoryChip;
