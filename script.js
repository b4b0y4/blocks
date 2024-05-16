import { ethers } from "./ethers.min.js"
import {
  abiV1,
  abiV2,
  abiV3,
  abiEXPLORE,
  abiABXPACE,
  abiABXPACE2,
  abiABXBM,
  abiBM,
  abiBMF,
  abiCITIZEN,
  abiPLOTS,
  abiPLOTS2,
  abiSTBYS,
  abiATP,
  abiGRAILS,
  abiAOI,
  abiVCA,
  abiSDAO,
  abiMINTS,
  abiTDG,
  abiVFA,
  abiUNITLDN,
  contractAddressV1,
  contractAddressV2,
  contractAddressV3,
  contractAddressEXPLORE,
  contractAddressABXPACE,
  contractAddressABXPACE2,
  contractAddressABXBM,
  contractAddressBM,
  contractAddressBMF,
  contractAddressCITIZEN,
  contractAddressPLOTS,
  contractAddressPLOTS2,
  contractAddressSTBYS,
  contractAddressATP,
  contractAddressGRAILS,
  contractAddressAOI,
  contractAddressVCA,
  contractAddressSDAO,
  contractAddressMINTS,
  contractAddressTDG,
  contractAddressVFA,
  contractAddressUNITLDN,
} from "./contracts.js"

// DOM elements
const modeToggle = document.getElementById("modeToggle")
const root = document.documentElement
const instruction = document.querySelector(".instruction")
const rpcUrlInput = document.getElementById("rpcUrl")
const frame = document.getElementById("frame")
const infoBox = document.getElementById("infoBox")
const info = document.getElementById("info")
const overlay = document.querySelector(".overlay")
const save = document.getElementById("saveButton")
const inc = document.getElementById("incrementButton")
const dec = document.getElementById("decrementButton")
const panel = document.querySelector(".panel")
const panelContent = document.getElementById("panelContent")
const listPanel = document.querySelector(".list-panel")
const search = document.getElementById("searchInput")
const keyShort = document.querySelector(".key-short")
const spin = document.querySelector(".spinner")

// Initialize Ethereum provider
const rpcUrl = localStorage.getItem("rpcUrl")
const provider = new ethers.JsonRpcProvider(rpcUrl)

// Initialize contracts array
const contracts = [
  { abi: abiV1, address: contractAddressV1 },
  { abi: abiV2, address: contractAddressV2 },
  { abi: abiV3, address: contractAddressV3 },
  { abi: abiEXPLORE, address: contractAddressEXPLORE },
  { abi: abiABXPACE, address: contractAddressABXPACE },
  { abi: abiABXPACE2, address: contractAddressABXPACE2 },
  { abi: abiABXBM, address: contractAddressABXBM },
  { abi: abiBM, address: contractAddressBM },
  { abi: abiBMF, address: contractAddressBMF },
  { abi: abiCITIZEN, address: contractAddressCITIZEN },
  { abi: abiPLOTS, address: contractAddressPLOTS },
  { abi: abiPLOTS2, address: contractAddressPLOTS2 },
  { abi: abiSTBYS, address: contractAddressSTBYS },
  { abi: abiATP, address: contractAddressATP },
  { abi: abiGRAILS, address: contractAddressGRAILS },
  { abi: abiAOI, address: contractAddressAOI },
  { abi: abiVCA, address: contractAddressVCA },
  { abi: abiSDAO, address: contractAddressSDAO },
  { abi: abiMINTS, address: contractAddressMINTS },
  { abi: abiTDG, address: contractAddressTDG },
  { abi: abiVFA, address: contractAddressVFA },
  { abi: abiUNITLDN, address: contractAddressUNITLDN },
].map(({ abi, address }) => new ethers.Contract(address, abi, provider))

// Libraries
const predefinedLibraries = {
  p5js: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js",
  p5: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js",
  threejs: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r124/three.min.js",
  three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r124/three.min.js",
  tonejs: "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.15/Tone.js",
  tone: "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.15/Tone.js",
  paperjs:
    "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.15/paper-full.min.js",
  paper:
    "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.15/paper-full.min.js",
  processing:
    "https://cdnjs.cloudflare.com/ajax/libs/processing.js/1.4.6/processing.min.js",
  regl: "https://cdnjs.cloudflare.com/ajax/libs/regl/2.1.0/regl.min.js",
  zdog: "https://unpkg.com/zdog@1/dist/zdog.dist.min.js",
  "a-frame":
    "https://cdnjs.cloudflare.com/ajax/libs/aframe/1.2.0/aframe.min.js",
  twemoji: "https://unpkg.com/twemoji@14.0.2/dist/twemoji.min.js",
  babylonjs:
    "https://cdnjs.cloudflare.com/ajax/libs/babylonjs/5.0.0/babylon.min.js",
  babylon:
    "https://cdnjs.cloudflare.com/ajax/libs/babylonjs/5.0.0/babylon.min.js",
  js: "",
  svg: "",
  custom: "",
}

// List of works
const list = [
  "0 - Chromie Squiggle / Snowfro - 9998 minted",
  "1 - Genesis / DCA - 512 minted",
  "2 - Construction Token / Jeff Davis - 500 minted",
  "3 - Cryptoblots / Daïm Aggott-Hönsch - 1921 minted",
  "4 - Dynamic Slices / pxlq - 512 minted",
  "5 - Variant Plan / Jeff Davis - 199 minted",
  "6 - View Card / Jeff Davis - 41 minted",
  "7 - Elevated Deconstructions / luxpris - 200 minted",
  "8 - Singularity / Hideki Tsukamoto - 1024 minted",
  "9 - Ignition / ge1doot - 512 minted",
  "10 - NimBuds / Bryan Brinkman - 400 minted",
  "11 - HyperHash / Beervangeer - 369 minted",
  "12 - Unigrids / Zeblocks - 421 minted",
  "13 - Ringers / Dmitri Cherniak - 1000 minted",
  "14 - Cyber Cities / pxlq - 256 minted",
  "15 - Utopia / ge1doot - 256 minted",
  "16 - Color Study / Jeff Davis - 2000 minted",
  "17 - Spectron / Simon De Mai - 400 minted",
  "18 - Gen 2 / DCA - 256 minted",
  "19 - R3sonance / ge1doot - 512 minted",
  "20 - Sentience / pxlq - 144 minted",
  "21 - 27-Bit Digital / kai - 1024 minted",
  "22 - The Eternal Pump / Dmitri Cherniak - 50 minted",
  "23 - Archetype / Kjetil Golid - 600 minted",
  "24 - Pixel Glass / kai - 256 minted",
  "25 - Pathfinders / luxpris - 1000 minted",
  "26 - EnergySculpture / Beervangeer - 369 minted",
  "27 - 720 Minutes / Alexis André - 720 minted",
  "28 - Apparitions / Aaron Penne - 1500 minted",
  "29 - Inspirals / Radix - 1000 minted",
  "30 - Hieroglyphs / pxlq - 1000 minted",
  "31 - Galaxiss / Xenoliss - 600 minted",
  "32 - Light Beams / Jason Ting - 150 minted",
  "33 - Empyrean / Generative Artworks - 500 minted",
  "34 - Ensō / Matto - 1000 minted",
  "35 - Aerial View / daLenz - 1000 minted",
  "36 - Gazettes / Redlioneye Gazette - 1024 minted",
  "37 - Paper Armada / Kjetil Golid - 3000 minted",
  "38 - ♫ ByteBeats / DADABOTS x KAI - 512 minted",
  "39 - Synapses / Chaosconstruct - 700 minted",
  "40 - Algobots / Stina Jones - 500 minted",
  "41 - Elementals / Michael Connolly - 600 minted",
  "42 - Void / Alexis André - 500 minted",
  "43 - Origami Dream / k0ch - 223 minted",
  "44 - CryptoGodKing / Steve Pikelny - 180 minted",
  "45 - Gravity Grid / Eliya Stein - 81 minted",
  "46 - 70s Pop Series One / Daniel Catt - 256 minted",
  "47 - Asterisms / Falko - 100 minted",
  "48 - Gen 3 / DCA - 1024 minted",
  "49 - Dear Hash, / MODNAR WOLF - 365 minted",
  "50 - The Opera / Luke Shannon - 256 minted",
  "51 - Stipple Sunsets / Jake Rockland - 360 minted",
  "52 - Star Flower / Ruben Alexander - 1000 minted",
  "53 - Subscapes / Matt DesLauriers - 650 minted",
  "54 - P:X / mightymoose - 384 minted",
  "55 - Talking Blocks / REMO x DCsan - 512 minted",
  "56 - Aurora IV / ge1doot - 128 minted",
  "57 - Rhythm / Jeff Davis - 334 minted",
  "58 - Color Magic Planets / Bård Ionson - 256 minted",
  "59 - Watercolor Dreams / NumbersInMotion - 600 minted",
  "60 - Event Horizon Sunset (Series C) / Jake Brukhman - 500 minted",
  "61 - 70s Pop Super Fun Summertime Bonus Pack 🍸 / Daniel Catt - 64 minted",
  "62 - Bubble Blobby / Jason Ting - 500 minted",
  "63 - Ode to Roy / artplusbrad - 906 minted",
  "64 - AlgoRhythms / Han x Nicolas Daniel - 1000 minted",
  "65 - Traversals / Loren Bednar - 150 minted",
  "66 - Patchwork Saguaros / Jake Rockland - 72 minted",
  "67 - Petri / Fabin Rasheed - 200 minted",
  "68 - Messengers / Alexis André - 350 minted",
  "69 - Abstraction / Hevey - 256 minted",
  "70 - Antennas / gcrll - 250 minted",
  "71 - Andradite / Eltono - 222 minted",
  "72 - Frammenti / Stefano Contiero - 555 minted",
  "73 - CatBlocks / Kristy Glas - 512 minted",
  "74 - The Blocks of Art / Shvembldr - 500 minted",
  "75 - Breathe You / raregonzo - 256 minted",
  "76 - dino pals / hideo - 100 minted",
  "77 - Return / Aaron Penne - 300 minted",
  "78 - Fidenza / Tyler Hobbs - 999 minted",
  "79 - Space Debris [m'aider] / WhaleStreet x pxlq - 93 minted",
  "80 - Space Debris [warning] / WhaleStreet x pxlq - 81 minted",
  "81 - Space Debris [ravaged] / WhaleStreet x pxlq - 32 minted",
  "82 - Incantation / Eliya Stein - 85 minted",
  "83 - Panelscape 🅰🅱 / Paolo Tonon - 525 minted",
  "84 - PrimiDance / wuwa - 256 minted",
  "85 - 70s Pop Series Two / Daniel Catt - 256 minted",
  "86 - Stroming / Bart Simons - 256 minted",
  "87 - Patterns of Life / Vamoss - 512 minted",
  "88 - Orthogone / Pandelune - 777 minted",
  "89 - Dreams / Joshua Bagley - 700 minted",
  "90 - Hashtractors / Darien Brito - 128 minted",
  "91 - planets / donnoh - 512 minted",
  "92 - Libertad Parametrizada / zJorge - 243 minted",
  "93 - Sigils / espina - 133 minted",
  "94 - Portal / Jeff Davis - 10 minted",
  "95 - CryptoVenetian / Bright Moments - 1000 minted",
  "96 - Gravity 12 / Jimmy Herdberg - 512 minted",
  "97 - [Dis]entanglement / onlygenerated - 730 minted",
  "98 - sail-o-bots / sturec - 750 minted",
  "99 - Spaghettification / Owen Moore - 1024 minted",
  "100 - CENTURY / Casey REAS - 1000 minted",
  "101 - Enchiridion / Generative Artworks - 1024 minted",
  "102 - I Saw It in a Dream / Steve Pikelny - 1024 minted",
  "103 - Octo Garden / Rich Lord - 333 minted",
  "104 - Eccentrics / Radix - 400 minted",
  "105 - Gizmobotz / Mark Cotton - 1000 minted",
  "106 - Radiance / Julien Gachadoat - 512 minted",
  "107 - Low Tide / Artem Verkhovskiy x Andy Shaw - 373 minted",
  "108 - Divisions / Michael Connolly - 500 minted",
  "109 - Speckled Summits / Jake Rockland - 72 minted",
  "110 - Lava Glow / JEANVASCRIPT - 500 minted",
  "111 - 70s Pop Ghost Bonus Pack 👻 / Daniel Catt - 64 minted",
  "112 - Alien Clock / Shvembldr - 362 minted",
  "113 - celestial cyclones / hideo - 628 minted",
  "114 - glitch crystal monsters / Alida Sun - 1000 minted",
  "115 - Dot Grid / TheElephantNL - 1000 minted",
  "116 - Flowers / RVig - 6158 minted",
  "117 - Transitions / Jason Ting x Matt Bilfield - 4712 minted",
  "118 - LeWitt Generator Generator / Mitchell F. Chan - 750 minted",
  "119 - Ecumenopolis / Joshua Bagley - 676 minted",
  "120 - Endless Nameless / Rafaël Rozendaal - 1000 minted",
  "121 - Rinascita / Stefano Contiero - 1111 minted",
  "122 - Cells / Hevey - 1024 minted",
  "123 - Nucleus / Hjalmar Åström - 512 minted",
  "124 - The Liths of Sisyphus / nonfigurativ - 777 minted",
  "125 - Calendart / steen & n-e-o - 365 minted",
  "126 - Timepiece / WAWAA - 500 minted",
  "127 - Labyrometry / Eliya Stein - 800 minted",
  "129 - Pigments / Darien Brito - 1024 minted",
  "130 - Obicera / Alexis André - 529 minted",
  "131 - Scribbled Boundaries / William Tan - 1024 minted",
  "132 - Tangled / Superblob - 384 minted",
  "133 - Organized Disruption / Joshua Davis / PrayStation - 1000 minted",
  "134 - Wave Schematics / luxpris - 400 minted",
  "135 - Brushpops / Matty Mariansky - 1000 minted",
  "136 - SpiroFlakes / Alexander Reben - 1024 minted",
  "137 - Alien Insects / Shvembldr - 1000 minted",
  "138 - Geometry Runners / Rich Lord - 1000 minted",
  "139 - Eccentrics 2: Orbits / Radix - 500 minted",
  "140 - Good Vibrations / Aluan Wang - 1024 minted",
  "141 - Rapture / Thomas Lin Pedersen - 1000 minted",
  "142 - Unknown Signals / k0ch - 1000 minted",
  "143 - phase / Loren Bednar - 1024 minted",
  "144 - autoRAD / sgt_slaughtermelon & Tartaria Archivist - 1000 minted",
  "145 - Beatboxes / Zeblocks - 841 minted",
  "146 - Neighborhood / Jeff Davis - 312 minted",
  "147 - Trossets / Anna Carreras - 1000 minted",
  "149 - Dot Matrix Gradient Study / Jake Rockland - 540 minted",
  "150 - PrimiLife / wuwa - 1024 minted",
  "151 - High Tide / Artem Verkhovskiy x Andy Shaw - 745 minted",
  "152 - Fake Internet Money / Steve Pikelny - 1000 minted",
  "153 - We / Vamoss - 1024 minted",
  "154 - Warp / espina - 444 minted",
  "156 - Moments / r4v3n - 1024 minted",
  "157 - UltraWave 369 / Beervangeer - 369 minted",
  "158 - a heart and a soul / Roman Janajev - 1024 minted",
  "159 - Fragments of an Infinite Field / Monica Rizzolli - 1024 minted",
  "160 - Seadragons / Marcin Ignac - 1000 minted",
  "161 - spawn / john provencher - 1001 minted",
  "162 - Democracity / Generative Artworks - 1024 minted",
  "163 - Meridian / Matt DesLauriers - 1000 minted",
  "164 - Phototaxis / Casey REAS - 1000 minted",
  "165 - Gravity 16 / Jimmy Herdberg - 1024 minted",
  "166 - Ouroboros / Shane Rich | raregonzo - 1024 minted",
  "167 - Blaschke Ballet / NumbersInMotion - 600 minted",
  "168 - Bloom / Blockchance - 285 minted",
  "169 - Augmented Sequence / toiminto - 1024 minted",
  "170 - Chroma Theory / Paweł Dudko - 106 minted",
  "171 - Himinn / Sarah Ridgley - 536 minted",
  "172 - Rituals - Venice / Aaron Penne x Boreta - 1000 minted",
  "173 - Skulptuur / Piter Pasma - 1000 minted",
  "174 - Letters to My Future Self / Ryan Struhl - 1000 minted",
  "175 - mono no aware / ixnayokay - 414 minted",
  "177 - Space Birds / Mark Cotton - 48 minted",
  "178 - Beauty in the Hurting / Ryan Green - 1024 minted",
  "179 - 8 / Bård Ionson - 128 minted",
  "180 - mecha suits / hideo - 256 minted",
  "181 - FOCUS / Matto - 567 minted",
  "182 - Amoeba / last even - 213 minted",
  "183 - Quarantine / Owen Moore - 128 minted",
  "184 - Swing / Eltono - 310 minted",
  "185 - little boxes on the hillsides, child / LIA - 777 minted",
  "187 - THE SOURCE CoDE / Ofir Liberman - 180 minted",
  "188 - Blockbob Rorschach / eBoy - 1024 minted",
  "189 - CryptoNewYorker / Qian Qian - 1000 minted",
  "190 - Mental pathways / fabianospeziari x donnoh - 128 minted",
  "191 - 444(4) / Shvembldr - 444 minted",
  "192 - Recursion / Hevey - 256 minted",
  "193 - Murano Fantasy / Pandelune - 41 minted",
  "194 - Rotae / Nadieh Bremer - 529 minted",
  "195 - Paramecircle / Alexander Reben (artBoffin) - 76 minted",
  "196 - Aithérios / Jorge Ledezma - 961 minted",
  "197 - Parade / Loren Bednar - 400 minted",
  "198 - Coquina / Jacob Gold - 387 minted",
  "199 - Prismatic / Eliya Stein - 218 minted",
  "200 - Saturazione / Stefano Contiero - 111 minted",
  "201 - 24 Heures / Alexis André - 137 minted",
  "202 - Beauty of Skateboarding / JEANVASCRIPT - 360 minted",
  "203 - Scoundrels / Kristy Glas - 2048 minted",
  "204 - Edifice / Ben Kovach - 976 minted",
  "205 - Placement / Cooper Jamieson - 500 minted",
  "206 - Asemica / Emily Edelman - Dima Ofman - Andrew Badr - 980 minted",
  "207 - Through the Window / Reva - 500 minted",
  "208 - Reflection / Jeff Davis - 100 minted",
  "209 - Autology / steganon - 1024 minted",
  "210 - Nebula / RVig - 154 minted",
  "211 - Freehand / WAWAA - 222 minted",
  "212 - Dive / Rafaël Rozendaal - 333 minted",
  "213 - Loom / Anna Lucia - 200 minted",
  "214 - Bent / ippsketch - 1023 minted",
  "215 - Gazers / Matt Kane - 1000 minted",
  "216 - Electriz / Che-Yu Wu - 910 minted",
  "217 - Paths / Darien Brito - 523 minted",
  "218 - Squares and Triangles / Maksim Hapeyenka - 80 minted",
  "219 - Time Atlas 🌐 / Paolo Tonon - 412 minted",
  "220 - geVIENNAratives / CryptoWiener - 2048 minted",
  "221 - Spiromorphs / SAB - 200 minted",
  "222 - Pieces of Me / r4v3n - 222 minted",
  "223 - Dream Engine / REMO x DCsan - 476 minted",
  "224 - Tropism / Neel Shivdasani - 500 minted",
  "225 - Vortex / Jen Stark - 1000 minted",
  "226 - Getijde / Bart Simons - 222 minted",
  "227 - Kai-Gen / Takeshi Murata, Christopher Rutledge, J. Krispy - 2048 minted",
  "228 - Incomplete Control / Tyler Hobbs - 100 minted",
  "229 - Attraction / Jos Vromans - 444 minted",
  "230 - Glow / Jason Ting - 500 minted",
  "231 - Cushions / Devi Parikh - 200 minted",
  "232 - Jiometory No Compute - ジオメトリ ハ ケイサンサレマセン / Samsy - 1024 minted",
  "233 - Chimera / mpkoz - 987 minted",
  "234 - The Wrapture / Dmitri Cherniak - 50 minted",
  "235 - Maps for grief / Louis-André Labadie - 500 minted",
  "236 - Summoning Ritual / PZS - 110 minted",
  "237 - Time Squared / steen x n-e-o - 212 minted",
  "238 - AlphaModica / Danooka - 137 minted",
  "239 - Synesthesia / PLS&TY - 123 minted",
  "240 - Pizza 1o1 / KALA - 200 minted",
  "241 - Maps / john provencher - 90 minted",
  "242 - Two Mathematicians / BY MA - 300 minted",
  "244 - InC / hex6c - 64 minted",
  "245 - Freeplan / xnmtrc - 128 minted",
  "246 - Stations / Fernando Jerez - 900 minted",
  "247 - Heavenly Bodies / Ento - 120 minted",
  "248 - HashCrash / Beervangeer - 369 minted",
  "249 - Facets / conundrumer - 267 minted",
  "250 - Cosmic Reef / Leo Villareal - 1024 minted",
  "251 - Undercover / artplusbrad - 91 minted",
  "252 - Roamings / Luca Ionescu - 128 minted",
  "253 - Legends of Metaterra / hideo - 1024 minted",
  "254 - Fernweh / oliveskin - 121 minted",
  "255 - Screens / Thomas Lin Pedersen - 1000 minted",
  "256 - Spotlight / Joshua Bagley - 625 minted",
  "257 - Machine Comics / Roni Block - 96 minted",
  "258 - Cosmodesias / Santiago - 256 minted",
  "259 - Masonry / Eric Davidson - 200 minted",
  "260 - Non Either / Rafaël Rozendaal - 100 minted",
  "261 - Para Bellum  / Matty Mariansky - 1000 minted",
  "262 - Haywire Café  / Jess Hewitt - 256 minted",
  "263 - Click / Ivan Dianov - 1024 minted",
  "264 - Thereidoscope / Daïm Aggott-Hönsch - 630 minted",
  "265 - Tentura / Stranger in the Q - 777 minted",
  "266 - Exhibition: 3291 / cryptobauhaus - 400 minted",
  "267 - entretiempos / Marcelo Soria-Rodríguez - 1000 minted",
  "268 - PrimiEnd / wuwa - 256 minted",
  "269 - Lacunae / James Dalessandro - 111 minted",
  "270 - Foliage / Falko - 250 minted",
  "271 - Time travel in a subconscious mind / Jimmy Herdberg - 256 minted",
  "272 - pseudomods / erin bee - 808 minted",
  "273 - Silhouette / Niel de la Rouviere - 400 minted",
  "274 - Isodream / henrysdev & AMNDA - 186 minted",
  "275 - Quantum Collapses / Insigħt - 404 minted",
  "276 - Strata / Vebjørn Isaksen - 650 minted",
  "277 - Perpetua / Punch Card Collective - 320 minted",
  "278 - Liquid Ruminations / Eliya Stein - 1024 minted",
  "279 - Neophyte MMXXII / Sterling Crispin - 168 minted",
  "280 - Window / Jan Robert Leegte - 404 minted",
  "281 - Automatism / Yazid - 426 minted",
  "282 - Memories of Qilin / Emily Xie - 1024 minted",
  "283 - OnChainChain / Rizzle, Sebi, Miguelgarest - 2000 minted",
  "284 - Ancient Courses of Fictional Rivers / Robert Hodgin - 1000 minted",
  "285 - Supermental / Rosenlykke - 400 minted",
  "286 - Drifting / Simon De Mai - 360 minted",
  "287 - Zoologic / ixnayokay - 300 minted",
  "288 - Mazinaw / Eric De Giuli - 256 minted",
  "289 - AlgoBeats / Han x Nicolas Daniel - 1000 minted",
  "290 - Where The Wind Blows / MODNAR WOLF - 170 minted",
  "291 - APEX / phenomena - 377 minted",
  "292 - Corners / Rafaël Rozendaal - 64 minted",
  "293 - Túnel Dimensional / Autonomoses - 320 minted",
  "294 - Alien DNA / Shvembldr - 512 minted",
  "295 - Invasion Percolation / BarabásiLab - 550 minted",
  "296 - Flux / Owen Moore - 500 minted",
  "297 - Center Pivot / Craig Hughes & Eric Hughes - 222 minted",
  "298 - Mind Maze / Parse/Error - 333 minted",
  "300 - Assemblage / SAB & K2xL - 361 minted",
  "301 - Hōrō / makio135 - 400 minted",
  "302 - Primordial / Jacob Gold - 333 minted",
  "303 - Imperfections / Kalis - 450 minted",
  "304 - Anticyclone / William Mapan - 800 minted",
  "305 - Zupermat / 0xphiiil - 200 minted",
  "307 - Ode to Penrose / uMathA - 300 minted",
  "308 - Cattleya / Ben Snell - 300 minted",
  "309 - Colorspace / Tabor Robak - 600 minted",
  "310 - 100 PRINT / Ben Kovach - 100 minted",
  "311 - Faceless / greatjones - 250 minted",
  "312 - Daisies / Natthakit Susanthitanon (NSmag) - 200 minted",
  "313 - Photon's Dream / Harvey Rayner | patterndotco - 404 minted",
  "314 - Divenire / Emanuele Pasin - 222 minted",
  "315 - Rotor / Sebastián Brocher (CryptoArte) - 285 minted",
  "316 - Maps of Nothing / Steve Pikelny - 625 minted",
  "317 - the spring begins with the first rainstorm / Cole Sternberg - 487 minted",
  "318 - Collapsed Sequence / toiminto - 400 minted",
  "319 - Assorted Positivity / steganon - 400 minted",
  "320 - montreal friend scale / amon tobin - 500 minted",
  "321 - Fermented Fruit / cyberia - 140 minted",
  "322 - Gels / Jason Brown - Shawn Douglas - 190 minted",
  "323 - GHOST IN THE CODE / Kazuhiro Tanimoto - 404 minted",
  "324 - Woah La Coaster / Blockwares - 199 minted",
  "326 - Total Strangers / Artem Verkhovskiy x Andy Shaw - 555 minted",
  "327 - 3:19 / Santiago. - 19 minted",
  "328 - Sudfah / Melissa Wiederrecht - 401 minted",
  "329 - Latent Spirits / Robert Hodgin - 400 minted",
  "330 - Squares / Martin Grasser - 196 minted",
  "331 - Metropixeland / Fernando Jerez - 450 minted",
  "332 - Steps / johan - 360 minted",
  "333 - Alan Ki Aankhen / Fahad Karim - 500 minted",
  "334 - Running Moon / Licia He - 500 minted",
  "335 - Scribblines / Orpheusk - 256 minted",
  "336 - Polychrome Music / Rafaël Rozendaal & Danny Wolfers (Legowelt) - 400 minted",
  "337 - FAKE IT TILL YOU MAKE IT / Maya Man - 700 minted",
  "338 - undead wyverns / hideo - 100 minted",
  "339 - Ieva / Shvembldr - 500 minted",
  "340 - Vahria / Darien Brito - 299 minted",
  "341 - RASTER / itsgalo - 400 minted",
  "342 - Being Yourself While Fitting In / LIA - 55 minted",
  "343 - Balletic / Motus Art - 200 minted",
  "344 - Glass / Eric De Giuli - 300 minted",
  "345 - 3 Minute Meditations / thetechnocratic - 159 minted",
  "346 - 80s Pop Variety Pack - for experts only 🕹 / Daniel Catt - 366 minted",
  "347 - Avalon / r0zk0 - 208 minted",
  "348 - CryptoCountries: The Unpublished Archives of a Mythical World Traveler / Michael G Devereux - 67 minted",
  "349 - Totem of Taste / Hannah Yan - 128 minted",
  "350 - Departed / Alexis André - 350 minted",
  "351 - Staccato / Philip Bell - 200 minted",
  "352 - The Inner World / Dominikus - 400 minted",
  "353 - Pointila / Phaust - 200 minted",
  "354 - Interferences / Juan Pedro Vallejo - 256 minted",
  "355 - Thoughts of Meadow / Eric Davidson - 150 minted",
  "356 - Essenza / Stefano Contiero - 444 minted",
  "357 - D-D-Dots / tuplart - 160 minted",
  "358 - Arcadia / Zachariah Watson - 256 minted",
  "359 - Ode to Untitled / artplusbrad - 240 minted",
  "361 - flora, fauna, false gods & floods / Ryan Green - 400 minted",
  "362 - Erratic / Owen Moore - 400 minted",
  "364 - Act of Emotion / Kelly Milligan - 400 minted",
  "365 - Stains on a Canvas / Omar Lobato - 300 minted",
  "366 - Sandaliya / Melissa Wiederrecht - 205 minted",
  "367 - Fontana / Harvey Rayner | patterndotco - 500 minted",
  "368 - Primitives / ArandaLasch - 400 minted",
  "369 - CENTURY 2052 / Casey REAS - 50 minted",
  "370 - Rectangles (for Herbert) / Jeff Davis - 500 minted",
  "371 - JPEG / Jan Robert Leegte - 275 minted",
  "373 - Intersections / Rafaël Rozendaal - 300 minted",
  "374 - Ottocento / Berubara - 35 minted",
  "375 - Wabi Sabi / Kazuhiro Tanimoto - 205 minted",
  "376 - Tide Predictor / LoVid - 400 minted",
  "377 - Ingress / Paweł Dudko - 256 minted",
  "378 - Fleur / AnaPet - 300 minted",
  "379 - ORI / James Merrill - 450 minted",
  "380 - Seedlings / VES3L - 200 minted",
  "381 - Structures / Hevey - 256 minted",
  "382 - Metaphysics / Jinyao Lin - 200 minted",
  "383 - Pre-Process / Casey REAS - 120 minted",
  "384 - VOXΞL / JEANVASCRIPT - 250 minted",
  "385 - Dipolar / Junia Farquhar - 256 minted",
  "386 - Ego Death / electralina - 222 minted",
  "387 - Pointers / Steve Pikelny - 100 minted",
  "388 - Your Story / encapsuled - 102 minted",
  "389 - Miragem / Third Vision - 256 minted",
  "390 - Imposter Syndrome / ippsketch - 100 minted",
  "391 - Contrast Agent / Tim Richardson + Sean Zellmer - 14 minted",
  "392 - Hyper Drive: A-Side / Ryan Bell - 200 minted",
  "393 - Race Condition / Jonas Lund - 325 minted",
  "394 - Volute / RVig - 200 minted",
  "395 - Implications / ixnayokay - 300 minted",
  "396 - Good, Computer / Dean Blacc - 75 minted",
  "397 - Through Curved Air / Jacob Gold - 186 minted",
  "398 - Libra / Cooper Jamieson - 50 minted",
  "399 - The Field / Beervangeer - 369 minted",
  "400 - Such A Lovely Time / petitsapin - 325 minted",
  "401 - Aragnation / Devi Parikh and Abhishek Das - 128 minted",
  "404 - Ad Extremum Terrae / uMathA - 200 minted",
  "405 - chaos comes with the summer haze / Cole Sternberg - 163 minted",
  "406 - WaVyScApE / Holger Lippmann - 315 minted",
  "407 - The Harvest / Per Kristian Stoveland - 400 minted",
  "408 - NimTeens / Bryan Brinkman - 400 minted",
  "409 - Tout tracé / Florian Zumbrunn - 300 minted",
  "410 - Jenim / Orr Kislev & Alona Rodeh - 135 minted",
  "411 - Symbol 1 / Emily Weil - 153 minted",
  "412 - Cerebellum / Laya Mathikshara & Santiago - 300 minted",
  "413 - Longing / phenomena - 247 minted",
  "414 - KARMA / KALA - 33 minted",
  "415 - Renders Game / MountVitruvius - 325 minted",
  "416 - Calian / Eric De Giuli - 256 minted",
  "417 - Ceramics / Charlotte Dann - 300 minted",
  "418 - Neural Sediments / Eko33 - 300 minted",
  "419 - SL/CE / Stranger in the Q - 40 minted",
  "420 - Coalition / Generative Artworks - 37 minted",
  "421 - Rippling / Yi-Wen Lin - 128 minted",
  "422 - SKEUOMORPHS / itsgalo - 300 minted",
  "423 - Solar Transits / Robert Hodgin - 400 minted",
  "424 - Worlds Within / Jason Ting - 256 minted",
  "425 - Mellifera / artplusbrad - 58 minted",
  "426 - Cargo / Kim Asendorf - 1000 minted",
  "427 - transparency / usnea - 29 minted",
  "428 - Memories of Digital Data / Kazuhiro Tanimoto - 450 minted",
  "429 - ilumz / Wolffia Inc. & Motus Art - 57 minted",
  "430 - Fushi No Reality - フシノゲンジツ / Samsy - 255 minted",
  "431 - (Dis)connected / Tibout Shaik - 48 minted",
  "432 - Divergence / Loren Bednar - 100 minted",
  "433 - Still Moving / Nathaniel Stern and Sasha Stiles - 240 minted",
  "434 - Voyager / DisruptedStar - 300 minted",
  "435 - Flows / ryley-o.eth - 100 minted",
  "436 - UMK / Fernando Jerez - 762 minted",
  "437 - Nära / Tengil - 280 minted",
  "438 - Subtle / willstall - 256 minted",
  "439 - Enigma / RalenArc - 31 minted",
  "440 - Augury / LoVid - 126 minted",
  "441 - Net Net Net / ilithya x Erin Wajufos - 32 minted",
  "442 - Systems Madness / Claudia Hart and Andrew Blanton - 42 minted",
  "443 - Dendro / Vebjørn Isaksen - 275 minted",
  "444 - Meaningless / Amy Goodchild - 270 minted",
  "445 - Assembly / Tezumie - 84 minted",
  "446 - Invisibles / Ismahelio - 200 minted",
  "447 - Semblance / rahul iyer - 185 minted",
  "448 - Bright / Heeey - 360 minted",
  "449 - Speak To Me / Lisa Orth - 290 minted",
  "450 - Overload / Shvembldr - 200 minted",
  "451 - Backwards / Asaf Slook - 300 minted",
  "452 - Muttenz / wuwa - 66 minted",
  "453 - Crypt / The Cyclops Group - 53 minted",
  "454 - Flourish / Sterling Crispin - 270 minted",
  "455 - Human Unreadable / Operator - 400 minted",
  "456 - Spaghetti Bones / Joshua Bagley - 600 minted",
  "457 - Dopamine Machines / Steve Pikelny - 777 minted",
  "458 - Mycelia / JMY - 200 minted",
  "459 - Seasky / Ralgo - 100 minted",
  "460 - Exstasis / Grant Oesterling - 111 minted",
  "461 - Sonoran Roadways / Jake Rockland - 54 minted",
  "462 - Gumbo / Mathias Isaksen - 400 minted",
  "463 - l.o / Night Sea - 174 minted",
  "464 - Kubikino / Carolina Melis - 320 minted",
  "465 - Escherly Seeds / Martijn Cohen - 28 minted",
  "466 - Torrent / Jeres - 300 minted",
  "467 - Glasshouse INAT / Aleksandra Jovanić - 19 minted",
  "468 - Woman, Life, Freedom / Armaghan Fatemi - 36 minted",
  "469 - Twos / Emily Edelman - 64 minted",
  "470 - Forecast / Manuel Larino - 365 minted",
  "471 - This Is Not A Rock / Nicole Vella - 350 minted",
  "472 - because unless until / ixnayokay - 650 minted",
  "473 - Fluiroso / Sebastián Brocher (CryptoArte) - 105 minted",
  "474 - Lumina / DistCollective - 80 minted",
  "475 - Recollection / Robert Hodgin - 166 minted",
  "476 - Life and Love and Nothing / Nat Sarkissian - 200 minted",
  "477 - siempre en mí, siempre en ti / Marcelo Soria-Rodríguez - 200 minted",
  "478 - Lucky Clover / Sputniko! - 40 minted",
  "479 - Bakhoor Assandal / Melissa Wiederrecht - 200 minted",
  "480 - Axo / jiwa - 400 minted",
  "481 - Immaterial / Bjørn Staal - 280 minted",
  "482 - Trichro-matic / MountVitruvius - 600 minted",
  "483 - Naïve / Olga Fradina - 300 minted",
  "484 - Blind Spots / Shaderism - 400 minted",
  "486 - Proscenium / remnynt - 400 minted",
  "487 - Cytographia / Golan Levin - 418 minted",
  "488 - Växt / Tengil - 150 minted",
  "489 - Balance / Kelly Milligan x Amber Vittoria - 250 minted",
  "490 - Twist / Rafaël Rozendaal - 250 minted",
  "493 - Melancholic Magical Maiden / Emi Kusano - 300 minted",
  "EXP 0 - Friendship Bracelets / Alexis André - 38664 minted",
  "EXP 1 - Marfa Yucca / Daniel Calderon Arenas - 390 minted",
  "EXP 2 - marfaMESH / Harvey Rayner | patterndotco - 343 minted",
  "ABXPACE 0 - Petro National / John Gerrard - 196 minted",
  "ABXPACE 1 - Floating World Genesis / A.A. Murakami - 250 minted",
  "ABXPACE 2 - QWERTY / Tara Donovan - 500 minted",
  "ABXPACE 3 - Contractions / Loie Hollowell - 280 minted",
  "ABXPACE 4 - New Worlds / Robert Whitman - 500 minted",
  "ABXPACE 5 - PRELUDES / Trevor Paglen - 250 minted",
  "ABXPACE 6 - World Flag / John Gerrard - 195 minted",
  "ABXPACE 7 - Schema / DRIFT with Jeff Davis - 300 minted",
  "ABXBM 0 - Metropolis / mpkoz - 940 minted",
  "ABXBM 1 - 923 EMPTY ROOMS / Casey REAS - 924 minted",
  "BM 0 - Finale / Bright Moments - 1000 minted",
  "BM 1 - Stellaraum / Alida Sun - 66 minted",
  "BM 2 - Parnassus / mpkoz - 100 minted",
  "BM 3 - Inflection / Jeff Davis - 96 minted",
  "BM 4 - Kaleidoscope / Loren Bednar - 100 minted",
  "BM 5 - Lux / Jason Ting - 64 minted",
  "BM 6 - Network C / Casey REAS - 100 minted",
  "BM 7 - The Nursery / Sputniko! - 100 minted",
  "BM 8 - FOLIO / Matt DesLauriers - 100 minted",
  "BM 9 - Inprecision / Thomas Lin Pedersen - 100 minted",
  "BM 10 - Off Script / Emily Xie - 100 minted",
  "BM 11 - Formation / Jeff Davis - 100 minted",
  "BM 12 - translucent panes / fingacode - 431 minted",
  "BM 13 - Wirwar / Bart Simons - 100 minted",
  "BM 14 - KERNELS / Julian Hespenheide - 190 minted",
  "BM 15 - Brise Soleil  / Jorge Ledezma - 100 minted",
  "BM 16 - Orchids / Luke Shannon - 400 minted",
  "BM 17 - Rubicon / Mario Carrillo - 266 minted",
  "BM 18 - nth culture / fingacode - 100 minted",
  "BM 19 - Pohualli / Fahad Karim - 100 minted",
  "BM 20 - Underwater / Monica Rizzolli - 100 minted",
  "BM 21 - Infinito / Stefano Contiero - 100 minted",
  "BM 22 - Bosque de Chapultepec / Daniel Calderon Arenas - 100 minted",
  "BM 23 - ToSolaris / Iskra Velitchkova - 100 minted",
  "BM 24 - Glaciations / Anna Lucia - 100 minted",
  "BM 25 - 1935 / William Mapan - 100 minted",
  "BM 26 - lūmen / p1xelfool - 100 minted",
  "BM 27 - lo que no está / Marcelo Soria-Rodríguez - 100 minted",
  "BM 28 - 100 Untitled Spaces / Snowfro - 100 minted",
  "BM 29 - 100 Sunsets / Zach Lieberman - 100 minted",
  "BM 30 - Transcendence / Jeff Davis - 10 minted",
  "BM 31 - Caminos / Juan Rodríguez García - 1000 minted",
  "BM 32 - Color Streams / r4v3n - 370 minted",
  "BM 33 - Limn / RalenArc - 200 minted",
  "BM 34 - Velum / Harvey Rayner | patterndotco - 100 minted",
  "BM 35 - Cage / John Provencher - 162 minted",
  "BM 36 - Sunset from the Bluffs / Nat Sarkissian - 100 minted",
  "BM 37 - Intricada / Camille Roux - 270 minted",
  "BM 38 - Passages / Aaron Penne x Boreta - 100 minted",
  "BM 39 - Cantera / mrkswcz - 100 minted",
  "BM 40 - immprint / imma - 315 minted",
  "BM 41 - Agar / Emily Edelman - 100 minted",
  "BM 42 - L'Appel / Alexis André - 100 minted",
  "BM 43 - LED / Jeff Davis - 100 minted",
  "BM 44 - Event Horizon / Kim Asendorf - 100 minted",
  "BM 45 - Orbifold / Kjetil Golid - 100 minted",
  "BM 46 - FULL_SPECTRUM / Lars Wander - 100 minted",
  "BM 47 - Sparkling Goodbye / Licia He - 100 minted",
  "BM 48 - Undercurrents / Melissa Wiederrecht - 100 minted",
  "BM 49 - Margaret / qubibi - 100 minted",
  "BM 50 - Nature finds a way. / Spongenuity. - 100 minted",
  "BM 51 - Marching Resonances / Shunsuke Takawo - 100 minted",
  "BM 52 - Kumono Shingou / zancan - 100 minted",
  "BM 53 - Hanabi / ykxotkx - 82 minted",
  "BM 54 - Square Symphony / Okazz - 100 minted",
  "BM 55 - Public Art / 0xhaiku - 94 minted",
  "BM 56 - Dream Logic / Ngozi - 100 minted",
  "BM 57 - Epiphanies / Jimena Buena Vida - 201 minted",
  "BM 58 - If You Could Do It All Again / Nicole Vella - 120 minted",
  "BM 59 - Esquejes / Pedro Falco - 169 minted",
  "BM 60 - 1 + 1 = 3 / Stefano Contiero - 112 minted",
  "BM 61 - Apophenies / Cory Haber - 100 minted",
  "BM 62 - Vertigo Las Luces / Guido Corallo - 79 minted",
  "BM 63 - Cuadro / Jeff Davis - 89 minted",
  "BM 64 - Dolor Gravitacional / Jorge Ledezma - 63 minted",
  "BM 65 - Subtraction, Reconfiguration / Juan Pedro Vallejo - 100 minted",
  "BM 66 - Delirium Blooms / Leonardo Solaas - 89 minted",
  "BM 67 - KARNE / Lolo Armdz - 70 minted",
  "BM 68 - BLINK / Patricio Gonzalez Vivo & Jen Lowe - 70 minted",
  "BM 69 - Souls from Gaia / Tamara Moura Costa - 61 minted",
  "BM 70 - Desde Lejos / Thomas Noya - 70 minted",
  "BM 71 - Liminal / Julien Espagnon - 85 minted",
  "BM 72 - SPINᵗ / NumbersInMotion - 52 minted",
  "BM 73 - Topology / Rikard Lindström - 29 minted",
  "BM 74 - Descent / Andreas Gysin - 100 minted",
  "BM 75 - Enlace / Aranda/Lasch - 100 minted",
  "BM 76 - Odysseys / Florian Zumbrunn - 100 minted",
  "BM 77 - a temporary arrangement of material / Martin Grasser - 100 minted",
  "BM 78 - Lightbreak / Luke Shannon - 100 minted",
  "BM 79 - Figs. / Sarah Ridgley - 100 minted",
  "BM 80 - Brava / Anna Carreras - 100 minted",
  "BM 81 - The Destination / Camille Roux x Matthieu Segret - 100 minted",
  "BM 82 - Encore / rudxane - 100 minted",
  "BM 83 - Notes / Maya Man - 100 minted",
  "BM 84 - Culmination / Jeff Davis - 100 minted",
  "CITIZEN 0 - CryptoGalactican / Qian Qian - 1000 minted",
  "CITIZEN 3 - CryptoBerliner / Qian Qian - 1000 minted",
  "CITIZEN 4 - CryptoLondoner / Qian Qian - 1000 minted",
  "CITIZEN 5 - CryptoMexa / Qian Qian - 1000 minted",
  "CITIZEN 6 - CryptoTokyoite / Qian Qian - 1000 minted",
  "CITIZEN 7 - CryptoPatagonian / Qian Qian - 1000 minted",
  "CITIZEN 8 - CryptoParisian / Qian Qian - 1000 minted",
  "CITIZEN 9 - CryptoVenezian / Qian Qian - 1000 minted",
  "PLOT 0 - Streamlines / NumbersInMotion - 500 minted",
  "PLOT 1 - Implosion / Generative Artworks - 256 minted",
  "PLOT 2 - Really Random Rock / DCA - 350 minted",
  "PLOT 3 - Diatom / Joshua Schachter - 102 minted",
  "PLOT 4 - Lines Walking / Lars Wander - 44 minted",
  "PLOT 5 - Coalescence / Beervangeer - 135 minted",
  "PLOT 6 - Shattered / @greweb - 100 minted",
  "PLOT 7 - Brickwork / WAWAA - 146 minted",
  "PLOT 8 - spectral / oppos - 63 minted",
  "PLOT 9 - Delicate Chaos / moving.drawing - 168 minted",
  "PLOT 10 - Azulejos / PZS - 90 minted",
  "PLOT 11 - Petri Dish / James Dalessandro - 38 minted",
  "PLOT 12 - Pseudofigure / conundrumer - 144 minted",
  "PLOT 13 - Reservation / Generative Artworks - 50 minted",
  "PLOT 14 - Endless (5,607,250 to Infinity) / Modnar Wolf x NumbersInMotion - 2558 minted",
  "PLOT 15 - Shields / r4v3n - 100 minted",
  "PLOT 16 - Structures / Julien Gachadoat - 256 minted",
  "PLOT 17 - Happenstance I: CTC / Generative Artworks - 30 minted",
  "PLOT 18 - Beginnings / 0xPhiiil - 40 minted",
  "PLOT 19 - Scribbled Daydreams / minimizer - 200 minted",
  "PLOT 20 - Generative Alchemy / Eliya Stein - 38 minted",
  "PLOT 21 - Scratch / Matto - 64 minted",
  "PLOT 22 - Stroomlijn / Bart Simons - 38 minted",
  "PLOT 24 - Lissajous / Michael G Devereux - 13 minted",
  "PLOT 25 - Happenstance II: Framed / Generative Artworks - 16 minted",
  "PLOT 26 - Field Recordings / Jacob Gold - 15 minted",
  "PLOTII 0 - Time Between the Lines is Thread Through the Mind / Matto - 38 minted",
  "STBYS 0 - Themes and Variations / Vera Molnár, in collaboration with Martin Grasser - 500 minted",
  "ATP 0 - LOVE / Martin Grasser - 300 minted",
  "GRAIL 1 - Fold / rudxane - 400 minted",
  "GRAIL 2 - Atlas / Eric De Giuli - 333 minted",
  "SDAO 0 - Elevate Heart / Daniel Calderon Arenas - 1000 minted",
  "MINTS 0 - The Colors That Heal / Ryan Green - 142 minted",
  "TDG 1 - Filigree - Collector's Edition / Matt DesLauriers - 10 minted",
  "TDG 2 - Filigree - Digital Edition / Matt DesLauriers - 90 minted",
  "VFA 0 - Fenestra / Rob Scalera - 41 minted",
  "VFA 1 - Opuntia / Jake Rockland - 1 minted",
  "UNITLDN 1 - Disconnected / Stefano Contiero - 10 minted",
  "UNITLDN 2 - Pressed Pause / Loren Bednar - 9 minted",
  "AOI 0 - Pursuit / Per Kristian Stoveland - 200 minted",
  "AOI 1 - Echo of Intensity / Per Kristian Stoveland - 1595 minted",
  "AOI 2 - /// / Snowfro - 2000 minted",
  "AOI 3 - Signature / Jack Butcher - 200 minted",
  "AOI 4 - Trademark / Jack Butcher - 10000 minted",
  "VCA 1 - Concrete Letters / makio135 - 200 minted",
  "VCA 2 - A Tender Count(ing) / Lisa Orth - 200 minted",
  "VCA 3 - The Art behind the Code / Luca Ionescu - 5 minted",
  "VCA 5 - Petrography Case / Orr Kislev - 200 minted",
  "VCA 6 - Décorés / Alexis André - 200 minted",
  "VCA 7 - Spatial Curvatures / DistCollective - 200 minted",
  "VCA 8 - Drifting Dreams / Licia He - 325 minted",
  "VCA 10 - Suma / Aleksandra Jovanić - 85 minted",
  "VCA 11 - Chronicles / encapsuled - 17 minted",
  "VCA 12 - la caverna / Marcelo Soria-Rodríguez - 150 minted",
  "VCA 13 - Spensieratezza / Emanuele Pasin - 9 minted",
  "VCA 15 - Linea Recta / Moodsoup - 150 minted",
  "VCA 17 - Transition / William Watkins - 100 minted",
  "VCA 18 - JaggedMemories / Shunsuke Takawo - 50 minted",
  "VCA 19 - [classifieds] / fingacode - 24 minted",
]

/***************************************************
 *                    MODE TOGGLE
 **************************************************/
modeToggle.addEventListener("click", () => {
  root.classList.toggle("dark-mode")
  const isDarkMode = root.classList.contains("dark-mode")
  localStorage.setItem("darkMode", isDarkMode)
})

const isDarkMode = JSON.parse(localStorage.getItem("darkMode"))
if (isDarkMode) {
  root.classList.add("dark-mode")
} else {
  root.classList.remove("dark-mode")
}
root.classList.remove("no-flash")

/***************************************************
 *        FUNCTIONS TO GET DATA FROM ETHEREUM
 **************************************************/
async function grabData(_tokenId, contract) {
  try {
    keyShort.style.display = "none"
    spin.style.display = "block"
    clearLocalStorage()
    clearPanels()

    const tokenId = Number(_tokenId)
    const isContractGen1 = [0, 1, 4, 7, 9, 10, 13, 16, 18].includes(contract)

    const hash = await fetchHash(tokenId, contract)
    const projectId = await fetchProjectId(tokenId, contract)
    const projId = Number(projectId)
    const projectInfo = await fetchProjectInfo(projId, contract, isContractGen1)
    const script = await constructScript(projId, projectInfo, contract)
    const detail = await fetchProjectDetails(projId, contract)
    const owner = await fetchOwner(tokenId, contract)
    const extLib = extractLibraryName(projectInfo)
    const { edition, remaining } = await fetchEditionInfo(
      projId,
      contract,
      isContractGen1
    )

    storeDataInLocalStorage({
      tokenId,
      contract,
      projId,
      hash,
      script,
      detail,
      owner,
      extLib,
      edition,
      remaining,
    })

    location.reload()
  } catch (error) {
    console.error("grabData:", error)
    search.placeholder = "Error"
    spin.style.display = "none"
  }
}

async function fetchHash(tokenId, contract) {
  return contract === 0
    ? contracts[contract].showTokenHashes(tokenId)
    : contracts[contract].tokenIdToHash(tokenId)
}

async function fetchProjectId(tokenId, contract) {
  return contracts[contract].tokenIdToProjectId(tokenId)
}

async function fetchProjectInfo(projId, contract, isContractGen1) {
  return isContractGen1
    ? contracts[contract].projectScriptInfo(projId)
    : contracts[contract].projectScriptDetails(projId)
}

async function constructScript(projId, projectInfo, contract) {
  let script = ""
  for (let i = 0; i < projectInfo.scriptCount; i++) {
    const scrpt = await contracts[contract].projectScriptByIndex(projId, i)
    script += scrpt
  }
  return script
}

async function fetchProjectDetails(projId, contract) {
  return contracts[contract].projectDetails(projId)
}

async function fetchOwner(tokenId, contract) {
  return contracts[contract].ownerOf(tokenId)
}

function extractLibraryName(projectInfo) {
  if (typeof projectInfo[0] === "string" && projectInfo[0].includes("@")) {
    return projectInfo[0].split("@")[0].trim()
  } else {
    return JSON.parse(projectInfo[0]).type
  }
}

async function fetchEditionInfo(projId, contract, isContractGen1) {
  const invo = await (isContractGen1
    ? contracts[contract].projectTokenInfo(projId)
    : contracts[contract].projectStateData(projId))

  return {
    edition: invo.maxInvocations.toString(),
    remaining: (invo.maxInvocations - invo.invocations).toString(),
  }
}

function storeDataInLocalStorage(data) {
  localStorage.setItem("contractData", JSON.stringify(data))
}

/***************************************************
 *              CLEAR FUNCTIONS
 **************************************************/
function clearLocalStorage() {
  localStorage.removeItem("contractData")
  localStorage.removeItem("scriptData")
}

function clearPanels() {
  listPanel.classList.remove("active")
  panel.classList.remove("active")
  overlay.style.display = "none"
}

/***************************************************
 *              FUNCTIONS TO UPDATE UI
 **************************************************/
function update(
  tokenId,
  contract,
  projId,
  hash,
  script,
  detail,
  owner,
  extLib,
  edition,
  remaining
) {
  let logs = []
  pushItemToLocalStorage(contract, tokenId, hash, script, extLib)
  const curation =
    contract == 0 || contract == 1 || contract == 2
      ? determineCuration(projId)
      : ""
  const platform = determinePlatform(contract, curation)
  let id = getShortenedId(tokenId)
  updateInfo(contract, detail, id, logs)
  updatePanelContent(
    contract,
    owner,
    detail,
    tokenId,
    platform,
    edition,
    remaining,
    logs
  )
  injectFrame()
}

function pushItemToLocalStorage(contract, tokenId, hash, script, extLib) {
  const src = predefinedLibraries[extLib]
  const tokenIdHash =
    tokenId < 3000000 && contract == 0
      ? `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`
      : `let tokenData = { tokenId: "${tokenId}", hash: "${hash}" }`
  let process = extLib == "processing" ? "application/processing" : ""

  storeScriptDataInLocalStorage({ src, tokenIdHash, process, script })
}

function storeScriptDataInLocalStorage(data) {
  localStorage.setItem("scriptData", JSON.stringify(data))
}

function determineCuration(projId) {
  const curated = [
    0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 17, 21, 23, 27, 28, 29, 35, 39, 40,
    41, 53, 59, 62, 64, 72, 74, 78, 89, 100, 114, 120, 129, 131, 138, 143, 147,
    159, 173, 204, 206, 209, 214, 215, 225, 232, 233, 250, 255, 261, 267, 282,
    284, 296, 304, 309, 320, 328, 333, 334, 336, 337, 341, 364, 367, 368, 376,
    379, 383, 385, 399, 406, 407, 412, 416, 417, 418, 423, 426, 428, 433, 455,
    456, 457, 462, 466, 471, 472, 482, 483, 484, 486, 487, 488, 493,
  ]
  return curated.includes(projId)
    ? "Art Blocks Curated"
    : projId < 494
    ? "Art Blocks Present"
    : "Art Blocks"
}

function determinePlatform(contract, curation) {
  const contractsData = {
    0: curation,
    1: curation,
    2: curation,
    3: "Art Blocks Explorations",
    4: "Art Blocks &times; Pace",
    5: "Art Blocks &times; Pace",
    6: "Art Blocks &times; Bright Moments",
    7: "Bright Moments",
    8: "Bright Moments",
    9: "Bright Moments",
    10: "Plottables",
    12: "Sotheby's",
    13: "ATP",
    14: "Grailers",
    15: "AOI",
    16: "Vertical Crypto Art",
    17: "SquiggleDAO",
    18: "Endaoment",
    19: "The Disruptive Gallery",
    20: "Vertu Fine Art",
    21: "Unit London",
  }

  return contractsData[contract] || null
}

function getShortenedId(tokenId) {
  return tokenId < 1000000
    ? tokenId
    : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0
}

function updateInfo(contract, detail, id, logs) {
  if (contract == 8) {
    frame.contentWindow.console.log = function (message) {
      console.log("Log from iframe:", message)
      if (logs.length === 0) {
        message = message.replace(/Artist\s*\d+\.\s*/, "")
        message = message.replace(/\s*--.*/, "")
      }
      logs.push(message)

      info.innerHTML = `${detail[0]} #${id} / ${logs[0]}`
      return logs
    }
  } else {
    info.innerHTML = `${detail[0]} #${id} / ${detail[1]}`
  }
}

async function updatePanelContent(
  contract,
  owner,
  detail,
  tokenId,
  platform,
  edition,
  remaining,
  logs
) {
  try {
    const ensName = await provider.lookupAddress(owner)

    const ownerLink = ensName
      ? `<a href="https://zapper.xyz/account/${owner}" target="_blank">${ensName}</a>`
      : `<a href="https://zapper.xyz/account/${owner}" target="_blank">${owner}</a>`

    const mintedOut =
      remaining == 0
        ? `Edition of ${edition} works.`
        : `Edition of ${edition} works, ${remaining} remaining.`

    let artist = logs.length != 0 ? logs[0] : detail[1]

    const panelContentHTML = `
      <p>
        <span style="font-size: 1.4em">${detail[0]}</span><br>
        ${artist} ● ${platform}<br>
        ${mintedOut}
      </p><br>
      <p>
        ${detail[2]} <a href="${detail[3]}" target="_blank">${detail[3]}</a>
      </p><br>
      <p class="mini">
        Owner: ${ownerLink}<br>
        Contract: <a href="https://etherscan.io/address/${contracts[contract].target}" target="_blank">${contracts[contract].target}</a><br>
        Token ID: <a href="https://api.artblocks.io/token/${tokenId}" target="_blank">${tokenId}</a>
      </p>
    `

    panelContent.innerHTML = panelContentHTML
  } catch (error) {
    console.log("updatePanelContent:", error)
  }
}

/***************************************************
 *        FUNCTION TO INJECT INTO IFRAME
 **************************************************/
async function injectFrame() {
  const iframeDocument = frame.contentDocument || frame.contentWindow.document
  try {
    let contractData = JSON.parse(localStorage.getItem("contractData"))
    let scriptData = JSON.parse(localStorage.getItem("scriptData"))

    const frameHead = `<head>
    <meta name='viewport' content='width=device-width, initial-scale=1', maximum-scale=1>
    <script src='${scriptData.src}'></script>
    <script>${scriptData.tokenIdHash};</script>
    <style type="text/css">
      html {
        height: 100%;
      }
      body {
        min-height: 100%;
        margin: 0;
        padding: 0;
        background-color: var(--color-bg);
      }
      canvas {
        padding: 0;
        margin: auto;
        display: block;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
    </style>
    </head>`

    const frameBody = scriptData.process
      ? `<body>
    <script type='${scriptData.process}'>${scriptData.script}</script>
    <canvas></canvas>
    </body>`
      : `<body>
    <canvas id="babylon-canvas"></canvas>
    <script>${scriptData.script}</script>
    </body>`

    let dynamicContent
    if (contractData.extLib === "custom") {
      dynamicContent = `<script>${scriptData.tokenIdHash}</script>${scriptData.script}`
    } else {
      dynamicContent = `<html>${frameHead}${frameBody}</html>`
    }

    iframeDocument.open()
    iframeDocument.write(dynamicContent)
    iframeDocument.close()
    spin.style.display = "none"
    keyShort.style.display = "block"
  } catch (error) {
    console.error("injectFrame:", error)
  }
}

/***************************************************
 *          FUNCTIONS TO SEARCH AND GET TOKEN
 **************************************************/
function getToken(panelContent, searchQuery) {
  const textContent = panelContent.replace(/<\/?[^>]+(>|$)/g, "")

  if (searchQuery.includes(",")) {
    handleCommaSeparatedQuery(searchQuery)
  } else if (/^\d+$/.test(searchQuery)) {
    handleNumericQuery(searchQuery)
  } else {
    handleOtherQuery(textContent, searchQuery)
  }
}

function handleCommaSeparatedQuery(searchQuery) {
  const [tokenId, query2] = searchQuery
    .split(",")
    .map((str) => str.trim().toUpperCase())

  let contract = getContractFromList(query2, tokenId)

  console.log("Contract:", contract)
  console.log("Token Id:", tokenId)
  grabData(tokenId, contract)
}

function handleNumericQuery(tokenId) {
  let contract = tokenId < 3000000 ? 0 : tokenId < 374000000 ? 1 : 2

  console.log("Contract:", contract)
  console.log("Token Id:", tokenId)
  grabData(tokenId, contract)
}

function handleOtherQuery(textContent, searchQuery) {
  const projId = parseInt(textContent.match(/\d+/)[0])
  const listContract = textContent.match(/^[A-Za-z0-9]+/)[0]
  let tokenId

  if (!searchQuery.includes("#")) {
    const regex = /^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*minted/
    const matches = textContent.match(regex)
    const token = parseInt(matches[3])
    const randomToken = Math.floor(Math.random() * (token - 1))
    tokenId =
      projId === 0
        ? randomToken.toString()
        : (projId * 1000000 + randomToken).toString().padStart(6, "0")
  } else {
    const searchId = parseInt(searchQuery.match(/#\s*(\d+)/)[1])
    tokenId =
      projId === 0
        ? searchId.toString()
        : (projId * 1000000 + searchId).toString().padStart(6, "0")
  }

  let contract = getContractFromList(listContract, tokenId)

  console.log("Contract:", contract)
  console.log("Token Id:", tokenId)
  grabData(tokenId, contract)
}

function getContractFromList(contract, tokenId) {
  switch (contract) {
    case "EXP":
      return 3
    case "ABXPACE":
      return tokenId < 5000000 ? 4 : 5
    case "ABXBM":
      return 6
    case "BM":
      return tokenId < 1000000 ? 8 : 7
    case "CITIZEN":
      return 9
    case "PLOT":
      return 10
    case "PLOTII":
      return 11
    case "STBYS":
      return 12
    case "ATP":
      return 13
    case "GRAIL":
      return 14
    case "AOI":
      return 15
    case "VCA":
      return 16
    case "SDAO":
      return 17
    case "MINTS":
      return 18
    case "TDG":
      return 19
    case "VFA":
      return 20
    case "UNITLDN":
      return 21
    default:
      return tokenId < 3000000 ? 0 : tokenId < 374000000 ? 1 : 2
  }
}

function displayList(lines) {
  const panel =
    "<div>" + lines.map((line) => `<p>${line}</p>`).join("") + "</div>"
  listPanel.innerHTML = panel
}

function filterList(lines, query) {
  const filteredLines = lines.filter((line) =>
    line.toLowerCase().includes(query.toLowerCase())
  )
  displayList(filteredLines)
}

displayList(list)

search.addEventListener("input", (event) => {
  const query = event.target.value.trim().split("#")[0].trim()
  filterList(list, query)
})

search.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const query = search.value.trim()
    query === "" ? getRandom(list) : getToken(listPanel.innerHTML, query)
    search.value = ""
  }
})

/***************************************************
 *        FUNCTION TO GET RANDOM TOKEN ID
 **************************************************/
function getRandom(lines) {
  const regex = /^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*minted/
  const randomLine = lines[Math.floor(Math.random() * lines.length)]

  const matches = randomLine.match(regex)
  if (!matches) return null

  const id = parseInt(matches[3])
  const randomToken = `#${Math.floor(Math.random() * (id - 1))}`

  console.log("Randomly selected line:", randomLine)
  console.log("Random token:", randomToken)
  getToken(randomLine, randomToken)
}

document.getElementById("randomButton").addEventListener("click", () => {
  getRandom(list)
})

/***************************************************
 *      FUNCTIONS TO GET PREVIOUS/NEXT ID TOKEN
 **************************************************/
function incrementTokenId() {
  let contractData = JSON.parse(localStorage.getItem("contractData"))
  contractData.tokenId = contractData.tokenId
    ? (contractData.tokenId + 1).toString()
    : "1"

  grabData(contractData.tokenId, contractData.contract)
  console.log("Contract:", contractData.contract)
  console.log("Token Id:", contractData.tokenId)
}

function decrementTokenId() {
  let contractData = JSON.parse(localStorage.getItem("contractData"))
  contractData.tokenId = contractData.tokenId
    ? Math.max(contractData.tokenId - 1, 0).toString()
    : "0"

  grabData(contractData.tokenId, contractData.contract)
  console.log("Contract:", contractData.contract)
  console.log("Token Id:", contractData.tokenId)
}

inc.addEventListener("click", incrementTokenId)

document.addEventListener("keypress", (event) => {
  event.key === ">" ? incrementTokenId() : null
})

dec.addEventListener("click", decrementTokenId)

document.addEventListener("keypress", (event) => {
  event.key === "<" ? decrementTokenId() : null
})

/***************************************************
 *          FUNCTION TO SAVE THE OUTPUT
 **************************************************/
async function saveContentAsFile(content, filename) {
  let id = getShortenedId(contractData.tokenId)
  const defaultName = `${contractData.detail[0].replace(
    /\s+/g,
    "-"
  )}#${id}.html`

  let userFilename = filename || defaultName

  userFilename = prompt("Enter a filename:", userFilename)

  if (!userFilename) {
    return
  }
  // Create a Blob containing the content
  const blob = new Blob([content], { type: "text/html" })

  // Create a temporary URL for the Blob
  const url = window.URL.createObjectURL(blob)

  // Create a temporary <a> element to trigger the download
  const link = document.createElement("a")
  link.href = url
  link.download = userFilename

  // Append the <a> element to the document body
  document.body.appendChild(link)

  // Programmatically trigger the click event
  link.click()

  // Clean up
  window.URL.revokeObjectURL(url)
  link.remove()
}

function handleSaveButtonClick() {
  const dynamicContent = frame.contentDocument.documentElement.outerHTML
  clearPanels()
  saveContentAsFile(dynamicContent)
}

save.addEventListener("click", handleSaveButtonClick)

/***************************************************
 *                     EVENTS
 **************************************************/
window.addEventListener("DOMContentLoaded", () => {
  let contractData = JSON.parse(localStorage.getItem("contractData"))
  if (contractData) {
    update(...Object.values(contractData))
  }

  contractData
    ? ((inc.style.display = "block"),
      (dec.style.display = "block"),
      (save.style.display = "block"))
    : ((inc.style.display = "none"),
      (dec.style.display = "none"),
      (save.style.display = "none"))
})

window.addEventListener("load", () => {
  rpcUrl
    ? ((rpcUrlInput.style.display = "none"),
      (instruction.style.display = "none"))
    : ((rpcUrlInput.style.display = "block"),
      (instruction.style.display = "block"),
      (infoBox.style.display = "none"))
})

rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    localStorage.setItem("rpcUrl", rpcUrlInput.value)
    rpcUrlInput.style.display = "none"
    location.reload()
  }
})

document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
    clearLocalStorage()
    location.reload()
  }
})

info.addEventListener("click", () => {
  panel.classList.toggle("active")
  if (panel.classList.contains("active")) {
    listPanel.classList.remove("active")
    overlay.style.display = "block"
    keyShort.style.display = "block"
  } else {
    overlay.style.display = "none"
  }
})

document.querySelector(".search-icon").addEventListener("click", () => {
  listPanel.classList.toggle("active")
  if (listPanel.classList.contains("active")) {
    panel.classList.remove("active")
    overlay.style.display = "block"
  } else {
    overlay.style.display = "none"
  }
})

document.addEventListener("keypress", (event) => {
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault()
    search.focus()
    listPanel.classList.toggle("active")
    if (listPanel.classList.contains("active")) {
      panel.classList.remove("active")
      overlay.style.display = "block"
    } else {
      overlay.style.display = "none"
    }
  }
})

search.addEventListener("focus", () => {
  keyShort.style.display = "none"
})

search.addEventListener("blur", () => {
  keyShort.style.display = "block"
})

search.addEventListener("input", () => {
  if (search.value.trim() !== "") {
    listPanel.classList.add("active")
    panel.classList.remove("active")
    overlay.style.display = "block"
  } else {
    clearPanels()
  }
})

overlay.addEventListener("click", () => {
  clearPanels()
})

/***************************************************
 *         FUNCTION TO UPDATE THE LIST
 **************************************************/
function getContractName(contract) {
  const contractNames = {
    3: "EXP",
    4: "ABXPACE",
    5: "ABXPACE",
    6: "ABXBM",
    7: "BM",
    8: "BM",
    9: "CITIZEN",
    10: "PLOT",
    11: "PLOTII",
    12: "STBYS",
    13: "ATP",
    14: "GRAIL",
    15: "AOI",
    16: "VCA",
    17: "SDAO",
    18: "MINTS",
    19: "TDG",
    20: "VFA",
    21: "UNITLDN",
  }

  return contractNames[contract] ? contractNames[contract] + " " : ""
}

// fetchBloncks()
async function fetchBloncks() {
  const contractMappings = {
    0: (i) => (i < 3 ? 0 : i < 374 ? 1 : 2),
    1: (i) => (i < 3 ? 0 : i < 374 ? 1 : 2),
    2: (i) => (i < 3 ? 0 : i < 374 ? 1 : 2),
    4: (i) => (i < 5 ? 4 : 5),
    5: (i) => (i < 5 ? 4 : 5),
    7: (i) => (i < 1 ? 8 : 7),
    8: (i) => (i < 1 ? 8 : 7),
  }
  let newList = []
  let token

  // CONTRACTS
  for (let n = 19; n < 22; n++) {
    // PROJECT ID
    for (let i = n === 14 ? 1 : 0; i < 1000; i++) {
      if (contractMappings.hasOwnProperty(n)) {
        n = contractMappings[n](i)
      }
      let contractName = getContractName(n)
      try {
        const detail = await contracts[n].projectDetails(i.toString())
        const tkns = await (n === 0 ||
        n === 1 ||
        n === 4 ||
        n === 7 ||
        n === 9 ||
        n === 10 ||
        n === 13 ||
        n === 16 ||
        n === 18
          ? contracts[n].projectTokenInfo(i)
          : contracts[n].projectStateData(i))

        if (tkns.invocations) {
          newList.push(
            `${contractName}${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted`
          )
          token = 0
        } else {
          console.log(`No tokens found for project ${contractName}${i}`)
          token++
          if (token == 5) {
            break
          }
        }
      } catch (error) {
        console.log(`Error fetching data for project ${contractName}${i}`)
        break
      }
    }
    console.log(newList)
  }
}
