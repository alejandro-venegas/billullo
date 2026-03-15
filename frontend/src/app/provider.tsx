import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/en-gb";
import theme from "./theme";
import { StoreProvider } from "./stores/StoreContext";
import ErrorBoundary from "@/shared/components/ErrorBoundary/ErrorBoundary";
import NotificationProvider from "@/shared/components/NotificationProvider/NotificationProvider";

dayjs.extend(customParseFormat);

function AppProvider({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <NotificationProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default AppProvider;
