import { useEffect, useState, useRef, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { reaction } from "mobx";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import EditIcon from "@mui/icons-material/Edit";
import { useStore } from "@/app/stores/StoreContext";
import { accountsApi } from "@/api/apiConfig";
import type {
  AccountDto,
  TransactionBalanceDto,
} from "@/api/data-contracts";
import { formatCurrency } from "@/shared/utils/currency";
import { signalRService } from "@/shared/signalRService";
import BalanceAdjustPopover from "./BalanceAdjustPopover";

interface AccountBalanceState {
  balance: TransactionBalanceDto | null;
  loading: boolean;
}

const AccountCards = observer(() => {
  const { accountStore, preferenceStore } = useStore();
  const [balances, setBalances] = useState<Record<number, AccountBalanceState>>(
    {},
  );
  const abortRefs = useRef<Record<number, AbortController>>({});

  // Popover state
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverAccount, setPopoverAccount] = useState<AccountDto | null>(null);
  const [popoverBalance, setPopoverBalance] =
    useState<TransactionBalanceDto | null>(null);

  const fetchBalance = useCallback(
    async (account: AccountDto) => {
      const id = account.id!;
      abortRefs.current[id]?.abort();
      const controller = new AbortController();
      abortRefs.current[id] = controller;

      setBalances((prev) => ({
        ...prev,
        [id]: { balance: prev[id]?.balance ?? null, loading: true },
      }));

      try {
        const data = await accountsApi.accountsGetBalance(
          id,
          { targetCurrency: preferenceStore.preferredCurrency },
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setBalances((prev) => ({
            ...prev,
            [id]: { balance: data, loading: false },
          }));
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setBalances((prev) => ({
            ...prev,
            [id]: { balance: prev[id]?.balance ?? null, loading: false },
          }));
        }
      }
    },
    [preferenceStore],
  );

  const fetchAllBalances = useCallback(() => {
    accountStore.accounts.forEach((account) => fetchBalance(account));
  }, [accountStore.accounts, fetchBalance]);

  useEffect(() => {
    fetchAllBalances();
    return () => {
      Object.values(abortRefs.current).forEach((c) => c.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountStore.accounts]);

  useEffect(
    () =>
      reaction(
        () => preferenceStore.preferredCurrency,
        () => fetchAllBalances(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferenceStore, fetchAllBalances],
  );

  useEffect(() => {
    signalRService.on("TransactionCreated", fetchAllBalances);
    return () => signalRService.off("TransactionCreated", fetchAllBalances);
  }, [fetchAllBalances]);

  const handleOpenPopover = (
    event: React.MouseEvent<HTMLElement>,
    account: AccountDto,
  ) => {
    setPopoverAnchor(event.currentTarget);
    setPopoverAccount(account);
    setPopoverBalance(balances[account.id!]?.balance ?? null);
  };

  const handleClosePopover = () => {
    setPopoverAnchor(null);
    setPopoverAccount(null);
    setPopoverBalance(null);
  };

  const handleAdjustSubmit = async () => {
    handleClosePopover();
    fetchAllBalances();
  };

  if (accountStore.accounts.length === 0) return null;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
          mt: 2,
        }}
      >
        {accountStore.accounts.map((account) => {
          const state = balances[account.id!];
          const balance = state?.balance ?? null;
          const loading = state?.loading ?? true;

          const breakdownText =
            balance?.breakdown
              ?.map(
                (b) =>
                  `${formatCurrency(Number(b.originalAmount), b.currency ?? "")}`,
              )
              .join("  \u00b7  ") ?? "";

          return (
            <Paper
              key={account.id}
              variant="outlined"
              sx={{
                minWidth: 180,
                p: 2,
                borderLeft: `4px solid ${account.color ?? "#9e9e9e"}`,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Tooltip
                  title={account.description ?? ""}
                  disableHoverListener={!account.description}
                >
                  <Typography variant="subtitle2" noWrap>
                    {account.name}
                  </Typography>
                </Tooltip>
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenPopover(e, account)}
                  aria-label={`Adjust balance for ${account.name}`}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>

              {loading && !balance ? (
                <CircularProgress size={18} />
              ) : balance ? (
                <Tooltip
                  title={breakdownText}
                  placement="bottom-start"
                  disableHoverListener={
                    !balance.breakdown || balance.breakdown.length <= 1
                  }
                >
                  <Typography variant="h6" fontWeight={600}>
                    {formatCurrency(
                      Number(balance.total),
                      balance.targetCurrency ?? "USD",
                    )}
                  </Typography>
                </Tooltip>
              ) : (
                <Typography variant="h6" fontWeight={600} color="text.secondary">
                  --
                </Typography>
              )}
              {loading && balance && (
                <CircularProgress size={14} sx={{ ml: 1 }} />
              )}
            </Paper>
          );
        })}
      </Box>

      <BalanceAdjustPopover
        anchorEl={popoverAnchor}
        account={popoverAccount}
        balance={popoverBalance}
        onClose={handleClosePopover}
        onSubmit={handleAdjustSubmit}
      />
    </>
  );
});

AccountCards.displayName = "AccountCards";

export default AccountCards;
