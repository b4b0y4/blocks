// Utility functions for UI operations.
// Pure helper functions that can be reused across different UI components.

import { libs } from "../config/lists.js";

// Shortens a long token ID for cleaner display.
export function shortId(tokenId) {
  return tokenId < 1000000
    ? tokenId
    : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0;
}

// Shortens an Ethereum address for cleaner display (e.g., 0x123...456).
export function shortAddr(address) {
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4,
  )}`;
}

// Creates the "X / Y Minted" text for the info panel.
export function editionTxt(edition, minted) {
  return edition - minted > 0
    ? `${minted} / ${edition} Minted`
    : `${edition} Work${edition > 1 ? "s" : ""}`;
}

// A utility to create a labeled section in the info panel.
export function createSection(title, content) {
  return content
    ? `<div class="section">
         <p class="more">
           ${title} <br>
           ${content}
         </p>
       </div>`
    : "";
}

// Extracts the domain name from a URL for display.
export function extractDomain(url) {
  const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)(\/.*)?/);
  return match ? `${match[1]}${match[2] || ""}` : `${url}`;
}

// Gets the full library version string (e.g., "p5@1.4.0").
export function getLibVersion(extLib) {
  return (
    Object.keys(libs).find((key) =>
      key.startsWith(extLib.replace(/js$/, "") + "@"),
    ) || extLib
  );
}

// Copies the given text to the user's clipboard.
export function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}
