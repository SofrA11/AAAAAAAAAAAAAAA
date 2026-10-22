import { useState, useEffect, use } from "react";
import Register from "./components/Registracija";
import Login from "./components/Prijavljivanje";
import TopBar from "./components/TopBar";
import UrediProfil from "./pages/UrediProfil.jsx";
import Destinacije from "./pages/Destinacije.jsx";
import MojeDestinacije from "./pages/MojeDestinacije.jsx";
import PreporuceneDestinacije from "./pages/Preporuke.jsx";
import AdminControlPanel from "./components/AdminControlPanel.jsx";
import { jwtDecode } from "jwt-decode";

function isTokenValid(token) {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
}
export default function App() {
  const [user, setUser] = useState(null);
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState("home");
  const [searchParams, setSearchParams] = useState({
    query: "",
    filters: {
      kategorija: "sve",
      minCena: "",
      maxCena: "",
      minOcena: "0",
      drzavaId: "",
      gradId: "",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (isTokenValid(token) && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(savedUser);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentView("home");
  };

  if (user) {
    const role = user.userRole;
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: "#f4f6f8",
        }}
      >
        <TopBar
          user={user}
          onNavigate={(view) => setCurrentView(view)}
          onLogout={handleLogout}
          onSearch={(query, currentFilters) => {
            setSearchParams({
              query: query,
              filters: currentFilters,
            });
            setCurrentView("home");
          }}
          onApplyFilters={(appliedFilters, currentQuery) => {
            setSearchParams({
              query: currentQuery,
              filters: appliedFilters,
            });
            setCurrentView("home");
          }}
        />

        <main
          style={{
            maxWidth: "1200px",
            margin: "30px auto",
            padding: "0 20px",
          }}
        >
          {/* 1. Ako je otvoren profil, prikaži profil za sve */}
          {currentView === "profile" ? (
            <UrediProfil
              user={user}
              onUpdateUser={(updatedUser) => setUser(updatedUser)}
            />
          ) : role === "Turista" ? (
            /* 2. Prikaz za turistu */
            <>
              {currentView === "home" && (
                <Destinacije searchParams={searchParams} />
              )}
              {currentView === "recommended" && <PreporuceneDestinacije />}
              {currentView === "my-reviews" && (
                <MojeDestinacije onSelectDestination={(destinacija) => {}} />
              )}
            </>
          ) : role === "Administrator" ? (
            /* 3. Prikaz za administratora */
            <>{currentView === "home" && <AdminControlPanel />}</>
          ) : null}
        </main>
      </div>
    );
  }

  // 2. Ako korisnik NIJE ulogovan
  return (
    <div>
      {isRegisterView ? (
        <div>
          <Register
            key="register-view"
            onRegisterSuccess={() => setIsRegisterView(false)}
            onSwitchToLogin={() => setIsRegisterView(false)}
          />
        </div>
      ) : (
        <Login
          key="login-view"
          onLoginSuccess={(userData) => setUser(userData)}
          onSwitchToRegister={() => setIsRegisterView(true)}
        />
      )}
    </div>
  );
}
