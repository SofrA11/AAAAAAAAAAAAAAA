import { useState, useEffect } from "react";
import {
  postDestination,
  getDrzaveNazivi,
  getDrzavaById,
} from "../api_config.jsx";

export default function DodajDestinaciju({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Grad",
    imageUrl: "",
    priceMin: "",
    priceMax: "",
    pocetakSezone: "1",
    krajSezone: "12",
    drzavaId: "",
    gradId: "",
  });

  const [drzave, setDrzave] = useState([]);
  const [gradovi, setGradovi] = useState([]);
  const [loadingGradovi, setLoadingGradovi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const destinationTypes = [
    { value: "Grad", label: "Grad" },
    { value: "Plaza", label: "Plaža" },
    { value: "Planina", label: "Planina" },
    { value: "KulturnaDestinacija", label: "Kulturna destinacija" },
    { value: "PrirodnaAtrakcija", label: "Prirodna atrakcija" },
    { value: "AvanturistickaDestinacija", label: "Avanturistička destinacija" },
  ];

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

  // Učitavanje država pri inicijalizaciji
  useEffect(() => {
    getDrzaveNazivi()
      .then((data) => setDrzave(data))
      .catch((err) =>
        console.error("Greška pri učitavanju država:", err.message),
      );
  }, []);

  // Kada se izabere Država, učitaj Gradove za tu državu preko getDrzavaById
  const handleDrzavaChange = async (e) => {
    const selectedDrzavaId = e.target.value;
    setFormData({ ...formData, drzavaId: selectedDrzavaId, gradId: "" });
    setGradovi([]);

    if (selectedDrzavaId) {
      setLoadingGradovi(true);
      getDrzavaById(selectedDrzavaId)
        .then((drzava) => {
          setGradovi(drzava.gradovi || []);
          setLoadingGradovi(false);
        })
        .catch((err) => {
          console.error("Greška pri učitavanju gradova:", err);
          setGradovi([]);
          setLoadingGradovi(false);
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gradId) {
      setMessage({ type: "error", text: "Morate izabrati grad!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    // Mapiranje stringova u numeričke vrednosti enuma koje C# očekuje
    const destinationTypeMapping = {
      Grad: 0,
      Plaza: 1,
      Planina: 2,
      KulturnaDestinacija: 3,
      PrirodnaAtrakcija: 4,
      AvanturistickaDestinacija: 5,
    };
    const payload = {
      name: formData.name,
      description: formData.description,
      type: destinationTypeMapping[formData.type] ?? 0,
      imageUrl: formData.imageUrl,
      priceMin: Number(formData.priceMin),
      priceMax: Number(formData.priceMax),
      pocetakSezone: Number(formData.pocetakSezone),
      krajSezone: Number(formData.krajSezone),
      gradId: Number(formData.gradId),
    };

    try {
      await postDestination(payload);

      setMessage({ type: "success", text: "Destinacija je uspešno dodata!" });
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
        <h2 style={styles.title}>➕ Dodaj novu destinaciju</h2>
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
        {/* Naziv destinacije */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Naziv destinacije:</label>
          <input
            type="text"
            placeholder="Npr. Rim, Kopaonik..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        {/* DRŽAVA I GRAD */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Država:</label>
            <select
              value={formData.drzavaId}
              onChange={handleDrzavaChange}
              style={styles.input}
              required
            >
              <option value="">-- Izaberite državu --</option>
              {drzave.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.naziv}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Grad:</label>
            <select
              value={formData.gradId}
              onChange={(e) =>
                setFormData({ ...formData, gradId: e.target.value })
              }
              disabled={!formData.drzavaId || loadingGradovi}
              style={{
                ...styles.input,
                backgroundColor: !formData.drzavaId ? "#f1f5f9" : "#ffffff",
                cursor: !formData.drzavaId ? "not-allowed" : "pointer",
              }}
              required
            >
              <option value="">
                {!formData.drzavaId
                  ? "-- Prvo izaberite državu --"
                  : loadingGradovi
                    ? "Učitavanje gradova..."
                    : "-- Izaberite grad --"}
              </option>
              {gradovi.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.naziv}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tip destinacije */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Tip destinacije:</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            style={styles.input}
          >
            {destinationTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Opis */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Opis:</label>
          <textarea
            placeholder="Unesite detaljan opis..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
            required
          />
        </div>

        {/* Cena Min - Max */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Minimalna cena (€):</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Min cena"
              value={formData.priceMin}
              onChange={(e) =>
                setFormData({ ...formData, priceMin: e.target.value })
              }
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Maksimalna cena (€):</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Max cena"
              value={formData.priceMax}
              onChange={(e) =>
                setFormData({ ...formData, priceMax: e.target.value })
              }
              style={styles.input}
              required
            />
          </div>
        </div>

        {/* Trajanje sezone */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Trajanje sezone (Meseci):</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={formData.pocetakSezone}
              onChange={(e) =>
                setFormData({ ...formData, pocetakSezone: e.target.value })
              }
              style={{ ...styles.input, width: "100%" }}
            >
              {meseci.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <span>-</span>
            <select
              value={formData.krajSezone}
              onChange={(e) =>
                setFormData({ ...formData, krajSezone: e.target.value })
              }
              style={{ ...styles.input, width: "100%" }}
            >
              {meseci.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* URL Slike */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>URL Slike:</label>
          <input
            type="url"
            placeholder="https://example.com/slika.jpg"
            value={formData.imageUrl}
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
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
            {loading ? "Čuvanje..." : "Sačuvaj destinaciju"}
          </button>
        </div>
      </form>
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
  row: {
    display: "flex",
    gap: "15px",
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
