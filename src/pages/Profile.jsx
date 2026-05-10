import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useScrollbarExpand from "../hooks/useScrollbarExpand";
import {
  Edit3,
  MapPin,
  Users,
  Wallet,
  Gem,
  Sunrise,
  Mountain,
  Zap,
  Mail,
  Calendar,
  Home,
  Building2,
  Tent,
  Check,
  X,
  ChevronRight,
  Clock,
  Image,
  Tag,
} from "lucide-react";
import SuggestPeople from "../components/SuggestPeople";
import EditModal from "../components/EditModal";

// ─── helpers ────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
const getApiUrl = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
  return backendUrl;
};
const token = () => localStorage.getItem("access_token");
const avatar = (url) =>
  url ? (url.startsWith("http") ? url : `${getApiUrl()}${url}`) : null;

const FONTS = {
  display: "Playfair Display, Georgia, serif",
  body: "DM Sans, system-ui, sans-serif",
  mono: "DM Mono, monospace",
};

const STAT_LABELS = {
  trips: "Trips",
  buddies: "Buddies",
  rating: "Rating",
};

const TAB_NAMES = ["overview", "preferences", "suggestions"];

const MODAL_TITLE = "Edit Profile";

const FORM_LABELS = {
  style: "Style",
  pace: "Pace",
  stays: "Stays",
  accommodation: "Accommodation",
  vibeScores: "Vibe Scores",
  budgetLabel: "Budget to Luxury",
  chillLabel: "Chill to Extreme",
  soloLabel: "Solo to Group",
  budgetLeft: "Budget",
  budgetRight: "Luxury",
  chillLeft: "Chill",
  chillRight: "Extreme",
  soloLeft: "Solo",
  soloRight: "Group",
  account: "Account",
  email: "Email",
  joined: "Joined",
  friends: "Friends",
  interests: "Travel Interests",
};

const KYC_MESSAGES = {
  verified: "✓ Verified User",
  verifiedText: "Your identity is verified. You have full access to all features and can interact with trips, chat, and more.",
  rejected: "Verification Rejected",
  rejectedText: "Your KYC verification was rejected. Please submit again.",
  pending: "Verification Pending",
  pendingText: "Your KYC submission is under review by our admin team. You will be notified within 24-48 hours.",
  register: "Register for Full Access",
  registerText: "Verify your identity with KYC to unlock full access to all features.",
  resubmit: "Resubmit",
  viewStatus: "View Status",
  registerBtn: "Register",
};

const BUTTONS = {
  editProfile: "Edit profile",
};

const PROFILE_MESSAGES = {
  loadingError: "Could not load profile.",
  defaultName: "Traveller",
};

const EMPTY_STATES = {
  noFriends: "No friends yet",
  findBuddies: "Find travel buddies to connect",
  noInterests: "No travel interests added yet",
  addInterests: "Add your interests in Edit Profile to help find compatible travel buddies",
};

const ERROR_BOUNDARY = {
  title: "Something went wrong",
  message: "Please try refreshing the page",
  refresh: "Refresh Page",
};

// ─── icon helpers ────────────────────────────────────────────────────────────
const StyleIcon = ({ style }) => {
  const map = { budget: [Wallet, "var(--accent)"], luxury: [Gem, "var(--text)"], adventure: [Mountain, "var(--accent)"] };
  const [Icon, color] = map[style] || [Wallet, "var(--text-light)"];
  return <Icon style={{ color, width: 20, height: 20 }} />;
};
const PaceIcon = ({ pace }) => {
  const map = { relaxed: [Sunrise, "var(--accent)"], moderate: [Zap, "var(--text)"], fast_paced: [Zap, "var(--accent)"] };
  const [Icon, color] = map[pace] || [Zap, "var(--text-light)"];
  return <Icon style={{ color, width: 20, height: 20 }} />;
};
const AccommIcon = ({ accomm }) => {
  const map = { hostel: [Building2, "var(--accent)"], hotel: [Building2, "var(--text)"], inn: [Home, "var(--accent)"], camping: [Tent, "var(--text)"] };
  const [Icon, color] = map[accomm] || [Home, "var(--text-light)"];
  return <Icon style={{ color, width: 20, height: 20 }} />;
};

// ─── vibe bar ────────────────────────────────────────────────────────────────
function VibeBar({ label, value, left, right }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 500, color: "var(--text-lighter)" }}>{label}</span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: "var(--accent)" }}>{value}/10</span>
      </div>
      <div style={{ height: 3, width: "100%", borderRadius: 99, background: "var(--track-bg)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: "linear-gradient(to right, var(--accent-dark), var(--accent), var(--accent-light))",
          width: `${value * 10}%`, transition: "width 0.4s"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-faintest)", fontFamily: FONTS.body }}>
        <span>{left}</span><span>{right}</span>
      </div>
    </div>
  );
}

// ─── pref row ────────────────────────────────────────────────────────────────
function PrefRow({ label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "0.5px solid var(--border-light)",
    }}>
      <span style={{ fontFamily: FONTS.body, fontSize: 14, color: "var(--text-lighter)" }}>{label}</span>
      <span style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>
        {value || <span style={{ color: "var(--text-faintest)", fontWeight: 400 }}>Not set</span>}
      </span>
    </div>
  );
}

// ─── main profile page ───────────────────────────────────
function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [friends, setFriends] = useState([]);
  const [joinedTrips, setJoinedTrips] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [userPhotos, setUserPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Fetch user profile
  const fetchProfile = () => {
    fetch(`${API}/users/me/`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => {
        // Normalize interests from various possible field names
        const interests = d.interests || d.tags || d.travel_tags || d.preference_tags || [];
        d.interests = Array.isArray(interests) ? interests : [];
        setProfile(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch profile:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchFriends = () => {
      fetch(`${API}/api/users/friends/`, { headers: { Authorization: `Bearer ${token()}` } })
        .then(r => r.json()).then(d => setFriends(d.friends || []))
        .catch(() => setFriends([]));
    };
    fetchFriends();
    const i2 = setInterval(fetchFriends, 5000);
    return () => clearInterval(i2);
  }, []);

  useEffect(() => {
    const fetchJoinedTrips = () => {
      fetch(`${API}trips/`, { headers: { Authorization: `Bearer ${token()}` } })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(d => {
          const myTrips = (d.results || d || []).filter(trip => {
            const isParticipant = trip.participants?.some(p => p.id === profile?.id) || trip.creator?.id === profile?.id;
            return isParticipant && trip.is_completed;
          });
          setJoinedTrips(myTrips);
        })
        .catch(err => { console.log("Could not fetch trips:", err.message); setJoinedTrips([]); });
    };
    if (profile?.id) {
      fetchJoinedTrips();
      const interval = setInterval(fetchJoinedTrips, 30000);
      return () => clearInterval(interval);
    }
  }, [profile?.id]);

  useEffect(() => {
    const fetchUserPhotos = async () => {
      setPhotosLoading(true);
      try {
        const res = await fetch(`${API}trips/`, { headers: { Authorization: `Bearer ${token()}` } });
        const trips = await res.json();
        const tripsList = Array.isArray(trips) ? trips : trips.results || [];
        const photos = [];
        for (const trip of tripsList) {
          if (new Date(trip.end_date) < new Date()) {
            try {
              const photoRes = await fetch(`${API}trips/${trip.id}/photos/`, { headers: { Authorization: `Bearer ${token()}` } });
              if (photoRes.ok) {
                const photoData = await photoRes.json();
                const tripPhotos = Array.isArray(photoData) ? photoData : photoData.results || [];
                tripPhotos.forEach(photo => photos.push({ ...photo, trip }));
              }
            } catch (e) { console.error(`Failed to fetch photos for trip ${trip.id}:`, e); }
          }
        }
        setUserPhotos(photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (err) { console.error("Failed to fetch user photos:", err); }
      finally { setPhotosLoading(false); }
    };
    if (profile) fetchUserPhotos();
  }, [profile]);

  /* ── Enable scrollbar expansion on hover ── */
  useScrollbarExpand(".profile-sidebar");

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "1.5px solid var(--border)",
        borderTopColor: "var(--accent)",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );

  if (!profile) return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text-lighter)", fontFamily: FONTS.body }}>
      {PROFILE_MESSAGES.loadingError}
    </div>
  );

  const pic = avatar(profile.profile_picture);
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username || PROFILE_MESSAGES.defaultName;
  const initial  = fullName[0]?.toUpperCase() || "T";
  const handle   = profile.username || profile.email?.split("@")[0];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div className="profile-root" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

        {/* ── Cover banner ── */}
        <div style={{ position: "relative", height: 208, width: "100%", background: "var(--cover-bg)", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "var(--cover-gradient)" }} />
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.025 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ch" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--pattern-color)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ch)" />
          </svg>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: "linear-gradient(to top, var(--bg), transparent)" }} />
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, paddingTop: 24, paddingBottom: 24 }} className="profile-grid">

            {/* ── Main (left 2 cols) ── */}
            <div className="profile-main">

              {/* Avatar + Edit row */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: -52, marginBottom: 16 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    position: "absolute", inset: -2.5, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 40%, var(--accent-light) 100%)",
                  }} />
                  <div style={{
                    position: "relative", width: 100, height: 100, borderRadius: "50%",
                    overflow: "hidden", background: "var(--avatar-bg)",
                    border: "3px solid var(--bg)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {pic
                      ? <img src={pic} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                      : <span style={{ fontSize: 36, fontWeight: 700, color: "var(--accent)", fontFamily: FONTS.display }}>{initial}</span>
                    }
                  </div>
                  <span style={{
                    position: "absolute", bottom: 8, right: 8,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#4ade80", border: "2px solid var(--bg)",
                  }} />
                </div>

                <button
                  onClick={() => setEditing(true)}
                  style={{
                    fontFamily: FONTS.body,
                    marginBottom: 4,
                    borderRadius: 12,
                    border: "0.5px solid var(--border-card)",
                    background: "var(--surface)",
                    padding: "8px 20px",
                    fontSize: 13, fontWeight: 600,
                    color: "var(--text)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border-card)"; }}
                >
                  <Edit3 style={{ width: 14, height: 14 }} /> {BUTTONS.editProfile}
                </button>
              </div>

              {/* Name / handle / bio */}
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, fontFamily: FONTS.display, margin: 0 }}>{fullName}</h1>
                <p style={{ fontSize: 13, color: "var(--accent-muted)", marginTop: 2, fontFamily: FONTS.mono }}>@{handle}</p>
                {profile.location && (
                  <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-lighter)", marginTop: 6, fontFamily: FONTS.body }}>
                    <MapPin style={{ width: 14, height: 14, color: "var(--accent-muted)" }} />{profile.location}
                  </p>
                )}
                {profile.bio && (
                  <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, fontFamily: FONTS.body }}>{profile.bio}</p>
                )}
              </div>

              {/* ── Stats ── */}
              <div style={{ display: "flex", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)", marginBottom: 24 }}>
                {[
                  { value: joinedTrips.length,                                label: STAT_LABELS.trips   },
                  { value: friends.length,                                    label: STAT_LABELS.buddies },
                  { value: profile.rating ? profile.rating.toFixed(1) : "—", label: STAT_LABELS.rating  },
                ].map(({ value, label }, i) => (
                  <div key={label} style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "16px 8px", gap: 2,
                    borderRight: i < 2 ? "0.5px solid var(--border)" : "none",
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: FONTS.display }}>{value}</span>
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-lighter)", fontFamily: FONTS.body }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* ── Tabs ── */}
              <div style={{ display: "flex", borderBottom: "0.5px solid var(--border)", marginBottom: 24, margin: "0 -4px 24px" }}>
                {TAB_NAMES.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: "12px 4px",
                      fontSize: 11, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.15em",
                      fontFamily: FONTS.body,
                      background: "transparent", border: "none",
                      borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                      marginBottom: -1,
                      color: activeTab === tab ? "var(--accent)" : "var(--text-faintest)",
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = "var(--text-lighter)"; }}
                    onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = "var(--text-faintest)"; }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* ── Overview tab ── */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 80 }}>

                  {/* Trip Photos */}
                  {userPhotos.length > 0 && (
                    <div style={{ borderRadius: 16, background: "var(--surface)", border: "0.5px solid var(--border-card)", overflow: "hidden" }}>
                      <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-lighter)", padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Image style={{ width: 16, height: 16 }} /> Trip Photos
                      </p>
                      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                        {userPhotos.map((photo) => (
                          <div key={photo.id} style={{
                            borderRadius: 10, overflow: "hidden",
                            border: "0.5px solid var(--border-card)",
                            background: "var(--surface)",
                            cursor: "pointer",
                            transition: "border-color 0.2s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-muted)"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-card)"}
                          >
                            <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", background: "var(--img-placeholder-bg)" }}>
                              <img src={photo.image} alt={photo.caption || "trip photo"} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                              />
                            </div>
                            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                              {photo.caption && <p style={{ fontFamily: FONTS.body, fontSize: 14, color: "var(--text-muted)", margin: 0 }}>{photo.caption}</p>}
                              {photo.trip && (
                                <Link to={`/trip/${photo.trip.id}`} style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s" }}
                                  onMouseEnter={e => e.currentTarget.style.color = "var(--accent-light)"}
                                  onMouseLeave={e => e.currentTarget.style.color = "var(--accent)"}
                                >
                                  <MapPin style={{ width: 12, height: 12 }} />
                                  {photo.trip.destination?.name || "Trip"} • {new Date(photo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account */}
                  <div style={{ borderRadius: 16, background: "var(--surface)", border: "0.5px solid var(--border-card)", overflow: "hidden" }}>
                    <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-lighter)", padding: "16px 20px 8px" }}>{FORM_LABELS.account}</p>
                    <div style={{ padding: "0 20px 8px" }}>
                      {[
                        { icon: <Mail style={{ width: 16, height: 16, color: "var(--accent-muted)" }} />, label: FORM_LABELS.email, value: profile.email },
                        { icon: <Calendar style={{ width: 16, height: 16, color: "var(--accent-muted)" }} />, label: FORM_LABELS.joined, value: profile.date_joined ? new Date(profile.date_joined).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—" },
                      ].map(({ icon, label, value }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "0.5px solid var(--border-light)" }}>
                          {icon}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: FONTS.body, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-faintest)", marginBottom: 2 }}>{label}</p>
                            <p style={{ fontFamily: FONTS.body, fontSize: 14, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KYC Status */}
                  <div style={{
                    borderRadius: 16, padding: 20, overflow: "hidden",
                    border: profile.status === "approved" ? "2px solid var(--kyc-approved-border)"
                      : profile.status === "rejected" ? "2px solid var(--kyc-rejected-border)"
                      : profile.status === "pending"  ? "2px solid var(--kyc-pending-border)"
                      : "2px solid var(--accent-border)",
                    background: profile.status === "approved" ? "var(--kyc-approved-bg)"
                      : profile.status === "rejected" ? "var(--kyc-rejected-bg)"
                      : profile.status === "pending"  ? "var(--kyc-pending-bg)"
                      : "var(--accent-bg)",
                    transition: "border-color 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          {profile.status === "approved" ? <Check style={{ width: 20, height: 20, color: "var(--kyc-approved-icon)" }} />
                            : profile.status === "rejected" ? <X style={{ width: 20, height: 20, color: "var(--kyc-rejected-icon)" }} />
                            : profile.status === "pending"  ? <Clock style={{ width: 20, height: 20, color: "var(--kyc-pending-icon)" }} />
                            : <Gem style={{ width: 20, height: 20, color: "var(--accent)" }} />}
                          <p style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, margin: 0,
                            color: profile.status === "approved" ? "var(--kyc-approved-text)"
                              : profile.status === "rejected" ? "var(--kyc-rejected-text)"
                              : profile.status === "pending" ? "var(--kyc-pending-text)"
                              : "var(--accent)"
                          }}>
                            {profile.status === "approved" ? KYC_MESSAGES.verified
                              : profile.status === "rejected" ? KYC_MESSAGES.rejected
                              : profile.status === "pending" ? KYC_MESSAGES.pending
                              : KYC_MESSAGES.register}
                          </p>
                        </div>
                        <p style={{ fontFamily: FONTS.body, fontSize: 12, margin: 0, lineHeight: 1.6,
                          color: profile.status === "approved" ? "var(--kyc-approved-muted)"
                            : profile.status === "rejected" ? "var(--kyc-rejected-muted)"
                            : profile.status === "pending" ? "var(--kyc-pending-muted)"
                            : "var(--text-muted)"
                        }}>
                          {profile.status === "approved" ? KYC_MESSAGES.verifiedText
                            : profile.status === "rejected"
                            ? (profile.rejection_reason ? `Rejected: ${profile.rejection_reason}. ${KYC_MESSAGES.rejectedText.split(". ")[1]}` : KYC_MESSAGES.rejectedText)
                            : profile.status === "pending" ? KYC_MESSAGES.pendingText
                            : KYC_MESSAGES.registerText}
                        </p>
                      </div>
                      {profile.status !== "approved" && (
                        <Link to="/kyc" style={{
                          fontFamily: FONTS.body,
                          padding: "8px 16px", borderRadius: 12,
                          background: "linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))", color: "var(--btn-text)",
                          fontWeight: 600, fontSize: 12, textDecoration: "none",
                          flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                          transition: "background 0.2s",
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(90deg, var(--accent-dark), var(--accent-light), var(--accent-light))"}
                          onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))"}
                        >
                          {profile.status === "rejected" ? KYC_MESSAGES.resubmit
                            : profile.status === "pending" ? KYC_MESSAGES.viewStatus
                            : KYC_MESSAGES.registerBtn}
                          <ChevronRight style={{ width: 14, height: 14 }} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Preferences tab ── */}
              {activeTab === "preferences" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 80 }}>
                  <div style={{ borderRadius: 16, background: "var(--surface)", border: "0.5px solid var(--border-card)", padding: "0 20px" }}>
                    <PrefRow label={FORM_LABELS.style}         value={profile.travel_style} />
                    <PrefRow label={FORM_LABELS.pace}          value={profile.pace?.replace("_", "-")} />
                    <PrefRow label={FORM_LABELS.accommodation} value={profile.accommodation_preference} />
                  </div>

                  <div style={{ borderRadius: 16, background: "var(--surface)", border: "0.5px solid var(--border-card)", padding: 20 }}>
                    <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-lighter)", marginBottom: 20 }}>{FORM_LABELS.vibeScores}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <VibeBar label={FORM_LABELS.budgetLabel} value={profile.budget_level    ?? 5} left={FORM_LABELS.budgetLeft} right={FORM_LABELS.budgetRight} />
                      <VibeBar label={FORM_LABELS.chillLabel}  value={profile.adventure_level ?? 5} left={FORM_LABELS.chillLeft}  right={FORM_LABELS.chillRight}  />
                      <VibeBar label={FORM_LABELS.soloLabel}   value={profile.social_level    ?? 5} left={FORM_LABELS.soloLeft}   right={FORM_LABELS.soloRight}   />
                    </div>
                  </div>

                  {/* Interests/Tags - Always show section */}
                  <div style={{ borderRadius: 16, background: "var(--surface)", border: "0.5px solid var(--border-card)", padding: 20 }}>
                    <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-lighter)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                      <Tag style={{ width: 14, height: 14 }} /> {FORM_LABELS.interests}
                    </p>
                    {profile.interests && profile.interests.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {profile.interests.map((interest) => (
                          <div
                            key={interest.id || interest.name}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 14px",
                              borderRadius: 20,
                              background: "var(--tag-bg)",
                              color: "var(--tag-text)",
                              fontSize: 12,
                              fontWeight: 500,
                              fontFamily: FONTS.body,
                              border: "0.5px solid var(--tag-border)",
                              transition: "background 0.2s, border-color 0.2s",
                            }}
                          >
                            {interest.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 8 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Tag style={{ width: 20, height: 20, color: "var(--text-faintest)" }} />
                        </div>
                        <p style={{ fontFamily: FONTS.body, fontSize: 12, color: "var(--text-faintest)", textAlign: "center", margin: "4px 0" }}>{EMPTY_STATES.noInterests}</p>
                        <p style={{ fontFamily: FONTS.body, fontSize: 10, color: "var(--text-faintest)", textAlign: "center", opacity: 0.7, maxWidth: 280 }}>{EMPTY_STATES.addInterests}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Suggestions tab ── */}
              {activeTab === "suggestions" && (
                <div className="suggestions-full" style={{ paddingBottom: 80 }}>
                  <SuggestPeople currentUserId={profile.id} />
                </div>
              )}
            </div>

            {/* ── Friends sidebar (right) - Hidden during suggestions tab ── */}
            {activeTab !== "suggestions" && (
            <div className="profile-sidebar">
              <div style={{
                position: "sticky", top: 80,
                borderRadius: 16, background: "var(--surface)",
                border: "0.5px solid var(--border-card)", padding: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-lighter)" }}>
                    {FORM_LABELS.friends}{" "}
                    {friends.length > 0 && <span style={{ color: "var(--accent)" }}>({friends.length})</span>}
                  </p>
                </div>

                {friends.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {friends.map(friend => {
                      const name = friend.first_name && friend.last_name
                        ? `${friend.first_name} ${friend.last_name}` : friend.username;
                      const friendAvatar = avatar(friend.profile_picture);
                      return (
                        <Link key={friend.id} to={`/user/${friend.username}`} style={{ textDecoration: "none" }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: 10, borderRadius: 12,
                            transition: "background 0.15s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{
                              width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
                              overflow: "hidden", background: "var(--avatar-bg)",
                              border: "0.5px solid var(--border-card)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {friendAvatar
                                ? <img src={friendAvatar} alt={friend.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                                : <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", fontFamily: FONTS.display }}>{friend.username[0].toUpperCase()}</span>
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{name}</p>
                              <p style={{ fontFamily: FONTS.mono, fontSize: 10, color: "var(--text-faintest)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>@{friend.username}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 8 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users style={{ width: 20, height: 20, color: "var(--text-faintest)" }} />
                    </div>
                    <p style={{ fontFamily: FONTS.body, fontSize: 12, color: "var(--text-faintest)", textAlign: "center" }}>{EMPTY_STATES.noFriends}</p>
                    <p style={{ fontFamily: FONTS.body, fontSize: 10, color: "var(--text-faintest)", textAlign: "center", opacity: 0.7 }}>{EMPTY_STATES.findBuddies}</p>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {editing && (
          <EditModal
            profile={profile}
            onClose={() => setEditing(false)}
            onSaved={updated => {
              // Immediately update state with returned data
              setProfile(p => ({
                ...p,
                ...updated,
                // Ensure interests is always an array
                interests: Array.isArray(updated.interests) ? updated.interests : [],
              }));
              
              // Force full refresh to guarantee DB sync
              setTimeout(() => {
                fetch(`${API}users/me/`, { headers: { Authorization: `Bearer ${token()}` } })
                  .then(r => r.json())
                  .then(d => {
                    // Normalize interests
                    d.interests = Array.isArray(d.interests) ? d.interests : [];
                    console.log("✅ Profile refreshed with interests:", d.interests);
                    setProfile(d);
                    // Trigger recommendations refresh
                    window.dispatchEvent(new Event("profile-tags-updated"));
                  })
                  .catch(err => console.error("❌ Failed to refresh profile:", err));
              }, 300);
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── DARK MODE (default) ── */
        :root,
        [data-theme="dark"] {
          --bg:               #080808;
          --cover-bg:         #0c0c0c;
          --cover-gradient:   radial-gradient(ellipse 70% 100% at 15% 50%, rgba(201,168,76,0.07) 0%, transparent 65%),
                              radial-gradient(ellipse 50% 80% at 85% 60%, rgba(201,168,76,0.04) 0%, transparent 60%);
          --pattern-color:    rgba(201,168,76,0.3);
          --text:             #ffffff;
          --text-muted:       rgba(255,255,255,0.65);
          --text-lighter:     rgba(255,255,255,0.50);
          --text-faintest:    rgba(255,255,255,0.30);
          --accent:           #C9A84C;
          --accent-light:     #e8c96d;
          --accent-dark:      #8b6914;
          --accent-muted:     rgba(201,168,76,0.6);
          --accent-bg:        rgba(201,168,76,0.10);
          --accent-border:    rgba(201,168,76,0.35);
          --border:           rgba(255,255,255,0.12);
          --border-card:      rgba(255,255,255,0.10);
          --border-light:     rgba(255,255,255,0.08);
          --surface:          rgba(255,255,255,0.04);
          --surface-hover:    rgba(255,255,255,0.08);
          --avatar-bg:        #1a1a1a;
          --img-placeholder-bg: rgba(255,255,255,0.05);
          --track-bg:         rgba(255,255,255,0.12);
          --btn-text:         #ffffff;
          
          /* Tag styles */
          --tag-bg:           rgba(201,168,76,0.15);
          --tag-text:         #e8c96d;
          --tag-border:       rgba(201,168,76,0.3);
          
          /* KYC status colors */
          --kyc-approved-bg:      rgba(74,222,128,0.10);
          --kyc-approved-border:  rgba(74,222,128,0.35);
          --kyc-approved-icon:    #4ade80;
          --kyc-approved-text:    #4ade80;
          --kyc-approved-muted:   rgba(74,222,128,0.75);
          
          --kyc-rejected-bg:      rgba(239,68,68,0.10);
          --kyc-rejected-border:  rgba(239,68,68,0.35);
          --kyc-rejected-icon:    #ef4444;
          --kyc-rejected-text:    #ef4444;
          --kyc-rejected-muted:   rgba(239,68,68,0.75);
          
          --kyc-pending-bg:       rgba(251,191,36,0.10);
          --kyc-pending-border:   rgba(251,191,36,0.35);
          --kyc-pending-icon:     #fbbf24;
          --kyc-pending-text:     #fbbf24;
          --kyc-pending-muted:    rgba(251,191,36,0.75);
        }

        /* ── LIGHT MODE - Warm orange/cream theme ── */
        [data-theme="light"] {
          --bg:               #f4f0e8;
          --cover-bg:         #f4f0e8;
          --cover-gradient:   radial-gradient(
                              ellipse 70% 100% at 15% 45%,
                              rgba(255, 106, 0, 0.12) 0%,
                              transparent 65%
                            ),
                            radial-gradient(
                              ellipse 50% 80% at 85% 60%,
                              rgba(255, 149, 42, 0.10) 0%,
                              transparent 60%
                            );
          --pattern-color:    rgba(255, 106, 0, 0.18);
          --text:             #15120d;
          --text-muted:       rgba(21, 18, 13, 0.70);
          --text-lighter:     #8893aa;
          --text-faintest:    rgba(136, 147, 170, 0.75);
          --accent:           #ff6a00;
          --accent-light:     #ff8a2a;
          --accent-dark:      #f45100;
          --accent-muted:     rgba(255, 106, 0, 0.70);
          --accent-bg:        rgba(255, 106, 0, 0.10);
          --accent-border:    rgba(255, 106, 0, 0.28);
          --border:           rgba(21, 18, 13, 0.10);
          --border-card:      rgba(21, 18, 13, 0.08);
          --border-light:     rgba(21, 18, 13, 0.06);
          --surface:          #ffffff;
          --surface-hover:    rgba(255, 106, 0, 0.06);
          --avatar-bg:        #fffaf4;
          --img-placeholder-bg: rgba(21, 18, 13, 0.05);
          --track-bg:         rgba(21, 18, 13, 0.10);
          --btn-text:         #ffffff;
          
          /* Tag styles */
          --tag-bg:           rgba(255, 106, 0, 0.10);
          --tag-text:         #f45100;
          --tag-border:       rgba(255, 106, 0, 0.22);
          
          /* KYC status colors */
          --kyc-approved-bg:      rgba(34, 197, 94, 0.10);
          --kyc-approved-border:  rgba(34, 197, 94, 0.30);
          --kyc-approved-icon:    #16a34a;
          --kyc-approved-text:    #15803d;
          --kyc-approved-muted:   rgba(21, 128, 61, 0.75);
          
          --kyc-rejected-bg:      rgba(220, 38, 38, 0.10);
          --kyc-rejected-border:  rgba(220, 38, 38, 0.30);
          --kyc-rejected-icon:    #dc2626;
          --kyc-rejected-text:    #b91c1c;
          --kyc-rejected-muted:   rgba(185, 28, 28, 0.75);
          
          --kyc-pending-bg:       rgba(245, 158, 11, 0.12);
          --kyc-pending-border:   rgba(245, 158, 11, 0.30);
          --kyc-pending-icon:     #f59e0b;
          --kyc-pending-text:     #d97706;
          --kyc-pending-muted:    rgba(217, 119, 6, 0.75);
        }

        /* Better light mode polish */
        [data-theme="light"] .profile-root {
          background: linear-gradient(180deg, #f4f0e8 0%, #f7f2ea 45%, #f4f0e8 100%);
        }
        [data-theme="light"] .profile-root button {
          box-shadow: none;
        }
        [data-theme="light"] .profile-root [style*="background: var(--surface)"] {
          box-shadow: 0 14px 40px rgba(21, 18, 13, 0.045);
        }
        [data-theme="light"] .profile-root input,
        [data-theme="light"] .profile-root select,
        [data-theme="light"] .profile-root textarea {
          background: #ffffff;
          color: #15120d;
          border: 1px solid #ddd7ce;
          border-radius: 14px;
        }
        [data-theme="light"] .profile-root input:focus,
        [data-theme="light"] .profile-root select:focus,
        [data-theme="light"] .profile-root textarea:focus {
          outline: none;
          border-color: #ff6a00;
          box-shadow: 0 0 0 4px rgba(255, 106, 0, 0.12);
        }

        /* ── Grid layout ── */
        .profile-root * { box-sizing: border-box; }

        @media (min-width: 1024px) {
          .profile-grid {
            grid-template-columns: 2fr 1fr !important;
          }
          
          .profile-main {
            grid-column: 1;
          }
          
          .profile-sidebar {
            grid-column: 2;
          }
          
          /* Full width for suggestions tab */
          .profile-grid:has(.suggestions-full) {
            grid-template-columns: 1fr !important;
          }
          
          .suggestions-full {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </>
  );
}

// Error boundary wrapper
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Profile error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text)" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{ERROR_BOUNDARY.title}</h1>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>{ERROR_BOUNDARY.message}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "8px 24px", borderRadius: 10, background: "linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))", color: "var(--btn-text)", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              {ERROR_BOUNDARY.refresh}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ProfilePageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <ProfilePage />
    </ErrorBoundary>
  );
}