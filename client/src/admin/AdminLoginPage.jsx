import "./admin.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield, ShieldCheck } from "lucide-react";

import { adminLogin, selectAdmin } from "../features/admin/adminSlice";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector(selectAdmin);

  const update = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const result = await dispatch(adminLogin(form));
    if (adminLogin.fulfilled.match(result)) {
      navigate("/admin", { replace: true });
    }
  };

  return (
    <div className="admin-login-bg">
      {/* Animated blobs */}
      <div className="admin-blob admin-blob-1" />
      <div className="admin-blob admin-blob-2" />
      <div className="admin-blob admin-blob-3" />

      <div className="admin-login-wrapper">
        {/* Branding */}
        <div className="admin-login-brand">
          <div className="admin-brand-icon">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="admin-brand-title">SkillSwap</h1>
            <p className="admin-brand-sub">Admin Console</p>
          </div>
        </div>

        {/* Card */}
        <div className="admin-login-card">
          <div className="admin-login-card-header">
            <div className="admin-shield-ring">
              <ShieldCheck size={32} className="admin-shield-icon" />
            </div>
            <h2 className="admin-card-title">Administrator Access</h2>
            <p className="admin-card-desc">
              Restricted area. Admin credentials required.
            </p>
          </div>

          {error && (
            <div className="admin-error-banner" role="alert">
              <Shield size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="admin-login-form" onSubmit={submit}>
            {/* Email */}
            <div className="admin-field">
              <label className="admin-field-label" htmlFor="admin-email">
                Admin Email
              </label>
              <div className="admin-input-wrap">
                <Mail size={16} className="admin-input-icon" />
                <input
                  id="admin-email"
                  className="admin-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={update}
                  placeholder="admin@skillswap.dev"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="admin-field">
              <label className="admin-field-label" htmlFor="admin-password">
                Password
              </label>
              <div className="admin-input-wrap">
                <Lock size={16} className="admin-input-icon" />
                <input
                  id="admin-password"
                  className="admin-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={update}
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="admin-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="admin-login-btn"
              className="admin-login-btn"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <span className="admin-spinner" />
              ) : (
                <ShieldCheck size={18} />
              )}
              {status === "loading" ? "Authenticating…" : "Access Admin Console"}
            </button>
          </form>

          <p className="admin-login-notice">
            🔒 This portal is monitored. Unauthorized access attempts are logged.
          </p>
        </div>

        <p className="admin-login-back">
          Not an admin?{" "}
          <a href="/login" className="admin-login-link">
            Go to SkillSwap
          </a>
        </p>
      </div>
    </div>
  );
}
