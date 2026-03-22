import { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { reaction } from "mobx";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import { transactionsApi } from "@/api/apiConfig";
import { useStore } from "@/app/stores/StoreContext";
import type { TransactionBalanceDto } from "@/api/data-contracts";
import { formatCurrency } from "@/shared/utils/currency";
import AccountCards from "@/features/accounts/components/AccountCards/AccountCards";

const BalanceSummary = observer(() => {
  const { preferenceStore } = useStore();
  const [balance, setBalance] = useState<TransactionBalanceDto | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchBalance = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const data = await transactionsApi.transactionsGetBalance(
        {
          targetCurrency: preferenceStore.preferredCurrency,
        },
        { signal: controller.signal },
      );
      if (!controller.signal.aborted) {
        setBalance(data);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () =>
      reaction(
        () => preferenceStore.preferredCurrency,
        () => fetchBalance(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferenceStore],
  );

  const breakdownText =
    balance?.breakdown
      ?.map(
        (b) => `${formatCurrency(Number(b.originalAmount), b.currency ?? "")}`,
      )
      .join("  ·  ") ?? "";

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        backgroundColor: "background.paper",
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Balance:
        </Typography>
        {loading && !balance ? (
          <CircularProgress size={20} />
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
        {loading && balance && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Box>

      <AccountCards />
    </Box>
  );
});

BalanceSummary.displayName = "BalanceSummary";

export default BalanceSummary;
