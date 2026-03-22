import { observer } from "mobx-react-lite";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import type { Dayjs } from "dayjs";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useStore } from "@/app/stores/StoreContext";
import { DATE_TIME_FORMAT } from "@/shared/constants";

export interface FilterValues {
  typeFilter: "all" | "expense" | "income";
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  search: string;
  accountIds: number[];
}

interface TransactionFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

const TransactionFilters = observer(
  ({ filters, onChange }: TransactionFiltersProps) => {
    const { accountStore } = useStore();
    const update = (patch: Partial<FilterValues>) =>
      onChange({ ...filters, ...patch });

    return (
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "center" }}
        sx={{ mb: 2 }}
      >
        <ToggleButtonGroup
          value={filters.typeFilter}
          exclusive
          onChange={(_, val) => val && update({ typeFilter: val })}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="expense">Expenses</ToggleButton>
          <ToggleButton value="income">Income</ToggleButton>
        </ToggleButtonGroup>

        <DateTimePicker
          label="From"
          value={filters.startDate}
          onChange={(val) => update({ startDate: val })}
          format={DATE_TIME_FORMAT}
          ampm
          slotProps={{
            textField: { size: "small", sx: { width: 230 } },
            field: { clearable: true },
          }}
        />
        <DateTimePicker
          label="To"
          value={filters.endDate}
          onChange={(val) => update({ endDate: val })}
          format={DATE_TIME_FORMAT}
          ampm
          slotProps={{
            textField: { size: "small", sx: { width: 230 } },
            field: { clearable: true },
          }}
        />

        <TextField
          label="Search description"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          size="small"
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="account-filter-label">Accounts</InputLabel>
          <Select
            labelId="account-filter-label"
            multiple
            value={filters.accountIds}
            onChange={(e: SelectChangeEvent<number[]>) =>
              update({ accountIds: e.target.value as number[] })
            }
            input={<OutlinedInput label="Accounts" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((id) => {
                  const account = accountStore.accounts.find(
                    (a) => a.id === id,
                  );
                  return (
                    <Chip
                      key={id}
                      label={account?.name ?? id}
                      size="small"
                      sx={{
                        "& .MuiChip-label": { pl: 1 },
                        "&::before": {
                          content: '""',
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: account?.color ?? "#9e9e9e",
                          ml: 0.5,
                          flexShrink: 0,
                        },
                      }}
                    />
                  );
                })}
              </Box>
            )}
          >
            {accountStore.accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: account.color ?? "#9e9e9e",
                    mr: 1,
                    flexShrink: 0,
                  }}
                />
                {account.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    );
  },
);

TransactionFilters.displayName = "TransactionFilters";

export default TransactionFilters;
