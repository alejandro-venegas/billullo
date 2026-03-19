import { useState, useCallback } from "react";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";

interface UseConfirmDeleteResult {
  isOpen: boolean;
  requestDelete: (id: number | string) => void;
  handleConfirm: () => Promise<void>;
  handleClose: () => void;
}

export function useConfirmDelete(
  onDelete: (id: number | string) => Promise<void>,
  errorMessage = "Failed to delete",
): UseConfirmDeleteResult {
  const { notify } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | string | null>(null);

  const requestDelete = useCallback((id: number | string) => {
    setPendingId(id);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPendingId(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (pendingId === null) return;
    try {
      await onDelete(pendingId);
    } catch (e) {
      notify(e instanceof Error ? e.message : errorMessage);
    }
    setIsOpen(false);
    setPendingId(null);
  }, [pendingId, onDelete, errorMessage, notify]);

  return { isOpen, requestDelete, handleConfirm, handleClose };
}
