import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle, XCircle, Mail, AlertCircle, Loader2, UserPlus } from "lucide-react";
import api from "../API/api";
import { useToast } from "../hooks/useToast";

export default function NotificationPanel({ onClose, onUnreadChange }) {
  const navigate = useNavigate();
  const { success, error: showError, info } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [prevNotifications, setPrevNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [requestAction, setRequestAction] = useState({});

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('access_token');
      if (!token) {
        setNotifications([]);
        onUnreadChange(0);
        setError("");
        setLoading(false);
        return;
      }
      
      // Fetch trip notifications, friend requests, and unread messages
      const [tripRes, friendRes, messagesRes] = await Promise.all([
        api.get("/api/trips/notifications/"),
        api.get("/api/users/friend-requests/pending/"),
        api.get("/api/chat/messages/unread/")
      ]);
      
      const tripNotifs = tripRes.data || [];
      
      const friendRequests = (friendRes.data?.pending_requests || []).map((req, idx) => ({
        id: `friend_${req.id}`,
        notification_type: "friend_request",
        notification_type_display: "Friend request",
        actor_name: req.first_name && req.last_name ? `${req.first_name} ${req.last_name}` : req.username,
        message: `${req.first_name && req.last_name ? `${req.first_name} ${req.last_name}` : req.username} sent you a friend request`,
        time_ago: "Just now",
        is_read: false,
        friend_request_id: req.id,
        requester: req,
        profile_picture: req.profile_picture,
        username: req.username
      }));
      
      const unreadMessages = (messagesRes.data?.results || [])
        .filter(msg => msg.is_read === false)  // Only show truly unread messages
        .map((msg) => ({
        id: `message_${msg.id}`,
        notification_type: "message",
        notification_type_display: "Message",
        actor_name: msg.sender_name,
        message: msg.content,
        time_ago: new Date(msg.timestamp).toLocaleString(),
        is_read: msg.is_read,
        message_id: msg.id,
        sender_name: msg.sender_name,
        sender_id: msg.sender,
        profile_picture: msg.profile_picture || null,
        timestamp: msg.timestamp,
        trip_id: msg.trip,
        trip_name: msg.trip_name,
        is_group: msg.trip ? true : false
      }));
      
      console.log("Unread messages processed:", unreadMessages.length, unreadMessages);
      
      // Group messages by sender and keep latest 3 per sender
      const groupedMessages = {};
      unreadMessages.forEach(msg => {
        // For group messages, group by trip+sender instead of just sender
        const groupKey = msg.is_group ? `group_${msg.trip_id}_${msg.sender_id}` : `direct_${msg.sender_id}`;
        
        if (!groupedMessages[groupKey]) {
          groupedMessages[groupKey] = {
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            profile_picture: msg.profile_picture,
            messages: [msg],
            total_count: 1,
            latest_timestamp: msg.timestamp,
            trip_id: msg.trip_id,
            trip_name: msg.trip_name,
            is_group: msg.is_group
          };
        } else {
          groupedMessages[groupKey].messages.push(msg);
          groupedMessages[groupKey].total_count += 1;
          if (new Date(msg.timestamp) > new Date(groupedMessages[groupKey].latest_timestamp)) {
            groupedMessages[groupKey].latest_timestamp = msg.timestamp;
          }
        }
      });
      
      // Convert to notification format (keep only latest 3 messages per sender/group)
      const groupedMessageNotifs = Object.values(groupedMessages).map(group => ({
        id: group.is_group ? `message_group_${group.trip_id}_${group.sender_id}` : `message_group_${group.sender_id}`,
        notification_type: "message",
        notification_type_display: "Message",
        actor_name: group.sender_name,
        sender_name: group.sender_name,
        sender_id: group.sender_id,
        profile_picture: group.profile_picture,
        message_id: group.messages[group.messages.length - 1].message_id, // latest message ID for marking as read
        messages: group.messages.slice(-3), // Keep last 3 messages
        total_count: group.total_count, // Total unread from this sender
        is_read: false,
        time_ago: new Date(group.latest_timestamp).toLocaleString(),
        trip_id: group.trip_id,
        trip_name: group.trip_name,
        is_group: group.is_group
      }));
      
      // Combine and sort by time (friend requests and grouped messages first)
      const allNotifs = [...friendRequests, ...groupedMessageNotifs, ...tripNotifs];
      setNotifications(allNotifs);
      // Update parent with accurate count of actual unread notifications
      onUnreadChange(allNotifs.length);
      
      // Show toasts for new notifications
      allNotifs.forEach(notif => {
        const prevNotif = prevNotifications.find(p => p.id === notif.id);
        if (!prevNotif) {
          // This is a new notification, show toast
          if (notif.notification_type === "friend_request") {
            info(`${notif.actor_name} sent you a friend request`);
          } else if (notif.notification_type === "message") {
            info(`${notif.sender_name} sent you a message: "${notif.messages?.[0]?.message || 'New message'}"`);
          } else if (notif.notification_type === "trip_invitation") {
            info(`${notif.actor_name} invited you to ${notif.trip_name}`);
          } else if (notif.notification_type.includes("trip") || notif.notification_type.includes("expense")) {
            info(`New update: ${notif.message || notif.notification_type_display}`);
          }
        }
      });
      
      // Update previous notifications for next comparison
      setPrevNotifications(allNotifs);
      setError("");
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
      // Update parent - no notifications
      onUnreadChange(0);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.is_read) return;

    try {
      await api.patch(`/api/trips/notifications/${notification.id}/read/`);
      // Remove notification from list once marked as read
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notification.id);
        // Update parent with new count
        onUnreadChange(updated.length);
        return updated;
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMessageNotificationClick = async (notification) => {
    try {
      console.log("Handling message notification click:", notification);
      console.log("Messages in notification:", notification.messages);
      
      if (!notification.messages || notification.messages.length === 0) {
        console.warn("No messages found in notification");
        // Still navigate even if no messages to mark
        if (notification.is_group) {
          navigate(`/trip/${notification.trip_id}`);
        } else {
          sessionStorage.setItem("selectedFriendId", notification.sender_id.toString());
          sessionStorage.setItem("selectedFriendName", notification.sender_name);
          navigate("/chat");
        }
        onClose();
        return;
      }
      
      // Mark all messages in this group as read
      const markReadRequests = notification.messages.map(msg => {
        console.log("Processing message:", msg);
        const msgId = msg.message_id || msg.id;
        if (!msgId) {
          console.warn("Message has no ID:", msg);
          return Promise.resolve();
        }
        console.log("Marking message ID:", msgId);
        return api.patch(`/api/chat/messages/${msgId}/mark_as_read/`)
          .catch(err => {
            console.error(`Failed to mark message ${msgId} as read:`, err);
            // Continue with other messages even if one fails
            return null;
          });
      });
      
      const responses = await Promise.all(markReadRequests);
      console.log("Mark as read responses:", responses);
      
      // Count successful responses
      const successCount = responses.filter(r => r !== null).length;
      console.log(`Successfully marked ${successCount} out of ${notification.messages.length} messages as read`);
      
      // Show success toast
      if (successCount > 0) {
        success(`Marked ${successCount} message${successCount > 1 ? 's' : ''} as read`);
      }
      
      // Remove notification from list (it's now read)
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notification.id);
        console.log(`Removed notification ${notification.id}. Remaining: ${updated.length}`);
        // Update parent's unread count
        onUnreadChange(updated.length);
        return updated;
      });
      
      // Navigate based on message type
      if (notification.is_group) {
        console.log("Navigating to trip:", notification.trip_id);
        navigate(`/trip/${notification.trip_id}`);
      } else {
        console.log("Navigating to chat with user:", notification.sender_id);
        sessionStorage.setItem("selectedFriendId", notification.sender_id.toString());
        sessionStorage.setItem("selectedFriendName", notification.sender_name);
        navigate("/chat");
      }
      
      onClose();
    } catch (err) {
      console.error("Failed to handle message notification click:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error message:", err.message);
      
      // Show error toast
      showError("Failed to mark message as read", 3000);
      
      // Still navigate and close even if marking as read fails
      try {
        if (notification.is_group) {
          navigate(`/trip/${notification.trip_id}`);
        } else {
          sessionStorage.setItem("selectedFriendId", notification.sender_id.toString());
          sessionStorage.setItem("selectedFriendName", notification.sender_name);
          navigate("/chat");
        }
      } catch (navErr) {
        console.error("Failed to navigate:", navErr);
      }
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/api/trips/notifications/read-all/");
      // Clear all notifications (they're all now read)
      setNotifications([]);
      onUnreadChange(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleInvitationAction = async (notification, action) => {
    setActionLoading(prev => ({ ...prev, [notification.id]: true }));
    try {
      // Use the invitation_id stored in the notification directly
      if (!notification.invitation) {
        console.warn("Invitation ID not found in notification");
        // Remove the notification from the list anyway
        setNotifications(prev => {
          const updated = prev.filter(n => n.id !== notification.id);
          onUnreadChange(updated.length);
          return updated;
        });
        return;
      }
      
      const response = await api.patch(`/api/trips/invitations/${notification.invitation}/respond/`, { action });
      
      if (response.status === 200 || response.status === 201) {
        // Remove notification from list
        setNotifications(prev => {
          const updated = prev.filter(n => n.id !== notification.id);
          onUnreadChange(updated.length);
          return updated;
        });
        // Show success toast
        const actionText = action === 'accept' ? 'Accepted' : 'Declined';
        success(`${actionText} invitation to ${notification.trip_name || 'trip'}`);
      }
    } catch (err) {
      console.error(`Failed to ${action} invitation:`, err);
      showError(`Failed to ${action} invitation`, 3000);
      
      // Refresh notifications to sync with server state
      setTimeout(() => fetchNotifications(), 1000);
    } finally {
      setActionLoading(prev => ({ ...prev, [notification.id]: false }));
    }
  };

  const handleFriendRequestResponse = async (notification, action) => {
    setRequestAction(prev => ({ ...prev, [notification.id]: true }));
    try {
      const response = await api.post(`/api/users/friend-request/${notification.friend_request_id}/respond/`, { action });
      
      if (response.status === 200 || response.status === 201) {
        // Remove the notification from the list
        setNotifications(prev => {
          const updated = prev.filter(n => n.id !== notification.id);
          onUnreadChange(updated.length);
          return updated;
        });
        // Show success toast
        const actionText = action === 'accept' ? 'Accepted' : 'Declined';
        success(`${actionText} friend request from ${notification.requester.first_name || notification.requester.username}`);
      }
    } catch (err) {
      console.error(`Failed to ${action} friend request:`, err);
      showError(`Failed to ${action} friend request`, 3000);
      console.error(`Failed to ${action} friend request:`, err);
      
      // Refresh notifications to sync with server state
      setTimeout(() => fetchNotifications(), 1000);
    } finally {
      setRequestAction(prev => ({ ...prev, [notification.id]: false }));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expireTime = new Date(expiresAt);
    const diffMs = expireTime - now;
    
    if (diffMs <= 0) {
      return "Expired";
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m remaining`;
    }
    return `${diffMins}m remaining`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "invitation_received":
      case "invitation_accepted":
      case "invitation_rejected":
        return <Mail size={16} className="text-blue-400" />;
      case "member_joined":
        return <CheckCircle size={16} className="text-green-400" />;
      case "member_left":
        return <XCircle size={16} className="text-red-400" />;
      case "friend_request":
        return <UserPlus size={16} className="text-purple-400" />;
      case "message":
        return <Mail size={16} className="text-cyan-400" />;
      default:
        return <AlertCircle size={16} className="text-yellow-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "invitation_received":
        return "bg-blue-900 border-blue-700 hover:bg-blue-800";
      case "invitation_accepted":
        return "bg-green-900 border-green-700 hover:bg-green-800";
      case "invitation_rejected":
        return "bg-red-900 border-red-700 hover:bg-red-800";
      case "member_joined":
        return "bg-green-900 border-green-700 hover:bg-green-800";
      case "member_left":
        return "bg-red-900 border-red-700 hover:bg-red-800";
      case "friend_request":
        return "bg-purple-900 border-purple-700 hover:bg-purple-800";
      case "message":
        return "bg-cyan-900 border-cyan-700 hover:bg-cyan-800";
      default:
        return "bg-yellow-900 border-yellow-700 hover:bg-yellow-800";
    }
  };

  const isActionableNotification = (type) => {
    return type === "invitation_received" || type === "friend_request";
  };

  return (
    <div
      className="notification-panel absolute right-0 top-12 w-[420px] rounded-2xl shadow-2xl z-50 border overflow-hidden"
      style={{ maxHeight: "600px", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div className="notification-panel-header flex items-center justify-between px-6 py-4 border-b">
        <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text)" }}>
          <div className="p-2 rounded-lg bg-cyan-700 border border-cyan-600">
            <AlertCircle size={18} className="text-cyan-400" />
          </div>
          Notifications
        </h3>
        <button onClick={onClose} className="text-[var(--text-lighter)] hover:text-[var(--text)] transition-colors p-1.5 hover:bg-cyan-900 rounded-lg">
          <X size={20} />
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ flex: 1, overflowY: "auto" }} className="notification-panel-list scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="text-cyan-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400/80 text-sm font-medium" style={{ color: "#f87171" }}>{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="notification-panel-empty mx-auto w-12 h-12 rounded-full border flex items-center justify-center mb-3">
              <AlertCircle size={24} className="" style={{ color: "var(--text-faintest)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-lighter)" }}>No notifications yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faintest)" }}>Stay tuned for updates!</p>
          </div>
        ) : (
          <div className="notification-panel-divider divide-y">
            {notifications.map(notif => {
              // Render friend requests
              if (notif.notification_type === "friend_request") {
                const pic = notif.profile_picture || null;
                const initial = notif.username?.[0]?.toUpperCase() || "U";
                
                return (
                  <div
                    key={notif.id}
                    className="p-4 border-l-4 border-l-purple-600 bg-purple-900 hover:bg-purple-800 transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate(`/user/${notif.username}`)}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-purple-700 border border-purple-600 flex items-center justify-center group-hover:ring-2 ring-purple-600 transition-all">
                        {pic ? (
                          <img 
                            src={pic} 
                            alt={notif.username} 
                            className="h-full w-full object-cover"
                            onError={e => e.target.style.display = "none"}
                          />
                        ) : (
                          <span className="text-sm font-bold text-purple-300">{initial}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold transition" style={{ color: "var(--text)" }}>
                          {notif.actor_name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-lighter)" }}>@{notif.username}</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: "#c084fc" }}>sent you a friend request</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {e.stopPropagation(); handleFriendRequestResponse(notif, "accept");}}
                          disabled={requestAction[notif.id]}
                          className="h-8 w-8 rounded-lg border flex items-center justify-center transition-all font-medium text-sm disabled:opacity-40"
                          style={{ backgroundColor: "#7c3aed", borderColor: "#6d28d9", color: "#e9d5ff" }}
                        >
                          {requestAction[notif.id] ? <Loader2 size={16} className="animate-spin" /> : "✓"}
                        </button>
                        <button
                          onClick={(e) => {e.stopPropagation(); handleFriendRequestResponse(notif, "reject");}}
                          disabled={requestAction[notif.id]}
                          className="h-8 w-8 rounded-lg border flex items-center justify-center transition-all font-medium text-sm disabled:opacity-40"
                          style={{ backgroundColor: "var(--surface-hover)", borderColor: "var(--border)", color: "var(--text-lighter)" }}
                        >
                          {requestAction[notif.id] ? <Loader2 size={16} className="animate-spin" /> : "✕"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Render message notifications
              if (notif.notification_type === "message") {
                const pic = notif.profile_picture || null;
                const initial = notif.sender_name?.[0]?.toUpperCase() || "U";
                const latestMsg = notif.messages?.[notif.messages.length - 1];
                const hasMultiple = notif.total_count > 1;
                
                return (
                  <div
                    key={notif.id}
                    className={`p-4 border-l-4 transition-all duration-200 cursor-pointer group ${
                      notif.is_read
                        ? "border-l-transparent bg-transparent hover:bg-[var(--surface-hover)]"
                        : "border-l-cyan-600 bg-cyan-900 hover:bg-cyan-800"
                    }`}
                    onClick={() => handleMessageNotificationClick(notif)}
                  >
                    <div className="flex gap-3.5">
                      <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-cyan-700 border border-cyan-600 flex items-center justify-center relative group-hover:ring-2 ring-cyan-600 transition-all">
                        {pic ? (
                          <img 
                            src={pic} 
                            alt={notif.sender_name} 
                            className="h-full w-full object-cover"
                            onError={e => e.target.style.display = "none"}
                          />
                        ) : (
                          <span className="text-xs font-bold text-cyan-300">{initial}</span>
                        )}
                        {hasMultiple && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border border-cyan-400 shadow-lg">
                            {notif.total_count > 9 ? "9+" : notif.total_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold transition" style={{ color: "var(--text)" }}>
                                {notif.sender_name}
                              </p>
                              {hasMultiple && (
                                <span className="text-xs bg-cyan-700 text-cyan-100 px-2 py-0.5 rounded-full border border-cyan-600 font-medium">
                                  +{notif.total_count}
                                </span>
                              )}
                            </div>
                            {notif.is_group ? (
                              <p className="text-xs text-cyan-300/70 mt-0.5 font-medium">
                                message in <span className="text-cyan-200 font-semibold">{notif.trip_name}</span>
                              </p>
                            ) : (
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-lighter)" }}>sent you a message</p>
                            )}
                            
                            <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: "var(--text-lighter)" }}>{latestMsg?.message}</p>
                          </div>
                          {!notif.is_read && (
                            <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 shadow-lg mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs mt-2.5 font-medium" style={{ color: "var(--text-faintest)" }}>{notif.time_ago}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Render trip notifications
              return (
                <div
                  key={notif.id}
                  className={`p-4 border-l-4 transition-all duration-200 cursor-pointer group ${
                    notif.is_read
                      ? "border-l-transparent hover:bg-[var(--surface-hover)]"
                      : "border-l-blue-600 bg-blue-900 hover:bg-blue-800"
                  }`}
                  onClick={() => {
                    handleMarkAsRead(notif);
                    navigate(`/trip/${notif.trip}`);
                  }}
                >
                  <div className="flex gap-3.5">
                    <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-blue-700 border border-blue-600 text-blue-400 group-hover:bg-blue-600 transition-all">
                      {getNotificationIcon(notif.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold transition" style={{ color: "var(--text)" }}>
                            {notif.trip_title}
                          </p>
                          <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-lighter)" }}>
                            {notif.actor_name && `${notif.actor_name} • `}
                            {notif.notification_type_display}
                          </p>
                          {notif.message && (
                            <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-lighter)" }}>{notif.message}</p>
                          )}
                        </div>
                        {!notif.is_read && (
                          <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg mt-1.5" />
                        )}
                      </div>
<p className="text-xs mt-2.5 font-medium" style={{ color: "var(--text-faintest)" }}>{notif.time_ago}</p>

                      {/* Action Buttons for Invitations */}
                      {notif.notification_type === "invitation_received" && !notif.is_expired && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleInvitationAction(notif, "accept")}
                            disabled={actionLoading[notif.id]}
                            className="flex-1 px-3 py-2 text-xs font-semibold bg-green-700 text-green-100 hover:bg-green-600 border border-green-600 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {actionLoading[notif.id] ? <Loader2 size={14} className="animate-spin" /> : <>✓ Accept</>}
                          </button>
                          <button
                            onClick={() => handleInvitationAction(notif, "reject")}
                            disabled={actionLoading[notif.id]}
                            className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 border"
                            style={{ backgroundColor: "var(--surface-hover)", color: "var(--text-lighter)", borderColor: "var(--border)" }}
                          >
                            {actionLoading[notif.id] ? <Loader2 size={14} className="animate-spin" /> : <>✕ Decline</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {unreadCount > 0 && notifications.length > 0 && (
        <div className="notification-panel-footer border-t p-3">
          <button
            onClick={handleMarkAllAsRead}
            className="w-full text-center text-xs font-medium py-2 rounded-lg hover:bg-blue-700 transition"
            style={{ color: "var(--accent)", borderColor: "var(--border)" }}
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* LIGHT MODE CSS & THEME VARIABLES */}
      <style>{`
        .notification-panel {
          background: #0f1219;
          border-color: rgba(201, 168, 76, 0.2);
        }

        .notification-panel-header {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
          border-bottom-color: rgba(255, 255, 255, 0.1);
        }

        .notification-panel-list {
          background: #0f1219;
        }

        .notification-panel-divider > * + * {
          border-top-color: rgba(255, 255, 255, 0.08);
        }

        .notification-panel-empty {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .notification-panel-footer {
          background: #0f1219;
          border-top-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="light"] .notification-panel {
          background: linear-gradient(180deg, #ffffff 0%, #f7f2ea 95%);
          border-color: rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] .notification-panel-header {
          background: linear-gradient(90deg, #f7f2ea 0%, transparent 100%);
          border-bottom-color: rgba(21, 18, 13, 0.08);
        }

        [data-theme="light"] .notification-panel-list {
          background: #ffffff;
        }

        [data-theme="light"] .notification-panel-divider > * + * {
          border-top-color: rgba(21, 18, 13, 0.08);
        }

        [data-theme="light"] .notification-panel-empty {
          background: #f7f2ea;
          border-color: rgba(21, 18, 13, 0.10);
        }

        [data-theme="light"] .notification-panel-footer {
          background: #ffffff;
          border-top-color: rgba(21, 18, 13, 0.10);
        }
      `}</style>
    </div>
  );
}
