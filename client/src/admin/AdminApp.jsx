import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { adminStore } from "./adminStore";
import {
  fetchCurrentAdmin,
  selectAdmin,
} from "../features/admin/adminSlice";
import AdminLoginPage from "./AdminLoginPage";
import AdminLayout from "./AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminSkillsPage from "./pages/AdminSkillsPage";
import AdminReportsPage from "./pages/AdminReportsPage";

function AdminProtectedRoute() {
  const { admin, accessToken, bootstrapped } = useSelector(selectAdmin);
  const location = useLocation();

  if (!bootstrapped) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0d1117",
          color: "#10b981",
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        Loading Admin Console…
      </div>
    );
  }

  if (!accessToken || !admin) {
    return <Navigate to="/admin-login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function AdminGuestRoute() {
  const { admin, accessToken, bootstrapped } = useSelector(selectAdmin);

  if (!bootstrapped) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0d1117",
          color: "#10b981",
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        Loading Admin Console…
      </div>
    );
  }

  if (accessToken && admin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}

function AdminBootstrapper() {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchCurrentAdmin());
  }, [dispatch]);

  const isAdminLogin = location.pathname.startsWith("/admin-login");

  return (
    <>
      {isAdminLogin ? (
        <Routes>
          <Route element={<AdminGuestRoute />}>
            <Route path="/" element={<AdminLoginPage />} />
          </Route>
        </Routes>
      ) : (
        <Routes>
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="skills" element={<AdminSkillsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>
          </Route>
        </Routes>
      )}
      <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
    </>
  );
}

/**
 * AdminApp — mounted inside the main BrowserRouter in App.jsx.
 * Uses its own Redux Provider (adminStore) so admin auth state
 * is isolated from the user auth state.
 */
export default function AdminApp() {
  return (
    <Provider store={adminStore}>
      <AdminBootstrapper />
    </Provider>
  );
}
