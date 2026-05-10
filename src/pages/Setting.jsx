import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getBaseUrl, getToken } from "../utils/api";
import useScrollbarExpand from "../hooks/useScrollbarExpand";

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const icons = {
  profile: <Icon><circle cx="8" cy="5.5" r="2.5" /><path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /></Icon>,
  password: <Icon><rect x="3" y="7.5" width="10" height="7" rx="2" /><path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" /></Icon>,
  notifications: <Icon><path d="M8 2a5 5 0 00-5 5v2.5L2 11h12l-1-1.5V7a5 5 0 00-5-5z" /><path d="M6.5 13.5a1.5 1.5 0 003 0" /></Icon>,
  privacy: <Icon><path d="M8 1.5L2.5 4v4c0 3.5 2.5 5.5 5.5 6.5 3-1 5.5-3 5.5-6.5V4L8 1.5z" /></Icon>,
  security: <Icon><circle cx="8" cy="8" r="5.5" /><path d="M8 5.5v3l2 1.5" /></Icon>,
  appearance: <Icon><path d="M2.5 4.5c0-1.1.9-2 2-2h7c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2h-7c-1.1 0-2-.9-2-2v-7z" /><path d="M5.5 8L8 5.5l2.5 2.5M8 5.5v5" /></Icon>,
  moon: <Icon><path d="M14 8.3a6.5 6.5 0 01-9.1-6.2 6.5 6.5 0 009.1 6.2z" /></Icon>,
  sun: <Icon><path d="M8 2v4M8 10v4M3.5 8h4M9.5 8h4M4.6 4.6L7 2.2M11 9.9l2.4 2.4M11 6.1l2.4-2.4M7 11.9l-2.4 2.4" /></Icon>,
  logout: <Icon><path d="M10.5 8H4m0 0l2-2M4 8l2 2" /><path d="M7 3H3.5a1 1 0 00-1 1v8a1 1 0 001 1H7" /></Icon>,
  eye: <Icon><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" /><circle cx="8" cy="8" r="1.5" /></Icon>,
  eyeOff: <Icon><path d="M1.5 1.5l13 13M6.5 6.7a2 2 0 002.8 2.8M4.2 4.3C2.7 5.4 1.5 8 1.5 8s2.5 4.5 6.5 4.5c1.3 0 2.5-.4 3.5-1M8 3.5C11.8 3.5 14.5 8 14.5 8s-.7 1.3-1.8 2.4" /></Icon>,
};

// ── Reusable primitives ───────────────────────────────────────────────────────
const FormInput = ({ label, hint, ...props }) => (
  <div className="sg-form-group">
    {label && <label className="sg-label">{label}</label>}
    <input className="sg-input" {...props} />
    {hint && <p className="sg-hint">{hint}</p>}
  </div>
);

const Toggle = ({ on, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`sg-toggle ${on ? "sg-toggle--on" : ""}`}
    aria-checked={on}
    role="switch"
  >
    <span className="sg-toggle-knob" />
  </button>
);

const ToggleRow = ({ label, desc, on, onChange }) => (
  <div className="sg-toggle-row">
    <div>
      <p className="sg-toggle-label">{label}</p>
      {desc && <p className="sg-toggle-desc">{desc}</p>}
    </div>
    <Toggle on={on} onChange={onChange} />
  </div>
);

const Toast = ({ type, message }) =>
  message ? (
    <div className={`sg-toast sg-toast--${type}`}>
      <span>{type === "success" ? "✓" : "✕"}</span> {message}
    </div>
  ) : null;

// ── Password strength helper ──────────────────────────────────────────────────
function getStrength(val) {
  if (!val) return { score: 0, label: "", color: "" };
  let s = 0;
  if (val.length >= 8) s++;
  if (/[A-Z]/.test(val)) s++;
  if (/[0-9]/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  const map = [
    { label: "Weak",   color: "#c05050", pct: "20%" },
    { label: "Fair",   color: "#c09040", pct: "45%" },
    { label: "Good",   color: "#c8b882", pct: "72%" },
    { label: "Strong", color: "#50a060", pct: "100%" },
  ];
  return { score: s, pct: map[s - 1]?.pct ?? "20%", ...map[s - 1] };
}

// ── Theme storage helper using localStorage ──────────────────────────────────
const ThemeStorage = {
  set: (isDarkMode) => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  },
  get: () => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return null; // No saved theme
  },
  delete: () => {
    localStorage.removeItem("theme");
  }
};

// ── Main component ────────────────────────────────────────────────────────────
export default function SettingPage() {
  const { logout } = useAuth();
  const [activePanel, setActivePanel] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: "", message: "" });

  // Profile
  const [profileData, setProfileData] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [profileForm, setProfileForm] = useState({
    firstName: "", lastName: "", bio: "", username: "",
  });
  const [lastLoginDate, setLastLoginDate] = useState(null);

  // Password
  const [pwForm, setPwForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Preferences / Privacy
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    tripUpdates: true,
    friendRequests: true,
    tripInviteNotifications: true,
    publicProfile: true,
    searchableByEmail: true,
    showOnlineStatus: false,
    shareTripActivity: true,
    darkMode: true,
  });

  // Account deletion
  const [deleteModal, setDeleteModal] = useState({ open: false, password: "", error: "", loading: false });

  // Security Questions
  const [allSecurityQuestions, setAllSecurityQuestions] = useState([]);
  const [securityAnswers, setSecurityAnswers] = useState({});
  const [savedSecurityQuestionIds, setSavedSecurityQuestionIds] = useState([]);
  const [savingSecurityQuestions, setSavingSecurityQuestions] = useState(false);
  const [showSecurityQuestionEditor, setShowSecurityQuestionEditor] = useState(false);

  const MIN_SECURITY_QUESTIONS = 2;
  const savedQuestionCount = savedSecurityQuestionIds.length;
  const newQuestionCount = Object.values(securityAnswers).filter(
    (a) => a !== "saved" && a !== undefined && a.trim && a.trim().length > 0
  ).length;
  const recoveryComplete = savedQuestionCount >= MIN_SECURITY_QUESTIONS;

  // ── Show toast then auto-clear ──────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    const duration = type === "success" ? 4000 : 3000; // Success messages stay longer
    setTimeout(() => setToast({ type: "", message: "" }), duration);
  };

  // ── Apply saved theme from localStorage on page load ────────────────────────
  useEffect(() => {
    const savedTheme = ThemeStorage.get();
    if (savedTheme !== null) {
      document.documentElement.setAttribute("data-theme", savedTheme ? "dark" : "light");
    }
  }, []);

  // ── Listen for theme changes from navbar and sync ───────────────────────────
  useEffect(() => {
    const handleThemeChange = (e) => {
      const isDark = e.detail?.isDarkMode ?? (localStorage.getItem("theme") === "dark");
      // Update the prefs state to sync with navbar
      setPrefs(prev => ({ ...prev, darkMode: isDark }));
      // Apply theme to document
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    };

    window.addEventListener("theme-changed", handleThemeChange);
    return () => window.removeEventListener("theme-changed", handleThemeChange);
  }, []);

  // ── Fetch user on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Check for saved theme in localStorage first
        const savedTheme = ThemeStorage.get();
        let darkModeToUse = true; // Default to dark if nothing saved
        
        try {
          const data = await apiFetch("/api/users/me/");
          setProfileData(data);
          setProfileForm({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            bio: data.bio || "",
            username: data.username || "",
          });
          if (data?.profile_picture) {
            const url = data.profile_picture.startsWith("http")
              ? data.profile_picture
              : `${getBaseUrl()}${data.profile_picture}`;
            setProfilePic(url);
          }
          if (data?.last_login) {
            setLastLoginDate(new Date(data.last_login));
          }

          // Load preferences from backend
          const prefsData = await apiFetch("/api/users/me/preferences/");
          darkModeToUse = prefsData.darkMode ?? true;
          
          // If localStorage has a saved theme, use it instead (localStorage takes precedence)
          if (savedTheme !== null) {
            darkModeToUse = savedTheme;
          }
          
          setPrefs({
            emailNotifications: prefsData.emailNotifications,
            tripUpdates: prefsData.tripUpdates,
            friendRequests: prefsData.friendRequests,
            tripInviteNotifications: prefsData.friendRequests,
            shareTripActivity: prefsData.shareTripActivity,
            publicProfile: prefsData.publicProfile,
            searchableByEmail: prefsData.searchableByEmail,
            showOnlineStatus: prefsData.showOnlineStatus,
            darkMode: darkModeToUse,
          });
        } catch (err) {
          // If backend fetch fails, still use localStorage preference if available
          if (savedTheme !== null) {
            darkModeToUse = savedTheme;
          }
        }
        
        // Apply theme immediately from localStorage (or use default)
        document.documentElement.setAttribute("data-theme", darkModeToUse ? "dark" : "light");
      } catch {
        showToast("error", "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Load security questions ──────────────────────────────────────────────────
  useEffect(() => {
    const loadSecurityQuestions = async () => {
      try {
        const questions = await apiFetch("/api/users/security-questions/");
        setAllSecurityQuestions(questions || []);
        
        // Load user's current security answers
        const userData = await apiFetch("/api/users/me/");
        if (userData.security_questions && Array.isArray(userData.security_questions)) {
          // security_questions is a list of IDs that are already saved
          const savedIds = userData.security_questions.map(id => String(id));
          setSavedSecurityQuestionIds(savedIds);
          // Initialize securityAnswers with saved questions (answers will be hidden)
          const savedAnswers = {};
          savedIds.forEach(id => {
            savedAnswers[id] = "saved"; // Placeholder indicating it's saved
          });
          setSecurityAnswers(savedAnswers);
        }
      } catch (err) {
        console.error("Failed to load security questions:", err);
      }
    };
    loadSecurityQuestions();
  }, []);

  /* ── Enable scrollbar expansion on hover ── */
  useScrollbarExpand(".settings-panel, .scrollbar-expandable");

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${getBaseUrl()}/api/users/me/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          bio: profileForm.bio,
          username: profileForm.username,
        }),
      });
      if (res.ok) showToast("success", "Profile updated successfully");
      else { const d = await res.json(); showToast("error", d.error || "Failed to update profile"); }
    } catch { showToast("error", "An error occurred"); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return showToast("error", "Passwords do not match");
    if (pwForm.newPassword.length < 8) return showToast("error", "Password must be at least 8 characters");
    try {
      const res = await fetch(`${getBaseUrl()}/api/users/me/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ current_password: pwForm.currentPassword, new_password: pwForm.newPassword }),
      });
      if (res.ok) {
        showToast("success", "Password updated successfully");
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else { const d = await res.json(); showToast("error", d.error || "Failed to change password"); }
    } catch { showToast("error", "An error occurred"); }
  };

  const handlePrefChange = async (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    
    // Apply theme to document and save to localStorage if darkMode changed
    if (key === "darkMode") {
      document.documentElement.setAttribute("data-theme", updated.darkMode ? "dark" : "light");
      ThemeStorage.set(updated.darkMode); // Save theme preference to localStorage
      
      // Dispatch custom event to sync navbar and other components
      window.dispatchEvent(new CustomEvent("theme-changed", { 
        detail: { isDarkMode: updated.darkMode } 
      }));
    }
    
    try {
      // Only send backend-supported preferences
      const backendPrefs = {
        emailNotifications: updated.emailNotifications,
        tripUpdates: updated.tripUpdates,
        friendRequests: updated.friendRequests,
        publicProfile: updated.publicProfile,
        searchableByEmail: updated.searchableByEmail,
        showOnlineStatus: updated.showOnlineStatus,
        shareTripActivity: updated.shareTripActivity,
        darkMode: updated.darkMode,
      };
      
      const res = await fetch(`${getBaseUrl()}/api/users/me/preferences/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(backendPrefs),
      });
      
      if (res.ok) {
        showToast("success", "Preference saved");
      } else {
        const errorData = await res.json();
        showToast("error", errorData.error || errorData.detail || "Failed to save preference");
        // Revert the change
        setPrefs((prev) => ({ ...prev, [key]: !updated[key] }));
        // Revert theme if darkMode change was reverted
        if (key === "darkMode") {
          const revertedMode = !updated.darkMode;
          document.documentElement.setAttribute("data-theme", revertedMode ? "dark" : "light");
          ThemeStorage.set(revertedMode);
          
          // Dispatch event to sync navbar on revert
          window.dispatchEvent(new CustomEvent("theme-changed", { 
            detail: { isDarkMode: revertedMode } 
          }));
        }
      }
    } catch (err) {
      console.error("Failed to save preference:", err);
      showToast("error", "An error occurred while saving preference");
      // Revert the change
      setPrefs((prev) => ({ ...prev, [key]: !updated[key] }));
      // Revert theme if darkMode change was reverted
      if (key === "darkMode") {
        const revertedMode = !updated.darkMode;
        document.documentElement.setAttribute("data-theme", revertedMode ? "dark" : "light");
        ThemeStorage.set(revertedMode);
        
        // Dispatch event to sync navbar on revert
        window.dispatchEvent(new CustomEvent("theme-changed", { 
          detail: { isDarkMode: revertedMode } 
        }));
      }
    }
  };

  const handleSaveSecurityQuestions = async () => {
    // Validate that at least one question is answered
    const newAnswers = Object.entries(securityAnswers)
      .filter(([id, answer]) => answer !== "saved")
      .reduce((acc, [id, answer]) => ({ ...acc, [id]: answer }), {});
    
    if (Object.keys(newAnswers).length === 0) {
      showToast("error", "Please select and answer at least one new security question");
      return;
    }

    // Validate all new questions have answers
    const allAnswered = Object.values(newAnswers).every(answer => 
      typeof answer === 'string' && answer.trim().length > 0
    );
    if (!allAnswered) {
      showToast("error", "Please answer all selected security questions");
      return;
    }

    setSavingSecurityQuestions(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/users/me/security-questions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ security_questions: newAnswers }),
      });

      if (res.ok) {
        showToast("success", "✓ Security questions saved successfully!");
        // Mark newly saved questions as saved
        const newSavedIds = [...savedSecurityQuestionIds, ...Object.keys(newAnswers)];
        setSavedSecurityQuestionIds(newSavedIds);
        
        // Reset form after successful save
        setTimeout(() => {
          // Keep only the saved questions marked as "saved"
          const savedAnswers = {};
          newSavedIds.forEach(id => {
            savedAnswers[id] = "saved";
          });
          setSecurityAnswers(savedAnswers);
        }, 500);
      } else {
        const d = await res.json();
        showToast("error", d.error || "Failed to update security questions");
      }
    } catch (err) {
      console.error("Security questions save error:", err);
      showToast("error", "An error occurred while saving security questions");
    } finally {
      setSavingSecurityQuestions(false);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("⚠️ WARNING: This will permanently delete your account and all associated data.\n\nThis action cannot be reversed or undone.\n\nAre you absolutely sure?")) {
      // Show password confirmation modal
      setDeleteModal({ open: true, password: "", error: "", loading: false });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.password.trim()) {
      setDeleteModal(prev => ({ ...prev, error: "Password is required" }));
      return;
    }

    setDeleteModal(prev => ({ ...prev, loading: true, error: "" }));

    try {
      const res = await fetch(`${getBaseUrl()}/api/users/me/delete/`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ password: deleteModal.password }),
      });

      if (res.ok) {
        showToast("success", "Account deleted successfully. Logging out...");
        // Clear modal
        setDeleteModal({ open: false, password: "", error: "", loading: false });
        // Logout after a short delay
        setTimeout(() => logout(), 1500);
      } else {
        const errorData = await res.json();
        setDeleteModal(prev => ({ 
          ...prev, 
          error: errorData.error || "Failed to delete account",
          loading: false 
        }));
      }
    } catch (err) {
      console.error("Delete account error:", err);
      setDeleteModal(prev => ({ 
        ...prev, 
        error: "An error occurred. Please try again.",
        loading: false 
      }));
    }
  };

  // ── Avatar initials ─────────────────────────────────────────────────────────
  const initials = ((profileForm.firstName[0] || "") + (profileForm.lastName[0] || "")).toUpperCase() || "U";
  const strength = getStrength(pwForm.newPassword);

  // ── Nav items ───────────────────────────────────────────────────────────────
  const navItems = [
    { id: "profile",       label: "Profile",       icon: icons.profile,       group: "Account" },
    { id: "password",      label: "Password",      icon: icons.password,      group: "Account" },
    { id: "notifications", label: "Notifications", icon: icons.notifications, group: "Account" },
    { id: "appearance",    label: "Appearance",    icon: icons.appearance,    group: "Preferences" },
    { id: "privacy",       label: "Privacy",       icon: icons.privacy,       group: "Preferences" },
    { id: "security",      label: "Security",      icon: icons.security,      group: "Preferences" },
  ];
  const groups = ["Account", "Preferences"];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        .sg-root {
          display: flex;
          min-height: 100vh;
          background: #0a0c16;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        }

        /* SIDEBAR */
        .sg-sidebar {
          width: 224px;
          flex-shrink: 0;
          background: #111318;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .sg-sidebar-header {
          padding: 28px 20px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sg-sidebar-title { font-size: 18px; font-weight: 500; color: #ffffff; }
        .sg-sidebar-sub   { font-size: 12px; color: #999999; margin-top: 3px; }
        .sg-nav { padding: 16px 10px; flex: 1; overflow-y: auto; }
        .sg-nav-section {
          font-size: 10px; font-weight: 500; color: #c8b882;
          letter-spacing: 1.2px; text-transform: uppercase;
          padding: 0 10px; margin: 18px 0 6px;
        }
        .sg-nav-section:first-child { margin-top: 4px; }
        .sg-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 9px; cursor: pointer;
          transition: background 0.12s; margin-bottom: 2px;
          color: #999999; border: none; background: none; width: 100%; text-align: left;
        }
        .sg-nav-item:hover { background: #1a1d26; color: #cccccc; }
        .sg-nav-item--active { background: #1a1d26 !important; color: #ffffff !important; }
        .sg-nav-item--active svg { color: #c8b882 !important; }
        .sg-nav-label { font-size: 13px; font-weight: 400; }
        .sg-nav-item--active .sg-nav-label { font-weight: 500; }
        .sg-sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sg-nav-item--danger { color: #f87171 !important; }
        .sg-nav-item--danger:hover { background: rgba(192, 80, 80, 0.1) !important; color: #f87171 !important; }

        /* CONTENT */
        .sg-content {
          flex: 1;
          padding: 40px 44px;
          overflow-y: auto;
          max-width: 680px;
          background: #0a0c16;
        }
        .sg-panel-title { font-size: 22px; font-weight: 500; color: #ffffff; margin-bottom: 4px; }
        .sg-panel-sub   { font-size: 13px; color: #999999; margin-bottom: 28px; }

        /* TOAST */
        .sg-toast {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 9px; font-size: 13px;
          margin-bottom: 20px;
        }
        .sg-toast--success { background: rgba(80, 160, 96, 0.1); border: 1px solid rgba(80, 160, 96, 0.3); color: #50a060; }
        .sg-toast--error   { background: rgba(192, 80, 80, 0.1); border: 1px solid rgba(192, 80, 80, 0.3); color: #f87171; }

        /* AVATAR BLOCK */
        .sg-avatar-block {
          display: flex; align-items: center; gap: 20px;
          padding: 20px; background: #111318;
          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin-bottom: 22px;
        }
        .sg-avatar {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #c8b882 0%, #a69863 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 500; color: #0a0c16;
          flex-shrink: 0; border: 2px solid #c8b882;
          user-select: none;
        }
        .sg-avatar-name  { font-size: 15px; font-weight: 500; color: #ffffff; }
        .sg-avatar-email { font-size: 13px; color: #999999; margin-top: 2px; }
        .sg-avatar-meta  { font-size: 12px; color: #666666; margin-top: 3px; }

        /* FORM */
        .sg-form-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;
        }
        .sg-form-group { margin-bottom: 16px; }
        .sg-label {
          display: block; font-size: 11px; font-weight: 500;
          color: #666666; letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 7px;
        }
        .sg-input {
          width: 100%; padding: 10px 14px;
          background: #111318; border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9px; color: #ffffff; font-size: 14px;
          outline: none; transition: border-color 0.15s;
          font-family: inherit;
        }
        .sg-input:focus  { border-color: #c8b882; }
        .sg-input::placeholder { color: #999999; }
        .sg-input:disabled { color: #999999; cursor: not-allowed; }
        .sg-hint { font-size: 11px; color: #666666; margin-top: 5px; }
        textarea.sg-input { resize: none; }

        /* PASSWORD FIELD */
        .sg-pw-wrap { position: relative; }
        .sg-pw-wrap .sg-input { padding-right: 42px; }
        .sg-eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #666666;
          display: flex; align-items: center; padding: 0;
          transition: color 0.15s;
        }
        .sg-eye-btn:hover { color: #c8b882; }

        /* PW STRENGTH */
        .sg-pw-bar-wrap {
          height: 3px; background: rgba(255, 255, 255, 0.1); border-radius: 2px;
          margin-top: 6px; overflow: hidden;
        }
        .sg-pw-bar { height: 100%; border-radius: 2px; transition: width 0.2s, background 0.2s; }

        /* BUTTONS */
        .sg-btn {
          padding: 10px 18px; font-size: 13px; font-weight: 500;
          border-radius: 9px; cursor: pointer; transition: all 0.15s;
          border: none; font-family: inherit;
        }
        .sg-btn--gold    { background: #c8b882; color: #0a0c16; }
        .sg-btn--gold:hover { opacity: 0.9; }
        .sg-btn--outline { background: transparent; color: #c8b882; border: 1px solid rgba(255, 255, 255, 0.1); }
        .sg-btn--outline:hover { background: #1a1d26; }
        .sg-btn--danger  { background: transparent; color: #f87171; border: 1px solid rgba(192, 80, 80, 0.3); }
        .sg-btn--danger:hover { background: rgba(192, 80, 80, 0.1); }
        .sg-btn--full    { width: 100%; padding: 11px; }
        .sg-btn-row      { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }

        /* CARDS */
        .sg-card {
          background: #111318; border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px; overflow: hidden; margin-bottom: 12px;
        }

        /* TOGGLE ROW */
        .sg-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sg-card > .sg-toggle-row:last-child { border-bottom: none; }
        .sg-toggle-label { font-size: 14px; color: #cccccc; }
        .sg-toggle-desc  { font-size: 12px; color: #999999; margin-top: 2px; }
        .sg-toggle {
          width: 40px; height: 22px; border-radius: 11px;
          background: #1a1d26; border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative; cursor: pointer; flex-shrink: 0;
          transition: background 0.2s, border-color 0.2s;
        }
        .sg-toggle--on  { background: #c8b882; border-color: #c8b882; }
        .sg-toggle-knob {
          width: 16px; height: 16px; border-radius: 50%;
          background: #1a1d26; position: absolute; top: 2px; left: 2px;
          transition: left 0.18s, background 0.18s; display: block;
        }
        .sg-toggle--on .sg-toggle-knob { left: 20px; background: #0a0c16; }

        /* SECTION LABEL */
        .sg-section-label {
          font-size: 10px; font-weight: 500; color: #c8b882;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; margin-top: 20px;
        }
        .sg-section-label:first-child { margin-top: 0; }

        /* SECURITY ROWS */
        .sg-sec-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sg-card > .sg-sec-row:last-child { border-bottom: none; }
        .sg-sec-icon {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sg-sec-label { font-size: 14px; color: #cccccc; flex: 1; }
        .sg-sec-sub   { font-size: 12px; color: #999999; margin-top: 1px; }
        .sg-badge {
          padding: 3px 10px; border-radius: 6px; font-size: 11px;
          font-weight: 500; white-space: nowrap;
        }
        .sg-badge--red   { background: rgba(192, 80, 80, 0.1); color: #f87171; border: 1px solid rgba(192, 80, 80, 0.3); }
        .sg-badge--gold  { background: rgba(200, 184, 130, 0.1); color: #c8b882; border: 1px solid rgba(200, 184, 130, 0.3); }
        .sg-badge--green { background: rgba(80, 160, 96, 0.1); color: #50a060; border: 1px solid rgba(80, 160, 96, 0.3); }

        /* DANGER ZONE */
        .sg-danger-zone {
          background: #111318; border: 1px solid rgba(192, 80, 80, 0.3);
          border-radius: 12px; padding: 20px; margin-top: 20px;
        }
        .sg-danger-title { font-size: 14px; font-weight: 500; color: #f87171; margin-bottom: 4px; }
        .sg-danger-desc  { font-size: 13px; color: #999999; margin-bottom: 16px; line-height: 1.6; }

        .sg-divider { border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0; }

        /* THEME TOGGLE */
        .sg-theme-group {
          display: flex; gap: 12px; margin-bottom: 20px;
        }
        .sg-theme-btn {
          flex: 1; padding: 16px; border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.1); background: #111318;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-weight: 500; font-size: 14px;
          color: #999999;
        }
        .sg-theme-btn:hover {
          border-color: rgba(255, 255, 255, 0.1); color: #cccccc;
        }
        .sg-theme-btn--active {
          background: linear-gradient(135deg, #c8b882 0%, #a69863 100%);
          color: #0a0c16 !important; border-color: #c8b882 !important;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* LIGHT MODE FIX FOR SETTINGS PAGE */
        [data-theme="light"] .sg-root {
          background: #f4f0e8;
          color: #15120d;
        }

        [data-theme="light"] .sg-sidebar {
          background: #ffffff;
          border-right: 1px solid rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] .sg-sidebar-header {
          border-bottom: 1px solid rgba(21, 18, 13, 0.08);
        }

        [data-theme="light"] .sg-sidebar-title,
        [data-theme="light"] .sg-panel-title,
        [data-theme="light"] .sg-avatar-name,
        [data-theme="light"] .sg-toggle-label,
        [data-theme="light"] .sg-sec-label {
          color: #15120d;
        }

        [data-theme="light"] .sg-sidebar-sub,
        [data-theme="light"] .sg-panel-sub,
        [data-theme="light"] .sg-avatar-email,
        [data-theme="light"] .sg-toggle-desc,
        [data-theme="light"] .sg-sec-sub,
        [data-theme="light"] .sg-hint {
          color: #5d5550;
        }

        [data-theme="light"] .sg-content {
          background: linear-gradient(180deg, #f4f0e8 0%, #f7f2ea 100%);
        }

        [data-theme="light"] .sg-card,
        [data-theme="light"] .sg-avatar-block,
        [data-theme="light"] .sg-danger-zone {
          background: #ffffff;
          border-color: rgba(21, 18, 13, 0.10);
          box-shadow: 0 14px 40px rgba(21, 18, 13, 0.045);
        }

        [data-theme="light"] .sg-input {
          background: #ffffff;
          color: #15120d;
          border-color: #ddd7ce;
        }

        [data-theme="light"] .sg-input:focus {
          border-color: #ff6a00;
          box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.12);
        }

        [data-theme="light"] .sg-label {
          color: #8893aa;
        }

        [data-theme="light"] .sg-section-label,
        [data-theme="light"] .sg-nav-section {
          color: #ff6a00;
        }

        [data-theme="light"] .sg-nav-item {
          color: #5d5550;
        }

        [data-theme="light"] .sg-nav-item:hover {
          background: rgba(255, 106, 0, 0.06);
          color: #15120d;
        }

        [data-theme="light"] .sg-nav-item--active {
          background: rgba(255, 106, 0, 0.10) !important;
          color: #15120d !important;
        }

        [data-theme="light"] .sg-nav-item--active svg {
          color: #ff6a00 !important;
        }

        [data-theme="light"] .sg-btn--gold {
          background: linear-gradient(135deg, #ff6a00, #ff8a2a);
          color: #ffffff;
        }

        [data-theme="light"] .sg-btn--outline {
          color: #ff6a00;
          border-color: rgba(255, 106, 0, 0.25);
        }

        [data-theme="light"] .sg-btn--outline:hover {
          background: rgba(255, 106, 0, 0.06);
        }

        [data-theme="light"] .sg-toggle-row,
        [data-theme="light"] .sg-sec-row {
          border-bottom-color: rgba(21, 18, 13, 0.08);
        }

        [data-theme="light"] .sg-toggle {
          background: #eee6dc;
          border-color: #ddd7ce;
        }

        [data-theme="light"] .sg-toggle--on {
          background: #ff6a00;
          border-color: #ff6a00;
        }

        [data-theme="light"] .sg-toggle-knob {
          background: #ffffff;
        }

        [data-theme="light"] .sg-toggle--on .sg-toggle-knob {
          background: #ffffff;
        }

        /* SECURITY QUESTION UI */
        .sg-recovery-card {
          padding: 0;
        }

        .sg-recovery-complete {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
        }

        .sg-recovery-complete-icon {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: rgba(80, 160, 96, 0.14);
          color: #50a060;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .sg-recovery-complete-body {
          flex: 1;
        }

        .sg-recovery-complete-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .sg-recovery-complete-desc {
          font-size: 13px;
          color: #999999;
          line-height: 1.5;
        }

        .sg-recovery-complete-note {
          font-size: 12px;
          color: #50a060;
          margin-top: 8px;
        }

        .sg-recovery-editor {
          padding: 16px;
        }

        .sg-question-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sg-question-item {
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          padding: 12px;
        }

        .sg-question-item--saved {
          border-color: rgba(80, 160, 96, 0.30);
          background: rgba(80, 160, 96, 0.08);
        }

        .sg-question-saved,
        .sg-question-editable {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .sg-question-editable {
          cursor: pointer;
        }

        .sg-question-check {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #10b981;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .sg-question-content {
          flex: 1;
        }

        .sg-question-title {
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
        }

        .sg-question-status {
          margin-top: 4px;
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
        }

        .sg-question-input {
          width: 100%;
          margin-top: 8px;
          padding: 9px 12px;
          font-size: 13px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          background: #0a0c16;
          color: #ffffff;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
        }

        .sg-question-input:focus {
          border-color: #c8b882;
        }

        .sg-recovery-count {
          display: flex;
          gap: 16px;
          margin-top: 14px;
          font-size: 12px;
          color: #999999;
        }

        .sg-recovery-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }

        /* LIGHT MODE FOR SECURITY QUESTION UI */
        [data-theme="light"] .sg-recovery-complete-title,
        [data-theme="light"] .sg-question-title {
          color: #15120d;
        }

        [data-theme="light"] .sg-recovery-complete-desc,
        [data-theme="light"] .sg-recovery-count {
          color: #5d5550;
        }

        [data-theme="light"] .sg-question-item {
          background: #fffaf4;
          border-color: #ddd7ce;
        }

        [data-theme="light"] .sg-question-item--saved {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        [data-theme="light"] .sg-question-input {
          background: #ffffff;
          color: #15120d;
          border-color: #ddd7ce;
        }

        [data-theme="light"] .sg-question-input:focus {
          border-color: #ff6a00;
          box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.12);
        }

        @media (max-width: 640px) {
          .sg-sidebar { width: 60px; }
          .sg-nav-label, .sg-sidebar-header, .sg-nav-section { display: none; }
          .sg-content { padding: 24px 20px; }
          .sg-form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sg-root">
        {/* ── SIDEBAR ── */}
        <aside className="sg-sidebar">
          <div className="sg-sidebar-header">
            <div className="sg-sidebar-title">Settings</div>
            <div className="sg-sidebar-sub">Manage your account</div>
          </div>

          <nav className="sg-nav">
            {groups.map((group) => (
              <div key={group}>
                <div className="sg-nav-section">{group}</div>
                {navItems.filter((n) => n.group === group).map((item) => (
                  <button
                    key={item.id}
                    className={`sg-nav-item ${activePanel === item.id ? "sg-nav-item--active" : ""}`}
                    onClick={() => setActivePanel(item.id)}
                  >
                    {item.icon}
                    <span className="sg-nav-label">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="sg-sidebar-footer">
            <button className="sg-nav-item sg-nav-item--danger" onClick={() => {
              if (window.confirm("Are you sure you want to log out?")) {
                showToast("success", "Logging out...");
                setTimeout(() => logout(), 500);
              }
            }}>
              {icons.logout}
              <span className="sg-nav-label">Log out</span>
            </button>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <main className="sg-content">
          <Toast type={toast.type} message={toast.message} />

          {/* ── PROFILE ── */}
          {activePanel === "profile" && (
            <section>
              <h1 className="sg-panel-title">Profile</h1>
              <p className="sg-panel-sub">How you appear to others on the platform</p>

              <div className="sg-avatar-block">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" onError={() => setProfilePic(null)}
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      border: "2px solid #c8b882", objectFit: "cover", flexShrink: 0
                    }}
                  />
                ) : (
                  <div className="sg-avatar">{initials}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div className="sg-avatar-name">
                    {[profileForm.firstName, profileForm.lastName].filter(Boolean).join(" ") || "Your Name"}
                  </div>
                  <div className="sg-avatar-email">{profileData?.email}</div>
                  <div className="sg-avatar-meta">Member since {new Date(profileData?.date_joined || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
                </div>
                <label style={{ cursor: "pointer" }}>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setProfilePic(ev.target?.result);
                      reader.readAsDataURL(file);
                    }
                  }} style={{ display: "none" }} />
                  <button type="button" className="sg-btn sg-btn--outline" style={{ fontSize: 12, cursor: "pointer" }}>Change photo</button>
                </label>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="sg-form-row">
                  <div className="sg-form-group" style={{ margin: 0 }}>
                    <label className="sg-label">First name</label>
                    <input
                      className="sg-input"
                      type="text"
                      placeholder="First name"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className="sg-form-group" style={{ margin: 0 }}>
                    <label className="sg-label">Last name</label>
                    <input
                      className="sg-input"
                      type="text"
                      placeholder="Last name"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="sg-form-group">
                  <label className="sg-label">Username</label>
                  <input
                    className="sg-input"
                    type="text"
                    placeholder="@username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  />
                </div>

                <div className="sg-form-group">
                  <label className="sg-label">Email address</label>
                  <input className="sg-input" type="email" value={profileData?.email || ""} disabled />
                  <p className="sg-hint">Contact support to change your email address.</p>
                </div>

                <div className="sg-form-group">
                  <label className="sg-label">Bio</label>
                  <textarea
                    className="sg-input"
                    rows={3}
                    placeholder="Tell people a little about yourself…"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  />
                </div>

                <div className="sg-btn-row">
                  <button type="button" className="sg-btn sg-btn--outline"
                    onClick={() => setProfileForm({
                      firstName: profileData?.first_name || "",
                      lastName: profileData?.last_name || "",
                      bio: profileData?.bio || "",
                      username: profileData?.username || "",
                    })}>
                    Discard
                  </button>
                  <button type="submit" className="sg-btn sg-btn--gold">Save changes</button>
                </div>
              </form>
            </section>
          )}

          {/* ── PASSWORD ── */}
          {activePanel === "password" && (
            <section>
              <h1 className="sg-panel-title">Password</h1>
              <p className="sg-panel-sub">Keep your account secure with a strong password</p>

              <form onSubmit={handleChangePassword} style={{ maxWidth: 400 }}>
                <div className="sg-form-group">
                  <label className="sg-label">Current password</label>
                  <div className="sg-pw-wrap">
                    <input
                      className="sg-input"
                      type={showPw.current ? "text" : "password"}
                      placeholder="Enter current password"
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="sg-eye-btn"
                      onClick={() => setShowPw({ ...showPw, current: !showPw.current })}>
                      {showPw.current ? icons.eyeOff : icons.eye}
                    </button>
                  </div>
                </div>

                <div className="sg-form-group">
                  <label className="sg-label">New password</label>
                  <div className="sg-pw-wrap">
                    <input
                      className="sg-input"
                      type={showPw.new ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="sg-eye-btn"
                      onClick={() => setShowPw({ ...showPw, new: !showPw.new })}>
                      {showPw.new ? icons.eyeOff : icons.eye}
                    </button>
                  </div>
                  <div className="sg-pw-bar-wrap">
                    <div className="sg-pw-bar" style={{ width: strength.pct || "0", background: strength.color || "transparent" }} />
                  </div>
                  <p className="sg-hint">{pwForm.newPassword ? strength.label : "Enter a new password"}</p>
                </div>

                <div className="sg-form-group">
                  <label className="sg-label">Confirm new password</label>
                  <div className="sg-pw-wrap">
                    <input
                      className="sg-input"
                      type={showPw.confirm ? "text" : "password"}
                      placeholder="Repeat new password"
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="sg-eye-btn"
                      onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}>
                      {showPw.confirm ? icons.eyeOff : icons.eye}
                    </button>
                  </div>
                </div>

                <button type="submit" className="sg-btn sg-btn--gold sg-btn--full">Update password</button>
              </form>
            </section>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activePanel === "notifications" && (
            <section>
              <h1 className="sg-panel-title">Notifications</h1>
              <p className="sg-panel-sub">Manage how you stay updated on your travels</p>

              <div className="sg-section-label">Notification Channels</div>
              <div className="sg-card">
                {[
                  { key: "emailNotifications", label: "Email notifications", desc: "Receive updates via email" },
                ].map((item) => (
                  <ToggleRow key={item.key} label={item.label} desc={item.desc}
                    on={prefs[item.key]} onChange={() => handlePrefChange(item.key)} />
                ))}
              </div>

              <div className="sg-section-label">Trip & Travel Activity</div>
              <div className="sg-card">
                {[
                  { key: "tripUpdates",        label: "Trip updates",            desc: "Changes, new activity, and milestones on your trips" },
                  { key: "friendRequests",     label: "Friend requests",         desc: "When someone sends you a friend request" },
                  { key: "tripInviteNotifications", label: "Trip invitations", desc: "When someone invites you to join their trip" },
                ].map((item) => (
                  <ToggleRow key={item.key} label={item.label} desc={item.desc}
                    on={prefs[item.key]} onChange={() => handlePrefChange(item.key)} />
                ))}
              </div>
            </section>
          )}

          {/* ── APPEARANCE ── */}
          {activePanel === "appearance" && (
            <section>
              <h1 className="sg-panel-title">Appearance</h1>
              <p className="sg-panel-sub">Customize how the app looks and feels</p>

              <div className="sg-section-label">Theme</div>
              <div className="sg-theme-group">
                <button
                  type="button"
                  className={`sg-theme-btn sg-theme-btn--light ${!prefs.darkMode ? "sg-theme-btn--active" : ""}`}
                  onClick={() => handlePrefChange("darkMode")}
                >
                  {icons.sun}
                  Light
                </button>
                <button
                  type="button"
                  className={`sg-theme-btn sg-theme-btn--dark ${prefs.darkMode ? "sg-theme-btn--active" : ""}`}
                  onClick={() => handlePrefChange("darkMode")}
                >
                  {icons.moon}
                  Dark
                </button>
              </div>

              <div className="sg-card">
                <ToggleRow 
                  label="Dark mode" 
                  desc="Use dark theme throughout the application"
                  on={prefs.darkMode} 
                  onChange={() => handlePrefChange("darkMode")} 
                />
              </div>
            </section>
          )}

          {/* ── PRIVACY ── */}
          {activePanel === "privacy" && (
            <section>
              <h1 className="sg-panel-title">Privacy</h1>
              <p className="sg-panel-sub">Control who can see your information</p>

              <div className="sg-card">
                {[
                  { key: "publicProfile",      label: "Public profile",        desc: "Anyone can find and view your profile" },
                  { key: "searchableByEmail",  label: "Searchable by email",   desc: "Others can find you using your email" },
                  { key: "showOnlineStatus",   label: "Show online status",    desc: "Friends see when you're active" },
                  { key: "shareTripActivity",  label: "Share trip activity",   desc: "Allow friends to see your trip history" },
                ].map((item) => (
                  <ToggleRow key={item.key} label={item.label} desc={item.desc}
                    on={prefs[item.key]} onChange={() => handlePrefChange(item.key)} />
                ))}
              </div>

              <div className="sg-danger-zone">
                <div className="sg-danger-title">Danger zone</div>
                <p className="sg-danger-desc">
                  Permanently delete your account and all associated data.
                  This action cannot be reversed or undone.
                </p>
                <button className="sg-btn sg-btn--danger" onClick={handleDeleteAccount}>
                  Delete my account
                </button>
              </div>
            </section>
          )}

          {/* ── SECURITY ── */}
          {activePanel === "security" && (
            <section>
              <h1 className="sg-panel-title">Security</h1>
              <p className="sg-panel-sub">Monitor and protect access to your account</p>

              <div className="sg-section-label">Authentication</div>
              <div className="sg-card">
                <div className="sg-sec-row">
                  <div className="sg-sec-icon" style={{ background: "#1a0a0a" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#c05050" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="7.5" width="10" height="7" rx="2" />
                      <path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="sg-sec-label">Two-factor authentication</div>
                    <div className="sg-sec-sub">Adds an extra layer of protection at login</div>
                  </div>
                  <span className="sg-badge sg-badge--red">Not enabled</span>
                  <button className="sg-btn sg-btn--outline" style={{ fontSize: 12, padding: "6px 12px" }}>Enable</button>
                </div>
                <div className="sg-sec-row">
                  <div className="sg-sec-icon" style={{ background: "#1e1a0a" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#c8b882" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="8" cy="8" r="5.5" />
                      <path d="M8 5.5v3l2 1.5" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="sg-sec-label">Last login</div>
                    <div className="sg-sec-sub">
                      {lastLoginDate 
                        ? lastLoginDate.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: lastLoginDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })
                        : "No login records"
                      }
                    </div>
                  </div>
                  <span className="sg-badge sg-badge--gold">{lastLoginDate ? "Active" : "New"}</span>
                </div>
              </div>

              <div className="sg-section-label">Active sessions</div>
              <div className="sg-card">
                {lastLoginDate && (
                  <div className="sg-sec-row">
                    <div className="sg-sec-icon" style={{ background: "#1e1a0a" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#c8b882" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="2" y="3" width="12" height="9" rx="1.5" />
                        <path d="M5.5 14.5h5" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="sg-sec-label">Current session</div>
                      <div className="sg-sec-sub">
                        Browser · {lastLoginDate ? lastLoginDate.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: lastLoginDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "Active"}
                      </div>
                    </div>
                    <span className="sg-badge sg-badge--green">Active now</span>
                  </div>
                )}
                {!lastLoginDate && (
                  <div style={{ padding: "20px 16px", textAlign: "center", color: "#5a5a70" }}>
                    No active sessions
                  </div>
                )}
              </div>

              <div className="sg-section-label">Recovery options</div>
              <div className="sg-card sg-recovery-card">
                {recoveryComplete && !showSecurityQuestionEditor ? (
                  <div className="sg-recovery-complete">
                    <div className="sg-recovery-complete-icon">✓</div>
                    <div className="sg-recovery-complete-body">
                      <div className="sg-recovery-complete-title">
                        Security questions set up
                      </div>
                      <div className="sg-recovery-complete-desc">
                        Your account recovery questions are complete. You have {savedQuestionCount} saved question{savedQuestionCount !== 1 ? "s" : ""}.
                      </div>
                      <div className="sg-recovery-complete-note">
                        Saved answers are hidden for your security.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="sg-btn sg-btn--outline"
                      onClick={() => setShowSecurityQuestionEditor(true)}
                    >
                      Manage
                    </button>
                  </div>
                ) : (
                  <div className="sg-recovery-editor">
                    <div className="sg-sec-label" style={{ marginBottom: "8px" }}>
                      Set up security questions
                    </div>
                    <div className="sg-sec-sub" style={{ marginBottom: "16px" }}>
                      Choose at least 2 questions to help recover your account.
                    </div>
                    <div className="sg-question-list">
                      {allSecurityQuestions.slice(0, 5).map((q) => {
                        const isSaved = savedSecurityQuestionIds.includes(String(q.id));
                        const isSelected =
                          securityAnswers[q.id] !== undefined &&
                          securityAnswers[q.id] !== "saved";
                        return (
                          <div
                            key={q.id}
                            className={`sg-question-item ${
                              isSaved ? "sg-question-item--saved" : ""
                            }`}
                          >
                            {isSaved ? (
                              <div className="sg-question-saved">
                                <div className="sg-question-check">✓</div>
                                <div>
                                  <div className="sg-question-title">
                                    {q.question}
                                  </div>
                                  <div className="sg-question-status">Saved</div>
                                </div>
                              </div>
                            ) : (
                              <label className="sg-question-editable">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSecurityAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: "",
                                      }));
                                    } else {
                                      const updated = { ...securityAnswers };
                                      delete updated[q.id];
                                      setSecurityAnswers(updated);
                                    }
                                  }}
                                />
                                <div className="sg-question-content">
                                  <div className="sg-question-title">
                                    {q.question}
                                  </div>
                                  {isSelected && (
                                    <input
                                      type="text"
                                      value={securityAnswers[q.id] || ""}
                                      onChange={(e) =>
                                        setSecurityAnswers((prev) => ({
                                          ...prev,
                                          [q.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Your answer..."
                                      className="sg-question-input"
                                    />
                                  )}
                                </div>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="sg-recovery-count">
                      <span>
                        Saved: <strong>{savedQuestionCount}</strong>
                      </span>
                      <span>
                        New: <strong>{newQuestionCount}</strong>
                      </span>
                    </div>
                    <div className="sg-recovery-actions">
                      {recoveryComplete && (
                        <button
                          type="button"
                          className="sg-btn sg-btn--outline"
                          onClick={() => setShowSecurityQuestionEditor(false)}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={handleSaveSecurityQuestions}
                        disabled={savingSecurityQuestions || newQuestionCount === 0}
                        className="sg-btn sg-btn--gold"
                      >
                        {savingSecurityQuestions
                          ? "Saving..."
                          : savedQuestionCount > 0
                          ? "Add More Security Questions"
                          : "Save Security Questions"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>

        {/* Delete Account Confirmation Modal */}
        {deleteModal.open && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              background: "var(--surface-primary)",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
            }}>
              <h2 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontSize: "18px", fontWeight: 600 }}>
                Enter your password
              </h2>
              <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: "14px" }}>
                For security, please confirm your password to delete your account permanently.
              </p>

              {deleteModal.error && (
                <div style={{
                  background: "rgba(192, 80, 80, 0.1)",
                  color: "var(--status-error)",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}>
                  {deleteModal.error}
                </div>
              )}

              <input
                type="password"
                placeholder="Enter your password"
                value={deleteModal.password}
                onChange={(e) => setDeleteModal(prev => ({ ...prev, password: e.target.value, error: "" }))}
                onKeyPress={(e) => e.key === "Enter" && !deleteModal.loading && handleConfirmDelete()}
                disabled={deleteModal.loading}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: "16px",
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setDeleteModal({ open: false, password: "", error: "", loading: false })}
                  disabled={deleteModal.loading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--surface-secondary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "6px",
                    cursor: deleteModal.loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: deleteModal.loading ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteModal.loading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--status-error)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: deleteModal.loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    opacity: deleteModal.loading ? 0.7 : 1,
                  }}
                >
                  {deleteModal.loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}