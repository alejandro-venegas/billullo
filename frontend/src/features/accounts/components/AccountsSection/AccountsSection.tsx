import { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { AccountDto } from "@/api/data-contracts";
import { useStore } from "@/app/stores/StoreContext";
import AccountDialog from "@/features/accounts/components/AccountDialog/AccountDialog";
import AccountDeleteDialog from "@/features/accounts/components/AccountDeleteDialog/AccountDeleteDialog";

const AccountsSection = observer(() => {
  const { accountStore } = useStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<
    AccountDto | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<number>(0);

  const handleAdd = useCallback(() => {
    setEditingAccount(undefined);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((account: AccountDto) => {
    setEditingAccount(account);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingAccount(undefined);
  }, []);

  const handleDeleteClick = useCallback((id: number) => {
    setDeletingAccountId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="small"
        >
          Add Account
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {accountStore.accounts.map((account) => (
          <Paper
            key={account.id}
            variant="outlined"
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Color swatch */}
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: account.color ?? "grey.400",
                flexShrink: 0,
                border: "1px solid",
                borderColor: "divider",
              }}
            />

            {/* Account info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body1" fontWeight={600} noWrap>
                  {account.name}
                </Typography>
                {account.isDefault && (
                  <Chip label="Default" size="small" color="primary" />
                )}
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}
              >
                {account.currencies && account.currencies.length > 0 ? (
                  account.currencies.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      size="small"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Any currency
                  </Typography>
                )}
              </Stack>

              {account.identifier && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  }}
                >
                  {account.identifier}
                </Typography>
              )}
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleEdit(account)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip
                title={
                  account.isDefault
                    ? "Cannot delete the default account"
                    : "Delete"
                }
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(account.id!)}
                    disabled={account.isDefault}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {accountStore.accounts.length === 0 && (
        <Typography color="text.secondary">
          No accounts yet. Add one to get started.
        </Typography>
      )}

      <AccountDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        account={editingAccount}
      />

      {deleteDialogOpen && (
        <AccountDeleteDialog
          open={deleteDialogOpen}
          onClose={handleDeleteDialogClose}
          accountId={deletingAccountId}
        />
      )}
    </Box>
  );
});

AccountsSection.displayName = "AccountsSection";

export default AccountsSection;
