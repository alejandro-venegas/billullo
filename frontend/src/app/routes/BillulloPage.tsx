import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { reaction } from "mobx";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { useStore } from "@/app/stores/StoreContext";
import type { TransactionDto } from "@/api/data-contracts";
import TransactionDialog from "@/features/transactions/components/TransactionDialog/TransactionDialog";
import TransactionFilters from "@/features/transactions/components/TransactionFilters/TransactionFilters";
import CategoryChip from "@/features/categories/components/CategoryChip/CategoryChip";
import type { FilterValues } from "@/features/transactions/components/TransactionFilters/TransactionFilters";
import ConfirmDialog from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { useNotification } from "@/shared/components/NotificationProvider/NotificationProvider";
import BalanceSummary from "@/features/transactions/components/BalanceSummary/BalanceSummary";
import { DATE_TIME_FORMAT } from "@/shared/constants";
import { formatCurrency } from "@/shared/utils/currency";

function useTransactionColumns(
  onEdit: (t: TransactionDto) => void,
  onDelete: (id: number | string) => void,
) {
  const { categoryStore } = useStore();

  return useMemo<GridColDef[]>(
    () => [
      {
        field: "date",
        headerName: "Date",
        width: 170,
        valueFormatter: (value: string) =>
          dayjs(value).format(DATE_TIME_FORMAT),
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "categoryName",
        headerName: "Category",
        width: 180,
        valueGetter: (_value: string | null, row: TransactionDto) =>
          row.categoryName ??
          categoryStore.getCategoryName(String(row.categoryId ?? "")),
        renderCell: (params: GridRenderCellParams<TransactionDto>) =>
          params.row.categoryId ? (
            <CategoryChip categoryId={params.row.categoryId} />
          ) : null,
      },
      {
        field: "amount",
        headerName: "Amount",
        width: 150,
        type: "number",
        renderCell: (params: GridRenderCellParams<TransactionDto>) => {
          const { amount, currency, convertedAmount, targetCurrency } =
            params.row;
          const formatted = formatCurrency(Number(amount), currency ?? "USD");

          if (
            convertedAmount != null &&
            targetCurrency &&
            targetCurrency !== currency
          ) {
            return (
              <Tooltip
                title={`${formatCurrency(convertedAmount, targetCurrency)}`}
              >
                <span>{formatted}</span>
              </Tooltip>
            );
          }
          return <span>{formatted}</span>;
        },
      },
      {
        field: "currency",
        headerName: "Currency",
        width: 90,
      },
      {
        field: "type",
        headerName: "Type",
        width: 110,
        renderCell: (params: GridRenderCellParams<TransactionDto>) => (
          <Chip
            label={params.value === "Income" ? "Income" : "Expense"}
            color={params.value === "Income" ? "success" : "error"}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<TransactionDto>) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Edit transaction"
                onClick={() => onEdit(params.row)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                aria-label="Delete transaction"
                onClick={() => onDelete(params.row.id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [categoryStore, onEdit, onDelete],
  );
}

const BillulloPage = observer(() => {
  const { transactionStore, preferenceStore } = useStore();
  const { notify } = useNotification();

  const [filters, setFilters] = useState<FilterValues>({
    typeFilter: "all",
    startDate: null,
    endDate: null,
    search: "",
  });

  useEffect(() => {
    if (transactionStore.error) {
      notify(transactionStore.error);
      transactionStore.error = null;
    }
  }, [transactionStore.error, notify, transactionStore]);

  const prevFiltersRef = useRef(filters);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(searchTimeoutRef.current);
  }, []);

  useEffect(
    () =>
      reaction(
        () => preferenceStore.preferredCurrency,
        () => transactionStore.loadFromApi(preferenceStore.preferredCurrency),
      ),
    [transactionStore, preferenceStore],
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterValues) => {
      const prev = prevFiltersRef.current;
      setFilters(newFilters);
      prevFiltersRef.current = newFilters;

      const syncToStore = () => {
        transactionStore.setFilters({
          typeFilter: newFilters.typeFilter,
          startDate: newFilters.startDate?.toISOString() ?? null,
          endDate: newFilters.endDate?.toISOString() ?? null,
          search: newFilters.search,
        });
        transactionStore.loadFromApi(preferenceStore.preferredCurrency);
      };

      const onlySearchChanged =
        newFilters.search !== prev.search &&
        newFilters.typeFilter === prev.typeFilter &&
        newFilters.startDate === prev.startDate &&
        newFilters.endDate === prev.endDate;

      clearTimeout(searchTimeoutRef.current);
      if (onlySearchChanged) {
        searchTimeoutRef.current = setTimeout(syncToStore, 400);
      } else {
        syncToStore();
      }
    },
    [transactionStore, preferenceStore.preferredCurrency],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    TransactionDto | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "date", sort: "desc" },
  ]);

  const handleCreate = useCallback(() => {
    setEditingTransaction(undefined);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((transaction: TransactionDto) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: number | string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deletingId) {
      try {
        await transactionStore.deleteTransaction(deletingId);
      } catch (e) {
        notify(
          e instanceof Error ? e.message : "Failed to delete transaction",
        );
      }
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  }, [deletingId, transactionStore, notify]);

  const columns = useTransactionColumns(handleEdit, handleDeleteClick);

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={600}>
          Billullo
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          New Transaction
        </Button>
      </Stack>

      <TransactionFilters filters={filters} onChange={handleFilterChange} />

      <BalanceSummary />

      <Box sx={{ width: "100%" }}>
        <DataGrid
          rows={transactionStore.transactions}
          columns={columns}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          paginationMode="server"
          rowCount={transactionStore.totalCount}
          paginationModel={{
            page: transactionStore.page - 1,
            pageSize: transactionStore.pageSize,
          }}
          onPaginationModelChange={(model) => {
            transactionStore.setPage(model.page + 1);
            transactionStore.setPageSize(model.pageSize);
            transactionStore.loadFromApi(preferenceStore.preferredCurrency);
          }}
          pageSizeOptions={[10, 25, 50]}
          loading={transactionStore.isLoading}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            backgroundColor: "background.paper",
            borderRadius: 2,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "grey.50",
            },
          }}
        />
      </Box>

      <TransactionDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTransaction(undefined);
        }}
        transaction={editingTransaction}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </Box>
  );
});

BillulloPage.displayName = "BillulloPage";

export default BillulloPage;
