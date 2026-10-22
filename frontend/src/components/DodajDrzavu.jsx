import { useState } from "react";
import { postDrzava } from "../api_config.jsx";

export default function DodajDrzavu({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    naziv: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.naziv.trim()) {
      setMessage({ type: "error", text: "Naziv države je obavezan!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const payload = {
      naziv: formData.naziv.trim(),
    };

    try {
      await postDrzava(payload);

      setMessage({ type: "success", text: "Država je uspešno dodata!" });
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Greška pri čuvanju." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerContainer}>
        <h2 style={styles.title}>➕ Dodaj novu državu</h2>
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

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Naziv države */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Naziv države:</label>
          <input
            type="text"
            placeholder="Npr. Italija, Srbija..."
            value={formData.naziv}
            onChange={(e) =>
              setFormData({ ...formData, naziv: e.target.value })
            }
            style={styles.input}
            required
          />
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
          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? "Čuvanje..." : "Sačuvaj državu"}
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
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },
  submitButton: {
    padding: "12px 20px",
    backgroundColor: "#2563eb",
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
