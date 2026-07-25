import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MapPin,
  Wallet,
  Gem,
  Sunrise,
  Mountain,
  Zap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Users,
  Building2,
  Home,
  Tent,
  X,
  Globe,
  MessageCircle,
  Clock,
  Image,
} from "lucide-react";
import { ProfileHeaderSkeleton, ProfileFriendsListSkeleton, PhotoGallerySkeleton } from "../components/SkeletonLoaders";

const API_URL =  process.env.REACT_APP_BACKEND_URL ||"http://127.0.0.1:8000";
const FONTS = {
  display: "Playfair Display, Georgia, serif",
  body: "DM Sans, system-ui, sans-serif",
  mono: "DM Mono, monospace",
};

const PALETTES = {
  dark: {
    gold: "#C9A84C",
    goldLight: "#d4b76a",
    goldDark: "#9a7a3f",
    bgDark: "#0a0c16",
    bgDarker: "#0e0e0e",
    white: "#ffffff",
    textGold: "#C9A84C",
    textMuted: "rgba(255,255,255,0.8)",
    textDim: "rgba(255,255,255,0.70)",
    red400: "#ff0000",
  },
  light: {
    gold: "#ff6a00",
    goldLight: "#ff8a2a",
    goldDark: "#f45100",
    bgDark: "#f4f0e8",
    bgDarker: "#f4f0e8",
    white: "#15120d",
    textGold: "#ff6a00",
    textMuted: "#15120d",
    textDim: "rgba(21, 18, 13, 0.70)",
    red400: "#dc2626",
  }
};

const getTheme = () => {
  if (typeof document !== 'undefined') {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? 'light' : 'dark';
  }
  return 'dark';
};

const COLORS = PALETTES[getTheme()];

const MESSAGES = {
  failedToLoad: "Failed to load user profile",
  userNotFound: "User not found",
  goBack: "Go Back",
  match: "% Match",
  completKyc: "Complete KYC to send friend requests and messages",
  kycChatTooltip: "Complete KYC to chat",
  kycFriendTooltip: "Complete KYC to send friend request",
  friendsLabel: "Friends",
  chatLabel: "Chat",
  unfriendLabel: "Unfriend",
  unfriending: "Unfriending...",
  cancelRequest: "Cancel Request",
  canceling: "Canceling...",
  accept: "Accept",
  reject: "Reject",
  addFriend: "Add Friend",
  sending: "Sending...",
  travelPreferences: "Travel Preferences",
  travelStyle: "Travel Style",
  pace: "Pace",
  destinations: "Destinations",
  accommodation: "Accommodation",
  vibes: "Travel Vibes",
  budget: "Budget",
  adventure: "Adventure",
  social: "Social",
  friends: "Friends",
  noFriendsYet: "No friends yet",
  makingFriends: "Help them make new friends!",
};

function useThemeColors() {
  const [theme, setTheme] = useState(getTheme());
  const [colors, setColors] = useState(PALETTES[theme]);

  useEffect(() => {
    const handleThemeChange = () => {
      const newTheme = getTheme();
      setTheme(newTheme);
      setColors(PALETTES[newTheme]);
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  return colors;
}

function SimilarityBadge({ score }) {
  const C = useThemeColors();
  
  if (!score && score !== 0) return null;
  
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border" style={{ backgroundColor: `${C.textGold}15`, border: `1px solid ${C.textGold}40`, color: C.textGold }}>
      <Zap className="w-4 h-4" />
      <span className="font-semibold" style={{ fontFamily: FONTS.body }}>{score}% Match</span>
    </div>
  );
}

const StyleIcon = ({ style }) => {
  const map = { budget: [Wallet, "#C9A84C"], luxury: [Gem, "#ffffff"], adventure: [Mountain, "#C9A84C"] };
  const [Icon, color] = map[style] || [Wallet, "#444"];
  return <Icon style={{ color }} className="w-5 h-5" />;
};

const PaceIcon = ({ pace }) => {
  const map = { relaxed: [Sunrise, "#C9A84C"], moderate: [Zap, "#ffffff"], fast_paced: [Zap, "#C9A84C"] };
  const [Icon, color] = map[pace] || [Zap, "#444"];
  return <Icon style={{ color }} className="w-5 h-5" />;
};

const AccommIcon = ({ accomm }) => {
  const map = { hostel: [Building2, "#C9A84C"], hotel: [Building2, "#ffffff"], inn: [Home, "#C9A84C"], camping: [Tent, "#ffffff"] };
  const [Icon, color] = map[accomm] || [Home, "#444"];
  return <Icon style={{ color }} className="w-5 h-5" />;
};

export default function UserProfile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const C = useThemeColors();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarity, setSimilarity] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [friendUserFriends, setFriendUserFriends] = useState([]);
  const [userKycStatus, setUserKycStatus] = useState(null);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [userPhotos, setUserPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  const fetchUserKycStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserKycStatus(data.status);
      }
    } catch (err) {
      console.error("Error fetching KYC status:", err);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      // Fetch profile directly by username so private users are not mistaken for missing users.
      const profileResponse = await fetch(`${API_URL}/api/users/user-profile/username/${username}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (profileResponse.status === 404) {
        setError(MESSAGES.userNotFound);
        return;
      }
      
      // ✅ Handle private profile (403 Forbidden)
      if (profileResponse.status === 403) {
        const errorData = await profileResponse.json();
        setError(errorData.detail || "This profile is private. Send a friend request to view it.");
        // Still set basic user data so they can send friend request
        setUserData(errorData);
        
        // Still fetch friend status
        const statusResponse = await fetch(`${API_URL}/api/users/friend-request/status/${errorData.id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setFriendStatus(statusData);
        }
        return;
      }
      
      if (!profileResponse.ok) throw new Error(`Profile fetch failed: ${profileResponse.status}`);
      const profileData = await profileResponse.json();
      setUserData(profileData);

      // Get similarity score
      const similarityResponse = await fetch(`${API_URL}/api/users/similarity/${profileData.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      let similarity = null;
      if (similarityResponse.ok) {
        const simData = await similarityResponse.json();
        similarity = simData.similarity;
        setSimilarity(similarity);
      }

      // Get friend request status
      const statusResponse = await fetch(`${API_URL}/api/users/friend-request/status/${profileData.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setFriendStatus(statusData);
      }

      // Fetch user's friends
      const friendsResponse = await fetch(`${API_URL}/api/users/friends/${profileData.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        setFriendUserFriends(friendsData.friends || []);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(MESSAGES.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchUserProfile();
    fetchUserKycStatus();
  }, [username, fetchUserProfile, fetchUserKycStatus]);

  useEffect(() => {
    const fetchUserPhotos = async () => {
      if (!userData?.id) return;
      setPhotosLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/api/trips/user/${userData.id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const trips = await res.json();
        const tripsList = Array.isArray(trips) ? trips : trips.results || [];
        
        const photos = [];
        for (const trip of tripsList) {
          try {
            const photoRes = await fetch(`${API_URL}/api/trips/${trip.id}/photos/`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (photoRes.ok) {
              const photoData = await photoRes.json();
              const tripPhotos = Array.isArray(photoData) ? photoData : photoData.results || [];
              // Only include photos uploaded by this user
              tripPhotos.forEach(photo => {
                if (photo.uploaded_by === userData.id) {
                  photos.push({ ...photo, trip });
                }
              });
            }
          } catch (e) {
            console.error(`Failed to fetch photos for trip ${trip.id}:`, e);
          }
        }
        setUserPhotos(photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (err) {
        console.error("Failed to fetch user photos:", err);
      } finally {
        setPhotosLoading(false);
      }
    };
    if (userData?.id) fetchUserPhotos();
  }, [userData?.id]);

  const sendFriendRequest = async () => {
    if (!userData) return;
    try {
      setActionLoading(true);
      setCooldownMessage(null);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/users/friend-request/send/${userData.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok) {
        setFriendStatus({ status: result.status, type: result.type, request_id: result.request_id });
      } else {
        console.error("Error sending friend request:", result);
        // Handle cooldown message
        if (result.status === 'rejected' && result.cooldown_remaining) {
          const { days, hours } = result.cooldown_remaining;
          setCooldownMessage(`You can send another request in ${days}d ${hours}h`);
        } else {
          setCooldownMessage(result.detail || "Unable to send friend request");
        }
      }
    } catch (err) {
      console.error("Error sending friend request:", err);
      setCooldownMessage("An error occurred while sending the request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!userData) return;
    // Store the friend ID temporarily so Chat.jsx can auto-select the conversation
    sessionStorage.setItem('selectedFriendId', userData.profile_id || userData.id);
    sessionStorage.setItem('selectedFriendName', userData.username);
    navigate('/chat');
  };

  const respondToFriendRequest = async (action) => {
    if (!friendStatus?.request_id) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/users/friend-request/${friendStatus.request_id}/respond/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (response.ok) {
        setFriendStatus({ status: result.status });
      } else {
        console.error("Error responding to request:", result);
      }
    } catch (err) {
      console.error("Error responding to request:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const cancelFriendRequest = async () => {
    if (!friendStatus?.request_id) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/users/friend-request/${friendStatus.request_id}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        setFriendStatus({ status: 'none' });
      } else {
        const result = await response.json();
        console.error("Error cancelling request:", result);
      }
    } catch (err) {
      console.error("Error cancelling request:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const unfriendUser = async () => {
    if (!userData) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/users/unfriend/${userData.id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok) {
        setFriendStatus({ status: 'none' });
        setShowUnfriendConfirm(false);
      } else {
        console.error("Error unfriending user:", result);
      }
    } catch (err) {
      console.error("Error unfriending user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0c16] to-[#0f1219] p-6">
        <div className="max-w-3xl mx-auto">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ height: '2.2rem', width: '100px', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 100%)', backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite', borderRadius: '8px', marginBottom: '1rem' }} />
          </div>
          <ProfileHeaderSkeleton />
          <div style={{ marginTop: '3rem' }}>
            <ProfileFriendsListSkeleton count={5} />
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    const isPrivateProfileError = error.toLowerCase().includes("private");
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0c16] to-[#0f1219] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <AlertCircle className="w-12 h-12" style={{ color: C.textGold }} />
          
          {isPrivateProfileError && userData ? (
            <>
              {/* Show basic profile info for private profiles */}
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#9a7a3f] overflow-hidden flex items-center justify-center shadow-lg">
                {userData.profile_picture ? (
                  <img
                    src={userData.profile_picture.startsWith("http") 
                      ? userData.profile_picture 
                      : `${API_URL}${userData.profile_picture}`}
                    alt={userData.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-[#0a0c16]">
                    {(userData.first_name || userData.username)[0].toUpperCase()}
                  </span>
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: FONTS.display, color: C.white }}>
                  {userData.first_name && userData.last_name
                    ? `${userData.first_name} ${userData.last_name}`
                    : userData.username}
                </h2>
                <p className="text-sm" style={{ color: C.textGold }}>@{userData.username}</p>
              </div>
              
              <p style={{ color: C.textMuted }}>{error}</p>
              
              {/* Show friend request button */}
              {!isOwnProfile && friendStatus?.status !== "accepted" && (
                <button
                  onClick={sendFriendRequest}
                  disabled={actionLoading}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition bg-gradient-to-r hover:from-[#d4b76a] hover:to-[#e0c383] disabled:opacity-50"
                  style={{ fontFamily: FONTS.body, backgroundImage: `linear-gradient(to right, ${C.textGold}, ${C.goldLight})` }}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  {actionLoading ? MESSAGES.sending : MESSAGES.addFriend}
                </button>
              )}
              
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 rounded-lg transition flex items-center gap-2 mx-auto"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: C.white }}
              >
                <ArrowLeft className="w-4 h-4" />
                {MESSAGES.goBack}
              </button>
            </>
          ) : (
            <>
              <p style={{ color: C.textMuted }}>{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 rounded-lg transition flex items-center gap-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: C.white }}
              >
                <ArrowLeft className="w-4 h-4" />
                {MESSAGES.goBack}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const profilePicUrl = userData.profile_picture?.startsWith("http")
    ? userData.profile_picture
    : userData.profile_picture
    ? `${API_URL}${userData.profile_picture}`
    : null;

  const isOwnProfile = currentUser?.username === username;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0c16] to-[#0e0e0e] pb-40 pt-20">
        {/* Main Content - Max Width Container */}
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Profile Header with Avatar Offset */}
          <div className="flex gap-8 -mt-14 mb-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#9a7a3f] overflow-hidden flex-shrink-0 ring-4 ring-[#0a0c16] flex items-center justify-center shadow-lg">
                {profilePicUrl ? (
                  <img
                    src={profilePicUrl}
                    alt={userData.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <span
                    className="text-6xl font-bold text-[#0a0c16]"
                    style={{ fontFamily: FONTS.display }}
                  >
                    {(userData.first_name || userData.username)[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 pt-4">
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1
                      className="text-4xl font-bold mb-2"
                      style={{ fontFamily: FONTS.display, color: C.white }}
                    >
                      {userData.first_name && userData.last_name
                        ? `${userData.first_name} ${userData.last_name}`
                        : userData.username}
                    </h1>
                    <p className="text-[#C9A84C] text-sm">@{userData.username}</p>
                  </div>
                  {similarity !== null && <SimilarityBadge score={similarity} />}
                </div>
              </div>

              {userData.location && (
                <div className="flex items-center gap-2 mb-3" style={{ color: C.textDim }}>
                  <MapPin className="w-5 h-5" style={{ color: C.textGold }} />
                  <span style={{ fontFamily: FONTS.body }}>{userData.location}</span>
                </div>
              )}

              {userData.bio && (
                <p
                  className="mb-6 leading-relaxed"
                  style={{ fontFamily: FONTS.body, color: C.textMuted }}
                >
                  {userData.bio}
                </p>
              )}

              {/* Action Buttons */}
              {!isOwnProfile && (
                <>
                  {userKycStatus && userKycStatus !== 'approved' && (
                    <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: `${C.textGold}15`, border: `1px solid ${C.textGold}40`, color: C.textGold }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span style={{ fontFamily: FONTS.body }}>{MESSAGES.completKyc}</span>
                    </div>
                  )}
                  <div className="flex gap-3 flex-wrap">
                  {friendStatus?.status === "friends" ? (
                    <>
                      <button
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        style={{ fontFamily: FONTS.body }}
                      >
                        <Users className="w-4 h-4" />
                        {MESSAGES.friendsLabel}
                      </button>
                      <button
                        onClick={handleStartChat}
                        disabled={actionLoading || (userKycStatus && userKycStatus !== 'approved')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: FONTS.body, backgroundImage: `linear-gradient(to right, ${C.textGold}, ${C.goldLight})` }}
                        title={userKycStatus && userKycStatus !== 'approved' ? MESSAGES.kycChatTooltip : ''}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {MESSAGES.chatLabel}
                      </button>
                      <button
                        onClick={() => setShowUnfriendConfirm(true)}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-red-600/20 border border-red-600 text-red-400 hover:bg-red-600/30 transition disabled:opacity-50"
                        style={{ fontFamily: FONTS.body }}
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        Unfriend
                      </button>
                    </>
                  ) : friendStatus?.status === "pending" &&
                    friendStatus?.type === "outgoing" ? (
                    <button
                      onClick={cancelFriendRequest}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold border transition disabled:opacity-50"
                      style={{ fontFamily: FONTS.body, backgroundColor: `${C.textGold}20`, border: `1px solid ${C.textGold}`, color: C.textGold }}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                        {actionLoading ? MESSAGES.canceling : MESSAGES.cancelRequest}
                    </button>
                  ) : friendStatus?.status === "pending" &&
                    friendStatus?.type === "incoming" ? (
                    <>
                      <button
                        onClick={() => respondToFriendRequest("accept")}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50"
                        style={{ fontFamily: FONTS.body }}
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => respondToFriendRequest("reject")}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50"
                        style={{ fontFamily: FONTS.body }}
                      >
                        {MESSAGES.reject}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={sendFriendRequest}
                      disabled={actionLoading || (userKycStatus && userKycStatus !== 'approved')}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: FONTS.body, backgroundImage: `linear-gradient(to right, ${C.textGold}, ${C.goldLight})`, color: '#0a0c16' }}
                      title={userKycStatus && userKycStatus !== 'approved' ? MESSAGES.kycFriendTooltip : ''}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      {actionLoading ? MESSAGES.sending : MESSAGES.addFriend}
                    </button>
                  )}
                </div>
                </>
              )}

              {/* Cooldown Message */}
              {cooldownMessage && (
                <div className="mt-3 p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.4)', color: '#dc2626' }}>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span style={{ fontFamily: FONTS.body }}>{cooldownMessage}</span>
                </div>
              )}

              {/* Trip Photos Gallery */}
              {photosLoading ? (
                <PhotoGallerySkeleton />
              ) : userPhotos.length > 0 ? (
                <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden mb-12">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] px-6 pt-4 pb-3 flex items-center gap-2" style={{ fontFamily: FONTS.body, color: C.textDim }}>
                    <Image className="w-4 h-4" />
                    Trip Photos
                  </p>
                  <div className="px-6 pb-6 space-y-8">
                    {/* Group photos by trip */}
                    {(() => {
                      // Group photos by trip ID
                      const grouped = {};
                      userPhotos.forEach(photo => {
                        const tripId = photo.trip?.id || 'no-trip';
                        if (!grouped[tripId]) {
                          grouped[tripId] = {
                            trip: photo.trip,
                            photos: []
                          };
                        }
                        grouped[tripId].photos.push(photo);
                      });
                      
                      return Object.values(grouped).map((group) => (
                        <div key={group.trip?.id || 'no-trip'} className="space-y-3">
                          {/* Trip Header */}
                          {group.trip && (
                            <Link
                              to={`/trip/${group.trip.id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition"
                              style={{ fontFamily: FONTS.body, backgroundColor: `${C.textGold}10`, border: `1px solid ${C.textGold}30`, color: C.textGold }}
                            >
                              <MapPin className="w-4 h-4" style={{ color: C.textGold }} />
                              <span className="font-semibold text-sm" style={{ color: C.textGold }}>
                                {group.trip.destination?.name || "Trip"} ({group.photos.length} photo{group.photos.length !== 1 ? 's' : ''})
                              </span>
                            </Link>
                          )}
                          
                          {/* Photos Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {group.photos.map((photo, idx) => (
                              <div 
                                key={photo.id}
                                className="rounded-lg overflow-hidden border border-white/8 bg-white/2 hover:border-[#C9A84C]/30 transition cursor-pointer group"
                              >
                                {/* Photo */}
                                <div className="relative aspect-square overflow-hidden bg-black/20">
                                  <img
                                    src={photo.image}
                                    alt={photo.caption || "trip photo"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                  />
                                  {/* Badge showing this is from a group */}
                                  {group.photos.length > 1 && idx === 0 && (
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-semibold">
                                      +{group.photos.length - 1}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Caption on hover */}
                                {photo.caption && (
                                  <div className="p-2 hidden group-hover:block">
                                    <p 
                                      style={{ fontFamily: FONTS.body, color: C.textMuted }} 
                                      className="text-xs"
                                    >
                                      {photo.caption}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : null}
            </div>
            </div>

          {/* Two Column Layout */}
          <div className="flex gap-8">
            {/* Main Content - Left */}
            <div className="flex-1">
              {/* Travel Preferences Section */}
              {(userData.travel_style ||
                userData.pace ||
                userData.preferred_destinations ||
                userData.accomodation_preference) && (
                <div className="mb-12">
                  <h2
                    className="text-2xl font-bold mb-6"
                    style={{ fontFamily: FONTS.display, color: C.white }}
                  >
                    {MESSAGES.travelPreferences}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {userData.travel_style && (
                      <div className="bg-white/5 border border-[#C9A84C]/20 rounded-2xl p-6 hover:bg-white/8 transition">
                        <div className="flex items-center gap-3 mb-3">
                          <StyleIcon style={userData.travel_style.toLowerCase()} />
                          <h3
                            className="text-sm font-semibold"
                            style={{ fontFamily: FONTS.body, color: C.textGold }}
                          >
                            {MESSAGES.travelStyle}
                          </h3>
                        </div>
                        <p
                          className="text-lg"
                          style={{ fontFamily: FONTS.body, color: C.white }}
                        >
                          {userData.travel_style}
                        </p>
                      </div>
                    )}
                    {userData.pace && (
                      <div className="bg-white/5 border border-[#C9A84C]/20 rounded-2xl p-6 hover:bg-white/8 transition">
                        <div className="flex items-center gap-3 mb-3">
                          <PaceIcon pace={userData.pace.toLowerCase()} />
                          <h3
                            className="text-sm font-semibold"
                            style={{ fontFamily: FONTS.body, color: C.textGold }}
                          >
                            {MESSAGES.pace}
                          </h3>
                        </div>
                        <p
                          className="text-lg capitalize"
                          style={{ fontFamily: FONTS.body, color: C.white }}
                        >
                          {userData.pace.replace("_", " ")}
                        </p>
                      </div>
                    )}
                    {userData.preferred_destinations && (
                      <div className="bg-white/5 border border-[#C9A84C]/20 rounded-2xl p-6 hover:bg-white/8 transition">
                        <div className="flex items-center gap-3 mb-3">
                          <Globe className="w-5 h-5" style={{ color: C.textGold }} />
                          <h3
                            className="text-sm font-semibold"
                            style={{ fontFamily: FONTS.body, color: C.textGold }}
                          >
                            {MESSAGES.destinations}
                          </h3>
                        </div>
                        <p
                          className="text-lg"
                          style={{ fontFamily: FONTS.body, color: C.white }}
                        >
                          {userData.preferred_destinations}
                        </p>
                      </div>
                    )}
                    {userData.accomodation_preference && (
                      <div className="bg-white/5 border border-[#C9A84C]/20 rounded-2xl p-6 hover:bg-white/8 transition">
                        <div className="flex items-center gap-3 mb-3">
                          <AccommIcon
                            accommodation={userData.accomodation_preference.toLowerCase()}
                          />
                          <h3
                            className="text-sm font-semibold"
                            style={{ fontFamily: FONTS.body, color: C.textGold }}
                          >
                            {MESSAGES.accommodation}
                          </h3>
                        </div>
                        <p
                          className="text-lg capitalize"
                          style={{ fontFamily: FONTS.body, color: C.white }}
                        >
                          {userData.accomodation_preference}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vibe Levels Section */}
              {(userData.budget_level ||
                userData.adventure_level ||
                userData.social_level) && (
                <div>
                  <h2
                    className="text-2xl font-bold mb-6"
                    style={{ fontFamily: FONTS.display, color: C.white }}
                  >
                    {MESSAGES.vibes}
                  </h2>
                  <div className="space-y-6">
                    {userData.budget_level && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-5 h-5" style={{ color: C.textGold }} />
                            <span
                              className="font-semibold"
                              style={{ fontFamily: FONTS.body, color: C.white }}
                            >
                              {MESSAGES.budget}
                            </span>
                          </div>
                          <span
                            className="font-semibold"
                            style={{ fontFamily: FONTS.mono, color: C.textGold }}
                          >
                            {userData.budget_level}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${(userData.budget_level / 10) * 100}%`,
                              backgroundImage: `linear-gradient(to right, ${C.textGold}, ${C.goldLight})`
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {userData.adventure_level && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" style={{ color: C.textGold }} />
                            <span
                              className="font-semibold"
                              style={{ fontFamily: FONTS.body, color: C.white }}
                            >
                              {MESSAGES.adventure}
                            </span>
                          </div>
                          <span
                            className="font-semibold"
                            style={{ fontFamily: FONTS.mono, color: C.textGold }}
                          >
                            {userData.adventure_level}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${(userData.adventure_level / 10) * 100}%`,
                              backgroundImage: `linear-gradient(to right, ${C.textGold}, ${C.goldLight})`
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {userData.social_level && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" style={{ color: C.textGold }} />
                            <span
                              className="font-semibold"
                              style={{ fontFamily: FONTS.body, color: C.white }}
                            >
                              {MESSAGES.social}
                            </span>
                          </div>
                          <span
                            className="font-semibold"
                            style={{ fontFamily: FONTS.mono, color: C.textGold }}
                          >
                            {userData.social_level}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${(userData.social_level / 10) * 100}%`,
                              backgroundImage: `linear-gradient(to right, ${C.textGold}, ${C.goldLight})`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Friends Sidebar - Right */}
            {!isOwnProfile && (
              <div className="w-80">
                <div className="sticky top-24 bg-white/5 border border-[#C9A84C]/20 rounded-2xl p-6">
                  <h3
                    className="text-lg font-semibold mb-4 flex items-center gap-2"
                    style={{ fontFamily: FONTS.display, color: C.white }}
                  >
                    <Users className="w-5 h-5" style={{ color: C.textGold }} />
                    Friends
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {friendUserFriends && friendUserFriends.length > 0 ? (
                      friendUserFriends.map((friend) => (
                        <Link
                          key={friend.id}
                          to={`/user/${friend.username}`}
                          className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:border-[#C9A84C]/40 hover:bg-white/8 transition group"
                        >
                          <p
                            className="text-sm font-semibold transition"
                            style={{ fontFamily: FONTS.body, color: C.white }}
                          >
                            {friend.first_name && friend.last_name
                              ? `${friend.first_name} ${friend.last_name}`
                              : friend.username}
                          </p>
                          <p
                            className="text-xs transition"
                            style={{ fontFamily: FONTS.body, color: C.textMuted }}
                          >
                            @{friend.username}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <p
                        className="text-center py-6"
                        style={{ fontFamily: FONTS.body, color: C.textMuted }}
                      >
                        No friends yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Unfriend Confirmation Modal */}
        {showUnfriendConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#0f1219] border border-[#C9A84C]/20 rounded-2xl p-8 max-w-md mx-4">
              <h3
                className="text-xl font-bold mb-4"
                style={{ fontFamily: FONTS.display, color: C.white }}
              >
                Remove Friend?
              </h3>
              <p
                className="mb-6"
                style={{ fontFamily: FONTS.body, color: C.textMuted }}
              >
                Are you sure you want to unfriend {userData.first_name || userData.username}? You can always add them back later.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowUnfriendConfirm(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                  style={{ fontFamily: FONTS.body }}
                >
                  Cancel
                </button>
                <button
                  onClick={unfriendUser}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ fontFamily: FONTS.body }}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {actionLoading ? "Unfriending..." : "Unfriend"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        [data-theme="light"] {
          --bg: #f4f0e8;
          --accent: #ff6a00;
          --accent-dark: #e55a00;
          --accent-light: #ffb84d;
          --surface: #ffffff;
          --text: #15120d;
          --text-secondary: #5d5550;
          --border: rgba(21, 18, 13, 0.10);
        }

        /* Ensure text remains visible in light mode */
        [data-theme="light"] .text-white {
          color: #15120d !important;
        }

        [data-theme="light"] .text-white\/80 {
          color: rgba(21, 18, 13, 0.8) !important;
        }

        [data-theme="light"] .text-white\/70 {
          color: rgba(21, 18, 13, 0.7) !important;
        }

        [data-theme="light"] .text-white\/50 {
          color: rgba(21, 18, 13, 0.5) !important;
        }

        [data-theme="light"] .text-white\/30 {
          color: rgba(21, 18, 13, 0.3) !important;
        }

        [data-theme="light"] .min-h-screen {
          background: linear-gradient(180deg, #f4f0e8 0%, #f7f2ea 45%, #f4f0e8 100%);
        }

        [data-theme="light"] .bg-gradient-to-b {
          background-image: linear-gradient(180deg, #f4f0e8 0%, #f7f2ea 45%, #f4f0e8 100%);
        }

        [data-theme="light"] .from-\[#0a0c16\] {
          --tw-gradient-from: #f4f0e8;
        }

        [data-theme="light"] .to-\[#0e0e0e\] {
          --tw-gradient-to: #f7f2ea;
        }

        [data-theme="light"] .text-\[#C9A84C\] {
          color: #ff6a00;
        }

        [data-theme="light"] .text-\[#9a8d5e\] {
          color: #d97706;
        }

        [data-theme="light"] .bg-\[#0d0f1c\] {
          background-color: #ffffff;
        }

        [data-theme="light"] .bg-\[#0a0c16\] {
          background-color: #ffffff;
        }

        [data-theme="light"] .from-\[#C9A84C\] {
          --tw-gradient-from: #ff6a00;
        }

        [data-theme="light"] .to-\[#9a7a3f\] {
          --tw-gradient-to: #ffb84d;
        }

        [data-theme="light"] .ring-\[#0a0c16\] {
          --tw-ring-color: rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] .border-\[#C9A84C\] {
          border-color: #ff6a00;
        }

        [data-theme="light"] .border-\[#3a3f4b\] {
          border-color: rgba(21, 18, 13, 0.15);
        }

        [data-theme="light"] .hover\:bg-\[#1a1d2e\]:hover {
          background-color: #f7f2ea;
        }

        [data-theme="light"] .hover\:text-\[#ffc859\]:hover {
          color: #e55a00;
        }

        [data-theme="light"] button, [data-theme="light"] a[role="button"] {
          color: #15120d;
        }

        [data-theme="light"] button:hover, [data-theme="light"] a[role="button"]:hover {
          background-color: #f7f2ea;
        }

        [data-theme="light"] .shadow-lg {
          box-shadow: 0 14px 40px rgba(21, 18, 13, 0.045);
        }

        [data-theme="light"] input, [data-theme="light"] textarea {
          background-color: #ffffff;
          color: #15120d;
          border-color: rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] input:focus, [data-theme="light"] textarea:focus {
          border-color: #ff6a00;
          box-shadow: 0 0 0 3px rgba(255, 106, 0, 0.1);
        }
      `}</style>
    </>
  );
}
