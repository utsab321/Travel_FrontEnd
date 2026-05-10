import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import api from "../API/api";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count on mount and at intervals
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      // Only fetch if user is logged in
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUnreadCount(0);
        return;
      }
      
      const [tripRes, messagesRes] = await Promise.all([
        api.get("/api/trips/notifications/unread-count/"),
        api.get("/api/chat/messages/unread/")
      ]);
      const tripCount = tripRes.data?.unread_count || 0;
      // Only count truly unread messages (is_read: false)
      const unreadMessageCount = (messagesRes.data?.results || [])
        .filter(msg => msg.is_read === false).length;
      setUnreadCount(tripCount + unreadMessageCount);
    } catch (err) {
      // Silently fail if not authenticated
      if (err.response?.status === 401) {
        setUnreadCount(0);
        return;
      }
      console.error("Failed to fetch unread count:", err);
      setUnreadCount(0);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/80 hover:text-white transition"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel onClose={() => setIsOpen(false)} onUnreadChange={setUnreadCount} />
      )}
    </div>
  );
}
