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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Chip from "@mui/material/Chip";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { AccountDto } from "@/api/data-contracts";
import { useStore } from "@/app/stores/StoreContext";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";
import { CURRENCIES, DIALOG_ACTIONS_SX } from "@/shared/constants";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function randomColor(): string {
  const hex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${hex}`;
}

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  account?: AccountDto;
}

const AccountDialog = memo(({ open, onClose, account }: AccountDialogProps) => {
  const { accountStore } = useStore();
  const { notify } = useNotification();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [fallbackCurrency, setFallbackCurrency] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [color, setColor] = useState<string>("#9e9e9e");
  const [colorInput, setColorInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(account);

  useEffect(() => {
    if (open) {
      setName(account?.name ?? "");
      setDescription(account?.description ?? "");
      setCurrencies(account?.currencies ?? []);
      setFallbackCurrency(account?.fallbackCurrency ?? "");
      setIdentifier(account?.identifier ?? "");
      const initialColor = account?.color ?? randomColor();
      setColor(initialColor);
      setColorInput(initialColor);
      setError("");
    }
  }, [open, account]);

  // Reset fallback when currencies change
  useEffect(() => {
    if (currencies.length < 2) {
      setFallbackCurrency("");
    } else if (fallbackCurrency && !currencies.includes(fallbackCurrency)) {
      setFallbackCurrency("");
    }
  }, [currencies, fallbackCurrency]);

  const handleCurrenciesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setCurrencies(typeof value === "string" ? value.split(",") : value);
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Account name is required");
      return;
    }
    if (currencies.length >= 2 && !fallbackCurrency) {
      setError("Fallback currency is required when multiple currencies are selected");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: trimmed,
        description: description.trim() || null,
        identifier: identifier.trim() || null,
        color,
        currencies: currencies.length > 0 ? currencies : null,
        fallbackCurrency: currencies.length >= 2 ? fallbackCurrency : null,
      };
      if (isEdit) {
        await accountStore.updateAccount(account!.id!, payload);
      } else {
        await accountStore.addAccount(payload);
      }
      onClose();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Failed to save account");
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
      aria-labelledby="account-dialog-title"
    >
      <DialogTitle id="account-dialog-title">
        {isEdit ? "Edit Account" : "New Account"}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          fullWidth
          required
          error={Boolean(error) && !name.trim()}
          helperText={!name.trim() && error ? error : undefined}
          sx={{ mt: 1 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
        />

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="account-currencies-label">Currencies</InputLabel>
          <Select
            labelId="account-currencies-label"
            multiple
            value={currencies}
            onChange={handleCurrenciesChange}
            label="Currencies"
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((val) => (
                  <Chip key={val} label={val} size="small" />
                ))}
              </Box>
            )}
          >
            {CURRENCIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Leave empty for any currency
          </FormHelperText>
        </FormControl>

        {currencies.length >= 2 && (
          <TextField
            select
            label="Fallback Currency"
            value={fallbackCurrency}
            onChange={(e) => {
              setFallbackCurrency(e.target.value);
              setError("");
            }}
            fullWidth
            required
            error={Boolean(error) && !fallbackCurrency}
            helperText={
              !fallbackCurrency && error
                ? error
                : "Default currency when exchange rate is needed"
            }
            sx={{ mt: 2 }}
          >
            {currencies.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
          helperText="Regex pattern matched against email body"
        />

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
                  backgroundColor: color,
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
              value={color}
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
                if (HEX_RE.test(val)) {
                  setColor(val);
                }
              }}
              fullWidth
              size="small"
              inputProps={{ maxLength: 7, spellCheck: false }}
            />
          </Box>
        </Box>
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
});

AccountDialog.displayName = "AccountDialog";

export default AccountDialog;
