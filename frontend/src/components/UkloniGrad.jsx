import { useState, useEffect } from "react";
import { getDrzaveNazivi, getDrzavaById, deleteGrad } from "../api_config.jsx";

export default function UkloniGrad({ onCancel, onSuccess }) {
  const [drzave, setDrzave] = useState([]);
  const [gradovi, setGradovi] = useState([]);
  const [selectedDrzavaId, setSelectedDrzavaId] = useState("");
  const [selectedGradId, setSelectedGradId] = useState("");

  const [loadingDrzave, setLoadingDrzave] = useState(true);
  const [loadingGradovi, setLoadingGradovi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Učitavanje država pri inicijalizaciji
  useEffect(() => {
    getDrzaveNazivi()
      .then((data) => {
        setDrzave(data);
        setLoadingDrzave(false);
      })
      .catch((err) => {
        console.error("Greška pri učitavanju država:", err);
        setMessage({ type: "error", text: "Neuspešno učitavanje država." });
        setLoadingDrzave(false);
      });
  }, []);

  // Kada se izabere država, učitaj gradove za tu državu
  const handleDrzavaChange = async (e) => {
    const drzavaId = e.target.value;
    setSelectedDrzavaId(drzavaId);
    setSelectedGradId("");
    setGradovi([]);

    if (drzavaId) {
      setLoadingGradovi(true);
      try {
        const data = await getDrzavaById(drzavaId);
        setGradovi(data.gradovi || []);
      } catch (err) {
        console.error("Greška pri učitavanju gradova:", err);
        setMessage({
          type: "error",
          text: "Neuspešno učitavanje gradova za izabranu državu.",
        });
      } finally {
        setLoadingGradovi(false);
      }
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!selectedGradId) {
      setMessage({ type: "error", text: "Morate izabrati grad za brisanje!" });
      return;
    }

    // Dodatna potvrda pre brisanja
    const potvrda = window.confirm(
      "Da li ste sigurni da želite da obrišete ovaj grad? Biće obrisane i sve povezane destinacije.",
    );
    if (!potvrda) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await deleteGrad(selectedGradId);

      setMessage({
        type: "success",
        text: "Grad i povezane destinacije su uspešno obrisani!",
      });
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Greška pri brisanju grada.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerContainer}>
        <h2 style={styles.title}>🗑️ Ukloni grad</h2>
        {onCancel && (
          <button onClick={onCancel} style={styles.closeButton}>
            ✕
          </button>
        )}
      </div>

      {message.text && (
        <div
          style={
            message.type === "success" ? styles.successAlert : styles.errorAlert
          }
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleDelete} style={styles.form}>
        {/* Izbor države */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Izaberite državu:</label>
          <select
            value={selectedDrzavaId}
            onChange={handleDrzavaChange}
            disabled={loadingDrzave}
            style={styles.input}
            required
          >
            <option value="">
              {loadingDrzave
                ? "Učitavanje država..."
                : "-- Prvo izaberite državu --"}
            </option>
            {drzave.map((d) => (
              <option key={d.id} value={d.id}>
                {d.naziv}
              </option>
            ))}
          </select>
        </div>

        {/* Izbor grada */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Izaberite grad:</label>
          <select
            value={selectedGradId}
            onChange={(e) => setSelectedGradId(e.target.value)}
            disabled={!selectedDrzavaId || loadingGradovi}
            style={{
              ...styles.input,
              backgroundColor: !selectedDrzavaId ? "#f1f5f9" : "#ffffff",
              cursor: !selectedDrzavaId ? "not-allowed" : "pointer",
            }}
            required
          >
            <option value="">
              {!selectedDrzavaId
                ? "-- Prvo izaberite državu --"
                : loadingGradovi
                  ? "Učitavanje gradova..."
                  : gradovi.length === 0
                    ? "Nema gradova u ovoj državi"
                    : "-- Izaberite grad --"}
            </option>
            {gradovi.map((g) => (
              <option key={g.id} value={g.id}>
                {g.naziv}
              </option>
            ))}
          </select>
        </div>

        {/* Upozorenje */}
        <div style={styles.warningBox}>
          ⚠️ <strong>Pažnja:</strong> Brisanjem grada automatski se uklanjaju i
          sve destinacije koje pripadaju tom gradu.
        </div>

        {/* Dugmad */}
        <div style={styles.buttonContainer}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={styles.cancelButton}
            >
              Otkaži
            </button>
          )}
          <button
            type="submit"
            disabled={loading || loadingDrzave || loadingGradovi}
            style={styles.deleteButton}
          >
            {loading ? "Brisanje..." : "Obriši grad"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  card: {
    maxWidth: "500px",
    margin: "20px auto",
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: "700",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
  },
  warningBox: {
    padding: "12px 14px",
    backgroundColor: "#fffbeb",
    color: "#b45309",
    borderRadius: "8px",
    border: "1px solid #fde68a",
    fontSize: "13px",
    lineHeight: "1.4",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },
  deleteButton: {
    padding: "12px 20px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "12px 20px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  successAlert: {
    padding: "10px 14px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
    fontWeight: "500",
  },
  errorAlert: {
    padding: "10px 14px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
    fontWeight: "500",
  },
};
