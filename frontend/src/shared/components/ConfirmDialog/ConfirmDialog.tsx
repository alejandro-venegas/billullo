import { useId, memo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  warning?: string;
  confirmLabel?: string;
  confirmColor?: "error" | "warning" | "primary";
}

const ConfirmDialog = memo(
  ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    warning,
    confirmLabel = "Delete",
    confirmColor = "error",
  }: ConfirmDialogProps) => {
    const id = useId();
    const titleId = `${id}-title`;
    const descId = `${id}-desc`;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <DialogTitle id={titleId}>{title}</DialogTitle>
        <DialogContent>
          {warning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {warning}
            </Alert>
          )}
          <DialogContentText id={descId}>{description}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} color={confirmColor} variant="contained">
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    );
  },
);

ConfirmDialog.displayName = "ConfirmDialog";

export default ConfirmDialog;
