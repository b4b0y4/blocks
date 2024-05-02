function calculateSettingAsThemeString({
  localStorageTheme,
  systemSettingDark,
}) {
  if (localStorageTheme !== null) {
    return localStorageTheme
  }
  if (systemSettingDark.matches) {
    return "dark"
  }
  return "light"
}

function updateThemeOnHtmlEl({ theme }) {
  document.querySelector("html").setAttribute("data-theme", theme)
}

// On page load:
const button = document.querySelector("[toggle]")
const localStorageTheme = localStorage.getItem("theme")
const systemSettingDark = window.matchMedia("(prefers-color-scheme: dark)")

let currentThemeSetting = calculateSettingAsThemeString({
  localStorageTheme,
  systemSettingDark,
})

// Set initial theme based on user preferences
updateThemeOnHtmlEl({ theme: currentThemeSetting })

// Event listener to toggle the theme
button.addEventListener("click", (event) => {
  const newTheme = currentThemeSetting === "dark" ? "light" : "dark"

  // Update theme setting in local storage
  localStorage.setItem("theme", newTheme)
  // Update theme based on new theme
  updateThemeOnHtmlEl({ theme: newTheme })

  // Update current theme setting
  currentThemeSetting = newTheme
})
