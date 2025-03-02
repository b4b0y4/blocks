const dom = {
  root: document.documentElement,
  theme: document.getElementById("theme"),
  instruction: document.querySelector(".instruction"),
  rpcUrlInput: document.getElementById("rpcUrl"),
  loopInput: document.getElementById("loopInput"),
  dropMenu: document.getElementById("dropMenu"),
  frame: document.getElementById("frame"),
  infobar: document.querySelector(".infobar"),
  info: document.getElementById("info"),
  save: document.getElementById("saveBtn"),
  dec: document.getElementById("decrementBtn"),
  inc: document.getElementById("incrementBtn"),
  favIcon: document.querySelector(".fav-icon"),
  search: document.getElementById("searchInput"),
  overlay: document.querySelector(".overlay"),
  panel: document.querySelector(".panel"),
  listPanel: document.querySelector(".list-panel"),
  favPanel: document.querySelector(".fav-panel"),
  spinner: document.querySelector(".spinner"),
  keyShort: document.querySelector(".key-short"),
  searchBox: document.querySelector(".search-box"),
  infoBox: document.getElementById("infoBox"),
  randomButton: document.getElementById("randomButton"),
  loopAll: document.getElementById("loopAll"),
  favLoop: document.getElementById("favLoop"),
  curatedLoop: document.getElementById("curatedLoop"),
  selectedLoop: document.getElementById("selectedLoop"),
  stopLoop: document.querySelector(".fa-circle-stop"),
  fullscreen: document.getElementById("fullscreen"),
  searchIcon: document.querySelector(".search-icon"),
  repeatIcon: document.querySelector(".fa-repeat"),
};

const panels = [dom.panel, dom.listPanel, dom.favPanel];

export { dom, panels };
