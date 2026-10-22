import { useState } from "react";
import DodajDestinaciju from "./DodajDestinaciju";
import UrediDestinaciju from "./UrediDestinaciju";
import UkloniDestinaciju from "./UkloniDestinaciju";
import DodajDrzavu from "./DodajDrzavu";
import UkloniDrzavu from "./UkloniDrzavu";
import DodajGrad from "./DodajGrad";
import UkloniGrad from "./UkloniGrad";

export default function AdminControlPanel() {
  const [activeView, setActiveView] = useState(null);

  const actionGroups = [
    {
      categoryTitle: "🌍 Upravljanje Državama",
      actions: [
        {
          id: "addDrzava",
          title: "Dodaj Državu",
          description: "Dodajte novu državu u sistem.",
          icon: "➕",
          color: "#2563eb",
        },
        {
          id: "deleteDrzava",
          title: "Ukloni Državu",
          description: "Trajno obrišite državu i sve njene gradove.",
          icon: "🗑️",
          color: "#dc2626",
        },
      ],
    },
    {
      categoryTitle: "🏙️ Upravljanje Gradovima",
      actions: [
        {
          id: "addGrad",
          title: "Dodaj Grad",
          description: "Dodajte novi grad u sistem.",
          icon: "➕",
          color: "#2563eb",
        },
        {
          id: "deleteGrad",
          title: "Ukloni Grad",
          description: "Trajno obrišite grad iz sistema.",
          icon: "🗑️",
          color: "#dc2626",
        },
      ],
    },
    {
      categoryTitle: "✈️ Upravljanje Destinacijama",
      actions: [
        {
          id: "addDest",
          title: "Dodaj Destinaciju",
          description:
            "Kreirajte novu turističku destinaciju sa slikama i informacijama.",
          icon: "➕",
          color: "#2563eb",
        },
        {
          id: "editDest",
          title: "Uredi Destinaciju",
          description: "Ažurirajte postojeće podatke, cene, opis ili sezonu.",
          icon: "✏️",
          color: "#d97706",
        },
        {
          id: "deleteDest",
          title: "Ukloni Destinaciju",
          description:
            "Trajno obrišite destinaciju i sve njene povezane podatke.",
          icon: "🗑️",
          color: "#dc2626",
        },
      ],
    },
  ];

  return (
    <div style={styles.container}>
      {activeView === "addDest" ? (
        <DodajDestinaciju
          onCancel={() => setActiveView(null)}
          onSuccess={() => setActiveView(null)}
        />
      ) : activeView === "editDest" ? (
        <UrediDestinaciju
          onCancel={() => setActiveView(null)}
          onSuccess={() => setActiveView(null)}
        />
      ) : activeView === "deleteDest" ? (
        <UkloniDestinaciju
          onCancel={() => setActiveView(null)}
          onSuccess={() => setActiveView(null)}
        />
      ) : activeView === "addDrzava" ? (
        <DodajDrzavu
          onCancel={() => setActiveView(null)}
          onSuccess={() => setActiveView(null)}
        />
      ) : activeView === "deleteDrzava" ? (
        <UkloniDrzavu
          onCancel={() => setActiveView(null)}
          onSuccess={() => setActiveView(null)}
        />
      ) : activeView === "addGrad" ? (
        <DodajGrad
          onCancel={() => setActiveView(null)}
          onSuccess={() => setActiveView(null)}
        />
      ) : activeView === "deleteGrad" ? (
        <UkloniGrad
          onCancel={() => setActiveView(null)}
          onSuccess={() => setActiveView(null)}
        />
      ) : (
        <>
          <div style={styles.groupsContainer}>
            {actionGroups.map((group, index) => (
              <div key={index} style={styles.section}>
                <h3 style={styles.sectionTitle}>{group.categoryTitle}</h3>
                <div style={styles.grid}>
                  {group.actions.map((action) => (
                    <div
                      key={action.id}
                      style={styles.card}
                      onClick={() => setActiveView(action.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-6px)";
                        e.currentTarget.style.boxShadow =
                          "0 12px 20px -5px rgba(0, 0, 0, 0.1)";
                        e.currentTarget.style.borderColor = action.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 10px rgba(0, 0, 0, 0.04)";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                    >
                      <div
                        style={{
                          ...styles.iconContainer,
                          backgroundColor: `${action.color}15`,
                          color: action.color,
                        }}
                      >
                        <span style={{ fontSize: "24px" }}>{action.icon}</span>
                      </div>

                      <h4 style={styles.cardTitle}>{action.title}</h4>
                      <p style={styles.cardDescription}>{action.description}</p>

                      <div
                        style={{ ...styles.actionFooter, color: action.color }}
                      >
                        <span>Započni</span>
                        <span style={styles.arrow}>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
  },
  groupsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "35px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#334155",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "8px",
    margin: 0,
  },
  grid: {
    // Korišćenje auto-fill sa fiksnim min/max širinama sprečava razvlačenje
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 280px))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.04)",
    position: "relative",
    width: "280px", // Fiksna širina kartice
    height: "220px", // Fiksna visina da svaka bude identična
    boxSizing: "border-box",
  },
  iconContainer: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "650",
    color: "#0f172a",
    margin: "0 0 6px 0",
  },
  cardDescription: {
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.4",
    margin: "0 0 12px 0",
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  actionFooter: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "650",
    marginTop: "auto",
  },
  arrow: {
    fontSize: "15px",
  },
};
