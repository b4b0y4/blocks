// This module manages the application's color theme (light, dark, or system default).

// Module-level variables to hold references to the root element and theme buttons.
let domRoot;
let themeBtns;

// Initializes the theme manager.
// It retrieves the saved theme preference, applies it, and sets up event listeners.
export function init(root, buttons) {
  domRoot = root;
  themeBtns = buttons;

  // Retrieve and apply the user's theme preference, defaulting to "system".
  const themePreference = localStorage.getItem("themePreference") || "system";
  setTheme(themePreference);

  // Listen for changes in the operating system's color scheme.
  // If the user's preference is "system", update the theme accordingly.
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (localStorage.getItem("themePreference") === "system") {
        domRoot.classList.toggle("dark-mode", e.matches);
      }
    });

  // Add click listeners to all theme buttons to trigger a theme change.
  themeBtns.forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.theme));
  });
}

// Sets the application theme and persists the choice to localStorage.
function setTheme(themeName) {
  // Update the active state of the theme buttons in the UI.
  themeBtns.forEach((btn) =>
    btn.setAttribute("data-active", btn.dataset.theme === themeName),
  );

  // Apply the correct CSS class to the root element based on the selected theme.
  if (themeName === "system") {
    // If "system" is chosen, match the theme to the OS preference.
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    domRoot.classList.toggle("dark-mode", prefersDark);
  } else {
    // Otherwise, apply the "dark-mode" class only if the theme is "dark".
    domRoot.classList.toggle("dark-mode", themeName === "dark");
  }

  // Save the user's preference for future visits.
  localStorage.setItem("themePreference", themeName);
}
