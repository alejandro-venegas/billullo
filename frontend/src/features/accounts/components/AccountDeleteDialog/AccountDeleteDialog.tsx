import { useState, useEffect, memo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useStore } from "@/app/stores/StoreContext";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";
import { DIALOG_ACTIONS_SX } from "@/shared/constants";

type DeleteMode = "keep" | "delete";

interface AccountDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: number;
}

const AccountDeleteDialog = memo(
  ({ open, onClose, accountId }: AccountDeleteDialogProps) => {
    const { accountStore } = useStore();
    const { notify } = useNotification();

    const [mode, setMode] = useState<DeleteMode>("keep");
    const [targetAccountId, setTargetAccountId] = useState<number | "">("");
    const [saving, setSaving] = useState(false);

    const otherAccounts = accountStore.accounts.filter(
      (a) => a.id !== accountId,
    );

    const currentAccount = accountStore.accounts.find(
      (a) => a.id === accountId,
    );

    const targetAccount =
      targetAccountId !== ""
        ? accountStore.accounts.find((a) => a.id === targetAccountId)
        : undefined;

    const hasCurrencyWarning =
      mode === "keep" &&
      targetAccount &&
      targetAccount.currencies &&
      targetAccount.currencies.length > 0 &&
      currentAccount?.currencies &&
      currentAccount.currencies.some(
        (c) => !targetAccount.currencies!.includes(c),
      );

    useEffect(() => {
      if (open) {
        setMode("keep");
        const defaultAcc = accountStore.defaultAccount;
        setTargetAccountId(
          defaultAcc && defaultAcc.id !== accountId
            ? defaultAcc.id!
            : otherAccounts[0]?.id ?? "",
        );
        setSaving(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, accountId]);

    const handleConfirm = async () => {
      setSaving(true);
      try {
        await accountStore.deleteAccount(accountId, {
          deleteTransactions: mode === "delete",
          targetAccountId:
            mode === "keep" && targetAccountId !== ""
              ? targetAccountId
              : null,
        });
        onClose();
      } catch (e) {
        notify(e instanceof Error ? e.message : "Failed to delete account");
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
        aria-labelledby="account-delete-dialog-title"
      >
        <DialogTitle id="account-delete-dialog-title">
          Delete Account
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            What should happen to the transactions in{" "}
            <strong>{currentAccount?.name ?? "this account"}</strong>?
          </Typography>

          <RadioGroup
            value={mode}
            onChange={(e) => setMode(e.target.value as DeleteMode)}
          >
            <FormControlLabel
              value="keep"
              control={<Radio />}
              label="Keep transactions (move to another account)"
            />
            <FormControlLabel
              value="delete"
              control={<Radio />}
              label="Delete transactions"
            />
          </RadioGroup>

          {mode === "keep" && (
            <>
              <TextField
                select
                label="Move transactions to"
                value={targetAccountId}
                onChange={(e) =>
                  setTargetAccountId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                fullWidth
                size="small"
                sx={{ mt: 2 }}
              >
                {otherAccounts.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}
                    {a.isDefault ? " (Default)" : ""}
                  </MenuItem>
                ))}
              </TextField>

              {hasCurrencyWarning && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  The target account has restricted currencies. Some
                  transactions may require currency conversion.
                </Alert>
              )}
            </>
          )}

          {mode === "delete" && (
            <Alert severity="error" sx={{ mt: 2 }}>
              All transactions in this account will be permanently deleted.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={DIALOG_ACTIONS_SX}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            color="error"
            variant="contained"
            disabled={saving || (mode === "keep" && targetAccountId === "")}
          >
            {saving ? <CircularProgress size={22} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  },
);

AccountDeleteDialog.displayName = "AccountDeleteDialog";

export default AccountDeleteDialog;
