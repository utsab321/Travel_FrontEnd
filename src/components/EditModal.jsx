import React, { useState, useEffect, useRef } from "react";
import { Edit3, ChevronRight, X } from "lucide-react";

const FONTS = {
  display: "Playfair Display, Georgia, serif",
  body: "DM Sans, system-ui, sans-serif",
  mono: "DM Mono, monospace",
};

const TRAVEL_STYLES = ["Budget", "Luxury", "Adventure"];
const PACE_OPTIONS = ["Relaxed", "Moderate", "Fast-paced"];
const ACCOMM = ["Hostel", "Hotel", "Inn", "Camping"];

const MODAL_BUTTONS = {
  cancel: "Cancel",
  save: "Save",
  saving: "Saving…",
};

const MODAL_TITLE = "Edit Profile";
const MODAL_LABELS = {
  firstName: "First Name",
  lastName: "Last Name",
  bio: "Bio",
  location: "Location",
  travelStyle: "Travel Style",
  pace: "Pace",
  accommodation: "Accommodation",
  changePhoto: "Change photo",
  interests: "Interests",
};

const MODAL_PLACEHOLDERS = {
  firstName: "Jane",
  lastName: "Doe",
  bio: "Tell travellers about yourself…",
  location: "Kathmandu, Nepal",
};

const MODAL_MESSAGES = {
  failedToSave: "Failed to save.",
  connectionError: "Could not connect to server.",
};

const FORM_LABELS = {
  budgetLabel: "Budget to Luxury",
  chillLabel: "Chill to Extreme",
  soloLabel: "Solo to Group",
  budgetLeft: "Budget",
  budgetRight: "Luxury",
  chillLeft: "Chill",
  chillRight: "Extreme",
  soloLeft: "Solo",
  soloRight: "Group",
};

const API = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
const getApiUrl = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
  return backendUrl;
};
const token = () => localStorage.getItem("access_token");
const avatar = (url) =>
  url ? (url.startsWith("http") ? url : `${getApiUrl()}${url}`) : null;

// ─── chip selector ──────────────────────────────────────────────────────────
function ChipSelect({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontFamily: FONTS.body }} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faintest)]">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o.toLowerCase())}
            style={{ fontFamily: FONTS.body }}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold border transition-all duration-200 ${
              value === o.toLowerCase()
                ? "bg-[#C9A84C] border-[#C9A84C] text-black"
                : "bg-transparent border-[var(--border)] text-[var(--text-lighter)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
            }`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── slider field ───────────────────────────────────────────────────────────
function SliderField({ label, name, value, onChange, min = 0, max = 10, leftLabel, rightLabel }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label style={{ fontFamily: FONTS.body }} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faintest)]">{label}</label>
        <span style={{ fontFamily: FONTS.mono }} className="text-xs text-[#C9A84C]">{value}/{max}</span>
      </div>
      <input type="range" min={min} max={max} name={name} value={value} onChange={onChange}
        className="accent-[#C9A84C] w-full h-[3px] rounded-full" />
      <div className="flex justify-between text-[10px] text-[var(--text-faintest)]" style={{ fontFamily: FONTS.body }}>
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

// ─── edit modal ─────────────────────────────────────────────────────────────
export default function EditModal({ profile, onClose, onSaved }) {
  
  const [form, setForm] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    travel_style: profile.travel_style || "",
    pace: profile.pace || "",
    accommodation_preference: profile.accommodation_preference || "",
    budget_level: profile.budget_level ?? 5,
    adventure_level: profile.adventure_level ?? 5,
    social_level: profile.social_level ?? 5,
    interests: profile.interests || [],
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(avatar(profile.profile_picture));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [groupedTags, setGroupedTags] = useState({});
  const fileRef = useRef();

  // Load interests from API
  useEffect(() => {
    const loadTags = async () => {
      try {
        setTagsLoading(true);
        const res = await fetch(`${getApiUrl()}/api/users/interests/`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (res.ok) {
          const tags = await res.json();
          const grouped = {};
          tags.forEach(tag => {
            if (!grouped[tag.category]) grouped[tag.category] = [];
            grouped[tag.category].push(tag);
          });
          setGroupedTags(grouped);
          console.log("✅ Loaded interests:", grouped);
        }
      } catch (e) {
        console.error("Failed to load interests:", e);
      } finally {
        setTagsLoading(false);
      }
    };
    loadTags();
  }, []);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
  };
  
  const setChip = (k) => (v) => {
    setForm(f => ({ ...f, [k]: v }));
  };
  
  const setSlider = (e) => {
    setForm(f => ({ ...f, [e.target.name]: Number(e.target.value) }));
  };

  const toggleTag = (tagId, category, tagName) => {
    setForm(f => {
      const current = f.interests || [];
      const exists = current.some(t => t.id === tagId);
      return {
        ...f,
        interests: exists
          ? current.filter(t => t.id !== tagId)
          : [...current, { id: tagId, category, name: tagName }]
      };
    });
  };

  const removeTag = (tagId) => {
    setForm(f => ({
      ...f,
      interests: (f.interests || []).filter(t => t.id !== tagId)
    }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const r = new FileReader();
    r.onload = (ev) => {
      setPhotoPreview(ev.target.result);
    };
    r.readAsDataURL(file);
  };

  const handleSave = async () => {
    
    setSaving(true); 
    setErr("");
    try {
      const fd = new FormData();
      
      // Add text fields and interests array directly
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'interests') {
          // Send interest IDs as JSON array
          const tagIds = v.map(t => t.id);
          console.log("📤 Sending interests:", { form: form.interests, tagIds });
          fd.append('interest_ids', JSON.stringify(tagIds));
        } else {
          fd.append(k, v);
        }
      });
      
      if (photoFile) {
        fd.append("profile_photo", photoFile);
      }
      
      const apiUrl = `${API}/api//users/profile/update/`;
      
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        const errorMsg = data.message || MODAL_MESSAGES.failedToSave;
        console.error("❌ Save failed:", errorMsg);
        setErr(errorMsg);
        setSaving(false);
        return;
      }
      
      console.log("✅ Save successful, response:", data);
      setSaving(false);
      onSaved(data);
      window.dispatchEvent(new Event("profile-updated"));
      // Close modal after all state updates
      onClose();
    } catch (err) {
      console.error("❌ Save error:", err);
      setErr(MODAL_MESSAGES.connectionError);
      setSaving(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const inp = "edit-profile-input w-full rounded-xl px-4 py-3 text-sm outline-none transition";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="edit-profile-modal relative w-full sm:max-w-lg sm:mt-16 max-h-[95vh] sm:max-h-[88vh] overflow-y-auto sm:rounded-2xl rounded-t-3xl shadow-2xl">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {/* header */}
        <div className="edit-profile-header sticky top-0 z-10 flex items-center justify-between backdrop-blur px-6 py-4">
          <button onClick={onClose} style={{ fontFamily: FONTS.body }} className="text-sm text-[var(--text-lighter)] hover:text-[var(--text)] transition">{MODAL_BUTTONS.cancel}</button>
          <h2 style={{ fontFamily: FONTS.body }} className="text-sm font-bold text-[var(--text)]">{MODAL_TITLE}</h2>
          <button onClick={handleSave} disabled={saving} style={{ fontFamily: FONTS.body }}
            className="text-sm font-bold text-[#C9A84C] hover:text-[#e8c96d] disabled:opacity-40 transition">
            {saving ? MODAL_BUTTONS.saving : MODAL_BUTTONS.save}
          </button>
        </div>

        <div className="flex flex-col gap-7 px-6 py-8 pb-24">
          {/* avatar */}
          <div className="flex flex-col items-center gap-2">
            <div onClick={() => fileRef.current.click()} className="relative h-24 w-24 cursor-pointer group">
              <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8b6914] opacity-60" />
              <div className="relative h-full w-full overflow-hidden rounded-full bg-[#1a1a1a] border-[2px] border-[#0e0e0e]">
                {photoPreview
                  ? <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                  : <span className="flex h-full items-center justify-center text-3xl font-bold text-[#C9A84C] bg-[var(--surface)]"
                      style={{ fontFamily: FONTS.display }}>
                      {(form.first_name || "T")[0].toUpperCase()}
                    </span>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button onClick={() => fileRef.current.click()} style={{ fontFamily: FONTS.body }}
              className="text-sm font-semibold text-[#C9A84C] hover:text-[#e8c96d] transition">
              {MODAL_LABELS.changePhoto}
            </button>
          </div>

          {/* name */}
          <div className="grid grid-cols-2 gap-3">
            {[[MODAL_LABELS.firstName, "first_name", MODAL_PLACEHOLDERS.firstName], [MODAL_LABELS.lastName, "last_name", MODAL_PLACEHOLDERS.lastName]].map(([lbl, key, ph]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label style={{ fontFamily: FONTS.body }} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-lighter)]">{lbl}</label>
                <input className={inp} style={{ fontFamily: FONTS.body }} value={form[key]} onChange={set(key)} placeholder={ph} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: FONTS.body }} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-lighter)]">{MODAL_LABELS.bio}</label>
            <textarea className={`${inp} resize-none`} style={{ fontFamily: FONTS.body }} rows={3} value={form.bio} onChange={set("bio")} placeholder={MODAL_PLACEHOLDERS.bio} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontFamily: FONTS.body }} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-lighter)]">{MODAL_LABELS.location}</label>
            <input className={inp} style={{ fontFamily: FONTS.body }} value={form.location} onChange={set("location")} placeholder={MODAL_PLACEHOLDERS.location} />
          </div>

          <div className="h-px bg-white/6" />
          <ChipSelect label={MODAL_LABELS.travelStyle}  options={TRAVEL_STYLES} value={form.travel_style}             onChange={setChip("travel_style")} />
          <ChipSelect label={MODAL_LABELS.pace}          options={PACE_OPTIONS}  value={form.pace}                     onChange={setChip("pace")} />
          <ChipSelect label={MODAL_LABELS.accommodation} options={ACCOMM}        value={form.accommodation_preference} onChange={setChip("accommodation_preference")} />

          <div className="h-px bg-white/6" />
          <SliderField label={FORM_LABELS.budgetLabel}    name="budget_level"    value={form.budget_level}    onChange={setSlider} leftLabel={FORM_LABELS.budgetLeft}  rightLabel={FORM_LABELS.budgetRight}  />
          <SliderField label={FORM_LABELS.chillLabel} name="adventure_level" value={form.adventure_level} onChange={setSlider} leftLabel={FORM_LABELS.chillLeft}   rightLabel={FORM_LABELS.chillRight} />
          <SliderField label={FORM_LABELS.soloLabel}    name="social_level"    value={form.social_level}    onChange={setSlider} leftLabel={FORM_LABELS.soloLeft}    rightLabel={FORM_LABELS.soloRight}   />

          {/* Tags */}
          <div className="h-px bg-white/6" />
          <div className="flex flex-col gap-2">
            <label style={{ fontFamily: FONTS.body }} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-faintest)]">{MODAL_LABELS.interests}</label>
            
            {/* Selected tags */}
            {form.interests && form.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.interests.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A84C] border border-[#C9A84C] px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-[#e8c96d] transition"
                  >
                    <span>{tag.name || tag.id}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
            {(!form.interests || form.interests.length === 0) && (
              <p style={{ fontFamily: FONTS.body }} className="text-xs text-[var(--text-lighter)] italic">Select interests to personalize your profile...</p>
            )}
          </div>

          {/* Tags Dropdown */}
          <div className="relative z-40">
            <button
              type="button"
              onClick={() => setTagsOpen(!tagsOpen)}
              style={{ fontFamily: FONTS.body }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]/40 px-3 py-2 text-left text-sm text-[var(--text-lighter)] hover:border-[#C9A84C]/50 transition"
            >
              + Add interests
            </button>
            
            {tagsOpen && (
              <div style={{ fontFamily: FONTS.body }} className="edit-profile-dropdown absolute top-full left-0 right-0 mt-2 border rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto">
                {tagsLoading ? (
                  <div className="px-4 py-3 text-sm text-[var(--text-lighter)]">Loading interests...</div>
                ) : (
                  Object.entries(groupedTags).map(([category, tags]) => (
                    <div key={category}>
                      <div className="sticky top-0 px-3 py-2 bg-[var(--surface)]/50 border-b border-[var(--border)] text-[10px] font-bold uppercase text-[var(--text-faintest)]">
                        {category.replace('_', ' ')}
                      </div>
                      {tags.map((tag) => {
                        const isSelected = form.interests?.some(t => t.id === tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id, tag.category, tag.name)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition ${
                              isSelected
                                ? "bg-[#C9A84C]/20 text-[#C9A84C] font-semibold"
                                : "text-[var(--text-lighter)] hover:bg-[var(--surface)]/30 hover:text-[var(--text)]"
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {err && <p style={{ fontFamily: FONTS.body }} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{err}</p>}

          {/* LIGHT MODE & THEME CSS VARIABLES */}
          <style>{`
            .edit-profile-modal {
              background: var(--surface);
              color: var(--text);
              border: 1px solid var(--border-card);
            }

            .edit-profile-header {
              background: color-mix(in srgb, var(--surface) 95%, transparent);
              border-bottom: 1px solid var(--border-card);
            }

            .edit-profile-input {
              background: var(--surface);
              color: var(--text);
              border: 1px solid var(--border);
              font-family: ${FONTS.body};
            }

            .edit-profile-input::placeholder {
              color: var(--text-faintest);
            }

            .edit-profile-input:focus {
              border-color: var(--accent);
              box-shadow: 0 0 0 3px var(--accent-bg);
            }

            .edit-profile-dropdown {
              background: var(--surface);
              border-color: var(--border);
            }

            [data-theme="light"] .edit-profile-modal {
              background: #ffffff;
              color: #15120d;
              border-color: rgba(21, 18, 13, 0.10);
            }

            [data-theme="light"] .edit-profile-header {
              background: rgba(255, 255, 255, 0.95);
              border-bottom-color: rgba(21, 18, 13, 0.10);
            }

            [data-theme="light"] .edit-profile-input {
              background: #ffffff;
              color: #15120d;
              border-color: #ddd7ce;
            }

            [data-theme="light"] .edit-profile-input::placeholder {
              color: rgba(21, 18, 13, 0.35);
            }

            [data-theme="light"] .edit-profile-input:focus {
              border-color: #ff6a00;
              box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.12);
            }

            [data-theme="light"] .edit-profile-dropdown {
              background: #ffffff;
              border-color: rgba(21, 18, 13, 0.10);
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
