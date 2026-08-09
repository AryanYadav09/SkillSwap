import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { store } from "./redux/store";
import { fetchCurrentUser, selectAuth } from "./features/auth/authSlice";
import { AuthLayout, AppLayout } from "./layouts";
import {
  BookmarksPage,
  ChatDetailPage,
  ChatsPage,
  DashboardPage,
  ForgotPasswordPage,
  LearningSkillsPage,
  LoginPage,
  MatchesPage,
  NotificationsPage,
  ProfileEditPage,
  ProfilePage,
  RegisterPage,
  ReportsPage,
  ResetPasswordPage,
  ReviewsPage,
  SearchPage,
  SessionsPage,
  SkillsPage,
  BarterDetailPage,
} from "./pages";
import MeetingPage from "./pages/MeetingPage";
import AdminApp from "./admin/AdminApp";

function ProtectedRoute() {
  const { user, accessToken, bootstrapped } = useSelector(selectAuth);
  const location = useLocation();

  if (!bootstrapped) {
    return <div className="screen-loader">Loading SkillSwap...</div>;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function GuestRoute() {
  const { user, accessToken, bootstrapped } = useSelector(selectAuth);

  if (!bootstrapped) {
    return <div className="screen-loader">Loading SkillSwap...</div>;
  }

  if (accessToken && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function Bootstrapper() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <>
      <Routes>
        {/* ── Admin portal (fully separate) ─────────────────── */}
        <Route path="/admin-login/*" element={<AdminApp />} />
        <Route path="/admin/*" element={<AdminApp />} />

        {/* ── Guest routes ──────────────────────────────────── */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Route>

        {/* ── User protected routes ─────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/learning-skills" element={<LearningSkillsPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/chat" element={<ChatsPage />} />
            <Route path="/chat/:id" element={<ChatDetailPage />} />
            <Route path="/barter/:id" element={<BarterDetailPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route path="/meeting/:meetingId" element={<MeetingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Bootstrapper />
      </BrowserRouter>
    </Provider>
  );
}
