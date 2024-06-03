import { ethers } from "./ethers.min.js"
import { contractsData } from "./contracts.js"

const loopInput = document.getElementById("loopInput")
const instruction = document.querySelector(".instruction")
const rpcUrlInput = document.getElementById("rpcUrl")
const frame = document.getElementById("frame")
const infobar = document.querySelector(".infobar")
const info = document.getElementById("info")
const save = document.getElementById("saveBtn")
const dec = document.getElementById("decrementBtn")
const inc = document.getElementById("incrementBtn")
const overlay = document.querySelector(".overlay")
const panel = document.querySelector(".panel")
const listPanel = document.querySelector(".list-panel")
const favPanel = document.querySelector(".fav-panel")
const search = document.getElementById("searchInput")

const rpcUrl = localStorage.getItem("rpcUrl")
const provider = new ethers.JsonRpcProvider(rpcUrl)

const contracts = Object.values(contractsData).map(
  ({ abi, address }) => new ethers.Contract(address, abi, provider)
)
const contractNameMap = {}
const contractIndexMap = {}

Object.keys(contractsData).forEach((key, index) => {
  contractNameMap[index] = key
  contractIndexMap[key] = index
})

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
  twemoji:
    'https://unpkg.com/twemoji@14.0.2/dist/twemoji.min.js" crossorigin="anonymous',
  babylonjs:
    "https://cdnjs.cloudflare.com/ajax/libs/babylonjs/5.0.0/babylon.min.js",
  babylon:
    "https://cdnjs.cloudflare.com/ajax/libs/babylonjs/5.0.0/babylon.min.js",
  js: "",
  svg: "",
  custom: "",
}

const list = [
  "AB0 - Chromie Squiggle / Snowfro - 9998 minted",
  "AB1 - Genesis / DCA - 512 minted",
  "AB2 - Construction Token / Jeff Davis - 500 minted",
  "ABVII3 - Cryptoblots / Daïm Aggott-Hönsch - 1921 minted",
  "ABVII4 - Dynamic Slices / pxlq - 512 minted",
  "ABVII5 - Variant Plan / Jeff Davis - 199 minted",
  "ABVII6 - View Card / Jeff Davis - 41 minted",
  "ABVII7 - Elevated Deconstructions / luxpris - 200 minted",
  "ABVII8 - Singularity / Hideki Tsukamoto - 1024 minted",
  "ABVII9 - Ignition / ge1doot - 512 minted",
  "ABVII10 - NimBuds / Bryan Brinkman - 400 minted",
  "ABVII11 - HyperHash / Beervangeer - 369 minted",
  "ABVII12 - Unigrids / Zeblocks - 421 minted",
  "ABVII13 - Ringers / Dmitri Cherniak - 1000 minted",
  "ABVII14 - Cyber Cities / pxlq - 256 minted",
  "ABVII15 - Utopia / ge1doot - 256 minted",
  "ABVII16 - Color Study / Jeff Davis - 2000 minted",
  "ABVII17 - Spectron / Simon De Mai - 400 minted",
  "ABVII18 - Gen 2 / DCA - 256 minted",
  "ABVII19 - R3sonance / ge1doot - 512 minted",
  "ABVII20 - Sentience / pxlq - 144 minted",
  "ABVII21 - 27-Bit Digital / kai - 1024 minted",
  "ABVII22 - The Eternal Pump / Dmitri Cherniak - 50 minted",
  "ABVII23 - Archetype / Kjetil Golid - 600 minted",
  "ABVII24 - Pixel Glass / kai - 256 minted",
  "ABVII25 - Pathfinders / luxpris - 1000 minted",
  "ABVII26 - EnergySculpture / Beervangeer - 369 minted",
  "ABVII27 - 720 Minutes / Alexis André - 720 minted",
  "ABVII28 - Apparitions / Aaron Penne - 1500 minted",
  "ABVII29 - Inspirals / Radix - 1000 minted",
  "ABVII30 - Hieroglyphs / pxlq - 1000 minted",
  "ABVII31 - Galaxiss / Xenoliss - 600 minted",
  "ABVII32 - Light Beams / Jason Ting - 150 minted",
  "ABVII33 - Empyrean / Generative Artworks - 500 minted",
  "ABVII34 - Ensō / Matto - 1000 minted",
  "ABVII35 - Aerial View / daLenz - 1000 minted",
  "ABVII36 - Gazettes / Redlioneye Gazette - 1024 minted",
  "ABVII37 - Paper Armada / Kjetil Golid - 3000 minted",
  "ABVII38 - ♫ ByteBeats / DADABOTS x KAI - 512 minted",
  "ABVII39 - Synapses / Chaosconstruct - 700 minted",
  "ABVII40 - Algobots / Stina Jones - 500 minted",
  "ABVII41 - Elementals / Michael Connolly - 600 minted",
  "ABVII42 - Void / Alexis André - 500 minted",
  "ABVII43 - Origami Dream / k0ch - 223 minted",
  "ABVII44 - CryptoGodKing / Steve Pikelny - 180 minted",
  "ABVII45 - Gravity Grid / Eliya Stein - 81 minted",
  "ABVII46 - 70s Pop Series One / Daniel Catt - 256 minted",
  "ABVII47 - Asterisms / Falko - 100 minted",
  "ABVII48 - Gen 3 / DCA - 1024 minted",
  "ABVII49 - Dear Hash, / MODNAR WOLF - 365 minted",
  "ABVII50 - The Opera / Luke Shannon - 256 minted",
  "ABVII51 - Stipple Sunsets / Jake Rockland - 360 minted",
  "ABVII52 - Star Flower / Ruben Alexander - 1000 minted",
  "ABVII53 - Subscapes / Matt DesLauriers - 650 minted",
  "ABVII54 - P:X / mightymoose - 384 minted",
  "ABVII55 - Talking Blocks / REMO x DCsan - 512 minted",
  "ABVII56 - Aurora IV / ge1doot - 128 minted",
  "ABVII57 - Rhythm / Jeff Davis - 334 minted",
  "ABVII58 - Color Magic Planets / Bård Ionson - 256 minted",
  "ABVII59 - Watercolor Dreams / NumbersInMotion - 600 minted",
  "ABVII60 - Event Horizon Sunset (Series C) / Jake Brukhman - 500 minted",
  "ABVII61 - 70s Pop Super Fun Summertime Bonus Pack 🍸 / Daniel Catt - 64 minted",
  "ABVII62 - Bubble Blobby / Jason Ting - 500 minted",
  "ABVII63 - Ode to Roy / artplusbrad - 906 minted",
  "ABVII64 - AlgoRhythms / Han x Nicolas Daniel - 1000 minted",
  "ABVII65 - Traversals / Loren Bednar - 150 minted",
  "ABVII66 - Patchwork Saguaros / Jake Rockland - 72 minted",
  "ABVII67 - Petri / Fabin Rasheed - 200 minted",
  "ABVII68 - Messengers / Alexis André - 350 minted",
  "ABVII69 - Abstraction / Hevey - 256 minted",
  "ABVII70 - Antennas / gcrll - 250 minted",
  "ABVII71 - Andradite / Eltono - 222 minted",
  "ABVII72 - Frammenti / Stefano Contiero - 555 minted",
  "ABVII73 - CatBlocks / Kristy Glas - 512 minted",
  "ABVII74 - The Blocks of Art / Shvembldr - 500 minted",
  "ABVII75 - Breathe You / raregonzo - 256 minted",
  "ABVII76 - dino pals / hideo - 100 minted",
  "ABVII77 - Return / Aaron Penne - 300 minted",
  "ABVII78 - Fidenza / Tyler Hobbs - 999 minted",
  "ABVII79 - Space Debris [m'aider] / WhaleStreet x pxlq - 93 minted",
  "ABVII80 - Space Debris [warning] / WhaleStreet x pxlq - 81 minted",
  "ABVII81 - Space Debris [ravaged] / WhaleStreet x pxlq - 32 minted",
  "ABVII82 - Incantation / Eliya Stein - 85 minted",
  "ABVII83 - Panelscape 🅰🅱 / Paolo Tonon - 525 minted",
  "ABVII84 - PrimiDance / wuwa - 256 minted",
  "ABVII85 - 70s Pop Series Two / Daniel Catt - 256 minted",
  "ABVII86 - Stroming / Bart Simons - 256 minted",
  "ABVII87 - Patterns of Life / Vamoss - 512 minted",
  "ABVII88 - Orthogone / Pandelune - 777 minted",
  "ABVII89 - Dreams / Joshua Bagley - 700 minted",
  "ABVII90 - Hashtractors / Darien Brito - 128 minted",
  "ABVII91 - planets / donnoh - 512 minted",
  "ABVII92 - Libertad Parametrizada / zJorge - 243 minted",
  "ABVII93 - Sigils / espina - 133 minted",
  "ABVII94 - Portal / Jeff Davis - 10 minted",
  "ABVII95 - CryptoVenetian / Bright Moments - 1000 minted",
  "ABVII96 - Gravity 12 / Jimmy Herdberg - 512 minted",
  "ABVII97 - [Dis]entanglement / onlygenerated - 730 minted",
  "ABVII98 - sail-o-bots / sturec - 750 minted",
  "ABVII99 - Spaghettification / Owen Moore - 1024 minted",
  "ABVII100 - CENTURY / Casey REAS - 1000 minted",
  "ABVII101 - Enchiridion / Generative Artworks - 1024 minted",
  "ABVII102 - I Saw It in a Dream / Steve Pikelny - 1024 minted",
  "ABVII103 - Octo Garden / Rich Lord - 333 minted",
  "ABVII104 - Eccentrics / Radix - 400 minted",
  "ABVII105 - Gizmobotz / Mark Cotton - 1000 minted",
  "ABVII106 - Radiance / Julien Gachadoat - 512 minted",
  "ABVII107 - Low Tide / Artem Verkhovskiy x Andy Shaw - 373 minted",
  "ABVII108 - Divisions / Michael Connolly - 500 minted",
  "ABVII109 - Speckled Summits / Jake Rockland - 72 minted",
  "ABVII110 - Lava Glow / JEANVASCRIPT - 500 minted",
  "ABVII111 - 70s Pop Ghost Bonus Pack 👻 / Daniel Catt - 64 minted",
  "ABVII112 - Alien Clock / Shvembldr - 362 minted",
  "ABVII113 - celestial cyclones / hideo - 628 minted",
  "ABVII114 - glitch crystal monsters / Alida Sun - 1000 minted",
  "ABVII115 - Dot Grid / TheElephantNL - 1000 minted",
  "ABVII116 - Flowers / RVig - 6158 minted",
  "ABVII117 - Transitions / Jason Ting x Matt Bilfield - 4712 minted",
  "ABVII118 - LeWitt Generator Generator / Mitchell F. Chan - 750 minted",
  "ABVII119 - Ecumenopolis / Joshua Bagley - 676 minted",
  "ABVII120 - Endless Nameless / Rafaël Rozendaal - 1000 minted",
  "ABVII121 - Rinascita / Stefano Contiero - 1111 minted",
  "ABVII122 - Cells / Hevey - 1024 minted",
  "ABVII123 - Nucleus / Hjalmar Åström - 512 minted",
  "ABVII124 - The Liths of Sisyphus / nonfigurativ - 777 minted",
  "ABVII125 - Calendart / steen & n-e-o - 365 minted",
  "ABVII126 - Timepiece / WAWAA - 500 minted",
  "ABVII127 - Labyrometry / Eliya Stein - 800 minted",
  "ABVII129 - Pigments / Darien Brito - 1024 minted",
  "ABVII130 - Obicera / Alexis André - 529 minted",
  "ABVII131 - Scribbled Boundaries / William Tan - 1024 minted",
  "ABVII132 - Tangled / Superblob - 384 minted",
  "ABVII133 - Organized Disruption / Joshua Davis / PrayStation - 1000 minted",
  "ABVII134 - Wave Schematics / luxpris - 400 minted",
  "ABVII135 - Brushpops / Matty Mariansky - 1000 minted",
  "ABVII136 - SpiroFlakes / Alexander Reben - 1024 minted",
  "ABVII137 - Alien Insects / Shvembldr - 1000 minted",
  "ABVII138 - Geometry Runners / Rich Lord - 1000 minted",
  "ABVII139 - Eccentrics 2: Orbits / Radix - 500 minted",
  "ABVII140 - Good Vibrations / Aluan Wang - 1024 minted",
  "ABVII141 - Rapture / Thomas Lin Pedersen - 1000 minted",
  "ABVII142 - Unknown Signals / k0ch - 1000 minted",
  "ABVII143 - phase / Loren Bednar - 1024 minted",
  "ABVII144 - autoRAD / sgt_slaughtermelon & Tartaria Archivist - 1000 minted",
  "ABVII145 - Beatboxes / Zeblocks - 841 minted",
  "ABVII146 - Neighborhood / Jeff Davis - 312 minted",
  "ABVII147 - Trossets / Anna Carreras - 1000 minted",
  "ABVII149 - Dot Matrix Gradient Study / Jake Rockland - 540 minted",
  "ABVII150 - PrimiLife / wuwa - 1024 minted",
  "ABVII151 - High Tide / Artem Verkhovskiy x Andy Shaw - 745 minted",
  "ABVII152 - Fake Internet Money / Steve Pikelny - 1000 minted",
  "ABVII153 - We / Vamoss - 1024 minted",
  "ABVII154 - Warp / espina - 444 minted",
  "ABVII156 - Moments / r4v3n - 1024 minted",
  "ABVII157 - UltraWave 369 / Beervangeer - 369 minted",
  "ABVII158 - a heart and a soul / Roman Janajev - 1024 minted",
  "ABVII159 - Fragments of an Infinite Field / Monica Rizzolli - 1024 minted",
  "ABVII160 - Seadragons / Marcin Ignac - 1000 minted",
  "ABVII161 - spawn / john provencher - 1001 minted",
  "ABVII162 - Democracity / Generative Artworks - 1024 minted",
  "ABVII163 - Meridian / Matt DesLauriers - 1000 minted",
  "ABVII164 - Phototaxis / Casey REAS - 1000 minted",
  "ABVII165 - Gravity 16 / Jimmy Herdberg - 1024 minted",
  "ABVII166 - Ouroboros / Shane Rich | raregonzo - 1024 minted",
  "ABVII167 - Blaschke Ballet / NumbersInMotion - 600 minted",
  "ABVII168 - Bloom / Blockchance - 285 minted",
  "ABVII169 - Augmented Sequence / toiminto - 1024 minted",
  "ABVII170 - Chroma Theory / Paweł Dudko - 106 minted",
  "ABVII171 - Himinn / Sarah Ridgley - 536 minted",
  "ABVII172 - Rituals - Venice / Aaron Penne x Boreta - 1000 minted",
  "ABVII173 - Skulptuur / Piter Pasma - 1000 minted",
  "ABVII174 - Letters to My Future Self / Ryan Struhl - 1000 minted",
  "ABVII175 - mono no aware / ixnayokay - 414 minted",
  "ABVII177 - Space Birds / Mark Cotton - 48 minted",
  "ABVII178 - Beauty in the Hurting / Ryan Green - 1024 minted",
  "ABVII179 - 8 / Bård Ionson - 128 minted",
  "ABVII180 - mecha suits / hideo - 256 minted",
  "ABVII181 - FOCUS / Matto - 567 minted",
  "ABVII182 - Amoeba / last even - 213 minted",
  "ABVII183 - Quarantine / Owen Moore - 128 minted",
  "ABVII184 - Swing / Eltono - 310 minted",
  "ABVII185 - little boxes on the hillsides, child / LIA - 777 minted",
  "ABVII187 - THE SOURCE CoDE / Ofir Liberman - 180 minted",
  "ABVII188 - Blockbob Rorschach / eBoy - 1024 minted",
  "ABVII189 - CryptoNewYorker / Qian Qian - 1000 minted",
  "ABVII190 - Mental pathways / fabianospeziari x donnoh - 128 minted",
  "ABVII191 - 444(4) / Shvembldr - 444 minted",
  "ABVII192 - Recursion / Hevey - 256 minted",
  "ABVII193 - Murano Fantasy / Pandelune - 41 minted",
  "ABVII194 - Rotae / Nadieh Bremer - 529 minted",
  "ABVII195 - Paramecircle / Alexander Reben (artBoffin) - 76 minted",
  "ABVII196 - Aithérios / Jorge Ledezma - 961 minted",
  "ABVII197 - Parade / Loren Bednar - 400 minted",
  "ABVII198 - Coquina / Jacob Gold - 387 minted",
  "ABVII199 - Prismatic / Eliya Stein - 218 minted",
  "ABVII200 - Saturazione / Stefano Contiero - 111 minted",
  "ABVII201 - 24 Heures / Alexis André - 137 minted",
  "ABVII202 - Beauty of Skateboarding / JEANVASCRIPT - 360 minted",
  "ABVII203 - Scoundrels / Kristy Glas - 2048 minted",
  "ABVII204 - Edifice / Ben Kovach - 976 minted",
  "ABVII205 - Placement / Cooper Jamieson - 500 minted",
  "ABVII206 - Asemica / Emily Edelman - Dima Ofman - Andrew Badr - 980 minted",
  "ABVII207 - Through the Window / Reva - 500 minted",
  "ABVII208 - Reflection / Jeff Davis - 100 minted",
  "ABVII209 - Autology / steganon - 1024 minted",
  "ABVII210 - Nebula / RVig - 154 minted",
  "ABVII211 - Freehand / WAWAA - 222 minted",
  "ABVII212 - Dive / Rafaël Rozendaal - 333 minted",
  "ABVII213 - Loom / Anna Lucia - 200 minted",
  "ABVII214 - Bent / ippsketch - 1023 minted",
  "ABVII215 - Gazers / Matt Kane - 1000 minted",
  "ABVII216 - Electriz / Che-Yu Wu - 910 minted",
  "ABVII217 - Paths / Darien Brito - 523 minted",
  "ABVII218 - Squares and Triangles / Maksim Hapeyenka - 80 minted",
  "ABVII219 - Time Atlas 🌐 / Paolo Tonon - 412 minted",
  "ABVII220 - geVIENNAratives / CryptoWiener - 2048 minted",
  "ABVII221 - Spiromorphs / SAB - 200 minted",
  "ABVII222 - Pieces of Me / r4v3n - 222 minted",
  "ABVII223 - Dream Engine / REMO x DCsan - 476 minted",
  "ABVII224 - Tropism / Neel Shivdasani - 500 minted",
  "ABVII225 - Vortex / Jen Stark - 1000 minted",
  "ABVII226 - Getijde / Bart Simons - 222 minted",
  "ABVII227 - Kai-Gen / Takeshi Murata, Christopher Rutledge, J. Krispy - 2048 minted",
  "ABVII228 - Incomplete Control / Tyler Hobbs - 100 minted",
  "ABVII229 - Attraction / Jos Vromans - 444 minted",
  "ABVII230 - Glow / Jason Ting - 500 minted",
  "ABVII231 - Cushions / Devi Parikh - 200 minted",
  "ABVII232 - Jiometory No Compute - ジオメトリ ハ ケイサンサレマセン / Samsy - 1024 minted",
  "ABVII233 - Chimera / mpkoz - 987 minted",
  "ABVII234 - The Wrapture / Dmitri Cherniak - 50 minted",
  "ABVII235 - Maps for grief / Louis-André Labadie - 500 minted",
  "ABVII236 - Summoning Ritual / PZS - 110 minted",
  "ABVII237 - Time Squared / steen x n-e-o - 212 minted",
  "ABVII238 - AlphaModica / Danooka - 137 minted",
  "ABVII239 - Synesthesia / PLS&TY - 123 minted",
  "ABVII240 - Pizza 1o1 / KALA - 200 minted",
  "ABVII241 - Maps / john provencher - 90 minted",
  "ABVII242 - Two Mathematicians / BY MA - 300 minted",
  "ABVII244 - InC / hex6c - 64 minted",
  "ABVII245 - Freeplan / xnmtrc - 128 minted",
  "ABVII246 - Stations / Fernando Jerez - 900 minted",
  "ABVII247 - Heavenly Bodies / Ento - 120 minted",
  "ABVII248 - HashCrash / Beervangeer - 369 minted",
  "ABVII249 - Facets / conundrumer - 267 minted",
  "ABVII250 - Cosmic Reef / Leo Villareal - 1024 minted",
  "ABVII251 - Undercover / artplusbrad - 91 minted",
  "ABVII252 - Roamings / Luca Ionescu - 128 minted",
  "ABVII253 - Legends of Metaterra / hideo - 1024 minted",
  "ABVII254 - Fernweh / oliveskin - 121 minted",
  "ABVII255 - Screens / Thomas Lin Pedersen - 1000 minted",
  "ABVII256 - Spotlight / Joshua Bagley - 625 minted",
  "ABVII257 - Machine Comics / Roni Block - 96 minted",
  "ABVII258 - Cosmodesias / Santiago - 256 minted",
  "ABVII259 - Masonry / Eric Davidson - 200 minted",
  "ABVII260 - Non Either / Rafaël Rozendaal - 100 minted",
  "ABVII261 - Para Bellum  / Matty Mariansky - 1000 minted",
  "ABVII262 - Haywire Café  / Jess Hewitt - 256 minted",
  "ABVII263 - Click / Ivan Dianov - 1024 minted",
  "ABVII264 - Thereidoscope / Daïm Aggott-Hönsch - 630 minted",
  "ABVII265 - Tentura / Stranger in the Q - 777 minted",
  "ABVII266 - Exhibition: 3291 / cryptobauhaus - 400 minted",
  "ABVII267 - entretiempos / Marcelo Soria-Rodríguez - 1000 minted",
  "ABVII268 - PrimiEnd / wuwa - 256 minted",
  "ABVII269 - Lacunae / James Dalessandro - 111 minted",
  "ABVII270 - Foliage / Falko - 250 minted",
  "ABVII271 - Time travel in a subconscious mind / Jimmy Herdberg - 256 minted",
  "ABVII272 - pseudomods / erin bee - 808 minted",
  "ABVII273 - Silhouette / Niel de la Rouviere - 400 minted",
  "ABVII274 - Isodream / henrysdev & AMNDA - 186 minted",
  "ABVII275 - Quantum Collapses / Insigħt - 404 minted",
  "ABVII276 - Strata / Vebjørn Isaksen - 650 minted",
  "ABVII277 - Perpetua / Punch Card Collective - 320 minted",
  "ABVII278 - Liquid Ruminations / Eliya Stein - 1024 minted",
  "ABVII279 - Neophyte MMXXII / Sterling Crispin - 168 minted",
  "ABVII280 - Window / Jan Robert Leegte - 404 minted",
  "ABVII281 - Automatism / Yazid - 426 minted",
  "ABVII282 - Memories of Qilin / Emily Xie - 1024 minted",
  "ABVII283 - OnChainChain / Rizzle, Sebi, Miguelgarest - 2000 minted",
  "ABVII284 - Ancient Courses of Fictional Rivers / Robert Hodgin - 1000 minted",
  "ABVII285 - Supermental / Rosenlykke - 400 minted",
  "ABVII286 - Drifting / Simon De Mai - 360 minted",
  "ABVII287 - Zoologic / ixnayokay - 300 minted",
  "ABVII288 - Mazinaw / Eric De Giuli - 256 minted",
  "ABVII289 - AlgoBeats / Han x Nicolas Daniel - 1000 minted",
  "ABVII290 - Where The Wind Blows / MODNAR WOLF - 170 minted",
  "ABVII291 - APEX / phenomena - 377 minted",
  "ABVII292 - Corners / Rafaël Rozendaal - 64 minted",
  "ABVII293 - Túnel Dimensional / Autonomoses - 320 minted",
  "ABVII294 - Alien DNA / Shvembldr - 512 minted",
  "ABVII295 - Invasion Percolation / BarabásiLab - 550 minted",
  "ABVII296 - Flux / Owen Moore - 500 minted",
  "ABVII297 - Center Pivot / Craig Hughes & Eric Hughes - 222 minted",
  "ABVII298 - Mind Maze / Parse/Error - 333 minted",
  "ABVII300 - Assemblage / SAB & K2xL - 361 minted",
  "ABVII301 - Hōrō / makio135 - 400 minted",
  "ABVII302 - Primordial / Jacob Gold - 333 minted",
  "ABVII303 - Imperfections / Kalis - 450 minted",
  "ABVII304 - Anticyclone / William Mapan - 800 minted",
  "ABVII305 - Zupermat / 0xphiiil - 200 minted",
  "ABVII307 - Ode to Penrose / uMathA - 300 minted",
  "ABVII308 - Cattleya / Ben Snell - 300 minted",
  "ABVII309 - Colorspace / Tabor Robak - 600 minted",
  "ABVII310 - 100 PRINT / Ben Kovach - 100 minted",
  "ABVII311 - Faceless / greatjones - 250 minted",
  "ABVII312 - Daisies / Natthakit Susanthitanon (NSmag) - 200 minted",
  "ABVII313 - Photon's Dream / Harvey Rayner | patterndotco - 404 minted",
  "ABVII314 - Divenire / Emanuele Pasin - 222 minted",
  "ABVII315 - Rotor / Sebastián Brocher (CryptoArte) - 285 minted",
  "ABVII316 - Maps of Nothing / Steve Pikelny - 625 minted",
  "ABVII317 - the spring begins with the first rainstorm / Cole Sternberg - 487 minted",
  "ABVII318 - Collapsed Sequence / toiminto - 400 minted",
  "ABVII319 - Assorted Positivity / steganon - 400 minted",
  "ABVII320 - montreal friend scale / amon tobin - 500 minted",
  "ABVII321 - Fermented Fruit / cyberia - 140 minted",
  "ABVII322 - Gels / Jason Brown - Shawn Douglas - 190 minted",
  "ABVII323 - GHOST IN THE CODE / Kazuhiro Tanimoto - 404 minted",
  "ABVII324 - Woah La Coaster / Blockwares - 199 minted",
  "ABVII326 - Total Strangers / Artem Verkhovskiy x Andy Shaw - 555 minted",
  "ABVII327 - 3:19 / Santiago. - 19 minted",
  "ABVII328 - Sudfah / Melissa Wiederrecht - 401 minted",
  "ABVII329 - Latent Spirits / Robert Hodgin - 400 minted",
  "ABVII330 - Squares / Martin Grasser - 196 minted",
  "ABVII331 - Metropixeland / Fernando Jerez - 450 minted",
  "ABVII332 - Steps / johan - 360 minted",
  "ABVII333 - Alan Ki Aankhen / Fahad Karim - 500 minted",
  "ABVII334 - Running Moon / Licia He - 500 minted",
  "ABVII335 - Scribblines / Orpheusk - 256 minted",
  "ABVII336 - Polychrome Music / Rafaël Rozendaal & Danny Wolfers (Legowelt) - 400 minted",
  "ABVII337 - FAKE IT TILL YOU MAKE IT / Maya Man - 700 minted",
  "ABVII338 - undead wyverns / hideo - 100 minted",
  "ABVII339 - Ieva / Shvembldr - 500 minted",
  "ABVII340 - Vahria / Darien Brito - 299 minted",
  "ABVII341 - RASTER / itsgalo - 400 minted",
  "ABVII342 - Being Yourself While Fitting In / LIA - 55 minted",
  "ABVII343 - Balletic / Motus Art - 200 minted",
  "ABVII344 - Glass / Eric De Giuli - 300 minted",
  "ABVII345 - 3 Minute Meditations / thetechnocratic - 159 minted",
  "ABVII346 - 80s Pop Variety Pack - for experts only 🕹 / Daniel Catt - 366 minted",
  "ABVII347 - Avalon / r0zk0 - 208 minted",
  "ABVII348 - CryptoCountries: The Unpublished Archiv…l World Traveler / Michael G Devereux - 67 minted",
  "ABVII349 - Totem of Taste / Hannah Yan - 128 minted",
  "ABVII350 - Departed / Alexis André - 350 minted",
  "ABVII351 - Staccato / Philip Bell - 200 minted",
  "ABVII352 - The Inner World / Dominikus - 400 minted",
  "ABVII353 - Pointila / Phaust - 200 minted",
  "ABVII354 - Interferences / Juan Pedro Vallejo - 256 minted",
  "ABVII355 - Thoughts of Meadow / Eric Davidson - 150 minted",
  "ABVII356 - Essenza / Stefano Contiero - 444 minted",
  "ABVII357 - D-D-Dots / tuplart - 160 minted",
  "ABVII358 - Arcadia / Zachariah Watson - 256 minted",
  "ABVII359 - Ode to Untitled / artplusbrad - 240 minted",
  "ABVII361 - flora, fauna, false gods & floods / Ryan Green - 400 minted",
  "ABVII362 - Erratic / Owen Moore - 400 minted",
  "ABVII364 - Act of Emotion / Kelly Milligan - 400 minted",
  "ABVII365 - Stains on a Canvas / Omar Lobato - 300 minted",
  "ABVII366 - Sandaliya / Melissa Wiederrecht - 205 minted",
  "ABVII367 - Fontana / Harvey Rayner | patterndotco - 500 minted",
  "ABVII368 - Primitives / Aranda\\Lasch - 400 minted",
  "ABVII369 - CENTURY 2052 / Casey REAS - 50 minted",
  "ABVII370 - Rectangles (for Herbert) / Jeff Davis - 500 minted",
  "ABVII371 - JPEG / Jan Robert Leegte - 275 minted",
  "ABVII373 - Intersections / Rafaël Rozendaal - 300 minted",
  "ABVIII374 - Ottocento / Berubara - 35 minted",
  "ABVIII375 - Wabi Sabi / Kazuhiro Tanimoto - 205 minted",
  "ABVIII376 - Tide Predictor / LoVid - 400 minted",
  "ABVIII377 - Ingress / Paweł Dudko - 256 minted",
  "ABVIII378 - Fleur / AnaPet - 300 minted",
  "ABVIII379 - ORI / James Merrill - 450 minted",
  "ABVIII380 - Seedlings / VES3L - 200 minted",
  "ABVIII381 - Structures / Hevey - 256 minted",
  "ABVIII382 - Metaphysics / Jinyao Lin - 200 minted",
  "ABVIII383 - Pre-Process / Casey REAS - 120 minted",
  "ABVIII384 - VOXΞL / JEANVASCRIPT - 250 minted",
  "ABVIII385 - Dipolar / Junia Farquhar - 256 minted",
  "ABVIII386 - Ego Death / electralina - 222 minted",
  "ABVIII387 - Pointers / Steve Pikelny - 100 minted",
  "ABVIII388 - Your Story / encapsuled - 102 minted",
  "ABVIII389 - Miragem / Third Vision - 256 minted",
  "ABVIII390 - Imposter Syndrome / ippsketch - 100 minted",
  "ABVIII391 - Contrast Agent / Tim Richardson + Sean Zellmer - 14 minted",
  "ABVIII392 - Hyper Drive: A-Side / Ryan Bell - 200 minted",
  "ABVIII393 - Race Condition / Jonas Lund - 325 minted",
  "ABVIII394 - Volute / RVig - 200 minted",
  "ABVIII395 - Implications / ixnayokay - 300 minted",
  "ABVIII396 - Good, Computer / Dean Blacc - 75 minted",
  "ABVIII397 - Through Curved Air / Jacob Gold - 186 minted",
  "ABVIII398 - Libra / Cooper Jamieson - 50 minted",
  "ABVIII399 - The Field / Beervangeer - 369 minted",
  "ABVIII400 - Such A Lovely Time / petitsapin - 325 minted",
  "ABVIII401 - Aragnation / Devi Parikh and Abhishek Das - 128 minted",
  "ABVIII404 - Ad Extremum Terrae / uMathA - 200 minted",
  "ABVIII405 - chaos comes with the summer haze / Cole Sternberg - 163 minted",
  "ABVIII406 - WaVyScApE / Holger Lippmann - 315 minted",
  "ABVIII407 - The Harvest / Per Kristian Stoveland - 400 minted",
  "ABVIII408 - NimTeens / Bryan Brinkman - 400 minted",
  "ABVIII409 - Tout tracé / Florian Zumbrunn - 300 minted",
  "ABVIII410 - Jenim / Orr Kislev & Alona Rodeh - 135 minted",
  "ABVIII411 - Symbol 1 / Emily Weil - 153 minted",
  "ABVIII412 - Cerebellum / Laya Mathikshara & Santiago - 300 minted",
  "ABVIII413 - Longing / phenomena - 247 minted",
  "ABVIII414 - KARMA / KALA - 33 minted",
  "ABVIII415 - Renders Game / MountVitruvius - 325 minted",
  "ABVIII416 - Calian / Eric De Giuli - 256 minted",
  "ABVIII417 - Ceramics / Charlotte Dann - 300 minted",
  "ABVIII418 - Neural Sediments / Eko33 - 300 minted",
  "ABVIII419 - SL/CE / Stranger in the Q - 40 minted",
  "ABVIII420 - Coalition / Generative Artworks - 37 minted",
  "ABVIII421 - Rippling / Yi-Wen Lin - 128 minted",
  "ABVIII422 - SKEUOMORPHS / itsgalo - 300 minted",
  "ABVIII423 - Solar Transits / Robert Hodgin - 400 minted",
  "ABVIII424 - Worlds Within / Jason Ting - 256 minted",
  "ABVIII425 - Mellifera / artplusbrad - 58 minted",
  "ABVIII426 - Cargo / Kim Asendorf - 1000 minted",
  "ABVIII427 - transparency / usnea - 29 minted",
  "ABVIII428 - Memories of Digital Data / Kazuhiro Tanimoto - 450 minted",
  "ABVIII429 - ilumz / Wolffia Inc. & Motus Art - 57 minted",
  "ABVIII430 - Fushi No Reality - フシノゲンジツ / Samsy - 255 minted",
  "ABVIII431 - (Dis)connected / Tibout Shaik - 48 minted",
  "ABVIII432 - Divergence / Loren Bednar - 100 minted",
  "ABVIII433 - Still Moving / Nathaniel Stern and Sasha Stiles - 240 minted",
  "ABVIII434 - Voyager / DisruptedStar - 300 minted",
  "ABVIII435 - Flows / ryley-o.eth - 100 minted",
  "ABVIII436 - UMK / Fernando Jerez - 762 minted",
  "ABVIII437 - Nära / Tengil - 280 minted",
  "ABVIII438 - Subtle / willstall - 256 minted",
  "ABVIII439 - Enigma / RalenArc - 32 minted",
  "ABVIII440 - Augury / LoVid - 126 minted",
  "ABVIII441 - Net Net Net / ilithya x Erin Wajufos - 33 minted",
  "ABVIII442 - Systems Madness / Claudia Hart and Andrew Blanton - 42 minted",
  "ABVIII443 - Dendro / Vebjørn Isaksen - 275 minted",
  "ABVIII444 - Meaningless / Amy Goodchild - 270 minted",
  "ABVIII445 - Assembly / Tezumie - 86 minted",
  "ABVIII446 - Invisibles / Ismahelio - 200 minted",
  "ABVIII447 - Semblance / rahul iyer - 185 minted",
  "ABVIII448 - Bright / Heeey - 360 minted",
  "ABVIII449 - Speak To Me / Lisa Orth - 290 minted",
  "ABVIII450 - Overload / Shvembldr - 200 minted",
  "ABVIII451 - Backwards / Asaf Slook - 300 minted",
  "ABVIII452 - Muttenz / wuwa - 67 minted",
  "ABVIII453 - Crypt / The Cyclops Group - 54 minted",
  "ABVIII454 - Flourish / Sterling Crispin - 270 minted",
  "ABVIII455 - Human Unreadable / Operator - 400 minted",
  "ABVIII456 - Spaghetti Bones / Joshua Bagley - 600 minted",
  "ABVIII457 - Dopamine Machines / Steve Pikelny - 777 minted",
  "ABVIII458 - Mycelia / JMY - 200 minted",
  "ABVIII459 - Seasky / Ralgo - 100 minted",
  "ABVIII460 - Exstasis / Grant Oesterling - 111 minted",
  "ABVIII461 - Sonoran Roadways / Jake Rockland - 54 minted",
  "ABVIII462 - Gumbo / Mathias Isaksen - 400 minted",
  "ABVIII463 - l.o / Night Sea - 175 minted",
  "ABVIII464 - Kubikino / Carolina Melis - 320 minted",
  "ABVIII465 - Escherly Seeds / Martijn Cohen - 28 minted",
  "ABVIII466 - Torrent / Jeres - 300 minted",
  "ABVIII467 - Glasshouse INAT / Aleksandra Jovanić - 19 minted",
  "ABVIII468 - Woman, Life, Freedom / Armaghan Fatemi - 36 minted",
  "ABVIII469 - Twos / Emily Edelman - 64 minted",
  "ABVIII470 - Forecast / Manuel Larino - 365 minted",
  "ABVIII471 - This Is Not A Rock / Nicole Vella - 350 minted",
  "ABVIII472 - because unless until / ixnayokay - 650 minted",
  "ABVIII473 - Fluiroso / Sebastián Brocher (CryptoArte) - 105 minted",
  "ABVIII474 - Lumina / DistCollective - 80 minted",
  "ABVIII475 - Recollection / Robert Hodgin - 166 minted",
  "ABVIII476 - Life and Love and Nothing / Nat Sarkissian - 200 minted",
  "ABVIII477 - siempre en mí, siempre en ti / Marcelo Soria-Rodríguez - 200 minted",
  "ABVIII478 - Lucky Clover / Sputniko! - 40 minted",
  "ABVIII479 - Bakhoor Assandal / Melissa Wiederrecht - 200 minted",
  "ABVIII480 - Axo / jiwa - 400 minted",
  "ABVIII481 - Immaterial / Bjørn Staal - 280 minted",
  "ABVIII482 - Trichro-matic / MountVitruvius - 600 minted",
  "ABVIII483 - Naïve / Olga Fradina - 300 minted",
  "ABVIII484 - Blind Spots / Shaderism - 400 minted",
  "ABVIII486 - Proscenium / remnynt - 400 minted",
  "ABVIII487 - Cytographia / Golan Levin - 418 minted",
  "ABVIII488 - Växt / Tengil - 150 minted",
  "ABVIII489 - Balance / Kelly Milligan x Amber Vittoria - 250 minted",
  "ABVIII490 - Twist / Rafaël Rozendaal - 250 minted",
  "ABVIII493 - Melancholic Magical Maiden / Emi Kusano - 300 minted",
  "EXP0 - Friendship Bracelets / Alexis André - 38664 minted",
  "EXP1 - Marfa Yucca / Daniel Calderon Arenas - 390 minted",
  "EXP2 - marfaMESH / Harvey Rayner | patterndotco - 343 minted",
  "ABXPACE0 - Petro National / John Gerrard - 196 minted",
  "ABXPACE1 - Floating World Genesis / A.A. Murakami - 250 minted",
  "ABXPACE2 - QWERTY / Tara Donovan - 500 minted",
  "ABXPACE3 - Contractions / Loie Hollowell - 280 minted",
  "ABXPACE4 - New Worlds / Robert Whitman - 500 minted",
  "ABXPACEII5 - PRELUDES / Trevor Paglen - 250 minted",
  "ABXPACEII6 - World Flag / John Gerrard - 195 minted",
  "ABXPACEII7 - Schema / DRIFT with Jeff Davis - 300 minted",
  "ABXBM0 - Metropolis / mpkoz - 940 minted",
  "ABS0 - Misbah / Melissa Wiederrecht - 55 minted",
  "ABSI0 - One More Day / Aaron Penne - 50 minted",
  "ABXBM1 - 923 EMPTY ROOMS / Casey REAS - 924 minted",
  "BM1 - Stellaraum / Alida Sun - 66 minted",
  "BM2 - Parnassus / mpkoz - 100 minted",
  "BM3 - Inflection / Jeff Davis - 96 minted",
  "BM4 - Kaleidoscope / Loren Bednar - 100 minted",
  "BM5 - Lux / Jason Ting - 64 minted",
  "BM6 - Network C / Casey REAS - 100 minted",
  "BM7 - The Nursery / Sputniko! - 100 minted",
  "BM8 - FOLIO / Matt DesLauriers - 100 minted",
  "BM9 - Inprecision / Thomas Lin Pedersen - 100 minted",
  "BM10 - Off Script / Emily Xie - 100 minted",
  "BM11 - Formation / Jeff Davis - 100 minted",
  "BM12 - translucent panes / fingacode - 431 minted",
  "BM13 - Wirwar / Bart Simons - 100 minted",
  "BM14 - KERNELS / Julian Hespenheide - 190 minted",
  "BM15 - Brise Soleil  / Jorge Ledezma - 100 minted",
  "BM16 - Orchids / Luke Shannon - 400 minted",
  "BM17 - Rubicon / Mario Carrillo - 266 minted",
  "BM18 - nth culture / fingacode - 100 minted",
  "BM19 - Pohualli / Fahad Karim - 100 minted",
  "BM20 - Underwater / Monica Rizzolli - 100 minted",
  "BM21 - Infinito / Stefano Contiero - 100 minted",
  "BM22 - Bosque de Chapultepec / Daniel Calderon Arenas - 100 minted",
  "BM23 - ToSolaris / Iskra Velitchkova - 100 minted",
  "BM24 - Glaciations / Anna Lucia - 100 minted",
  "BM25 - 1935 / William Mapan - 100 minted",
  "BM26 - lūmen / p1xelfool - 100 minted",
  "BM27 - lo que no está / Marcelo Soria-Rodríguez - 100 minted",
  "BM28 - 100 Untitled Spaces / Snowfro - 100 minted",
  "BM29 - 100 Sunsets / Zach Lieberman - 100 minted",
  "BM30 - Transcendence / Jeff Davis - 10 minted",
  "BM31 - Caminos / Juan Rodríguez García - 1000 minted",
  "BM32 - Color Streams / r4v3n - 370 minted",
  "BM33 - Limn / RalenArc - 200 minted",
  "BM34 - Velum / Harvey Rayner | patterndotco - 100 minted",
  "BM35 - Cage / John Provencher - 162 minted",
  "BM36 - Sunset from the Bluffs / Nat Sarkissian - 100 minted",
  "BM37 - Intricada / Camille Roux - 270 minted",
  "BM38 - Passages / Aaron Penne x Boreta - 100 minted",
  "BM39 - Cantera / mrkswcz - 100 minted",
  "BM40 - immprint / imma - 315 minted",
  "BM41 - Agar / Emily Edelman - 100 minted",
  "BM42 - L'Appel / Alexis André - 100 minted",
  "BM43 - LED / Jeff Davis - 100 minted",
  "BM44 - Event Horizon / Kim Asendorf - 100 minted",
  "BM45 - Orbifold / Kjetil Golid - 100 minted",
  "BM46 - FULL_SPECTRUM / Lars Wander - 100 minted",
  "BM47 - Sparkling Goodbye / Licia He - 100 minted",
  "BM48 - Undercurrents / Melissa Wiederrecht - 100 minted",
  "BM49 - Margaret / qubibi - 100 minted",
  "BM50 - Nature finds a way. / Spongenuity. - 100 minted",
  "BM51 - Marching Resonances / Shunsuke Takawo - 100 minted",
  "BM52 - Kumono Shingou / zancan - 100 minted",
  "BM53 - Hanabi / ykxotkx - 82 minted",
  "BM54 - Square Symphony / Okazz - 100 minted",
  "BM55 - Public Art / 0xhaiku - 94 minted",
  "BM56 - Dream Logic / Ngozi - 100 minted",
  "BM57 - Epiphanies / Jimena Buena Vida - 201 minted",
  "BM58 - If You Could Do It All Again / Nicole Vella - 120 minted",
  "BM59 - Esquejes / Pedro Falco - 169 minted",
  "BM60 - 1 + 1 = 3 / Stefano Contiero - 112 minted",
  "BM61 - Apophenies / Cory Haber - 100 minted",
  "BM62 - Vertigo Las Luces / Guido Corallo - 79 minted",
  "BM63 - Cuadro / Jeff Davis - 89 minted",
  "BM64 - Dolor Gravitacional / Jorge Ledezma - 63 minted",
  "BM65 - Subtraction, Reconfiguration / Juan Pedro Vallejo - 100 minted",
  "BM66 - Delirium Blooms / Leonardo Solaas - 89 minted",
  "BM67 - KARNE / Lolo Armdz - 70 minted",
  "BM68 - BLINK / Patricio Gonzalez Vivo & Jen Lowe - 70 minted",
  "BM69 - Souls from Gaia / Tamara Moura Costa - 61 minted",
  "BM70 - Desde Lejos / Thomas Noya - 70 minted",
  "BM71 - Liminal / Julien Espagnon - 85 minted",
  "BM72 - SPINᵗ / NumbersInMotion - 52 minted",
  "BM73 - Topology / Rikard Lindström - 29 minted",
  "BM74 - Descent / Andreas Gysin - 100 minted",
  "BM75 - Enlace / Aranda/Lasch - 100 minted",
  "BM76 - Odysseys / Florian Zumbrunn - 100 minted",
  "BM77 - a temporary arrangement of material / Martin Grasser - 100 minted",
  "BM78 - Lightbreak / Luke Shannon - 100 minted",
  "BM79 - Figs. / Sarah Ridgley - 100 minted",
  "BM80 - Brava / Anna Carreras - 100 minted",
  "BM81 - The Destination / Camille Roux x Matthieu Segret - 100 minted",
  "BM82 - Encore / rudxane - 100 minted",
  "BM83 - Notes / Maya Man - 100 minted",
  "BM84 - Culmination / Jeff Davis - 100 minted",
  "BM85 - 89 Bright x Empty Rooms / Casey REAS - 89 minted",
  "BMF0 - Finale / Bright Moments - 1000 minted",
  "CITIZEN0 - CryptoGalactican / Qian Qian - 1000 minted",
  "CITIZEN3 - CryptoBerliner / Qian Qian - 1000 minted",
  "CITIZEN4 - CryptoLondoner / Qian Qian - 1000 minted",
  "CITIZEN5 - CryptoMexa / Qian Qian - 1000 minted",
  "CITIZEN6 - CryptoTokyoite / Qian Qian - 1000 minted",
  "CITIZEN7 - CryptoPatagonian / Qian Qian - 1000 minted",
  "CITIZEN8 - CryptoParisian / Qian Qian - 1000 minted",
  "CITIZEN9 - CryptoVenezian / Qian Qian - 1000 minted",
  "PLOT0 - Streamlines / NumbersInMotion - 500 minted",
  "PLOT1 - Implosion / Generative Artworks - 256 minted",
  "PLOT2 - Really Random Rock / DCA - 350 minted",
  "PLOT3 - Diatom / Joshua Schachter - 102 minted",
  "PLOT4 - Lines Walking / Lars Wander - 44 minted",
  "PLOT5 - Coalescence / Beervangeer - 135 minted",
  "PLOT6 - Shattered / @greweb - 100 minted",
  "PLOT7 - Brickwork / WAWAA - 146 minted",
  "PLOT8 - spectral / oppos - 63 minted",
  "PLOT9 - Delicate Chaos / moving.drawing - 168 minted",
  "PLOT10 - Azulejos / PZS - 90 minted",
  "PLOT11 - Petri Dish / James Dalessandro - 38 minted",
  "PLOT12 - Pseudofigure / conundrumer - 144 minted",
  "PLOT13 - Reservation / Generative Artworks - 50 minted",
  "PLOT14 - Endless (5,607,250 to Infinity) / Modnar Wolf x NumbersInMotion - 2560 minted",
  "PLOT15 - Shields / r4v3n - 100 minted",
  "PLOT16 - Structures / Julien Gachadoat - 256 minted",
  "PLOT17 - Happenstance I: CTC / Generative Artworks - 30 minted",
  "PLOT18 - Beginnings / 0xPhiiil - 41 minted",
  "PLOT19 - Scribbled Daydreams / minimizer - 200 minted",
  "PLOT20 - Generative Alchemy / Eliya Stein - 39 minted",
  "PLOT21 - Scratch / Matto - 64 minted",
  "PLOT22 - Stroomlijn / Bart Simons - 39 minted",
  "PLOT24 - Lissajous / Michael G Devereux - 15 minted",
  "PLOT25 - Happenstance II: Framed / Generative Artworks - 18 minted",
  "PLOT26 - Field Recordings / Jacob Gold - 16 minted",
  "PLOTII0 - Time Between the Lines is Thread Through the Mind / Matto - 40 minted",
  "STBYS0 - Themes and Variations / Vera Molnár, in collaboration with Martin Grasser - 500 minted",
  "ATP0 - LOVE / Martin Grasser - 300 minted",
  "GRAIL1 - Fold / rudxane - 400 minted",
  "GRAIL2 - Atlas / Eric De Giuli - 333 minted",
  "AOI0 - Pursuit / Per Kristian Stoveland - 200 minted",
  "AOI1 - Echo of Intensity / Per Kristian Stoveland - 1595 minted",
  "AOI2 - /// / Snowfro - 2000 minted",
  "AOI3 - Signature / Jack Butcher - 200 minted",
  "AOI4 - Trademark / Jack Butcher - 10000 minted",
  "VCA1 - Concrete Letters / makio135 - 200 minted",
  "VCA2 - A Tender Count(ing) / Lisa Orth - 200 minted",
  "VCA3 - The Art behind the Code / Luca Ionescu - 5 minted",
  "VCA5 - Petrography Case / Orr Kislev - 200 minted",
  "VCA6 - Décorés / Alexis André - 200 minted",
  "VCA7 - Spatial Curvatures / DistCollective - 200 minted",
  "VCA8 - Drifting Dreams / Licia He - 325 minted",
  "VCA10 - Suma / Aleksandra Jovanić - 85 minted",
  "VCA11 - Chronicles / encapsuled - 17 minted",
  "VCA12 - la caverna / Marcelo Soria-Rodríguez - 150 minted",
  "VCA13 - Spensieratezza / Emanuele Pasin - 9 minted",
  "VCA15 - Linea Recta / Moodsoup - 150 minted",
  "VCA17 - Transition / William Watkins - 100 minted",
  "VCA18 - JaggedMemories / Shunsuke Takawo - 50 minted",
  "VCA19 - [classifieds] / fingacode - 24 minted",
  "SDAO0 - Elevate Heart / Daniel Calderon Arenas - 1000 minted",
  "MINTS0 - The Colors That Heal / Ryan Green - 142 minted",
  "TDG1 - Filigree - Collector's Edition / Matt DesLauriers - 10 minted",
  "TDG2 - Filigree - Digital Edition / Matt DesLauriers - 90 minted",
  "VFA0 - Fenestra / Rob Scalera - 41 minted",
  "VFA1 - Opuntia / Jake Rockland - 2 minted",
  "UNITLDN0 - TEST / Andrei Wang - 2 minted",
  "UNITLDN1 - Disconnected / Stefano Contiero - 10 minted",
  "UNITLDN2 - Pressed Pause / Loren Bednar - 10 minted",
  "TRAME0 - Navette / Alexis André - 200 minted",
  "TRAME1 - Optimism / Jeff Davis - 13 minted",
  "TRAME2 - Portraits / Martin Grasser - 12 minted",
  "HODL1 - Order and Disorder / @greweb - 90 minted",
  "HODL2 - Theoretical Townships / WILLARD - 196 minted",
  "HODL3 - Lines of Memories / Kitel - 17 minted",
  "HODL4 - Aesthetics of Failure / DistCollective - 100 minted",
  "HODL5 - Multifaceted / Gin - 5 minted",
  "HODL6 - THIS ART IS ILLEGAL! / Daïm - 20 minted",
  "HODL7 - Vendaval / Omar Lobato - 8 minted",
  "HODL8 - Pulse of Expression / Mathis Biabiany - 20 minted",
  "HODL9 - Summit / gpitombo - 33 minted",
  "HODL10 - Chaos Control / Olga Fradina - 41 minted",
  "HODL11 - Dead Air / artplusbrad - 12 minted",
  "HODL12 - Renaissance / Fernando Jerez - 16 minted",
  "HODL13 - Whispers of Knowledge / Ferdinand Dervieux - 34 minted",
  "HODL15 - Gravity / Pawel Dudko - 45 minted",
  "HODL16 - Wired wonders / Alessandro Fiore - 53 minted",
  "HODL17 - Nebulous / KRANKARTA - 20 minted",
  "FAB0 - Giving Shape / ippsketch - 99 minted",
  "FLUTTER0 - Worlds / Kenny Vaden - 500 minted",
  "FLUTTER1 - Leggenda / Stefano Contiero - 888 minted",
  "FLUTTER2 - Fluxus / Monotau - 234 minted",
  "TENDER0 - Of That Ilk / KRANKARTA - 200 minted",
]

/***************************************************
 *         FUNCTIONS TO UPDATE THE LIST
 **************************************************/
// fetchBlocks()
async function fetchBlocks() {
  // n = contracts
  for (let n = 27; n < 29; n++) {
    let token
    let newList = []
    const isContractV2 = isCoreV2(n)
    const contractName = contractNameMap[n]

    const iStart =
      n == 1 ? 3 : n == 2 ? 374 : n == 5 ? 5 : [14, 23].includes(n) ? 1 : 0
    // i = project id
    for (let i = iStart; i < 500; i++) {
      try {
        const detail = await contracts[n].projectDetails(i.toString())
        const tkns = isContractV2
          ? await contracts[n].projectTokenInfo(i)
          : await contracts[n].projectStateData(i)

        if (tkns.invocations) {
          newList.push(
            `${contractName}${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted`
          )
          token = 0
        } else {
          console.log(`error for project ${contractName}${i}`)
          token++
          if (token == 5) break
        }
      } catch (error) {
        console.log(`error for project ${contractName}${i}`)
        break
      }
    }
    console.log(newList)
  }
}

/***************************************************
 *              DARK/LIGHT MODE TOGGLE
 **************************************************/
const root = document.documentElement
const isDarkMode = JSON.parse(localStorage.getItem("darkMode"))

if (isDarkMode) root.classList.toggle("dark-mode")
root.classList.remove("no-flash")

document.getElementById("modeToggle").addEventListener("click", () => {
  root.classList.toggle("dark-mode")
  const updateMode = root.classList.contains("dark-mode")
  localStorage.setItem("darkMode", updateMode)
})

/***************************************************
 *        FUNCTIONS TO GET DATA FROM ETHEREUM
 **************************************************/
let contractData = {}

async function grabData(tokenId, contract) {
  try {
    toggleSpin()
    clearPanels()
    clearDataStorage()
    console.log("Contract:", contract, "\nToken Id:", tokenId)

    const isContractV2 = isCoreV2(contract)
    const hash = await fetchHash(tokenId, contract)
    const projId = Number(await fetchProjectId(tokenId, contract))
    const projectInfo = await fetchProjectInfo(projId, contract, isContractV2)
    const script = await constructScript(projId, projectInfo, contract)
    const detail = await fetchProjectDetails(projId, contract)
    const { owner, ensName } = await fetchOwner(tokenId, contract)
    const extLib = extractLibraryName(projectInfo)
    const { edition, remaining } = await fetchEditionInfo(
      projId,
      contract,
      isContractV2
    )

    localStorage.setItem(
      "contractData",
      JSON.stringify({
        tokenId,
        contract,
        projId,
        hash,
        script,
        detail,
        owner,
        ensName,
        extLib,
        edition,
        remaining,
      })
    )
    location.reload()
  } catch (error) {
    console.error("grabData:", error)
    search.placeholder = "error"
  }
}

function isCoreV2(value) {
  return [0, 1, 4, 7, 9, 10, 13, 16, 18, 22, 27].includes(value)
}

async function fetchHash(tokenId, contract) {
  return contract == 0
    ? contracts[contract].showTokenHashes(tokenId)
    : contracts[contract].tokenIdToHash(tokenId)
}

async function fetchProjectId(tokenId, contract) {
  return contracts[contract].tokenIdToProjectId(tokenId)
}

async function fetchProjectInfo(projId, contract, isContractV2) {
  return isContractV2
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
  const owner = await contracts[contract].ownerOf(tokenId)
  const ensName = await provider.lookupAddress(owner)
  return { owner, ensName }
}

function extractLibraryName(projectInfo) {
  if (typeof projectInfo[0] === "string" && projectInfo[0].includes("@")) {
    return projectInfo[0].split("@")[0].trim()
  } else {
    return JSON.parse(projectInfo[0]).type
  }
}

async function fetchEditionInfo(projId, contract, isContractV2) {
  const invo = await (isContractV2
    ? contracts[contract].projectTokenInfo(projId)
    : contracts[contract].projectStateData(projId))

  return {
    edition: invo.maxInvocations.toString(),
    remaining: (invo.maxInvocations - invo.invocations).toString(),
  }
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
  ensName,
  extLib,
  edition,
  remaining
) {
  pushItemToLocalStorage(contract, tokenId, hash, script, extLib)
  const curation = [0, 1, 2].includes(contract)
    ? determineCuration(projId)
    : null
  const platform = determinePlatform(contract, curation)
  let id = getShortenedId(tokenId)
  updateInfo(contract, detail, id).then((artist) => {
    updatePanelContent(
      contract,
      owner,
      ensName,
      detail,
      tokenId,
      platform,
      edition,
      remaining,
      artist
    )
  })
  injectFrame()
}

function pushItemToLocalStorage(contract, tokenId, hash, script, extLib) {
  const src = predefinedLibraries[extLib]
  const tokenIdHash =
    tokenId < 3000000 && contract == 0
      ? `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`
      : `let tokenData = { tokenId: "${tokenId}", hash: "${hash}" }`
  let process = extLib == "processing" ? "application/processing" : ""

  localStorage.setItem(
    "scriptData",
    JSON.stringify({ src, tokenIdHash, process, script })
  )
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
  const playground = [
    6, 14, 15, 16, 18, 19, 20, 22, 24, 25, 26, 30, 37, 42, 48, 56, 57, 68, 77,
    94, 104, 108, 112, 119, 121, 130, 134, 137, 139, 145, 146, 157, 163, 164,
    167, 191, 197, 200, 201, 208, 212, 217, 228, 230, 234, 248, 256, 260, 264,
    286, 289, 292, 294, 310, 319, 329, 339, 340, 350, 356, 362, 366, 369, 370,
    373,
  ]
  return curated.includes(projId)
    ? "Art Blocks Curated"
    : playground.includes(projId)
    ? "Art Blocks Playground"
    : projId < 374
    ? "Art Blocks Factory"
    : projId < 494
    ? "Art Blocks Presents"
    : "Art Blocks"
}

function determinePlatform(contract, curation) {
  const platform = {
    3: "Art Blocks Explorations",
    6: "Art Blocks &times; Bright Moments",
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
    22: "Trame",
    23: "Hodlers",
    24: "Foundation for Art and Blockchain",
    27: "FlamingoDAO",
    28: "Tender",
  }

  ;[
    [[0, 1, 2], curation],
    [[4, 5], "Art Blocks &times; Pace"],
    [[7, 8, 9], "Bright Moments"],
    [[10, 11], "Plottables"],
    [[25, 26], "Art Blocks Studio"],
  ].forEach(([keys, value]) => keys.forEach((key) => (platform[key] = value)))

  return platform[contract] || null
}

function getShortenedId(tokenId) {
  return tokenId < 1000000
    ? tokenId
    : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0
}

function updateInfo(contract, detail, id) {
  return new Promise((resolve) => {
    const logs = []
    if (contract == 8) {
      frame.contentWindow.console.log = function (message) {
        if (logs.length === 0) {
          message = message
            .replace(/Artist\s*\d+\.\s*/, "")
            .replace(/\s*--.*/, "")
        }
        logs.push(message)
        info.innerHTML = `${detail[0]} #${id} / ${logs[0]}`
        resolve(logs[0])
      }
    } else {
      info.innerHTML = `${detail[0]} #${id} / ${detail[1]}`
      resolve(detail[1])
    }
  })
}

function updatePanelContent(
  contract,
  owner,
  ensName,
  detail,
  tokenId,
  platform,
  edition,
  remaining,
  artist
) {
  let mintedOut =
    remaining == 0
      ? `Edition of ${edition} works.`
      : `Edition of ${edition} works, ${remaining} remaining.`

  const shortOwner = ensName || shortenAddress(owner)
  const shortContract = shortenAddress(contracts[contract].target)

  const panelContentHTML = `
      <p>
        <span style="font-size: 1.4em">${detail[0]}</span><br>
        ${artist} ● ${platform}<br>
        ${mintedOut}
      </p><br>
      <p>
        ${detail[2]} <a href="${detail[3]}" target="_blank">${detail[3]}</a>
      </p><br>
      <p>
        Owner <a href="https://zapper.xyz/account/${owner}" target="_blank">${shortOwner}</a><span class="copy-text" data-text="${owner}"><i class="fa-regular fa-copy"></i></span><br>
        Contract <a href="https://etherscan.io/address/${contracts[contract].target}" target="_blank">${shortContract}</a><span class="copy-text" data-text="${contracts[contract].target}"><i class="fa-regular fa-copy"></i></span><br>
        Token Id <span class="copy-text" data-text="${tokenId}">${tokenId}<i class="fa-regular fa-copy"></i></span>
      </p>
    `
  document.getElementById("panelContent").innerHTML = panelContentHTML

  document.querySelectorAll(".copy-text").forEach((element) => {
    element.addEventListener("click", () => {
      copyToClipboard(element.getAttribute("data-text"))
    })
  })
}

function shortenAddress(address) {
  return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`
}

/***************************************************
 *        FUNCTION TO INJECT INTO IFRAME
 **************************************************/
async function injectFrame() {
  const iframeDocument = frame.contentDocument || frame.contentWindow.document
  try {
    let scriptData = JSON.parse(localStorage.getItem("scriptData"))

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
      dynamicContent = `<html><head>
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
          background-color: transparent;
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
      </head>
      ${frameBody}</html>`
    }

    iframeDocument.open()
    iframeDocument.write(dynamicContent)
    iframeDocument.close()
  } catch (error) {
    console.error("injectFrame:", error)
  }
}

/***************************************************
 *            FUNCTIONS TO GET TOKEN
 **************************************************/
function getToken(line, searchQuery) {
  if (/^\d+$/.test(searchQuery)) {
    handleNumericQuery(searchQuery)
  } else {
    handleOtherQuery(line, searchQuery)
  }
}

function handleNumericQuery(searchQuery) {
  const { contract, projId } = contractData
  const id = parseInt(searchQuery.match(/\s*(\d+)/)[1])
  const tokenId =
    projId == 0
      ? id
      : Number((projId * 1000000 + id).toString().padStart(6, "0"))

  grabData(tokenId, contract)
}

function handleOtherQuery(line, searchQuery) {
  const regex = /^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*minted/
  const [_, listContract, projIdStr, tokenStr] = line.match(regex)
  const projId = parseInt(projIdStr)
  const token = parseInt(tokenStr)
  const contract = contractIndexMap[listContract]
  let tokenId

  if (searchQuery.includes("#")) {
    const searchId = parseInt(searchQuery.match(/#\s*(\d+)/)[1])
    tokenId =
      projId === 0
        ? searchId
        : Number((projId * 1000000 + searchId).toString().padStart(6, "0"))
  } else {
    const randomToken = Math.floor(Math.random() * token)
    tokenId =
      projId === 0
        ? randomToken
        : Number((projId * 1000000 + randomToken).toString().padStart(6, "0"))
  }

  grabData(tokenId, contract)
}

/***************************************************
 *          FUNCTIONS TO DISPLAY LIST
 **************************************************/
let filteredList = list
let selectedIndex = -1

function displayList(lines) {
  const panel = lines
    .map((line, index) => {
      const parts = line.split(" - ")
      const displayText = parts.slice(1, parts.length - 1).join(" - ")
      const mintedInfo = parts[parts.length - 1].replace("minted", "items")
      return `<p class="list-item" data-index="${index}">${displayText}<span>${mintedInfo}</span></p>`
    })
    .join("")
  listPanel.innerHTML = `<div>${panel}</div>`
}

function filterList(lines, query) {
  filteredList = lines.filter((line) =>
    line.toLowerCase().includes(query.toLowerCase())
  )
  displayList(filteredList)
  selectedIndex = -1
}

function handleItemClick(event) {
  const selectedIndex = event.target.getAttribute("data-index")
  console.log("Item clicked:", filteredList[selectedIndex])
  getToken(filteredList[selectedIndex], "")
  search.value = ""
}

function handleKeyboardNavigation(event) {
  if (event.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % filteredList.length
  } else if (event.key === "ArrowUp") {
    if (selectedIndex === -1) {
      selectedIndex = filteredList.length - 1
    } else {
      selectedIndex =
        (selectedIndex - 1 + filteredList.length) % filteredList.length
    }
  } else if (event.key === "Enter") {
    if (selectedIndex !== -1) {
      console.log("Item clicked:", filteredList[selectedIndex])
      getToken(filteredList[selectedIndex], "")
    } else {
      const query = search.value.trim()
      query === "" ? getRandom(list) : getToken(filteredList.join("\n"), query)
    }
    search.value = ""
  }

  const items = document.querySelectorAll(".list-item")
  items.forEach((item, index) => {
    item.classList.toggle("selected", index === selectedIndex)
  })

  if (selectedIndex !== -1) {
    items[selectedIndex].scrollIntoView({ block: "nearest" })
  }
}
displayList(list)

search.addEventListener("input", (event) => {
  const query = event.target.value.trim().split("#")[0].trim()
  filterList(list, query)
})

search.addEventListener("keydown", handleKeyboardNavigation)

listPanel.addEventListener("click", handleItemClick)

/***************************************************
 *              RANDOMNESS FUNCTIONS
 **************************************************/
function getRandom(lines) {
  const randomLine = lines[Math.floor(Math.random() * lines.length)]
  console.log("Randomly selected line:", randomLine)
  getToken(randomLine, "")
}

function getRandomKey(favorite) {
  const keys = Object.keys(favorite)

  if (keys.length > 0) {
    const randomKey = keys[Math.floor(Math.random() * keys.length)]

    clearDataStorage()

    contractData = favorite[randomKey]
    localStorage.setItem("contractData", JSON.stringify(contractData))
    location.reload()
  }
}

document.getElementById("randomButton").addEventListener("click", () => {
  getRandom(list)
})

/***************************************************
 *                  LOOP FUNCTIONS
 **************************************************/
let intervalId
const MIN_TO_MS = 60000
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: MIN_TO_MS,
  action: null,
}

function loopRandom(interval, action) {
  clearInterval(intervalId)
  const favorite = JSON.parse(localStorage.getItem("favorite")) || "{}"

  if (loopState.isLooping !== "true") performAction(action, list, favorite)

  intervalId = setInterval(() => {
    performAction(action, list, favorite)
  }, interval)

  loopState = { isLooping: "true", interval, action }
  localStorage.setItem("loopState", JSON.stringify(loopState))
}

function performAction(action, list, favorite) {
  if (action === "loop") getRandom(list)
  else if (action === "favLoop") getRandomKey(favorite)
}

function stopRandomLoop() {
  clearInterval(intervalId)
  loopState.isLooping = "false"
  localStorage.setItem("loopState", JSON.stringify(loopState))
}

function checkLocalStorage() {
  loopInput.placeholder = `${loopState.interval / MIN_TO_MS}min`

  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action)
}

function handleLoopClick(action) {
  let inputValue = loopInput.value.trim()
  const inputVal = parseInt(inputValue, 10)

  const interval =
    loopState.interval &&
    (inputValue === "" || loopState.interval === inputVal * MIN_TO_MS)
      ? loopState.interval
      : inputVal * MIN_TO_MS

  if (!isNaN(interval) && interval > 0) {
    if (loopState.isLooping !== "true") {
      loopRandom(interval, action)
      toggleInfobarVisibility()
    } else {
      stopRandomLoop()
      toggleInfobarVisibility()
    }
  } else {
    alert("Please enter a time in minutes.")
  }

  if (inputValue !== "" && interval !== loopState.interval) {
    loopState = { isLooping: "false", interval: interval, action: action }
    localStorage.setItem("loopState", JSON.stringify(loopState))
  }
}

document
  .getElementById("loop")
  .addEventListener("click", () => handleLoopClick("loop"))
document
  .getElementById("favLoop")
  .addEventListener("click", () => handleLoopClick("favLoop"))

/***************************************************
 *          FUNCTION TO SAVE THE OUTPUT
 **************************************************/
async function saveOutput() {
  clearPanels()
  const content = frame.contentDocument.documentElement.outerHTML
  let id = getShortenedId(contractData.tokenId)
  const defaultName = `${contractData.detail[0].replace(
    /\s+/g,
    "-"
  )}#${id}.html`
  const blob = new Blob([content], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = defaultName
  document.body.appendChild(link)
  link.click()

  URL.revokeObjectURL(url)
  link.remove()
  pushContractDataToStorage(id)
}

save.addEventListener("click", saveOutput)

/***************************************************
 * FUNCTIONS TO MANIPULATE SAVED OUTPUT IN STORAGE
 **************************************************/
let favorite = JSON.parse(localStorage.getItem("favorite")) || {}

function pushContractDataToStorage(id) {
  const key = `${contractData.detail[0]} #${id} by ${contractData.detail[1]}`
  favorite[key] = contractData
  localStorage.setItem("favorite", JSON.stringify(favorite))
}

function deleteContractDataFromStorage(key) {
  if (favorite.hasOwnProperty(key)) delete favorite[key]
  localStorage.setItem("favorite", JSON.stringify(favorite))
}

function displayFavorite(key) {
  clearDataStorage()
  contractData = favorite[key]
  localStorage.setItem("contractData", JSON.stringify(contractData))
  location.reload()
}

function displayFavoriteList() {
  favPanel.innerHTML = ""

  for (let key in favorite) {
    if (favorite.hasOwnProperty(key)) {
      const keyElement = document.createElement("p")
      keyElement.textContent = key
      const delSpan = document.createElement("span")
      delSpan.innerHTML = `<i class="fa-solid fa-xmark"></i>`

      delSpan.addEventListener("click", (event) => {
        event.stopPropagation()
        deleteContractDataFromStorage(key)
        displayFavoriteList()
      })

      keyElement.addEventListener("click", () => {
        toggleSpin()
        displayFavorite(key)
        clearPanels()
      })

      keyElement.appendChild(delSpan)
      favPanel.appendChild(keyElement)
    }
  }
}

/***************************************************
 *      FUNCTIONS TO GET PREVIOUS/NEXT ID TOKEN
 **************************************************/
function incrementTokenId() {
  contractData.tokenId = contractData.tokenId + 1
  grabData(contractData.tokenId, contractData.contract)
}

function decrementTokenId() {
  contractData.tokenId = contractData.tokenId - 1
  grabData(contractData.tokenId, contractData.contract)
}

inc.addEventListener("click", incrementTokenId)
dec.addEventListener("click", decrementTokenId)

/***************************************************
 *              HELPER FUNCTIONS
 **************************************************/
function clearDataStorage() {
  ;["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d))
}

function clearPanels() {
  ;[listPanel, panel, favPanel].forEach((p) => p.classList.remove("active"))
  overlay.style.display = "none"
}

function toggleSpin() {
  document.querySelector(".spinner").style.display = "block"
  document.querySelector(".key-short").style.display = "none"
}

function togglePanel(panelElement) {
  ;[panel, listPanel, favPanel].forEach(
    (p) => p !== panelElement && p.classList.remove("active")
  )
  const isActive = panelElement.classList.toggle("active")
  overlay.style.display = isActive ? "block" : "none"
}

function toggleKeyShort(event) {
  document.querySelector(".key-short").style.display =
    event.type === "focusin" ? "none" : "block"
}

function setupInfobar() {
  const isInfobarInactive = localStorage.getItem("infobarInactive") === "true"
  infobar.classList.toggle("inactive", isInfobarInactive)
}

function toggleInfobarVisibility() {
  const isInfobarInactive = infobar.classList.toggle("inactive")
  localStorage.setItem("infobarInactive", isInfobarInactive)
  if (loopState.isLooping !== "true") location.reload()
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => console.log("Copied:", text))
    .catch((error) => console.error("Failed to copy:", error))
}

/***************************************************
 *                     EVENTS
 **************************************************/
document.addEventListener("DOMContentLoaded", () => {
  setupInfobar()
  checkLocalStorage()

  contractData = JSON.parse(localStorage.getItem("contractData"))
  if (contractData) update(...Object.values(contractData))

  const value = contractData ? "block" : "none"
  ;[inc, dec, save].forEach((el) => (el.style.display = value))

  const val = rpcUrl ? "none" : "block"
  ;[rpcUrlInput, instruction].forEach((el) => (el.style.display = val))

  if (!rpcUrl) document.getElementById("infoBox").style.display = "none"
})

rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    localStorage.setItem("rpcUrl", rpcUrlInput.value)
    location.reload()
  }
})

document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
    clearDataStorage()
    location.reload()
  }
})

document.addEventListener("keypress", (event) => {
  if (event.key === "/") {
    event.preventDefault()
    search.focus()
    togglePanel(listPanel)
  }
})

info.addEventListener("click", () => {
  togglePanel(panel)
})

document.querySelector(".search-icon").addEventListener("click", () => {
  togglePanel(listPanel)
})

document.getElementById("favList").addEventListener("click", () => {
  displayFavoriteList()
  togglePanel(favPanel)
})

search.addEventListener("input", () => {
  if (search.value.trim() !== "") {
    listPanel.classList.add("active")
    panel.classList.remove("active")
    favPanel.classList.remove("active")
    overlay.style.display = "block"
  }
})

search.addEventListener("focusin", toggleKeyShort)
search.addEventListener("focusout", toggleKeyShort)

toggleBox.addEventListener("click", toggleInfobarVisibility)

overlay.addEventListener("click", () => {
  clearPanels()
})
