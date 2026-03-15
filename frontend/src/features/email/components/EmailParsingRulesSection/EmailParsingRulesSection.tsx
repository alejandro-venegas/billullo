import { useState } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useStore } from "@/app/stores/StoreContext";
import type { EmailParsingRuleDto } from "@/api/data-contracts";
import EmailParsingRuleDialog from "@/features/email/components/EmailParsingRuleDialog/EmailParsingRuleDialog";
import ConfirmDialog from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";

const EmailParsingRulesSection = observer(() => {
  const { emailParsingRuleStore } = useStore();
  const { notify } = useNotification();
  const rules = emailParsingRuleStore.rules;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<
    EmailParsingRuleDto | undefined
  >();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const handleCreate = () => {
    setEditingRule(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (rule: EmailParsingRuleDto) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: number | string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      try {
        await emailParsingRuleStore.deleteRule(deletingId);
      } catch (e) {
        notify(
          e instanceof Error ? e.message : "Failed to delete parsing rule",
        );
      }
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6">Email Parsing Rules</Typography>
          <Typography variant="body2" color="text.secondary">
            Define how transaction data is extracted from incoming emails.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          size="small"
        >
          Add Rule
        </Button>
      </Stack>

      {rules.length === 0 ? (
        <Typography color="text.secondary">
          No parsing rules yet. Add one to start extracting transactions from
          emails.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Sender</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {rule.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {rule.senderAddress || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.transactionType}
                      size="small"
                      color={
                        rule.transactionType === "Income" ? "success" : "error"
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{rule.categoryName || "—"}</TableCell>
                  <TableCell>{String(rule.priority)}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                    >
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(rule)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(rule.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <EmailParsingRuleDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingRule(undefined);
        }}
        rule={editingRule}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Parsing Rule"
        description="Are you sure you want to delete this email parsing rule?"
      />
    </Paper>
  );
});

EmailParsingRulesSection.displayName = "EmailParsingRulesSection";

export default EmailParsingRulesSection;
