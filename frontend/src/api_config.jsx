export const API_URL = "http://100.112.185.48"; //"http://100.112.185.48"http://localhost

export const loginUser = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/api/autentifikacija/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Neuspešna prijava.");
    }

    return await response.json();
  } catch (error) {
    console.error("Greška u loginUser funkciji:", error);
    throw error;
  }
};

export const registerUser = async (payload) => {
  try {
    const response = await fetch(`${API_URL}/api/autentifikacija/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Neuspešna registracija.");
    }

    return await response.json();
  } catch (error) {
    console.error("Greška u registerUser funkciji:", error);
    throw error;
  }
};
//Vraca niz drzava i za svaki elemnt ID i Naziv
export const getDrzaveNazivi = async () => {
  try {
    const response = await fetch(`${API_URL}/api/Drzave/Nazivi`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Greška pri učitavanju država.");
    }
    const res = await response.json();
    return res;
  } catch (error) {
    console.error("Greška u getDrzaveNazivi funkciji:", error);
    throw error;
  }
};
//Vraca ID i Naziv drzave, kao i listu gradova koji se nalaze u toj drzavi
export const getDrzavaById = async (drzavaId) => {
  try {
    const response = await fetch(`${API_URL}/api/Drzave/${drzavaId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Greška sa servera: ${response.status}`);
    }
    const res = await response.json();
    return res;
  } catch (error) {
    console.error("Greška u getDrzavaById funkciji:", error);
    throw error;
  }
};

export const searchDestinations = async (params, headers = {}) => {
  try {
    const response = await fetch(
      `${API_URL}/api/Destinations/search?${params.toString()}`,
      {
        headers: {
          ...headers,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`Server je vratio status ${response.status}:`, text);
      throw new Error(text || `Server je vratio status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Greška u searchDestinations funkciji:", error);
    throw error;
  }
};

export const getUserReviews = async (email, headers = {}) => {
  try {
    const response = await fetch(
      `${API_URL}/api/Destinations/user-reviews?email=${encodeURIComponent(email)}`,
      {
        headers: {
          ...headers,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || "Greška pri dohvatanju recenzija korisnika.",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Greška u getUserReviews funkciji:", error);
    throw error;
  }
};

//Vraca objekat grad i objekat drzava sa svojim Id i nazivima
export const getGradById = async (id, headers = {}) => {
  try {
    const response = await fetch(`${API_URL}/api/Gradovi/${id}`, {
      headers: {
        ...headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Greška pri dohvatanju grada sa ID-jem: ${id}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Greška u getGradById funkciji:", error);
    throw error;
  }
};

export const getRecommendations = async (limit = 10, headers = {}) => {
  try {
    const response = await fetch(`${API_URL}/api/Preporuka?limit=${limit}`, {
      headers: {
        ...headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Server je vratio status ${response.status}:`, text);
      throw new Error(text || `Server je vratio status ${response.status}`);
    }

    const responseData = await response.json();

    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Greška u getRecommendations funkciji:", error);
    throw error;
  }
};

export const getUserProfile = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Korisnik nije autentifikovan (nedostaje token).");
  }

  try {
    const response = await fetch(`${API_URL}/api/autentifikacija/profil`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Greška pri dohvatanju profila.");
    }

    const data = await response.json();
    return {
      username: data.username || "",
      ime: data.ime || "",
      prezime: data.prezime || "",
      godinaRodjenja: data.godinaRodjenja || "",
      email: data.email || "",
      staraLozinka: "",
      novaLozinka: "",
    };
  } catch (error) {
    console.error("Greška u getUserProfile funkciji:", error);
    throw error;
  }
};

export const updateUserProfile = async (payload) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Korisnik nije autentifikovan (nedostaje token).");
  }

  try {
    const response = await fetch(
      `${API_URL}/api/autentifikacija/azuriraj-profil`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const rawText = await response.text();
    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    if (!response.ok) {
      throw new Error(
        typeof data === "string"
          ? data
          : data?.message || "Greška pri ažuriranju profila.",
      );
    }

    return data;
  } catch (error) {
    console.error("Greška u updateUserProfile funkciji:", error);
    throw error;
  }
};

export const getReviewsByDestinationId = async (
  destinationId,
  headers = {},
) => {
  try {
    const response = await fetch(
      `${API_URL}/api/Reviews/destinacija/${destinationId}`,
      {
        headers: {
          ...headers,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText ||
          `Greška pri dohvatanju recenzija (status: ${response.status})`,
      );
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Greška u getReviewsByDestinationId funkciji:", error);
    throw error;
  }
};

export const getDestinationById = async (destinationId, headers = {}) => {
  try {
    const response = await fetch(
      `${API_URL}/api/Destinations/${destinationId}`,
      {
        headers: {
          ...headers,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText ||
          `Greška pri dohvatanju destinacije (status: ${response.status})`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Greška u getDestinationById funkciji:", error);
    throw error;
  }
};

export const addReview = async ({
  userEmail,
  destinationId,
  rating,
  comment,
}) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/api/Reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        email: userEmail,
        destinacijaId: Number(destinationId),
        ocena: Number(rating),
        komentar: comment.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
          "Greška pri dodavanju ocene. Proverite da li ste prijavljeni.",
      );
    }

    return await response.json().catch(() => ({}));
  } catch (error) {
    console.error("Greška u addReview funkciji:", error);
    throw error;
  }
};

export const toggleLike = async ({ reviewId, email, liked }) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/api/Likes/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        reviewId: Number(reviewId),
        email: String(email),
        liked: Boolean(liked),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Greška pri promeni lajka (status: ${response.status})`,
      );
    }

    return await response.json().catch(() => ({}));
  } catch (error) {
    console.error("Greška u toggleLike funkciji:", error);
    throw error;
  }
};
// Funkcija za kreiranje nove destinacije (šalje POST zahtev ka backend-u)
export async function postDestination(destinacijaData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/Destinations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Šaljemo JWT token sa administrator ulogom
    },
    body: JSON.stringify(destinacijaData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Došlo je do greške prilikom kreiranja destinacije.",
    );
  }

  // Vraća kreiranu destinaciju sa servera (uključujući generisani Id)
  return await response.json();
}
// Funkcija za ažuriranje postojeće destinacije (šalje PUT zahtev ka backend-u)
export async function putDestination(id, destinacijaData) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/api/Destinations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(destinacijaData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("DETALJI GREŠKE SA BEKENDA:", errorData);
    throw new Error(
      errorData.message || "Došlo je do greške prilikom izmene destinacije.",
    );
  }

  // Pošto endpoint vraća NoContent (204), proveravamo status i vraćamo true ako je uspešno
  return response.status === 204 ? true : await response.json();
}
// Brisanje destinacije (DELETE)
export async function deleteDestination(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/Destinations/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Greška pri brisanju destinacije.");
  }

  return response.status === 204 ? true : await response.json();
}
export const postDrzava = async (data) => {
  const response = await fetch(`${API_URL}/api/Drzave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Neuspešno dodavanje države.");
  }
  return response.json();
};
export const deleteDrzava = async (id) => {
  const response = await fetch(`${API_URL}/api/Drzave/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Neuspešno brisanje države.");
  }
  // Ukoliko API vraća prazan odgovor (204 No Content), preskočite .json()
  return response.status !== 204 ? response.json() : null;
};
export const postGrad = async (data) => {
  const response = await fetch(`${API_URL}/api/Gradovi`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Neuspešno dodavanje grada.");
  }
  return response.json();
};
export const deleteGrad = async (id) => {
  const response = await fetch(`${API_URL}/api/gradovi/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Neuspešno brisanje grada.");
  }
  return response.status !== 204 ? response.json() : null;
};
