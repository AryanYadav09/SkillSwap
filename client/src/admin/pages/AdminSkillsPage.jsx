import { useEffect, useState } from "react";
import { BookOpen, RefreshCw, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi as api, getErrorMessage, unwrap } from "../adminApi";

const categoryColors = {
  Frontend: "admin-badge-blue",
  Backend: "admin-badge-violet",
  Design: "admin-badge-pink",
  Database: "admin-badge-amber",
  "AI/ML": "admin-badge-emerald",
  Programming: "admin-badge-cyan",
  "Developer Tools": "admin-badge-slate",
  Marketing: "admin-badge-orange",
  Media: "admin-badge-rose",
  Communication: "admin-badge-teal",
  Productivity: "admin-badge-lime",
  "Computer Science": "admin-badge-indigo",
};

function getCategoryBadge(cat) {
  return categoryColors[cat] ?? "admin-badge-slate";
}

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((v) => v + 1);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/skills")
      .then((res) => setSkills(unwrap(res)?.items ?? unwrap(res) ?? []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [reloadToken]);

  const remove = async (id) => {
    if (!window.confirm("Delete this skill from the catalog?")) return;
    try {
      await api.delete(`/admin/skills/${id}`);
      toast.success("Skill deleted");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filtered = skills.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce((acc, skill) => {
    const cat = skill.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="admin-page-eyebrow">Catalog</p>
          <h1 className="admin-page-title">Skill Management</h1>
          <p className="admin-page-desc">
            {skills.length} skills across {Object.keys(grouped).length} categories.
          </p>
        </div>
        <button
          id="admin-skills-reload"
          className="admin-btn-secondary"
          onClick={reload}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="admin-search-wrap">
        <Search size={16} className="admin-search-icon" />
        <input
          id="admin-skills-search"
          className="admin-search-input"
          placeholder="Search skills or categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="admin-skeleton-list">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="admin-skeleton-row" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="admin-empty">
          <BookOpen size={40} className="admin-empty-icon" />
          <p className="admin-empty-title">No skills found</p>
          <p className="admin-empty-desc">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {Object.entries(grouped).map(([category, categorySkills]) => (
            <div key={category}>
              <div className="admin-category-header">
                <span className={`admin-badge ${getCategoryBadge(category)}`}>
                  {category}
                </span>
                <span className="admin-category-count">
                  {categorySkills.length} skill{categorySkills.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="admin-skills-grid">
                {categorySkills.map((skill) => (
                  <div key={skill.id} className="admin-skill-card">
                    <div className="admin-skill-card-body">
                      <p className="admin-skill-name">{skill.name}</p>
                      <p className="admin-skill-desc">
                        {skill.description ?? "No description."}
                      </p>
                    </div>
                    <button
                      id={`delete-skill-${skill.id}`}
                      className="admin-action-btn admin-action-delete admin-skill-delete-btn"
                      onClick={() => remove(skill.id)}
                      title="Delete skill"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
