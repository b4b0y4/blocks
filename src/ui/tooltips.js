// This module handles the display of tooltips for various UI elements.

// Module-level variables to hold DOM references and the tooltip timeout ID.
let dom;
let tooltipTimeout = null;

// A mapping of DOM element keys to their corresponding tooltip text.
const tooltipTexts = {
  info: "More Info",
  settings: "Instructions",
  save: "Save Current Artwork",
  repeatIcon: "Loop Through Artworks",
  stopLoop: "Stop Loop",
  dec: "Previous Artwork",
  inc: "Next Artwork",
  explore: "Explore Algo",
  randomButton: "Random Artwork",
  searchIcon: "Search Collections",
  favIcon: "Favorites",
};

// Initializes the tooltip module.
// It attaches mouseenter, mouseleave, and click event listeners to all elements
// that have a defined tooltip.
export function init(domElements) {
  dom = domElements;
  Object.entries(tooltipTexts).forEach(([key, text]) => {
    const element = dom[key];
    if (element) {
      element.addEventListener("mouseenter", () => showTooltip(element, text));
      element.addEventListener("mouseleave", hideTooltip);
      element.addEventListener("click", hideTooltip);
    }
  });
}

// Displays a tooltip for a given element after a short delay.
// It calculates the optimal position for the tooltip to avoid screen edges.
function showTooltip(element, text) {
  // Clear any existing timeout to prevent multiple tooltips from appearing.
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }

  // Set a timeout to delay the tooltip's appearance.
  tooltipTimeout = setTimeout(() => {
    const rect = element.getBoundingClientRect();
    const infobarRect = dom.infobar.getBoundingClientRect();

    dom.tooltip.textContent = text;

    // Center the tooltip horizontally relative to the element.
    let leftPos = rect.left + rect.width / 2;

    // Hide the tooltip initially to calculate its width without a screen flash.
    dom.tooltip.style.visibility = "hidden";
    dom.tooltip.classList.add("active");

    // Ensure the tooltip does not overflow the viewport.
    const tooltipRect = dom.tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const minLeft = 10 + tooltipWidth / 2;
    const maxLeft = window.innerWidth - 10 - tooltipWidth / 2;
    leftPos = Math.max(minLeft, Math.min(maxLeft, leftPos));

    // Position the tooltip above the infobar.
    dom.tooltip.style.left = `${leftPos}px`;
    dom.tooltip.style.bottom = `${window.innerHeight - infobarRect.top + 10}px`;
    dom.tooltip.style.color = "var(--color-btn)";
    dom.tooltip.style.transform = "translateX(-50%)";
    dom.tooltip.style.visibility = "visible"; // Make it visible after positioning.
  }, 500);
}

// Hides the tooltip and clears any pending timeout.
function hideTooltip() {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  dom.tooltip.classList.remove("active");
  dom.tooltip.style.visibility = "";
  dom.tooltip.style.opacity = "";
}
