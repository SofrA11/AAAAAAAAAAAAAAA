import { useState, useEffect, useCallback } from "react";
import DestinacijaInfo from "./DestinacijaInfo.jsx";
import { getRecommendations } from "../api_config.jsx";
export default function PreporuceneDestinacije() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedDestination, setSelectedDestination] = useState(null);

  const fetchRecommendedDestinations = useCallback(async () => {
    setLoading(true);
    try {
      const limit = 5;

      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const responseData = await getRecommendations(limit, headers);

      if (Array.isArray(responseData)) {
        setDestinations(responseData);
      } else if (responseData && Array.isArray(responseData.data)) {
        setDestinations(responseData.data);
      } else {
        setDestinations([]);
      }
    } catch (error) {
      console.error("Greška pri učitavanju preporučenih destinacija:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendedDestinations();
  }, [fetchRecommendedDestinations]);

  const handleBackToList = () => {
    setSelectedDestination(null);
    fetchRecommendedDestinations();
  };

  if (selectedDestination) {
    return (
      <DestinacijaInfo
        destination={""}
        destinationId={selectedDestination.destinacijaId}
        onBack={handleBackToList}
      />
    );
  }

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: "20px" }}>
        Učitavanje preporučenih destinacija...
      </p>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Zaglavlje sekcije */}
      <div
        style={{
          marginBottom: "20px",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "10px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#2c3e50",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>🔥</span> Preporučene Destinacije Za Vas
        </h2>
        <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
          Personalizovane destinacije prilagođene vašim interesovanjima.
        </p>
      </div>

      {/* Grid sa karticama */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {destinations.length > 0 ? (
          destinations.map((dest) => {
            const id = dest.destinacijaId;
            const name = dest.naziv;
            const imageUrl = dest.imageUrl;
            const description = dest.description;
            const rating = dest.prosecnaOcena ?? 0;
            return (
              <div
                key={id}
                onClick={() => setSelectedDestination(dest)}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              >
                {/* Badge preporuke */}
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    backgroundColor: "#ff4757",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    zIndex: 1,
                  }}
                >
                  Preporučeno
                </span>

                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={name}
                    style={{
                      width: "100%",
                      height: "160px",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div
                  style={{
                    padding: "15px",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 10px 0" }}>{name}</h3>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        margin: "0 0 10px 0",
                      }}
                    >
                      {description
                        ? description.substring(0, 90) + "..."
                        : "Bez opisa"}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "bold", color: "#ffb400" }}>
                      ★ {Number(rating).toFixed(1)}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#23c084",
                        fontWeight: "bold",
                      }}
                    >
                      Detaljnije →
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>Trenutno nema preporučenih destinacija za vas.</p>
        )}
      </div>
    </div>
  );
}
