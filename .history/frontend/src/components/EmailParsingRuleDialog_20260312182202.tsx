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
import { useStore } from "../stores/StoreContext";
import type { EmailParsingRuleDto } from "../api/data-contracts";
import CategorySelect from "./CategorySelect";
import { useNotification } from "./NotificationProvider";
import { TRANSACTION_TYPES, DIALOG_ACTIONS_SX } from "../constants";
import EmailParsingRuleTestSection from "./EmailParsingRuleTestSection";

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
    const [amountRegex, setAmountRegex] = useState("");
    const [dateRegex, setDateRegex] = useState("");
    const [dateFormat, setDateFormat] = useState("MM/dd/yyyy");
    const [currencyFixed, setCurrencyFixed] = useState("");
    const [currencyRegex, setCurrencyRegex] = useState("");
    const [descriptionFixed, setDescriptionFixed] = useState("");
    const [descriptionRegex, setDescriptionRegex] = useState("");
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
          setAmountRegex(rule.amountRegex);
          setDateRegex(rule.dateRegex ?? "");
          setDateFormat(rule.dateFormat ?? "");
          setCurrencyFixed(rule.currencyFixed ?? "");
          setCurrencyRegex(rule.currencyRegex ?? "");
          setDescriptionFixed(rule.descriptionFixed ?? "");
          setDescriptionRegex(rule.descriptionRegex ?? "");
          setTransactionType(rule.transactionType);
          setCategoryId(String(rule.categoryId ?? ""));
          setPriority(String(rule.priority));
        } else {
          setName("");
          setSenderAddress("");
          setSubjectPattern("");
          setAmountRegex("");
          setDateRegex("");
          setDateFormat("");
          setCurrencyFixed("");
          setCurrencyRegex("");
          setDescriptionFixed("");
          setDescriptionRegex("");
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
      if (!amountRegex.trim()) e.amountRegex = "Amount regex is required";
      if (dateRegex.trim() && !dateFormat.trim())
        e.dateFormat = "Date format is required when date regex is set";
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const buildInput = () => ({
      name: name.trim(),
      senderAddress: senderAddress.trim() || null,
      subjectPattern: subjectPattern.trim() || null,
      amountRegex: amountRegex.trim(),
      dateRegex: dateRegex.trim(),
      dateFormat: dateFormat.trim(),
      currencyFixed: currencyFixed.trim() || null,
      currencyRegex: currencyRegex.trim() || null,
      descriptionFixed: descriptionFixed.trim() || null,
      descriptionRegex: descriptionRegex.trim() || null,
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
        notify(
          e instanceof Error ? e.message : "Failed to save parsing rule",
        );
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
                Extraction Regexes
              </Typography>
            </Divider>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Amount Regex"
                value={amountRegex}
                onChange={(e) => setAmountRegex(e.target.value)}
                fullWidth
                size="small"
                error={Boolean(errors.amountRegex)}
                helperText={
                  errors.amountRegex ||
                  "First capture group extracts the amount"
                }
                placeholder="\\$([\\d,]+\\.\\d{2})"
              />
              <TextField
                label="Date Regex"
                value={dateRegex}
                onChange={(e) => setDateRegex(e.target.value)}
                fullWidth
                size="small"
                error={Boolean(errors.dateRegex)}
                helperText={
                  errors.dateRegex ||
                  "Optional — leave blank to use email sent date"
                }
                placeholder="Date:\\s*(\\d{2}/\\d{2}/\\d{4})"
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Date Format"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                size="small"
                sx={{ width: 200 }}
                error={Boolean(errors.dateFormat)}
                helperText={errors.dateFormat || "Required if date regex is set"}
                placeholder="MM/dd/yyyy"
              />
              <TextField
                label="Currency (fixed)"
                value={currencyFixed}
                onChange={(e) => setCurrencyFixed(e.target.value)}
                size="small"
                sx={{ width: 120 }}
                placeholder="USD"
                helperText="Or use regex below"
              />
              <TextField
                label="Currency Regex"
                value={currencyRegex}
                onChange={(e) => setCurrencyRegex(e.target.value)}
                fullWidth
                size="small"
                placeholder="Currency:\\s*(\\w{3})"
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Description (fixed)"
                value={descriptionFixed}
                onChange={(e) => setDescriptionFixed(e.target.value)}
                fullWidth
                size="small"
                placeholder="Bank transfer"
                helperText="Or use regex below"
              />
              <TextField
                label="Description Regex"
                value={descriptionRegex}
                onChange={(e) => setDescriptionRegex(e.target.value)}
                fullWidth
                size="small"
                placeholder="Merchant:\\s*(.+)"
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

            <EmailParsingRuleTestSection
              amountRegex={amountRegex}
              dateRegex={dateRegex}
              dateFormat={dateFormat}
              currencyFixed={currencyFixed}
              currencyRegex={currencyRegex}
              descriptionFixed={descriptionFixed}
              descriptionRegex={descriptionRegex}
              open={open}
            />
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

export default EmailParsingRuleDialog;
