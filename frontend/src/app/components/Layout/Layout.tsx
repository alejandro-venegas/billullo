import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Sidebar from "@/app/components/Sidebar/Sidebar";

const SIDEBAR_WIDTH = 72;

const Layout = () => {
  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
      <Sidebar width={SIDEBAR_WIDTH} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${SIDEBAR_WIDTH}px`,
          p: 3,
          overflow: "auto",
          backgroundColor: "background.default",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

Layout.displayName = "Layout";

export default Layout;
