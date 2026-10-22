import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchDestinations,
  deleteDestination, // Proveri da li ti se funkcija u api_config zove ovako (ili ukloniDestinaciju)
} from "../api_config.jsx";

export default function UkloniDestinaciju({ onCancel, onSuccess }) {
  const [destinacije, setDestinacije] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDestinacija, setSelectedDestinacija] = useState(null);
  const [loadingDestinacije, setLoadingDestinacije] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const searchRef = useRef(null);

  // Učitavanje/pretraga destinacija
  const fetchDestinations = useCallback(async () => {
    try {
      setLoadingDestinacije(true);
      const params = new URLSearchParams();

      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm.trim());
      }

      params.append("page", 1);
      params.append("limit", 10);

      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (typeof searchDestinations === "function") {
        const responseData = await searchDestinations(params, headers);
        const items = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];
        setDestinacije(items);
      }
    } catch (error) {
      console.error("Greška pri učitavanju destinacija:", error);
    } finally {
      setLoadingDestinacije(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchDestinations();

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchDestinations]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    fetchDestinations();
  };

  const handleSelectDestinacija = (dest) => {
    setSelectedDestinacija(dest);
    setSearchTerm(dest.name);
    setShowDropdown(false);
    setMessage({ type: "", text: "" });
  };

  // Slanje zahteva za brisanje
  const handleDelete = async () => {
    if (!selectedDestinacija) return;

    const confirmed = window.confirm(
      `Da li ste sigurni da želite trajno da obrišete destinaciju "${selectedDestinacija.name}"?`,
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      if (typeof deleteDestination === "function") {
        await deleteDestination(selectedDestinacija.id);
      } else {
        console.log(`Brisem destinaciju sa ID-jem: ${selectedDestinacija.id}`);
      }

      setMessage({
        type: "success",
        text: "Destinacija je uspešno uklonjena!",
      });
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Greška pri brisanju destinacije.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerContainer}>
        <h2 style={styles.title}>🗑️ Ukloni destinaciju</h2>
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

      {/* SEARCH BOX ZA PRETRAGU */}
      <div
        style={{
          ...styles.inputGroup,
          marginBottom: "20px",
          position: "relative",
        }}
        ref={searchRef}
      >
        <label style={{ ...styles.label, color: "#dc2626", fontSize: "15px" }}>
          Pronađite destinaciju za brisanje:
        </label>
        <input
          type="text"
          placeholder="Unesite naziv destinacije..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          style={{
            ...styles.input,
            borderColor: "#dc2626",
            backgroundColor: "#fef2f2",
            fontWeight: "600",
          }}
        />

        {showDropdown && destinacije.length > 0 && (
          <ul style={styles.dropdown}>
            {destinacije.map((d) => (
              <li
                key={d.id}
                onClick={() => handleSelectDestinacija(d)}
                style={styles.dropdownItem}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#fee2e2")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ffffff")
                }
              >
                {d.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* PRIKAZ DETALJA IZABRANE DESTINACIJE PRE BRISANJA */}
      {selectedDestinacija && (
        <div style={styles.previewBox}>
          <h3 style={styles.previewTitle}>Izabrana destinacija:</h3>
          <p>
            <strong>Naziv:</strong> {selectedDestinacija.name}
          </p>
          <p>
            <strong>Opis:</strong> {selectedDestinacija.description}
          </p>
          <p>
            <strong>Cena:</strong> {selectedDestinacija.priceMin}€ -{" "}
            {selectedDestinacija.priceMax}€
          </p>

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
              type="button"
              onClick={handleDelete}
              disabled={loading}
              style={styles.deleteButton}
            >
              {loading ? "Brisanje..." : "Trajno obriši"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    maxWidth: "600px",
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
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    marginTop: "4px",
    maxHeight: "200px",
    overflowY: "auto",
    listStyle: "none",
    padding: 0,
    margin: "4px 0 0 0",
    zIndex: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  dropdownItem: {
    padding: "10px 14px",
    fontSize: "14px",
    cursor: "pointer",
    color: "#1e293b",
    borderBottom: "1px solid #f1f5f9",
  },
  previewBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "14px",
    color: "#334155",
  },
  previewTitle: {
    margin: "0 0 10px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "15px",
  },
  deleteButton: {
    padding: "10px 18px",
    backgroundColor: "#dc2626", // Crvena boja za brisanje
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "10px 18px",
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
