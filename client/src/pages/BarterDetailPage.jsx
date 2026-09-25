import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Check, X, Trash2, Send, ArrowLeft, UserRound, Sparkles, School, ShieldCheck } from "lucide-react";
import { api, getErrorMessage, unwrap } from "../services/api";
import { selectAuth } from "../features/auth/authSlice";

export function BarterDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const newUserId = searchParams.get("userId");
  const isNew = id === "new" && newUserId;

  const { user: currentUser } = useSelector(selectAuth);
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (isNew) {
      api.get(`/users/${newUserId}`)
        .then((res) => {
          if (active) setData({ receiver: unwrap(res) });
        })
        .catch((err) => {
          if (active) toast.error(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      api.get("/matches")
        .then((res) => {
          if (active) {
            const items = unwrap(res)?.items || [];
            const matchReq = items.find((m) => m.id === id);
            if (matchReq) {
              setData(matchReq);
              setDescription(matchReq.description || matchReq.message || "");
            } else {
              toast.error("Match request not found");
              navigate("/matches");
            }
          }
        })
        .catch((err) => {
          if (active) toast.error(getErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => { active = false; };
  }, [id, isNew, newUserId, navigate]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please add a description");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/matches", { 
        receiverId: newUserId, 
        message: "I want to exchange skills with you.", 
        description: description 
      });
      toast.success("Barter request sent successfully!");
      navigate("/matches");
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  const changeStatus = async (status) => {
    setSubmitting(true);
    try {
      await api.patch(`/matches/${id}/${status}`);
      toast.success(`Match request ${status}ed`);
      navigate("/matches");
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-5xl mx-auto py-10">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-44 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const targetUser = isNew ? data.receiver : (data.senderId === currentUser.id ? data.receiver : data.sender);
  const isReceiver = !isNew && data.receiverId === currentUser.id;
  const targetTeaches = targetUser?.offeredSkills || [];
  const targetWants = targetUser?.learningSkills || [];
  const myTeaches = currentUser?.offeredSkills || [];
  const myWants = currentUser?.learningSkills || [];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/matches" className="hover:text-indigo-600 transition flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">swap_horiz</span>
          <span>Barter Hub</span>
        </Link>
        <span>/</span>
        <span>Proposals</span>
        <span>/</span>
        <span className="text-indigo-600">{isNew ? "New Proposal" : `SW-${id?.substring(0, 8)}`}</span>
      </nav>

      {/* Top Bilateral Summary Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200/90">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-24 w-72 h-72 rounded-full bg-cyan-400/5 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-slate-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                Barter Proposal #{isNew ? "DRAFT" : id?.substring(0, 8).toUpperCase()}
              </span>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                data.status === "ACCEPTED" 
                  ? "bg-emerald-50 text-emerald-700" 
                  : "bg-amber-50 text-amber-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${data.status === "ACCEPTED" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></span>
                {isNew ? "Drafting Proposal" : (data.status || "Pending Mutual Agreement")}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              {currentUser?.name?.split(" ")[0]} <span className="text-slate-400 font-normal">×</span> {targetUser?.name}
            </h1>
            <p className="text-sm text-slate-500">
              Cross-department bilateral skill transfer: Reciprocal 1-on-1 knowledge exchange.
            </p>
          </div>

          {/* Fit Percentage Ring */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl self-start lg:self-auto">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 64 64">
                <circle className="text-slate-200" cx="32" cy="32" fill="none" r="28" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-emerald-500 stroke-round" cx="32" cy="32" fill="none" r="28" stroke="currentColor" strokeDasharray="175.9" strokeDashoffset="12" strokeWidth="4.5"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-emerald-700 leading-none">96%</span>
                <span className="text-[9px] uppercase tracking-tight text-emerald-600 font-bold">Fit</span>
              </div>
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-xs font-bold text-slate-900">Mutual Fit</span>
              <span className="text-[11px] text-slate-500">Symmetric syllabus match & zero credit deficit</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Bilateral Exchange Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: You */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/90 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base ring-2 ring-indigo-200">
                    {currentUser?.name?.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-slate-900 truncate">{currentUser?.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">You</span>
                  </div>
                  <span className="text-xs text-slate-500 truncate">{currentUser?.department || "Student Member"}</span>
                  <span className="text-xs text-indigo-600 font-semibold">{currentUser?.college || "Campus Peer Network"}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                Verified Mentor
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles size={14} className="text-indigo-600" />
                What You Offer
              </span>
              <div className="flex flex-wrap gap-2">
                {myTeaches.length > 0 ? (
                  myTeaches.map((s, i) => (
                    <div key={i} className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                      {s.skill?.name || s.name} ({s.level || "Proficient"})
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No skills listed yet</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <School size={14} className="text-cyan-700" />
                What You Seek to Learn
              </span>
              <div className="flex flex-wrap gap-2">
                {myWants.length > 0 ? (
                  myWants.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-800 text-xs font-bold">
                      {s.skill?.name || s.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No learning goals listed</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck size={14} /> Verified Member
            </span>
            <span className="text-indigo-600 font-bold">Attendance: 100%</span>
          </div>
        </div>

        {/* Center: Exchange Hub Bridge */}
        <div className="lg:col-span-2 flex flex-col justify-center items-center gap-3">
          <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-200/90 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-2xl">sync_alt</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-900">1:1 Barter</span>
              <span className="text-xs font-bold text-emerald-600">Zero Cash Balance</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Reciprocal knowledge equity verified by campus peer network.
            </p>
            <div className="w-full py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase text-indigo-700 tracking-wider">
              Escrow Guarded
            </div>
          </div>
        </div>

        {/* Right Side: Partner */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/90 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-600"></div>
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center text-base ring-2 ring-cyan-200">
                    {targetUser?.profileImage ? (
                      <img src={targetUser.profileImage} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      targetUser?.name?.charAt(0) || <UserRound size={20} />
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-slate-900 truncate">{targetUser?.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 text-[10px] font-bold">Partner</span>
                  </div>
                  <span className="text-xs text-slate-500 truncate">{targetUser?.department || "Student Member"}</span>
                  <span className="text-xs text-cyan-700 font-semibold">{targetUser?.college || "Campus Peer Network"}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold">
                Level 3 Peer
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles size={14} className="text-cyan-600" />
                They Offer
              </span>
              <div className="flex flex-wrap gap-2">
                {targetTeaches.length > 0 ? (
                  targetTeaches.map((s, i) => (
                    <div key={i} className="px-3 py-1 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-800 text-xs font-bold">
                      {s.skill?.name || s.name} ({s.level || "Proficient"})
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No offered skills listed</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <School size={14} className="text-indigo-600" />
                They Seek to Learn
              </span>
              <div className="flex flex-wrap gap-2">
                {targetWants.length > 0 ? (
                  targetWants.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                      {s.skill?.name || s.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No learning goals listed</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck size={14} /> Identity Verified
            </span>
            <span className="text-cyan-700 font-bold">Peer Endorsements: 44</span>
          </div>
        </div>
      </div>

      {/* Proposal Details & Action Form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/90">
        <h2 className="text-lg font-bold text-slate-900 mb-3 font-display">
          {isNew ? "Barter Proposal Scope & Objectives" : "Barter Agreement Synopsis"}
        </h2>

        {isNew ? (
          <form onSubmit={handleSendRequest} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Describe syllabus modules, scheduling preference, and mutual milestones
              </span>
              <textarea
                className="input w-full min-h-[140px] resize-y"
                placeholder="E.g. I propose 4 sessions of React 19 architecture in return for 4 sessions of Figma design tokens and component variants..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <Send size={15} /> Send Barter Proposal
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 min-h-[90px] text-sm text-slate-700 whitespace-pre-wrap">
              {description || "No specific barter proposal description was submitted."}
            </div>

            {data.status === "PENDING" && isReceiver && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="btn btn-primary"
                  onClick={() => changeStatus("accept")}
                  disabled={submitting}
                >
                  <Check size={16} /> Accept Barter Agreement
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => changeStatus("reject")}
                  disabled={submitting}
                >
                  <X size={16} /> Decline
                </button>
              </div>
            )}
            {data.status === "PENDING" && !isReceiver && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="btn btn-danger"
                  onClick={() => changeStatus("cancel")}
                  disabled={submitting}
                >
                  <Trash2 size={16} /> Retract Proposal
                </button>
              </div>
            )}
            {data.status === "ACCEPTED" && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/meetings" className="btn btn-primary">
                  <span className="material-symbols-outlined text-sm">calendar_month</span> Schedule Exchange Session
                </Link>
                <button
                  className="btn btn-secondary"
                  onClick={() => changeStatus("complete")}
                  disabled={submitting}
                >
                  <Check size={16} /> Mark Completed
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
