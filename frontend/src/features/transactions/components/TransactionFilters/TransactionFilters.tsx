import { memo } from "react";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Stack from "@mui/material/Stack";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import type { Dayjs } from "dayjs";
import { DATE_TIME_FORMAT } from "@/shared/constants";

export interface FilterValues {
  typeFilter: "all" | "expense" | "income";
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  search: string;
}

interface TransactionFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

const TransactionFilters = memo(
  ({ filters, onChange }: TransactionFiltersProps) => {
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
      </Stack>
    );
  },
);

TransactionFilters.displayName = "TransactionFilters";

export default TransactionFilters;
