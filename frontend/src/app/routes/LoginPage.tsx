import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import { useStore } from "@/app/stores/StoreContext";

const LoginPage = observer(() => {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await authStore.login(email, password);
    if (success) navigate(from, { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }} elevation={3}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Sign In
        </Typography>

        {authStore.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {authStore.error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={authStore.isLoading}
            sx={{ mb: 2 }}
          >
            {authStore.isLoading ? <CircularProgress size={24} /> : "Sign In"}
          </Button>
        </Box>

        <Typography variant="body2" textAlign="center">
          Don&apos;t have an account?{" "}
          <Link component={RouterLink} to="/register">
            Register
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
});

LoginPage.displayName = "LoginPage";

export default LoginPage;
