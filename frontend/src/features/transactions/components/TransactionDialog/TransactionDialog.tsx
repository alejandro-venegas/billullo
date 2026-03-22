import { useState, useEffect, useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useStore } from "@/app/stores/StoreContext";
import type { TransactionDto } from "@/api/data-contracts";
import CategorySelect from "@/features/categories/components/CategorySelect/CategorySelect";
import { useDebouncedRuleMatch } from "@/features/transactions/hooks/useDebouncedRuleMatch";
import {
  DATE_TIME_FORMAT,
  CURRENCIES,
  TRANSACTION_TYPES,
  DIALOG_ACTIONS_SX,
} from "@/shared/constants";

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: TransactionDto;
}

const TransactionDialog = observer(
  ({ open, onClose, transaction }: TransactionDialogProps) => {
    const { transactionStore, categoryStore, ruleStore, accountStore } =
      useStore();
    const { notify } = useNotification();
    const isEdit = Boolean(transaction);

    const [accountId, setAccountId] = useState<number | "">(
      accountStore.defaultAccount?.id ?? "",
    );
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [type, setType] = useState("Expense");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedAccount = useMemo(
      () => accountStore.accounts.find((a) => a.id === accountId),
      [accountStore.accounts, accountId],
    );

    const currencyOptions = useMemo(() => {
      const acctCurrencies = selectedAccount?.currencies;
      if (acctCurrencies && acctCurrencies.length > 0) {
        return acctCurrencies;
      }
      return [...CURRENCIES];
    }, [selectedAccount]);

    const isCurrencyLocked =
      selectedAccount?.currencies != null &&
      selectedAccount.currencies.length === 1;

    const { matchInfo, ruleConflict, conflictDetails, checkMatch, resetMatch } =
      useDebouncedRuleMatch(ruleStore, categoryStore);

    useEffect(() => {
      if (open) {
        if (transaction) {
          setAccountId(transaction.accountId ?? accountStore.defaultAccount?.id ?? "");
          setDate(dayjs(transaction.date));
          setDescription(transaction.description);
          setCategory(String(transaction.categoryId ?? ""));
          setAmount(String(transaction.amount));
          setCurrency(transaction.currency);
          setType(transaction.type);
        } else {
          setAccountId(accountStore.defaultAccount?.id ?? "");
          setDate(dayjs());
          setDescription("");
          setCategory("");
          setAmount("");
          setCurrency("USD");
          setType("Expense");
        }
        resetMatch();
        setErrors({});
      }
    }, [open, transaction, resetMatch, accountStore.defaultAccount?.id]);

    const handleAccountChange = useCallback(
      (newAccountId: number | "") => {
        setAccountId(newAccountId);
        if (newAccountId !== "") {
          const acct = accountStore.accounts.find((a) => a.id === newAccountId);
          const acctCurrencies = acct?.currencies;
          if (acctCurrencies && acctCurrencies.length === 1) {
            setCurrency(acctCurrencies[0]);
          } else if (
            acctCurrencies &&
            acctCurrencies.length > 1 &&
            !acctCurrencies.includes(currency)
          ) {
            setCurrency(acctCurrencies[0]);
          }
        }
      },
      [accountStore.accounts, currency],
    );

    const handleDescriptionChange = useCallback(
      (value: string) => {
        setDescription(value);
        checkMatch(value, setCategory);
      },
      [checkMatch],
    );

    const validate = (): boolean => {
      const newErrors: Record<string, string> = {};
      if (!date || !date.isValid()) newErrors.date = "Valid date is required";
      if (!description.trim())
        newErrors.description = "Description is required";
      if (!category) newErrors.category = "Category is required";
      const numAmount = parseFloat(amount);
      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
      if (!validate()) return;
      setSaving(true);
      try {
        const data = {
          date: date!.format("YYYY-MM-DDTHH:mm"),
          description: description.trim(),
          categoryId: category ? Number(category) : null,
          amount: parseFloat(amount),
          currency,
          type,
          accountId: accountId !== "" ? accountId : undefined,
        };

        if (transaction) {
          await transactionStore.updateTransaction(transaction.id, data);
        } else {
          await transactionStore.addTransaction(data);
        }
        onClose();
      } catch (e) {
        notify(
          e instanceof Error ? e.message : "Failed to save transaction",
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
        aria-labelledby="transaction-dialog-title"
      >
        <DialogTitle id="transaction-dialog-title">
          {isEdit ? "Edit Transaction" : "New Transaction"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, val) => val && setType(val)}
              fullWidth
              size="small"
            >
              {TRANSACTION_TYPES.map((t) => (
                <ToggleButton
                  key={t}
                  value={t}
                  color={t === "Expense" ? "error" : "success"}
                >
                  {t}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              select
              label="Account"
              value={accountId}
              onChange={(e) =>
                handleAccountChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              fullWidth
            >
              {accountStore.accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </TextField>

            <DateTimePicker
              label="Date & Time"
              value={date}
              onChange={(val) => setDate(val)}
              format={DATE_TIME_FORMAT}
              ampm
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(errors.date),
                  helperText: errors.date,
                },
              }}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              fullWidth
              error={Boolean(errors.description)}
              helperText={errors.description}
              placeholder="e.g., McDonald's lunch"
            />

            <div>
              <CategorySelect
                label="Category"
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  resetMatch();
                }}
                fullWidth
                error={Boolean(errors.category)}
                helperText={errors.category}
              />

              {matchInfo && !ruleConflict && (
                <Chip
                  label={matchInfo}
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              )}

              {ruleConflict && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    Multiple rules match: {conflictDetails}. Using first match —
                    you can select manually.
                  </Typography>
                </Alert>
              )}
            </div>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                fullWidth
                error={Boolean(errors.amount)}
                helperText={errors.amount}
                slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              />
              <TextField
                select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isCurrencyLocked}
                sx={{ minWidth: 120 }}
              >
                {currencyOptions.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
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

TransactionDialog.displayName = "TransactionDialog";

export default TransactionDialog;
