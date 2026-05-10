import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChatListSkeleton, MessageThreadSkeleton } from "../components/SkeletonLoaders";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════
const MESSAGES = {
  sidebarTitle: "Messages",
  searchPlaceholder: "Search…",
  noConversations: "No conversations yet",
  noConversationsHint: "Add friends or join trips to start chatting",
  directSection: "Direct",
  groupsSection: "Groups",
  selectConversation: "Select a conversation",
  startChatting: "to start chatting",
  noMessages: "No messages yet",
  sayHi: "Say hi!",
  dateToday: "Today",
  startConversation: "Start a conversation",
  membersLabel: "members",
  online: "Online",
  messagePrefix: "Message",
};

const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#fce7f3", color: "#be185d" },
  { bg: "#fef3c7", color: "#b45309" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#ede9fe", color: "#6d28d9" },
];const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

  .chat-root *, .chat-root *::before, .chat-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }
  .chat-root {
    font-family: 'DM Sans', sans-serif;
    display: flex;
    height: calc(100vh - 70px);
    overflow: hidden;
    background: var(--bg-page);
    --bg-page:       #0f1219;
    --bg-surface:    #1a1f2e;
    --bg-muted:      #252d3d;
    --bg-hover:      #2d3541;
    --border:        rgba(255,255,255,0.1);
    --border-strong: rgba(201,168,76,0.3);
    --text-primary:  #ffffff;
    --text-secondary:#d0d0d0;
    --text-muted:    #999999;
    --accent:        #C9A84C;
    --accent-hover:  #d4b76a;
    --bubble-in-bg:  #252d3d;
    --bubble-out-bg: #C9A84C;
    --bubble-out-tx: #0f1219;
    --unread:        #C9A84C;
    --online:        #22c55e;
  }

  [data-theme="light"] .chat-root {
    --bg-page:       #f5f0e8;
    --bg-surface:    #ffffff;
    --bg-muted:      #f1e8dc;
    --bg-hover:      #eadfce;
    --border:        rgba(21, 18, 13, 0.12);
    --border-strong: rgba(217,119,6,0.28);
    --text-primary:  #17130e;
    --text-secondary:#3a3128;
    --text-muted:    #756a5f;
    --accent:        #d97706;
    --accent-hover:  #b45309;
    --bubble-in-bg:  #ffffff;
    --bubble-out-bg: #d97706;
    --bubble-out-tx: #ffffff;
    --unread:        #d97706;
    --online:        #16a34a;
  }

  /* ── Scrollbar ── */
  .chat-root ::-webkit-scrollbar { width: 3px; }
  .chat-root ::-webkit-scrollbar-thumb { background: rgba(201, 168, 76, 0.4); border-radius: 3px; }
  [data-theme="light"] .chat-root ::-webkit-scrollbar-thumb { background: rgba(217, 119, 6, 0.35); }

  /* ── Sidebar ── */
  .sidebar {
    width: 272px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
  }
  .sidebar-header {
    padding: 20px 18px 14px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .sidebar-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.3px;
  }
  .search-wrap {
    padding: 10px 12px;
    flex-shrink: 0;
  }
  .search-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
    background: var(--bg-muted);
    border-width: 1px;
    border-style: solid;
    border-color: var(--border);
    border-radius: 10px;
    padding: 7px 11px;
    transition: border-color 0.15s;
  }
  .search-row:focus-within { border-color: var(--accent); }
  .search-row input {
    border: none;
    background: transparent;
    font-size: 13px;
    color: var(--text-primary);
    outline: none;
    width: 100%;
    font-family: inherit;
  }
  .search-row input::placeholder { color: var(--text-muted); }
  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    padding: 8px 18px 4px;
    flex-shrink: 0;
  }
  .conv-list { flex: 1; overflow-y: auto; padding: 4px 8px 8px; }
  .conv-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.12s;
    border: 1px solid transparent;
    margin-bottom: 2px;
  }
  .conv-item:hover { background: var(--bg-hover); }
  .conv-item.active {
    background: var(--bg-muted);
    border-color: var(--border-strong);
  }

  /* ── Avatar ── */
  .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
    background: rgba(201, 168, 76, 0.2);
    color: #C9A84C;
    letter-spacing: -0.3px;
  }
  .avatar.group {
    border-radius: 10px;
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    font-size: 16px;
  }
  .avatar.sm {
    width: 28px;
    height: 28px;
    font-size: 10px;
    align-self: flex-end;
  }
  .avatar-colors { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
  .avatar-warm   { background: rgba(201, 168, 76, 0.2); color: #C9A84C; }

  /* ── Conv meta ── */
  .conv-meta { flex: 1; min-width: 0; }
  .conv-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .conv-preview {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }
  .conv-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    flex-shrink: 0;
  }
  .conv-time { font-size: 11px; color: var(--text-muted); }
  .unread-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--unread);
  }

  /* ── Empty state ── */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
    gap: 8px;
  }
  .empty-icon { font-size: 32px; }
  .empty-title { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
  .empty-sub { font-size: 12px; }
  .error-box {
    font-size: 11px;
    color: #ff6b6b;
    margin-top: 10px;
    padding: 10px;
    background: rgba(255, 107, 107, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(255, 107, 107, 0.3);
  }

  /* ── Thread ── */
  .thread {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--bg-page);
  }
  .thread-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    background: var(--bg-surface);
  }
  .thread-info { flex: 1; min-width: 0; }
  .thread-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.2px;
  }
  .thread-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 1px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .online-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--online);
    flex-shrink: 0;
  }
  .thread-actions { display: flex; gap: 6px; }
  .icon-btn {
    width: 30px;
    height: 30px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: background 0.12s, border-color 0.12s;
  }
  .icon-btn:hover { background: var(--bg-muted); border-color: var(--border-strong); }

  /* ── Messages ── */
  .messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .date-divider { text-align: center; margin: 14px 0 10px; }
  .date-pill {
    display: inline-block;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 3px 12px;
  }
  .msg-row {
    display: flex;
    gap: 8px;
    margin-bottom: 1px;
  }
  .msg-row.sent { flex-direction: row-reverse; }
  .bubble-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: 68%;
  }
  .msg-row.sent .bubble-group { align-items: flex-end; }
  .bubble {
    padding: 9px 13px;
    border-radius: 16px;
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-primary);
    background: var(--bubble-in-bg);
    border: 1px solid var(--border);
    word-break: break-word;
  }
  [data-theme="light"] .bubble {
    box-shadow: 0 1px 2px rgba(21, 18, 13, 0.04);
  }
  .bubble.sent {
    background: var(--bubble-out-bg);
    border-color: var(--bubble-out-bg);
    color: var(--bubble-out-tx);
  }
  .bubble.first-in  { border-top-left-radius: 4px; }
  .bubble.last-in   { border-bottom-left-radius: 4px; }
  .bubble.first-out { border-top-right-radius: 4px; }
  .bubble.last-out  { border-bottom-right-radius: 4px; }
  .msg-time {
    font-size: 10px;
    color: var(--text-muted);
    padding: 0 4px;
    margin-top: 3px;
  }
  .msg-time.right { text-align: right; }

  /* ── Spinner ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ── Empty thread ── */
  .thread-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
    color: var(--text-muted);
    text-align: center;
  }
  .thread-empty-icon { font-size: 36px; }
  .thread-empty-title { font-size: 15px; font-weight: 500; color: var(--text-secondary); }
  .thread-empty-sub { font-size: 13px; }

  /* ── Input area ── */
  .input-area {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    background: var(--bg-surface);
  }
  .input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-muted);
    border-width: 1px;
    border-style: solid;
    border-color: var(--border-strong);
    border-radius: 22px;
    padding: 6px 6px 6px 16px;
    transition: border-color 0.15s;
  }
  .input-row:focus-within { border-color: var(--accent); }
  .input-row input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 13px;
    color: var(--text-primary);
    outline: none;
    font-family: inherit;
  }
  .input-row input::placeholder { color: var(--text-muted); }
  .send-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, opacity 0.15s;
    color: #ffffff;
  }
  .send-btn:hover:not(:disabled) { background: var(--accent-hover); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;

// ── Helper: get avatar initials ──────────────────────────────────────────────
function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Helper: reliably get sender ID from message ─────────────────────
function getSenderId(msg) {
  // Backend sends 'sender' directly as an ID number
  return msg?.sender || msg?.sender_id || msg?.user?.id || msg?.user_id;
}

// ── Helper: avatar color class by index ─────────────────────────────────────
function avatarStyle(idx) {
  const c = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return { background: c.bg, color: c.color };
}

function sameId(a, b) {
  return a != null && b != null && String(a) === String(b);
}

function relatedUserId(value) {
  return value && typeof value === "object" ? value.id : value;
}

// ── SendIcon ─────────────────────────────────────────────────────────────────
function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
      <path d="M14.5 8L2 2l3 6-3 6z" />
    </svg>
  );
}

// ── SearchIcon ───────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" style={{ color: "#a09e9a", flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) { navigate("/"); return; }

        setChatLoading(true);
        setChatError(null);

        const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
        const [meRes, friendsRes, tripsRes] = await Promise.all([
          fetch(`${backendUrl}/api/users/me/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${backendUrl}users/friends/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${backendUrl}/api/trips/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ ok: false })),
        ]);

        let convos = [];
        let currentUserProfileId = null;
        let currentUserAccountId = null;

        if (meRes.ok) {
          const me = await meRes.json();
          currentUserProfileId = me?.id;
          currentUserAccountId = relatedUserId(me?.user);
        }

        try {
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          currentUserAccountId = currentUserAccountId || storedUser?.user?.id || storedUser?.user || storedUser?.id;
          currentUserProfileId = currentUserProfileId || storedUser?.profile_id || storedUser?.profile?.id;
        } catch (e) {
          console.error("Failed to get stored user ID:", e);
        }

        if (friendsRes.ok) {
          const friendsData = await friendsRes.json();
          const friends = Array.isArray(friendsData)
            ? friendsData
            : friendsData.friends || friendsData.results || [];
          
          const baseUrl = backendUrl;
          
          convos = friends.map(friend => {
            // Get profile picture - API returns relative path, need to make it absolute
            let profilePic = friend.profile_pic || friend.avatar || friend.profile_picture || friend.profile_image || null;
            
            // If it's a relative path (starts with /), prepend the base URL
            if (profilePic && profilePic.startsWith('/')) {
              profilePic = `${baseUrl}${profilePic}`;
            }
            
            return {
              id: `friend-${friend.id}`,
              type: "direct",
              name: friend.first_name
                ? `${friend.first_name} ${friend.last_name || ""}`.trim()
                : friend.username || "Friend",
              avatar: profilePic,
              userId: friend.id,
              accountId: friend.user_id,
              unread: 0,
              lastMessage: "",
              lastMessageTime: null,
            };
          });
        }

        if (tripsRes?.ok) {
          try {
            const tripsData = await tripsRes.json();
            const trips = Array.isArray(tripsData)
              ? tripsData
              : tripsData.results || tripsData.trips || [];

            // Show only trip groups the current user belongs to.
            const joinedTrips = trips.filter(trip => {
              const isCreator =
                sameId(trip.creator?.id, currentUserProfileId) ||
                sameId(relatedUserId(trip.creator?.user), currentUserAccountId);

              const isParticipant = trip.participants?.some(p =>
                sameId(p.id, currentUserProfileId) ||
                sameId(relatedUserId(p.user), currentUserAccountId)
              );

              return isCreator || isParticipant;
            });
            
            const groupConvos = joinedTrips.map(trip => ({
              id: `group-${trip.id}`,
              type: "group",
              name: trip.title || "Trip Group",
              avatar: trip.cover_image || null,
              tripId: trip.id,
              memberCount: trip.participants?.length || 0,
              unread: 0,
              lastMessage: "",
              lastMessageTime: null,
            }));
            convos = [...convos, ...groupConvos];
          } catch (e) {
            console.warn("Failed to parse trips data:", e);
          }
        }

        setConversations(convos);
        setChatLoading(false);

        // Auto-select from sessionStorage
        const selectedFriendId = sessionStorage.getItem("selectedFriendId");
        if (selectedFriendId) {
          const friendConvo = convos.find(
            c => c.userId?.toString() === selectedFriendId || c.accountId?.toString() === selectedFriendId
          );
          if (friendConvo) setSelectedConversation(friendConvo);
          sessionStorage.removeItem("selectedFriendId");
          sessionStorage.removeItem("selectedFriendName");
        }
      } catch (error) {
        setChatError("Could not load conversations: " + error.message);
        setChatLoading(false);
      }
    };

    fetchConversations();
  }, [navigate]);

  // Fetch messages for selected conversation (with polling)
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Get current user ID fresh each time
        let userId = null;
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          userId = user?.id;
        } catch (e) {
          console.error("Failed to get user ID:", e);
        }

        const recipientId =
          selectedConversation.userId || selectedConversation.tripId;
        const type = selectedConversation.type;
        const actionName =
          type === "direct" ? "direct_messages" : "group_messages";
        const paramName = type === "direct" ? "recipient_id" : "trip_id";

        const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000/api/";
        const res = await fetch(
          `${backendUrl}/api/chat/messages/${actionName}/?${paramName}=${recipientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.ok) {
          const data = await res.json();
          const messagesData = Array.isArray(data) ? data : data.results || [];
          
          let messagesWithSender = messagesData.map((msg, idx) => {
            // Backend sends 'isSent' (camelCase) as a boolean field
            let isSent = msg.isSent;
            const senderId = getSenderId(msg);
            
            if (isSent === undefined) {
              isSent = Number(senderId) === Number(userId);
            }
            
            return {
              ...msg,
              isSent,
            };
          });

          // For direct messages, use conversation avatar (friend's profile pic)
          // For group messages, profile pics should already be in message.sender
          // No need to fetch - we have what we need!

          setMessages(messagesWithSender);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    setChatLoading(true);
    fetchMessages().finally(() => setChatLoading(false));
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const recipientId =
        selectedConversation.userId || selectedConversation.tripId;
      const type = selectedConversation.type;
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

      const res = await fetch(`${backendUrl}/api/chat/messages/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageInput,
          ...(type === "direct"
            ? { receiver_id: recipientId }
            : { trip_id: recipientId }),
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        console.log("✅ Message sent! Backend response:", {
          id: newMessage.id,
          content: newMessage.content?.slice(0, 30),
          sender: newMessage.sender,
          isSent: newMessage.isSent,
          timestamp: newMessage.timestamp
        });
        // Always mark newly sent messages as sent (from current user)
        setMessages(prev => [...prev, { ...newMessage, isSent: true }]);
        setMessageInput("");
      } else {
        const err = await res.json();
        console.error("Send error:", err);
        setChatError("Could not send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatError("Could not send message");
    }
    setSendingMessage(false);
  };

  // Search filter
  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const directConvos = filteredConversations.filter(c => c.type === "direct");
  const groupConvos  = filteredConversations.filter(c => c.type === "group");

  // Group consecutive messages for cleaner bubble rendering
  const groupedMessages = messages.reduce((groups, msg, i) => {
    const prev = messages[i - 1];
    // Use same sender ID extraction for consistency
    const isSameAuthor =
      prev && getSenderId(prev) === getSenderId(msg);
    if (!isSameAuthor) {
      groups.push([msg]);
    } else {
      groups[groups.length - 1].push(msg);
    }
    return groups;
  }, []);

  return (
    <div className="chat-root">
      <style>{styles}</style>

      {/* ── Sidebar ── */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">{MESSAGES.sidebarTitle}</div>
        </div>

        <div className="search-wrap">
          <div className="search-row">
            <SearchIcon />
            <input
              type="text"
              placeholder={MESSAGES.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {chatLoading && conversations.length === 0 ? (
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            <ChatListSkeleton count={8} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-title">{MESSAGES.noConversations}</div>
            <div className="empty-sub">
              {MESSAGES.noConversationsHint}
            </div>
            {chatError && <div className="error-box">{chatError}</div>}
          </div>
        ) : (
          <div className="conv-list">
            {directConvos.length > 0 && (
              <>
                <div className="section-label">{MESSAGES.directSection}</div>
                {directConvos.map((conv, idx) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    idx={idx}
                    active={selectedConversation?.id === conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setMessages([]);
                    }}
                  />
                ))}
              </>
            )}
            {groupConvos.length > 0 && (
              <>
                <div className="section-label">{MESSAGES.groupsSection}</div>
                {groupConvos.map((conv, idx) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    idx={idx}
                    active={selectedConversation?.id === conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setMessages([]);
                    }}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Thread ── */}
      <div className="thread">
        {!selectedConversation ? (
          <div className="thread-empty">
            <div className="thread-empty-icon">👋</div>
            <div className="thread-empty-title">{MESSAGES.selectConversation}</div>
            <div className="thread-empty-sub">{MESSAGES.startChatting}</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="thread-header">
              <div
                className="avatar"
                style={
                  selectedConversation.type === "group"
                    ? { borderRadius: 10, background: "#dcfce7", color: "#15803d" }
                    : selectedConversation.avatar
                    ? {
                        borderRadius: "50%",
                        backgroundImage: `url(${selectedConversation.avatar})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : avatarStyle(0)
                }
              >
                {selectedConversation.type === "group" ? "👥" : !selectedConversation.avatar && initials(selectedConversation.name)}
              </div>
              <div className="thread-info">
                <div className="thread-name">{selectedConversation.name}</div>
                <div className="thread-sub">
                  {selectedConversation.type === "group" ? (
                    `${selectedConversation.memberCount} ${MESSAGES.membersLabel}`
                  ) : (
                    <>
                      <span className="online-dot" />
                      {MESSAGES.online}
                    </>
                  )}
                </div>
              </div>
              <div className="thread-actions">
                <button className="icon-btn" title="Info" onClick={() => {}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                    stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <line x1="8" y1="7" x2="8" y2="11" />
                    <circle cx="8" cy="5" r="0.6" fill="currentColor" />
                  </svg>
                </button>
                <button className="icon-btn" title="More" onClick={() => {}}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                    stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="3.5" r="1.1" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="8"   r="1.1" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="12.5" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-area">
              {chatLoading && messages.length === 0 ? (
                <MessageThreadSkeleton count={6} />
              ) : messages.length === 0 ? (
                <div className="thread-empty">
                  <div style={{ fontSize: 28 }}>💌</div>
                  <div className="thread-empty-title">{MESSAGES.noMessages}</div>
                  <div className="thread-empty-sub">{MESSAGES.sayHi}</div>
                </div>
              ) : (
                <>
                  <div className="date-divider">
                    <span className="date-pill">{MESSAGES.dateToday}</span>
                  </div>
                  {groupedMessages.map((group, gi) => {
                    const first = group[0];
                    const isSent = first.isSent || first.is_sender;
                    const isSystem = first.is_system;

                    // System messages are rendered differently
                    if (isSystem) {
                      // Get the actual username from sender_name
                      const username = first.sender_name || "A user";
                      const displayText = `${username} joined`;
                      
                      return (
                        <div
                          key={gi}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            margin: "16px 0",
                            opacity: 0.8,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: "1px",
                              background: `var(--border)`,
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              whiteSpace: "nowrap",
                              padding: "0 12px",
                            }}
                          >
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "var(--online)",
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                              {displayText}
                            </span>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              height: "1px",
                              background: `var(--border)`,
                            }}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={gi}
                        className={`msg-row${isSent ? " sent" : ""}`}
                        style={{ marginBottom: 8 }}
                      >
                        {!isSent && (
                          <div
                            className="avatar sm"
                            style={
                              first.sender?.profile_pic || first.profile_pic || selectedConversation.avatar
                                ? {
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    backgroundImage: `url(${first.sender?.profile_pic || first.profile_pic || selectedConversation.avatar})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    flexShrink: 0,
                                    alignSelf: "flex-end",
                                  }
                                : { ...avatarStyle(gi), fontSize: 10 }
                            }
                          >
                            {!first.sender?.profile_pic && !first.profile_pic && !selectedConversation.avatar && initials(
                              first.sender?.username ||
                              first.sender_name ||
                              selectedConversation.name
                            )}
                          </div>
                        )}
                        <div className="bubble-group">
                          {group.map((msg, mi) => {
                            const isFirst = mi === 0;
                            const isLast = mi === group.length - 1;
                            const cls = [
                              "bubble",
                              isSent ? "sent" : "",
                              isFirst && !isSent ? "first-in" : "",
                              isLast  && !isSent ? "last-in"  : "",
                              isFirst && isSent  ? "first-out" : "",
                              isLast  && isSent  ? "last-out"  : "",
                            ]
                              .filter(Boolean)
                              .join(" ");
                            return (
                              <div key={mi} className={cls}>
                                {msg.content || msg.message}
                              </div>
                            );
                          })}
                          <div className={`msg-time${isSent ? " right" : ""}`}>
                            {new Date(
                              group[group.length - 1].created_at ||
                              group[group.length - 1].timestamp
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="input-area">
              {chatError && (
                <div style={{
                  fontSize: 11, color: "#dc2626", marginBottom: 8,
                  padding: "6px 12px", background: "#fef2f2",
                  borderRadius: 8, border: "1px solid #fecaca"
                }}>
                  {chatError}
                </div>
              )}
              <div className="input-row">
                <input
                  type="text"
                  placeholder={`${MESSAGES.messagePrefix} ${selectedConversation.name}…`}
                  value={messageInput}
                  maxLength={1000}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e =>
                    e.key === "Enter" && !e.shiftKey && handleSendMessage()
                  }
                  disabled={sendingMessage}
                />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <div
                      className="spinner"
                      style={{ width: 14, height: 14, borderColor: "rgba(255,255,255,0.4)", borderTopColor: "#fff" }}
                    />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── ConvItem sub-component ────────────────────────────────────────────────────
function ConvItem({ conv, idx, active, onClick }) {
  const ac = AVATAR_COLORS[idx % AVATAR_COLORS.length];

  return (
    <div className={`conv-item${active ? " active" : ""}`} onClick={onClick}>
      {conv.avatar ? (
        <div
          className={`avatar${conv.type === "group" ? " group" : ""}`}
          style={{
            backgroundImage: `url(${conv.avatar})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <div
          className={`avatar${conv.type === "group" ? " group" : ""}`}
          style={conv.type === "group" ? {} : { background: ac.bg, color: ac.color }}
        >
          {conv.type === "group"
            ? "👥"
            : conv.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="conv-meta">
        <div className="conv-name">{conv.name}</div>
        <div className="conv-preview">
          {conv.lastMessage ||
            (conv.type === "group"
              ? `${conv.memberCount} ${MESSAGES.membersLabel}`
              : MESSAGES.startConversation)}
        </div>
      </div>

      <div className="conv-right">
        {conv.lastMessageTime && (
          <div className="conv-time">
            {new Date(conv.lastMessageTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {conv.unread > 0 && <div className="unread-dot" />}
      </div>
    </div>
  );
}
