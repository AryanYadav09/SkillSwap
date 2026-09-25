import { useCallback, useEffect, useRef, useState, Fragment } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
 ArrowLeft,
 Bell,
 BookOpen,
 Bookmark,
 CalendarPlus,
 Check,
 CheckCheck,
 Clock,
 Calendar,
 Copy,
 GraduationCap,
 MessageCircle,
 Plus,
 RefreshCw,
 Search,
 Send,
 Shield,
 ShieldAlert,
 Star,
 Trash2,
 UserRound,
 Users,
 Video,
 X,
} from "lucide-react";

import { fetchCurrentUser, login, register, selectAuth } from "../features/auth/authSlice";
import { api, getErrorMessage, unwrap } from "../services/api";
import { getSocket } from "../services/socket";
import AvailabilityManager from "../components/availability/AvailabilityManager";
import AvailableSlots from "../components/availability/AvailableSlots";
import TimezoneSelector from "../components/availability/TimezoneSelector";

const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const reportReasons = ["Spam", "Fake Profile", "Abusive Behavior", "Other"];

function formatDate(value) {
 if (!value) {
 return "Not scheduled";
 }

 return new Intl.DateTimeFormat("en-IN", {
 dateStyle: "medium",
 timeStyle: "short",
 }).format(new Date(value));
}

function getItems(payload) {
 return payload?.items || payload || [];
}

function PageHeader({ title, eyebrow, action }) {
 return (
 <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
 <div>
 {eyebrow ? <p className="label mb-2">{eyebrow}</p> : null}
 <h1 className="section-title">{title}</h1>
 </div>
 {action}
 </div>
 );
}

function LoadingState({ label = "Loading data..." }) {
 return (
 <div className="grid gap-3">
 {[1, 2, 3].map((item) => (
 <div key={item} className="card animate-pulse">
 <div className="mb-3 h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-200" />
 <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-200" />
 </div>
 ))}
 <p className="sr-only">{label}</p>
 </div>
 );
}

function EmptyState({ title, description }) {
 return (
 <div className="card py-10 text-center">
 <p className="font-display text-xl font-bold text-slate-900 dark:text-gray-900">{title}</p>
 <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
 </div>
 );
}

function Field({ label, name, type = "text", value, onChange, placeholder, required = false }) {
 return (
 <label className="grid gap-1.5">
 <span className="label">{label}</span>
 <input
 className="input"
 name={name}
 type={type}
 value={value}
 onChange={onChange}
 placeholder={placeholder}
 required={required}
 />
 </label>
 );
}

function TextArea({ label, name, value, onChange, placeholder, required = false }) {
 return (
 <label className="grid gap-1.5">
 <span className="label">{label}</span>
 <textarea
 className="input min-h-28 resize-y"
 name={name}
 value={value}
 onChange={onChange}
 placeholder={placeholder}
 required={required}
 />
 </label>
 );
}

function SelectField({ label, name, value, onChange, options, required = false }) {
 return (
 <label className="grid gap-1.5">
 <span className="label">{label}</span>
 <select className="input" name={name} value={value} onChange={onChange} required={required}>
 {options.map((option) => (
 <option key={option} value={option}>
 {option}
 </option>
 ))}
 </select>
 </label>
 );
}

function useApiList(endpoint, params = {}) {
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [reloadToken, setReloadToken] = useState(0);
 const stableParams = JSON.stringify(params);

 useEffect(() => {
 let active = true;

 setLoading(true);
 api
 .get(endpoint, { params: JSON.parse(stableParams) })
 .then((response) => {
 if (active) {
 setData(unwrap(response));
 }
 })
 .catch((error) => {
 if (active) {
 toast.error(getErrorMessage(error));
 }
 })
 .finally(() => {
 if (active) {
 setLoading(false);
 }
 });

 return () => {
 active = false;
 };
 }, [endpoint, stableParams, reloadToken]);

 return {
 data,
 loading,
 items: getItems(data),
 reload: () => setReloadToken((value) => value + 1),
 };
}

function AuthFormShell({ title, children, footer }) {
 return (
 <div>
 <h1 className="font-display text-3xl font-bold text-slate-900">{title}</h1>
 <div className="mt-6">{children}</div>
 {footer ? <p className="mt-5 text-sm text-slate-500">{footer}</p> : null}
 </div>
 );
}

export function LoginPage() {
 const [form, setForm] = useState({ email: "", password: "" });
 const dispatch = useDispatch();
 const navigate = useNavigate();
 const { status } = useSelector(selectAuth);

 const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

 const submit = async (event) => {
 event.preventDefault();
 const result = await dispatch(login(form));

 if (login.fulfilled.match(result)) {
 toast.success("Logged in");
 if (result.payload?.user?.role === "ADMIN") {
 localStorage.setItem("skillswap_admin_token", result.payload.accessToken);
 navigate("/admin", { replace: true });
 } else {
 navigate("/dashboard", { replace: true });
 }
 } else {
 toast.error(result.payload || "Login failed");
 }
 };

 return (
 <AuthFormShell
 title="Student Sign In"
 footer={
 <div className="flex flex-col gap-2 text-center text-sm">
 <p className="text-slate-600">
 New to SkillSwap?{" "}
 <Link className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline" to="/register">
 Create a student account
 </Link>
 </p>
 <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
 <Link className="text-slate-500 hover:text-indigo-600" to="/forgot-password">
 Forgot password?
 </Link>
 <Link className="text-indigo-600 font-semibold hover:underline" to="/admin-login">
 Admin Console →
 </Link>
 </div>
 </div>
 }
 >
 <form className="grid gap-4" onSubmit={submit}>
 <Field label="Campus Email" name="email" type="email" value={form.email} onChange={update} placeholder="e.g. aryan@university.edu" required />
 <Field label="Password" name="password" type="password" value={form.password} onChange={update} placeholder="••••••••" required />
 <button className="btn btn-primary py-3 w-full font-bold shadow-md shadow-indigo-200" disabled={status === "loading"}>
 {status === "loading" ? "Signing In..." : "Sign In to SkillSwap"}
 </button>
 </form>
 </AuthFormShell>
 );
}

export function RegisterPage() {
 const [form, setForm] = useState({
 name: "",
 email: "",
 password: "",
 college: "",
 department: "",
 semester: "",
 offeredSkillName: "",
 offeredSkillCategory: "",
 offeredSkillDescription: "",
 offeredSkillLevel: "BEGINNER",
 learningSkillName: "",
 learningSkillCategory: "",
 learningSkillDescription: "",
 learningSkillGoal: "",
 learningSkillCurrentLevel: "BEGINNER",
 });
 const dispatch = useDispatch();
 const navigate = useNavigate();

 const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

 const submit = async (event) => {
 event.preventDefault();
 const result = await dispatch(
 register({
 name: form.name,
 email: form.email,
 password: form.password,
 college: form.college,
 department: form.department,
 semester: form.semester,
 offeredSkill: {
 name: form.offeredSkillName,
 category: form.offeredSkillCategory,
 description: form.offeredSkillDescription,
 level: form.offeredSkillLevel,
 },
 learningSkill: {
 name: form.learningSkillName,
 category: form.learningSkillCategory,
 description: form.learningSkillDescription,
 goal: form.learningSkillGoal,
 currentLevel: form.learningSkillCurrentLevel,
 },
 }),
 );

 if (register.fulfilled.match(result)) {
 toast.success("Account created");
 navigate("/dashboard", { replace: true });
 } else {
 toast.error(result.payload || "Registration failed");
 }
 };

 return (
 <AuthFormShell
 title="Create account"
 footer={
 <>
 Already registered?{" "}
 <Link className="font-bold text-forest" to="/login">
 Login
 </Link>
 </>
 }
 >
 <form className="grid gap-4" onSubmit={submit}>
 <Field label="Name" name="name" value={form.name} onChange={update} required />
 <Field label="Email" name="email" type="email" value={form.email} onChange={update} required />
 <Field label="Password" name="password" type="password" value={form.password} onChange={update} required />
 <div className="grid gap-4 sm:grid-cols-2">
 <Field label="College" name="college" value={form.college} onChange={update} required />
 <Field label="Department" name="department" value={form.department} onChange={update} required />
 </div>
 <Field label="Semester" name="semester" value={form.semester} onChange={update} required />
 <div className="rounded-lg border border-slate-200 bg-white/70 p-4 ">
 <h2 className="font-display text-xl font-bold text-slate-900 dark:text-gray-900">Skill you can teach</h2>
 <div className="mt-4 grid gap-4">
 <div className="grid gap-4 sm:grid-cols-2">
 <Field label="Skill name" name="offeredSkillName" value={form.offeredSkillName} onChange={update} placeholder="React" required />
 <Field label="Category" name="offeredSkillCategory" value={form.offeredSkillCategory} onChange={update} placeholder="Frontend" required />
 </div>
 <TextArea label="What can you teach?" name="offeredSkillDescription" value={form.offeredSkillDescription} onChange={update} placeholder="I can teach components, hooks, and project structure." required />
 <SelectField label="Your level" name="offeredSkillLevel" value={form.offeredSkillLevel} onChange={update} options={levels} required />
 </div>
 </div>
 <div className="rounded-lg border border-slate-200 bg-white/70 p-4 ">
 <h2 className="font-display text-xl font-bold text-slate-900 dark:text-gray-900">Skill you want to learn</h2>
 <div className="mt-4 grid gap-4">
 <div className="grid gap-4 sm:grid-cols-2">
 <Field label="Skill name" name="learningSkillName" value={form.learningSkillName} onChange={update} placeholder="UI/UX Design" required />
 <Field label="Category" name="learningSkillCategory" value={form.learningSkillCategory} onChange={update} placeholder="Design" required />
 </div>
 <TextArea label="Skill description" name="learningSkillDescription" value={form.learningSkillDescription} onChange={update} placeholder="I want to understand design systems, wireframes, and usability." required />
 <TextArea label="Learning goal" name="learningSkillGoal" value={form.learningSkillGoal} onChange={update} placeholder="I want to design better project interfaces." required />
 <SelectField label="Current level" name="learningSkillCurrentLevel" value={form.learningSkillCurrentLevel} onChange={update} options={levels} required />
 </div>
 </div>
 <button className="btn btn-primary">Register</button>
 </form>
 </AuthFormShell>
 );
}

export function ForgotPasswordPage() {
 const [email, setEmail] = useState("");
 const [preview, setPreview] = useState("");

 const submit = async (event) => {
 event.preventDefault();
 try {
 const response = await api.post("/auth/forgot-password", { email });
 const result = unwrap(response);
 setPreview(result.resetTokenPreview || "");
 toast.success("Reset flow started");
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <AuthFormShell title="Reset password">
 <form className="grid gap-4" onSubmit={submit}>
 <Field label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
 <button className="btn btn-primary">Send reset token</button>
 {preview ? <p className="rounded-md bg-amber/10 p-3 text-sm font-bold text-amber">Dev reset token: {preview}</p> : null}
 <Link className="text-sm font-bold text-forest" to="/reset-password">
 I have a reset token
 </Link>
 </form>
 </AuthFormShell>
 );
}

export function ResetPasswordPage() {
 const [form, setForm] = useState({ token: "", password: "" });
 const navigate = useNavigate();
 const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

 const submit = async (event) => {
 event.preventDefault();
 try {
 await api.post("/auth/reset-password", form);
 toast.success("Password reset");
 navigate("/login");
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <AuthFormShell title="Set new password">
 <form className="grid gap-4" onSubmit={submit}>
 <Field label="Reset token" name="token" value={form.token} onChange={update} required />
 <Field label="New password" name="password" type="password" value={form.password} onChange={update} required />
 <button className="btn btn-primary">Update password</button>
 </form>
 </AuthFormShell>
 );
}

function StatCard({ label, value, icon: Icon }) {
 return (
 <div className="card">
 <div className="flex items-center justify-between gap-3">
 <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
 <Icon className="text-forest" size={18} />
 </div>
 <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-gray-900">{value ?? 0}</p>
 </div>
 );
}

export function DashboardPage() {
  const { data, loading, reload } = useApiList("/dashboard");
  const { accessToken, user } = useSelector(selectAuth);
  const navigate = useNavigate();
  const stats = data?.statistics || {};

  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return undefined;
    const handler = () => reload();
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [accessToken, reload]);

  const handleMatchAction = async (matchId, action, notifId) => {
    try {
      await api.patch(`/matches/${matchId}/${action}`);
      toast.success(`Match request ${action}ed`);
      if (notifId) await api.patch(`/notifications/${notifId}/read`);
      reload();
      if (action === "accept") navigate(`/sessions?matchId=${matchId}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        eyebrow="Overview"
        action={
          <button className="btn btn-secondary" onClick={reload}>
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />
      {loading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-6">
          {user?.role === "ADMIN" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Administrator Account Active</p>
                  <p className="text-xs text-slate-600">
                    You are in the student portal view. System telemetry, dispute tribunal, and user management are in the Admin Console.
                  </p>
                </div>
              </div>
              <Link to="/admin" className="btn btn-primary whitespace-nowrap text-xs">
                Open Admin Console →
              </Link>
            </div>
          )}

          {/* Stitch Hero Welcome Banner */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-container to-slate-900 text-white shadow-xl p-6 lg:p-8">
            <div className="absolute -right-20 -bottom-24 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-emerald-300">verified</span>
                    {user?.college || "Campus Peer Network"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-semibold">
                    Level 4 Scholar
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-display">
                  Good evening, {user?.name?.split(" ")[0] || "Aryan"} <span className="inline-block animate-bounce">👋</span>
                </h1>
                <p className="text-indigo-100 text-sm lg:text-base font-medium">
                  Ready to swap skills today? Your peer mentor reputation is among the{" "}
                  <span className="text-emerald-300 font-bold underline decoration-emerald-400/40 underline-offset-4">
                    top 2% on campus
                  </span>.
                </p>
              </div>
              {/* 3 Quick Metric Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
                <div className="flex flex-col p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Active Swaps</span>
                    <span className="material-symbols-outlined text-cyan-300 text-lg">swap_calls</span>
                  </div>
                  <span className="text-2xl font-black text-white mt-1 font-display">{stats.activeMatches ?? 1}</span>
                  <div className="flex items-center gap-1 mt-1 text-emerald-300 text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+2 this week</span>
                  </div>
                </div>
                <div className="flex flex-col p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Barter Rating</span>
                    <span className="material-symbols-outlined text-emerald-300 text-lg">star</span>
                  </div>
                  <span className="text-2xl font-black text-white mt-1 font-display">
                    {stats.averageRating ? `${(stats.averageRating * 20).toFixed(0)}%` : "100%"}
                  </span>
                  <span className="text-indigo-200 text-[11px] mt-1 font-medium">44 student reviews</span>
                </div>
                <div className="flex flex-col p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Next Meeting</span>
                    <span className="material-symbols-outlined text-cyan-300 text-lg">event</span>
                  </div>
                  <span className="text-2xl font-black text-white mt-1 font-display">{stats.meetingsScheduled ?? 0}</span>
                  <span className="text-cyan-200 text-[11px] mt-1 font-medium truncate">Next: Today 7:00 PM</span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Metrics Bar */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Offered Skills" value={stats.totalSkillsOffered} icon={Star} />
            <StatCard label="Learning Goals" value={stats.totalLearningSkills} icon={UserRound} />
            <StatCard label="Active Matches" value={stats.activeMatches} icon={Check} />
            <StatCard label="Booked Meetings" value={stats.meetingsScheduled} icon={Video} />
            <StatCard label="Average Rating" value={stats.averageRating} icon={Star} />
          </div>

          {/* Stitch Main Workspace Grid: Central Wide Feed (8 Cols) + Right-Hand Rail (4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Central Wide Feed (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Section: AI Top Recommendations */}
              <section className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                        <span className="material-symbols-outlined text-sm text-indigo-600">auto_awesome</span>
                        Neural Barter Engine
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Live Matches</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">AI Top Recommendations</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Peer matches calculated based on your offered <span className="font-semibold text-indigo-600">React</span> skills and desired <span className="font-semibold text-cyan-700">Figma / Product Design</span> learning goals.
                    </p>
                  </div>
                  <Link to="/matches" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline shrink-0">
                    <span>View All Matches</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>

                {/* 3 AI Recommendations Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Rohan Verma */}
                  <article className="flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 group hover:-translate-y-1">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base ring-2 ring-indigo-200">
                            RV
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                        </div>
                        {/* Circular Match Ring SVG */}
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 36 36">
                            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                            <path className="text-emerald-500 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="96, 100" strokeLinecap="round" strokeWidth="3"></path>
                          </svg>
                          <span className="absolute text-[11px] text-emerald-700 font-bold">96%</span>
                        </div>
                      </div>
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">Rohan Verma</h3>
                          <span className="material-symbols-outlined text-[15px] text-indigo-600" title="Verified">verified</span>
                        </div>
                        <span className="text-[11px] text-slate-500">Computer Eng • 3rd Yr</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Mutual Need Match
                      </span>
                      <div className="flex flex-col gap-2 text-xs mb-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">OFFERS</span>
                          <div className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs truncate">
                            React Architecture (Adv)
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">WANTS</span>
                          <div className="px-2 py-1 rounded bg-cyan-50 text-cyan-800 font-semibold text-xs truncate">
                            UI/UX Design & Proto
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Link to="/matches" className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition text-center">
                        Propose Barter
                      </Link>
                      <Link to="/search" className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition text-center">
                        View Profile
                      </Link>
                    </div>
                  </article>

                  {/* Card 2: Ananya Sharma */}
                  <article className="flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 group hover:-translate-y-1">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center text-base ring-2 ring-cyan-200">
                            AS
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                        </div>
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 36 36">
                            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                            <path className="text-emerald-500 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="94, 100" strokeLinecap="round" strokeWidth="3"></path>
                          </svg>
                          <span className="absolute text-[11px] text-emerald-700 font-bold">94%</span>
                        </div>
                      </div>
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">Ananya Sharma</h3>
                          <span className="material-symbols-outlined text-[15px] text-indigo-600" title="Verified">verified</span>
                        </div>
                        <span className="text-[11px] text-slate-500">Interaction Design • 4th Yr</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 text-[10px] font-bold mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse"></span>
                        High Synergy Barter
                      </span>
                      <div className="flex flex-col gap-2 text-xs mb-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">OFFERS</span>
                          <div className="px-2 py-1 rounded bg-cyan-50 text-cyan-800 font-semibold text-xs truncate">
                            Design Systems & Tokens
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">WANTS</span>
                          <div className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs truncate">
                            Next.js & API Integration
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Link to="/matches" className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition text-center">
                        Propose Barter
                      </Link>
                      <Link to="/search" className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition text-center">
                        View Profile
                      </Link>
                    </div>
                  </article>

                  {/* Card 3: Kabir Mehta */}
                  <article className="flex flex-col justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 group hover:-translate-y-1">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-base ring-2 ring-slate-200">
                            KM
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-slate-300 ring-2 ring-white"></span>
                        </div>
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 36 36">
                            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                            <path className="text-emerald-500 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="91, 100" strokeLinecap="round" strokeWidth="3"></path>
                          </svg>
                          <span className="absolute text-[11px] text-emerald-700 font-bold">91%</span>
                        </div>
                      </div>
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">Kabir Mehta</h3>
                          <span className="material-symbols-outlined text-[15px] text-slate-400" title="School">school</span>
                        </div>
                        <span className="text-[11px] text-slate-500">Data Science • 2nd Yr</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        Fast Match Candidate
                      </span>
                      <div className="flex flex-col gap-2 text-xs mb-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">OFFERS</span>
                          <div className="px-2 py-1 rounded bg-cyan-50 text-cyan-800 font-semibold text-xs truncate">
                            Python & ML Pipelines
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">WANTS</span>
                          <div className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs truncate">
                            Frontend Dashboards
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Link to="/matches" className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition text-center">
                        Propose Barter
                      </Link>
                      <Link to="/search" className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition text-center">
                        View Profile
                      </Link>
                    </div>
                  </article>
                </div>
              </section>

              {/* Section: Active Exchanges in Progress */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Active Exchanges in Progress</h2>
                    <p className="text-xs text-slate-500">Reciprocal peer-teaching schedules currently in session.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600 font-bold">
                    2 Scheduled
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Exchange 1 */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm ring-2 ring-indigo-200 shrink-0">
                          SP
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">Shrikant Patil</h3>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">3 of 5 completed</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                            <span className="font-semibold text-indigo-600">React Hooks</span>
                            <span className="material-symbols-outlined text-xs text-slate-400">sync_alt</span>
                            <span className="font-semibold text-cyan-700">Tailwind Layouts</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-1">
                            <span className="material-symbols-outlined text-sm text-indigo-600">schedule</span>
                            <span>Next: Tomorrow 4:00 PM (Video Room)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between md:justify-end shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="relative w-11 h-11 flex items-center justify-center">
                            <svg className="w-11 h-11 -rotate-90 transform" viewBox="0 0 36 36">
                              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                              <path className="text-indigo-600 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="60, 100" strokeLinecap="round" strokeWidth="3.5"></path>
                            </svg>
                            <span className="absolute text-[10px] text-indigo-600 font-bold">60%</span>
                          </div>
                          <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-semibold text-slate-900">Milestone 2</span>
                            <span className="text-[10px] text-slate-400">Custom Hooks demo</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to="/chat" className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition">
                            <MessageCircle size={16} />
                          </Link>
                          <Link to="/meetings" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">event_repeat</span>
                            <span>Manage</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exchange 2 */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center text-sm ring-2 ring-cyan-200 shrink-0">
                          MS
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">Meera Sen</h3>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">4 of 6 completed</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                            <span className="font-semibold text-indigo-600">TypeScript Generics</span>
                            <span className="material-symbols-outlined text-xs text-slate-400">sync_alt</span>
                            <span className="font-semibold text-cyan-700">User Research & Personas</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-1">
                            <span className="material-symbols-outlined text-sm text-indigo-600">schedule</span>
                            <span>Next: Friday 6:30 PM (Virtual Room)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between md:justify-end shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="relative w-11 h-11 flex items-center justify-center">
                            <svg className="w-11 h-11 -rotate-90 transform" viewBox="0 0 36 36">
                              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                              <path className="text-emerald-500 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="66, 100" strokeLinecap="round" strokeWidth="3.5"></path>
                            </svg>
                            <span className="absolute text-[10px] text-emerald-700 font-bold">66%</span>
                          </div>
                          <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-semibold text-slate-900">Milestone 3</span>
                            <span className="text-[10px] text-slate-400">Survey synthesis</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to="/chat" className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition">
                            <MessageCircle size={16} />
                          </Link>
                          <Link to="/meetings" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">event_repeat</span>
                            <span>Manage</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Dynamic Discover Students */}
              <MatchToggleSection
                teachableStudents={data?.teachableStudents || []}
                learnableTeachers={data?.learnableTeachers || []}
              />
            </div>

            {/* Right-Hand Activity & Calendar Rail (4 Cols) */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              {/* Next Upcoming Session Countdown Card */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Starts in 1h 42m
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Today, 7:00 PM</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm ring-2 ring-emerald-200">
                      DR
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" title="Online in lounge"></span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-slate-900 truncate">Devanshi Roy</span>
                      <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                    </div>
                    <span className="text-xs text-slate-500 truncate">Master's • Design Lab</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">SESSION AGENDA</span>
                  <span className="text-xs font-bold text-slate-900">Figma Auto-Layout & Component Props</span>
                  <span className="text-[11px] text-slate-500">Pair-building a design system atomic card component.</span>
                </div>
                <Link
                  to="/meetings"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 group"
                >
                  <Video size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Join Meeting Room</span>
                </Link>
              </div>

              {/* Quick Mini-Calendar Availability Widget */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-600 text-lg">calendar_month</span>
                    <h3 className="text-sm font-bold text-slate-900">Weekly Availability</h3>
                  </div>
                  <span className="text-xs text-slate-400">Oct 21 - 27</span>
                </div>
                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span key={i} className="text-[10px] font-bold text-slate-400 pb-1">{d}</span>
                  ))}
                  {[
                    { day: 21, active: true },
                    { day: 22, active: true },
                    { day: 23, active: false },
                    { day: 24, active: true },
                    { day: 25, active: true },
                    { day: 26, active: false },
                    { day: 27, active: false },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`py-2 rounded-xl flex flex-col items-center gap-1 transition ${
                        item.day === 21 ? "bg-indigo-600 text-white font-bold" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs">{item.day}</span>
                      {item.active && item.day !== 21 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      )}
                    </div>
                  ))}
                </div>
                <Link
                  to="/meetings"
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 text-xs font-bold rounded-xl text-center border border-slate-200 transition"
                >
                  Configure Slots →
                </Link>
              </div>

              {/* Campus Barter Escrow & Trust */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <span className="material-symbols-outlined text-lg">balance</span>
                  <span className="text-xs font-bold uppercase tracking-wider">1:1 Mutual Barter Balance</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zero currency exchange. 1 hour of knowledge given equals 1 hour of reciprocal mentorship earned across campus.
                </p>
                <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 pt-2 border-t border-indigo-100/60">
                  <span>Peer Verified Trust</span>
                  <span>Escrow Guarded</span>
                </div>
              </div>

              {/* Real-time Panels */}
              <div className="flex flex-col gap-4">
                <SimplePanel title="Recent Match Requests" items={data?.recentMatchRequests} render={(item) => `${item.sender?.name} → ${item.receiver?.name} (${item.status})`} />
                <DashboardNotificationPanel notifications={data?.notifications || []} onMatchAction={handleMatchAction} navigate={navigate} />
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}

function DashboardSkillSection({ title, items, emptyTitle, emptyDescription }) {
 return (
 <section>
 <h2 className="mb-3 font-display text-xl font-bold text-slate-900 dark:text-gray-900">{title}</h2>
 {items.length ? (
 <div className="grid gap-4 md:grid-cols-2">
 {items.map((item) => (
 <SkillCard key={item.id} item={item} />
 ))}
 </div>
 ) : (
 <EmptyState title={emptyTitle} description={emptyDescription} />
 )}
 </section>
 );
}

function MatchToggleSection({ teachableStudents, learnableTeachers }) {
  const [activeTab, setActiveTab] = useState("teaching");
  const items = activeTab === "teaching" ? teachableStudents : learnableTeachers;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Discover Students</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === "teaching"
              ? "These students want to learn skills you can teach."
              : "These students can teach you skills you want to learn."}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "teaching"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("teaching")}
          >
            <GraduationCap size={15} />
            I Can Teach
          </button>
          <button
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "learning"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("learning")}
          >
            <BookOpen size={15} />
            I Can Learn From
          </button>
        </div>
      </div>

      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((user) => (
            <DashboardMatchCard key={user.id} user={user} variant={activeTab} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={activeTab === "teaching" ? "No learners found yet" : "No teachers found yet"}
          description={
            activeTab === "teaching"
              ? "Students who want to learn your offered skills will appear here."
              : "Students who can teach skills you want to learn will appear here."
          }
        />
      )}
    </section>
  );
}

function DashboardMatchCard({ user, variant = "teaching" }) {
 const teaches = user.offeredSkills?.map((entry) => entry.skill.name).join(", ") || "No offered skills";
 const wants = user.learningSkills?.map((entry) => entry.skill.name).join(", ") || "No learning skills";

 return (
 <article className="flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 relative">
 {user.hasAvailability && (
 <div className="absolute top-3 right-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Available
 </div>
 )}
 <div>
 <div className="flex items-start gap-3">
 <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 text-lg">
 {user.profileImage ? (
 <img className="h-full w-full rounded-full object-cover" src={user.profileImage} alt="" />
 ) : (
 user.name?.charAt(0)
 )}
 </div>
 <div className="min-w-0 pr-14">
 <Link to={`/profile?id=${user.id}`} className="truncate font-bold text-slate-900 hover:text-indigo-600 block text-base transition">
 {user.name}
 </Link>
 <p className="truncate text-xs text-slate-500">{user.college || "Campus Student"}</p>
 </div>
 </div>

 <div className="mt-4 flex flex-col gap-2">
 <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/60">
 <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">Teaches</span>
 <p className="text-xs font-semibold text-slate-800 truncate">{teaches}</p>
 </div>
 <div className="p-2.5 rounded-xl bg-cyan-50/60 border border-cyan-100/60">
 <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 block mb-0.5">Wants to Learn</span>
 <p className="text-xs font-semibold text-slate-800 truncate">{wants}</p>
 </div>
 </div>
 </div>

 <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
 {user.averageRating ? (
 <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
 <Star size={13} fill="currentColor" />
 <span>{user.averageRating}</span>
 </div>
 ) : (
 <span className="text-[11px] text-slate-400">New Peer</span>
 )}
 <Link
 className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition"
 to={`/profile?id=${user.id}#book`}
 >
 <Calendar size={13} />
 {user.hasAvailability ? "Book" : "Profile"}
 </Link>
 </div>
 </article>
 );
}

function SimplePanel({ title, items = [], render }) {
 return (
 <section className="card">
 <h2 className="font-display text-xl font-bold text-slate-900 dark:text-gray-900">{title}</h2>
 <div className="mt-4 grid gap-3">
 {items.length ? (
 items.map((item) => (
 <p key={item.id} className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
 {render(item)}
 </p>
 ))
 ) : (
 <p className="text-sm text-slate-500">No items yet.</p>
 )}
 </div>
 </section>
 );
}

function getNotifIcon(type) {
 switch (type) {
 case "MATCH_REQUEST": case "MATCH_ACCEPTED": case "MATCH_REJECTED": return Users;
 case "SESSION_SCHEDULED": case "SESSION_ACCEPTED": case "SESSION_REJECTED": return Calendar;
 case "NEW_MESSAGE": return MessageCircle;
 case "REVIEW_ADDED": return Star;
 default: return Bell;
 }
}

function timeAgo(date) {
 const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
 if (seconds < 60) return "just now";
 const minutes = Math.floor(seconds / 60);
 if (minutes < 60) return `${minutes}m ago`;
 const hours = Math.floor(minutes / 60);
 if (hours < 24) return `${hours}h ago`;
 const days = Math.floor(hours / 24);
 if (days < 7) return `${days}d ago`;
 return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(date));
}

function DashboardNotificationPanel({ notifications, onMatchAction, navigate }) {
 return (
 <section className="card">
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-display text-xl font-bold text-slate-900 dark:text-gray-900 flex items-center gap-2">
 <Bell size={18} className="text-indigo-600" /> Notifications
 </h2>
 <Link to="/notifications" className="text-xs font-bold text-indigo-600 hover:text-indigo-600 transition-colors">View All →</Link>
 </div>
 <div className="grid gap-2">
 {notifications.length ? notifications.map((item) => {
 const Icon = getNotifIcon(item.type);
 return (
 <div key={item.id} className={`notif-card notif-item ${item.isRead ? "notif-card-read" : ""}`}>
 <div className="flex items-start gap-3">
 <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
 <Icon size={16} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
 <span className="text-[10px] text-gray-500 whitespace-nowrap">{timeAgo(item.createdAt)}</span>
 </div>
 <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.message}</p>
 {item.type === "MATCH_REQUEST" && !item.isRead && item.entityId && (
 <div className="flex gap-2 mt-2">
 <button className="btn btn-primary text-xs px-2 py-1" onClick={(e) => { e.stopPropagation(); onMatchAction(item.entityId, "accept", item.id); }}>
 <Check size={12} /> Accept
 </button>
 <button className="btn btn-secondary text-xs px-2 py-1" onClick={(e) => { e.stopPropagation(); onMatchAction(item.entityId, "reject", item.id); }}>
 <X size={12} /> Reject
 </button>
 </div>
 )}
 {item.type.startsWith("SESSION_") && item.entityId && (
 <button className="btn btn-secondary text-xs px-2 py-1 mt-2" onClick={() => navigate(`/sessions`)}>
 <Calendar size={12} /> View Session
 </button>
 )}
 </div>
 {!item.isRead && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500 shadow-glow" />}
 </div>
 </div>
 );
 }) : (
 <p className="text-sm text-gray-500 text-center py-4">No notifications yet.</p>
 )}
 </div>
 </section>
 );
}

function UserCard({ user, action }) {
 return (
 <article className="card">
 <div className="flex items-start gap-3">
 <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-forest/10 font-bold text-forest">
 {user?.profileImage ? <img className="h-full w-full rounded-md object-cover" src={user.profileImage} alt="" /> : user?.name?.charAt(0)}
 </div>
 <div className="min-w-0 flex-1">
 <Link to={`/profile?id=${user.id}`} className="font-bold text-slate-900 hover:text-forest dark:text-gray-900">
 {user.name}
 </Link>
 <p className="truncate text-sm text-slate-500">{user.college}</p>
 <div className="mt-2 flex flex-wrap gap-2">
 <span className="pill">{user.department}</span>
 <span className="pill">Rating {user.averageRating || 0}</span>
 </div>
 </div>
 </div>
 {action ? <div className="mt-4">{action(user)}</div> : null}
 </article>
 );
}

function SkillCard({ item, action }) {
 const skill = item.skill || item;
 return (
 <article className="card">
 <div className="flex items-start justify-between gap-3">
 <div>
 <h3 className="font-bold text-slate-900 dark:text-gray-900">{skill.name}</h3>
 <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{skill.description}</p>
 </div>
 <span className="pill">{skill.category}</span>
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {item.level ? <span className="pill">{item.level}</span> : null}
 {item.currentLevel ? <span className="pill">{item.currentLevel}</span> : null}
 {item.goal ? <span className="pill">Goal added</span> : null}
 </div>
 {item.user ? <p className="mt-3 text-sm font-semibold text-slate-500">By {item.user.name}</p> : null}
 {action ? <div className="mt-4">{action(item)}</div> : null}
 </article>
 );
}

function SkillForm({ type, onSaved }) {
 const learning = type === "learning";
 const [form, setForm] = useState({
 name: "",
 category: "",
 description: "",
 level: "BEGINNER",
 currentLevel: "BEGINNER",
 goal: "",
 });
 const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

 const submit = async (event) => {
 event.preventDefault();
 try {
 const payload = learning
 ? {
 name: form.name,
 category: form.category,
 description: form.description,
 goal: form.goal,
 currentLevel: form.currentLevel,
 }
 : {
 name: form.name,
 category: form.category,
 description: form.description,
 level: form.level,
 };
 await api.post(learning ? "/learning-skills" : "/skills", payload);
 toast.success(learning ? "Learning skill added" : "Skill added");
 setForm({ name: "", category: "", description: "", level: "BEGINNER", currentLevel: "BEGINNER", goal: "" });
 onSaved?.();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <form className="card grid gap-4" onSubmit={submit}>
 <div className="grid gap-4 md:grid-cols-2">
 <Field label="Skill name" name="name" value={form.name} onChange={update} required />
 <Field label="Category" name="category" value={form.category} onChange={update} required />
 </div>
 <TextArea label="Description" name="description" value={form.description} onChange={update} required />
 {learning ? (
 <>
 <TextArea label="Learning goal" name="goal" value={form.goal} onChange={update} required />
 <SelectField label="Current level" name="currentLevel" value={form.currentLevel} onChange={update} options={levels} />
 </>
 ) : (
 <SelectField label="Teaching level" name="level" value={form.level} onChange={update} options={levels} />
 )}
 <button className="btn btn-primary w-fit">
 <Plus size={16} />
 Add
 </button>
 </form>
 );
}

export function SkillsPage() {
 const { user } = useSelector(selectAuth);
 const { items, loading, reload } = useApiList("/skills", { userId: user?.id });

 const remove = async (id) => {
 try {
 await api.delete(`/skills/${id}`);
 toast.success("Skill deleted");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Skills Offered" eyebrow="Teach" />
 <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
 <SkillForm onSaved={reload} />
 {loading ? <LoadingState /> : <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <SkillCard key={item.id} item={item} action={(skill) => <button className="btn btn-danger" onClick={() => remove(skill.id)}><Trash2 size={16} /> Delete</button>} />)}</div>}
 </div>
 </>
 );
}

export function LearningSkillsPage() {
 const { user } = useSelector(selectAuth);
 const { items, loading, reload } = useApiList("/learning-skills", { userId: user?.id });

 const remove = async (id) => {
 try {
 await api.delete(`/learning-skills/${id}`);
 toast.success("Learning skill deleted");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Learning Skills" eyebrow="Learn" />
 <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
 <SkillForm type="learning" onSaved={reload} />
 {loading ? <LoadingState /> : <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <SkillCard key={item.id} item={item} action={(skill) => <button className="btn btn-danger" onClick={() => remove(skill.id)}><Trash2 size={16} /> Delete</button>} />)}</div>}
 </div>
 </>
 );
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { items, loading, reload } = useApiList("/users", { search: query, excludeSelf: true });

  const categories = [
    { id: "all", label: "All Skills (340)" },
    { id: "frontend", label: "Frontend Engineering" },
    { id: "backend", label: "Backend & Cloud" },
    { id: "design", label: "UI/UX Design" },
    { id: "aiml", label: "AI & Machine Learning" },
    { id: "coding", label: "Competitive Coding" },
    { id: "product", label: "Product Management" },
  ];

  const bookmark = async (userId) => {
    try {
      await api.post(`/bookmarks/${userId}`);
      toast.success("Saved user to favorites");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stitch Global Skill Discovery Hero */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-white p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-24 w-80 h-80 rounded-full bg-cyan-400/5 blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Peer Knowledge Network</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-indigo-600">IIT Bombay Hub</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                Global Skill Discovery
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Explore 340+ skills taught by peers across campus departments. Swap what you know for what you need.
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/80 self-start md:self-auto">
              <span className="material-symbols-outlined text-indigo-600 text-lg">sync_alt</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Barter Liquidity</span>
                <span className="text-xs font-bold text-slate-900">1,480 Match Cycles / wk</span>
              </div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs mt-2">
            <span className="material-symbols-outlined text-slate-400 absolute left-4 pointer-events-none">search</span>
            <input
              className="w-full pl-12 pr-28 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
              placeholder="Search skills, topics, frameworks (e.g. PyTorch, Figma, System Design)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={reload}
              className="absolute right-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
            >
              Search
            </button>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-nowrap no-scrollbar pt-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Engine (3 cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-base">tune</span>
              <h2 className="text-sm font-bold text-slate-900">Filter Engine</h2>
            </div>
            <button
              type="button"
              onClick={() => { setQuery(""); setSelectedCategory("all"); reload(); }}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Reset All
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Campus Network</span>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-0 accent-indigo-600" />
                <span>IIT Bombay</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded text-indigo-600 focus:ring-0 accent-indigo-600" />
                <span>Delhi Tech University</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded text-indigo-600 focus:ring-0 accent-indigo-600" />
                <span>All Campuses</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proficiency Level</span>
            <div className="flex flex-col gap-1.5 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded accent-indigo-600" />
                <span>Beginner Fundamentals</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input type="checkbox" defaultChecked className="rounded accent-indigo-600" />
                <span>Intermediate Applied</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input type="checkbox" defaultChecked className="rounded accent-indigo-600" />
                <span>Advanced Mentor</span>
              </label>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-indigo-700">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span className="text-xs font-bold">Campus Verified</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              All listed peer mentors have completed syllabus verification and peer reviews.
            </p>
          </div>
        </aside>

        {/* Right Peer Grid (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Showing {items.length} verified peers available for swap
            </span>
          </div>

          {loading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState
              title="No peers found"
              description="Try adjusting your search criteria or explore different skill categories."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((candidate) => (
                <UserCard
                  key={candidate.id}
                  user={candidate}
                  action={(user) => (
                    <div className="flex items-center gap-2 w-full mt-3 pt-3 border-t border-slate-100">
                      <Link
                        to={`/barter/new?userId=${user.id}`}
                        className="btn btn-primary flex-1 text-xs py-2"
                      >
                        <Sparkles size={13} /> Propose Swap
                      </Link>
                      <button
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition"
                        onClick={() => bookmark(user.id)}
                        title="Save to favorites"
                      >
                        <Bookmark size={15} />
                      </button>
                    </div>
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MatchesPage() {
 const { user } = useSelector(selectAuth);
 const compatible = useApiList("/matches/compatible");
 const requests = useApiList("/matches");
 const chats = useApiList("/chats");
 const navigate = useNavigate();

 const sendRequest = async (receiverId) => {
 try {
 await api.post("/matches", { receiverId, message: "I want to exchange skills with you." });
 toast.success("Request sent");
 requests.reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 const changeStatus = async (id, status) => {
 try {
 await api.patch(`/matches/${id}/${status}`);
 toast.success("Match updated");
 if (status === "accept") {
 try {
 const res = await api.post("/sessions", {
 matchRequestId: id,
 title: "Instant Skill Exchange",
 description: "Immediate session started after match acceptance.",
 sessionDate: new Date().toISOString(),
 duration: 60
 });
 const session = res.data?.data || res.data;
 if (session && session.meetingId) {
 navigate(`/meeting/${session.meetingId}`);
 }
 } catch(sessionErr) {
 navigate(`/sessions?matchId=${id}`);
 }
 } else {
 requests.reload();
 }
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Matches" eyebrow="Compatible swaps" />
 <div className="grid gap-6 xl:grid-cols-2">
 <section>
 <h2 className="mb-3 font-display text-xl font-bold text-slate-900 dark:text-gray-900">Compatible students</h2>
 {compatible.loading ? <LoadingState /> : <div className="grid gap-4">{compatible.items.map((user) => <UserCard key={user.id} user={user} action={(candidate) => <button className="btn btn-primary" onClick={() => sendRequest(candidate.id)}><Send size={16} /> Request</button>} />)}</div>}
 </section>
 <section>
 <h2 className="mb-3 font-display text-xl font-bold text-slate-900 dark:text-gray-900">Requests</h2>
 {requests.loading ? <LoadingState /> : <div className="grid gap-4">{requests.items.map((request) => <MatchRequestCard key={request.id} request={request} onStatus={changeStatus} currentUser={user} chats={chats.items} />)}</div>}
 </section>
 </div>
 </>
 );
}

function MatchRequestCard({ request, onStatus, currentUser, chats }) {
 const isReceiver = currentUser && request.receiverId === currentUser.id;
 const navigate = useNavigate();

 const handleMessage = () => {
 const otherUserId = isReceiver ? request.senderId : request.receiverId;
 const chat = chats?.find(c => c.otherParticipant?.id === otherUserId);
 if (chat) {
 navigate(`/chat/${chat.id}`);
 } else {
 toast.error("Chat not found. It might take a moment to generate.");
 }
 };

 return (
 <article className="card">
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="font-bold text-slate-900 dark:text-gray-900">
 {request.sender?.name} {"->"} {request.receiver?.name}
 </p>
 <p className="mt-1 text-sm text-slate-500">{request.message || "No message"}</p>
 </div>
 <span className="pill">{request.status}</span>
 </div>
 {request.status === "PENDING" ? (
 <div className="mt-4 flex flex-wrap gap-2">
 {isReceiver ? (
 <>
 <button className="btn btn-primary" onClick={() => onStatus(request.id, "accept")}><Check size={16} /> Accept</button>
 <button className="btn btn-secondary" onClick={() => onStatus(request.id, "reject")}><X size={16} /> Reject</button>
 </>
 ) : (
 <button className="btn btn-danger" onClick={() => onStatus(request.id, "cancel")}><Trash2 size={16} /> Cancel</button>
 )}
 </div>
 ) : request.status === "ACCEPTED" ? (
 <div className="mt-4 flex flex-wrap gap-2">
 <button className="btn btn-primary" onClick={() => navigate(`/sessions?matchId=${request.id}`)}><CalendarPlus size={16} /> Schedule</button>
 <button className="btn btn-secondary" onClick={handleMessage}><MessageCircle size={16} /> Message</button>
 <button className="btn btn-secondary" onClick={() => onStatus(request.id, "complete")}><Check size={16} /> Complete</button>
 </div>
 ) : null}
 </article>
 );
}

export function ChatsPage() {
 const { items, loading } = useApiList("/chats");
 const { accessToken } = useSelector(selectAuth);
 const [onlineUsers, setOnlineUsers] = useState(new Set());

 useEffect(() => {
 const socket = getSocket(accessToken);
 if (!socket) return undefined;
 const handler = ({ userId, isOnline }) => {
 setOnlineUsers((prev) => {
 const next = new Set(prev);
 if (isOnline) next.add(userId); else next.delete(userId);
 return next;
 });
 };
 socket.on("presence:update", handler);
 return () => socket.off("presence:update", handler);
 }, [accessToken]);

 return (
 <>
 <PageHeader title="Chats" eyebrow="Messages" />
 {loading ? <LoadingState /> : items.length ? (
 <div className="grid gap-2">
 {items.map((chat) => {
 const other = chat.otherParticipant;
 const isOnline = onlineUsers.has(other?.id);
 const lastMsg = chat.lastMessage;
 return (
 <Link className="card flex items-center gap-4 hover:border-indigo-300" key={chat.id} to={`/chat/${chat.id}`}>
 <div className="relative shrink-0">
 <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-lg">
 {other?.profileImage ? <img className="h-full w-full rounded-full object-cover" src={other.profileImage} alt="" /> : other?.name?.charAt(0)}
 </div>
 <div className={`online-dot ${isOnline ? "online-dot-on" : "online-dot-off"}`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <p className="font-bold text-gray-900 truncate">{other?.name}</p>
 {lastMsg && <span className="text-[10px] text-gray-500 whitespace-nowrap">{timeAgo(lastMsg.createdAt)}</span>}
 </div>
 <p className="text-sm text-gray-600 truncate mt-0.5">{lastMsg?.message || "Start a conversation"}</p>
 </div>
 {chat.unreadCount > 0 && <div className="chat-unread-badge">{chat.unreadCount}</div>}
 </Link>
 );
 })}
 </div>
 ) : <EmptyState title="No chats yet" description="Accepted matches create chats automatically." />}
 </>
 );
}

function ChatDateSep({ date }) {
 const d = new Date(date);
 const today = new Date();
 const yesterday = new Date(today);
 yesterday.setDate(yesterday.getDate() - 1);
 let label;
 if (d.toDateString() === today.toDateString()) label = "Today";
 else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
 else label = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(d);
 return <div className="chat-date-sep"><span>{label}</span></div>;
}

function formatTime(date) {
 return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(date));
}

export function ChatDetailPage() {
 const { id } = useParams();
 const { accessToken, user: currentUser } = useSelector(selectAuth);
 const [payload, setPayload] = useState(null);
 const [message, setMessage] = useState("");
 const [loading, setLoading] = useState(true);
 const [isTyping, setIsTyping] = useState(false);
 const messagesEndRef = useRef(null);
 const typingTimeoutRef = useRef(null);

 const scrollToBottom = useCallback(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 }, []);

 const loadChat = useCallback(async () => {
 setLoading(true);
 try {
 const response = await api.get(`/chats/${id}`);
 setPayload(unwrap(response));
 await api.patch(`/messages/${id}/seen`);
 const socket = getSocket(accessToken);
 if (socket) socket.emit("message:seen", { chatId: id });
 } catch (error) {
 toast.error(getErrorMessage(error));
 } finally {
 setLoading(false);
 }
 }, [id, accessToken]);

 useEffect(() => { loadChat(); }, [loadChat]);
 useEffect(() => { if (!loading) scrollToBottom(); }, [loading, scrollToBottom]);

 useEffect(() => {
 const socket = getSocket(accessToken);
 if (!socket) return undefined;

 const onMessage = (event) => {
 if (event.chatId === id) {
 setPayload((cur) => cur ? { ...cur, messages: { ...cur.messages, items: [...(cur.messages?.items || []), event.message] } } : cur);
 setTimeout(scrollToBottom, 50);
 socket.emit("message:seen", { chatId: id });
 }
 };

 const onSeen = (event) => {
 if (event.chatId === id) {
 setPayload((cur) => {
 if (!cur) return cur;
 const updatedItems = (cur.messages?.items || []).map((msg) =>
 msg.senderId === currentUser?.id && !msg.isSeen ? { ...msg, isSeen: true, seenAt: event.seenAt } : msg
 );
 return { ...cur, messages: { ...cur.messages, items: updatedItems } };
 });
 }
 };

 const onTyping = (event) => {
 if (event.chatId === id && event.userId !== currentUser?.id) setIsTyping(true);
 };
 const onStopTyping = (event) => {
 if (event.chatId === id && event.userId !== currentUser?.id) setIsTyping(false);
 };

 socket.on("chat:message", onMessage);
 socket.on("chat:seen", onSeen);
 socket.on("chat:typing", onTyping);
 socket.on("chat:stop-typing", onStopTyping);
 return () => {
 socket.off("chat:message", onMessage);
 socket.off("chat:seen", onSeen);
 socket.off("chat:typing", onTyping);
 socket.off("chat:stop-typing", onStopTyping);
 };
 }, [accessToken, id, currentUser?.id, scrollToBottom]);

 const handleInputChange = (e) => {
 setMessage(e.target.value);
 const socket = getSocket(accessToken);
 if (!socket) return;
 socket.emit("chat:typing", { chatId: id });
 clearTimeout(typingTimeoutRef.current);
 typingTimeoutRef.current = setTimeout(() => {
 socket.emit("chat:stop-typing", { chatId: id });
 }, 1500);
 };

 const submit = async (event) => {
 event.preventDefault();
 if (!message.trim()) return;
 const socket = getSocket(accessToken);
 if (socket) socket.emit("chat:stop-typing", { chatId: id });
 try {
 const response = await api.post("/messages", { chatId: id, message });
 setPayload((cur) => cur ? { ...cur, messages: { ...cur.messages, items: [...(cur.messages?.items || []), unwrap(response)] } } : cur);
 setMessage("");
 setTimeout(scrollToBottom, 50);
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 if (loading) return <LoadingState />;

 const messages = payload?.messages?.items || [];
 const otherUser = payload?.chat?.otherParticipant;

 return (
 <>
 <header className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
 <div className="flex items-center gap-4">
 <Link to="/chats" className="btn btn-secondary px-2" title="Back to chats">
 <ArrowLeft size={18} />
 </Link>
 <div className="relative">
 <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-forest/10 font-bold text-forest text-lg overflow-hidden">
 {otherUser?.profileImage ? <img className="h-full w-full object-cover" src={otherUser.profileImage} alt="" /> : otherUser?.name?.charAt(0) || "?"}
 </div>
 <div className={`online-dot ${otherUser?.isOnline ? "online-dot-on" : "online-dot-off"}`} />
 </div>
 <div>
 <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-gray-900 leading-none">
 {otherUser?.name || "Chat"}
 </h1>
 <p className="text-sm text-slate-500 mt-1">{otherUser?.college || "User"}</p>
 </div>
 </div>
 {otherUser ? (
 <Link
 className="btn btn-secondary"
 to={`/meeting/chat-${id}?target=${otherUser.id}&name=${encodeURIComponent(otherUser.name)}&role=caller`}
 >
 <Video size={16} className="text-indigo-600" />
 <span className="hidden sm:inline">Video Call</span>
 </Link>
 ) : null}
 </header>
 <section className="rounded-xl border border-slate-200 bg-slate-50 border border-slate-200/80 shadow-soft flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
 <div className="flex-1 overflow-y-auto px-4">
 <div className="chat-container">
 {messages.map((item, idx) => {
 const isMine = item.senderId === currentUser?.id;
 const showDate = idx === 0 || new Date(item.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
 return (
 <Fragment key={item.id}>
 {showDate && <ChatDateSep date={item.createdAt} />}
 <div className={`chat-bubble ${isMine ? "chat-bubble-sent" : "chat-bubble-received"}`}>
 {item.imageUrl && <img src={item.imageUrl} alt="" className="rounded-lg mb-2 max-w-[240px]" />}
 {item.message && <p>{item.message}</p>}
 <div className="chat-bubble-meta">
 <span>{formatTime(item.createdAt)}</span>
 {isMine && (
 <span className={`chat-tick ${item.isSeen ? "chat-tick-seen" : "chat-tick-sent"}`}>
 ✓✓
 </span>
 )}
 </div>
 </div>
 </Fragment>
 );
 })}
 {isTyping && (
 <div className="chat-typing">
 <div className="chat-typing-dot" />
 <div className="chat-typing-dot" />
 <div className="chat-typing-dot" />
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>
 </div>
 <form className="chat-input-area" onSubmit={submit}>
 <input className="input" value={message} onChange={handleInputChange} placeholder="Type a message..." autoFocus />
 <button className="btn btn-primary" disabled={!message.trim()}><Send size={16} /></button>
 </form>
 </section>
 </>
 );
}

export function SessionsPage() {
 const { user: currentUser, accessToken } = useSelector(selectAuth);
 const { items, loading, reload } = useApiList("/sessions");
 const chats = useApiList("/chats");
 const navigate = useNavigate();

 useEffect(() => {
 const socket = getSocket(accessToken);
 if (!socket) return undefined;
 const handler = () => reload();
 socket.on("notification:new", handler);
 return () => socket.off("notification:new", handler);
 }, [accessToken, reload]);

 const [joinId, setJoinId] = useState("");

 const status = async (id, next) => {
 try {
 await api.patch(`/sessions/${id}/${next}`);
 toast.success("Session updated");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 const copyMeetingId = (meetingId) => {
 navigator.clipboard.writeText(meetingId);
 toast.success("Meeting ID copied!");
 };

 const handleMessage = (otherUserId) => {
 const chat = chats.items?.find(c => c.otherParticipant?.id === otherUserId);
 if (chat) {
 navigate(`/chat/${chat.id}`);
 } else {
 toast.error("Chat not found");
 }
 };

 const joinMeeting = async (e) => {
 e.preventDefault();
 if (!joinId.trim()) return;
 try {
 const res = await api.get(`/sessions/meeting/${joinId.trim()}`);
 const session = unwrap(res);
 if (session) {
 navigate(`/meeting/${session.meetingId}`);
 }
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Sessions" eyebrow="Schedule" />

 {/* Join Meeting by ID */}
 <div className="card mb-6">
 <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><Video size={18} className="text-indigo-600" /> Join a Meeting</h3>
 <form className="flex gap-3" onSubmit={joinMeeting}>
 <input className="input flex-1" value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Paste meeting ID here..." />
 <button className="btn btn-primary" disabled={!joinId.trim()}><Video size={16} /> Join</button>
 </form>
 </div>

 {loading ? <LoadingState /> : (
 <div className="grid gap-4 md:grid-cols-2">
 {items.filter(session => session.status === "SCHEDULED" || session.status === "PENDING").map((session) => {
 const isSender = session.matchRequest?.sender?.id === currentUser?.id;
 const otherUser = isSender ? session.matchRequest?.receiver : session.matchRequest?.sender;
 return (
 <article className="card" key={session.id}>
 <div className="flex justify-between gap-3">
 <div>
 <p className="font-bold text-gray-900">{session.title}</p>
 {otherUser && <p className="text-sm font-semibold text-indigo-600 mt-1">With {otherUser.name}</p>}
 <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Clock size={12} /> {formatDate(session.sessionDate)}</p>
 </div>
 <span className="pill">{session.status}</span>
 </div>
 <p className="mt-3 text-sm text-gray-600">{session.description}</p>

 {/* Meeting ID */}
 {session.meetingId && (
 <div className="mt-3 flex items-center gap-2 rounded-lg bg-obsidian border border-slate-200 px-3 py-2">
 <span className="text-xs font-bold text-gray-500 uppercase">Meeting ID</span>
 <code className="flex-1 text-sm text-indigo-600 font-mono truncate">{session.meetingId}</code>
 <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => copyMeetingId(session.meetingId)} title="Copy">
 <Copy size={12} />
 </button>
 </div>
 )}

 {session.status === "SCHEDULED" || session.status === "PENDING" ? (
 <div className="mt-4 flex flex-wrap gap-2">
 <Link className="btn btn-primary" to={`/meeting/${session.meetingId}`}>
 <Video size={16} /> Start Meeting
 </Link>
 <button className="btn btn-secondary" onClick={() => handleMessage(otherUser?.id)}><MessageCircle size={16} /> Message</button>
 <button className="btn btn-secondary" onClick={() => status(session.id, "complete")}><Check size={16} /> Complete</button>
 <button className="btn btn-danger" onClick={() => status(session.id, "cancel")}><X size={16} /> Cancel</button>
 </div>
 ) : null}
 </article>
 );
 })}
 </div>
 )}
 </>
 );
}

export function ReviewsPage() {
 const { items, loading, reload } = useApiList("/reviews");
 const [form, setForm] = useState({ sessionId: "", reviewedUserId: "", rating: 5, comment: "" });
 const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

 const submit = async (event) => {
 event.preventDefault();
 try {
 await api.post("/reviews", { ...form, rating: Number(form.rating) });
 toast.success("Review added");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Reviews" eyebrow="Feedback" />
 <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
 <form className="card grid gap-4" onSubmit={submit}>
 <Field label="Completed session ID" name="sessionId" value={form.sessionId} onChange={update} required />
 <Field label="Reviewed user ID" name="reviewedUserId" value={form.reviewedUserId} onChange={update} required />
 <Field label="Rating" name="rating" type="number" value={form.rating} onChange={update} required />
 <TextArea label="Feedback" name="comment" value={form.comment} onChange={update} required />
 <button className="btn btn-primary"><Star size={16} /> Add review</button>
 </form>
 {loading ? <LoadingState /> : <div className="grid gap-4">{items.map((review) => <article className="card" key={review.id}><p className="font-bold text-slate-900 dark:text-gray-900">{review.rating}/5 for {review.reviewedUser?.name}</p><p className="mt-2 text-sm text-slate-500">{review.comment}</p></article>)}</div>}
 </div>
 </>
 );
}

export function BookmarksPage() {
 const { items, loading, reload } = useApiList("/bookmarks");
 const remove = async (userId) => {
 try {
 await api.delete(`/bookmarks/${userId}`);
 toast.success("Bookmark removed");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Saved Users" eyebrow="Bookmarks" />
 {loading ? <LoadingState /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((bookmark) => <UserCard key={bookmark.id} user={bookmark.bookmarkedUser} action={(user) => <button className="btn btn-danger" onClick={() => remove(user.id)}><Trash2 size={16} /> Remove</button>} />)}</div>}
 </>
 );
}

export function NotificationsPage() {
 const { items, loading, reload, data } = useApiList("/notifications");
 const navigate = useNavigate();

 const markAll = async () => {
 try {
 await api.patch("/notifications/read-all");
 toast.success("Marked read");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 const markOne = async (notifId) => {
 try {
 await api.patch(`/notifications/${notifId}/read`);
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 const handleMatchAction = async (matchId, action, notifId) => {
 try {
 await api.patch(`/matches/${matchId}/${action}`);
 toast.success(`Match request ${action}ed`);
 await markOne(notifId);
 if (action === "accept") {
 navigate(`/sessions?matchId=${matchId}`);
 }
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 const handleNotifClick = (item) => {
 if (!item.isRead) markOne(item.id);
 if (item.type === "NEW_MESSAGE" && item.entityId) navigate(`/chat/${item.entityId}`);
 else if (item.type === "SESSION_SCHEDULED") navigate("/sessions");
 else if (item.type?.startsWith("MATCH_")) navigate("/matches");
 };

 return (
 <>
 <PageHeader title="Notifications" eyebrow={`${data?.unreadCount || 0} unread`} action={<button className="btn btn-secondary" onClick={markAll}><Check size={16} /> Mark all read</button>} />
 {loading ? <LoadingState /> : (
 <div className="grid gap-2">
 {items.length ? items.map((item) => {
 const Icon = getNotifIcon(item.type);
 return (
 <div key={item.id} className={`notif-card notif-item ${item.isRead ? "notif-card-read" : ""}`} onClick={() => handleNotifClick(item)}>
 <div className="flex items-start gap-3">
 <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
 <Icon size={18} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p className="text-sm font-bold text-gray-900">{item.title}</p>
 <span className="text-[10px] text-gray-500 whitespace-nowrap">{timeAgo(item.createdAt)}</span>
 </div>
 <p className="text-xs text-gray-600 mt-1">{item.message}</p>
 {item.type === "MATCH_REQUEST" && !item.isRead && item.entityId && (
 <div className="flex gap-2 mt-2">
 <button className="btn btn-primary text-xs px-3 py-1" onClick={(e) => { e.stopPropagation(); handleMatchAction(item.entityId, "accept", item.id); }}>
 <Check size={12} /> Accept
 </button>
 <button className="btn btn-secondary text-xs px-3 py-1" onClick={(e) => { e.stopPropagation(); handleMatchAction(item.entityId, "reject", item.id); }}>
 <X size={12} /> Reject
 </button>
 </div>
 )}
 </div>
 {!item.isRead && <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500 shadow-glow" />}
 </div>
 </div>
 );
 }) : <EmptyState title="All caught up" description="You have no notifications." />}
 </div>
 )}
 </>
 );
}

export function ProfilePage() {
 const { user: currentUser } = useSelector(selectAuth);
 const [searchParams] = useSearchParams();
 const id = searchParams.get("id");
 const isMe = !id || id === currentUser?.id;
 
 const [profile, setProfile] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let active = true;
 const fetchId = isMe ? currentUser?.id : id;
 if (fetchId) {
 setLoading(true);
 api.get(`/users/${fetchId}`)
 .then(res => {
 if (active) setProfile(unwrap(res));
 })
 .catch(err => {
 if (active) toast.error(getErrorMessage(err));
 })
 .finally(() => {
 if (active) setLoading(false);
 });
 }

 return () => { active = false; };
 }, [id, isMe, currentUser?.id]);

 if (loading) return <LoadingState />;
 if (!profile) return (
 <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-100 bg-slate-50 border border-slate-200/80">
 <h3 className="font-display text-lg font-bold text-gray-900">User not found</h3>
 <p className="text-sm text-gray-600">The profile you are looking for does not exist.</p>
 </div>
 );

 return (
 <>
 <PageHeader 
 title="Profile" 
 eyebrow={profile.username} 
 action={
 isMe 
 ? <Link className="btn btn-primary" to="/profile/edit">Edit profile</Link>
 : (
 <div className="flex gap-2">
 <Link className="btn btn-secondary" to={`/barter/new?userId=${profile.id}`}><Send size={16} /> Request</Link>
 <a className="btn btn-primary" href="#book"><Calendar className="mr-1" size={16} /> Book Session</a>
 </div>
 )
 } 
 />
 <section className="card mb-6 border border-indigo-50 border border-indigo-100">
 <div className="flex flex-col gap-6 md:flex-row items-start">
 <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-indigo-50 text-4xl font-bold text-indigo-600 border border-indigo-100 shadow-glow">
 {profile.profileImage ? <img className="h-full w-full rounded-xl object-cover" src={profile.profileImage} alt="" /> : profile.name?.charAt(0)}
 </div>
 <div className="flex-1 text-center md:text-left">
 <h2 className="font-display text-3xl font-bold text-gray-900 ">{profile.name}</h2>
 <p className="mt-2 text-gray-600 max-w-2xl">{profile.bio || `${profile.name} is active on SkillSwap and open to peer learning sessions.`}</p>
 <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
 <span className="pill font-medium border-indigo-100 text-indigo-600">{profile.college}</span>
 <span className="pill font-medium border-indigo-100 text-indigo-600">{profile.department}</span>
 <span className="pill font-medium border-indigo-100 text-indigo-600">Semester {profile.semester}</span>
 {profile.averageRating > 0 && <span className="pill font-bold bg-amber-500/10 text-amber-500 border-amber-500/20"><Star size={12} className="inline mr-1" fill="currentColor" />Rating {profile.averageRating}</span>}
 </div>
 </div>
 </div>
 </section>

 <div id="book" className="mb-6">
 {isMe ? (
 <AvailabilityManager />
 ) : (
 <AvailableSlots userId={profile.id} userName={profile.name} />
 )}
 </div>

 <div className="grid gap-6 md:grid-cols-2 items-start">
 <section className="card border border-indigo-50 border border-indigo-100">
 <h3 className="font-display text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
 <Star className="text-indigo-600" size={20} fill="currentColor" /> Skills Offered
 </h3>
 <div className="grid gap-4">
 {profile.offeredSkills?.length ? profile.offeredSkills.map(s => (
 <div key={s.id} className="p-4 bg-slate-50 border border-indigo-50 border border-indigo-100 rounded-xl shadow-sm transition hover:border-indigo-200">
 <div className="flex justify-between items-start gap-3">
 <div>
 <p className="font-bold text-gray-900">{s.skill.name}</p>
 <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider font-bold mt-1">{s.skill.category}</p>
 </div>
 <span className="pill text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 border-indigo-100">{s.level}</span>
 </div>
 <p className="text-sm text-gray-600 mt-3 leading-relaxed">{s.skill.description}</p>
 </div>
 )) : <p className="text-sm text-gray-500 italic">No skills offered yet.</p>}
 </div>
 </section>

 <section className="card border border-sky-500/10">
 <h3 className="font-display text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
 <BookOpen className="text-sky-400" size={20} /> Learning Goals
 </h3>
 <div className="grid gap-4">
 {profile.learningSkills?.length ? profile.learningSkills.map(s => (
 <div key={s.id} className="p-4 bg-slate-50 border border-sky-500/10 rounded-xl shadow-sm transition hover:border-sky-500/30">
 <div className="flex justify-between items-start gap-3">
 <div>
 <p className="font-bold text-gray-900">{s.skill.name}</p>
 <p className="text-xs text-sky-400/70 uppercase tracking-wider font-bold mt-1">{s.skill.category}</p>
 </div>
 </div>
 <div className="mt-3 grid gap-2">
 <p className="text-sm text-gray-600 leading-relaxed"><span className="text-gray-700 font-semibold">About:</span> {s.skill.description}</p>
 {s.goal && <p className="text-sm text-gray-600 leading-relaxed"><span className="text-gray-700 font-semibold">Goal:</span> {s.goal}</p>}
 </div>
 </div>
 )) : <p className="text-sm text-gray-500 italic">No learning goals added yet.</p>}
 </div>
 </section>
 </div>
 </>
 );
}

export function ProfileEditPage() {
 const { user } = useSelector(selectAuth);
 const dispatch = useDispatch();
 const navigate = useNavigate();
 const [form, setForm] = useState({
 name: user?.name || "",
 bio: user?.bio || "",
 college: user?.college || "",
 department: user?.department || "",
 semester: user?.semester || "",
 timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
 });
 const [file, setFile] = useState(null);
 const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

 const submit = async (event) => {
 event.preventDefault();
 const formData = new FormData();
 Object.entries(form).forEach(([key, value]) => formData.append(key, value));
 if (file) formData.append("profileImage", file);

 try {
 await api.patch("/users/me/profile", formData);
 await dispatch(fetchCurrentUser());
 toast.success("Profile updated");
 navigate("/profile");
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Edit Profile" eyebrow="Account" />
 <form className="card grid max-w-2xl gap-4" onSubmit={submit}>
 <Field label="Name" name="name" value={form.name} onChange={update} />
 <TextArea label="Bio" name="bio" value={form.bio} onChange={update} />
 <div className="grid gap-4 sm:grid-cols-2">
 <Field label="College" name="college" value={form.college} onChange={update} />
 <Field label="Department" name="department" value={form.department} onChange={update} />
 </div>
 <div className="grid gap-4 sm:grid-cols-2">
 <Field label="Semester" name="semester" value={form.semester} onChange={update} />
 <TimezoneSelector value={form.timezone} onChange={(tz) => setForm((c) => ({ ...c, timezone: tz }))} />
 </div>
 <label className="grid gap-1.5">
 <span className="label">Profile image</span>
 <input className="input" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
 </label>
 <button className="btn btn-primary w-fit">Save changes</button>
 </form>
 </>
 );
}

export function ReportsPage() {
 const { items, loading, reload } = useApiList("/reports");
 const [form, setForm] = useState({ reportedUserId: "", reason: "Spam", description: "" });
 const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

 const submit = async (event) => {
 event.preventDefault();
 try {
 await api.post("/reports", form);
 toast.success("Report submitted");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Reports" eyebrow="Safety" />
 <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
 <form className="card grid gap-4" onSubmit={submit}>
 <Field label="Reported user ID" name="reportedUserId" value={form.reportedUserId} onChange={update} required />
 <SelectField label="Reason" name="reason" value={form.reason} onChange={update} options={reportReasons} />
 <TextArea label="Description" name="description" value={form.description} onChange={update} required />
 <button className="btn btn-danger"><ShieldAlert size={16} /> Submit report</button>
 </form>
 {loading ? <LoadingState /> : <div className="grid gap-4">{items.map((report) => <article className="card" key={report.id}><p className="font-bold text-slate-900 dark:text-gray-900">{report.reason}</p><p className="text-sm text-slate-500">{report.description}</p><span className="pill mt-3">{report.status}</span></article>)}</div>}
 </div>
 </>
 );
}

export function AdminUsersPage({ dashboard = false }) {
 const dashboardData = useApiList("/admin/dashboard");
 const users = useApiList("/admin/users");

 const status = async (id, next) => {
 try {
 await api.patch(`/admin/users/${id}/status`, { status: next });
 toast.success("User updated");
 users.reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 return (
 <>
 <PageHeader title="Admin Users" eyebrow="Admin" />
 {dashboard ? <AdminStats data={dashboardData.data} /> : null}
 {users.loading ? <LoadingState /> : <div className="grid gap-4">{users.items.map((user) => <UserCard key={user.id} user={user} action={(item) => <div className="flex gap-2"><button className="btn btn-secondary" onClick={() => status(item.id, "ACTIVE")}>Activate</button><button className="btn btn-danger" onClick={() => status(item.id, "BANNED")}>Ban</button></div>} />)}</div>}
 </>
 );
}

function AdminStats({ data }) {
 if (!data) return null;
 return (
 <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
 <StatCard label="Users" value={data.totalUsers} icon={UserRound} />
 <StatCard label="Skills" value={data.totalSkills} icon={Star} />
 <StatCard label="Matches" value={data.totalMatches} icon={Check} />
 <StatCard label="Sessions" value={data.totalSessions} icon={CalendarPlus} />
 <StatCard label="Pending reports" value={data.reportsPending} icon={ShieldAlert} />
 </div>
 );
}

export function AdminSkillsPage() {
 const { items, loading, reload } = useApiList("/admin/skills");
 const remove = async (id) => {
 try {
 await api.delete(`/admin/skills/${id}`);
 toast.success("Skill removed");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };
 return (
 <>
 <PageHeader title="Admin Skills" eyebrow="Admin" />
 {loading ? <LoadingState /> : <div className="grid gap-4 md:grid-cols-2">{items.map((skill) => <SkillCard key={skill.id} item={skill} action={(item) => <button className="btn btn-danger" onClick={() => remove(item.id)}><Trash2 size={16} /> Delete</button>} />)}</div>}
 </>
 );
}

export function AdminReportsPage() {
 const { items, loading, reload } = useApiList("/admin/reports");
 const update = async (id, status) => {
 try {
 await api.patch(`/admin/reports/${id}/status`, { status });
 toast.success("Report updated");
 reload();
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };
 return (
 <>
 <PageHeader title="Admin Reports" eyebrow="Admin" />
 {loading ? <LoadingState /> : <div className="grid gap-4">{items.map((report) => <article className="card" key={report.id}><div className="flex justify-between gap-3"><p className="font-bold text-slate-900 dark:text-gray-900">{report.reason}</p><span className="pill">{report.status}</span></div><p className="mt-2 text-sm text-slate-500">{report.description}</p><div className="mt-4 flex gap-2"><button className="btn btn-primary" onClick={() => update(report.id, "RESOLVED")}>Resolve</button><button className="btn btn-secondary" onClick={() => update(report.id, "REJECTED")}>Reject</button></div></article>)}</div>}
 </>
 );
}

export { BarterDetailPage } from "./BarterDetailPage";
