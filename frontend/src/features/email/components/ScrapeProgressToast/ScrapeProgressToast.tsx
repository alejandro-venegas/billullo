import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import { useStore } from "@/app/stores/StoreContext";

const DONE_DISPLAY_MS = 4000;

const ScrapeProgressToast = observer(() => {
  const { emailConfigStore } = useStore();
  const { isScraping, scrapeProgress, scrapeDone, scrapeError } =
    emailConfigStore;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isScraping || scrapeError) {
      setOpen(true);
    }
  }, [isScraping, scrapeError]);

  useEffect(() => {
    if (scrapeDone) {
      setOpen(true);
      const timer = setTimeout(() => {
        setOpen(false);
        emailConfigStore.dismissScrapeResult();
      }, DONE_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [scrapeDone, emailConfigStore]);

  const handleClose = () => {
    setOpen(false);
    emailConfigStore.dismissScrapeResult();
  };

  const progress =
    scrapeProgress && scrapeProgress.total > 0
      ? Math.round((scrapeProgress.processed / scrapeProgress.total) * 100)
      : 0;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      onClose={scrapeError ? handleClose : undefined}
    >
      <Box sx={{ minWidth: 300 }}>
        {scrapeError ? (
          <Alert severity="error" onClose={handleClose}>
            Scrape failed: {scrapeError}
          </Alert>
        ) : scrapeDone ? (
          <Alert severity="success" onClose={handleClose}>
            Done — {scrapeDone.created} transaction
            {scrapeDone.created !== 1 ? "s" : ""} created from{" "}
            {scrapeDone.processed} email{scrapeDone.processed !== 1 ? "s" : ""}
          </Alert>
        ) : (
          <Alert severity="info" icon={false}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Scraping emails…{" "}
              {scrapeProgress
                ? `${scrapeProgress.processed} / ${scrapeProgress.total}`
                : "connecting…"}
            </Typography>
            <LinearProgress
              variant={scrapeProgress ? "determinate" : "indeterminate"}
              value={progress}
              sx={{ borderRadius: 1 }}
            />
          </Alert>
        )}
      </Box>
    </Snackbar>
  );
});

ScrapeProgressToast.displayName = "ScrapeProgressToast";

export default ScrapeProgressToast;
