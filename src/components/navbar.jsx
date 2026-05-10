import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthRequired } from "../hooks/useAuthRequired";
import logo from "../assets/content.png";
import UserSearchBar from "./UserSearchBar";
import NotificationBell from "./NotificationBell";
import "./navbar.css";
import { apiFetch, getBaseUrl, getToken } from "../utils/api";

const NAV_LINKS = [
  { to: "/home", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/dashboard", label: "Dashboard" },
];

const MORE_LINKS = [
  { to: "/chat", label: "Chat" },
  { to: "/about", label: "About" },
];

export default function NavbarComponent() {
  const { user, logout } = useAuth();
  const { isReady: isAuthReady } = useAuthRequired();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch profile data and pending requests
  const fetchUserData = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const data = await apiFetch("/api/users/me/");
      if (data?.profile_picture) {
        const url = data.profile_picture.startsWith("http")
          ? data.profile_picture
          : `${getBaseUrl()}${data.profile_picture}`;
        setProfilePic(url);
      } else {
        setProfilePic(null);
      }
    } catch (error) {
      setProfilePic(null);
    }
    
    try {
      const data = await apiFetch("/api/users/friend-requests/pending/");
      setPendingRequestsCount(data?.pending_requests?.length || 0);
    } catch (error) {
      setPendingRequestsCount(0);
    }
  };

  // Fetch on mount / user change / auth ready
  useEffect(() => {
    if (isAuthReady) {
      fetchUserData();
    }
  }, [user, isAuthReady]);

  // Initialize theme state from localStorage AND apply to DOM
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme !== "light";
    setIsDarkMode(isDark);
    
    // CRITICAL: Apply the theme to the DOM immediately
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  // Listen for theme changes from Settings or other components and sync
  useEffect(() => {
    const handleThemeChange = (e) => {
      const isDark = e.detail?.isDarkMode ?? (localStorage.getItem("theme") === "dark");
      setIsDarkMode(isDark);
    };

    window.addEventListener("theme-changed", handleThemeChange);
    return () => window.removeEventListener("theme-changed", handleThemeChange);
  }, []);

  // Re-fetch when profile-updated event fires
  useEffect(() => {
    window.addEventListener("profile-updated", fetchUserData);
    return () => window.removeEventListener("profile-updated", fetchUserData);
  }, []);

  // Refresh pending requests every 10 seconds (optimized from 5s)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = getToken();
      if (token) {
        apiFetch("/api/users/friend-requests/pending/")
          .then(data => setPendingRequestsCount(data?.pending_requests?.length || 0))
          .catch(() => setPendingRequestsCount(0));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => logout();
  const initial = user?.first_name?.[0] || user?.username?.[0] || "U";

  // Toggle theme function
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Step 1: Update localStorage
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    
    // Step 2: Apply to DOM immediately (don't wait for re-render)
    document.documentElement.setAttribute("data-theme", newDarkMode ? "dark" : "light");
    
    // Step 3: Dispatch custom event to sync with other components (like Settings)
    window.dispatchEvent(new CustomEvent("theme-changed", { 
      detail: { isDarkMode: newDarkMode } 
    }));
    
    // Step 4: Save to backend if user is authenticated
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";
        fetch(`${API_BASE}/api/users/me/preferences/`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ darkMode: newDarkMode })
        }).catch(() => {
          // Silently fail - theme is already applied locally
        });
      }
    } catch (e) {
      // Silently fail - theme is already applied locally
    }
  };

  // Reusable avatar component with notification badge
  const Avatar = ({ size = "h-9 w-9", textSize = "text-sm", showBadge = false }) => (
    <div className="relative flex-shrink-0">
      <div className={`${size} overflow-hidden rounded-full bg-[#1976D2] flex items-center justify-center ring-2 ring-white/10`}>
        {profilePic
          ? <img src={profilePic} alt="avatar" className="h-full w-full object-cover" onError={() => setProfilePic(null)} />
          : <span className={`${textSize} font-bold text-white`}>{initial.toUpperCase()}</span>
        }
      </div>
      {showBadge && pendingRequestsCount > 0 && (
        <span className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-3 border-[#0a0c16] shadow-lg">
          {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
        </span>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-[9995] font-[Poppins,sans-serif]" style={{
      backgroundColor: 'var(--navbar-bg, rgba(10,12,22,0.85))',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 no-underline">
          <img src={logo} alt="logo" className="h-10" />
        </Link>

        {/* Search Bar */}
        <div className="hidden lg:block flex-1 max-w-sm mx-4">
          <UserSearchBar />
        </div>

        {/* Center Links */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="text-sm text-white/80 no-underline transition hover:text-white">
              {label}
            </Link>
          ))}
          <div className="group relative">
            <button className="text-sm text-white/80 transition hover:text-white">More ▾</button>
            <div className="absolute left-0 top-7 hidden min-w-[140px] rounded-xl bg-[#111] py-1 shadow-lg group-hover:block">
              {MORE_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} className="block px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white no-underline">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right — notifications + theme toggle + avatar + hamburger */}
        <div className="flex items-center gap-3">
          {user && <NotificationBell />}
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition hover:bg-white/10"
            style={{
              color: 'var(--navbar-text-secondary)'
            }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              // Sun icon for light mode
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="transition">
                <circle cx="10" cy="10" r="4" />
                <path d="M10 1v4M10 15v4M1 10h4M15 10h4" />
                <path d="M3.64 3.64l2.83 2.83M13.53 13.53l2.83 2.83M16.36 3.64l-2.83 2.83M6.47 13.53l-2.83 2.83" />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="transition">
                <path d="M18 10.5A8.5 8.5 0 017.5 1c0 6.5-2.5 9-5 11s3.5 4.5 10.5 4.5" />
              </svg>
            )}
          </button>
          
          <div ref={dropdownRef} className="relative">
            <button onClick={() => setDropdownOpen((p) => !p)} className="transition hover:brightness-110">
              <Avatar size="h-9 w-9" textSize="text-sm" showBadge={false} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-52 rounded-xl bg-[#111] p-2 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-white/10 px-2 pb-3 pt-1">
                  <Avatar size="h-9 w-9" textSize="text-sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white text-sm">
                      {user?.first_name || user?.username || "Guest"}
                    </p>
                    <p className="truncate text-xs text-white/50">{user?.email}</p>
                  </div>
                </div>
                <Link to="/profile" onClick={() => setDropdownOpen(false)}
                  className="mt-1 block rounded-lg px-3 py-2 text-sm text-white/80 no-underline hover:bg-white/10 hover:text-white">
                  Profile
                </Link>
                <Link to="/settings" onClick={() => setDropdownOpen(false)}
                  className="mt-0.5 block rounded-lg px-3 py-2 text-sm text-white/80 no-underline hover:bg-white/10 hover:text-white">
                  Settings
                </Link>
                <button onClick={handleLogout}
                  className="mt-0.5 w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 hover:text-red-300">
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen((p) => !p)} className="flex flex-col gap-1 md:hidden">
            <span className={`block h-0.5 w-5 bg-white transition-all ${mobileOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition-all ${mobileOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 px-6 py-4 md:hidden">
          <div className="mb-4">
            <UserSearchBar />
          </div>
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-white/80 no-underline hover:text-white">
              {label}
            </Link>
          ))}
          {MORE_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-white/80 no-underline hover:text-white">
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}