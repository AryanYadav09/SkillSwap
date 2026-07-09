import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Bookmark,
  CalendarPlus,
  Check,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { fetchCurrentUser, login, register, selectAuth } from "../features/auth/authSlice";
import { api, getErrorMessage, unwrap } from "../services/api";
import { getSocket } from "../services/socket";

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
          <div className="mb-3 h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
      <p className="sr-only">{label}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="card py-10 text-center">
      <p className="font-display text-xl font-bold text-ink dark:text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted dark:text-slate-400">{description}</p>
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
      <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
      <div className="mt-6">{children}</div>
      {footer ? <p className="mt-5 text-sm text-muted">{footer}</p> : null}
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
      navigate("/dashboard", { replace: true });
    } else {
      toast.error(result.payload || "Login failed");
    }
  };

  return (
    <AuthFormShell
      title="Login"
      footer={
        <>
          New here?{" "}
          <Link className="font-bold text-forest" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Email" name="email" type="email" value={form.email} onChange={update} required />
        <Field label="Password" name="password" type="password" value={form.password} onChange={update} required />
        <button className="btn btn-primary" disabled={status === "loading"}>
          Login
        </button>
        <Link className="text-sm font-bold text-sky" to="/forgot-password">
          Forgot password?
        </Link>
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
        <div className="rounded-lg border border-line bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Skill you can teach</h2>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Skill name" name="offeredSkillName" value={form.offeredSkillName} onChange={update} placeholder="React" required />
              <Field label="Category" name="offeredSkillCategory" value={form.offeredSkillCategory} onChange={update} placeholder="Frontend" required />
            </div>
            <TextArea label="What can you teach?" name="offeredSkillDescription" value={form.offeredSkillDescription} onChange={update} placeholder="I can teach components, hooks, and project structure." required />
            <SelectField label="Your level" name="offeredSkillLevel" value={form.offeredSkillLevel} onChange={update} options={levels} required />
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Skill you want to learn</h2>
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
        <p className="text-sm font-bold text-muted dark:text-slate-400">{label}</p>
        <Icon className="text-forest" size={18} />
      </div>
      <p className="mt-3 text-3xl font-extrabold text-ink dark:text-white">{value ?? 0}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data, loading, reload } = useApiList("/dashboard");
  const stats = data?.statistics || {};

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
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Offered" value={stats.totalSkillsOffered} icon={Star} />
            <StatCard label="Learning" value={stats.totalLearningSkills} icon={UserRound} />
            <StatCard label="Matches" value={stats.activeMatches} icon={Check} />
            <StatCard label="Sessions" value={stats.sessionsScheduled} icon={CalendarPlus} />
            <StatCard label="Rating" value={stats.averageRating} icon={Star} />
          </div>

          <MatchToggleSection
            teachableStudents={data?.teachableStudents || []}
            learnableTeachers={data?.learnableTeachers || []}
          />
          <div className="grid gap-6 xl:grid-cols-3">
            <SimplePanel title="Recent match requests" items={data?.recentMatchRequests} render={(item) => `${item.sender?.name} -> ${item.receiver?.name} (${item.status})`} />
            <SimplePanel title="Upcoming sessions" items={data?.upcomingSessions} render={(item) => `${item.title} - ${formatDate(item.sessionDate)}`} />
            <SimplePanel title="Notifications" items={data?.notifications} render={(item) => item.title} />
          </div>
        </div>
      )}
    </>
  );
}

function DashboardSkillSection({ title, items, emptyTitle, emptyDescription }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-bold text-ink dark:text-white">{title}</h2>
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
    <section>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-bold text-ink dark:text-white">Discover Students</h2>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900">
          <button
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-all duration-200 ${
              activeTab === "teaching"
                ? "bg-forest text-white shadow-sm"
                : "text-muted hover:text-ink dark:hover:text-white"
            }`}
            onClick={() => setActiveTab("teaching")}
          >
            <GraduationCap size={16} />
            I Can Teach
          </button>
          <button
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-all duration-200 ${
              activeTab === "learning"
                ? "bg-sky text-white shadow-sm"
                : "text-muted hover:text-ink dark:hover:text-white"
            }`}
            onClick={() => setActiveTab("learning")}
          >
            <BookOpen size={16} />
            I Can Learn From
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-muted dark:text-slate-400">
        {activeTab === "teaching"
          ? "These students want to learn skills you can teach."
          : "These students can teach you skills you want to learn."}
      </p>
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
  const isTeaching = variant === "teaching";

  return (
    <article className="card">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md font-bold ${
          isTeaching ? "bg-forest/10 text-forest" : "bg-sky/10 text-sky"
        }`}>
          {user.profileImage ? <img className="h-full w-full rounded-md object-cover" src={user.profileImage} alt="" /> : user.name?.charAt(0)}
        </div>
        <div className="min-w-0">
          <Link to={`/profile?id=${user.id}`} className="truncate font-bold text-ink hover:text-forest dark:text-white">{user.name}</Link>
          <p className="truncate text-sm text-muted">{user.college}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <p className="rounded-md bg-slate-50 p-2 dark:bg-slate-950">
          <span className="font-bold text-forest">Teaches:</span> {teaches}
        </p>
        <p className="rounded-md bg-slate-50 p-2 dark:bg-slate-950">
          <span className="font-bold text-coral">Wants:</span> {wants}
        </p>
      </div>
      {user.averageRating ? (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
          <Star size={12} fill="currentColor" />
          <span className="font-bold">{user.averageRating}</span>
        </div>
      ) : null}
      <Link className={`btn mt-4 w-full ${isTeaching ? "btn-primary" : "btn-secondary"}`} to="/matches">
        <Send size={16} />
        Send request
      </Link>
    </article>
  );
}

function SimplePanel({ title, items = [], render }) {
  return (
    <section className="card">
      <h2 className="font-display text-xl font-bold text-ink dark:text-white">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <p key={item.id} className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-300">
              {render(item)}
            </p>
          ))
        ) : (
          <p className="text-sm text-muted">No items yet.</p>
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
          <Link to={`/profile?id=${user.id}`} className="font-bold text-ink hover:text-forest dark:text-white">
            {user.name}
          </Link>
          <p className="truncate text-sm text-muted">{user.college}</p>
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
          <h3 className="font-bold text-ink dark:text-white">{skill.name}</h3>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">{skill.description}</p>
        </div>
        <span className="pill">{skill.category}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.level ? <span className="pill">{item.level}</span> : null}
        {item.currentLevel ? <span className="pill">{item.currentLevel}</span> : null}
        {item.goal ? <span className="pill">Goal added</span> : null}
      </div>
      {item.user ? <p className="mt-3 text-sm font-semibold text-muted">By {item.user.name}</p> : null}
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
  const { items, loading, reload } = useApiList("/users", { search: query, excludeSelf: true });

  const bookmark = async (userId) => {
    try {
      await api.post(`/bookmarks/${userId}`);
      toast.success("Saved user");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader title="Search" eyebrow="Discover" />
      <div className="mb-5 flex gap-2">
        <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, skills, or colleges" />
        <button className="btn btn-primary" onClick={reload}>
          <Search size={16} />
          Search
        </button>
      </div>
      {loading ? <LoadingState /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((user) => <UserCard key={user.id} user={user} action={(candidate) => <button className="btn btn-secondary" onClick={() => bookmark(candidate.id)}><Bookmark size={16} /> Save</button>} />)}</div>}
    </>
  );
}

export function MatchesPage() {
  const compatible = useApiList("/matches/compatible");
  const requests = useApiList("/matches");

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
      requests.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader title="Matches" eyebrow="Compatible swaps" />
      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-xl font-bold text-ink dark:text-white">Compatible students</h2>
          {compatible.loading ? <LoadingState /> : <div className="grid gap-4">{compatible.items.map((user) => <UserCard key={user.id} user={user} action={(candidate) => <button className="btn btn-primary" onClick={() => sendRequest(candidate.id)}><Send size={16} /> Request</button>} />)}</div>}
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-bold text-ink dark:text-white">Requests</h2>
          {requests.loading ? <LoadingState /> : <div className="grid gap-4">{requests.items.map((request) => <MatchRequestCard key={request.id} request={request} onStatus={changeStatus} />)}</div>}
        </section>
      </div>
    </>
  );
}

function MatchRequestCard({ request, onStatus }) {
  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink dark:text-white">
            {request.sender?.name} {"->"} {request.receiver?.name}
          </p>
          <p className="mt-1 text-sm text-muted">{request.message || "No message"}</p>
        </div>
        <span className="pill">{request.status}</span>
      </div>
      {request.status === "PENDING" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => onStatus(request.id, "accept")}><Check size={16} /> Accept</button>
          <button className="btn btn-secondary" onClick={() => onStatus(request.id, "reject")}><X size={16} /> Reject</button>
          <button className="btn btn-danger" onClick={() => onStatus(request.id, "cancel")}><Trash2 size={16} /> Cancel</button>
        </div>
      ) : request.status === "ACCEPTED" ? (
        <button className="btn btn-secondary mt-4" onClick={() => onStatus(request.id, "complete")}><Check size={16} /> Complete</button>
      ) : null}
    </article>
  );
}

export function ChatsPage() {
  const { items, loading } = useApiList("/chats");

  return (
    <>
      <PageHeader title="Chats" eyebrow="Messages" />
      {loading ? <LoadingState /> : items.length ? <div className="grid gap-3">{items.map((chat) => <Link className="card block hover:border-forest" key={chat.id} to={`/chat/${chat.id}`}><p className="font-bold text-ink dark:text-white">{chat.otherParticipant?.name}</p><p className="mt-1 text-sm text-muted">{chat.lastMessage?.message || "Open conversation"}</p></Link>)}</div> : <EmptyState title="No chats yet" description="Accepted matches create chats automatically." />}
    </>
  );
}

export function ChatDetailPage() {
  const { id } = useParams();
  const { accessToken } = useSelector(selectAuth);
  const [payload, setPayload] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadChat = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/chats/${id}`);
      setPayload(unwrap(response));
      await api.patch(`/messages/${id}/seen`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return undefined;

    const handler = (event) => {
      if (event.chatId === id) {
        setPayload((current) => current ? { ...current, messages: { ...current.messages, items: [...(current.messages?.items || []), event.message] } } : current);
      }
    };

    socket.on("chat:message", handler);
    return () => socket.off("chat:message", handler);
  }, [accessToken, id]);

  const submit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    try {
      const response = await api.post("/messages", { chatId: id, message });
      setPayload((current) => current ? { ...current, messages: { ...current.messages, items: [...(current.messages?.items || []), unwrap(response)] } } : current);
      setMessage("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader
        title={payload?.chat?.otherParticipant?.name || "Chat"}
        eyebrow="Conversation"
        action={
          payload?.chat?.otherParticipant ? (
            <Link
              className="btn btn-secondary"
              to={`/meeting/chat-${id}?target=${payload.chat.otherParticipant.id}&name=${encodeURIComponent(payload.chat.otherParticipant.name)}&role=caller`}
            >
              <Video size={16} />
              Video Call
            </Link>
          ) : null
        }
      />
      <section className="card flex min-h-[70vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {(payload?.messages?.items || []).map((item) => (
            <div key={item.id} className="max-w-2xl rounded-md bg-slate-50 p-3 dark:bg-slate-950">
              <p className="text-xs font-bold text-muted">{item.sender?.name}</p>
              <p className="mt-1 text-sm text-ink dark:text-white">{item.message}</p>
            </div>
          ))}
        </div>
        <form className="mt-4 flex gap-2 border-t border-line pt-4 dark:border-slate-800" onSubmit={submit}>
          <input className="input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a message" />
          <button className="btn btn-primary"><Send size={16} /> Send</button>
        </form>
      </section>
    </>
  );
}

export function SessionsPage() {
  const { items, loading, reload } = useApiList("/sessions");
  const [form, setForm] = useState({ matchRequestId: "", title: "", description: "", sessionDate: "", duration: 60 });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const create = async (event) => {
    event.preventDefault();
    try {
      await api.post("/sessions", { ...form, sessionDate: new Date(form.sessionDate).toISOString(), duration: Number(form.duration) });
      toast.success("Session created");
      reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const status = async (id, next) => {
    try {
      await api.patch(`/sessions/${id}/${next}`);
      toast.success("Session updated");
      reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader title="Sessions" eyebrow="Schedule" />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form className="card grid gap-4" onSubmit={create}>
          <Field label="Accepted match request ID" name="matchRequestId" value={form.matchRequestId} onChange={update} required />
          <Field label="Title" name="title" value={form.title} onChange={update} required />
          <TextArea label="Description" name="description" value={form.description} onChange={update} required />
          <Field label="Date and time" name="sessionDate" type="datetime-local" value={form.sessionDate} onChange={update} required />
          <Field label="Duration minutes" name="duration" type="number" value={form.duration} onChange={update} required />
          <button className="btn btn-primary"><CalendarPlus size={16} /> Create session</button>
        </form>
        {loading ? <LoadingState /> : <div className="grid gap-4">{items.map((session) => { const otherUser = session.matchRequest?.sender?.id === session.createdBy?.id ? session.matchRequest?.receiver : session.matchRequest?.sender; return (<article className="card" key={session.id}><div className="flex justify-between gap-3"><div><p className="font-bold text-ink dark:text-white">{session.title}</p><p className="text-sm text-muted">{formatDate(session.sessionDate)}</p></div><span className="pill">{session.status}</span></div><p className="mt-3 text-sm text-muted">{session.description}</p><div className="mt-4 flex flex-wrap gap-2">{session.status === "SCHEDULED" ? (<Link className="btn btn-primary" to={`/meeting/${session.id}?target=${otherUser?.id}&name=${encodeURIComponent(otherUser?.name || "Participant")}&role=caller`}><Video size={16} /> Start Meeting</Link>) : null}<button className="btn btn-secondary" onClick={() => status(session.id, "complete")}>Complete</button><button className="btn btn-danger" onClick={() => status(session.id, "cancel")}>Cancel</button></div></article>); })}</div>}
      </div>
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
        {loading ? <LoadingState /> : <div className="grid gap-4">{items.map((review) => <article className="card" key={review.id}><p className="font-bold text-ink dark:text-white">{review.rating}/5 for {review.reviewedUser?.name}</p><p className="mt-2 text-sm text-muted">{review.comment}</p></article>)}</div>}
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
  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      toast.success("Marked read");
      reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader title="Notifications" eyebrow={`${data?.unreadCount || 0} unread`} action={<button className="btn btn-secondary" onClick={markAll}><Check size={16} /> Mark all read</button>} />
      {loading ? <LoadingState /> : <div className="grid gap-3">{items.map((item) => <article className="card" key={item.id}><div className="flex items-start gap-3"><Bell className="text-forest" size={18} /><div><p className="font-bold text-ink dark:text-white">{item.title}</p><p className="text-sm text-muted">{item.message}</p></div></div></article>)}</div>}
    </>
  );
}

export function ProfilePage() {
  const { user } = useSelector(selectAuth);

  return (
    <>
      <PageHeader title="Profile" eyebrow={user?.username} action={<Link className="btn btn-primary" to="/profile/edit">Edit profile</Link>} />
      <section className="card">
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="grid h-24 w-24 place-items-center rounded-md bg-forest/10 text-3xl font-bold text-forest">
            {user?.profileImage ? <img className="h-full w-full rounded-md object-cover" src={user.profileImage} alt="" /> : user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-ink dark:text-white">{user?.name}</h2>
            <p className="mt-1 text-muted">{user?.bio || "No bio added yet."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="pill">{user?.college}</span>
              <span className="pill">{user?.department}</span>
              <span className="pill">Semester {user?.semester}</span>
              <span className="pill">Rating {user?.averageRating || 0}</span>
            </div>
          </div>
        </div>
      </section>
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
        <Field label="Semester" name="semester" value={form.semester} onChange={update} />
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
        {loading ? <LoadingState /> : <div className="grid gap-4">{items.map((report) => <article className="card" key={report.id}><p className="font-bold text-ink dark:text-white">{report.reason}</p><p className="text-sm text-muted">{report.description}</p><span className="pill mt-3">{report.status}</span></article>)}</div>}
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
      {loading ? <LoadingState /> : <div className="grid gap-4">{items.map((report) => <article className="card" key={report.id}><div className="flex justify-between gap-3"><p className="font-bold text-ink dark:text-white">{report.reason}</p><span className="pill">{report.status}</span></div><p className="mt-2 text-sm text-muted">{report.description}</p><div className="mt-4 flex gap-2"><button className="btn btn-primary" onClick={() => update(report.id, "RESOLVED")}>Resolve</button><button className="btn btn-secondary" onClick={() => update(report.id, "REJECTED")}>Reject</button></div></article>)}</div>}
    </>
  );
}
