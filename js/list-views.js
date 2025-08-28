// This module is responsible for rendering the list-based views in the UI,
// specifically the main collection list and the user's favorites list.
// It also handles the logic for keyboard navigation within these lists.

let state, ui, dom;

export function init(stateModule, uiModule, domElements) {
  state = stateModule;
  ui = uiModule;
  dom = domElements;
}

// --- Main Collection List ---

export function displayList(items) {
  const listItems = items
    .map((line, index) => {
      const parts = line.split(" # ");
      const collectionAndArtist = parts[1].split(" / ");
      const collection = collectionAndArtist[0];
      const artist = collectionAndArtist[1];
      const workCount = parts[parts.length - 1];

      return `<p class="list-item ${index === state.listManager.selectedIndex ? "selected" : ""}"
               data-index="${index}">
               ${collection}
               <span>${artist} - ${workCount}</span>
            </p>`;
    })
    .join("");

  dom.listPanel.innerHTML = `<div>${listItems}</div>`;
}

export function handleKeyboardNavigation(event) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const newIndex = state.listManager.navigate(
      event.key === "ArrowUp" ? "up" : "down",
    );
    displayList(state.listManager.filteredList);

    const selectedItem = dom.listPanel.querySelector(
      `[data-index="${newIndex}"]`,
    );
    selectedItem?.scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter") {
    const selectedItem = state.listManager.getSelected();
    if (selectedItem) {
      ui.getToken(selectedItem, "");
    } else {
      const query = dom.search.value.trim();
      query === ""
        ? ui.getRandom(state.listManager.originalList)
        : ui.getToken(state.listManager.filteredList[0], query);
    }
  }
}

// --- Favorites List ---

export function pushFavoriteToStorage(id) {
  const contractData = state.getContractData();
  const key = `
    <div class="fav-item">
      ${contractData.detail[0]} #${id}
      <span>${contractData.detail[1]}</span>
    </div>`;
  state.addFavorite(key, contractData);
  ui.setDisplay();
}

export function displayFavoriteList() {
  dom.favPanel.innerHTML = "";
  const favorite = state.getFavorite();

  for (let key in favorite) {
    if (favorite.hasOwnProperty(key)) {
      const keyElement = document.createElement("p");
      keyElement.style.display = "flex";
      keyElement.style.justifyContent = "space-between";
      keyElement.style.alignItems = "center";

      const delSpan = document.createElement("span");
      delSpan.className = "delete-btn";
      delSpan.innerHTML = `<i class="fa-solid fa-xmark"></i>`;

      delSpan.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteFavoriteFromStorage(key);
      });

      keyElement.addEventListener("click", () => {
        ui.toggleSpin();
        frameFavorite(key);
        ui.clearPanels();
      });

      keyElement.insertAdjacentHTML("afterbegin", key);
      keyElement.appendChild(delSpan);
      dom.favPanel.appendChild(keyElement);
    }
  }
}

function deleteFavoriteFromStorage(key) {
  state.removeFavorite(key);
  ui.setDisplay(true);
  displayFavoriteList();
}

function frameFavorite(key) {
  state.clearDataStorage();
  const contractData = state.getFavorite()[key];
  state.setContractData(contractData);
  ui.update(...Object.values(contractData));
}
