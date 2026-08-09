import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Check, X, Trash2, Send, ArrowLeft, UserRound } from "lucide-react";
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
      // Fetch user profile to show who we are requesting
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
      // Fetch existing match request details
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
      <div className="animate-pulse space-y-4 max-w-2xl mx-auto py-10">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="h-64 bg-slate-800 rounded w-full"></div>
      </div>
    );
  }

  if (!data) return null;

  const targetUser = isNew ? data.receiver : (data.senderId === currentUser.id ? data.receiver : data.sender);
  const isReceiver = !isNew && data.receiverId === currentUser.id;
  const teaches = targetUser?.offeredSkills?.map((s) => s.skill.name).join(", ") || "No offered skills";
  const wants = targetUser?.learningSkills?.map((s) => s.skill.name).join(", ") || "No learning skills";

  return (
    <div className="max-w-3xl mx-auto py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-gold-400 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card mb-6 border border-gold-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-gold-600/10 text-3xl font-bold text-gold-400 border border-gold-500/20 shadow-glow">
            {targetUser?.profileImage ? (
              <img className="h-full w-full rounded-xl object-cover" src={targetUser.profileImage} alt="" />
            ) : (
              targetUser?.name?.charAt(0) || <UserRound size={40} />
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-gray-100">{targetUser?.name}</h1>
            <p className="text-gray-400 mt-1">{targetUser?.college} • {targetUser?.department} • Sem {targetUser?.semester}</p>
            {targetUser?.bio && <p className="text-sm text-gray-300 mt-2">{targetUser.bio}</p>}
          </div>
          {!isNew && (
            <div className="shrink-0">
              <span className="pill text-sm font-bold shadow-sm">{data.status}</span>
            </div>
          )}
        </div>
        
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-charcoal p-5 border border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-2">They can teach</h3>
            <p className="text-gray-200">{teaches}</p>
          </div>
          <div className="rounded-xl bg-charcoal p-5 border border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky mb-2">They want to learn</h3>
            <p className="text-gray-200">{wants}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-xl font-bold text-gray-100 mb-4">
          {isNew ? "Barter Request Details" : "Barter Description"}
        </h2>
        
        {isNew ? (
          <form onSubmit={handleSendRequest}>
            <label className="block mb-4">
              <span className="block text-sm font-bold text-gray-400 mb-2">Describe what you want to barter and how you plan to exchange skills</span>
              <textarea 
                className="input w-full min-h-[120px]" 
                placeholder="E.g. I can help you with React if you can teach me Python..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </label>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={16} /> Send Request
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="p-5 bg-charcoal rounded-xl border border-line min-h-[100px]">
              <p className="text-gray-200 whitespace-pre-wrap">{description || "No description provided."}</p>
            </div>
            
            {data.status === "PENDING" && isReceiver && (
              <div className="flex flex-wrap gap-3 mt-6">
                <button className="btn btn-primary" onClick={() => changeStatus("accept")} disabled={submitting}>
                  <Check size={16} /> Accept
                </button>
                <button className="btn btn-secondary" onClick={() => changeStatus("reject")} disabled={submitting}>
                  <X size={16} /> Reject
                </button>
              </div>
            )}
            {data.status === "PENDING" && !isReceiver && (
              <div className="flex flex-wrap gap-3 mt-6">
                <button className="btn btn-danger" onClick={() => changeStatus("cancel")} disabled={submitting}>
                  <Trash2 size={16} /> Cancel Request
                </button>
              </div>
            )}
            {data.status === "ACCEPTED" && (
              <div className="flex flex-wrap gap-3 mt-6">
                <button className="btn btn-secondary" onClick={() => changeStatus("complete")} disabled={submitting}>
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
