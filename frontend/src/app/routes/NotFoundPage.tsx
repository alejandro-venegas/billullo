import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

function NotFoundPage() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, textAlign: "center" }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          404
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The page you're looking for doesn't exist.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/">
          Go Home
        </Button>
      </Paper>
    </Box>
  );
}

NotFoundPage.displayName = "NotFoundPage";

export default NotFoundPage;
