import { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../api_config.jsx";
export default function UrediProfil({ user, onUpdateUser }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    ime: user?.ime || "",
    prezime: user?.prezime || "",
    godinaRodjenja: user?.godinaRodjenja || "",
    email: user?.email || "",
    staraLozinka: "",
    novaLozinka: "",
  });
  const [userRole, setUserRole] = useState(user.userRole);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setFetching(false);
        return;
      }

      try {
        const profileData = await getUserProfile();

        setFormData(profileData);
        const updatedUser = {
          ime: formData.ime,
          email: formData.email,
          userRole: userRole,
        };

        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
      } catch (err) {
        console.error("Greška pri dohvaćanju profila:", err.message);
      } finally {
        setFetching(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (formData.novaLozinka && !formData.staraLozinka) {
      setMessage({
        type: "error",
        text: "Morate uneti trenutnu lozinku da biste je promenili.",
      });
      return;
    }

    setLoading(true);
    const payload = {
      ime: formData.ime,
      prezime: formData.prezime,
      godinaRodjenja: Number(formData.godinaRodjenja),
      ...(formData.novaLozinka
        ? {
            staraLozinka: formData.staraLozinka,
            novaLozinka: formData.novaLozinka,
          }
        : {}),
    };

    try {
      await updateUserProfile(payload);
      const updatedUser = {
        ime: formData.ime,
        email: formData.email,
        userRole: userRole,
      };

      if (onUpdateUser) onUpdateUser(updatedUser);

      setMessage({ type: "success", text: "Profil je uspešno ažuriran!" });
      setFormData((prev) => ({ ...prev, staraLozinka: "", novaLozinka: "" }));
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        Učitavanje podataka profila...
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>✏️ Uređivanje Profila</h2>

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
        {/* Korisnicko ime (Disabled) */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Korisničko ime:</label>
          <input
            type="text"
            value={formData.username}
            disabled
            style={{ ...styles.input, ...styles.disabledInput }}
          />
        </div>

        {/* Email (Disabled) */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email:</label>
          <input
            type="email"
            value={formData.email}
            disabled
            style={{ ...styles.input, ...styles.disabledInput }}
          />
        </div>

        {/* Ime */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Ime:</label>
          <input
            type="text"
            value={formData.ime}
            onChange={(e) => setFormData({ ...formData, ime: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        {/* Prezime */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Prezime:</label>
          <input
            type="text"
            value={formData.prezime}
            onChange={(e) =>
              setFormData({ ...formData, prezime: e.target.value })
            }
            style={styles.input}
            required
          />
        </div>

        {/* Godine */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Godina rođenja:</label>
          <input
            type="number"
            min="1"
            value={formData.godinaRodjenja}
            onChange={(e) =>
              setFormData({ ...formData, godinaRodjenja: e.target.value })
            }
            style={styles.input}
            required
          />
        </div>

        <hr style={styles.divider} />
        <span style={styles.sectionTitle}>Promena lozinke (opciono)</span>

        {/* Trenutna Lozinka */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Trenutna Lozinka:</label>
          <input
            type="password"
            placeholder="Unesite trenutnu lozinku"
            value={formData.staraLozinka}
            onChange={(e) =>
              setFormData({ ...formData, staraLozinka: e.target.value })
            }
            style={styles.input}
          />
        </div>

        {/* Nova Lozinka */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nova Lozinka:</label>
          <input
            type="password"
            placeholder="Unesite novu lozinku"
            value={formData.novaLozinka}
            onChange={(e) =>
              setFormData({ ...formData, novaLozinka: e.target.value })
            }
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.submitButton}>
          {loading ? "Spremanje..." : "Sačuvaj izmene"}
        </button>
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
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  title: {
    marginBottom: "20px",
    color: "#2c3e50",
    fontSize: "22px",
    textAlign: "center",
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
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#444",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  },
  disabledInput: {
    backgroundColor: "#e9ecef",
    color: "#6c757d",
    cursor: "not-allowed",
  },
  divider: {
    border: "none",
    borderTop: "1px solid #eee",
    margin: "10px 0 0 0",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  submitButton: {
    padding: "12px",
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "10px",
  },
  successAlert: {
    padding: "10px 14px",
    backgroundColor: "#d4edda",
    color: "#155724",
    borderRadius: "6px",
    marginBottom: "15px",
    fontSize: "14px",
  },
  errorAlert: {
    padding: "10px 14px",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    borderRadius: "6px",
    marginBottom: "15px",
    fontSize: "14px",
  },
};
