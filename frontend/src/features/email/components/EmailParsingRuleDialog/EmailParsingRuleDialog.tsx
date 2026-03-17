import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { useStore } from "@/app/stores/StoreContext";
import type { EmailParsingRuleDto } from "@/api/data-contracts";
import CategorySelect from "@/features/categories/components/CategorySelect/CategorySelect";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";
import { TRANSACTION_TYPES, DIALOG_ACTIONS_SX } from "@/shared/constants";
import EmailParsingRuleTestSection from "@/features/email/components/EmailParsingRuleTestSection/EmailParsingRuleTestSection";

interface EmailParsingRuleDialogProps {
  open: boolean;
  onClose: () => void;
  rule?: EmailParsingRuleDto;
}

const EmailParsingRuleDialog = observer(
  ({ open, onClose, rule }: EmailParsingRuleDialogProps) => {
    const { emailParsingRuleStore } = useStore();
    const { notify } = useNotification();
    const isEdit = Boolean(rule);

    const [name, setName] = useState("");
    const [senderAddress, setSenderAddress] = useState("");
    const [subjectPattern, setSubjectPattern] = useState("");
    const [currencyFixed, setCurrencyFixed] = useState("");
    const [descriptionFixed, setDescriptionFixed] = useState("");
    const [transactionType, setTransactionType] = useState("Expense");
    const [categoryId, setCategoryId] = useState("");
    const [priority, setPriority] = useState("0");

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
      if (open) {
        if (rule) {
          setName(rule.name);
          setSenderAddress(rule.senderAddress ?? "");
          setSubjectPattern(rule.subjectPattern ?? "");
          setCurrencyFixed(rule.currencyFixed ?? "");
          setDescriptionFixed(rule.descriptionFixed ?? "");
          setTransactionType(rule.transactionType);
          setCategoryId(String(rule.categoryId ?? ""));
          setPriority(String(rule.priority));
        } else {
          setName("");
          setSenderAddress("");
          setSubjectPattern("");
          setCurrencyFixed("");
          setDescriptionFixed("");
          setTransactionType("Expense");
          setCategoryId("");
          setPriority("0");
        }
        setErrors({});
      }
    }, [open, rule]);

    const validate = (): boolean => {
      const e: Record<string, string> = {};
      if (!name.trim()) e.name = "Name is required";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const buildInput = () => ({
      name: name.trim(),
      senderAddress: senderAddress.trim() || null,
      subjectPattern: subjectPattern.trim() || null,
      currencyFixed: currencyFixed.trim() || null,
      descriptionFixed: descriptionFixed.trim() || null,
      transactionType,
      categoryId: categoryId || null,
      priority: Number(priority),
    });

    const handleSubmit = async () => {
      if (!validate()) return;
      setSaving(true);
      try {
        if (rule) {
          await emailParsingRuleStore.updateRule(rule.id, buildInput());
        } else {
          await emailParsingRuleStore.addRule(buildInput());
        }
        onClose();
      } catch (e) {
        notify(e instanceof Error ? e.message : "Failed to save parsing rule");
      } finally {
        setSaving(false);
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEdit ? "Edit Parsing Rule" : "New Parsing Rule"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Rule Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
              error={Boolean(errors.name)}
              helperText={errors.name}
              placeholder="e.g., BAC Credomatic alerts"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Sender Address Filter"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                fullWidth
                size="small"
                placeholder="alerts@bank.com"
                helperText="Only process emails from this address (optional)"
              />
              <TextField
                label="Subject Pattern (regex)"
                value={subjectPattern}
                onChange={(e) => setSubjectPattern(e.target.value)}
                fullWidth
                size="small"
                placeholder="transaction.*alert"
                helperText="Filter by subject line (optional)"
              />
            </Stack>

            <Divider>
              <Typography variant="caption" color="text.secondary">
                Overrides (optional)
              </Typography>
            </Divider>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Currency Override"
                value={currencyFixed}
                onChange={(e) => setCurrencyFixed(e.target.value)}
                size="small"
                sx={{ width: 160 }}
                placeholder="USD"
                helperText="Override AI-extracted currency"
              />
              <TextField
                label="Description Override"
                value={descriptionFixed}
                onChange={(e) => setDescriptionFixed(e.target.value)}
                fullWidth
                size="small"
                placeholder="Bank transfer"
                helperText="Override AI-extracted description"
              />
            </Stack>

            <Divider>
              <Typography variant="caption" color="text.secondary">
                Transaction Settings
              </Typography>
            </Divider>

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Transaction Type"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                size="small"
                sx={{ width: 160 }}
              >
                {TRANSACTION_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <CategorySelect
                label="Category"
                value={categoryId}
                onChange={setCategoryId}
                allowNone
                fullWidth
                size="small"
                helperText="Assign parsed transactions to this category (optional)"
              />
              <TextField
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                type="number"
                size="small"
                sx={{ width: 100 }}
                helperText="Higher = first"
              />
            </Stack>

            <EmailParsingRuleTestSection open={open} />
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

EmailParsingRuleDialog.displayName = "EmailParsingRuleDialog";

export default EmailParsingRuleDialog;
