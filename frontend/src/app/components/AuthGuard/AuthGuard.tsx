import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useStore } from "@/app/stores/StoreContext";

const AuthGuard = observer(() => {
  const { authStore } = useStore();
  const location = useLocation();

  useEffect(() => {
    authStore.initialize();
  }, [authStore]);

  if (!authStore.isInitialized) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authStore.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
});

AuthGuard.displayName = "AuthGuard";

export default AuthGuard;
