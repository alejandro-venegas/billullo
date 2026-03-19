import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import SaveIcon from "@mui/icons-material/Save";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import { useStore } from "@/app/stores/StoreContext";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";

const EmailConfigSection = observer(() => {
  const { emailConfigStore } = useStore();
  const { notify } = useNotification();
  const config = emailConfigStore.config;

  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [useSsl, setUseSsl] = useState(true);
  const [enabled, setEnabled] = useState(false);

  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync form when config loads
  useEffect(() => {
    if (config) {
      setImapHost(config.imapHost);
      setImapPort(String(config.imapPort));
      setEmailAddress(config.emailAddress);
      setPassword(""); // never pre-fill password
      setUseSsl(config.useSsl);
      setEnabled(config.enabled);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setTestResult(null);
    try {
      await emailConfigStore.save({
        imapHost,
        imapPort: Number(imapPort),
        emailAddress,
        password: password || null,
        useSsl,
        enabled,
      });
      setSaveSuccess(true);
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Failed to save configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!password) {
      setTestResult({ success: false, error: "Password is required to test" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await emailConfigStore.testConnection({
        imapHost,
        imapPort: Number(imapPort),
        emailAddress,
        password,
        useSsl,
      });
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: "Network error" });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await emailConfigStore.remove();
      setImapHost("");
      setImapPort("993");
      setEmailAddress("");
      setPassword("");
      setUseSsl(true);
      setEnabled(false);
      setTestResult(null);
      setSaveSuccess(false);
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Failed to remove configuration",
      );
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        IMAP Email Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure an IMAP mailbox to automatically scrape transaction
        notifications from your bank.
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 500 }}>
        <TextField
          label="IMAP Host"
          value={imapHost}
          onChange={(e) => setImapHost(e.target.value)}
          placeholder="imap.gmail.com"
          fullWidth
          size="small"
        />
        <Stack direction="row" spacing={2}>
          <TextField
            label="Port"
            value={imapPort}
            onChange={(e) => setImapPort(e.target.value)}
            type="number"
            size="small"
            sx={{ width: 120 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={useSsl}
                onChange={(e) => setUseSsl(e.target.checked)}
              />
            }
            label="Use SSL"
          />
        </Stack>
        <TextField
          label="Email Address"
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
          placeholder="you@example.com"
          fullWidth
          size="small"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            config?.hasPassword ? "••••••••  (leave blank to keep)" : ""
          }
          fullWidth
          size="small"
          helperText={
            config?.hasPassword
              ? "A password is saved. Leave blank to keep it unchanged."
              : undefined
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          }
          label="Enable background email scraping"
        />

        {testResult && (
          <Alert severity={testResult.success ? "success" : "error"}>
            {testResult.success
              ? "Connection successful!"
              : `Connection failed: ${testResult.error}`}
          </Alert>
        )}
        {saveSuccess && <Alert severity="success">Configuration saved.</Alert>}

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || !imapHost || !emailAddress}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            startIcon={
              testing ? <CircularProgress size={18} /> : <PlayArrowIcon />
            }
            onClick={handleTest}
            disabled={testing || !imapHost || !emailAddress}
          >
            Test Connection
          </Button>
          {config && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Remove
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
});

EmailConfigSection.displayName = "EmailConfigSection";

export default EmailConfigSection;
