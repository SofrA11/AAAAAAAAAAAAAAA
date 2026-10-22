import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchDestinations, // Pretpostavka da je ovo funkcija iz api_config.jsx koja pravi poziv
  putDestination,
  getDrzaveNazivi,
  getDrzavaById,
  getGradById,
} from "../api_config.jsx";

export default function UrediDestinaciju({ onCancel, onSuccess }) {
  const [destinacije, setDestinacije] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDestinacijaId, setSelectedDestinacijaId] = useState("");
  const [loadingDestinacije, setLoadingDestinacije] = useState(true);

  const searchRef = useRef(null);

  const [formData, setFormData] = useState({
    id: 0,
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

  const destinationTypeReverseMapping = {
    0: "Grad",
    1: "Plaza",
    2: "Planina",
    3: "KulturnaDestinacija",
    4: "PrirodnaAtrakcija",
    5: "AvanturistickaDestinacija",
  };

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

  // Dinamičko učitavanje/pretraga destinacija na osnovu unetog teksta
  const fetchDestinations = useCallback(async () => {
    try {
      setLoadingDestinacije(true);
      const params = new URLSearchParams();

      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm.trim());
      }

      params.append("page", 1);
      params.append("limit", 10); // Možeš prilagoditi limit po želji

      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (typeof searchDestinations === "function") {
        const responseData = await searchDestinations(params, headers);
        // Podržavamo i slučaj ako API vraća niz direktno ili objekat sa .data
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

  // Efekat za učitavanje država i inicijalno punjenje destinacija
  useEffect(() => {
    const initData = async () => {
      try {
        const drzData = await getDrzaveNazivi();
        setDrzave(drzData || []);
      } catch (err) {
        console.error("Greška pri učitavanju država:", err.message);
      }
    };
    initData();
    fetchDestinations();

    // Zatvaranje dropdown-a na klik van komponente
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchDestinations]);

  // Praćenje kucanja u search box-u sa blagim odlaganjem (debounce opciono ili direktno pozivanje)
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    fetchDestinations();
  };

  // Kada administrator izabere destinaciju iz padajuće liste
  const handleSelectDestinacija = async (selected) => {
    setSelectedDestinacijaId(selected.id);
    setSearchTerm(selected.name);
    setShowDropdown(false);
    setMessage({ type: "", text: "" });

    let drzId = "";
    let gradoviZaDrzavu = [];

    try {
      // 1. Dohvatamo grad da bismo saznali kojoj državi pripada (ako grad nije već ubačen u selected)
      if (selected.gradId) {
        const gradObj = await getGradById(selected.gradId);
        // Podržavamo i mala i velika slova (id / Id)
        drzId =
          gradObj?.drzavaId ||
          gradObj?.DrzavaId ||
          gradObj?.drzava?.id ||
          gradObj?.drzava?.Id ||
          "";

        // 2. Odmah učitavamo gradove za tu državu da se lista napuni
        if (drzId) {
          setLoadingGradovi(true);
          const drzavaObj = await getDrzavaById(drzId);
          gradoviZaDrzavu = drzavaObj.gradovi || [];
          setGradovi(gradoviZaDrzavu);
        }
      }
    } catch (err) {
      console.error("Greška pri dohvatanju grada/države:", err);
    } finally {
      setLoadingGradovi(false);
    }

    const typeString =
      typeof selected.type === "number"
        ? destinationTypeReverseMapping[selected.type]
        : selected.type;

    // 3. Postavljamo vrednosti u formu, uključujući drzavaId i gradId
    setFormData({
      id: selected.id,
      name: selected.name || "",
      description: selected.description || "",
      type: typeString || "Grad",
      imageUrl: selected.imageUrl || "",
      priceMin: selected.priceMin || "",
      priceMax: selected.priceMax || "",
      pocetakSezone: String(selected.pocetakSezone || 1),
      krajSezone: String(selected.krajSezone || 12),
      drzavaId: drzId,
      gradId: selected.gradId || "",
    });
  };
  // Kada se promeni država u formi
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

  // Slanje izmenjenih podataka
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      setMessage({
        type: "error",
        text: "Morate izabrati destinaciju za izmenu!",
      });
      return;
    }
    if (!formData.gradId) {
      setMessage({ type: "error", text: "Morate izabrati grad!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const destinationTypeMapping = {
      Grad: 0,
      Plaza: 1,
      Planina: 2,
      KulturnaDestinacija: 3,
      PrirodnaAtrakcija: 4,
      AvanturistickaDestinacija: 5,
    };

    const payload = {
      id: Number(formData.id),
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
      await putDestination(formData.id, payload);
      setMessage({
        type: "success",
        text: "Destinacija je uspešno izmenjena!",
      });
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
        <h2 style={styles.title}>✏️ Uredi destinaciju</h2>
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

      {/* SEARCH BOX ZA PRETRAGU DESTINACIJA */}
      <div
        style={{
          ...styles.inputGroup,
          marginBottom: "20px",
          position: "relative",
        }}
        ref={searchRef}
      >
        <label style={{ ...styles.label, color: "#2563eb", fontSize: "15px" }}>
          Pretražite destinaciju po nazivu:
        </label>
        <input
          type="text"
          placeholder="Unesite naziv destinacije..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          style={{
            ...styles.input,
            borderColor: "#2563eb",
            backgroundColor: "#f0f9ff",
            fontWeight: "600",
          }}
        />

        {/* PADAJUĆA LISTA REZULTATA PRETRAGE */}
        {showDropdown && destinacije.length > 0 && (
          <ul style={styles.dropdown}>
            {destinacije.map((d) => (
              <li
                key={d.id}
                onClick={() => handleSelectDestinacija(d)}
                style={styles.dropdownItem}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e0f2fe")
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

      {selectedDestinacijaId && (
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Naziv destinacije */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Naziv destinacije:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
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
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? "Spremanje..." : "Sačuvaj izmene"}
            </button>
          </div>
        </form>
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
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },
  submitButton: {
    padding: "12px 20px",
    backgroundColor: "#d97706",
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
