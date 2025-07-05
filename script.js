const collectionKey = "animeCollection";
let currentCharacter = null;

function loadCollection() {
  const saved = localStorage.getItem(collectionKey);
  return saved ? JSON.parse(saved) : [];
}

function saveCollection(collection) {
  localStorage.setItem(collectionKey, JSON.stringify(collection));
}

function saveToCollection(character, animeName) {
  let collection = loadCollection();
  const index = collection.findIndex(c => c.mal_id === character.mal_id);
  if (index === -1) {
    collection.push({
      mal_id: character.mal_id,
      name: character.name,
      image: character.images.jpg.image_url,
      anime: animeName,
      favorite: false
    });
  } else {
    // Si ya existe, actualiza el anime si no está
    if (!collection[index].anime && animeName) {
      collection[index].anime = animeName;
    }
  }
  saveCollection(collection);
  updateCollectionView();
}

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
      <div style="font-size: 0.7rem;">${char.anime || "Anime desconocido"}</div>
      <button class="favorite-btn" onclick="toggleFavoriteInCollection(${char.mal_id})">
        ${char.favorite ? "💖" : "🤍"}
      </button>
    `;
    grid.appendChild(card);
  });
}

async function getRandomCharacter() {
  try {
    const randomId = Math.floor(Math.random() * 20000) + 1;
    const response = await fetch(`https://api.jikan.moe/v4/characters/${randomId}/full`);
    const data = await response.json();

    const character = data.data;
    if (!character || !character.images || !character.name) {
      getRandomCharacter(); // Reintenta si el personaje no tiene datos
      return;
    }

    const animeName = character.anime?.[0]?.anime?.title || "Anime desconocido";

    currentCharacter = character;

    document.getElementById("character-image").src = character.images.jpg.image_url;
    document.getElementById("character-name").textContent = character.name;
    document.getElementById("anime-source").textContent = `Anime: ${animeName}`;
    updateFavoriteButton(character.mal_id);

    saveToCollection(character, animeName);
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("character-name").textContent = "Error al obtener personaje.";
  }
}

function updateFavoriteButton(mal_id) {
  const collection = loadCollection();
  const found = collection.find(c => c.mal_id === mal_id);
  if (found && found.favorite) {
    document.getElementById("favorite-btn").textContent = "💖 Quitar de Favoritos";
  } else {
    document.getElementById("favorite-btn").textContent = "🤍 Marcar como Favorito";
  }
}

function toggleFavorite() {
  if (!currentCharacter) return;

  const collection = loadCollection();
  const index = collection.findIndex(c => c.mal_id === currentCharacter.mal_id);
  if (index !== -1) {
    collection[index].favorite = !collection[index].favorite;
    saveCollection(collection);
    updateCollectionView();
    updateFavoriteButton(currentCharacter.mal_id);
  }
}

function toggleFavoriteInCollection(mal_id) {
  const collection = loadCollection();
  const index = collection.findIndex(c => c.mal_id === mal_id);
  if (index !== -1) {
    collection[index].favorite = !collection[index].favorite;
    saveCollection(collection);
    updateCollectionView();
    if (currentCharacter && currentCharacter.mal_id === mal_id) {
      updateFavoriteButton(mal_id);
    }
  }
}

function clearCollection() {
  const confirmDelete = confirm("¿Estás seguro de que quieres borrar tu colección?");
  if (confirmDelete) {
    localStorage.removeItem(collectionKey);
    updateCollectionView();
  }
}

document.addEventListener("DOMContentLoaded", updateCollectionView);
