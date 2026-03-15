import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/app/components/Layout/Layout";
import AuthGuard from "@/app/components/AuthGuard/AuthGuard";
import BillulloPage from "@/app/routes/BillulloPage";
import SettingsPage from "@/app/routes/SettingsPage";
import LoginPage from "@/app/routes/LoginPage";
import RegisterPage from "@/app/routes/RegisterPage";
import NotFoundPage from "@/app/routes/NotFoundPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route path="/" element={<BillulloPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
