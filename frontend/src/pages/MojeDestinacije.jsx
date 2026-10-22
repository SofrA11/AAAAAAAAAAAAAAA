import { useState, useEffect } from "react";
import { getUserReviews } from "../api_config.jsx";
export default function MojeDestinacije({ onSelectDestination }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUserReviews = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const userString = localStorage.getItem("user");
        const userData = userString ? JSON.parse(userString) : null;
        const email = userData?.email;

        if (!email) {
          setLoading(false);
          return;
        }

        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        {
          const data = await getUserReviews(email, headers);
          setReviews(data);
        }
      } catch (error) {
        console.error("Mrežna greška:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, []);

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: "30px" }}>
        Učitavanje vaših recenzija...
      </p>
    );
  }
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3 style={{ color: "#d32f2f" }}>
          Došlo je do greške prilikom učitavanja recenzija.
        </h3>
        <p style={{ color: "#666" }}>Molimo vas pokušajte ponovo kasnije.</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3>Još uvek niste ocenili nijednu destinaciju.</h3>
        <p style={{ color: "#666" }}>
          Istražite destinacije i podelite vaše utiske s drugima!
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "30px auto", padding: "0 20px" }}>
      <h2 style={{ marginBottom: "24px", color: "#2c3e50" }}>
        Moje ocenjene destinacije
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {reviews.map((item) => {
          const dest = item.destinacija || item.Destinacija;
          if (!dest) return null;

          const formattedDate =
            item.datumOcenjivanja || item.DatumOcenjivanja
              ? new Date(
                  item.datumOcenjivanja || item.DatumOcenjivanja,
                ).toLocaleDateString("sr-RS", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "";

          const userRating = item.userOcena ?? item.UserOcena ?? 0;
          const userComment = item.userKomentar || item.UserKomentar;

          return (
            <div
              key={item.reviewId || item.ReviewId}
              style={{
                display: "flex",
                backgroundColor: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "transform 0.2s ease",
                borderLeft: "5px solid #23c084",
              }}
            >
              {/* Slika destinacije */}
              {dest.imageUrl && (
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  style={{
                    width: "220px",
                    height: "100%",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    onSelectDestination && onSelectDestination(dest)
                  }
                />
              )}

              {/* Sadrzaj */}
              <div
                style={{
                  padding: "20px",
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 6px 0",
                          cursor: "pointer",
                          color: "#1565c0",
                        }}
                        onClick={() =>
                          onSelectDestination && onSelectDestination(dest)
                        }
                      >
                        {dest.name}
                      </h3>
                      {dest.grad && (
                        <span style={{ fontSize: "13px", color: "#666" }}>
                          📍 {dest.grad.naziv || dest.grad.Naziv}
                        </span>
                      )}
                    </div>

                    {/* ocena */}
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#777",
                          display: "block",
                        }}
                      >
                        Vaša ocena
                      </span>
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#ffb400",
                          fontSize: "18px",
                        }}
                      >
                        ★ {userRating}
                      </span>
                    </div>
                  </div>

                  {/* komentar */}
                  <div
                    style={{
                      marginTop: "14px",
                      backgroundColor: "#f9f9f9",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#333",
                        fontStyle: userComment ? "normal" : "italic",
                      }}
                    >
                      {userComment
                        ? `"${userComment}"`
                        : "Ocenjeno bez komentara."}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    paddingTop: "10px",
                    borderTop: "1px solid #eee",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#888" }}>
                    Ocenjeno: {formattedDate}
                  </span>

                  <button
                    onClick={() =>
                      onSelectDestination && onSelectDestination(dest)
                    }
                    style={{
                      backgroundColor: "transparent",
                      color: "#23c084",
                      border: "none",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Pogledaj detalje destinacije →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
