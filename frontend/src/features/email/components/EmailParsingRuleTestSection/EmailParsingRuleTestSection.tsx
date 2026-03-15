import { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useStore } from "@/app/stores/StoreContext";

interface TestRuleResult {
  matched: boolean;
  amount?: number | string | null;
  date?: string | null;
  currency?: string | null;
  description?: string | null;
  error?: string | null;
}

interface EmailParsingRuleTestSectionProps {
  amountRegex: string;
  dateRegex: string;
  dateFormat: string;
  currencyFixed: string;
  currencyRegex: string;
  descriptionFixed: string;
  descriptionRegex: string;
  open: boolean;
}

function EmailParsingRuleTestSection({
  amountRegex,
  dateRegex,
  dateFormat,
  currencyFixed,
  currencyRegex,
  descriptionFixed,
  descriptionRegex,
  open,
}: EmailParsingRuleTestSectionProps) {
  const { emailParsingRuleStore } = useStore();

  const [testBody, setTestBody] = useState("");
  const [testSubject, setTestSubject] = useState("");
  const [testSender, setTestSender] = useState("");
  const [testResult, setTestResult] = useState<TestRuleResult | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      setTestBody("");
      setTestSubject("");
      setTestSender("");
      setTestResult(null);
    }
  }, [open]);

  const handleTest = async () => {
    if (!amountRegex.trim()) {
      setTestResult({ matched: false, error: "Amount regex is required to test" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await emailParsingRuleStore.testRule({
        emailBody: testBody,
        emailSubject: testSubject,
        senderAddress: testSender,
        amountRegex: amountRegex.trim(),
        dateRegex: dateRegex.trim(),
        dateFormat: dateFormat.trim(),
        currencyFixed: currencyFixed.trim() || null,
        currencyRegex: currencyRegex.trim() || null,
        descriptionFixed: descriptionFixed.trim() || null,
        descriptionRegex: descriptionRegex.trim() || null,
      });
      setTestResult(
        (result as TestRuleResult) ?? { matched: false, error: "No response" },
      );
    } catch {
      setTestResult({ matched: false, error: "Network error" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <Divider>
        <Typography variant="caption" color="text.secondary">
          Test
        </Typography>
      </Divider>

      <TextField
        label="Sample Email Body"
        value={testBody}
        onChange={(e) => setTestBody(e.target.value)}
        multiline
        rows={3}
        fullWidth
        size="small"
        placeholder="Paste a sample email body to test extraction..."
      />
      <Stack direction="row" spacing={2}>
        <TextField
          label="Sample Subject"
          value={testSubject}
          onChange={(e) => setTestSubject(e.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="Sample Sender"
          value={testSender}
          onChange={(e) => setTestSender(e.target.value)}
          fullWidth
          size="small"
        />
        <Button
          variant="outlined"
          startIcon={
            testing ? <CircularProgress size={18} /> : <PlayArrowIcon />
          }
          onClick={handleTest}
          disabled={testing || !testBody.trim()}
          sx={{ minWidth: 100 }}
        >
          Test
        </Button>
      </Stack>

      {testResult && (
        <Alert severity={testResult.matched ? "success" : "warning"}>
          {testResult.matched ? (
            <Stack spacing={0.5}>
              <Typography variant="body2">
                <strong>Matched!</strong>
              </Typography>
              {testResult.amount != null && (
                <Typography variant="body2">
                  Amount: {String(testResult.amount)}
                </Typography>
              )}
              {testResult.date && (
                <Typography variant="body2">
                  Date: {testResult.date}
                </Typography>
              )}
              {testResult.currency && (
                <Typography variant="body2">
                  Currency: {testResult.currency}
                </Typography>
              )}
              {testResult.description && (
                <Typography variant="body2">
                  Description: {testResult.description}
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography variant="body2">
              No match. {testResult.error && `Error: ${testResult.error}`}
            </Typography>
          )}
        </Alert>
      )}
    </>
  );
}

EmailParsingRuleTestSection.displayName = "EmailParsingRuleTestSection";

export default EmailParsingRuleTestSection;
