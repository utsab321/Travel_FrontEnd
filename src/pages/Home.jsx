import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useScrollbarExpand from "../hooks/useScrollbarExpand";
import { MapPin } from "lucide-react";
import bg from "../assets/bg.png";
import api from "../API/api";
import PeopleIcon from "@mui/icons-material/People";
import RoomIcon from "@mui/icons-material/Room";
import ShieldIcon from "@mui/icons-material/Shield";

// ──── CONSTANTS ────
const ITEMS_PER_PAGE = 8;
const PLACEHOLDER = "Search destinations, people, or trips…";

const FEATURES = [
  {
    icon: <PeopleIcon style={{ fontSize: 18 }} />,
    title: "Smart Matching",
    desc: "Connect with travelers who share your pace and interests",
    tag: "AI-Powered",
  },
  {
    icon: <RoomIcon style={{ fontSize: 18 }} />,
    title: "Trip Planning",
    desc: "Build itineraries together in real time, no back-and-forth",
    tag: "Collaborative",
  },
  {
    icon: <ShieldIcon style={{ fontSize: 18 }} />,
    title: "Safe & Verified",
    desc: "Verified members and 24/7 support keep every journey safe",
    tag: "Trusted",
  },
];

const STATS = [
  { number: "12k+", label: "Travelers" },
  { number: "340+", label: "Destinations" },
  { number: "8k+",  label: "Trips Planned" },
];

export default function Home() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api
      .get("/api/trips/destinations/")
      .then((res) => setDestinations(res.data))
      .catch((err) => console.error("Destinations fetch failed:", err));
  }, []);

  /* ── Enable scrollbar expansion on hover ── */
  useScrollbarExpand(".scrollbar-expandable, [class*='carousel'], [class*='gallery']");

  const handleDestinationClick = (destinationName) => {
    navigate("/explore", { state: { destinationName } });
  };

  const filtered = destinations.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(destinations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = destinations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = () => {
    const match = filtered[0];
    if (match) handleDestinationClick(match.name);
  };

  return (
    <div className="home-root">

      {/* ── Hero ── */}
      <section className="hero-section">
        {/* Gold glow blob */}
        <div className="hero-glow-blob" />

        {/* Background image overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          opacity: 0.90,
        }} />
        <div className="hero-gradient-overlay" />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, maxWidth: 560, width: "100%" }}>
          {/* Eyebrow */}
          {/* <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Now live in Nepal
          </div> */}

          <h1 className="hero-title">
            Find Your Partner
            <br />
            <span className="hero-title-accent">for the Adventure</span>
          </h1>

          <p className="hero-subtitle">
            Connect with like-minded travelers, plan trips together,
            and explore the world — one journey at a time.
          </p>

          {/* Search bar */}
          <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
            <div className="search-bar">
              <svg className="search-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); }}
                placeholder={PLACEHOLDER}
                onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) handleSearch(); }}
                className="search-input"
              />
              <button
                onClick={handleSearch}
                className="search-btn"
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                Explore →
              </button>
            </div>

            {/* Dropdown */}
            {query.trim() && (
              <div className="search-dropdown">
                {filtered.length > 0 ? (
                  filtered.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleDestinationClick(d.name)}
                      className="dropdown-item"
                      onMouseEnter={(e) => { e.currentTarget.classList.add("dropdown-item--hover"); }}
                      onMouseLeave={(e) => { e.currentTarget.classList.remove("dropdown-item--hover"); }}
                    >
                      {d.image ? (
                        <img src={d.image} alt={d.name} className="dropdown-img" />
                      ) : (
                        <div className="dropdown-img-placeholder">
                          <MapPin size={16} className="dropdown-pin-icon" />
                        </div>
                      )}
                      <div>
                        <div className="dropdown-name">{d.name}</div>
                        <div className="dropdown-location">{d.location}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="dropdown-empty">No destinations found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="scroll-cue">
          <span>scroll</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="stats-bar">
        {STATS.map((s, i) => (
          <div key={s.label} className={`stat-item${i < STATS.length - 1 ? " stat-item--border" : ""}`}>
            <span className="stat-number">{s.number}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Destinations ── */}
      <section className="destinations-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="destinations-header">
            <div>
              <p className="section-eyebrow">Explore</p>
              <h2 className="section-title">Popular Destinations</h2>
            </div>
            <span className="destinations-count">
              Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, destinations.length)} of {destinations.length}
            </span>
          </div>

          {destinations.length === 0 ? (
            <p className="empty-state">No destinations found</p>
          ) : (
            <>
              <div className="destinations-grid">
                {paginated.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleDestinationClick(d.name)}
                    className="destination-card"
                    onMouseEnter={(e) => {
                      e.currentTarget.classList.add("destination-card--hover");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.classList.remove("destination-card--hover");
                    }}
                  >
                    <div className="destination-img-wrap">
                      {d.image ? (
                        <img
                          src={d.image}
                          alt={d.name}
                          className="destination-img"
                        />
                      ) : (
                        <MapPin size={32} className="destination-img-placeholder-icon" />
                      )}
                    </div>
                    <div className="destination-body">
                      <div className="destination-name">{d.name}</div>
                      <div className="destination-location">
                        <span className="destination-dot" />
                        {d.location}
                      </div>
                      {d.description && (
                        <p className="destination-desc">{d.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`pagination-btn${page === currentPage ? " pagination-btn--active" : ""}`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <p className="section-eyebrow">Why Travel Sathi?</p>
            <h2 className="section-title">
              Your journey,{" "}
              <em className="section-title-accent">elevated</em>
            </h2>
          </div>

          <div className="features-grid">
            {FEATURES.map(({ icon, title, desc, tag }) => (
              <div
                key={title}
                className="feature-card"
                onMouseEnter={(e) => { e.currentTarget.classList.add("feature-card--hover"); }}
                onMouseLeave={(e) => { e.currentTarget.classList.remove("feature-card--hover"); }}
              >
                <div className="feature-icon-wrap">{icon}</div>
                <p className="feature-tag">{tag}</p>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        * { box-sizing: border-box; }

        /* ── DARK MODE (default) ── */
        :root,
        [data-theme="dark"] {
          --bg:              #0a0f1e;
          --bg-section:      rgba(255,255,255,0.015);
          --text:            #ffffff;
          --text-muted:      rgba(255,255,255,0.5);
          --text-light:      rgba(255,255,255,0.35);
          --text-lighter:    rgba(255,255,255,0.22);
          --accent:          #ffb84d;
          --accent-rgb:      255,184,77;
          --accent-bg:       rgba(255,184,77,0.08);
          --accent-border:   rgba(255,184,77,0.28);
          --border:          rgba(255,255,255,0.07);
          --border-card:     rgba(255,255,255,0.09);
          --surface:         rgba(255,255,255,0.04);
          --surface-hover:   rgba(255,255,255,0.07);
          --surface-feat:    rgba(255,255,255,0.03);
          --surface-feat-hover: rgba(255,184,77,0.03);
          --search-bg:       rgba(255,255,255,0.05);
          --search-border:   rgba(255,255,255,0.12);
          --dropdown-bg:     #111827;
          --dropdown-border: rgba(255,255,255,0.12);
          --dropdown-hover:  rgba(255,184,77,0.07);
          --hero-grad:       linear-gradient(160deg, #0a0f1e 0%, #111827 55%, #0d1526 100%);
          --hero-overlay:    linear-gradient(to bottom, rgba(10,15,30,0.3) 0%, rgba(10,15,30,0.55) 60%, #0a0f1e 100%);
          --img-placeholder-bg: linear-gradient(135deg, #1a2236 0%, #0d1526 100%);
          --img-placeholder-icon: rgba(255,255,255,0.1);
          --pagination-bg:   rgba(255,255,255,0.05);
          --pagination-border: rgba(255,255,255,0.12);
          --pagination-text: rgba(255,255,255,0.6);
          --stats-bg:        rgba(255,255,255,0.02);
          --scroll-color:    rgba(255,255,255,0.22);
        }

        /* ── LIGHT MODE ── */
        [data-theme="light"] {
          --bg:              #f4efe7;
          --bg-section:      #ffffff;
          --text:            #0f172a;
          --text-muted:      #64748b;
          --text-light:      #94a3b8;
          --text-lighter:    #cbd5e1;
          --accent:          #d97706;
          --accent-rgb:      217,119,6;
          --accent-bg:       rgba(217,119,6,0.10);
          --accent-border:   rgba(217,119,6,0.28);
          --border:          #e2e8f0;
          --border-card:     #e5e7eb;
          --surface:         #ffffff;
          --surface-hover:   #fff7ed;
          --surface-feat:    #ffffff;
          --surface-feat-hover: rgba(217,119,6,0.05);
          --search-bg:       #ffffff;
          --search-border:   #e2e8f0;
          --dropdown-bg:     #ffffff;
          --dropdown-border: #e5e7eb;
          --dropdown-hover:  rgba(217,119,6,0.06);
          --hero-grad:       linear-gradient(160deg, #d97706 0%, #b45309 55%, #92400e 100%);
          --hero-overlay:    linear-gradient(to bottom, rgba(217,119,6,0.2) 0%, rgba(180,83,9,0.4) 60%, #f4efe7 100%);
          --img-placeholder-bg: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          --img-placeholder-icon: rgba(217,119,6,0.3);
          --pagination-bg:   #ffffff;
          --pagination-border: #e5e7eb;
          --pagination-text: #64748b;
          --stats-bg:        rgba(255,255,255,0.8);
          --scroll-color:    rgba(15,23,42,0.5);
        }

        /* ── BASE ── */
        .home-root {
          font-family: 'Poppins', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }

        /* ── HERO ── */
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem 1rem;
          overflow: hidden;
          background: var(--hero-grad);
        }
        .hero-glow-blob {
          position: absolute;
          top: -140px; left: 50%;
          transform: translateX(-50%);
          width: 640px; height: 640px;
          background: radial-gradient(circle, rgba(var(--accent-rgb),0.07) 0%, transparent 68%);
          pointer-events: none;
        }
        .hero-gradient-overlay {
          position: absolute; inset: 0;
          background: var(--hero-overlay);
        }

        /* Eyebrow */
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--accent-bg);
          border: 0.5px solid var(--accent-border);
          border-radius: 100px;
          padding: 5px 15px;
          font-size: 11px; font-weight: 600;
          color: var(--accent);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent);
          animation: pulse 2s infinite;
          flex-shrink: 0;
        }
        .hero-title {
          font-size: clamp(2.2rem, 5vw, 3.4rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #fff;
          margin-bottom: 1.1rem;
        }
        .hero-title-accent { color: var(--accent); }
        .hero-subtitle {
          font-size: 15px;
          color: rgba(255,255,255,0.55);
          line-height: 1.75;
          max-width: 440px;
          margin: 0 auto 2.5rem;
        }

        /* Search */
        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--search-bg);
          border: 0.5px solid var(--search-border);
          border-radius: 100px;
          padding: 8px 8px 8px 20px;
          backdrop-filter: blur(12px);
          transition: border-color 0.2s;
        }
        .search-icon { color: var(--text-light); flex-shrink: 0; }
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: var(--text);
          font-family: inherit;
        }
        .search-input::placeholder { color: var(--text-lighter); }
        .search-btn {
          background: var(--accent);
          color: #ffffff;
          border: none;
          border-radius: 100px;
          padding: 9px 22px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.2s, transform 0.15s;
          flex-shrink: 0;
        }

        /* Dropdown */
        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px); left: 0; right: 0;
          background: var(--dropdown-bg);
          border: 0.5px solid var(--dropdown-border);
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          z-index: 50;
          max-height: 260px;
          overflow-y: auto;
        }
        .dropdown-item {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-bottom: 0.5px solid var(--border);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: inherit;
          transition: background 0.15s;
        }
        .dropdown-item--hover { background: var(--dropdown-hover) !important; }
        .dropdown-img { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .dropdown-img-placeholder {
          width: 38px; height: 38px; border-radius: 8px;
          background: var(--accent-bg);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dropdown-pin-icon { color: var(--accent); }
        .dropdown-name { font-size: 14px; font-weight: 600; color: var(--text); }
        .dropdown-location { font-size: 12px; color: var(--text-light); margin-top: 1px; }
        .dropdown-empty { padding: 16px; text-align: center; font-size: 13px; color: var(--text-light); }

        /* Scroll cue */
        .scroll-cue {
          position: absolute;
          bottom: 32px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          color: var(--scroll-color);
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          animation: scrollBounce 2.5s ease-in-out infinite;
        }

        /* ── STATS ── */
        .stats-bar {
          display: flex;
          justify-content: center;
          border-top: 0.5px solid var(--border);
          border-bottom: 0.5px solid var(--border);
          background: var(--stats-bg);
        }
        .stat-item {
          flex: 1; max-width: 200px;
          text-align: center;
          padding: 1.4rem 1rem;
        }
        .stat-item--border { border-right: 0.5px solid var(--border); }
        .stat-number { display: block; font-size: 22px; font-weight: 700; color: var(--accent); }
        .stat-label { font-size: 11px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.07em; }

        /* ── DESTINATIONS ── */
        .destinations-section { padding: 5rem 1rem; background: var(--bg); }
        .destinations-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .section-eyebrow {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent);
          margin-bottom: 6px;
        }
        .section-title { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 600; color: var(--text); }
        .section-title-accent { color: var(--accent); font-style: italic; }
        .destinations-count { font-size: 13px; color: var(--text-lighter); padding-bottom: 4px; }
        .empty-state { color: var(--text-light); text-align: center; padding: 3rem 0; }

        .destinations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .destination-card {
          background: var(--surface);
          border: 0.5px solid var(--border-card);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s, background 0.2s,
                      box-shadow 0.2s;
        }
        .destination-card--hover {
          transform: translateY(-4px);
          border-color: rgba(var(--accent-rgb),0.35) !important;
          background: var(--surface-hover) !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }
        .destination-img-wrap {
          width: 100%; height: 140px;
          background: var(--img-placeholder-bg);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .destination-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .destination-img:hover { transform: scale(1.05); }
        .destination-img-placeholder-icon { color: var(--img-placeholder-icon); }
        .destination-body { padding: 14px 16px 16px; }
        .destination-name { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 5px; }
        .destination-location {
          font-size: 12px; color: var(--text-light);
          display: flex; align-items: center; gap: 5px;
        }
        .destination-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--accent); opacity: 0.6; flex-shrink: 0;
        }
        .destination-desc {
          font-size: 12px; color: var(--text-lighter);
          margin-top: 8px; line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ── PAGINATION ── */
        .pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-top: 2.5rem;
        }
        .pagination-btn {
          background: var(--pagination-bg);
          border: 0.5px solid var(--pagination-border);
          border-radius: 8px;
          color: var(--pagination-text);
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 400;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-btn--active {
          background: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #ffffff !important;
          font-weight: 700;
        }
        .pagination-btn:disabled { opacity: 0.4; cursor: default; }

        /* ── FEATURES ── */
        .features-section {
          padding: 5rem 1rem;
          background: var(--bg-section);
          border-top: 0.5px solid var(--border);
          border-bottom: 0.5px solid var(--border);
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .feature-card {
          background: var(--surface-feat);
          border: 0.5px solid var(--border-card);
          border-radius: 16px;
          padding: 28px;
          transition: border-color 0.25s, transform 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .feature-card--hover {
          border-color: rgba(var(--accent-rgb),0.3) !important;
          background: var(--surface-feat-hover) !important;
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }
        .feature-icon-wrap {
          width: 44px; height: 44px; border-radius: 10px;
          background: var(--accent-bg);
          border: 0.5px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          margin-bottom: 18px;
        }
        .feature-tag {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--accent); opacity: 0.75;
          margin-bottom: 6px;
        }
        .feature-title { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
        .feature-desc { font-size: 13px; color: var(--text-muted); line-height: 1.65; }
      `}</style>
    </div>
  );
}