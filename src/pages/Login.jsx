import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ──── CONSTANTS ────
const SLIDESHOW_INTERVAL = 5000;
const SLIDESHOW_DURATION = 1200;

const COLORS = {
  primary: "#f0c27a",
  primaryLight: "#f0c27a",
  primaryDark: "#c9973a",
  darkBg: "#0a0a0a",
  darkBg2: "#0f0e0d",
  lightText: "#f5f0e8",
  textLight: "#f5f0e8",
  textMuted: "#ffffff",
  white: "#ffffff",
  white40: "rgba(255, 255, 255, 0.4)",
  white35: "rgba(255, 255, 255, 0.35)",
  white30: "rgba(255, 255, 255, 0.3)",
  white20: "rgba(255, 255, 255, 0.2)",
  white65: "rgba(255, 255, 255, 0.65)",
  white90: "rgba(255, 255, 255, 0.9)",
  red300: "#fca5a5",
  red500_10: "rgba(239, 68, 68, 0.1)",
  red500_25: "rgba(239, 68, 68, 0.25)",
  red500_70: "rgba(239, 68, 68, 0.7)",
  red400_85: "rgba(248, 113, 113, 0.85)",
};

const TEXTS = {
  welcome: "Welcome back",
  mainHeading: "Your next",
  mainHeadingEmphasis: "adventure",
  subheading: "Sign in to continue exploring the world's most beautiful destinations.",
  usernameLabel: "GMail",
  usernamePlaceholder: "your_username",
  passwordLabel: "Password",
  passwordPlaceholder: "Enter your password",
  rememberMe: "Remember me",
  forgotPassword: "Forgot password?",
  newUserText: "New here?",
  createAccount: "Create an account",
  signingIn: "Signing in...",
  signIn: "Sign In",
  usernameRequired: "Username is required",
  usernameMinLength: "Username must be at least 3 characters",
  passwordRequired: "Password is required",
  passwordMinLength: "Password must be at least 6 characters",
};

const DESTINATIONS = [
  { image: "/mountain.png", city: "Mustang", country: "Nepal", tagline: "Where the sky meets the peaks" },
  { image: "pokhara.png", city: "Pokhara", country: "Nepal", tagline: "A Place untouched by time" },
  { image: "Taplejung.png", city: "Taplejung", country: "Nepal", tagline: "Where the Beauty falls from the sky" },
  { image: "walkingman.png", city: "Kathmandu", country: "Nepal", tagline: "Life is beautiful here" },
];

export default function Login() {
  const [current, setCurrent] = useState(0);
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [focused, setFocused] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeout(() => setCurrent((prev) => (prev + 1) % DESTINATIONS.length), SLIDESHOW_DURATION);
    }, SLIDESHOW_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const validate = () => {
    const errs = { username: "", password: "" };
    if (!form.username.trim()) errs.username = TEXTS.usernameRequired;
    else if (form.username.trim().length < 3) errs.username = TEXTS.usernameMinLength;
    if (!form.password) errs.password = TEXTS.passwordRequired;
    else if (form.password.length < 6) errs.password = TEXTS.passwordMinLength;
    setErrors(errs);
    return !errs.username && !errs.password;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const res = await axios.post(`${backendUrl}/api/users/login/`, form);
      if (res.data.success) {
        login(res.data.user, res.data.access);
        navigate("/home");
      } else {
        setMessage(res.data.message || "Login failed");
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Server error. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const d = DESTINATIONS[current];

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0a0a0a] font-sans">

      {/* Left — Slideshow */}
      <div className="relative flex-[1.2] overflow-hidden max-md:h-[42vh] max-md:flex-none">
        {DESTINATIONS.map((dest, i) => (
          <div
            key={i}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ${
              i === current ? "opacity-100 animate-[kenBurns_8s_ease_forwards]" : "opacity-0"
            }`}
            style={{ backgroundImage: `url('${dest.image}')` }}
          />
        ))}

        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/15 via-black/35 to-black/70" />

        <div className="absolute inset-0 z-20 flex flex-col justify-between p-11">
          <span className="font-['Montserrat'] text-[22px] font-light tracking-[5px] uppercase text-white/90">
            Travel<span className="italic font-normal text-[#f0c27a]">·</span>Companion
          </span>

          <div key={current} className="animate-[fadeUpIn_1.2s_ease]">
            <p className="mb-3 text-sm font-light tracking-[2px] uppercase text-white/65 italic">{d.tagline}</p>
            <h1 className="font-['Montserrat'] text-[clamp(56px,7vw,86px)] font-light leading-[0.9] text-white tracking-tight">
              {d.city}
              <span className="mt-2.5 block text-[clamp(20px,2.5vw,28px)] font-normal italic text-[#f0c27a] tracking-[4px] uppercase">
                {d.country}
              </span>
            </h1>

            <div className="mt-8 flex gap-2">
              {DESTINATIONS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-0.5 rounded-sm transition-all duration-400 ${
                    i === current ? "w-12 bg-[#f0c27a]" : "w-7 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="relative flex w-[460px] flex-shrink-0 flex-col justify-center overflow-hidden bg-[#0f0e0d] px-12 py-16 max-md:w-full max-md:px-7 max-md:py-9">
        <div className="pointer-events-none absolute -top-28 -right-28 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(240,194,122,0.07)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(240,194,122,0.05)_0%,transparent_70%)]" />

        <p className="mb-4 text-[11px] font-medium tracking-[4px] uppercase text-[#f0c27a]">{TEXTS.welcome}</p>
        <h2 className="mb-2 font-['Montserrat'] text-5xl font-light leading-[1.05] text-[#f5f0e8] max-md:text-4xl">
          {TEXTS.mainHeading}<br /><em className="italic text-[#f0c27a]">{TEXTS.mainHeadingEmphasis}</em><br />
          awaits.
        </h2>
        <p className="mb-9 text-[13px] font-light leading-relaxed text-white/40">
          {TEXTS.subheading}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {message && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-3 animate-[shakeIn_0.35s_ease]">
              <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-red-500/70 text-[11px] font-bold text-white">!</div>
              <p className="text-[12.5px] leading-snug text-red-300/90">{message}</p>
            </div>
          )}

          <div className="mb-1.5">
            <label className={`mb-2 block text-[11px] font-medium tracking-[2px] uppercase transition-colors ${focused === "username" ? "text-[#f0c27a]" : "text-white/35"}`}>
              {TEXTS.usernameLabel}
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              onFocus={() => setFocused("username")}
              onBlur={() => setFocused(null)}
              placeholder={TEXTS.usernamePlaceholder}
              autoComplete="username"
              className={`w-full rounded-[10px] border bg-white/[0.04] px-4 py-3 text-sm text-[#f5f0e8] placeholder-white/20 outline-none transition focus:bg-white/[0.07] focus:border-[#f0c27a]/50 ${errors.username ? "border-red-500/50" : "border-white/10"}`}
            />
            {errors.username && <span className="mt-1.5 block pl-1 text-[11.5px] text-red-400/85">{errors.username}</span>}
          </div>

          <div className="mb-1.5">
            <label className={`mb-2 block text-[11px] font-medium tracking-[2px] uppercase transition-colors ${focused === "password" ? "text-[#f0c27a]" : "text-white/35"}`}>
              {TEXTS.passwordLabel}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              placeholder={TEXTS.passwordPlaceholder}
              autoComplete="current-password"
              className={`w-full rounded-[10px] border bg-white/[0.04] px-4 py-3 text-sm text-[#f5f0e8] placeholder-white/20 outline-none transition focus:bg-white/[0.07] focus:border-[#f0c27a]/50 ${errors.password ? "border-red-500/50" : "border-white/10"}`}
            />
            {errors.password && <span className="mt-1.5 block pl-1 text-[11.5px] text-red-400/85">{errors.password}</span>}
          </div>

          <div className="mb-7 mt-3 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/35">
              <input type="checkbox" className="h-3.5 w-3.5 accent-[#f0c27a]" />
              {TEXTS.rememberMe}
            </label>
            <a href="/forgot-password" className="text-xs text-[#f0c27a]/70 transition hover:text-[#f0c27a]">{TEXTS.forgotPassword}</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#c9973a] via-[#f0c27a] to-[#c9973a] py-3.5 text-[13px] font-semibold tracking-[3px] uppercase text-[#0f0e0d] transition-all hover:-translate-y-px hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0f0e0d]/30 border-t-[#0f0e0d]" />}
            {loading ? TEXTS.signingIn : TEXTS.signIn}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-white/30">
          {TEXTS.newUserText}
          <a href="/register" className="ml-1 font-medium text-[#f0c27a] hover:underline">{TEXTS.createAccount}</a>
        </p>
      </div>

      <style>{`
        @keyframes kenBurns { from { transform: scale(1.06); } to { transform: scale(1); } }
        @keyframes fadeUpIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shakeIn { 0% { transform: translateX(-6px); opacity: 0; } 40% { transform: translateX(4px); } 70% { transform: translateX(-2px); } 100% { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}