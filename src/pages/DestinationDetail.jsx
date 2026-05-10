import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import api from "../API/api";

const MESSAGES = {
  loading: "Loading destination details...",
  loadError: "Could not load destination details. Please try again.",
  notFound: "Destination not found",
  noTripsPlanned: "No trips planned to ",
  yet: " yet.",
  firstToCreate: "Be the first to create one!",
  planTrip: "Plan a Trip Here",
};

const BUTTONS = {
  back: "← Back to Explore",
  backToExplore: "Back to Explore",
  planTrip: "Plan a Trip Here",
  beFirst: "Be the first to create one!",
};

const COLORS = {
  background: "#0c0a09",
  textLight: "#f5f0e8",
  textMuted: "#c9973a",
  goldGradientStart: "#c9973a",
  goldGradientEnd: "#f0c27a",
  borderGold: "rgba(201,151,58,.3)",
  borderGoldLight: "rgba(240,194,122,.15)",
  cardBg: "rgba(255,255,255,.04)",
  cardBgHover: "rgba(255,255,255,.08)",
  textGold: "#f0c27a",
  textSecondary: "rgba(245,240,232,.7)",
  textTertiary: "rgba(245,240,232,.65)",
  textQuaternary: "rgba(245,240,232,.5)",
  buttonBg: "linear-gradient(135deg,#c9973a,#f0c27a)",
  buttonText: "#0f0e0d",
};

const STYLES = {
  container: {
    minHeight: "100vh",
    background: COLORS.background,
    color: COLORS.textLight,
    padding: "40px 20px",
  },
  innerContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  backBtn: {
    marginBottom: "20px",
    padding: "8px 16px",
    background: `rgba(201,151,58,.15)`,
    color: COLORS.textGold,
    border: `1px solid ${COLORS.borderGold}`,
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  cardContainer: {
    background: COLORS.cardBg,
    border: `1px solid ${COLORS.borderGoldLight}`,
    borderRadius: "12px",
    padding: "30px",
    marginBottom: "40px",
  },
  image: {
    width: "100%",
    height: "400px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "36px",
    fontWeight: 700,
    marginBottom: "10px",
    background: COLORS.buttonBg,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  locationText: {
    fontSize: "16px",
    color: COLORS.textSecondary,
    marginBottom: "20px",
  },
  description: {
    lineHeight: "1.8",
    color: "rgba(245,240,232,.85)",
    marginBottom: "30px",
  },
  button: {
    padding: "12px 24px",
    background: COLORS.buttonBg,
    color: COLORS.buttonText,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    transition: "transform .2s",
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "20px",
    color: COLORS.textLight,
  },
  tripsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  tripCard: {
    background: COLORS.cardBg,
    border: `1px solid ${COLORS.borderGoldLight}`,
    borderRadius: "8px",
    padding: "20px",
    cursor: "pointer",
    transition: "all .3s",
  },
  emptyState: {
    background: "rgba(255,255,255,.03)",
    border: `1px solid rgba(240,194,122,.1)`,
    borderRadius: "8px",
    padding: "30px",
    textAlign: "center",
    color: "rgba(245,240,232,.6)",
  },
  emptyButton: {
    marginTop: "15px",
    padding: "10px 20px",
    background: COLORS.buttonBg,
    color: COLORS.buttonText,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default function DestinationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [relatedTrips, setRelatedTrips] = useState([]);

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        setLoading(true);
        // Fetch destination details
        const destRes = await api.get(`/trips/destinations/${id}/`);
        setDestination(destRes.data);

        // Fetch trips to this destination
        const tripsRes = await api.get(`/trips/`);
        // Filter trips by city name matching destination's city
        const filtered = tripsRes.data.results?.filter(trip => 
          trip.destination?.id === destRes.data.city?.id
        ) || [];
        setRelatedTrips(filtered);
      } catch (err) {
        console.error("Error fetching destination:", err);
        setError(MESSAGES.loadError);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDestination();
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.background,
          color: COLORS.textLight,
        }}
      >
        <div>{MESSAGES.loading}</div>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.background,
          color: COLORS.textLight,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p>{error}</p>
          <button
            onClick={() => navigate("/explore")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: COLORS.buttonBg,
              color: COLORS.buttonText,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {BUTTONS.backToExplore}
          </button>
        </div>
      </div>
    );

  if (!destination)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.background,
          color: COLORS.textLight,
        }}
      >
        <div>{MESSAGES.notFound}</div>
      </div>
    );

  return (
    <div style={STYLES.container}>
      <div style={STYLES.innerContainer}>
        {/* Header */}
        <button
          onClick={() => navigate("/explore")}
          style={STYLES.backBtn}
        >
          {BUTTONS.back}
        </button>

        {/* Destination Info */}
        <div style={STYLES.cardContainer}>
          {destination.image && (
            <img
              src={destination.image}
              alt={destination.name}
              style={STYLES.image}
            />
          )}

          <h1 style={STYLES.title}>
            {destination.name}
          </h1>

          <p style={STYLES.locationText}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={16} style={{ color: "#C9A84C" }} />
              {destination.location}
            </span>
            {destination.city && `, ${destination.city.name}`}
          </p>

          <div style={STYLES.description}>
            {destination.description}
          </div>

          <button
            onClick={() => navigate("/create-trip")}
            style={STYLES.button}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            {BUTTONS.planTrip}
          </button>
        </div>

        {/* Related Trips */}
        <div>
          <h2 style={STYLES.sectionTitle}>
            Trips to {destination.name}
          </h2>

          {relatedTrips.length > 0 ? (
            <div style={STYLES.tripsGrid}>
              {relatedTrips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/trip/${trip.id}`)}
                  style={STYLES.tripCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(240,194,122,.4)";
                    e.currentTarget.style.background = COLORS.cardBgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderGoldLight;
                    e.currentTarget.style.background = COLORS.cardBg;
                  }}
                >
                  <h3 style={{ fontSize: "18px", marginBottom: "10px", color: COLORS.textGold }}>
                    {trip.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: COLORS.textTertiary,
                      marginBottom: "10px",
                    }}
                  >
                    {trip.description?.substring(0, 100)}...
                  </p>
                  <p 
                    style={{
                      fontSize: "13px",
                      color: COLORS.textQuaternary,
                    }}
                  >
                    📅 {trip.start_date} to {trip.end_date}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={STYLES.emptyState}>
              <p>{MESSAGES.noTripsPlanned}{destination.name}{MESSAGES.yet}</p>
              <button
                onClick={() => navigate("/create-trip")}
                style={STYLES.emptyButton}
              >
                {BUTTONS.beFirst}
                
                {BUTTONS.beFirst}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
