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
  AdminReportsPage,
  AdminSkillsPage,
  AdminUsersPage,
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
} from "./pages";
import MeetingPage from "./pages/MeetingPage";

function ProtectedRoute({ adminOnly = false }) {
  const { user, accessToken, bootstrapped } = useSelector(selectAuth);
  const location = useLocation();

  if (!bootstrapped) {
    return <div className="screen-loader">Loading SkillSwap...</div>;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
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
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Route>

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
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route path="/meeting/:sessionId" element={<MeetingPage />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminUsersPage dashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/skills" element={<AdminSkillsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
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
