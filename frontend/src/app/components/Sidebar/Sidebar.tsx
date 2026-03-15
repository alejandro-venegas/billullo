import { useLocation, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import type { SvgIconComponent } from "@mui/icons-material";
import { useStore } from "@/app/stores/StoreContext";

interface SidebarProps {
  width: number;
}

interface NavItem {
  path: string;
  label: string;
  Icon: SvgIconComponent;
}

const navItems: NavItem[] = [
  { path: "/", label: "Billullo", Icon: ReceiptLongIcon },
  { path: "/settings", label: "Settings", Icon: SettingsIcon },
];

const Sidebar = observer(({ width }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authStore } = useStore();

  const handleLogout = async () => {
    await authStore.logout();
    navigate("/login", { replace: true });
  };

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        width,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 2,
        gap: 1,
        backgroundColor: "primary.main",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Tooltip key={item.path} title={item.label} placement="right">
            <IconButton
              aria-label={item.label}
              onClick={() => navigate(item.path)}
              sx={{
                color: "white",
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.2)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.15)",
                },
                borderRadius: 2,
                width: 48,
                height: 48,
              }}
            >
              <item.Icon />
            </IconButton>
          </Tooltip>
        );
      })}

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Logout */}
      <Tooltip title="Logout" placement="right">
        <IconButton
          aria-label="Logout"
          onClick={handleLogout}
          sx={{
            color: "white",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
            borderRadius: 2,
            width: 48,
            height: 48,
            mb: 2,
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
