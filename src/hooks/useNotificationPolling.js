import { useEffect, useRef } from "react";
import { useToast } from "./useToast";
import api from "../API/api";

export const useNotificationPolling = () => {
  const { info } = useToast();
  const prevNotificationsRef = useRef({
    messages: [],
    friendRequests: [],
    trips: []
  });

  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Fetch all notifications in parallel
        const [messagesRes, friendRes, tripRes] = await Promise.all([
          api.get("/api/chat/messages/unread/").catch(() => ({ data: { results: [] } })),
          api.get("/api/users/friend-requests/pending/").catch(() => ({ data: { pending_requests: [] } })),
          api.get("/api/trips/notifications/").catch(() => ({ data: [] }))
        ]);

        // Process messages
        const newMessages = (messagesRes.data?.results || [])
          .filter(msg => msg.is_read === false)
          .map(msg => ({
            id: `msg_${msg.id}`,
            type: "message",
            sender_name: msg.sender_name,
            content: msg.content,
            timestamp: msg.timestamp
          }));

        // Process friend requests
        const newFriendRequests = (friendRes.data?.pending_requests || []).map(req => ({
          id: `freq_${req.id}`,
          type: "friend_request",
          actor_name: req.first_name && req.last_name ? `${req.first_name} ${req.last_name}` : req.username
        }));

        // Process trip notifications
        const newTripNotifs = (tripRes.data || []).map(trip => ({
          id: `trip_${trip.id}`,
          type: "trip",
          message: trip.message,
          trip_name: trip.trip_name,
          actor_name: trip.actor_name
        }));

        // Check for new messages
        const prevMsgIds = prevNotificationsRef.current.messages.map(m => m.id);
        newMessages.forEach(msg => {
          if (!prevMsgIds.includes(msg.id)) {
            info(`${msg.sender_name} sent you a message: "${msg.content || 'New message'}"`);
          }
        });

        // Check for new friend requests
        const prevFreqIds = prevNotificationsRef.current.friendRequests.map(f => f.id);
        newFriendRequests.forEach(req => {
          if (!prevFreqIds.includes(req.id)) {
            info(`${req.actor_name} sent you a friend request`);
          }
        });

        // Check for new trip notifications
        const prevTripIds = prevNotificationsRef.current.trips.map(t => t.id);
        newTripNotifs.forEach(trip => {
          if (!prevTripIds.includes(trip.id)) {
            info(`${trip.actor_name} invited you to ${trip.trip_name || 'a trip'}`);
          }
        });

        // Update refs
        prevNotificationsRef.current = {
          messages: newMessages,
          friendRequests: newFriendRequests,
          trips: newTripNotifs
        };
      } catch (err) {
        // Silently fail
        console.debug("Notification polling error:", err);
      }
    };

    // Poll immediately on mount
    pollNotifications();

    // Then poll every 5 seconds
    const interval = setInterval(pollNotifications, 5000);
    return () => clearInterval(interval);
  }, [info]);
};
