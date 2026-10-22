import { useState } from "react";
import { registerUser } from "../api_config.jsx";
import landscape from "../assets/Landscape.jpg";

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [isLogin, setIsLogin] = useState(false); //false = Registracija, true = Prijava

  const [formData, setFormData] = useState({
    ime: "",
    prezime: "",
    godine: "",
    korisnickoIme: "",
    email: "",
    lozinka: "",
    potvrdaLozinke: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isLogin) {
      try {
        // await loginUser({ korisnickoIme: formData.korisnickoIme, lozinka: formData.lozinka });
        if (onLoginSuccess) onLoginSuccess();
      } catch (err) {
        setError(err.message || "Грешка приликом пријаве.");
      }
    } else {
      if (formData.lozinka !== formData.potvrdaLozinke) {
        setError("Лозинке се не поклапају!");
        return;
      }

      const payload = {
        ime: formData.ime,
        prezime: formData.prezime,
        godine: Number(formData.godine),
        korisnickoIme: formData.korisnickoIme,
        email: formData.email,
        lozinka: formData.lozinka,
      };

      try {
        await registerUser(payload);
        setSuccess("Успешно сте се регистровали! Можете се пријавити.");
        if (onRegisterSuccess) onRegisterSuccess();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `url(${landscape})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "25px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          {isLogin ? "Prijava" : "Registracija"}
        </h2>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        {success && (
          <p style={{ color: "green", textAlign: "center" }}>{success}</p>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: "10px" }}>
                <label>Ime:</label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    boxSizing: "border-box",
                  }}
                  value={formData.ime}
                  onChange={(e) =>
                    setFormData({ ...formData, ime: e.target.value })
                  }
                  required
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Prezime:</label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    boxSizing: "border-box",
                  }}
                  value={formData.prezime}
                  onChange={(e) =>
                    setFormData({ ...formData, prezime: e.target.value })
                  }
                  required
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Godina rođenja:</label>
                <input
                  type="number"
                  min="1900"
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    boxSizing: "border-box",
                  }}
                  value={formData.godine}
                  onChange={(e) =>
                    setFormData({ ...formData, godine: e.target.value })
                  }
                  required
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>Email:</label>
                <input
                  type="email"
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    boxSizing: "border-box",
                  }}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: "10px" }}>
            <label>Korisničko Ime:</label>
            <input
              type="text"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
              value={formData.korisnickoIme}
              onChange={(e) =>
                setFormData({ ...formData, korisnickoIme: e.target.value })
              }
              required
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>Lozinka:</label>
            <input
              type="password"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
              value={formData.lozinka}
              onChange={(e) =>
                setFormData({ ...formData, lozinka: e.target.value })
              }
              required
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: "15px" }}>
              <label>Potvrdi lozinku:</label>
              <input
                type="password"
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "5px",
                  boxSizing: "border-box",
                }}
                value={formData.potvrdaLozinke}
                onChange={(e) =>
                  setFormData({ ...formData, potvrdaLozinke: e.target.value })
                }
                required
              />
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            {isLogin ? "Prijavi se" : "Registruj se"}
          </button>
        </form>

        <div
          style={{ marginTop: "15px", textAlign: "center", fontSize: "14px" }}
        >
          <span>{isLogin ? "Nemate nalog? " : "Već imate nalog? "}</span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
              fontSize: "14px",
            }}
          >
            {isLogin ? "Registrujte se" : "Prijavite se"}
          </button>
        </div>
      </div>
    </div>
  );
}
