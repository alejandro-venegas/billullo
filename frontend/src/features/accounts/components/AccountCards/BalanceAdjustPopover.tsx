import { useState, useEffect, useCallback } from "react";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useStore } from "@/app/stores/StoreContext";
import type {
  AccountDto,
  TransactionBalanceDto,
} from "@/api/data-contracts";

interface BalanceAdjustPopoverProps {
  anchorEl: HTMLElement | null;
  account: AccountDto | null;
  balance: TransactionBalanceDto | null;
  onClose: () => void;
  onSubmit: () => void;
}

interface CurrencyRow {
  currency: string;
  original: number;
  value: string;
}

export default function BalanceAdjustPopover({
  anchorEl,
  account,
  balance,
  onClose,
  onSubmit,
}: BalanceAdjustPopoverProps) {
  const { accountStore } = useStore();
  const [rows, setRows] = useState<CurrencyRow[]>([]);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const open = Boolean(anchorEl) && account !== null;

  const buildRows = useCallback(() => {
    if (!balance?.breakdown || balance.breakdown.length === 0) {
      // Fallback: single row with account's fallback currency or preferred
      const currency =
        account?.currencies?.[0] ?? account?.fallbackCurrency ?? "USD";
      return [{ currency, original: 0, value: "0" }];
    }

    return balance.breakdown.map((b) => ({
      currency: b.currency ?? "USD",
      original: Number(b.originalAmount ?? 0),
      value: String(b.originalAmount ?? 0),
    }));
  }, [balance, account]);

  useEffect(() => {
    if (open) {
      setRows(buildRows());
      setVisible(false);
    }
  }, [open, buildRows]);

  const handleValueChange = (index: number, newValue: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, value: newValue } : row)),
    );
  };

  const handleSubmit = async () => {
    if (!account?.id) return;
    setSubmitting(true);

    try {
      const changedRows = rows.filter(
        (row) => Number(row.value) !== row.original,
      );

      await Promise.all(
        changedRows.map((row) =>
          accountStore.adjustBalance(account.id!, {
            currency: row.currency,
            newBalance: Number(row.value),
            visible,
          }),
        ),
      );

      onSubmit();
    } catch {
      // Error is handled by the store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      <Box sx={{ p: 2, minWidth: 260, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="subtitle2">
          Adjust Balance — {account?.name}
        </Typography>

        {rows.map((row, index) => (
          <TextField
            key={row.currency}
            label={row.currency}
            type="number"
            size="small"
            value={row.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            fullWidth
          />
        ))}

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={visible}
              onChange={(_, checked) => setVisible(checked)}
            />
          }
          label="Show as transaction"
        />

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button size="small" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Popover>
  );
}
