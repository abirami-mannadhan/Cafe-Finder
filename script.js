// ===============================
// OPEN STREET MAP CAFE FINDER (No Google Cloud)
// ===============================

// DOM elements
const searchInput = document.getElementById("searchInput");
const cafesGrid = document.getElementById("cafesGrid");
const searchBtn = document.querySelector(".search-btn");

// ===============================
// INITIALIZE
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    renderWelcomeState();
    setupEventListeners();
});

// ===============================
// EVENT LISTENERS
// ===============================
function setupEventListeners() {
    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
    });
}

// ===============================
// HANDLE SEARCH (City or Use My Location)
// ===============================
async function handleSearch() {
    const location = searchInput.value.trim();

    if (location) {
        // User typed a place
        cafesGrid.innerHTML = `<div class="loading"><div class="spinner"></div><p>Finding cafes near <strong>${location}</strong>...</p></div>`;
        const coords = await getCoordinatesFromName(location);
        if (coords) {
            fetchCafes(coords.lat, coords.lon);
        } else {
            renderError("Could not find that location. Try another city or area.");
        }
    } else {
        // Use device location
        cafesGrid.innerHTML = `<div class="loading"><div class="spinner"></div><p>Getting your current location...</p></div>`;
        getUserLocation();
    }
}

// ===============================
// GET USER LOCATION (Geolocation API)
// ===============================
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                fetchCafes(lat, lon);
            },
            (err) => {
                console.error(err);
                renderError("Location access denied. Please enter a city name instead.");
            }
        );
    } else {
        renderError("Geolocation not supported by your browser.");
    }
}

// ===============================
// GEOCODING (Place name → coordinates)
// ===============================
async function getCoordinatesFromName(placeName) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.length > 0) {
            return { lat: data[0].lat, lon: data[0].lon };
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }
    return null;
}

// ===============================
// FETCH CAFES USING OVERPASS API
// ===============================
async function fetchCafes(lat, lon) {
    cafesGrid.innerHTML = `<div class="loading"><div class="spinner"></div><p>Loading cafes near you...</p></div>`;

    const radius = 2000; // 2 km
    const query = `
        [out:json];
        node
          ["amenity"="cafe"]
          (around:${radius},${lat},${lon});
        out;
    `;
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
            renderCafes(data.elements);
        } else {
            renderError("No cafes found nearby.");
        }
    } catch (error) {
        console.error(error);
        renderError("Could not load cafes. Please try again.");
    }
}

// ===============================
// RENDER CAFES
// ===============================
function renderCafes(cafes) {
    cafesGrid.innerHTML = "";

    cafes.forEach((cafe, index) => {
        const name = cafe.tags.name || "Unnamed Cafe";
        const address = [
            cafe.tags["addr:street"] || "",
            cafe.tags["addr:city"] || "",
        ].filter(Boolean).join(", ");

        const card = document.createElement("div");
        card.className = "cafe-card glass-card";
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <img src="https://source.unsplash.com/400x250/?coffee,cafe" class="cafe-image" alt="${name}">
            <div class="cafe-content">
                <div class="cafe-header">
                    <div>
                        <h3 class="cafe-name">${name}</h3>
                        <p class="cafe-tagline">${address || "Address unavailable"}</p>
                    </div>
                    <span class="cafe-badge">☕ OpenStreetMap</span>
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            window.open(`https://www.openstreetmap.org/?mlat=${cafe.lat}&mlon=${cafe.lon}#map=18/${cafe.lat}/${cafe.lon}`, "_blank");
        });

        cafesGrid.appendChild(card);
    });
}

// ===============================
// RENDER EMPTY / ERROR / WELCOME STATES
// ===============================
function renderError(msg) {
    cafesGrid.innerHTML = `
        <div class="empty-state">
            <div style="font-size:3rem;">☕</div>
            <h3>${msg}</h3>
        </div>
    `;
}

function renderWelcomeState() {
    cafesGrid.innerHTML = `
        <div class="empty-state">
            <div style="font-size:3rem;">☕</div>
            <h3>Welcome to Cafe Finder</h3>
            <p>Enter a city name or click search to use your location!</p>
        </div>
    `;
}
