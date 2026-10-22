import { useState } from "react";
import { loginUser } from "../api_config.jsx";
import landscape from "../assets/Landscape.jpg";

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [loginCredentials, setLoginCredentials] = useState({
    email: "",
    lozinka: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(loginCredentials);
      if (data && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        setError("Сервер није вратио исправне податке.");
      }
    } catch (err) {
      console.error("Грешка при пријави:", err);
      setError(err.message || "Дошло је до грешке приликом пријаве.");
    } finally {
      setLoading(false);
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
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Prijava</h2>

        {error && (
          <p style={{ color: "red", textAlign: "center", fontSize: "14px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
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
              value={loginCredentials.email}
              onChange={(e) =>
                setLoginCredentials({
                  ...loginCredentials,
                  email: e.target.value,
                })
              }
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Lozinka:</label>
            <input
              type="password"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                boxSizing: "border-box",
              }}
              value={loginCredentials.lozinka}
              onChange={(e) =>
                setLoginCredentials({
                  ...loginCredentials,
                  lozinka: e.target.value,
                })
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: loading ? "#6c757d" : "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </button>
        </form>

        <p style={{ marginTop: "15px", textAlign: "center", fontSize: "14px" }}>
          Nemate nalog?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
              fontSize: "14px",
            }}
          >
            Registrujte se
          </button>
        </p>
      </div>
    </div>
  );
}
