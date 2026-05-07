import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useScrollbarExpand from "../hooks/useScrollbarExpand";
import api from "../API/api";
import KYCBanner from "../components/KYCBanner";
import { DashboardLoadingSkeleton } from "../components/SkeletonLoaders";
import {
  useUserProfile,
  useAllTrips,
  useRecommendedTrips,
  useTripHistory,
  useInvitations,
  useCities,
  useDestinationRecommendations,
} from "../hooks/useTripsData";
import {
  PlusCircle,
  Compass,
  List,
  MapPin,
  Users,
  Calendar,
  Globe,
  Lock,
  ChevronRight,
  AlertCircle,
  Loader2,
  LogIn,
  Clock,
  Image,
  Check,
  Mail,
} from "lucide-react";

// ──── CONSTANTS ────
const TEXTS = {
  greeting: "Welcome back",
  subtext: "Manage your trips and find your next travel companion",
  tripsCreated: "Trips Created",
  groupsJoined: "Groups Joined",
  totalTrips: "Total Trips",
  myTrips: "My Trips",
  allAvailable: "All Available",
  create: "Create",
  search: "Search trips by name, description, or destination...",
  loadingTrips: "Loading your trips...",
  signedOut: "You have been signed out",
  loginMessage: "Please log in again to continue",
  welcome: "Welcome to Travel Sathi",
};

const TRIP_TAGS_CATEGORIES = {
  "Trip Type": ["Adventure", "Relaxation", "Cultural", "Nature", "Road Trip", "Backpacking", "Trekking / Hiking", "Camping", "City Tour", "Beach Trip", "Wildlife / Safari"],
  "Budget Level": ["Budget", "Mid-range", "Luxury"],
  "Activity Level": ["High Activity", "Moderate Activity", "Chill / Low Activity"],
  "Trip Style": ["Solo Friendly", "Group Trip", "Family Friendly", "Friends Trip", "Guided Tour", "DIY / Self-planned"],
  "Environment": ["Mountain", "Hills", "Forest", "Lake / Riverside", "Desert", "Urban", "Rural / Village"],
  "Duration": ["Weekend Trip", "Short Trip (2–3 days)", "Long Trip (4+ days)"],
  "Transport": ["Road Trip", "Flight Travel", "Mixed Transport"],
  "Purpose": ["Photography", "Food Exploration", "Sightseeing", "Spiritual / Religious", "Party / Nightlife", "Wellness / Retreat", "Festival Trip"],
  "Stay Type": ["Hotel Stay", "Homestay", "Camping Stay", "Resort Stay"]
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Poppins:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root {
    min-height: 100vh;
    background: #080c14;
    color: #fff;
    font-family: 'Poppins', sans-serif;
    padding: 2.5rem 1.5rem 4rem;
  }

  .db-inner { max-width: 1100px; margin: 0 auto; }

  /* Header */
  .db-header { margin-bottom: 2.5rem; }
  .db-greeting {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 0.4rem;
  }
  .db-greeting span { color: #ffd580; }
  .db-subtext { color: rgba(255,255,255,0.4); font-size: 0.9rem; font-weight: 300; }

  /* Stats */
  .db-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
  .db-stat {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 1.4rem 1.6rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: border-color 0.25s;
  }
  .db-stat:hover { border-color: rgba(255,213,128,0.25); }
  .db-stat-icon {
    width: 42px; height: 42px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .db-stat-val {
    font-family: 'Montserrat', sans-serif;
    font-size: 1.7rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    color: #ffd580;
  }
  .db-stat-label {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2px;
  }

  /* Error */
  .db-error {
    display: flex; align-items: center; gap: 10px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 12px;
    padding: 12px 16px;
    color: #fca5a5;
    font-size: 0.88rem;
    margin-bottom: 1.5rem;
  }

  /* Tabs */
  .db-tabs {
    display: flex; gap: 4px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 5px;
    margin-bottom: 2rem;
  }
  .db-tab {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 16px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition: background 0.2s, color 0.2s;
    background: transparent;
    color: rgba(255,255,255,0.4);
  }
  .db-tab.active {
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: #fff;
    box-shadow: 0 4px 20px rgba(249,115,22,0.3);
  }
  .db-tab:not(.active):hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); }

  /* Loading */
  .db-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 5rem 0; gap: 1rem;
    color: rgba(255,255,255,0.35);
  }
  .db-spinner { animation: spin 1s linear infinite; color: #ffd580; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Trip grid */
  .db-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.2rem; }

  /* Trip card */
  .trip-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 1.6rem;
    transition: transform 0.25s, border-color 0.25s, box-shadow 0.3s, background-color 0.3s;
    cursor: default;
    position: relative;
    overflow: hidden;
  }
  .trip-card:hover {
    transform: translateY(-4px);
  }

  /* ──── MATCH SCORE COLOR SYSTEM ──── */
  
  /* High Match (> 70%) - Green Glow */
  .trip-card.match-high {
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(34, 197, 94, 0.08) 100%);
    border: 1px solid rgba(34, 197, 94, 0.25);
    box-shadow: 
      0 0 30px rgba(34, 197, 94, 0.15),
      0 0 60px rgba(34, 197, 94, 0.08),
      0 16px 40px rgba(0, 0, 0, 0.4);
  }
  .trip-card.match-high:hover {
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 
      0 0 40px rgba(34, 197, 94, 0.25),
      0 0 80px rgba(34, 197, 94, 0.12),
      0 20px 50px rgba(0, 0, 0, 0.5);
  }

  /* Medium Match (50-70%) - Yellow-Green Glow */
  .trip-card.match-medium {
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(234, 179, 8, 0.06) 100%);
    border: 1px solid rgba(234, 179, 8, 0.2);
    box-shadow: 
      0 0 25px rgba(234, 179, 8, 0.12),
      0 0 50px rgba(234, 179, 8, 0.06),
      0 16px 40px rgba(0, 0, 0, 0.4);
  }
  .trip-card.match-medium:hover {
    border-color: rgba(234, 179, 8, 0.3);
    box-shadow: 
      0 0 35px rgba(234, 179, 8, 0.18),
      0 0 70px rgba(234, 179, 8, 0.09),
      0 20px 50px rgba(0, 0, 0, 0.5);
  }

  /* Low Match (30-50%) - Orange Glow */
  .trip-card.match-low {
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(249, 115, 22, 0.07) 100%);
    border: 1px solid rgba(249, 115, 22, 0.22);
    box-shadow: 
      0 0 25px rgba(249, 115, 22, 0.13),
      0 0 50px rgba(249, 115, 22, 0.07),
      0 16px 40px rgba(0, 0, 0, 0.4);
  }
  .trip-card.match-low:hover {
    border-color: rgba(249, 115, 22, 0.32);
    box-shadow: 
      0 0 35px rgba(249, 115, 22, 0.19),
      0 0 70px rgba(249, 115, 22, 0.1),
      0 20px 50px rgba(0, 0, 0, 0.5);
  }

  /* Poor Match (< 30%) - Red Glow */
  .trip-card.match-poor {
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(239, 68, 68, 0.05) 100%);
    border: 1px solid rgba(239, 68, 68, 0.2);
    box-shadow: 
      0 0 20px rgba(239, 68, 68, 0.1),
      0 0 40px rgba(239, 68, 68, 0.05),
      0 16px 40px rgba(0, 0, 0, 0.4);
  }
  .trip-card.match-poor:hover {
    border-color: rgba(239, 68, 68, 0.3);
    box-shadow: 
      0 0 30px rgba(239, 68, 68, 0.15),
      0 0 60px rgba(239, 68, 68, 0.07),
      0 20px 50px rgba(0, 0, 0, 0.5);
  }

  /* No match score - keep default hover */
  .trip-card:not(.match-high):not(.match-medium):not(.match-low):not(.match-poor):hover {
    border-color: rgba(255,213,128,0.2);
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  }
  .trip-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.8rem; }
  .trip-title {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
    color: #fff;
    margin-bottom: 0.25rem;
  }
  .trip-dest {
    display: flex; align-items: center; gap: 5px;
    font-size: 0.78rem; color: rgba(255,255,255,0.4);
  }
  .trip-badge {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 100px;
    flex-shrink: 0;
  }
  .badge-creator { background: rgba(255,213,128,0.15); color: #ffd580; border: 1px solid rgba(255,213,128,0.3); }
  .badge-public  { background: rgba(134,239,172,0.1);  color: #86efac; border: 1px solid rgba(134,239,172,0.25); }

  .trip-desc {
    font-size: 0.82rem;
    color: rgba(255,255,255,0.35);
    line-height: 1.6;
    margin-bottom: 1.2rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .trip-meta { display: flex; gap: 0.8rem; margin-bottom: 1.2rem; }
  .trip-meta-item {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
    padding: 0.65rem 0.8rem;
    display: flex; align-items: center; gap: 6px;
  }
  .trip-meta-label { font-size: 0.7rem; color: rgba(255,255,255,0.3); display: block; }
  .trip-meta-val { font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.75); }

  .trip-by {
    font-size: 0.73rem; color: rgba(255,255,255,0.3);
    margin-bottom: 1rem;
    display: flex; align-items: center; gap: 5px;
  }

  .trip-actions { display: flex; gap: 8px; }
  .btn {
    flex: 1; padding: 9px 14px; border-radius: 10px; border: none;
    font-family: 'Poppins', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; transition: opacity 0.2s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }
  .btn-primary { background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; }
  .btn-outline { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.1); }
  .btn-gold { background: rgba(255,213,128,0.1); color: #ffd580; border: 1px solid rgba(255,213,128,0.2); }
  .btn-dim { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.3); cursor: default; }
  .btn-dim:hover { opacity: 1; transform: none; }

  /* Empty state */
  .empty-state {
    text-align: center; padding: 5rem 2rem;
    background: rgba(255,255,255,0.02);
    border: 1px dashed rgba(255,255,255,0.08);
    border-radius: 20px;
  }
  .empty-icon {
    width: 64px; height: 64px;
    background: rgba(255,213,128,0.08);
    border: 1px solid rgba(255,213,128,0.15);
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.5rem;
    color: #ffd580;
  }
  .empty-title {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700; font-size: 1.3rem;
    margin-bottom: 0.5rem; color: #fff;
  }
  .empty-sub { color: rgba(255,255,255,0.35); font-size: 0.88rem; margin-bottom: 1.8rem; }

  /* Discover tip */
  .discover-tip {
    font-size: 0.78rem; color: rgba(255,255,255,0.3);
    margin-bottom: 1.2rem;
    display: flex; align-items: center; gap: 6px;
  }

  /* Create form */
  .create-wrap {
    max-width: 680px; margin: 0 auto;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    padding: 2.5rem;
  }
  .create-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 1.5rem; font-weight: 800;
    letter-spacing: -0.02em; margin-bottom: 2rem;
  }
  .form-group { margin-bottom: 1.4rem; }
  .form-label {
    display: block;
    font-size: 0.75rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.5); margin-bottom: 0.55rem;
  }
  .form-input, .form-textarea, .form-select {
    width: 100%; padding: 12px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: #fff; font-family: 'Poppins', sans-serif; font-size: 0.88rem;
    outline: none; transition: border-color 0.2s;
  }
  .form-input::placeholder, .form-textarea::placeholder { color: rgba(255,255,255,0.2); }
  .form-input:focus, .form-textarea:focus, .form-select:focus { border-color: rgba(255,213,128,0.4); }
  .form-textarea { resize: none; }
  .form-select option { background: #1a1f2e; color: #fff; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

  .toggle-row {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 1rem 1.2rem;
  }
  .toggle-row input[type="checkbox"] {
    width: 18px; height: 18px; accent-color: #f97316; cursor: pointer;
  }
  .toggle-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); cursor: pointer; }
  .toggle-label strong { color: #fff; display: block; margin-bottom: 2px; font-weight: 600; }
  .toggle-hint { font-size: 0.72rem; color: rgba(255,255,255,0.3); margin-top: 3px; }

  .form-actions { display: flex; gap: 10px; margin-top: 2rem; }
  .form-submit {
    flex: 1; padding: 13px;
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: #fff; border: none; border-radius: 12px;
    font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 700;
    cursor: pointer; transition: opacity 0.2s, box-shadow 0.2s;
    box-shadow: 0 6px 20px rgba(249,115,22,0.3);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .form-submit:hover { opacity: 0.9; box-shadow: 0 8px 28px rgba(249,115,22,0.45); }
  .form-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .form-cancel {
    padding: 13px 22px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: rgba(255,255,255,0.5);
    font-family: 'Poppins', sans-serif; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: background 0.2s;
  }
  .form-cancel:hover { background: rgba(255,255,255,0.08); }

  /* ──── LIGHT MODE THEME ──── */
  [data-theme="light"] .db-root {
    background: #f5f3f0;
    color: #0d0d0d;
  }

  [data-theme="light"] .db-greeting span,
  [data-theme="light"] .db-stat-val { color: #d97706; }

  [data-theme="light"] .db-subtext,
  [data-theme="light"] .trip-dest,
  [data-theme="light"] .db-stat-label,
  [data-theme="light"] .trip-meta-label { color: #333333; }

  [data-theme="light"] .db-tab {
    color: #333333 !important;
  }
  [data-theme="light"] .db-tab:not(.active):hover {
    background: rgba(0, 0, 0, 0.08);
    color: #1a1a2e !important;
  }
  [data-theme="light"] .db-tab.active {
    color: #fff !important;
  }

  [data-theme="light"] .db-stat {
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.12);
  }
  [data-theme="light"] .db-stat:hover { border-color: rgba(217, 119, 6, 0.25); }

  [data-theme="light"] .db-error {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #dc2626;
  }

  [data-theme="light"] .db-tabs {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.12);
  }

  [data-theme="light"] .trip-card {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  [data-theme="light"] .trip-card:hover {
    border-color: rgba(217, 119, 6, 0.2);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
  }

  /* Light mode - Match score colors */
  [data-theme="light"] .trip-card.match-high {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(34, 197, 94, 0.08) 100%);
    border: 1px solid rgba(34, 197, 94, 0.28);
    box-shadow: 0 0 25px rgba(34, 197, 94, 0.12), 0 16px 40px rgba(0, 0, 0, 0.08);
  }
  [data-theme="light"] .trip-card.match-high:hover {
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 0 35px rgba(34, 197, 94, 0.18), 0 20px 50px rgba(0, 0, 0, 0.12);
  }

  [data-theme="light"] .trip-card.match-medium {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(234, 179, 8, 0.06) 100%);
    border: 1px solid rgba(234, 179, 8, 0.24);
    box-shadow: 0 0 20px rgba(234, 179, 8, 0.11), 0 16px 40px rgba(0, 0, 0, 0.08);
  }
  [data-theme="light"] .trip-card.match-medium:hover {
    border-color: rgba(234, 179, 8, 0.32);
    box-shadow: 0 0 30px rgba(234, 179, 8, 0.16), 0 20px 50px rgba(0, 0, 0, 0.12);
  }

  [data-theme="light"] .trip-card.match-low {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(249, 115, 22, 0.07) 100%);
    border: 1px solid rgba(249, 115, 22, 0.26);
    box-shadow: 0 0 20px rgba(249, 115, 22, 0.12), 0 16px 40px rgba(0, 0, 0, 0.08);
  }
  [data-theme="light"] .trip-card.match-low:hover {
    border-color: rgba(249, 115, 22, 0.35);
    box-shadow: 0 0 30px rgba(249, 115, 22, 0.17), 0 20px 50px rgba(0, 0, 0, 0.12);
  }

  [data-theme="light"] .trip-card.match-poor {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(239, 68, 68, 0.05) 100%);
    border: 1px solid rgba(239, 68, 68, 0.24);
    box-shadow: 0 0 18px rgba(239, 68, 68, 0.1), 0 16px 40px rgba(0, 0, 0, 0.08);
  }
  [data-theme="light"] .trip-card.match-poor:hover {
    border-color: rgba(239, 68, 68, 0.32);
    box-shadow: 0 0 28px rgba(239, 68, 68, 0.15), 0 20px 50px rgba(0, 0, 0, 0.12);
  }

  [data-theme="light"] .trip-title { color: #0d0d0d; }
  [data-theme="light"] .trip-desc { color: #333333; }
  [data-theme="light"] .trip-by { color: #444444; }

  [data-theme="light"] .trip-meta-item {
    background: rgba(0, 0, 0, 0.04);
  }
  [data-theme="light"] .trip-meta-val { color: #1a1a2e; }

  [data-theme="light"] .badge-creator {
    background: rgba(217, 119, 6, 0.1);
    color: #8b4513;
    border: 1px solid rgba(217, 119, 6, 0.25);
  }
  [data-theme="light"] .badge-public {
    background: rgba(34, 197, 94, 0.08);
    color: #15803d;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  [data-theme="light"] .empty-state {
    background: rgba(0, 0, 0, 0.03);
    border: 1px dashed rgba(0, 0, 0, 0.15);
  }
  [data-theme="light"] .empty-icon {
    background: rgba(217, 119, 6, 0.08);
    border: 1px solid rgba(217, 119, 6, 0.2);
    color: #d97706;
  }
  [data-theme="light"] .empty-title { color: #0d0d0d; }
  [data-theme="light"] .empty-sub { color: #333333; }

  [data-theme="light"] .discover-tip { color: #444444; }

  /* Trip tags styling in light mode */
  [data-theme="light"] div > span[style*="rgba(240, 194, 122"] {
    color: #8b4513 !important;
    background: rgba(217, 119, 6, 0.12) !important;
    border-color: rgba(217, 119, 6, 0.3) !important;
  }

  /* Constraint tags styling in light mode */
  [data-theme="light"] div > span[style*="rgba(25, 118, 210"] {
    color: #1e40af !important;
    background: rgba(59, 130, 246, 0.12) !important;
    border-color: rgba(59, 130, 246, 0.3) !important;
  }

  /* Form styling in light mode */
  [data-theme="light"] .form-label {
    color: #1a1a2e !important;
  }

  [data-theme="light"] .form-input,
  [data-theme="light"] .form-textarea,
  [data-theme="light"] .form-select {
    background: rgba(0, 0, 0, 0.04) !important;
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
    color: #0d0d0d !important;
  }

  [data-theme="light"] .form-input::placeholder,
  [data-theme="light"] .form-textarea::placeholder {
    color: #888888 !important;
  }

  [data-theme="light"] .form-input:focus,
  [data-theme="light"] .form-textarea:focus,
  [data-theme="light"] .form-select:focus {
    border-color: rgba(217, 119, 6, 0.5) !important;
  }

  [data-theme="light"] .form-cancel {
    background: rgba(0, 0, 0, 0.06) !important;
    border: 1px solid rgba(0, 0, 0, 0.15) !important;
    color: #1a1a2e !important;
  }

  [data-theme="light"] .form-cancel:hover {
    background: rgba(0, 0, 0, 0.1) !important;
  }

  [data-theme="light"] .toggle-row {
    background: rgba(0, 0, 0, 0.04) !important;
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
  }

  [data-theme="light"] .toggle-label {
    color: #333333 !important;
  }

  [data-theme="light"] .toggle-label strong {
    color: #0d0d0d !important;
  }

  [data-theme="light"] .toggle-hint {
    color: #666666 !important;
  }

  [data-theme="light"] .btn-outline {
    background: rgba(0, 0, 0, 0.06) !important;
    color: #1a1a2e !important;
    border: 1px solid rgba(0, 0, 0, 0.15) !important;
  }

  /* Filter by Requirements button light mode */
  [data-theme="light"] button[style*="rgba(201,168,76"] {
    color: #000000 !important;
    background: rgba(217, 119, 6, 0.15) !important;
    border: 1px solid rgba(217, 119, 6, 0.3) !important;
  }

  [data-theme="light"] button[style*="rgba(201,168,76"]:hover {
    background: rgba(217, 119, 6, 0.25) !important;
  }

  [data-theme="light"] .btn-gold {
    background: rgba(217, 119, 6, 0.12) !important;
    color: #b45309 !important;
    border: 1px solid rgba(217, 119, 6, 0.3) !important;
  }

  [data-theme="light"] .btn-dim {
    background: rgba(0, 0, 0, 0.06) !important;
    color: #666666 !important;
  }

  [data-theme="light"] .create-wrap {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  [data-theme="light"] .create-title { color: #0d0d0d; }

  [data-theme="light"] .db-loading {
    color: #333333;
  }
  [data-theme="light"] .db-spinner {
    color: #d97706;
  }

  /* Filter button styling in light mode */
  [data-theme="light"] button[style*="rgba(201,168,76,0.3)"] {
    border-color: rgba(217, 119, 6, 0.25) !important;
    background: rgba(217, 119, 6, 0.08) !important;
    color: #1a1a2e !important;
  }

  [data-theme="light"] button[style*="rgba(201,168,76,0.3)"]:hover {
    color: #0d0d0d !important;
  }

  /* Filter dropdown panel styling in light mode */
  [data-theme="light"] div[style*="minWidth: 400px"] {
    background: #e8e8e8 !important;
    border: 1px solid rgba(0, 0, 0, 0.15) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
  }

  /* Filter category labels in light mode */
  [data-theme="light"] div[style*="minWidth: 400px"] p {
    color: #d97706 !important;
  }

  /* Filter tags in light mode */
  [data-theme="light"] div[style*="minWidth: 400px"] button {
    border-color: rgba(217, 119, 6, 0.2) !important;
    background: rgba(217, 119, 6, 0.06) !important;
    color: #1a1a2e !important;
  }

  [data-theme="light"] div[style*="minWidth: 400px"] button[style*="rgba(201,168,76,0.6)"] {
    border-color: rgba(217, 119, 6, 0.4) !important;
    background: rgba(217, 119, 6, 0.15) !important;
    color: #b45309 !important;
  }

  @media (max-width: 600px) {
    .form-grid { grid-template-columns: 1fr; }
    .db-tabs { flex-direction: column; }
    .form-actions { flex-direction: column; }
  }

  /* ──── FINAL LIGHT MODE UI FIX: dark mode unchanged ──── */
  :root[data-theme="light"] .db-root,
  html[data-theme="light"] .db-root,
  body[data-theme="light"] .db-root,
  [data-theme="light"] .db-root,
  .db-root[data-theme="light"] {
    background:
      radial-gradient(circle at top left, rgba(249, 115, 22, 0.08), transparent 28rem),
      linear-gradient(180deg, #fffaf3 0%, #f8fafc 45%, #f1f5f9 100%) !important;
    color: #0f172a !important;
  }

  [data-theme="light"] .db-root,
  .db-root[data-theme="light"] {
    --lm-text: #0f172a;
    --lm-muted: #64748b;
    --lm-soft: #94a3b8;
    --lm-border: #e2e8f0;
    --lm-panel: rgba(255, 255, 255, 0.92);
    --lm-panel-solid: #ffffff;
    --lm-orange: #ea580c;
    --lm-orange-soft: #fff7ed;
  }

  [data-theme="light"] .db-inner,
  .db-root[data-theme="light"] .db-inner { max-width: 1120px; }

  [data-theme="light"] .db-greeting,
  [data-theme="light"] .trip-title,
  [data-theme="light"] .empty-title,
  [data-theme="light"] .create-title,
  .db-root[data-theme="light"] .db-greeting,
  .db-root[data-theme="light"] .trip-title,
  .db-root[data-theme="light"] .empty-title,
  .db-root[data-theme="light"] .create-title {
    color: var(--lm-text) !important;
  }

  [data-theme="light"] .db-greeting span,
  [data-theme="light"] .db-stat-val,
  .db-root[data-theme="light"] .db-greeting span,
  .db-root[data-theme="light"] .db-stat-val {
    color: var(--lm-orange) !important;
  }

  [data-theme="light"] .db-subtext,
  [data-theme="light"] .trip-dest,
  [data-theme="light"] .trip-desc,
  [data-theme="light"] .trip-by,
  [data-theme="light"] .discover-tip,
  [data-theme="light"] .empty-sub,
  [data-theme="light"] .db-stat-label,
  [data-theme="light"] .trip-meta-label,
  .db-root[data-theme="light"] .db-subtext,
  .db-root[data-theme="light"] .trip-dest,
  .db-root[data-theme="light"] .trip-desc,
  .db-root[data-theme="light"] .trip-by,
  .db-root[data-theme="light"] .discover-tip,
  .db-root[data-theme="light"] .empty-sub,
  .db-root[data-theme="light"] .db-stat-label,
  .db-root[data-theme="light"] .trip-meta-label {
    color: var(--lm-muted) !important;
  }

  [data-theme="light"] .db-stat,
  [data-theme="light"] .trip-card:not(.match-high):not(.match-medium):not(.match-low):not(.match-poor),
  [data-theme="light"] .create-wrap,
  .db-root[data-theme="light"] .db-stat,
  .db-root[data-theme="light"] .trip-card:not(.match-high):not(.match-medium):not(.match-low):not(.match-poor),
  .db-root[data-theme="light"] .create-wrap {
    background: var(--lm-panel) !important;
    border: 1px solid var(--lm-border) !important;
    box-shadow: 0 16px 45px rgba(15, 23, 42, 0.06) !important;
  }

  [data-theme="light"] .trip-card:hover,
  [data-theme="light"] .db-stat:hover,
  .db-root[data-theme="light"] .trip-card:hover,
  .db-root[data-theme="light"] .db-stat:hover {
    border-color: rgba(249, 115, 22, 0.32) !important;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10) !important;
  }

  [data-theme="light"] .db-tabs,
  .db-root[data-theme="light"] .db-tabs {
    background: rgba(255, 255, 255, 0.9) !important;
    border: 1px solid var(--lm-border) !important;
    box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06) !important;
  }

  [data-theme="light"] .db-tab,
  .db-root[data-theme="light"] .db-tab {
    color: #475569 !important;
  }

  [data-theme="light"] .db-tab svg,
  .db-root[data-theme="light"] .db-tab svg {
    color: var(--lm-muted) !important;
    stroke: var(--lm-muted) !important;
  }

  [data-theme="light"] .db-tab:not(.active):hover,
  .db-root[data-theme="light"] .db-tab:not(.active):hover {
    background: #f1f5f9 !important;
    color: var(--lm-text) !important;
  }

  [data-theme="light"] .db-tab.active,
  [data-theme="light"] .db-tab.active *,
  .db-root[data-theme="light"] .db-tab.active,
  .db-root[data-theme="light"] .db-tab.active * {
    color: #ffffff !important;
    stroke: #ffffff !important;
  }

  [data-theme="light"] .db-tab.active,
  .db-root[data-theme="light"] .db-tab.active {
    background: linear-gradient(135deg, #fb923c, #ea580c) !important;
    box-shadow: 0 10px 28px rgba(234, 88, 12, 0.28) !important;
  }

  [data-theme="light"] .trip-meta-item,
  .db-root[data-theme="light"] .trip-meta-item {
    background: #f8fafc !important;
    border: 1px solid var(--lm-border) !important;
  }

  [data-theme="light"] .trip-meta-val,
  .db-root[data-theme="light"] .trip-meta-val {
    color: var(--lm-text) !important;
  }

  [data-theme="light"] .badge-creator,
  .db-root[data-theme="light"] .badge-creator {
    background: var(--lm-orange-soft) !important;
    color: #c2410c !important;
    border-color: #fed7aa !important;
  }

  [data-theme="light"] .badge-public,
  .db-root[data-theme="light"] .badge-public {
    background: #ecfdf5 !important;
    color: #047857 !important;
    border-color: #bbf7d0 !important;
  }

  [data-theme="light"] .empty-state,
  .db-root[data-theme="light"] .empty-state {
    background: var(--lm-panel) !important;
    border: 1px dashed #cbd5e1 !important;
    box-shadow: 0 16px 45px rgba(15, 23, 42, 0.05) !important;
  }

  [data-theme="light"] .empty-icon,
  .db-root[data-theme="light"] .empty-icon {
    background: var(--lm-orange-soft) !important;
    border-color: #fed7aa !important;
    color: var(--lm-orange) !important;
  }

  [data-theme="light"] .empty-icon svg,
  .db-root[data-theme="light"] .empty-icon svg {
    color: var(--lm-orange) !important;
    stroke: var(--lm-orange) !important;
  }

  /* Fix all inline dark-mode text/background styles inside this dashboard */
  [data-theme="light"] .db-root input,
  [data-theme="light"] .db-root textarea,
  [data-theme="light"] .db-root select,
  .db-root[data-theme="light"] input,
  .db-root[data-theme="light"] textarea,
  .db-root[data-theme="light"] select {
    color: var(--lm-text) !important;
    caret-color: var(--lm-orange) !important;
  }

  [data-theme="light"] .db-root input::placeholder,
  [data-theme="light"] .db-root textarea::placeholder,
  .db-root[data-theme="light"] input::placeholder,
  .db-root[data-theme="light"] textarea::placeholder {
    color: var(--lm-soft) !important;
    opacity: 1 !important;
  }

  [data-theme="light"] .db-root [style*="background: rgba(255"],
  .db-root[data-theme="light"] [style*="background: rgba(255"] {
    background: var(--lm-panel-solid) !important;
  }

  [data-theme="light"] .db-root [style*="border: 1px solid rgba(255"],
  .db-root[data-theme="light"] [style*="border: 1px solid rgba(255"] {
    border-color: var(--lm-border) !important;
  }

  [data-theme="light"] .db-root [style*="color: rgba(255"],
  .db-root[data-theme="light"] [style*="color: rgba(255"] {
    color: var(--lm-muted) !important;
  }

  [data-theme="light"] .db-root [style*="stroke: rgba(255"],
  .db-root[data-theme="light"] [style*="stroke: rgba(255"] {
    stroke: var(--lm-soft) !important;
  }

  /* Search bar wrapper */
  [data-theme="light"] .db-root div[style*="padding: 10px 14px"],
  .db-root[data-theme="light"] div[style*="padding: 10px 14px"] {
    background: rgba(255, 255, 255, 0.96) !important;
    border: 1px solid var(--lm-border) !important;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05) !important;
  }

  [data-theme="light"] .db-root div[style*="padding: 10px 14px"]:focus-within,
  .db-root[data-theme="light"] div[style*="padding: 10px 14px"]:focus-within {
    border-color: #fb923c !important;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12) !important;
  }

  [data-theme="light"] .db-root div[style*="padding: 10px 14px"] svg,
  .db-root[data-theme="light"] div[style*="padding: 10px 14px"] svg {
    stroke: var(--lm-soft) !important;
  }

  /* Filter button and dropdown */
  [data-theme="light"] .db-root button[style*="rgba(201,168,76"],
  .db-root[data-theme="light"] button[style*="rgba(201,168,76"] {
    background: #ffffff !important;
    border: 1px solid #fed7aa !important;
    color: #c2410c !important;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04) !important;
  }

  [data-theme="light"] .db-root button[style*="rgba(201,168,76"]:hover,
  .db-root[data-theme="light"] button[style*="rgba(201,168,76"]:hover {
    background: var(--lm-orange-soft) !important;
  }

  [data-theme="light"] .db-root div[style*="rgba(10,12,22,0.95)"],
  .db-root[data-theme="light"] div[style*="rgba(10,12,22,0.95)"] {
    background: rgba(255, 255, 255, 0.98) !important;
    border: 1px solid var(--lm-border) !important;
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16) !important;
  }

  [data-theme="light"] .db-root div[style*="rgba(10,12,22,0.95)"] p,
  .db-root[data-theme="light"] div[style*="rgba(10,12,22,0.95)"] p {
    color: var(--lm-orange) !important;
  }

  [data-theme="light"] .db-root div[style*="rgba(10,12,22,0.95)"] button,
  .db-root[data-theme="light"] div[style*="rgba(10,12,22,0.95)"] button {
    background: #f8fafc !important;
    border-color: var(--lm-border) !important;
    color: #334155 !important;
  }

  [data-theme="light"] .db-root div[style*="rgba(10,12,22,0.95)"] button:hover,
  .db-root[data-theme="light"] div[style*="rgba(10,12,22,0.95)"] button:hover {
    background: var(--lm-orange-soft) !important;
    border-color: #fed7aa !important;
    color: #c2410c !important;
  }

  /* Invitation cards */
  [data-theme="light"] .db-root div[style*="rgba(15,17,32,0.7)"],
  .db-root[data-theme="light"] div[style*="rgba(15,17,32,0.7)"] {
    background: var(--lm-panel) !important;
    border-color: var(--lm-border) !important;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08) !important;
  }

  [data-theme="light"] .db-root h3[style*="color: #ffd580"],
  .db-root[data-theme="light"] h3[style*="color: #ffd580"] {
    color: var(--lm-orange) !important;
  }

  /* Forms */
  [data-theme="light"] .form-input,
  [data-theme="light"] .form-textarea,
  [data-theme="light"] .form-select,
  .db-root[data-theme="light"] .form-input,
  .db-root[data-theme="light"] .form-textarea,
  .db-root[data-theme="light"] .form-select {
    background: #ffffff !important;
    border-color: var(--lm-border) !important;
    color: var(--lm-text) !important;
  }

  [data-theme="light"] .form-input:focus,
  [data-theme="light"] .form-textarea:focus,
  [data-theme="light"] .form-select:focus,
  .db-root[data-theme="light"] .form-input:focus,
  .db-root[data-theme="light"] .form-textarea:focus,
  .db-root[data-theme="light"] .form-select:focus {
    border-color: #fb923c !important;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12) !important;
  }

  [data-theme="light"] .form-label,
  [data-theme="light"] .toggle-label strong,
  .db-root[data-theme="light"] .form-label,
  .db-root[data-theme="light"] .toggle-label strong {
    color: var(--lm-text) !important;
  }

  [data-theme="light"] .toggle-row,
  [data-theme="light"] .db-root .form-group[style*="background"],
  .db-root[data-theme="light"] .toggle-row,
  .db-root[data-theme="light"] .form-group[style*="background"] {
    background: var(--lm-panel) !important;
    border-color: var(--lm-border) !important;
  }

  [data-theme="light"] .form-cancel,
  [data-theme="light"] .btn-outline,
  [data-theme="light"] .btn-dim,
  .db-root[data-theme="light"] .form-cancel,
  .db-root[data-theme="light"] .btn-outline,
  .db-root[data-theme="light"] .btn-dim {
    background: #ffffff !important;
    border-color: var(--lm-border) !important;
    color: #475569 !important;
  }

  [data-theme="light"] .btn-primary,
  [data-theme="light"] .btn-primary *,
  [data-theme="light"] .form-submit,
  [data-theme="light"] .form-submit *,
  [data-theme="light"] button[style*="linear-gradient"],
  [data-theme="light"] button[style*="linear-gradient"] *,
  .db-root[data-theme="light"] .btn-primary,
  .db-root[data-theme="light"] .btn-primary *,
  .db-root[data-theme="light"] .form-submit,
  .db-root[data-theme="light"] .form-submit *,
  .db-root[data-theme="light"] button[style*="linear-gradient"],
  .db-root[data-theme="light"] button[style*="linear-gradient"] * {
    color: #ffffff !important;
    stroke: #ffffff !important;
  }

  [data-theme="light"] .btn-gold,
  .db-root[data-theme="light"] .btn-gold {
    background: var(--lm-orange-soft) !important;
    border-color: #fed7aa !important;
    color: #c2410c !important;
  }

  /* Trip and constraint tags */
  [data-theme="light"] .db-root span[style*="rgba(240, 194, 122"],
  .db-root[data-theme="light"] span[style*="rgba(240, 194, 122"] {
    background: var(--lm-orange-soft) !important;
    color: #c2410c !important;
    border-color: #fed7aa !important;
  }

  [data-theme="light"] .db-root span[style*="rgba(25, 118, 210"],
  .db-root[data-theme="light"] span[style*="rgba(25, 118, 210"] {
    background: #eff6ff !important;
    color: #1d4ed8 !important;
    border-color: #bfdbfe !important;
  }

  [data-theme="light"] .db-root [style*="#ffd580"],
  .db-root[data-theme="light"] [style*="#ffd580"] {
    color: var(--lm-orange) !important;
  }

  [data-theme="light"] .db-root [style*="#86efac"],
  .db-root[data-theme="light"] [style*="#86efac"] {
    color: #059669 !important;
    stroke: #059669 !important;
  }

  [data-theme="light"] .db-root [style*="#ff6b6b"],
  .db-root[data-theme="light"] [style*="#ff6b6b"] {
    color: #dc2626 !important;
  }

  /* Pagination */
  [data-theme="light"] .db-root div[style*="justify-content: center"][style*="margin-top: 2rem"] button,
  .db-root[data-theme="light"] div[style*="justify-content: center"][style*="margin-top: 2rem"] button {
    background: #ffffff !important;
    border: 1px solid var(--lm-border) !important;
    color: #475569 !important;
  }

  [data-theme="light"] .db-root div[style*="justify-content: center"][style*="margin-top: 2rem"] button[style*="linear-gradient"],
  .db-root[data-theme="light"] div[style*="justify-content: center"][style*="margin-top: 2rem"] button[style*="linear-gradient"] {
    background: linear-gradient(135deg, #fb923c, #ea580c) !important;
    border-color: transparent !important;
    color: #ffffff !important;
  }

  /* Upload area and expense section */
  [data-theme="light"] .db-root label div[style*="border: 2px dashed"],
  .db-root[data-theme="light"] label div[style*="border: 2px dashed"] {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
  }

  [data-theme="light"] .db-loading,
  .db-root[data-theme="light"] .db-loading {
    color: var(--lm-muted) !important;
  }

  [data-theme="light"] .db-spinner,
  .db-root[data-theme="light"] .db-spinner {
    color: var(--lm-orange) !important;
  }


  /* ──── FILTER DROPDOWN LIGHT MODE FIX ──── */
  [data-theme="light"] .filter-dropdown-panel,
  .db-root[data-theme="light"] .filter-dropdown-panel,
  html[data-theme="light"] .filter-dropdown-panel,
  body[data-theme="light"] .filter-dropdown-panel {
    background: #f3f4f6 !important;
    border: 1px solid #d1d5db !important;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16) !important;
    color: #111827 !important;
    backdrop-filter: blur(14px) !important;
  }

  [data-theme="light"] .filter-category-label,
  .db-root[data-theme="light"] .filter-category-label,
  html[data-theme="light"] .filter-category-label,
  body[data-theme="light"] .filter-category-label {
    color: #b45309 !important;
  }

  [data-theme="light"] .filter-tag-btn,
  .db-root[data-theme="light"] .filter-tag-btn,
  html[data-theme="light"] .filter-tag-btn,
  body[data-theme="light"] .filter-tag-btn {
    background: #ffffff !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
  }

  [data-theme="light"] .filter-tag-btn:hover,
  .db-root[data-theme="light"] .filter-tag-btn:hover,
  html[data-theme="light"] .filter-tag-btn:hover,
  body[data-theme="light"] .filter-tag-btn:hover {
    background: #ffedd5 !important;
    border-color: #fdba74 !important;
    color: #c2410c !important;
  }

  [data-theme="light"] .filter-tag-btn.selected,
  .db-root[data-theme="light"] .filter-tag-btn.selected,
  html[data-theme="light"] .filter-tag-btn.selected,
  body[data-theme="light"] .filter-tag-btn.selected {
    background: #fed7aa !important;
    border-color: #fb923c !important;
    color: #9a3412 !important;
  }

  [data-theme="light"] .filter-clear-btn,
  .db-root[data-theme="light"] .filter-clear-btn,
  html[data-theme="light"] .filter-clear-btn,
  body[data-theme="light"] .filter-clear-btn {
    background: #fee2e2 !important;
    border: 1px solid #fecaca !important;
    color: #b91c1c !important;
  }

  [data-theme="light"] .filter-clear-btn:hover,
  .db-root[data-theme="light"] .filter-clear-btn:hover,
  html[data-theme="light"] .filter-clear-btn:hover,
  body[data-theme="light"] .filter-clear-btn:hover {
    background: #fecaca !important;
    border-color: #fca5a5 !important;
    color: #991b1b !important;
  }

  [data-theme="light"] .filter-toggle-btn,
  .db-root[data-theme="light"] .filter-toggle-btn,
  html[data-theme="light"] .filter-toggle-btn,
  body[data-theme="light"] .filter-toggle-btn {
    background: #ffffff !important;
    border: 1px solid #fed7aa !important;
    color: #c2410c !important;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04) !important;
  }

  [data-theme="light"] .filter-toggle-btn.active,
  [data-theme="light"] .filter-toggle-btn:hover,
  .db-root[data-theme="light"] .filter-toggle-btn.active,
  .db-root[data-theme="light"] .filter-toggle-btn:hover,
  html[data-theme="light"] .filter-toggle-btn.active,
  html[data-theme="light"] .filter-toggle-btn:hover,
  body[data-theme="light"] .filter-toggle-btn.active,
  body[data-theme="light"] .filter-toggle-btn:hover {
    background: #ffedd5 !important;
    border-color: #fdba74 !important;
    color: #9a3412 !important;
  }


`;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local state for UI interactions - declare early for React Query dependencies
  const [myTrips, setMyTrips] = useState([]);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [stats, setStats] = useState({ created: 0, joined: 0, total: 0 });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("myTrips");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPageMyTrips, setCurrentPageMyTrips] = useState(1);
  const [currentPageAvailable, setCurrentPageAvailable] = useState(1);
  const [currentPageHistory, setCurrentPageHistory] = useState(1);
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("");
  const itemsPerPage = 6;

  // React Query hooks - will cache data and prevent redundant fetches
  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useUserProfile(!!user);

  const {
    data: allTrips = [],
    isLoading: tripsLoading,
    error: tripsError,
  } = useAllTrips(!!user);

  const {
    data: recommendedTrips = [],
    isLoading: recommendedLoading,
  } = useRecommendedTrips(!!user);

  const {
    data: tripHistory = [],
    isLoading: historyLoading,
  } = useTripHistory(!!user);

  const {
    data: invitationsList = [],
    isLoading: invLoadingState,
  } = useInvitations(activeTab === "invitations"); // Fetch when tab is opened

  const { data: cities = [] } = useCities(!!user);

  // Search destination recommendations
  const {
    data: destinationRecommendations = [],
    isLoading: isSearchingDestination,
  } = useDestinationRecommendations(destinationSearch, !!user);

  // Determine overall loading state
  const isLoading = profileLoading || tripsLoading;
  const userProfileId = userProfile?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Process trips data when allTrips or recommendedTrips change
  useEffect(() => {
    if (!userProfileId || !allTrips.length) return;

    try {
      const userTripsCreated = allTrips.filter(
        (t) => t.creator?.id === userProfileId
      );

      const userTripsJoined = allTrips.filter((t) => {
        let isParticipant = false;
        if (Array.isArray(t.participants)) {
          isParticipant = t.participants.some((p) => {
            const pId = typeof p === "object" ? p.id : p;
            return pId === userProfileId;
          });
        }
        const isNotCreator = t.creator?.id !== userProfileId;
        return isParticipant && isNotCreator;
      });

      const combined = [...userTripsCreated, ...userTripsJoined];

      // Use recommended trips if available, otherwise fallback to basic filtering
      const publicTrips =
        recommendedTrips.length > 0
          ? recommendedTrips
          : allTrips.filter(
              (t) =>
                t.is_public && !combined.some((mt) => mt.id === t.id)
            );

      setMyTrips(combined);
      setAvailableTrips(publicTrips);
      setStats({
        created: userTripsCreated.length,
        joined: userTripsJoined.length,
        total: allTrips.length,
      });
      setError("");
    } catch (err) {
      console.error("Error processing trips:", err);
      setError("Failed to process trips data");
    }
  }, [userProfileId, allTrips, recommendedTrips]);

  /* ── Enable scrollbar expansion on hover ── */
  useScrollbarExpand(".trips-grid, .scrollbar-expandable");

  const handleJoinTrip = async (tripId) => {
    try {
      const res = await api.post(`trips/${tripId}/join/`);

      // Send system message to trip chat
      try {
        const token = localStorage.getItem("access_token");
        const backendUrl =
          process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000/api/";
        const userName = user?.user?.first_name || user?.user?.username || "A user";
        await fetch(`${backendUrl.replace("/api/", "")}/api/chat/messages/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `${userName} joined the trip`,
            trip_id: tripId,
            is_system: true,
          }),
        });
      } catch (chatErr) {
        console.warn("Failed to send join notification:", chatErr);
      }

      // Invalidate caches to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedTrips"] });

      setActiveTab("myTrips");
      setError("");
    } catch (err) {
      console.error("Join trip error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to join trip.");
    }
  };

  const handleLeaveTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to leave this trip?")) return;
    try {
      const res = await api.post(`trips/${tripId}/leave/`);
      console.log("Leave response:", res.data);

      // Send system message to trip chat
      try {
        const token = localStorage.getItem("access_token");
        const backendUrl =
          process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000/api/";
        const userName = user?.user?.first_name || user?.user?.username || "A user";
        await fetch(`${backendUrl.replace("/api/", "")}/api/chat/messages/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `${userName} left the trip`,
            trip_id: tripId,
            is_system: true,
          }),
        });
      } catch (chatErr) {
        console.warn("Failed to send leave notification:", chatErr);
      }

      // Invalidate caches to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedTrips"] });

      setError("");
    } catch (err) {
      console.error("Leave trip error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to leave trip.");
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this trip? This action cannot be undone."
      )
    )
      return;
    try {
      console.log("Deleting trip:", tripId);
      await api.delete(`trips/${tripId}/`);
      console.log("Trip deleted successfully");

      // Invalidate caches to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedTrips"] });

      setError("");
    } catch (err) {
      console.error("Delete trip error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to delete trip.");
    }
  };

  const handleRespondToInvitation = async (invitationId, action) => {
    try {
      const res = await api.patch(
        `trips/invitations/${invitationId}/respond/`,
        { action }
      );
      console.log(`${action} invitation response:`, res.data);

      // Invalidate invitations cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ["invitations"] });

      if (action === "accept") {
        setError("");
        // Invalidate trips cache to show the newly joined trip
        queryClient.invalidateQueries({ queryKey: ["trips"] });
        queryClient.invalidateQueries({ queryKey: ["recommendedTrips"] });
      }
    } catch (err) {
      console.error(`Failed to ${action} invitation:`, err.message);
      setError(
        err.response?.data?.detail ||
          `Failed to ${action} invitation`
      );
    }
  };

  // Search for destination-specific recommendations
  const searchDestinationRecommendations = async (destination) => {
    if (!destination.trim()) {
      setDestinationSearch("");
      return;
    }

    setDestinationSearch(destination);
  };

  const tabs = [
    { id: "invitations", label: "Invitations",  icon: <Mail size={14} /> },
    { id: "myTrips",   label: "My Trips",      icon: <List size={14} /> },
    { id: "available", label: "Discover",       icon: <Compass size={14} /> },
    { id: "history",   label: "Trip History",   icon: <Clock size={14} /> },
    { id: "create",    label: "Create Trip",    icon: <PlusCircle size={14} /> },
  ];

  // Filter trips based on search query and tags
  const filterTrips = (trips) => {
    let result = trips;
    
    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by selected tags - show only trips that have ALL of the selected tags
    if (selectedFilterTags.length > 0) {
      result = result.filter(t => {
        // Parse trip_tags - it might be a JSON string or already an array
        let tripTags = t.trip_tags || [];
        
        if (typeof tripTags === 'string') {
          try {
            tripTags = JSON.parse(tripTags);
          } catch (e) {
            tripTags = [];
          }
        }
        
        // Make sure it's an array
        if (!Array.isArray(tripTags)) {
          tripTags = [];
        }
        
        // Case-insensitive comparison by converting both to lowercase
        const tripTagsLower = tripTags.map(tag => String(tag).toLowerCase());
        const hasMatchingTag = selectedFilterTags.every(selectedTag => 
          tripTagsLower.includes(selectedTag.toLowerCase())
        );
        return hasMatchingTag;
      });
    }
    
    return result;
  };

  // Handle search input change and fetch destination recommendations
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPageAvailable(1);

    // If user is typing a destination-like query, trigger React Query fetch
    if (query.trim().length > 0 && activeTab === "available") {
      searchDestinationRecommendations(query);
    } else {
      setDestinationSearch("");
    }
  };

  // Get filtered and paginated trips for "My Trips"
  const filteredMyTrips = filterTrips(myTrips);
  const totalMyTripPages = Math.ceil(filteredMyTrips.length / itemsPerPage);
  const paginatedMyTrips = filteredMyTrips.slice(
    (currentPageMyTrips - 1) * itemsPerPage,
    currentPageMyTrips * itemsPerPage
  );

  // Get filtered and paginated trips for "Available"
  // Use destination recommendations if available, otherwise use filtered available trips
  const tripsToShow = destinationRecommendations.length > 0 && searchQuery.trim() && activeTab === "available" 
    ? destinationRecommendations 
    : filterTrips(availableTrips);
  
  const filteredAvailableTrips = tripsToShow;
  const totalAvailablePages = Math.ceil(filteredAvailableTrips.length / itemsPerPage);
  const paginatedAvailableTrips = filteredAvailableTrips.slice(
    (currentPageAvailable - 1) * itemsPerPage,
    currentPageAvailable * itemsPerPage
  );

  // Get filtered and paginated trips for "History"
  const filteredHistoryTrips = filterTrips(tripHistory);
  const totalHistoryPages = Math.ceil(filteredHistoryTrips.length / itemsPerPage);
  const paginatedHistoryTrips = filteredHistoryTrips.slice(
    (currentPageHistory - 1) * itemsPerPage,
    currentPageHistory * itemsPerPage
  );

  return (
    <>
      <style>{styles}</style>
      
      {/* KYC Blocking Screen */}
      {profileLoading ? (
        <div className="db-root">
          <DashboardLoadingSkeleton />
        </div>
      ) : userProfile && userProfile.status && userProfile.status !== "approved" ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", width: "100vw", background: "linear-gradient(135deg, #07080f 0%, #0d0e1a 100%)", fontFamily: "'Syne',sans-serif" }}>
          <div style={{ textAlign: "center", maxWidth: 420, padding: "40px 30px", background: "rgba(255,255,255,.03)", border: ".5px solid rgba(240,194,122,.15)", borderRadius: 20, animation: "fadeIn 0.4s ease", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🔐</div>
            <div style={{ fontSize: 22, color: "#f5f0e8", marginBottom: 12, fontWeight: 700, letterSpacing: "-.5px" }}>
              {userProfile.status === "pending"
                ? "KYC Verification Pending"
                : userProfile.status === "under_review"
                ? "KYC Under Review"
                : "KYC Verification Required"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(245,240,232,.5)", lineHeight: 1.8, marginBottom: 24 }}>
              {userProfile.status === "pending"
                ? "Your KYC verification is pending. Please submit your documents to unlock Trip Dashboard features."
                : userProfile.status === "under_review"
                ? "Your KYC verification is currently under review. We'll notify you once it's approved."
                : "You need to complete KYC verification to access your trips."}
            </div>
            <a
              href="/kyc"
              style={{
                display: "inline-block",
                padding: "11px 28px",
                borderRadius: 10,
                background: "linear-gradient(135deg,#c9973a,#f0c27a)",
                color: "#0f0e0d",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: ".5px",
                boxShadow: "0 4px 16px rgba(240,194,122,.3)",
                transition: "all .2s",
                cursor: "pointer",
                border: "none"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(240,194,122,.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(240,194,122,.3)"; }}
            >
              {userProfile.status === "under_review" ? "View Status" : "Complete KYC"}
            </a>
            <div style={{ fontSize: 12, color: "rgba(245,240,232,.3)", marginTop: 16 }}>
              KYC is required for safety & security
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : (
      <div className="db-root">
        <div className="db-inner">

          {/* Header */}
          <div className="db-header">
            <h1 className="db-greeting">
              {TEXTS.greeting}, <span>{user?.first_name || user?.username}</span>
            </h1>
            <p className="db-subtext">{TEXTS.subtext}</p>
          </div>

          {/* Stats */}
          <div className="db-stats">
            <StatCard icon={<PlusCircle size={18} />} label={TEXTS.tripsCreated} value={stats.created} iconBg="rgba(255,213,128,0.12)" iconColor="#ffd580" />
            <StatCard icon={<Users size={18} />}      label={TEXTS.groupsJoined}  value={stats.joined}  iconBg="rgba(147,197,253,0.12)" iconColor="#93c5fd" />
            <StatCard icon={<Globe size={18} />}      label={TEXTS.totalTrips}    value={stats.total}   iconBg="rgba(134,239,172,0.12)" iconColor="#86efac" />
          </div>

          {/* KYC Banner */}
          {userProfile && !isLoading && <KYCBanner status={userProfile.status} rejectionReason={userProfile.rejection_reason} />}

          {/* Error */}
          {error && !isLoading && (
            <div className="db-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Tabs */}
          {!isLoading && (
          <div className="db-tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`db-tab${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          )}

          {/* Content */}
          {isLoading ? (
            <DashboardLoadingSkeleton />
          ) : (
            <>
              {/* Search Bar (visible on myTrips, available, and history tabs) */}
              {(activeTab === "myTrips" || activeTab === "available" || activeTab === "history") && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      type="text"
                      placeholder={TEXTS.search}
                      value={searchQuery}
                      onChange={(e) => {
                        handleSearchChange(e.target.value);
                        setCurrentPageMyTrips(1);
                        setCurrentPageHistory(1);
                      }}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontFamily: 'Poppins',
                        fontSize: '0.88rem',
                        outline: 'none',
                        padding: '0'
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPageMyTrips(1);
                          setCurrentPageAvailable(1);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          padding: '0',
                          fontSize: '1.2rem'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Trip Tags Filter - Click to Toggle */}
              {(activeTab === "myTrips" || activeTab === "available" || activeTab === "history") && (
                <div 
                  style={{ marginBottom: "1.5rem", position: 'relative' }}
                >
                  <button
                    className={`filter-toggle-btn ${showTagFilter ? "active" : ""}`}
                    onClick={() => setShowTagFilter(!showTagFilter)}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(201,168,76,0.3)',
                      background: showTagFilter ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                      color: showTagFilter ? '#ffd580' : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      fontFamily: 'Poppins'
                    }}
                  >
                     Filter by Requirements {selectedFilterTags.length > 0 && `(${selectedFilterTags.length})`}
                  </button>

                  {showTagFilter && (
                    <div
                    className="filter-dropdown-panel"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '0.8rem',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(201,168,76,0.3)',
                      background: 'rgba(10,12,22,0.95)',
                      backdropFilter: 'blur(10px)',
                      zIndex: 100,
                      minWidth: '400px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Object.entries(TRIP_TAGS_CATEGORIES).map(([category, tags]) => (
                          <div key={category}>
                            <p className="filter-category-label" style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, color: '#ffd580', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {category}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {tags.map(tag => (
                                <button
                                  key={tag}
                                  className={`filter-tag-btn ${selectedFilterTags.includes(tag) ? "selected" : ""}`}
                                  onClick={() => {
                                    setSelectedFilterTags(prev => {
                                      if (prev.includes(tag)) {
                                        return prev.filter(t => t !== tag);
                                      } else {
                                        return [...prev, tag];
                                      }
                                    });
                                    setCurrentPageMyTrips(1);
                                    setCurrentPageAvailable(1);
                                    setCurrentPageHistory(1);
                                  }}
                                  style={{
                                    padding: '0.4rem 0.7rem',
                                    borderRadius: '6px',
                                    border: `1px solid ${selectedFilterTags.includes(tag) ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.2)'}`,
                                    background: selectedFilterTags.includes(tag) ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                                    color: selectedFilterTags.includes(tag) ? '#ffd580' : 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s',
                                    fontFamily: 'Poppins',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {selectedFilterTags.includes(tag) && '✓ '}{tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedFilterTags.length > 0 && (
                        <button
                          className="filter-clear-btn"
                          onClick={() => {
                            setSelectedFilterTags([]);
                            setCurrentPageMyTrips(1);
                            setCurrentPageAvailable(1);
                            setCurrentPageHistory(1);
                          }}
                          style={{
                            marginTop: '0.8rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,100,100,0.3)',
                            background: 'rgba(255,100,100,0.1)',
                            color: '#ff6464',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            width: '100%',
                            fontFamily: 'Poppins'
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "invitations" && (
                <>
                  {invLoadingState ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : invitationsList.length === 0 ? (
                    <EmptyState 
                      icon={<Mail size={28} />} 
                      title="No invitations yet" 
                      subtitle="When someone invites you to a trip, it will show here." 
                      action={() => setActiveTab("available")} 
                      buttonText="Discover Trips"
                    />
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                      {invitationsList.map(inv => (
                        <div
                          key={inv.id}
                          style={{
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(201,168,76,0.3)',
                            background: 'rgba(15,17,32,0.7)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                          }}
                        >
                          <div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffd580', fontSize: '1.1rem', fontWeight: 600 }}>
                              {inv.trip?.title || 'Trip'}
                            </h3>
                            <p style={{ margin: '0.25rem 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                              📍 {inv.trip?.destination?.name || 'Destination unknown'}
                            </p>
                            <p style={{ margin: '0.25rem 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                              Invited by <strong>{inv.invited_by?.user?.first_name || 'Someone'}</strong>
                            </p>
                            {inv.sentAt && (
                              <p style={{ margin: '0.25rem 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                {inv.sentAt}
                              </p>
                            )}
                          </div>

                          <div style={{ borderTop: '1px solid rgba(201,168,76,0.2)', paddingTop: '1rem' }}>
                            <p style={{ margin: '0 0 0.75rem 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 500 }}>
                              Dates: {inv.trip?.start_date ? new Date(inv.trip.start_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'TBD'} - {inv.trip?.end_date ? new Date(inv.trip.end_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'TBD'}
                            </p>
                            <p style={{ margin: '0 0 1rem 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                              {inv.trip?.description && inv.trip.description.length > 100 ? inv.trip.description.substring(0, 100) + '...' : inv.trip?.description}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                              onClick={() => handleRespondToInvitation(inv.id, "accept")}
                              style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                fontFamily: 'Poppins',
                                transition: 'all 0.3s'
                              }}
                              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => handleRespondToInvitation(inv.id, "reject")}
                              style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,100,100,0.3)',
                                background: 'rgba(255,100,100,0.1)',
                                color: '#ff6464',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                fontFamily: 'Poppins',
                                transition: 'all 0.3s'
                              }}
                              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "myTrips" && (
                <>
                  {filteredMyTrips.length === 0
                    ? <EmptyState icon={<List size={28} />} title={searchQuery ? "No trips found" : "No trips yet"} subtitle={searchQuery ? "Try a different search" : "Create a new trip or discover public ones to join."} action={() => searchQuery ? setSearchQuery("") : setActiveTab("available")} buttonText={searchQuery ? "Clear Search" : "Discover Trips"} />
                    : <>
                        <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
                          Showing {((currentPageMyTrips - 1) * itemsPerPage) + 1}–{Math.min(currentPageMyTrips * itemsPerPage, filteredMyTrips.length)} of {filteredMyTrips.length} trips
                        </div>
                        <div className="db-grid">
                          {paginatedMyTrips.map(trip => (
                            <TripCard
                              key={trip.id} trip={trip}
                              isCreator={trip.creator?.id === userProfileId}
                              isParticipant={true}
                              onJoin={() => handleJoinTrip(trip.id)}
                              onLeave={() => handleLeaveTrip(trip.id)}
                              onDelete={trip.participants?.length === 1 ? () => handleDeleteTrip(trip.id) : null}
                              onView={() => navigate(`/trip/${trip.id}`)}
                              kycApproved={userProfile?.status === 'approved'}
                            />
                          ))}
                        </div>
                        {totalMyTripPages > 1 && <PaginationControls currentPage={currentPageMyTrips} totalPages={totalMyTripPages} onPageChange={setCurrentPageMyTrips} />}
                      </>
                  }
                </>
              )}

              {activeTab === "available" && (
                <>
                  {isSearchingDestination ? (
                    <EmptyState icon={<Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />} title="Searching for recommendations..." subtitle="Finding trips that match your interests in this destination..." />
                  ) : filteredAvailableTrips.length === 0
                    ? <EmptyState icon={<Compass size={28} />} title={searchQuery ? "No trips found" : "No public trips available"} subtitle={searchQuery ? "Try a different search" : "Be the first to create a trip."} action={() => searchQuery ? setSearchQuery("") : setActiveTab("create")} buttonText={searchQuery ? "Clear Search" : "Create Trip"} />
                    : <>
                        <p className="discover-tip"><Globe size={13} /> {destinationRecommendations.length > 0 ? "Recommended trips based on your interests" : "Public trips others have opened up — join one to start traveling together"}</p>
                        <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
                          Showing {((currentPageAvailable - 1) * itemsPerPage) + 1}–{Math.min(currentPageAvailable * itemsPerPage, filteredAvailableTrips.length)} of {filteredAvailableTrips.length} trips
                        </div>
                        <div className="db-grid">
                          {paginatedAvailableTrips.map(trip => {
                            const isParticipant = trip.participants?.some(p =>
                              typeof p === 'object' ? p.id === userProfileId : p === userProfileId
                            );
                            return (
                              <TripCard
                                key={trip.id} trip={trip}
                                isCreator={false}
                                isParticipant={isParticipant}
                                onJoin={() => handleJoinTrip(trip.id)}
                                onLeave={isParticipant ? () => handleLeaveTrip(trip.id) : null}
                                onView={() => navigate(`/trip/${trip.id}`)}
                                kycApproved={userProfile?.status === 'approved'}
                              />
                            );
                          })}
                        </div>
                        {totalAvailablePages > 1 && <PaginationControls currentPage={currentPageAvailable} totalPages={totalAvailablePages} onPageChange={setCurrentPageAvailable} />}
                      </>
                  }
                </>
              )}

              {activeTab === "history" && (
                <>
                  {paginatedHistoryTrips.length === 0 ? (
                    <EmptyState icon={<Clock size={28} />} title={searchQuery ? "No past trips found" : "No trip history yet"} subtitle={searchQuery ? "Try a different search" : "Your completed trips will appear here."} action={() => searchQuery ? setSearchQuery("") : setActiveTab("discover")} buttonText={searchQuery ? "Clear Search" : "Discover Trips"} />
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
                        {paginatedHistoryTrips.map(trip => (
                          <TripCard
                            key={trip.id}
                            trip={trip}
                            isCreator={trip.creator?.id === userProfileId}
                            onView={() => navigate(`/trip/${trip.id}`)}
                            kycApproved={userProfile?.status === "approved"}
                          />
                        ))}
                      </div>
                      {totalHistoryPages > 1 && (
                        <PaginationControls
                          currentPage={currentPageHistory}
                          totalPages={totalHistoryPages}
                          onPageChange={(page) => {
                            setCurrentPageHistory(page);
                            window.scrollTo(0, 0);
                          }}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === "create" && (
                <CreateTripSection onTripCreated={() => { queryClient.invalidateQueries({ queryKey: ["trips"] }); queryClient.invalidateQueries({ queryKey: ["recommendedTrips"] }); setActiveTab("myTrips"); }} setActiveTab={setActiveTab} />
              )}
            </>
          )}
        </div>
      </div>
      )}
    </>
  );
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '2rem',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        style={{
          padding: '8px 14px',
          background: currentPage === 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: 'rgba(255,255,255,0.6)',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontSize: '0.82rem',
          fontWeight: '600',
          transition: 'all 0.2s',
          opacity: currentPage === 1 ? 0.5 : 1
        }}
      >
        ← Previous
      </button>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              padding: '6px 12px',
              background: currentPage === page
                ? 'linear-gradient(135deg, #f97316, #ea580c)'
                : 'rgba(255,255,255,0.06)',
              border: currentPage === page
                ? 'none'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: currentPage === page ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 14px',
          background: currentPage === totalPages ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: 'rgba(255,255,255,0.6)',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontSize: '0.82rem',
          fontWeight: '600',
          transition: 'all 0.2s',
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
      >
        Next →
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, iconBg, iconColor }) {
  return (
    <div className="db-stat">
      <div className="db-stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div>
        <div className="db-stat-val">{value}</div>
        <div className="db-stat-label">{label}</div>
      </div>
    </div>
  );
}

function TripCard({ trip, isCreator, isParticipant, onJoin, onLeave, onDelete, onView, kycApproved }) {
  // Determine match score styling with glow effect (dark & light mode support)
  // Only show glow if user hasn't joined and isn't the creator
  const getMatchClass = (score) => {
    if (isCreator || isParticipant) return "";
    if (!score && score !== 0) return "";
    if (score > 70) return "match-high";
    if (score > 50) return "match-medium";
    if (score > 30) return "match-low";
    return "match-poor";
  };

  const getMatchGlow = () => {
    const score = trip.avg_similarity ? parseInt(trip.avg_similarity) : 0;
    const isDarkMode = document.documentElement.getAttribute('data-theme') !== 'light';
    
    if (score >= 70) {
      if (isDarkMode) {
        return {
          border: '1px solid rgba(34, 197, 94, 0.4)',
          boxShadow: '0 0 20px rgba(34, 197, 94, 0.25), 0 0 40px rgba(34, 197, 94, 0.12), inset 0 0 15px rgba(34, 197, 94, 0.08)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(34, 197, 94, 0.5) 100%)',
        };
      } else {
        // STRONG light mode: premium green highlight
        return {
          border: '2px solid rgba(34, 197, 94, 0.55)',
          boxShadow: '0 0 24px rgba(34, 197, 94, 0.28), 0 0 48px rgba(34, 197, 94, 0.12), inset 0 0 20px rgba(34, 197, 94, 0.1)',
          background: 'linear-gradient(135deg, rgba(245,243,240,1) 0%, rgba(34, 197, 94, 0.45) 100%)',
        };
      }
    } else if (score >= 50) {
      if (isDarkMode) {
        return {
          border: '1px solid rgba(234, 179, 8, 0.3)',
          boxShadow: '0 0 18px rgba(234, 179, 8, 0.18), 0 0 36px rgba(234, 179, 8, 0.09), inset 0 0 12px rgba(234, 179, 8, 0.06)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(234, 179, 8, 0.45) 100%)',
        };
      } else {
        // STRONG light mode: premium yellow-green highlight
        return {
          border: '2px solid rgba(168, 162, 10, 0.58)',
          boxShadow: '0 0 22px rgba(168, 162, 10, 0.26), 0 0 44px rgba(168, 162, 10, 0.11), inset 0 0 18px rgba(168, 162, 10, 0.09)',
          background: 'linear-gradient(135deg, rgba(245,243,240,1) 0%, rgba(168, 162, 10, 0.42) 100%)',
        };
      }
    } else if (score >= 30) {
      if (isDarkMode) {
        return {
          border: '1px solid rgba(249, 115, 22, 0.35)',
          boxShadow: '0 0 18px rgba(249, 115, 22, 0.19), 0 0 36px rgba(249, 115, 22, 0.1), inset 0 0 12px rgba(249, 115, 22, 0.07)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(249, 115, 22, 0.48) 100%)',
        };
      } else {
        // STRONG light mode: premium orange highlight
        return {
          border: '2px solid rgba(249, 115, 22, 0.56)',
          boxShadow: '0 0 22px rgba(249, 115, 22, 0.27), 0 0 44px rgba(249, 115, 22, 0.11), inset 0 0 18px rgba(249, 115, 22, 0.1)',
          background: 'linear-gradient(135deg, rgba(245,243,240,1) 0%, rgba(249, 115, 22, 0.44) 100%)',
        };
      }
    } else {
      if (isDarkMode) {
        return {
          border: '1px solid rgba(239, 68, 68, 0.28)',
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.14), 0 0 30px rgba(239, 68, 68, 0.07), inset 0 0 10px rgba(239, 68, 68, 0.05)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(239, 68, 68, 0.42) 100%)',
        };
      } else {
        // STRONG light mode: premium red highlight
        return {
          border: '2px solid rgba(239, 68, 68, 0.52)',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.24), 0 0 40px rgba(239, 68, 68, 0.1), inset 0 0 16px rgba(239, 68, 68, 0.08)',
          background: 'linear-gradient(135deg, rgba(245,243,240,1) 0%, rgba(239, 68, 68, 0.38) 100%)',
        };
      }
    }
  };

  const glowStyle = getMatchGlow();
  const matchScore = trip.avg_similarity ? parseInt(trip.avg_similarity) : 0;

  return (
    <div className={`trip-card ${getMatchClass(matchScore)}`} style={glowStyle}>
      <div className="trip-card-top">
        <div>
          <div className="trip-title">{trip.title}</div>
          <div className="trip-dest"><MapPin size={11} />{trip.destination?.name || "Destination TBD"}</div>
        </div>
        {isCreator
          ? <span className="trip-badge badge-creator">Creator</span>
          : trip.is_public && <span className="trip-badge badge-public">Public</span>
        }
      </div>

      {!isCreator && trip.creator && (
        <div className="trip-by"><LogIn size={11} />by {trip.creator?.first_name || trip.creator?.username}</div>
      )}

      <p className="trip-desc">{trip.description || "No description provided."}</p>

      {/* Constraint Tags */}
      {trip.constraint_tags && trip.constraint_tags.length > 0 && (
        <div style={{ marginBottom: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {trip.constraint_tags.map(tag => (
            <span
              key={tag.id}
              style={{
                fontSize: '0.7rem',
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                color: '#64b5f6',
                border: '1px solid rgba(25, 118, 210, 0.3)',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Trip Tags - These are the tags used for filtering */}
      {trip.trip_tags && trip.trip_tags.length > 0 && (
        <div style={{ marginBottom: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Array.isArray(trip.trip_tags) ? (
            trip.trip_tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(240, 194, 122, 0.2)',
                  color: '#ffd580',
                  border: '1px solid rgba(240, 194, 122, 0.5)',
                }}
              >
                {tag}
              </span>
            ))
          ) : typeof trip.trip_tags === 'string' ? (
            <span style={{ fontSize: '0.7rem', color: '#ff6b6b' }}>Invalid trip_tags format: {trip.trip_tags}</span>
          ) : null}
        </div>
      )}

      <div className="trip-meta">
        <div className="trip-meta-item">
          <Calendar size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
          <div>
            <span className="trip-meta-label">Start date</span>
            <span className="trip-meta-val">{new Date(trip.start_date).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="trip-meta-item">
          <Users size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
          <div>
            <span className="trip-meta-label">Participants</span>
            <span className="trip-meta-val">{trip.participants?.length || 0} joined</span>
          </div>
        </div>
      </div>

      <div className="trip-actions">
        <button className="btn btn-outline" onClick={onView} disabled={!kycApproved} style={!kycApproved ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
          View <ChevronRight size={13} />
        </button>
        {isCreator
          ? onDelete
            ? <button className="btn btn-danger" onClick={onDelete} disabled={!kycApproved} style={{ backgroundColor: !kycApproved ? 'rgba(100,100,100,0.2)' : 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444', opacity: !kycApproved ? 0.5 : 1, cursor: !kycApproved ? 'not-allowed' : 'pointer' }}>Delete</button>
            : <button className="btn btn-dim">Your Trip</button>
          : onLeave
            ? <button className="btn btn-gold" onClick={onLeave} disabled={!kycApproved} style={!kycApproved ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>Leave</button>
            : <button className="btn btn-primary" onClick={onJoin} disabled={!kycApproved} style={!kycApproved ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>Join Trip</button>
        }
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle, action, buttonText }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2 className="empty-title">{title}</h2>
      <p className="empty-sub">{subtitle}</p>
      <button className="btn btn-primary" style={{ display: "inline-flex", width: "auto", padding: "11px 28px" }} onClick={action}>
        {buttonText}
      </button>
    </div>
  );
}

function CreateTripSection({ onTripCreated, setActiveTab }) {
  // New structured trip tags
  const [formData, setFormData] = useState({
    title: "", description: "", destination: "",
    start_date: "", end_date: "", is_public: true
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "" });

  const getApiUrl = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000/api/";
    return backendUrl.replace('/api/', '');
  };
  
  const token = () => localStorage.getItem("access_token");

  useEffect(() => {
    api.get("trips/cities/").then(r => setCities(r.data || [])).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExpense = () => {
    if (newExpense.category.trim() && newExpense.amount.trim()) {
      const amount = parseFloat(newExpense.amount);
      if (!isNaN(amount) && amount > 0) {
        setExpenses([...expenses, { id: Date.now(), category: newExpense.category, amount }]);
        setNewExpense({ category: "", amount: "" });
      }
    }
  };

  const handleRemoveExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const calculateTotalExpense = () => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError("");
    
    // Validate date range
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate < startDate) {
        setError("End date cannot be before start date. No time travel allowed! 🚫");
        setLoading(false);
        return;
      }
    }
    
    // DEBUG: Log expenses array
    console.log(" FORM SUBMISSION DEBUG");
    console.log("Expenses array:", expenses);
    console.log("Expenses count:", expenses.length);
    expenses.forEach((exp, idx) => {
      console.log(`  [${idx}] ${exp.category}: Rs ${exp.amount}`);
    });
    
    try {
      // Step 1: Create trip with cover image
      const tripFormData = new FormData();
      tripFormData.append("title", formData.title);
      tripFormData.append("destination_id", parseInt(formData.destination));
      tripFormData.append("start_date", formData.start_date);
      tripFormData.append("end_date", formData.end_date);
      tripFormData.append("description", formData.description);
      tripFormData.append("is_public", formData.is_public);
      if (coverImage) {
        tripFormData.append("cover_image", coverImage);
      }
      // Store selected tags as JSON string in description or as a new field
      if (selectedTags.length > 0) {
        tripFormData.append("trip_tags", JSON.stringify(selectedTags));
      }

      const tripRes = await fetch(`${getApiUrl()}/api/trips/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: tripFormData
      });

      if (!tripRes.ok) {
        const errData = await tripRes.json();
        throw new Error(errData.detail || "Failed to create trip");
      }

      const tripData = await tripRes.json();
      const tripId = tripData.id;
      console.log(`✅ Trip created successfully with ID: ${tripId}`);

      // Step 2: Add expenses if any
      if (expenses.length > 0) {
        console.log(`Adding ${expenses.length} expenses...`);
        for (const expense of expenses) {
          try {
            const expenseUrl = `${getApiUrl()}/api/trips/${tripId}/expenses/`;
            const expensePayload = {
              category: expense.category,
              amount: expense.amount
            };
            
            console.log(`📤 Posting to: ${expenseUrl}`);
            console.log(`📦 Payload:`, expensePayload);
            
            const expRes = await fetch(expenseUrl, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token()}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(expensePayload)
            });
            
            console.log(`📥 Response status: ${expRes.status}`);
            
            if (!expRes.ok) {
              const errData = await expRes.json();
              console.error(`❌ Failed to add expense "${expense.category}":`, {
                status: expRes.status,
                error: errData
              });
              setError(`Failed to add expense: ${expense.category}`);
            } else {
              const savedExpense = await expRes.json();
              console.log(`✅ Added expense "${expense.category}" for Rs ${expense.amount}`, savedExpense);
            }
          } catch (expErr) {
            console.error(`❌ Error adding expense "${expense.category}":`, expErr);
            setError(`Error adding expense: ${expense.category}`);
          }
        }
      } else {
        console.log("No expenses to add");
      }

      onTripCreated();
    } catch (err) {
      console.error("Trip creation error:", err);
      setError(err.message || "Failed to create trip.");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="create-wrap">
      <h2 className="create-title">Create a New Trip</h2>

      {error && <div className="db-error" style={{ marginBottom: "1.5rem" }}><AlertCircle size={15} />{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Trip Title *</label>
          <input className="form-input" type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Pokhara Weekend Trek" required />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" name="description" value={formData.description} onChange={handleChange} placeholder="Tell others what this trip is about..." rows="4" />
        </div>

        {/* Cover Image Upload */}
        <div className="form-group">
          <label className="form-label">Trip Cover Photo</label>
          <div style={{
            position: 'relative',
            border: '2px dashed rgba(255,213,128,0.3)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,213,128,0.6)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,213,128,0.3)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          }}>
            {coverImagePreview ? (
              <>
                <img src={coverImagePreview} alt="Cover preview" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverImagePreview(null);
                  }}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(239,68,68,0.2)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#fca5a5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                >
                  Remove Image
                </button>
              </>
            ) : (
              <label style={{ cursor: 'pointer' }}>
                <div style={{ marginBottom: '0.5rem' }}><Image size={40} style={{ margin: '0 auto', color: 'rgba(255,255,255,0.5)' }} /></div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>Click to upload cover image</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>PNG, JPG up to 10MB</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Trip Tags Section */}
        <div className="form-group" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '12px', padding: '1.2rem' }}>
          <label className="form-label">Trip Characteristics (Select Tags)</label>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>Choose tags that describe your trip - select multiple from any category</p>
          
          {Object.entries(TRIP_TAGS_CATEGORIES).map(([category, tags]) => (
            <div key={category} style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffd580', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {category}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '20px',
                        border: `1px solid ${isSelected ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.2)'}`,
                        background: isSelected ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#ff9f43' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 600 : 500,
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        }
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Selected Tags Summary */}
          {selectedTags.length > 0 && (
            <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(249,115,22,0.3)' }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.6rem' }}>Selected tags ({selectedTags.length}):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedTags.map(tag => (
                  <div key={tag} style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '16px',
                    background: 'rgba(249,115,22,0.3)',
                    border: '1px solid rgba(249,115,22,0.4)',
                    color: '#ff9f43',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff9f43',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: '0',
                        marginLeft: '0.2rem'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expenses Section */}
        <div className="form-group" style={{ background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: '12px', padding: '1.2rem' }}>
          <label className="form-label">Trip Budget & Expenses (Optional)</label>
          
          {/* Add Expense Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 50px', gap: '0.8rem', marginBottom: '0.8rem' }}>
            <input
              type="text"
              placeholder="e.g., Bus, Hotel, Food"
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="form-input"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="form-input"
              step="0.01"
              min="0"
            />
            <button
              type="button"
              onClick={handleAddExpense}
              style={{
                padding: '0',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 700,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              +
            </button>
          </div>

          {/* Expenses List */}
          {expenses.length > 0 ? (
            <div style={{ marginBottom: '0.8rem' }}>
              {expenses.map((expense) => (
                <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.6rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{expense.category}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Rs {expense.amount.toFixed(2)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(expense.id)}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(239,68,68,0.2)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#fca5a5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {/* Total Expense */}
              <div style={{ paddingTop: '0.8rem', borderTop: '1px solid rgba(255,213,128,0.2)', marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Total Expense:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffd580' }}>Rs {calculateTotalExpense().toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', padding: '0.8rem 0' }}>No expenses added yet</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Destination *</label>
          <select className="form-select" name="destination" value={formData.destination} onChange={handleChange} required>
            <option value="">Select a destination...</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
          </select>
        </div>

        <div className="form-group form-grid">
          <div>
            <label className="form-label">Start Date *</label>
            <input className="form-input" type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
          </div>
          <div>
            <label className="form-label">End Date *</label>
            <input className="form-input" type="date" name="end_date" value={formData.end_date} onChange={handleChange} min={formData.start_date} required />
            {formData.start_date && formData.end_date && new Date(formData.end_date) < new Date(formData.start_date) && (
              <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '4px' }}>
                ⚠️ End date must be on or after start date
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <div className="toggle-row">
            <input type="checkbox" name="is_public" id="is_public" checked={formData.is_public} onChange={handleChange} />
            <label htmlFor="is_public" className="toggle-label">
              <strong><Globe size={13} style={{ display: "inline", marginRight: 5 }} />Make this trip public</strong>
              <span className="toggle-hint">Others can discover and join your trip. Uncheck to keep it invite-only.</span>
            </label>
            {formData.is_public ? <Globe size={16} style={{ color: "#86efac", flexShrink: 0 }} /> : <Lock size={16} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="form-submit" 
            disabled={loading || (formData.start_date && formData.end_date && new Date(formData.end_date) < new Date(formData.start_date))}
          >
            {loading ? <><Loader2 size={15} className="db-spinner" /> Creating...</> : "Create Trip"}
          </button>
          <button type="button" className="form-cancel" onClick={() => setActiveTab("myTrips")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}