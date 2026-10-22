import { useState, useEffect } from "react";
import { API_URL } from "../api_config.jsx";
import {
  getReviewsByDestinationId,
  getDestinationById,
  addReview,
  toggleLike,
} from "../api_config.jsx";

const getDestinationTypeLabel = (type) => {
  const types = {
    0: "Grad",
    1: "Plaža",
    2: "Planina",
    3: "Kulturna destinacija",
    4: "Prirodna atrakcija",
    5: "Avanturistička destinacija",
    Grad: "Grad",
    Plaza: "Plaža",
    Planina: "Planina",
    KulturnaDestinacija: "Kulturna destinacija",
    PrirodnaAtrakcija: "Prirodna atrakcija",
    AvanturistickaDestinacija: "Avanturistička destinacija",
  };
  return types[type] ?? "Destinacija";
};

export default function DestinacijaInfo({
  destination,
  destinationId,
  onBack,
}) {
  const [dest, setDest] = useState(destination || null);
  const [loadingDest, setLoadingDest] = useState(!destination);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const actualId = dest?.id || destinationId;

  const fetchComments = async () => {
    if (!actualId) return;
    setLoadingComments(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const data = await getReviewsByDestinationId(actualId, headers);
      setComments(data);
    } catch (error) {
      console.error("Greška pri učitavanju komentara:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchDestinationDetails = async () => {
    if (!actualId) return;
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const data = await getDestinationById(actualId, headers);
      setDest(data);
    } catch (error) {
      console.error("Greška pri učitavanju detalja destinacije:", error);
    }
  };

  useEffect(() => {
    if (destinationId && !destination) {
      setLoadingDest(true);
      fetchDestinationDetails().finally(() => setLoadingDest(false));
    }
  }, [destination, destinationId]);

  useEffect(() => {
    fetchComments();
  }, [actualId]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");
      const userData = userString ? JSON.parse(userString) : null;
      const userEmail = userData?.email;

      if (!userEmail) {
        alert("Niste prijavljeni. Email korisnika nije pronađen u sistemu.");
        setSubmittingComment(false);
        return;
      }

      await addReview({
        userEmail,
        destinationId: actualId,
        rating: newRating,
        comment: newComment,
      });
      await Promise.all([fetchComments(), fetchDestinationDetails()]);

      setNewComment("");
      setNewRating(5);
    } catch (error) {
      console.error("Greška pri slanju ocene/komentara:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const sendReaction = async (reviewId, isLiked) => {
    try {
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");
      const userData = userString ? JSON.parse(userString) : null;
      const email = userData?.email;

      if (!email) {
        alert("Morate biti prijavljeni da biste reagovali na recenziju.");
        return;
      }

      const data = await toggleLike({
        reviewId,
        email,
        liked: isLiked,
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === reviewId || c.Id === reviewId
            ? { ...c, likeNum: data.likeNum, dislikeNum: data.dislikeNum }
            : c,
        ),
      );
    } catch (error) {
      console.error("Greška pri slanju reakcije:", error);
    }
  };

  const handleLike = (reviewId) => sendReaction(reviewId, true);
  const handleDislike = (reviewId) => sendReaction(reviewId, false);

  if (loadingDest) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Učitavanje detalja destinacije...</p>
      </div>
    );
  }

  if (!dest) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Destinacija nije pronađena.</p>
        <button onClick={onBack} style={styles.backButton}>
          ← Nazad na sve destinacije
        </button>
      </div>
    );
  }
  const meseci = [
    { value: 1, label: "Januar" },
    { value: 2, label: "Februar" },
    { value: 3, label: "Mart" },
    { value: 4, label: "April" },
    { value: 5, label: "Maj" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Avgust" },
    { value: 9, label: "Septembar" },
    { value: 10, label: "Oktobar" },
    { value: 11, label: "Novembar" },
    { value: 12, label: "Decembar" },
  ];

  const name = dest.name;
  const imageUrl = dest.imageUrl;
  const description = dest.description;
  const rating = dest.averageRating;
  const type = dest.type;
  const priceMin = dest.priceMin ?? 0;
  const priceMax = dest.priceMax ?? 0;
  const seasonStart = dest.pocetakSezone;
  const seasonEnd = dest.krajSezone;
  let recommendedSeason;
  if (seasonStart == 1 && seasonEnd == 12) {
    recommendedSeason = "Cele godine";
  } else {
    recommendedSeason = `${meseci[seasonStart - 1].label} - ${meseci[seasonEnd - 1].label}`;
  }

  const getSubmitButtonLabel = () => {
    if (submittingComment) return "Slanje...";
    return newComment.trim() ? "Objavi komentar" : "Oceni bez komentara";
  };

  return (
    <div style={styles.container}>
      {/* Dugme za povratak */}
      <button onClick={onBack} style={styles.backButton}>
        ← Nazad na sve destinacije
      </button>

      {/* Kartica sa detaljima destinacije */}
      <div style={styles.card}>
        {imageUrl && <img src={imageUrl} alt={name} style={styles.heroImage} />}

        <div style={styles.detailsContent}>
          {/* Tip*/}
          <div style={styles.topBadgeRow}>
            <span style={styles.typeBadge}>
              🏷️ {getDestinationTypeLabel(type)}
            </span>
          </div>

          {/* Naslov i prosecna ocena */}
          <div style={styles.headerRow}>
            <h1 style={styles.title}>{name}</h1>
            <span style={styles.ratingBadge}>
              ★ {Number(rating).toFixed(1)}
            </span>
          </div>

          {/* Opis */}
          <p style={styles.description}>
            {description || "Ova destinacija trenutno nema opisa."}
          </p>

          {/* Cenovni rang i preporucena sezona */}
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>💰</span>
              <div>
                <div style={styles.infoLabel}>Cenovni rang</div>
                <div style={styles.infoValue}>
                  {priceMin > 0 || priceMax > 0
                    ? `${priceMin} € - ${priceMax} €`
                    : "Kontaktirajte za cenu"}
                </div>
              </div>
            </div>

            {recommendedSeason && (
              <div style={styles.infoCard}>
                <span style={styles.infoIcon}>📅</span>
                <div>
                  <div style={styles.infoLabel}>Preporučena sezona</div>
                  <div style={styles.infoValue}>{recommendedSeason}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sekcija za ocene i komentare */}
      <div style={styles.commentsSection}>
        <h2>Komentari i ocene posetilaca</h2>

        {/* Forma za dodavanje ocene/komentara */}
        <form onSubmit={handleAddComment} style={styles.form}>
          <div style={styles.formRow}>
            <label style={{ fontWeight: "600" }}>Ostavite vašu ocenu:</label>
            <select
              value={newRating}
              onChange={(e) => setNewRating(e.target.value)}
              style={styles.selectInput}
            >
              <option value={5}>5 ★ - Odlično</option>
              <option value={4}>4 ★ - Vrlo dobro</option>
              <option value={3}>3 ★ - Dobro</option>
              <option value={2}>2 ★ - Dovoljno</option>
              <option value={1}>1 ★ - Loše</option>
            </select>
          </div>

          <textarea
            rows="3"
            placeholder="Napišite vaš utisak o ovoj destinaciji (opciono)..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={styles.textarea}
          />

          <button
            type="submit"
            disabled={submittingComment}
            style={styles.submitButton}
          >
            {getSubmitButtonLabel()}
          </button>
        </form>

        {/* Lista komentara i ocena */}
        {loadingComments ? (
          <p>Učitavanje komentara...</p>
        ) : comments.length > 0 ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {comments.map((comm) => {
              const rawDate = comm.datumKreiranja;

              const formattedDate =
                rawDate && !isNaN(new Date(rawDate).getTime())
                  ? new Date(rawDate).toLocaleDateString("sr-RS", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "";
              const userName = comm.username || "Korisnik";
              const hasText = Boolean(comm.komentar && comm.komentar.trim());
              const reviewOcena = comm.ocena || 0;

              return (
                <div key={comm.id} style={styles.commentCard}>
                  {/* Korisnik + Datum levo | Ocena desno */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: hasText ? "8px" : "0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#2c3e50",
                          fontSize: "15px",
                        }}
                      >
                        {userName}
                      </span>
                      {formattedDate && (
                        <span style={{ color: "#888", fontSize: "13px" }}>
                          ({formattedDate})
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#ffb400",
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      <span>{"★".repeat(reviewOcena)}</span>
                      <span
                        style={{
                          color: "#555",
                          marginLeft: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {Number(reviewOcena).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Tekst komentara */}
                  {hasText && (
                    <p
                      style={{
                        margin: "8px 0 12px 0",
                        color: "#444",
                        fontSize: "14px",
                        lineHeight: "1.5",
                      }}
                    >
                      {comm.komentar}
                    </p>
                  )}

                  {/* Reakcije (Lajk/Dislajk) */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "16px",
                      alignItems: "center",
                      marginTop: hasText ? "0" : "8px",
                    }}
                  >
                    <button
                      onClick={() => handleLike(comm.id)}
                      style={styles.actionBtn}
                      title="Sviđa mi se"
                    >
                      <span style={{ fontSize: "16px", color: "#2196F3" }}>
                        👍
                      </span>
                      <span
                        style={{
                          fontWeight: "bold",
                          fontSize: "13px",
                          color: "#555",
                        }}
                      >
                        {comm.likeNum || 0}
                      </span>
                    </button>

                    <button
                      onClick={() => handleDislike(comm.id)}
                      style={styles.actionBtn}
                      title="Ne sviđa mi se"
                    >
                      <span style={{ fontSize: "16px", color: "#E91E63" }}>
                        👎
                      </span>
                      <span
                        style={{
                          fontWeight: "bold",
                          fontSize: "13px",
                          color: "#555",
                        }}
                      >
                        {comm.dislikeNum || 0}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "#777", fontStyle: "italic" }}>
            Još uvek nema recenzija za ovu destinaciju. Budi prvi koji će
            ostaviti utisak!
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "30px auto",
    padding: "0 20px",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    border: "none",
    padding: "10px 18px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    marginBottom: "30px",
  },
  heroImage: {
    width: "100%",
    height: "350px",
    objectFit: "cover",
  },
  detailsContent: {
    padding: "24px",
  },
  topBadgeRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  typeBadge: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
  },
  locationBadge: {
    backgroundColor: "#e3f2fd",
    color: "#1565c0",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    color: "#2c3e50",
    fontSize: "28px",
  },
  ratingBadge: {
    backgroundColor: "#fff8e1",
    color: "#ffb400",
    padding: "6px 14px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "18px",
    border: "1px solid #ffe082",
  },
  description: {
    color: "#444",
    fontSize: "16px",
    lineHeight: "1.7",
    marginBottom: "24px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    borderTop: "1px solid #eee",
    paddingTop: "20px",
  },
  infoCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#f8f9fa",
    padding: "12px 16px",
    borderRadius: "10px",
  },
  infoIcon: {
    fontSize: "24px",
  },
  infoLabel: {
    fontSize: "12px",
    color: "#777",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  commentsSection: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  form: {
    marginBottom: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  formRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  selectInput: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontFamily: "inherit",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  submitButton: {
    alignSelf: "flex-start",
    backgroundColor: "#23c084",
    color: "#fff",
    border: "none",
    padding: "10px 22px",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
  commentCard: {
    backgroundColor: "#f9f9f9",
    padding: "16px 20px",
    borderRadius: "10px",
    borderLeft: "4px solid #23c084",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "background-color 0.2s",
  },
};
