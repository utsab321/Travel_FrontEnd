import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapPin, Loader2, AlertCircle, ArrowLeft, Users } from "lucide-react";
import { useAuthRequired } from "../hooks/useAuthRequired";
import { apiFetch, getToken, getBaseUrl } from "../utils/api";

// ──── CONSTANTS ────
const API_URL =  process.env.REACT_APP_BACKEND_URL ||"http://127.0.0.1:8000";

const PALETTES = {
  dark: {
    bg: "#0a0c16",
    bgSecondary: "#0f1219",
    text: "#ffffff",
    textSecondary: "#ffffff99",
    border: "rgba(255, 255, 255, 0.1)",
    gold: "#C9A84C",
    green: "#22c55e",
    blue: "#3b82f6",
    yellow: "#eab308",
  },
  light: {
    bg: "#f4f0e8",
    bgSecondary: "#f7f2ea",
    text: "#15120d",
    textSecondary: "#5d5550",
    border: "rgba(21, 18, 13, 0.10)",
    gold: "#ff6a00",
    green: "#22c55e",
    blue: "#3b82f6",
    yellow: "#eab308",
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

const SIMILARITY_COLORS = {
  green: { bg: "bg-green-500/20", text: "text-green-400" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
  yellow: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  gray: { bg: "bg-gray-600/20", text: "text-gray-400" },
};

const SIMILARITY_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
};

const BEST_MATCH_THRESHOLD = 75;

const TEXTS = {
  notAuthenticated: "Not authenticated. Please log in.",
  searchTitle: "Search",
  resultsFor: "Results for",
  searchingUsers: "Searching for users...",
  bestResult: "Best Result",
  otherResults: "other result",
  otherResultsPlural: "other results",
  noUsersFound: "No users found",
  tryelDifferent: "Try searching with different keywords",
  enterSearchQuery: "Enter a search query to find travelers",
  fetchErrorMsg: "Error fetching similarity for user",
  searchErrorMsg: "Failed to load search results",
};

function SimilarityBadge({ score }) {
  if (score === null || score === undefined) return null;
  
  let colors = SIMILARITY_COLORS.gray;
  
  if (score >= SIMILARITY_THRESHOLDS.excellent) {
    colors = SIMILARITY_COLORS.green;
  } else if (score >= SIMILARITY_THRESHOLDS.good) {
    colors = SIMILARITY_COLORS.blue;
  } else if (score >= SIMILARITY_THRESHOLDS.fair) {
    colors = SIMILARITY_COLORS.yellow;
  }
  
  const { bg: bgColor, text: textColor } = colors;
  
  return (
    <div className={`${bgColor} px-2.5 py-1 rounded-full text-xs font-medium ${textColor} min-w-fit`}>
      {score}% match
    </div>
  );
}

function UserRow({ user, similarity, onUserClick }) {
  const profilePicUrl = user.profile_picture?.startsWith("http")
    ? user.profile_picture
    : user.profile_picture
    ? `${API_URL}${user.profile_picture}`
    : null;

  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || user.username;

  return (
    <div
      onClick={() => onUserClick(user.username)}
      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition group"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden flex items-center justify-center ring-1 ring-white/10 group-hover:ring-white/20 transition">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt={user.username}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <span className="text-sm font-bold search-text">
              {displayName[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold search-text truncate">
            {displayName}
          </h3>
          <span className="text-xs search-text-50 flex-shrink-0">
            @{user.username}
          </span>
        </div>
        {user.location && (
          <div className="flex items-center gap-1 search-text-40 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs truncate">{user.location}</span>
          </div>
        )}
      </div>

      {/* Similarity Score */}
      <div className="flex-shrink-0">
        <SimilarityBadge score={similarity} />
      </div>
    </div>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isReady: isAuthReady } = useAuthRequired();
  const C = useThemeColors();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarities, setSimilarities] = useState({});

  const searchUsers = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setError(TEXTS.notAuthenticated);
        return;
      }

      setLoading(true);
      setError(null);
      
      const data = await apiFetch(
        `users/search/?q=${encodeURIComponent(query)}`
      );
      
      setResults(data.results || []);
      
      // Fetch similarity scores for each result
      if (data.results && data.results.length > 0) {
        const similarityScores = {};
        for (const user of data.results) {
          try {
            const simData = await apiFetch(`users/similarity/${user.id}/`);
            similarityScores[user.id] = Math.round(simData.similarity || 0);
          } catch (err) {
            console.error("Error fetching similarity for user", user.id, ":", err);
            similarityScores[user.id] = null;
          }
        }
        setSimilarities(similarityScores);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Failed to load search results");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query && isAuthReady) {
      searchUsers();
    } else if (!isAuthReady && query) {
      setLoading(false);
      setError(TEXTS.notAuthenticated);
    }
  }, [query, searchUsers, isAuthReady]);

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  // Separate and sort results
  const bestMatches = results.filter((user) => (similarities[user.id] || 0) >= BEST_MATCH_THRESHOLD);
  const otherMatches = results
    .filter((user) => (similarities[user.id] || 0) < BEST_MATCH_THRESHOLD)
    .sort((a, b) => (similarities[b.id] || 0) - (similarities[a.id] || 0));

  return (
    <div className="search-results-page min-h-screen bg-gradient-to-b from-[#0a0c16] to-[#0f1219] pb-20">
      {/* Header */}
      <div className="border-b border-white/10 bg-[rgba(10,12,22,0.85)] backdrop-blur-md sticky top-16 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 search-text" />
          </button>
          <div>
            <h1 className="text-lg font-bold search-text">{TEXTS.searchTitle}</h1>
            {query && (
              <p className="text-xs search-text-50">
                {TEXTS.resultsFor} "{query}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 search-text-60 animate-spin mb-3" />
            <p className="search-text-60 text-sm">{TEXTS.searchingUsers}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-white/80 text-sm">{error}</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            {/* Best Match Section */}
            {bestMatches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
                  <h2 className="text-sm font-semibold search-text uppercase tracking-wide">
                    {TEXTS.bestResult}
                  </h2>
                </div>
                <div className="border border-green-500/20 rounded-lg overflow-hidden bg-green-500/5">
                  {bestMatches.map((user) => (
                    <div key={user.id} className="border-b border-green-500/10 last:border-b-0">
                      <UserRow
                        user={user}
                        similarity={similarities[user.id]}
                        onUserClick={handleUserClick}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Results Section */}
            {otherMatches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 search-text-60" />
                  <p className="text-xs search-text-60 font-medium">
                    <span className="font-semibold search-text">{otherMatches.length}</span> {otherMatches.length !== 1 ? TEXTS.otherResultsPlural : TEXTS.otherResults}
                  </p>
                </div>
                <div className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02] divide-y divide-white/10">
                  {otherMatches.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      similarity={similarities[user.id]}
                      onUserClick={handleUserClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 search-text-20 mb-4" />
            <p className="search-text-60 text-sm font-medium">{TEXTS.noUsersFound}</p>
            <p className="search-text-40 text-xs mt-1">
              {query
                ? TEXTS.tryelDifferent
                : TEXTS.enterSearchQuery}
            </p>
          </div>
        )}
      </div>

      <style>{`
        .search-results-page .search-text {
          color: #ffffff;
        }
        .search-results-page .search-text-80 {
          color: rgba(255, 255, 255, 0.80);
        }
        .search-results-page .search-text-60 {
          color: rgba(255, 255, 255, 0.60);
        }
        .search-results-page .search-text-50 {
          color: rgba(255, 255, 255, 0.50);
        }
        .search-results-page .search-text-40 {
          color: rgba(255, 255, 255, 0.40);
        }
        .search-results-page .search-text-20 {
          color: rgba(255, 255, 255, 0.20);
        }

        [data-theme="light"] .search-results-page .search-text {
          color: #15120d;
        }
        [data-theme="light"] .search-results-page .search-text-80 {
          color: rgba(21, 18, 13, 0.80);
        }
        [data-theme="light"] .search-results-page .search-text-60 {
          color: rgba(21, 18, 13, 0.60);
        }
        [data-theme="light"] .search-results-page .search-text-50 {
          color: rgba(21, 18, 13, 0.50);
        }
        [data-theme="light"] .search-results-page .search-text-40 {
          color: rgba(21, 18, 13, 0.40);
        }
        [data-theme="light"] .search-results-page .search-text-20 {
          color: rgba(21, 18, 13, 0.20);
        }

        [data-theme="light"] {
          --bg: #f4f0e8;
          --accent: #ff6a00;
          --text: #15120d;
          --text-secondary: #5d5550;
          --border: rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] .bg-gradient-to-b {
          background-image: linear-gradient(180deg, #f4f0e8 0%, #f7f2ea 100%);
        }

        [data-theme="light"] .from-\[#0a0c16\] {
          --tw-gradient-from: #f4f0e8;
        }

        [data-theme="light"] .to-\[#0f1219\] {
          --tw-gradient-to: #f7f2ea;
        }

        [data-theme="light"] .bg-\[rgba\(10\,12\,22\,0\.85\)\] {
          background-color: rgba(244, 240, 232, 0.85);
        }

        [data-theme="light"] .border-white\/10 {
          border-color: rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] .text-white {
          color: #15120d;
        }

        [data-theme="light"] .text-white\/50 {
          color: rgba(21, 18, 13, 0.50);
        }

        [data-theme="light"] .text-white\/60 {
          color: rgba(21, 18, 13, 0.60);
        }

        [data-theme="light"] .text-white\/40 {
          color: rgba(21, 18, 13, 0.40);
        }

        [data-theme="light"] .text-white\/20 {
          color: rgba(21, 18, 13, 0.20);
        }

        [data-theme="light"] .text-red-400 {
          color: #ff6a00;
        }

        [data-theme="light"] .text-white\/80 {
          color: #15120d;
        }

        [data-theme="light"] .hover\:bg-white\/5:hover {
          background-color: rgba(21, 18, 13, 0.05);
        }

        [data-theme="light"] .ring-white\/10 {
          --tw-ring-color: rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] .group-hover\:ring-white\/20:hover {
          --tw-ring-color: rgba(21, 18, 13, 0.20);
        }

        [data-theme="light"] .from-blue-500 {
          --tw-gradient-from: #ff6a00;
        }

        [data-theme="light"] .to-blue-600 {
          --tw-gradient-to: #e55a00;
        }

        [data-theme="light"] .bg-green-500\/20 {
          background-color: rgba(255, 106, 0, 0.20);
        }

        [data-theme="light"] .border-green-500\/20 {
          border-color: rgba(255, 106, 0, 0.20);
        }

        [data-theme="light"] .bg-green-500\/5 {
          background-color: rgba(255, 106, 0, 0.05);
        }

        [data-theme="light"] .border-green-500\/10 {
          border-color: rgba(255, 106, 0, 0.10);
        }

        [data-theme="light"] .from-green-400 {
          --tw-gradient-from: #ff6a00;
        }

        [data-theme="light"] .to-green-600 {
          --tw-gradient-to: #e55a00;
        }

        [data-theme="light"] .bg-white\/\[0\.02\] {
          background-color: rgba(255, 255, 255, 0.02);
        }

        [data-theme="light"] .divide-white\/10 {
          border-color: rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] .p-2:hover {
          background-color: rgba(21, 18, 13, 0.05);
        }
      `}</style>
    </div>
  );
}
