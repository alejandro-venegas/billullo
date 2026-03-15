import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import type { TextFieldProps } from "@mui/material/TextField";
import { useStore } from "@/app/stores/StoreContext";

type CategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
  allowNone?: boolean;
  excludeId?: number | string;
} & Omit<TextFieldProps, "value" | "onChange" | "select" | "children">;

const CategorySelect = observer(
  ({
    value,
    onChange,
    allowNone = false,
    excludeId,
    ...textFieldProps
  }: CategorySelectProps) => {
    const { categoryStore } = useStore();

    return (
      <TextField
        select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...textFieldProps}
      >
        {allowNone && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {categoryStore.flatTree
          .filter((item) =>
            excludeId == null ||
            String(item.category.id) !== String(excludeId),
          )
          .map(({ category: cat, depth }) => (
            <MenuItem key={String(cat.id)} value={String(cat.id)}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  pl: depth * 2,
                }}
              >
                {cat.color && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: cat.color,
                      mr: 1,
                      flexShrink: 0,
                    }}
                  />
                )}
                {cat.name}
              </Box>
            </MenuItem>
          ))}
      </TextField>
    );
  },
);

CategorySelect.displayName = "CategorySelect";

export default CategorySelect;
