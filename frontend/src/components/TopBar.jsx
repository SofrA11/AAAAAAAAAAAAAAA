import { useState, useRef, useEffect } from "react";
import { getDrzaveNazivi, getDrzavaById } from "../api_config.jsx";
export default function TopBar({
  onNavigate,
  onLogout,
  onSearch,
  onApplyFilters,
  user,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [drzave, setDrzave] = useState([]);
  const [gradovi, setGradovi] = useState([]);
  const [loadingGradovi, setLoadingGradovi] = useState(false);

  const [filters, setFilters] = useState({
    drzavaId: "",
    gradId: "",
    kategorija: "sve",
    minCena: "",
    maxCena: "",
    minOcena: "0",
    pocetakSezone: "",
    krajSezone: "",
  });
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

  const pocetakVal = Number(filters.pocetakSezone) || null;

  const handlePocetakChange = (e) => {
    const val = e.target.value;
    const noviPocetak = val === "" ? "" : Number(val);
    const trenutniKraj = Number(filters.krajSezone) || null;

    setFilters({
      ...filters,
      pocetakSezone: noviPocetak,
      krajSezone:
        noviPocetak && trenutniKraj && trenutniKraj < noviPocetak
          ? noviPocetak
          : filters.krajSezone,
    });
  };

  const handleKrajChange = (e) => {
    const val = e.target.value;
    setFilters({
      ...filters,
      krajSezone: val === "" ? "" : Number(val),
    });
  };
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isFilterModalOpen && drzave.length === 0) {
      getDrzaveNazivi()
        .then((data) => setDrzave(data))
        .catch((err) =>
          console.error("Greška pri učitavanju država:", err.message),
        );
    }
  }, [isFilterModalOpen, drzave.length]);

  useEffect(() => {
    if (filters.drzavaId) {
      setLoadingGradovi(true);

      getDrzavaById(filters.drzavaId)
        .then((drzava) => {
          setGradovi(drzava.gradovi || []);
          setLoadingGradovi(false);
        })
        .catch((err) => {
          console.error("Greška pri učitavanju gradova:", err);
          setGradovi([]);
          setLoadingGradovi(false);
        });
    } else {
      setGradovi([]);
    }
  }, [filters.drzavaId]);

  const handleDrzavaChange = (e) => {
    const selectedDrzavaId = e.target.value;
    setFilters({
      ...filters,
      drzavaId: selectedDrzavaId,
      gradId: "",
    });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (onSearch) {
      onSearch(query, filters);
    }
  };

  const handleApplyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(filters, searchQuery);
    }
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    const resetValues = {
      drzavaId: "",
      gradId: "",
      kategorija: "sve",
      minCena: "",
      maxCena: "",
      minOcena: "0",
      pocetakSezone: "",
      krajSezone: "",
    };
    setSearchQuery("");
    setFilters(resetValues);
    setGradovi([]);
    if (onApplyFilters) {
      onApplyFilters(resetValues, "");
    }
    setIsFilterModalOpen(false);
  };
  const role = user?.userRole;
  return (
    <header style={styles.header}>
      {/*LEVA SEKCIJA: Logo */}
      <div style={styles.leftSection}>
        <div
          style={styles.logo}
          onClick={() => {
            if (role == "Turista") {
              handleResetFilters();
            }
            if (onNavigate) onNavigate("home");
          }}
        >
          {role == "Administrator" ? "🛡️ Admin Panel" : "🗺️ Destinacije"}
        </div>
      </div>

      {/*SREDNJA SEKCIJA: Pretraga + Filteri */}
      {role == "Turista" && (
        <div style={styles.centerSection}>
          <div style={styles.searchContainer}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Pretraži destinacije..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={styles.searchInput}
            />
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            style={styles.filterButton}
            title="Filteri pretrage"
          >
            ⚙️ Filteri
          </button>
        </div>
      )}
      {/*DESNA SEKCIJA: Preporucene + Moje Destinacije + Profil */}
      <div style={styles.rightSection}>
        {user ? (
          <>
            {role == "Turista" && (
              <>
                <button
                  onClick={() => onNavigate && onNavigate("recommended")}
                  style={styles.navButton}
                >
                  🔥 Preporučeno
                </button>

                <button
                  onClick={() => onNavigate && onNavigate("my-reviews")}
                  style={styles.navButton}
                >
                  📍 Moje Destinacije
                </button>
              </>
            )}
            <div style={styles.profileContainer} ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={styles.profileButton}
              >
                <span>👤</span>
                <span>{user?.ime || user?.userName || "Profil"}</span>
                <span style={{ fontSize: "10px", marginLeft: "4px" }}>▼</span>
              </button>

              {isDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onNavigate) onNavigate("profile");
                    }}
                    style={styles.dropdownItem}
                  >
                    ✏️️ Izmeni profil
                  </button>
                  <hr style={styles.divider} />
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    style={{ ...styles.dropdownItem, color: "#dc3545" }}
                  >
                    🚪 Odjavi se
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => onNavigate && onNavigate("login")}
            style={styles.loginButton}
          >
            🔑 Prijavi se
          </button>
        )}
      </div>

      {/*Modal za Filteri */}
      {isFilterModalOpen && role == "Turista" && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Filteri pretrage</h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {/*FILTER: Država */}
              <div style={styles.filterGroup}>
                <label style={styles.label}>Država:</label>
                <select
                  value={filters.drzavaId}
                  onChange={handleDrzavaChange}
                  style={styles.selectInput}
                >
                  <option value="">Sve države</option>
                  {drzave.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.naziv}
                    </option>
                  ))}
                </select>
              </div>
              {/*FILTER: Grad*/}
              <div style={styles.filterGroup}>
                <label style={styles.label}>Grad:</label>
                <select
                  value={filters.gradId}
                  onChange={(e) =>
                    setFilters({ ...filters, gradId: e.target.value })
                  }
                  disabled={!filters.drzavaId || loadingGradovi}
                  style={{
                    ...styles.selectInput,
                    backgroundColor: !filters.drzavaId ? "#f2f2f2" : "#fff",
                    cursor: !filters.drzavaId ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">
                    {!filters.drzavaId
                      ? "-- Prvo izaberite državu --"
                      : loadingGradovi
                        ? "Učitavanje gradova..."
                        : "Svi gradovi"}
                  </option>
                  {gradovi.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.naziv}
                    </option>
                  ))}
                </select>
              </div>
              {/*FILTER: Tip destinacije */}
              <div style={styles.filterGroup}>
                <label style={styles.label}>Tip destinacije:</label>
                <select
                  value={filters.kategorija}
                  onChange={(e) =>
                    setFilters({ ...filters, kategorija: e.target.value })
                  }
                  style={styles.selectInput}
                >
                  <option value="">Sve kategorije</option>
                  <option value="Grad">Grad</option>
                  <option value="Plaza">Plaža</option>
                  <option value="Planina">Planina</option>
                  <option value="KulturnaDestinacija">
                    Kulturna destinacija
                  </option>
                  <option value="PrirodnaAtrakcija">Prirodna atrakcija</option>
                  <option value="AvanturistickaDestinacija">
                    Avanturistička destinacija
                  </option>
                </select>
              </div>{" "}
              {/* FILTER: Sezona */}
              <div style={styles.filterGroup}>
                <label style={styles.label}>Sezona :</label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <select
                    value={filters.pocetakSezone ?? ""}
                    onChange={handlePocetakChange}
                    style={{ ...styles.selectInput, width: "100%" }}
                  >
                    <option value="">Odaberite mesec</option>
                    {meseci.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <span>-</span>

                  <select
                    value={filters.krajSezone ?? ""}
                    onChange={handleKrajChange}
                    style={{ ...styles.selectInput, width: "100%" }}
                  >
                    <option value="">Odaberite mesec</option>
                    {meseci
                      .filter((m) => !pocetakVal || m.value >= pocetakVal)
                      .map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              {/* FILTER: Cenovni rang */}
              <div style={styles.filterGroup}>
                <label style={styles.label}>Cenovni rang (€):</label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="number"
                    min="1"
                    placeholder="Min"
                    value={filters.minCena}
                    onChange={(e) =>
                      setFilters({ ...filters, minCena: e.target.value })
                    }
                    style={{ ...styles.selectInput, width: "100%" }}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Max"
                    value={filters.maxCena}
                    onChange={(e) =>
                      setFilters({ ...filters, maxCena: e.target.value })
                    }
                    style={{ ...styles.selectInput, width: "100%" }}
                  />
                </div>
              </div>
              {/* FILTER: Minimalna ocena */}
              <div style={styles.filterGroup}>
                <label style={styles.label}>
                  Minimalna ocena (★ {filters.minOcena}+):
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={filters.minOcena}
                  onChange={(e) =>
                    setFilters({ ...filters, minOcena: e.target.value })
                  }
                  style={{ width: "100%", cursor: "pointer" }}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={handleResetFilters} style={styles.resetButton}>
                Poništi
              </button>
              <button onClick={handleApplyFilters} style={styles.applyButton}>
                Primeni filtere
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#23c084",
    padding: "10px 24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    width: "100%",
    boxSizing: "border-box",
  },
  leftSection: {
    flex: "1 1 0px",
    display: "flex",
    justifyContent: "flex-start",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#ffffff",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  centerSection: {
    flex: "2 1 0px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    maxWidth: "550px",
  },
  searchContainer: {
    position: "relative",
    width: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    color: "#888",
  },
  searchInput: {
    width: "100%",
    padding: "8px 14px 8px 36px",
    borderRadius: "20px",
    border: "1px solid #ffffff",
    backgroundColor: "#ffffff",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  filterButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "#1b9b6a",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "13px",
    whiteSpace: "nowrap",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  rightSection: {
    flex: "1 1 0px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },
  profileContainer: {
    position: "relative",
  },
  profileButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },
  loginButton: {
    backgroundColor: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: "115%",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    width: "160px",
    overflow: "hidden",
    zIndex: 1001,
  },
  dropdownItem: {
    width: "100%",
    padding: "10px 14px",
    textAlign: "left",
    background: "none",
    border: "none",
    fontSize: "14px",
    color: "#333",
    cursor: "pointer",
  },
  divider: {
    border: 0,
    borderTop: "1px solid #eee",
    margin: 0,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "420px",
    padding: "20px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#888",
    cursor: "pointer",
  },
  modalBody: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#444",
  },
  selectInput: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
    paddingTop: "10px",
    borderTop: "1px solid #eee",
  },
  resetButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    color: "#555",
    cursor: "pointer",
  },
  applyButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
