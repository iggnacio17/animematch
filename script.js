const collectionKey = "animeCollection";
let currentCharacter = null;

// 🌙 Theme
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
  if (location.pathname.includes("collection")) updateCollectionView();
});

// 📦 Storage
function loadCollection() {
  const saved = localStorage.getItem(collectionKey);
  return saved ? JSON.parse(saved) : [];
}

function saveCollection(collection) {
  localStorage.setItem(collectionKey, JSON.stringify(collection));
}

function saveToCollection(character, animeName) {
  const collection = loadCollection();
  const exists = collection.some(c => c.mal_id === character.mal_id);
  if (!exists) {
    collection.push({
      mal_id: character.mal_id,
      name: character.name,
      image: character.images.jpg.image_url,
      anime: animeName,
      favorite: false
    });
    saveCollection(collection);
  }
}

// 🎴 Personaje aleatorio
async function getRandomCharacter() {
  const collection = loadCollection();
  const seenIds = collection.map(c => c.mal_id);
  let tries = 0;

  while (tries < 50) {
    const randomId = Math.floor(Math.random() * 20000) + 1;
    if (seenIds.includes(randomId)) {
      tries++;
      continue;
    }

    try {
      const res = await fetch(`https://api.jikan.moe/v4/characters/${randomId}/full`);
      const data = await res.json();
      const char = data.data;
      if (!char || !char.name || !char.images) throw new Error();

      const animeName = char.anime?.[0]?.anime?.title || "Anime desconocido";

      currentCharacter = char;

      document.getElementById("character-image").src = char.images.jpg.image_url;
      document.getElementById("character-name").textContent = char.name;
      document.getElementById("anime-source").textContent = `Anime: ${animeName}`;
      updateFavoriteButton();

      saveToCollection(char, animeName);
      return;

    } catch {
      tries++;
    }
  }

  alert("No se pudo encontrar un personaje nuevo. Intenta de nuevo.");
}

// 💖 Favoritos
function updateFavoriteButton() {
  const collection = loadCollection();
  const found = collection.find(c => c.mal_id === currentCharacter.mal_id);
  const btn = document.getElementById("favorite-btn");
  btn.textContent = found?.favorite ? "💖 Quitar de Favoritos" : "🤍 Marcar como Favorito";
}

function toggleFavorite() {
  const collection = loadCollection();
  const index = collection.findIndex(c => c.mal_id === currentCharacter.mal_id);
  if (index !== -1) {
    collection[index].favorite = !collection[index].favorite;
    saveCollection(collection);
    updateFavoriteButton();
  }
}

// 📚 Colección
function updateCollectionView() {
  const grid = document.getElementById("collection-grid");
  grid.innerHTML = "";
  const collection = loadCollection();

  collection.forEach(char => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${char.image}" alt="${char.name}">
      <div class="card-name">${char.name}</div>
      <small>${char.anime}</small>
      <button class="favorite-btn" onclick="toggleFavoriteInCollection(${char.mal_id})">
        ${char.favorite ? "💖" : "🤍"}
      </button>
    `;
    grid.appendChild(card);
  });
}

function toggleFavoriteInCollection(mal_id) {
  const collection = loadCollection();
  const index = collection.findIndex(c => c.mal_id === mal_id);
  if (index !== -1) {
    collection[index].favorite = !collection[index].favorite;
    saveCollection(collection);
    updateCollectionView();
  }
}

// 🗑️ Borrar todo
function clearCollection() {
  if (confirm("¿Borrar toda tu colección?")) {
    localStorage.removeItem(collectionKey);
    updateCollectionView();
  }
}
