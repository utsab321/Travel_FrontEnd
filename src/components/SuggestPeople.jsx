import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, AlertCircle, UserPlus, X, ChevronRight, ChevronLeft, Gem } from "lucide-react";
import { apiFetch, getBaseUrl } from "../utils/api";

// ============================================
// CONSTANTS
// ============================================
const FONTS = {
  display: "Playfair Display, Georgia, serif",
  body: "DM Sans, system-ui, sans-serif",
  mono: "DM Mono, monospace",
};

const PALETTES = {
  dark: {
    primary: "#C9A84C",
    primaryHover: "#d4b85f",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.65)",
    bg: "rgba(255,255,255,0.04)",
  },
  light: {
    primary: "#ff6a00",
    primaryHover: "#ff8a2a",
    text: "#15120d",
    textMuted: "rgba(21, 18, 13, 0.70)",
    bg: "#ffffff",
  },
};

const getTheme = () => {
  return document.documentElement.getAttribute("data-theme") || "dark";
};

const useThemeColors = () => {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = getTheme();
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return PALETTES[theme];
};

const SCROLL_AMOUNT = 250; // Card width + gap

const MESSAGES = {
  loading: "Finding people for you...",
  noSuggestions: "No suggestions available yet",
  noSuggestionsHint: "Once more travelers join and verify their profiles, you'll see personalized recommendations",
  error: "Could not load suggestions",
  sendFriendRequest: "Could not send friend request: ",
  kycRequired: "KYC Verification Required",
  kycMessage: "To see personalized people suggestions and connect with travelers, you need to complete identity verification first.",
  profileIncomplete: "Complete Your Profile",
  profileMessage: "To get personalized recommendations, please fill in these details:",
};

const CAROUSEL_CSS = `
  .suggest-people-carousel::-webkit-scrollbar {
    display: none;
  }
  .suggest-people-carousel {
    -ms-overflow-style: none;
    scrollbar-width: none;
    scroll-behavior: smooth;
  }
  
  /* Carousel viewport - prevents overflow */
  .carousel-viewport {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    align-items: flex-start;
  }
  
  /* Carousel track - flex container */
  .carousel-track {
    display: flex;
    flex-wrap: nowrap;
    gap: 1rem;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    padding-bottom: 1rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .carousel-track::-webkit-scrollbar {
    display: none;
  }
  
  /* Card sizing - desktop: 4 cards, tablet: 2 cards, mobile: 1 card */
  .carousel-card {
    flex: 0 0 calc((100% - 3rem) / 4);
    min-width: 0;
    scroll-snap-align: start;
  }
  
  @media (max-width: 1024px) {
    .carousel-card {
      flex: 0 0 calc((100% - 1rem) / 2);
    }
  }
  
  @media (max-width: 640px) {
    .carousel-card {
      flex: 0 0 100%;
    }
  }
`;

// Skeleton Loading Card - EXACT MATCH to SuggestedUserCard dimensions
function SkeletonCard() {
  const C = useThemeColors();
  return (
    <div 
      className="group relative carousel-card rounded-2xl overflow-hidden border animate-pulse"
      style={{
        background: C.bg,
        borderColor: getTheme() === "light" ? "rgba(21, 18, 13, 0.10)" : "rgba(255, 255, 255, 0.10)",
        borderWidth: "0.5px",
      }}
    >
      {/* Dismiss Button skeleton */}
      <div
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex-shrink-0"
        style={{
          background: "rgba(201, 168, 76, 0.08)",
        }}
      />

      {/* Image placeholder - EXACT MATCH: h-56 */}
      <div 
        className="relative h-56 w-full"
        style={{ background: "rgba(201, 168, 76, 0.08)" }}
      />
      
      {/* Info section - EXACT MATCH: px-4 py-4 gap-3 */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Name skeleton - EXACT MATCH to h3 height */}
        <div className="h-6 rounded-lg" style={{ background: "rgba(201, 168, 76, 0.12)" }} />
        
        {/* Mutual friends skeleton - EXACT MATCH to conditional mutual friends display */}
        <div className="h-4 rounded-lg w-2/3" style={{ background: "rgba(201, 168, 76, 0.08)" }} />
        
        {/* Button skeleton - EXACT MATCH: h-10 py-2.5 rounded-xl */}
        <div className="h-10 rounded-xl" style={{ background: "rgba(201, 168, 76, 0.15)" }} />
        
        {/* View Profile skeleton - EXACT MATCH: py-2 rounded-lg text-xs */}
        <div className="h-9 rounded-lg" style={{ background: "rgba(201, 168, 76, 0.08)" }} />
      </div>
    </div>
  );
}

function SuggestedUserCard({ user, onAddFriend, onCancelRequest, onDismiss, isPending = false }) {
  const C = useThemeColors();
  const avatar = user.profile_picture?.startsWith("http")
    ? user.profile_picture
    : user.profile_picture ? `${getBaseUrl()}${user.profile_picture}` : null;

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ") || user.username || "Traveller";
  const initial = fullName[0]?.toUpperCase() || "T";

  // Calculate mutual friends (if available from API response)
  const mutualFriendsCount = user.mutual_friends_count || 0;

  return (
    <div 
      className="group relative carousel-card rounded-2xl overflow-hidden border hover:border-opacity-100 transition-all hover:shadow-lg"
      style={{
        background: C.bg,
        borderColor: getTheme() === "light" ? "rgba(21, 18, 13, 0.10)" : "rgba(255, 255, 255, 0.10)",
        borderWidth: "0.5px",
      }}
    >
      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss?.(user.id)}
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition"
        style={{
          background: getTheme() === "light" ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.5)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = getTheme() === "light" ? "rgba(255, 106, 0, 0.3)" : `${C.primary}30`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = getTheme() === "light" ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.5)";
        }}
      >
        <X className="w-4 h-4" style={{ color: C.text }} />
      </button>

      {/* Profile Image */}
      <Link to={`/user/${user.username}`} className="block">
        <div className="relative h-56 overflow-hidden" style={{ background: `${C.primary}30` }}>
          {avatar ? (
            <img
              src={avatar}
              alt={fullName}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl font-bold" style={{ color: `${C.primary}40` }}>
              {initial}
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      </Link>

      {/* Info Section */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Name */}
        <Link to={`/user/${user.username}`}>
          <h3
            className="text-base font-bold transition line-clamp-2"
            style={{ fontFamily: FONTS.body, color: C.text }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.text;
            }}
          >
            {fullName}
          </h3>
        </Link>

        {/* Mutual Friends */}
        {mutualFriendsCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: FONTS.body, color: C.textMuted }}>
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{mutualFriendsCount} mutual friend{mutualFriendsCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Add Friend Button or Cancel Request */}
        <button
          onClick={() => isPending ? onCancelRequest?.(user.id) : onAddFriend?.(user.id)}
          className="w-full rounded-xl font-bold text-sm py-2.5 transition flex items-center justify-center gap-2"
          style={{
            fontFamily: FONTS.body,
            background: isPending 
              ? (getTheme() === "light" ? "rgba(220, 38, 38, 0.15)" : "rgba(239, 68, 68, 0.20)")
              : C.primary,
            color: isPending 
              ? (getTheme() === "light" ? "#dc2626" : "#ef4444")
              : "#000",
            border: isPending ? `1px solid ${getTheme() === "light" ? "rgba(220, 38, 38, 0.3)" : "rgba(239, 68, 68, 0.3)"}` : "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isPending 
              ? (getTheme() === "light" ? "rgba(220, 38, 38, 0.25)" : "rgba(239, 68, 68, 0.30)")
              : C.primaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isPending 
              ? (getTheme() === "light" ? "rgba(220, 38, 38, 0.15)" : "rgba(239, 68, 68, 0.20)")
              : C.primary;
          }}
        >
          {isPending ? (
            <>
              <X className="w-4 h-4" />
              Cancel Request
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Add friend
            </>
          )}
        </button>

        {/* View Profile Link */}
        <Link
          to={`/user/${user.username}`}
          className="w-full text-center rounded-lg text-xs font-semibold py-2 transition"
          style={{
            fontFamily: FONTS.body,
            background: getTheme() === "light" ? "rgba(255, 106, 0, 0.08)" : "rgba(255,255,255,0.08)",
            color: getTheme() === "light" ? "#15120d" : "#fff",
            border: `1px solid ${getTheme() === "light" ? "rgba(255, 106, 0, 0.15)" : "rgba(255,255,255,0.12)"}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = getTheme() === "light" ? "rgba(255, 106, 0, 0.12)" : "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = getTheme() === "light" ? "rgba(255, 106, 0, 0.08)" : "rgba(255,255,255,0.08)";
          }}
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

export default function SuggestPeople({ currentUserId }) {
  const navigate = useNavigate();
  const C = useThemeColors();
  
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(() => {
    const saved = localStorage.getItem('pendingFriendRequests');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kycRequired, setKycRequired] = useState(false);
  const [incompleteProfile, setIncompleteProfile] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const carouselRef = useRef(null);

  // Persist pending requests to localStorage
  useEffect(() => {
    localStorage.setItem('pendingFriendRequests', JSON.stringify(pendingRequests));
  }, [pendingRequests]);

  // Listen for profile tag updates to refetch recommendations
  useEffect(() => {
    const handleProfileTagsUpdated = () => {
      // Refetch suggestions when profile tags are updated
      const fetchUpdatedSuggestions = async () => {
        try {
          setLoading(true);
          let suggestions = [];
          
          try {
            const similarData = await apiFetch("/api/users/matches/");
            
            if (Array.isArray(similarData) && similarData.length > 0) {
              const enhancedMatches = [];
              
              for (const match of similarData) {
                try {
                  const userSearch = await apiFetch(`/api/users/search/?q=${encodeURIComponent(match.username)}`);
                  if (userSearch.results && userSearch.results.length > 0) {
                    const user = userSearch.results[0];
                    user.mutual_friends_count = 0;
                    enhancedMatches.push({
                      ...user,
                      similarity: match.similarity,
                    });
                  }
                } catch (err) {
                  // Silent fail for user search
                }
              }
              
              suggestions = enhancedMatches;
            }
          } catch (err) {
            console.error("Error refetching suggestions:", err);
          }
          
          setAllSuggestions(suggestions);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUpdatedSuggestions();
    };
    
    window.addEventListener("profile-tags-updated", handleProfileTagsUpdated);
    return () => window.removeEventListener("profile-tags-updated", handleProfileTagsUpdated);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        setKycRequired(false);
        setIncompleteProfile([]);

        // First, fetch user's profile to check completeness
        let userProfile = null;
        try {
          userProfile = await apiFetch("/api/users/me/");
        } catch (err) {
          // Silent fail - continue without profile check
        }

        // Check profile completeness for critical matching fields only
        const incomplete = [];
        if (userProfile) {
          // Only check for travel preferences that affect matching
          // DOB is already saved from registration
          if (!userProfile.travel_style) incomplete.push("Travel style");
          if (!userProfile.pace) incomplete.push("Travel pace");
          if (!userProfile.accomodation_preference && !userProfile.accommodation_preference) incomplete.push("Accommodation preference");
        }

        if (incomplete.length > 0) {
          setIncompleteProfile(incomplete);
        }

        // Fetch similar users (requires KYC)
        let suggestions = [];
        
        try {
          const similarData = await apiFetch("/api/users/matches/");
          
          if (Array.isArray(similarData) && similarData.length > 0) {
            const enhancedMatches = [];
            
            for (const match of similarData) {
              try {
                const userSearch = await apiFetch(`/api/users/search/?q=${encodeURIComponent(match.username)}`);
                if (userSearch.results && userSearch.results.length > 0) {
                  const user = userSearch.results[0];
                  
                  // Set mutual friends count (default to 0 since endpoint might not exist)
                  user.mutual_friends_count = 0;
                  
                  enhancedMatches.push({
                    ...user,
                    similarity: match.similarity,
                  });
                }
              } catch (err) {
                // Silent fail for user search
              }
            }
            
            suggestions = enhancedMatches;
          }
        } catch (err) {
          // Check if it's a KYC error (403)
          if (err.message?.includes('403') || err.status === 403) {
            setKycRequired(true);
          } else {
            // Silent fail - user profile incomplete or no matches available
          }
        }

        setAllSuggestions(suggestions);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Could not load suggestions");
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchSuggestions();
    }
  }, [currentUserId]);

  const handleAddFriend = async (userId) => {
    try {
      await apiFetch(`/api/users/friend-request/send/${userId}/`, { method: "POST" });
      setPendingRequests([...pendingRequests, userId]);
      alert("Friend request sent!");
    } catch (err) {
      alert(MESSAGES.sendFriendRequest + err.message);
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      await apiFetch(`/api/users/friend-request/cancel/${userId}/`, { method: "POST" });
      setPendingRequests(pendingRequests.filter(id => id !== userId));
      alert("Friend request cancelled!");
    } catch (err) {
      alert("Could not cancel friend request: " + err.message);
    }
  };

  const handleDismiss = (userId) => {
    setDismissed([...dismissed, userId]);
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
        behavior: 'smooth',
      });
    }
  };

  // Loading state with skeleton cards - IDENTICAL STRUCTURE to loaded carousel
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-6 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: C.primary }} />
            <h3
              className="text-lg font-bold"
              style={{ fontFamily: FONTS.display, color: C.text }}
            >
              People you may know
            </h3>
          </div>
          
          <style>{CAROUSEL_CSS}</style>
          
          <div className="relative group">
            {/* Left Arrow - Always visible - SAME POSITIONING */}
            <button
              disabled
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition"
              style={{
                background: `${C.primary}30`,
                borderColor: `${C.primary}50`,
                borderWidth: "1px",
                color: C.primary,
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Carousel Container - EXACT SAME STRUCTURE AS LOADED STATE */}
            <div className="carousel-viewport" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
              <div
                className="carousel-track suggest-people-carousel"
              >
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>

            {/* Right Arrow - Always visible - SAME POSITIONING */}
            <button
              disabled
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition"
              style={{
                background: `${C.primary}30`,
                borderColor: `${C.primary}50`,
                borderWidth: "1px",
                color: C.primary,
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // KYC Required Message
  if (kycRequired) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="rounded-2xl p-8 max-w-md text-center" style={{
          background: "rgba(245, 158, 11, 0.10)",
          border: "1px solid rgba(245, 158, 11, 0.30)",
        }}>
          <Gem className="w-12 h-12 mx-auto mb-4" style={{ color: "rgb(245, 158, 11)" }} />
          <h3 
            className="text-base font-bold mb-2"
            style={{ fontFamily: FONTS.body, color: "rgb(217, 119, 6)" }}
          >
            {MESSAGES.kycRequired}
          </h3>
          <p 
            className="text-sm mb-4"
            style={{ fontFamily: FONTS.body, color: C.textMuted }}
          >
            {MESSAGES.kycMessage}
          </p>
          <button
            onClick={() => navigate("/kyc")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition"
            style={{
              fontFamily: FONTS.body,
              background: `${C.primary}30`,
              border: `1px solid ${C.primary}`,
              color: C.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${C.primary}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${C.primary}30`;
            }}
          >
            Complete KYC Verification <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Incomplete Profile Message
  if (incompleteProfile.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="rounded-2xl p-8 max-w-md text-center" style={{
          background: `${C.primary}10`,
          border: `1px solid ${C.primary}30`,
        }}>
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: C.primary }} />
          <h3 
            className="text-base font-bold mb-2"
            style={{ fontFamily: FONTS.body, color: C.text }}
          >
            {MESSAGES.profileIncomplete}
          </h3>
          <p 
            className="text-sm mb-4"
            style={{ fontFamily: FONTS.body, color: C.textMuted }}
          >
            {MESSAGES.profileMessage}
          </p>
          <div className="rounded-lg p-3 mb-4" style={{
            background: `${C.primary}05`,
            border: `1px solid ${C.primary}20`,
          }}>
            <ul className="text-left text-sm space-y-1">
              {incompleteProfile.map((item) => (
                <li key={item} className="flex items-start gap-2" style={{ color: C.textMuted }}>
                  <span style={{ color: C.primary }} className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const visibleSuggestions = allSuggestions.filter(u => !dismissed.includes(u.id));

  if (visibleSuggestions.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Users className="w-8 h-8" style={{ opacity: 0.2, color: C.text }} />
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: C.textMuted }}>
          {MESSAGES.noSuggestions}
        </p>
        <p className="text-xs text-center max-w-xs" style={{ fontFamily: FONTS.body, color: C.textMuted, opacity: 0.7 }}>
          {MESSAGES.noSuggestionsHint}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-start gap-3 rounded-xl p-4" style={{
          background: "rgba(245, 158, 11, 0.10)",
          border: "1px solid rgba(245, 158, 11, 0.20)",
        }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "rgb(245, 158, 11)" }} />
          <p className="text-sm" style={{ fontFamily: FONTS.body, color: "rgb(217, 119, 6)" }}>
            {error}
          </p>
        </div>
      )}

      {visibleSuggestions.length > 0 && (
        <div>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5" style={{ color: C.primary }} />
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: FONTS.display, color: C.text }}
                >
                  {showAll ? "All Suggestions" : "People you may know"}
                </h3>
              </div>
              <p className="text-xs" style={{ fontFamily: FONTS.body, color: C.textMuted }}>
                {showAll ? `Showing all ${visibleSuggestions.length} suggestions` : "Based on your travel style and interests"}
              </p>
            </div>
            {!showAll && visibleSuggestions.length > 4 && (
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center gap-1 text-sm transition"
                style={{ fontFamily: FONTS.body, color: C.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.primary;
                }}
              >
                See more <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {showAll && (
              <button
                onClick={() => setShowAll(false)}
                className="flex items-center gap-1 text-sm transition"
                style={{ fontFamily: FONTS.body, color: C.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.primary;
                }}
              >
                Show carousel <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Horizontal Carousel with Navigation OR Grid View */}
          <style>{CAROUSEL_CSS}</style>
          
          {!showAll ? (
            <div className="relative group">
              {/* Left Arrow - Always visible */}
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition"
                aria-label="Previous"
                style={{
                  background: `${C.primary}30`,
                  borderColor: `${C.primary}50`,
                  borderWidth: "1px",
                  color: C.primary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${C.primary}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${C.primary}30`;
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Carousel Container - Fixed width to show exactly 4 cards */}
              <div className="carousel-viewport" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
                <div
                  ref={carouselRef}
                  className="carousel-track suggest-people-carousel"
                >
                  {visibleSuggestions.map((user) => (
                    <SuggestedUserCard
                      key={user.id}
                      user={user}
                      onAddFriend={handleAddFriend}
                      onCancelRequest={handleCancelRequest}
                      onDismiss={handleDismiss}
                      isPending={pendingRequests.includes(user.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Right Arrow - Always visible */}
              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition"
                aria-label="Next"
                style={{
                  background: `${C.primary}30`,
                  borderColor: `${C.primary}50`,
                  borderWidth: "1px",
                  color: C.primary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${C.primary}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${C.primary}30`;
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Limit visible width with CSS */}
              <style>{`
                .suggest-people-carousel-wrapper {
                  width: calc(192px * 4 + 16px * 3);
                  margin: 0 auto;
                  overflow: hidden;
                }
              `}</style>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleSuggestions.map((user) => (
                <SuggestedUserCard
                  key={user.id}
                  user={user}
                  onAddFriend={handleAddFriend}
                  onCancelRequest={handleCancelRequest}
                  onDismiss={handleDismiss}
                  isPending={pendingRequests.includes(user.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
