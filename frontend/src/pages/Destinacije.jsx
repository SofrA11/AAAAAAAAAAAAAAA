import { useState, useEffect, useCallback } from "react";
import DestinacijaInfo from "./DestinacijaInfo.jsx";
import { searchDestinations } from "../api_config.jsx";
export default function Destinacije({ searchParams }) {
  const [destinations, setDestinations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState(1);
  const itemsPerPage = 8;
  /*Izgled search param objekta:
  {
    "query": "a",
    "filters": 
    {
      "kategorija": "sve",
      "minCena": "",
      "maxCena": "",
      "minOcena": "1",
      "drzavaId": "",
      "gradId":"",
      "pocetakSezone": "",
      "krajSezone": "",
    }
  }*/

  const [selectedDestination, setSelectedDestination] = useState(null);

  const fetchDestinations = useCallback(async () => {
    try {
      let url = "";

      const queryText = searchParams?.query || "";
      const filters = searchParams?.filters || {};

      const params = new URLSearchParams();

      if (queryText.trim() !== "") {
        params.append("search", queryText.trim());
      }

      if (filters.kategorija && filters.kategorija !== "sve") {
        params.append("destinationType", filters.kategorija);
      }

      if (filters.minCena !== undefined && filters.minCena !== "") {
        params.append("priceMin", filters.minCena);
      }

      if (filters.maxCena !== undefined && filters.maxCena !== "") {
        params.append("priceMax", filters.maxCena);
      }

      if (filters.minOcena !== undefined && filters.minOcena !== "") {
        params.append("minRating", filters.minOcena);
      }

      if (filters.drzavaId !== undefined && filters.drzavaId !== "") {
        params.append("drzavaId", filters.drzavaId);
      }

      if (filters.gradId !== undefined && filters.gradId !== "") {
        params.append("gradId", filters.gradId);
      }

      if (filters.pocetakSezone != null && filters.pocetakSezone != 0) {
        params.append("pocetakSezone", filters.pocetakSezone);
      }

      if (filters.krajSezone != null && filters.krajSezone != 0) {
        params.append("krajSezone", filters.krajSezone);
      }

      params.append("page", currentPage);
      params.append("limit", itemsPerPage);

      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const responseData = await searchDestinations(params, headers);
      setDestinations(responseData.data);

      setTotalPages(responseData.pagination?.totalPages);
    } catch (error) {
      console.error("Greška pri učitavanju destinacija:", error);
    }
  }, [currentPage, searchParams]);

  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const handleBackToList = () => {
    setSelectedDestination(null);
    fetchDestinations();
  };

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const pageNumber = parseInt(pageInput, 10);

    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      setPageInput(currentPage);
    }
  };

  if (selectedDestination) {
    return (
      <DestinacijaInfo
        destination={selectedDestination}
        destinationId={selectedDestination.id || selectedDestination.Id}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Rezultati pretrage:</h2>

      {/* Grid sa karticama */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {destinations.length > 0 ? (
          destinations.map((dest) => {
            const id = dest.Id || dest.id;
            const name = dest.Name || dest.name;
            const imageUrl = dest.ImageUrl || dest.imageUrl;
            const description = dest.Description || dest.description;
            const rating = dest.AverageRating ?? dest.averageRating ?? 0;

            return (
              <div
                key={id}
                onClick={() => setSelectedDestination(dest)}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={name}
                    style={{
                      width: "100%",
                      height: "160px",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div
                  style={{
                    padding: "15px",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 10px 0" }}>{name}</h3>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        margin: "0 0 10px 0",
                      }}
                    >
                      {description
                        ? description.substring(0, 90) + "..."
                        : "Bez opisa"}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "bold", color: "#ffb400" }}>
                      ★ {Number(rating).toFixed(1)}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#23c084",
                        fontWeight: "bold",
                      }}
                    >
                      Detaljnije →
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>Nema pronađenih destinacija.</p>
        )}
      </div>

      {/* Kontrole za Paginaciju */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "15px",
            marginTop: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: "8px 16px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              « Prva
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 16px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              Prethodna
            </button>

            <span style={{ fontWeight: "500" }}>
              Stranica {currentPage} od {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 16px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Sledeća
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 16px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Poslednja »
            </button>
          </div>

          <form
            onSubmit={handlePageSubmit}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <label htmlFor="page-input" style={{ fontSize: "14px" }}>
              Idi na stranicu:
            </label>
            <input
              id="page-input"
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              style={{
                width: "60px",
                padding: "6px 8px",
                textAlign: "center",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <button
              type="submit"
              style={{ padding: "6px 12px", cursor: "pointer" }}
            >
              Idi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
