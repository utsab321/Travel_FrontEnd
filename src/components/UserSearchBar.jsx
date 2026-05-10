import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, X, Zap } from "lucide-react";

// ============================================
// CONSTANTS
// ============================================
const DEBOUNCE_TIME = 300;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
const PLACEHOLDER = "Search users...";

const SIMILARITY_THRESHOLDS = {
  high: { min: 80, color: "text-green-400" },
  medium: { min: 60, color: "text-yellow-400" },
  low: { min: 40, color: "text-orange-400" },
  veryLow: { color: "text-red-400" },
};

const COLORS = {
  primary: "#1976D2",
  primaryHover: "#1565C0",
};

const getBackendOrigin = () => BACKEND_URL.replace(/\/api\/?$/, "");

const getProfilePictureUrl = (user) => {
  const picture = user.profile_picture || user.profile_pic || user.avatar;
  if (!picture) return null;
  return picture.startsWith("http") ? picture : `${getBackendOrigin()}${picture}`;
};

// Get similarity color based on score
const getSimilarityColor = (similarity) => {
  if (similarity >= SIMILARITY_THRESHOLDS.high.min) return SIMILARITY_THRESHOLDS.high.color;
  if (similarity >= SIMILARITY_THRESHOLDS.medium.min) return SIMILARITY_THRESHOLDS.medium.color;
  if (similarity >= SIMILARITY_THRESHOLDS.low.min) return SIMILARITY_THRESHOLDS.low.color;
  return SIMILARITY_THRESHOLDS.veryLow.color;
};

export default function UserSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [similarities, setSimilarities] = useState({});
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Search users when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(query);
    }, DEBOUNCE_TIME); // Debounce search

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchUsers = async (q) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${BACKEND_URL}/api/users/search/?q=${q}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const users = (data.results || []).map(user => ({
        ...user,
        profile_picture: getProfilePictureUrl(user),
      }));
      setResults(users);
      setIsOpen(true);
      
      // Fetch similarity scores
      if (users.length > 0) {
        const simScores = {};
        for (const user of users) {
          try {
            const simResponse = await fetch(
              `${BACKEND_URL}/api/users/similarity/${user.id}/`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }
            );
            const simData = await simResponse.json();
            simScores[user.id] = simData.similarity;
          } catch (err) {
            // Silent fail
          }
        }
        setSimilarities(simScores);
      }
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder={PLACEHOLDER}
          className="w-full pl-10 pr-10 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown Results */}
      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg bg-[#111] border border-white/10 shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
              <span className="ml-2 text-sm text-white/60">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((user) => {
                const similarity = similarities[user.id];
                const simColor = getSimilarityColor(similarity);
                
                return (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.username)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition border-b border-white/5 last:border-b-0"
                  >
                    {/* Profile Picture */}
                    <div className="relative h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
                      <span className="text-xs font-bold text-white">
                        {(user.first_name || user.username)[0].toUpperCase()}
                      </span>
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.username}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.username}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        @{user.username}
                        {user.location && ` • ${user.location}`}
                      </p>
                    </div>

                    {/* Similarity Badge */}
                    {similarity !== undefined && (
                      <div className={`flex items-center gap-1 text-xs font-semibold ${simColor}`}>
                        <Zap className="w-3 h-3" />
                        {similarity}%
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="px-4 py-3 border-t border-white/5 text-center">
                <button
                  onClick={handleSearchSubmit}
                  className="text-xs font-semibold transition"
                  style={{ color: COLORS.primary }}
                  onMouseEnter={(e) => e.target.style.color = COLORS.primaryHover}
                  onMouseLeave={(e) => e.target.style.color = COLORS.primary}
                >
                  See all results for "{query}"
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-white/50">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
