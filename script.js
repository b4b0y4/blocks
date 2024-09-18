import { ethers } from "./ethers.min.js"
import { isV2, isStudio, contractsData } from "./contracts.js"

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
const dropdownMenu = document.getElementById("dropdownMenu")

const rpcUrl = localStorage.getItem("rpcUrl")
const provider = new ethers.JsonRpcProvider(rpcUrl)

const contracts = []
const contractNameMap = {}
const contractIndexMap = {}

Object.keys(contractsData).forEach((key, index) => {
  const { abi, address } = contractsData[key]
  contracts.push(new ethers.Contract(address, abi, provider))
  contractNameMap[index] = key
  contractIndexMap[key] = index
})

const libs = {
  p5js: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js",
  "p5@1.0.0": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js",
  "p5@1.9.0": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js",
  threejs: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r124/three.min.js",
  "three@0.124.0":
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r124/three.min.js",
  tonejs: "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.15/Tone.js",
  "tone@14.8.15": "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.15/Tone.js",
  paperjs:
    "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.15/paper-full.min.js",
  "paper@0.12.15":
    "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.15/paper-full.min.js",
  processing:
    "https://cdnjs.cloudflare.com/ajax/libs/processing.js/1.4.6/processing.min.js",
  regl: "https://cdnjs.cloudflare.com/ajax/libs/regl/2.1.0/regl.min.js",
  "regl@2.1.0": "https://cdnjs.cloudflare.com/ajax/libs/regl/2.1.0/regl.min.js",
  zdog: "https://unpkg.com/zdog@1/dist/zdog.dist.min.js",
  "a-frame":
    "https://cdnjs.cloudflare.com/ajax/libs/aframe/1.2.0/aframe.min.js",
  "twemoji@14.0.2":
    'https://unpkg.com/twemoji@14.0.2/dist/twemoji.min.js" crossorigin="anonymous',
  babylonjs:
    "https://cdnjs.cloudflare.com/ajax/libs/babylonjs/5.0.0/babylon.min.js",
  "babylon@5.0.0":
    "https://cdnjs.cloudflare.com/ajax/libs/babylonjs/5.0.0/babylon.min.js",
}

const list = [
  "AB0 - Chromie Squiggle / Snowfro - 10000 minted",
  "AB1 - Genesis / DCA - 512 minted",
  "AB2 - Construction Token / Jeff Davis - 500 minted",
  "ABII3 - Cryptoblots / Daïm Aggott-Hönsch - 1921 minted",
  "ABII4 - Dynamic Slices / pxlq - 512 minted",
  "ABII5 - Variant Plan / Jeff Davis - 199 minted",
  "ABII6 - View Card / Jeff Davis - 41 minted",
  "ABII7 - Elevated Deconstructions / luxpris - 200 minted",
  "ABII8 - Singularity / Hideki Tsukamoto - 1024 minted",
  "ABII9 - Ignition / ge1doot - 512 minted",
  "ABII10 - NimBuds / Bryan Brinkman - 400 minted",
  "ABII11 - HyperHash / Beervangeer - 369 minted",
  "ABII12 - Unigrids / Zeblocks - 421 minted",
  "ABII13 - Ringers / Dmitri Cherniak - 1000 minted",
  "ABII14 - Cyber Cities / pxlq - 256 minted",
  "ABII15 - Utopia / ge1doot - 256 minted",
  "ABII16 - Color Study / Jeff Davis - 2000 minted",
  "ABII17 - Spectron / Simon De Mai - 400 minted",
  "ABII18 - Gen 2 / DCA - 256 minted",
  "ABII19 - R3sonance / ge1doot - 512 minted",
  "ABII20 - Sentience / pxlq - 144 minted",
  "ABII21 - 27-Bit Digital / kai - 1024 minted",
  "ABII22 - The Eternal Pump / Dmitri Cherniak - 50 minted",
  "ABII23 - Archetype / Kjetil Golid - 600 minted",
  "ABII24 - Pixel Glass / kai - 256 minted",
  "ABII25 - Pathfinders / luxpris - 1000 minted",
  "ABII26 - EnergySculpture / Beervangeer - 369 minted",
  "ABII27 - 720 Minutes / Alexis André - 720 minted",
  "ABII28 - Apparitions / Aaron Penne - 1500 minted",
  "ABII29 - Inspirals / Radix - 1000 minted",
  "ABII30 - Hieroglyphs / pxlq - 1000 minted",
  "ABII31 - Galaxiss / Xenoliss - 600 minted",
  "ABII32 - Light Beams / Jason Ting - 150 minted",
  "ABII33 - Empyrean / Generative Artworks - 500 minted",
  "ABII34 - Ensō / Matto - 1000 minted",
  "ABII35 - Aerial View / daLenz - 1000 minted",
  "ABII36 - Gazettes / Redlioneye Gazette - 1024 minted",
  "ABII37 - Paper Armada / Kjetil Golid - 3000 minted",
  "ABII38 - ♫ ByteBeats / DADABOTS x KAI - 512 minted",
  "ABII39 - Synapses / Chaosconstruct - 700 minted",
  "ABII40 - Algobots / Stina Jones - 500 minted",
  "ABII41 - Elementals / Michael Connolly - 600 minted",
  "ABII42 - Void / Alexis André - 500 minted",
  "ABII43 - Origami Dream / k0ch - 223 minted",
  "ABII44 - CryptoGodKing / Steve Pikelny - 180 minted",
  "ABII45 - Gravity Grid / Eliya Stein - 81 minted",
  "ABII46 - 70s Pop Series One / Daniel Catt - 256 minted",
  "ABII47 - Asterisms / Falko - 100 minted",
  "ABII48 - Gen 3 / DCA - 1024 minted",
  "ABII49 - Dear Hash, / MODNAR WOLF - 365 minted",
  "ABII50 - The Opera / Luke Shannon - 256 minted",
  "ABII51 - Stipple Sunsets / Jake Rockland - 360 minted",
  "ABII52 - Star Flower / Ruben Alexander - 1000 minted",
  "ABII53 - Subscapes / Matt DesLauriers - 650 minted",
  "ABII54 - P:X / mightymoose - 384 minted",
  "ABII55 - Talking Blocks / REMO x DCsan - 512 minted",
  "ABII56 - Aurora IV / ge1doot - 128 minted",
  "ABII57 - Rhythm / Jeff Davis - 334 minted",
  "ABII58 - Color Magic Planets / Bård Ionson - 256 minted",
  "ABII59 - Watercolor Dreams / NumbersInMotion - 600 minted",
  "ABII60 - Event Horizon Sunset (Series C) / Jake Brukhman - 500 minted",
  "ABII61 - 70s Pop Super Fun Summertime Bonus Pack 🍸 / Daniel Catt - 64 minted",
  "ABII62 - Bubble Blobby / Jason Ting - 500 minted",
  "ABII63 - Ode to Roy / artplusbrad - 906 minted",
  "ABII64 - AlgoRhythms / Han x Nicolas Daniel - 1000 minted",
  "ABII65 - Traversals / Loren Bednar - 150 minted",
  "ABII66 - Patchwork Saguaros / Jake Rockland - 72 minted",
  "ABII67 - Petri / Fabin Rasheed - 200 minted",
  "ABII68 - Messengers / Alexis André - 350 minted",
  "ABII69 - Abstraction / Hevey - 256 minted",
  "ABII70 - Antennas / gcrll - 250 minted",
  "ABII71 - Andradite / Eltono - 222 minted",
  "ABII72 - Frammenti / Stefano Contiero - 555 minted",
  "ABII73 - CatBlocks / Kristy Glas - 512 minted",
  "ABII74 - The Blocks of Art / Shvembldr - 500 minted",
  "ABII75 - Breathe You / raregonzo - 256 minted",
  "ABII76 - dino pals / hideo - 100 minted",
  "ABII77 - Return / Aaron Penne - 300 minted",
  "ABII78 - Fidenza / Tyler Hobbs - 999 minted",
  "ABII79 - Space Debris [m'aider] / WhaleStreet x pxlq - 93 minted",
  "ABII80 - Space Debris [warning] / WhaleStreet x pxlq - 81 minted",
  "ABII81 - Space Debris [ravaged] / WhaleStreet x pxlq - 32 minted",
  "ABII82 - Incantation / Eliya Stein - 85 minted",
  "ABII83 - Panelscape 🅰🅱 / Paolo Tonon - 525 minted",
  "ABII84 - PrimiDance / wuwa - 256 minted",
  "ABII85 - 70s Pop Series Two / Daniel Catt - 256 minted",
  "ABII86 - Stroming / Bart Simons - 256 minted",
  "ABII87 - Patterns of Life / Vamoss - 512 minted",
  "ABII88 - Orthogone / Pandelune - 777 minted",
  "ABII89 - Dreams / Joshua Bagley - 700 minted",
  "ABII90 - Hashtractors / Darien Brito - 128 minted",
  "ABII91 - planets / donnoh - 512 minted",
  "ABII92 - Libertad Parametrizada / zJorge - 243 minted",
  "ABII93 - Sigils / espina - 133 minted",
  "ABII94 - Portal / Jeff Davis - 10 minted",
  "ABII95 - CryptoVenetian / Bright Moments - 1000 minted",
  "ABII96 - Gravity 12 / Jimmy Herdberg - 512 minted",
  "ABII97 - [Dis]entanglement / onlygenerated - 730 minted",
  "ABII98 - sail-o-bots / sturec - 750 minted",
  "ABII99 - Spaghettification / Owen Moore - 1024 minted",
  "ABII100 - CENTURY / Casey REAS - 1000 minted",
  "ABII101 - Enchiridion / Generative Artworks - 1024 minted",
  "ABII102 - I Saw It in a Dream / Steve Pikelny - 1024 minted",
  "ABII103 - Octo Garden / Rich Lord - 333 minted",
  "ABII104 - Eccentrics / Radix - 400 minted",
  "ABII105 - Gizmobotz / Mark Cotton - 1000 minted",
  "ABII106 - Radiance / Julien Gachadoat - 512 minted",
  "ABII107 - Low Tide / Artem Verkhovskiy x Andy Shaw - 373 minted",
  "ABII108 - Divisions / Michael Connolly - 500 minted",
  "ABII109 - Speckled Summits / Jake Rockland - 72 minted",
  "ABII110 - Lava Glow / JEANVASCRIPT - 500 minted",
  "ABII111 - 70s Pop Ghost Bonus Pack 👻 / Daniel Catt - 64 minted",
  "ABII112 - Alien Clock / Shvembldr - 362 minted",
  "ABII113 - celestial cyclones / hideo - 628 minted",
  "ABII114 - glitch crystal monsters / Alida Sun - 1000 minted",
  "ABII115 - Dot Grid / TheElephantNL - 1000 minted",
  "ABII116 - Flowers / RVig - 6158 minted",
  "ABII117 - Transitions / Jason Ting x Matt Bilfield - 4712 minted",
  "ABII118 - LeWitt Generator Generator / Mitchell F. Chan - 750 minted",
  "ABII119 - Ecumenopolis / Joshua Bagley - 676 minted",
  "ABII120 - Endless Nameless / Rafaël Rozendaal - 1000 minted",
  "ABII121 - Rinascita / Stefano Contiero - 1111 minted",
  "ABII122 - Cells / Hevey - 1024 minted",
  "ABII123 - Nucleus / Hjalmar Åström - 512 minted",
  "ABII124 - The Liths of Sisyphus / nonfigurativ - 777 minted",
  "ABII125 - Calendart / steen & n-e-o - 365 minted",
  "ABII126 - Timepiece / WAWAA - 500 minted",
  "ABII127 - Labyrometry / Eliya Stein - 800 minted",
  "ABII129 - Pigments / Darien Brito - 1024 minted",
  "ABII130 - Obicera / Alexis André - 529 minted",
  "ABII131 - Scribbled Boundaries / William Tan - 1024 minted",
  "ABII132 - Tangled / Superblob - 384 minted",
  "ABII133 - Organized Disruption / Joshua Davis / PrayStation - 1000 minted",
  "ABII134 - Wave Schematics / luxpris - 400 minted",
  "ABII135 - Brushpops / Matty Mariansky - 1000 minted",
  "ABII136 - SpiroFlakes / Alexander Reben - 1024 minted",
  "ABII137 - Alien Insects / Shvembldr - 1000 minted",
  "ABII138 - Geometry Runners / Rich Lord - 1000 minted",
  "ABII139 - Eccentrics 2: Orbits / Radix - 500 minted",
  "ABII140 - Good Vibrations / Aluan Wang - 1024 minted",
  "ABII141 - Rapture / Thomas Lin Pedersen - 1000 minted",
  "ABII142 - Unknown Signals / k0ch - 1000 minted",
  "ABII143 - phase / Loren Bednar - 1024 minted",
  "ABII144 - autoRAD / sgt_slaughtermelon & Tartaria Archivist - 1000 minted",
  "ABII145 - Beatboxes / Zeblocks - 841 minted",
  "ABII146 - Neighborhood / Jeff Davis - 312 minted",
  "ABII147 - Trossets / Anna Carreras - 1000 minted",
  "ABII149 - Dot Matrix Gradient Study / Jake Rockland - 540 minted",
  "ABII150 - PrimiLife / wuwa - 1024 minted",
  "ABII151 - High Tide / Artem Verkhovskiy x Andy Shaw - 745 minted",
  "ABII152 - Fake Internet Money / Steve Pikelny - 1000 minted",
  "ABII153 - We / Vamoss - 1024 minted",
  "ABII154 - Warp / espina - 444 minted",
  "ABII156 - Moments / r4v3n - 1024 minted",
  "ABII157 - UltraWave 369 / Beervangeer - 369 minted",
  "ABII158 - a heart and a soul / Roman Janajev - 1024 minted",
  "ABII159 - Fragments of an Infinite Field / Monica Rizzolli - 1024 minted",
  "ABII160 - Seadragons / Marcin Ignac - 1000 minted",
  "ABII161 - spawn / john provencher - 1001 minted",
  "ABII162 - Democracity / Generative Artworks - 1024 minted",
  "ABII163 - Meridian / Matt DesLauriers - 1000 minted",
  "ABII164 - Phototaxis / Casey REAS - 1000 minted",
  "ABII165 - Gravity 16 / Jimmy Herdberg - 1024 minted",
  "ABII166 - Ouroboros / Shane Rich | raregonzo - 1024 minted",
  "ABII167 - Blaschke Ballet / NumbersInMotion - 600 minted",
  "ABII168 - Bloom / Blockchance - 285 minted",
  "ABII169 - Augmented Sequence / toiminto - 1024 minted",
  "ABII170 - Chroma Theory / Paweł Dudko - 106 minted",
  "ABII171 - Himinn / Sarah Ridgley - 536 minted",
  "ABII172 - Rituals - Venice / Aaron Penne x Boreta - 1000 minted",
  "ABII173 - Skulptuur / Piter Pasma - 1000 minted",
  "ABII174 - Letters to My Future Self / Ryan Struhl - 1000 minted",
  "ABII175 - mono no aware / ixnayokay - 414 minted",
  "ABII177 - Space Birds / Mark Cotton - 48 minted",
  "ABII178 - Beauty in the Hurting / Ryan Green - 1024 minted",
  "ABII179 - 8 / Bård Ionson - 128 minted",
  "ABII180 - mecha suits / hideo - 256 minted",
  "ABII181 - FOCUS / Matto - 567 minted",
  "ABII182 - Amoeba / last even - 213 minted",
  "ABII183 - Quarantine / Owen Moore - 128 minted",
  "ABII184 - Swing / Eltono - 310 minted",
  "ABII185 - little boxes on the hillsides, child / LIA - 777 minted",
  "ABII187 - THE SOURCE CoDE / Ofir Liberman - 180 minted",
  "ABII188 - Blockbob Rorschach / eBoy - 1024 minted",
  "ABII189 - CryptoNewYorker / Qian Qian - 1000 minted",
  "ABII190 - Mental pathways / fabianospeziari x donnoh - 128 minted",
  "ABII191 - 444(4) / Shvembldr - 444 minted",
  "ABII192 - Recursion / Hevey - 256 minted",
  "ABII193 - Murano Fantasy / Pandelune - 41 minted",
  "ABII194 - Rotae / Nadieh Bremer - 529 minted",
  "ABII195 - Paramecircle / Alexander Reben (artBoffin) - 76 minted",
  "ABII196 - Aithérios / Jorge Ledezma - 961 minted",
  "ABII197 - Parade / Loren Bednar - 400 minted",
  "ABII198 - Coquina / Jacob Gold - 387 minted",
  "ABII199 - Prismatic / Eliya Stein - 218 minted",
  "ABII200 - Saturazione / Stefano Contiero - 111 minted",
  "ABII201 - 24 Heures / Alexis André - 137 minted",
  "ABII202 - Beauty of Skateboarding / JEANVASCRIPT - 360 minted",
  "ABII203 - Scoundrels / Kristy Glas - 2048 minted",
  "ABII204 - Edifice / Ben Kovach - 976 minted",
  "ABII205 - Placement / Cooper Jamieson - 500 minted",
  "ABII206 - Asemica / Emily Edelman - Dima Ofman - Andrew Badr - 980 minted",
  "ABII207 - Through the Window / Reva - 500 minted",
  "ABII208 - Reflection / Jeff Davis - 100 minted",
  "ABII209 - Autology / steganon - 1024 minted",
  "ABII210 - Nebula / RVig - 154 minted",
  "ABII211 - Freehand / WAWAA - 222 minted",
  "ABII212 - Dive / Rafaël Rozendaal - 333 minted",
  "ABII213 - Loom / Anna Lucia - 200 minted",
  "ABII214 - Bent / ippsketch - 1023 minted",
  "ABII215 - Gazers / Matt Kane - 1000 minted",
  "ABII216 - Electriz / Che-Yu Wu - 910 minted",
  "ABII217 - Paths / Darien Brito - 523 minted",
  "ABII218 - Squares and Triangles / Maksim Hapeyenka - 80 minted",
  "ABII219 - Time Atlas 🌐 / Paolo Tonon - 412 minted",
  "ABII220 - geVIENNAratives / CryptoWiener - 2048 minted",
  "ABII221 - Spiromorphs / SAB - 200 minted",
  "ABII222 - Pieces of Me / r4v3n - 222 minted",
  "ABII223 - Dream Engine / REMO x DCsan - 476 minted",
  "ABII224 - Tropism / Neel Shivdasani - 500 minted",
  "ABII225 - Vortex / Jen Stark - 1000 minted",
  "ABII226 - Getijde / Bart Simons - 222 minted",
  "ABII227 - Kai-Gen / Takeshi Murata, Christopher Rutledge, J. Krispy - 2048 minted",
  "ABII228 - Incomplete Control / Tyler Hobbs - 100 minted",
  "ABII229 - Attraction / Jos Vromans - 444 minted",
  "ABII230 - Glow / Jason Ting - 500 minted",
  "ABII231 - Cushions / Devi Parikh - 200 minted",
  "ABII232 - Jiometory No Compute - ジオメトリ ハ ケイサンサレマセン / Samsy - 1024 minted",
  "ABII233 - Chimera / mpkoz - 987 minted",
  "ABII234 - The Wrapture / Dmitri Cherniak - 50 minted",
  "ABII235 - Maps for grief / Louis-André Labadie - 500 minted",
  "ABII236 - Summoning Ritual / PZS - 110 minted",
  "ABII237 - Time Squared / steen x n-e-o - 212 minted",
  "ABII238 - AlphaModica / Danooka - 137 minted",
  "ABII239 - Synesthesia / PLS&TY - 123 minted",
  "ABII240 - Pizza 1o1 / KALA - 200 minted",
  "ABII241 - Maps / john provencher - 90 minted",
  "ABII242 - Two Mathematicians / BY MA - 300 minted",
  "ABII244 - InC / hex6c - 64 minted",
  "ABII245 - Freeplan / xnmtrc - 128 minted",
  "ABII246 - Stations / Fernando Jerez - 900 minted",
  "ABII247 - Heavenly Bodies / Ento - 120 minted",
  "ABII248 - HashCrash / Beervangeer - 369 minted",
  "ABII249 - Facets / conundrumer - 267 minted",
  "ABII250 - Cosmic Reef / Leo Villareal - 1024 minted",
  "ABII251 - Undercover / artplusbrad - 91 minted",
  "ABII252 - Roamings / Luca Ionescu - 128 minted",
  "ABII253 - Legends of Metaterra / hideo - 1024 minted",
  "ABII254 - Fernweh / oliveskin - 121 minted",
  "ABII255 - Screens / Thomas Lin Pedersen - 1000 minted",
  "ABII256 - Spotlight / Joshua Bagley - 625 minted",
  "ABII257 - Machine Comics / Roni Block - 96 minted",
  "ABII258 - Cosmodesias / Santiago - 256 minted",
  "ABII259 - Masonry / Eric Davidson - 200 minted",
  "ABII260 - Non Either / Rafaël Rozendaal - 100 minted",
  "ABII261 - Para Bellum  / Matty Mariansky - 1000 minted",
  "ABII262 - Haywire Café  / Jess Hewitt - 256 minted",
  "ABII263 - Click / Ivan Dianov - 1024 minted",
  "ABII264 - Thereidoscope / Daïm Aggott-Hönsch - 630 minted",
  "ABII265 - Tentura / Stranger in the Q - 777 minted",
  "ABII266 - Exhibition: 3291 / cryptobauhaus - 400 minted",
  "ABII267 - entretiempos / Marcelo Soria-Rodríguez - 1000 minted",
  "ABII268 - PrimiEnd / wuwa - 256 minted",
  "ABII269 - Lacunae / James Dalessandro - 111 minted",
  "ABII270 - Foliage / Falko - 250 minted",
  "ABII271 - Time travel in a subconscious mind / Jimmy Herdberg - 256 minted",
  "ABII272 - pseudomods / erin bee - 808 minted",
  "ABII273 - Silhouette / Niel de la Rouviere - 400 minted",
  "ABII274 - Isodream / henrysdev & AMNDA - 186 minted",
  "ABII275 - Quantum Collapses / Insigħt - 404 minted",
  "ABII276 - Strata / Vebjørn Isaksen - 650 minted",
  "ABII277 - Perpetua / Punch Card Collective - 320 minted",
  "ABII278 - Liquid Ruminations / Eliya Stein - 1024 minted",
  "ABII279 - Neophyte MMXXII / Sterling Crispin - 168 minted",
  "ABII280 - Window / Jan Robert Leegte - 404 minted",
  "ABII281 - Automatism / Yazid - 426 minted",
  "ABII282 - Memories of Qilin / Emily Xie - 1024 minted",
  "ABII283 - OnChainChain / Rizzle, Sebi, Miguelgarest - 2000 minted",
  "ABII284 - Ancient Courses of Fictional Rivers / Robert Hodgin - 1000 minted",
  "ABII285 - Supermental / Rosenlykke - 400 minted",
  "ABII286 - Drifting / Simon De Mai - 360 minted",
  "ABII287 - Zoologic / ixnayokay - 300 minted",
  "ABII288 - Mazinaw / Eric De Giuli - 256 minted",
  "ABII289 - AlgoBeats / Han x Nicolas Daniel - 1000 minted",
  "ABII290 - Where The Wind Blows / MODNAR WOLF - 170 minted",
  "ABII291 - APEX / phenomena - 377 minted",
  "ABII292 - Corners / Rafaël Rozendaal - 64 minted",
  "ABII293 - Túnel Dimensional / Autonomoses - 320 minted",
  "ABII294 - Alien DNA / Shvembldr - 512 minted",
  "ABII295 - Invasion Percolation / BarabásiLab - 550 minted",
  "ABII296 - Flux / Owen Moore - 500 minted",
  "ABII297 - Center Pivot / Craig Hughes & Eric Hughes - 222 minted",
  "ABII298 - Mind Maze / Parse/Error - 333 minted",
  "ABII300 - Assemblage / SAB & K2xL - 361 minted",
  "ABII301 - Hōrō / makio135 - 400 minted",
  "ABII302 - Primordial / Jacob Gold - 333 minted",
  "ABII303 - Imperfections / Kalis - 450 minted",
  "ABII304 - Anticyclone / William Mapan - 800 minted",
  "ABII305 - Zupermat / 0xphiiil - 200 minted",
  "ABII307 - Ode to Penrose / uMathA - 300 minted",
  "ABII308 - Cattleya / Ben Snell - 300 minted",
  "ABII309 - Colorspace / Tabor Robak - 600 minted",
  "ABII310 - 100 PRINT / Ben Kovach - 100 minted",
  "ABII311 - Faceless / greatjones - 250 minted",
  "ABII312 - Daisies / Natthakit Susanthitanon (NSmag) - 200 minted",
  "ABII313 - Photon's Dream / Harvey Rayner | patterndotco - 404 minted",
  "ABII314 - Divenire / Emanuele Pasin - 222 minted",
  "ABII315 - Rotor / Sebastián Brocher (CryptoArte) - 285 minted",
  "ABII316 - Maps of Nothing / Steve Pikelny - 625 minted",
  "ABII317 - the spring begins with the first rainstorm / Cole Sternberg - 487 minted",
  "ABII318 - Collapsed Sequence / toiminto - 400 minted",
  "ABII319 - Assorted Positivity / steganon - 400 minted",
  "ABII320 - montreal friend scale / amon tobin - 500 minted",
  "ABII321 - Fermented Fruit / cyberia - 140 minted",
  "ABII322 - Gels / Jason Brown - Shawn Douglas - 190 minted",
  "ABII323 - GHOST IN THE CODE / Kazuhiro Tanimoto - 404 minted",
  "ABII324 - Woah La Coaster / Blockwares - 199 minted",
  "ABII326 - Total Strangers / Artem Verkhovskiy x Andy Shaw - 555 minted",
  "ABII327 - 3:19 / Santiago. - 19 minted",
  "ABII328 - Sudfah / Melissa Wiederrecht - 401 minted",
  "ABII329 - Latent Spirits / Robert Hodgin - 400 minted",
  "ABII330 - Squares / Martin Grasser - 196 minted",
  "ABII331 - Metropixeland / Fernando Jerez - 450 minted",
  "ABII332 - Steps / johan - 360 minted",
  "ABII333 - Alan Ki Aankhen / Fahad Karim - 500 minted",
  "ABII334 - Running Moon / Licia He - 500 minted",
  "ABII335 - Scribblines / Orpheusk - 256 minted",
  "ABII336 - Polychrome Music / Rafaël Rozendaal & Danny Wolfers (Legowelt) - 400 minted",
  "ABII337 - FAKE IT TILL YOU MAKE IT / Maya Man - 700 minted",
  "ABII338 - undead wyverns / hideo - 100 minted",
  "ABII339 - Ieva / Shvembldr - 500 minted",
  "ABII340 - Vahria / Darien Brito - 299 minted",
  "ABII341 - RASTER / itsgalo - 400 minted",
  "ABII342 - Being Yourself While Fitting In / LIA - 55 minted",
  "ABII343 - Balletic / Motus Art - 200 minted",
  "ABII344 - Glass / Eric De Giuli - 300 minted",
  "ABII345 - 3 Minute Meditations / thetechnocratic - 159 minted",
  "ABII346 - 80s Pop Variety Pack - for experts only 🕹 / Daniel Catt - 366 minted",
  "ABII347 - Avalon / r0zk0 - 208 minted",
  "ABII348 - CryptoCountries: The Unpublished Archiv…l World Traveler / Michael G Devereux - 67 minted",
  "ABII349 - Totem of Taste / Hannah Yan - 128 minted",
  "ABII350 - Departed / Alexis André - 350 minted",
  "ABII351 - Staccato / Philip Bell - 200 minted",
  "ABII352 - The Inner World / Dominikus - 400 minted",
  "ABII353 - Pointila / Phaust - 200 minted",
  "ABII354 - Interferences / Juan Pedro Vallejo - 256 minted",
  "ABII355 - Thoughts of Meadow / Eric Davidson - 150 minted",
  "ABII356 - Essenza / Stefano Contiero - 444 minted",
  "ABII357 - D-D-Dots / tuplart - 160 minted",
  "ABII358 - Arcadia / Zachariah Watson - 256 minted",
  "ABII359 - Ode to Untitled / artplusbrad - 240 minted",
  "ABII361 - flora, fauna, false gods & floods / Ryan Green - 400 minted",
  "ABII362 - Erratic / Owen Moore - 400 minted",
  "ABII364 - Act of Emotion / Kelly Milligan - 400 minted",
  "ABII365 - Stains on a Canvas / Omar Lobato - 300 minted",
  "ABII366 - Sandaliya / Melissa Wiederrecht - 205 minted",
  "ABII367 - Fontana / Harvey Rayner | patterndotco - 500 minted",
  "ABII368 - Primitives / Aranda\\Lasch - 400 minted",
  "ABII369 - CENTURY 2052 / Casey REAS - 50 minted",
  "ABII370 - Rectangles (for Herbert) / Jeff Davis - 500 minted",
  "ABII371 - JPEG / Jan Robert Leegte - 275 minted",
  "ABII373 - Intersections / Rafaël Rozendaal - 300 minted",
  "ABIII374 - Ottocento / Berubara - 35 minted",
  "ABIII375 - Wabi Sabi / Kazuhiro Tanimoto - 205 minted",
  "ABIII376 - Tide Predictor / LoVid - 400 minted",
  "ABIII377 - Ingress / Paweł Dudko - 256 minted",
  "ABIII378 - Fleur / AnaPet - 300 minted",
  "ABIII379 - ORI / James Merrill - 450 minted",
  "ABIII380 - Seedlings / VES3L - 200 minted",
  "ABIII381 - Structures / Hevey - 256 minted",
  "ABIII382 - Metaphysics / Jinyao Lin - 200 minted",
  "ABIII383 - Pre-Process / Casey REAS - 120 minted",
  "ABIII384 - VOXΞL / JEANVASCRIPT - 250 minted",
  "ABIII385 - Dipolar / Junia Farquhar - 256 minted",
  "ABIII386 - Ego Death / electralina - 222 minted",
  "ABIII387 - Pointers / Steve Pikelny - 100 minted",
  "ABIII388 - Your Story / encapsuled - 102 minted",
  "ABIII389 - Miragem / Third Vision - 256 minted",
  "ABIII390 - Imposter Syndrome / ippsketch - 100 minted",
  "ABIII391 - Contrast Agent / Tim Richardson + Sean Zellmer - 14 minted",
  "ABIII392 - Hyper Drive: A-Side / Ryan Bell - 200 minted",
  "ABIII393 - Race Condition / Jonas Lund - 325 minted",
  "ABIII394 - Volute / RVig - 200 minted",
  "ABIII395 - Implications / ixnayokay - 300 minted",
  "ABIII396 - Good, Computer / Dean Blacc - 75 minted",
  "ABIII397 - Through Curved Air / Jacob Gold - 186 minted",
  "ABIII398 - Libra / Cooper Jamieson - 50 minted",
  "ABIII399 - The Field / Beervangeer - 369 minted",
  "ABIII400 - Such A Lovely Time / petitsapin - 325 minted",
  "ABIII401 - Aragnation / Devi Parikh and Abhishek Das - 128 minted",
  "ABIII404 - Ad Extremum Terrae / uMathA - 200 minted",
  "ABIII405 - chaos comes with the summer haze / Cole Sternberg - 163 minted",
  "ABIII406 - WaVyScApE / Holger Lippmann - 315 minted",
  "ABIII407 - The Harvest / Per Kristian Stoveland - 400 minted",
  "ABIII408 - NimTeens / Bryan Brinkman - 400 minted",
  "ABIII409 - Tout tracé / Florian Zumbrunn - 300 minted",
  "ABIII410 - Jenim / Orr Kislev & Alona Rodeh - 135 minted",
  "ABIII411 - Symbol 1 / Emily Weil - 153 minted",
  "ABIII412 - Cerebellum / Laya Mathikshara & Santiago - 300 minted",
  "ABIII413 - Longing / phenomena - 247 minted",
  "ABIII414 - KARMA / KALA - 33 minted",
  "ABIII415 - Renders Game / MountVitruvius - 325 minted",
  "ABIII416 - Calian / Eric De Giuli - 256 minted",
  "ABIII417 - Ceramics / Charlotte Dann - 300 minted",
  "ABIII418 - Neural Sediments / Eko33 - 300 minted",
  "ABIII419 - SL/CE / Stranger in the Q - 40 minted",
  "ABIII420 - Coalition / Generative Artworks - 37 minted",
  "ABIII421 - Rippling / Yi-Wen Lin - 128 minted",
  "ABIII422 - SKEUOMORPHS / itsgalo - 300 minted",
  "ABIII423 - Solar Transits / Robert Hodgin - 400 minted",
  "ABIII424 - Worlds Within / Jason Ting - 256 minted",
  "ABIII425 - Mellifera / artplusbrad - 58 minted",
  "ABIII426 - Cargo / Kim Asendorf - 1000 minted",
  "ABIII427 - transparency / usnea - 29 minted",
  "ABIII428 - Memories of Digital Data / Kazuhiro Tanimoto - 450 minted",
  "ABIII429 - ilumz / Wolffia Inc. & Motus Art - 57 minted",
  "ABIII430 - Fushi No Reality - フシノゲンジツ / Samsy - 255 minted",
  "ABIII431 - (Dis)connected / Tibout Shaik - 48 minted",
  "ABIII432 - Divergence / Loren Bednar - 100 minted",
  "ABIII433 - Still Moving / Nathaniel Stern and Sasha Stiles - 240 minted",
  "ABIII434 - Voyager / DisruptedStar - 300 minted",
  "ABIII435 - Flows / ryley-o.eth - 100 minted",
  "ABIII436 - UMK / Fernando Jerez - 762 minted",
  "ABIII437 - Nära / Tengil - 280 minted",
  "ABIII438 - Subtle / willstall - 256 minted",
  "ABIII439 - Enigma / RalenArc - 32 minted",
  "ABIII440 - Augury / LoVid - 126 minted",
  "ABIII441 - Net Net Net / ilithya x Erin Wajufos - 33 minted",
  "ABIII442 - Systems Madness / Claudia Hart and Andrew Blanton - 42 minted",
  "ABIII443 - Dendro / Vebjørn Isaksen - 275 minted",
  "ABIII444 - Meaningless / Amy Goodchild - 270 minted",
  "ABIII445 - Assembly / Tezumie - 86 minted",
  "ABIII446 - Invisibles / Ismahelio - 200 minted",
  "ABIII447 - Semblance / rahul iyer - 185 minted",
  "ABIII448 - Bright / Heeey - 360 minted",
  "ABIII449 - Speak To Me / Lisa Orth - 290 minted",
  "ABIII450 - Overload / Shvembldr - 200 minted",
  "ABIII451 - Backwards / Asaf Slook - 300 minted",
  "ABIII452 - Muttenz / wuwa - 67 minted",
  "ABIII453 - Crypt / The Cyclops Group - 54 minted",
  "ABIII454 - Flourish / Sterling Crispin - 270 minted",
  "ABIII455 - Human Unreadable / Operator - 400 minted",
  "ABIII456 - Spaghetti Bones / Joshua Bagley - 600 minted",
  "ABIII457 - Dopamine Machines / Steve Pikelny - 777 minted",
  "ABIII458 - Mycelia / JMY - 200 minted",
  "ABIII459 - Seasky / Ralgo - 100 minted",
  "ABIII460 - Exstasis / Grant Oesterling - 111 minted",
  "ABIII461 - Sonoran Roadways / Jake Rockland - 54 minted",
  "ABIII462 - Gumbo / Mathias Isaksen - 400 minted",
  "ABIII463 - l.o / Night Sea - 175 minted",
  "ABIII464 - Kubikino / Carolina Melis - 320 minted",
  "ABIII465 - Escherly Seeds / Martijn Cohen - 28 minted",
  "ABIII466 - Torrent / Jeres - 300 minted",
  "ABIII467 - Glasshouse INAT / Aleksandra Jovanić - 19 minted",
  "ABIII468 - Woman, Life, Freedom / Armaghan Fatemi - 36 minted",
  "ABIII469 - Twos / Emily Edelman - 64 minted",
  "ABIII470 - Forecast / Manuel Larino - 365 minted",
  "ABIII471 - This Is Not A Rock / Nicole Vella - 350 minted",
  "ABIII472 - because unless until / ixnayokay - 650 minted",
  "ABIII473 - Fluiroso / Sebastián Brocher (CryptoArte) - 105 minted",
  "ABIII474 - Lumina / DistCollective - 80 minted",
  "ABIII475 - Recollection / Robert Hodgin - 168 minted",
  "ABIII476 - Life and Love and Nothing / Nat Sarkissian - 200 minted",
  "ABIII477 - siempre en mí, siempre en ti / Marcelo Soria-Rodríguez - 200 minted",
  "ABIII478 - Lucky Clover / Sputniko! - 40 minted",
  "ABIII479 - Bakhoor Assandal / Melissa Wiederrecht - 200 minted",
  "ABIII480 - Axo / jiwa - 400 minted",
  "ABIII481 - Immaterial / Bjørn Staal - 280 minted",
  "ABIII482 - Trichro-matic / MountVitruvius - 600 minted",
  "ABIII483 - Naïve / Olga Fradina - 300 minted",
  "ABIII484 - Blind Spots / Shaderism - 400 minted",
  "ABIII486 - Proscenium / remnynt - 400 minted",
  "ABIII487 - Cytographia / Golan Levin - 418 minted",
  "ABIII488 - Växt / Tengil - 150 minted",
  "ABIII489 - Balance / Kelly Milligan x Amber Vittoria - 250 minted",
  "ABIII490 - Twist / Rafaël Rozendaal - 250 minted",
  "ABIII493 - Melancholic Magical Maiden / Emi Kusano - 300 minted",
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
  "ABXBM1 - 923 EMPTY ROOMS / Casey REAS - 924 minted",
  "ABS0 - Misbah / Melissa Wiederrecht - 55 minted",
  "ABSI0 - One More Day / Aaron Penne - 50 minted",
  "ABSII0 - variaciones del yo / Marcelo Soria-Rodríguez - 52 minted",
  "ABSIII0 - Fragmented Perception / Motus Art - 19 minted",
  "ABSIV0 - Monochronos / Heeey - 26 minted",
  "ABSIX0 - On-Chain Memory Token / Jeff Davis - 83 minted",
  "ABSXI0 - Alchimie / RVig - 80 minted",
  "ABSXV0 - Untitled / Olga Fradina - 27 minted",
  "ABSXIII0 - AnnoMetta / Matto - 1 minted",
  "ABSXVI0 - Incircles / Jos Vromans - 61 minted",
  "ABSXX0 - Mister Shifty and the Drifty Dudes / Joshua Bagley - 250 minted",
  "ABSXXV0 - Precursor (Chimera) / mpkoz - 1 minted",
  "ABSXXV1 - Ink / mpkoz - 1 minted",
  "ABSXXVI0 - Roots / Fernando Jerez - 1 minted",
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
  "PLOTII1 - Scribble Together / minimizer - 435 minted",
  "STBYS0 - Themes and Variations / Vera Molnár, in collaboration with Martin Grasser - 500 minted",
  "ATP0 - LOVE / Martin Grasser - 300 minted",
  "GRAIL1 - Fold / rudxane - 400 minted",
  "GRAIL2 - Atlas / Eric De Giuli - 333 minted",
  "PROOF1 - aaa / fingacode - 99 minted",
  "PROOF2 - Memorias del espacio olvidado / Juan Rodríguez García - 150 minted",
  "PROOF3 - 7 Factorial / Lars Wander - 19 minted",
  "PROOF4 - Lycorises / Xin Liu and Nan Zhao - 99 minted",
  "PROOF5 - Impossible Distance / ippsketch - 600 minted",
  "PROOF6 - cathedral study / Eric De Giuli - 600 minted",
  "PROOF7 - Deja Vu / Melissa Wiederrecht - 507 minted",
  "PROOF8 - WaveShapes / Owen Moore - 231 minted",
  "PROOF9 - Ephemeral Tides / Ryan Bell - 307 minted",
  "PROOF10 - StackSlash / Kelly Milligan - 194 minted",
  "PROOF11 - Viridaria / Sarah Ridgley - 450 minted",
  "PROOF12 - Windwoven / Radix (Rob Dixon) - 107 minted",
  "PROOF13 - Memory Loss / Andrew Mitchell - 256 minted",
  "PROOF14 - The Collector's Room / Carlos Marcial - 260 minted",
  "PROOF15 - Extrañezas / Marcelo Soria-Rodríguez - 152 minted",
  "AOI0 - Pursuit / Per Kristian Stoveland - 200 minted",
  "AOI1 - Echo of Intensity / Per Kristian Stoveland - 1595 minted",
  "AOI2 - /// / Snowfro - 2000 minted",
  "AOI3 - Signature / Jack Butcher - 200 minted",
  "AOI4 - Trademark / Jack Butcher - 10000 minted",
  "AOI5 - Decision Matrix / Kjetil Golid - 377 minted",
  "AOI6 - Risk / Reward / Kjetil Golid - 1855 minted",
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
  "HODL15 - Gravity / Pawel Dudko - 45 minted",
  "HODL16 - Wired wonders / Alessandro Fiore - 53 minted",
  "HODL17 - Nebulous / KRANKARTA - 20 minted",
  "FAB0 - Giving Shape / ippsketch - 99 minted",
  "FLUTTER0 - Worlds / Kenny Vaden - 500 minted",
  "FLUTTER1 - Leggenda / Stefano Contiero - 888 minted",
  "FLUTTER2 - Fluxus / Monotau - 234 minted",
  "CDESK0 - Microcosms / Fahad Karim - 161 minted",
  "ARTCODE0 - Ensemble / Loren Bednar - 404 minted",
  "ARTCODE1 - Deconstructed City Plans / Proof of Beauty Studios - 38 minted",
  "TBOA0 - AIXXA / Shvembldr - 600 minted",
  "TBOA1 - [post]-konstrukt / Shvembldr - 26 minted",
  "TENDER0 - Of That Ilk / KRANKARTA - 200 minted",
  "LOM0 - Sacred Trees / hideo - 267 minted",
]

const curated = [
  0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 17, 21, 23, 27, 28, 29, 35, 39, 40,
  41, 53, 59, 62, 64, 72, 74, 78, 89, 100, 114, 120, 129, 131, 138, 143, 147,
  159, 173, 204, 206, 209, 214, 215, 225, 232, 233, 250, 255, 261, 267, 282,
  284, 296, 304, 309, 320, 328, 333, 334, 336, 337, 341, 364, 367, 368, 376,
  379, 383, 385, 399, 406, 407, 412, 416, 417, 418, 423, 426, 428, 433, 455,
  456, 457, 462, 466, 471, 472, 482, 483, 484, 486, 487, 488, 493,
]

/***************************************************
 *                UPDATE LIST FUNCTION
 **************************************************/
const bloncks = [
  "ABSII",
  "ABSIII",
  "ABSIV",
  "ABSIX",
  "ABSXV",
  "ABSXVI",
  "ABSXXVI",
]
// fetchBlocks(bloncks)

async function fetchBlocks(bloncks) {
  for (const contractName of bloncks) {
    const n = contractIndexMap[contractName]
    const isContractV2 = isV2.includes(contractName)
    const end = Number(await contracts[n].nextProjectId())
    const iStart =
      contractName === "ABII"
        ? 3
        : contractName === "ABIII"
        ? 374
        : contractName === "ABXPACEII"
        ? 5
        : ["GRAIL", "HODL", "UNITLDN", "PROOF"].includes(contractName)
        ? 1
        : 0
    let newList = ""

    for (let i = iStart; i < end; i++) {
      const [detail, token] = await Promise.all([
        contracts[n].projectDetails(i.toString()),
        isContractV2
          ? contracts[n].projectTokenInfo(i)
          : contracts[n].projectStateData(i),
      ])

      if (token.invocations > 0) {
        newList += `"${contractName}${i} - ${detail[0]} / ${detail[1]} - ${token.invocations} minted", `
      } else {
        console.log(`no token for ${contractName}${i}`)
      }
    }
    console.log(newList)
  }
}

/***************************************************
 *        GET DATA FROM ETHEREUM FUNCTIONS
 **************************************************/
let contractData = {}

async function grabData(tokenId, contract) {
  try {
    toggleSpin()
    clearPanels()
    clearDataStorage()
    console.log("Contract:", contract, "\nToken Id:", tokenId)

    const isContractV2 = isV2.includes(contractNameMap[contract])

    const projIdPromise = fetchProjectId(tokenId, contract)
    const hashPromise = fetchHash(tokenId, contract)
    const ownerPromise = fetchOwner(tokenId, contract)

    const projId = Number(await projIdPromise)

    const projectInfoPromise = fetchProjectInfo(projId, contract, isContractV2)
    const detailPromise = fetchProjectDetails(projId, contract)
    const editionInfoPromise = fetchEditionInfo(projId, contract, isContractV2)

    const projectInfo = await projectInfoPromise

    const scriptPromise = constructScript(projId, projectInfo, contract)
    const extLibPromise = extractLibraryName(projectInfo)

    const [hash, { owner, ensName }, detail, script, editionInfo, extLib] =
      await Promise.all([
        hashPromise,
        ownerPromise,
        detailPromise,
        scriptPromise,
        editionInfoPromise,
        extLibPromise,
      ])

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
        edition: editionInfo.edition,
        remaining: editionInfo.remaining,
      })
    )
    location.reload()
  } catch (error) {
    console.error("grabData:", error)
    search.placeholder = "error"
  }
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
  const scriptPromises = []
  for (let i = 0; i < projectInfo.scriptCount; i++) {
    scriptPromises.push(contracts[contract].projectScriptByIndex(projId, i))
  }
  const scripts = await Promise.all(scriptPromises)
  return scripts.join("")
}

async function fetchProjectDetails(projId, contract) {
  return contracts[contract].projectDetails(projId)
}

async function fetchOwner(tokenId, contract) {
  const owner = await contracts[contract].ownerOf(tokenId)
  let ensName = null
  try {
    ensName = await provider.lookupAddress(owner)
  } catch (error) {
    ensName = null
  }
  return { owner, ensName }
}

function extractLibraryName(projectInfo) {
  if (typeof projectInfo[0] === "string" && projectInfo[0].includes("@")) {
    return projectInfo[0].trim()
  } else {
    return JSON.parse(projectInfo[0]).type
  }
}

async function fetchEditionInfo(projId, contract, isContractV2) {
  const invo = await (isContractV2
    ? contracts[contract].projectTokenInfo(projId)
    : contracts[contract].projectStateData(projId))

  return {
    edition: Number(invo.maxInvocations),
    remaining: Number(invo.maxInvocations - invo.invocations),
  }
}

async function updateContractData(tokenId, contract) {
  try {
    toggleSpin()
    clearPanels()
    console.log("Contract:", contract, "\nToken Id:", tokenId)

    const hashPromise = fetchHash(tokenId, contract)
    const ownerPromise = fetchOwner(tokenId, contract)
    const [hash, { owner, ensName }] = await Promise.all([
      hashPromise,
      ownerPromise,
    ])

    contractData.tokenId = tokenId
    contractData.hash = hash
    contractData.owner = owner
    contractData.ensName = ensName

    localStorage.setItem("contractData", JSON.stringify(contractData))

    location.reload()
  } catch (error) {
    console.error("updateContractData:", error)
    search.placeholder = "error"
  }
}

/***************************************************
 *              UPDATE UI FUNCTIONS
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
  const curation = [0, 1, 2].includes(contract) ? getCuration(projId) : null
  const platform = getPlatform(contract, curation)

  updateInfo(
    contract,
    owner,
    ensName,
    detail,
    tokenId,
    platform,
    edition,
    remaining
  )
  injectFrame()
}

function pushItemToLocalStorage(contract, tokenId, hash, script, extLib) {
  const src = libs[extLib]

  const tokenIdHash =
    contract == 0
      ? `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`
      : `let tokenData = {tokenId: "${tokenId}", hash: "${hash}" }`
  let process = extLib == "processing" ? "application/processing" : ""

  localStorage.setItem(
    "scriptData",
    JSON.stringify({ src, tokenIdHash, process, script })
  )
}

function getCuration(projId) {
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
    : "Art Blocks Presents"
}

function getPlatform(contract, curation) {
  const contractName = contractNameMap[contract]
  const platform = {
    EXP: "Art Blocks Explorations",
    ABXBM: "Art Blocks &times; Bright Moments",
    STBYS: "Sotheby's",
    ATP: "ATP",
    GRAIL: "Grailers",
    AOI: "AOI",
    VCA: "Vertical Crypto Art",
    SDAO: "SquiggleDAO",
    MINTS: "Endaoment",
    TDG: "The Disruptive Gallery",
    VFA: "Vertu Fine Art",
    UNITLDN: "Unit London",
    TRAME: "Trame",
    HODL: "Hodlers",
    FAB: "Foundation for Art and Blockchain",
    FLUTTER: "FlamingoDAO",
    TENDER: "Tender",
    CDESK: "Coindesk",
    ARTCODE: "Redlion",
    TBOA: "TBOA Club",
    LOM: "Legends of Metaterra",
    PROOF: "PROOF",
  }

  ;[
    [["AB", "ABII", "ABIII"], curation],
    [["ABXPACE", "ABXPACEII"], "Art Blocks &times; Pace"],
    [["BM", "BMF", "CITIZEN"], "Bright Moments"],
    [["PLOT", "PLOTII"], "Plottables"],
    [isStudio, "Art Blocks Studio"],
  ].forEach(([keys, value]) => keys.forEach((key) => (platform[key] = value)))

  return platform[contractName] || null
}

function updateInfo(
  contract,
  owner,
  ensName,
  detail,
  tokenId,
  platform,
  edition,
  remaining
) {
  let artist = detail[1]
  const logs = []
  frame.contentWindow.console.log = function (message) {
    if (contractNameMap[contract] == "BMF" && logs.length === 0) {
      message = message.replace(/Artist\s*\d+\.\s*/, "").replace(/\s*--.*/, "")
      logs.push(message)
      artist = logs[0]
      updateInfo()
    }
  }

  const mintedOut =
    remaining == 0
      ? `Edition of ${edition} works.`
      : `Edition of ${edition} works, ${remaining} remaining.`

  const updateInfo = () => {
    info.innerHTML = `${detail[0]} #${shortId(tokenId)} / ${artist}`
    panel.innerHTML = `<p><span style="font-size: 1.4em">${detail[0]}</span><br>
        ${artist} ● ${platform}<br>
        ${mintedOut}</p><br>
      <p>${detail[2]} <a href="${detail[3]}" target="_blank">${extractDomain(
      detail[3]
    )}</a></p><br>
      <p>Owner <a href="https://zapper.xyz/account/${owner}" target="_blank">${
      ensName || shortAddr(owner)
    }</a><span class="copy-text" data-text="${owner}"><i class="fa-regular fa-copy"></i></span><br>
        Contract <a href="https://etherscan.io/address/${
          contracts[contract].target
        }" target="_blank">${shortAddr(
      contracts[contract].target
    )}</a><span class="copy-text" data-text="${
      contracts[contract].target
    }"><i class="fa-regular fa-copy"></i></span><br>
        Token Id <span class="copy-text" data-text="${tokenId}">${tokenId}<i class="fa-regular fa-copy"></i></span></p>`

    document.querySelectorAll(".copy-text").forEach((element) =>
      element.addEventListener("click", (event) => {
        const textToCopy = element.getAttribute("data-text")
        copyToClipboard(textToCopy)
        const toast = document.createElement("span")
        toast.classList.add("toast")
        toast.textContent = "Copied"
        element.querySelector("i").after(toast)
        setTimeout(() => {
          toast.remove()
        }, 1000)
      })
    )
  }
  updateInfo()
}

function shortId(tokenId) {
  return tokenId < 1000000
    ? tokenId
    : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0
}

function shortAddr(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

function extractDomain(url) {
  const match = url.match(/https?:\/\/(www\.)?([^\/]+)/)
  return match
    ? `<span class="domain-link"><i class="fa-solid fa-link"></i> ${match[2]}</span>`
    : ""
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
}

/***************************************************
 *           INJECT IFRAME FUNCTION
 **************************************************/
async function injectFrame() {
  try {
    const iframeDocument = frame.contentDocument || frame.contentWindow.document
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

    let dynamicContent =
      contractData.extLib === "custom"
        ? `<script>${scriptData.tokenIdHash}</script>${scriptData.script}`
        : `<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1', maximum-scale=1>
      <script src='${scriptData.src || ""}'></script>
      <script>${scriptData.tokenIdHash};</script> <style type="text/css">
        html {height: 100%;}
        body {min-height: 100%; margin: 0; padding: 0; background-color: transparent;}
        canvas {padding: 0; margin: auto; display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0;}
      </style></head>${frameBody}</html>`

    iframeDocument.open()
    iframeDocument.write(dynamicContent)
    iframeDocument.close()
  } catch (error) {
    console.error("injectFrame:", error)
  }
}

/***************************************************
 *              GET TOKEN FUNCTIONS
 **************************************************/
function getToken(line, searchQuery) {
  if (searchQuery === "curated") {
    getRandom(filteredList)
  } else if (/^\d+$/.test(searchQuery)) {
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

  updateContractData(tokenId, contract)
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
 *        LIST DISPLAY/NAVIGATION FUNCTIONS
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
  if (query.toLowerCase() === "curated") {
    filteredList = lines.filter((line) => {
      const idMatch = line.match(/^AB(?:III|II)?(\d+)/)
      if (idMatch) {
        const id = parseInt(idMatch[1])
        return curated.includes(id)
      }
    })
  } else {
    filteredList = lines.filter((line) =>
      line.toLowerCase().includes(query.toLowerCase())
    )
  }

  displayList(filteredList)
  selectedIndex = -1
}
displayList(list)

function handleItemClick(event) {
  const listItem = event.target.closest(".list-item")
  if (listItem) {
    const selectedIndex = listItem.getAttribute("data-index")
    console.log("Item clicked:", filteredList[selectedIndex])
    getToken(filteredList[selectedIndex], "")
    search.value = ""
  }
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

  if (selectedIndex !== -1)
    items[selectedIndex].scrollIntoView({ block: "nearest" })
}

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
    console.log(randomKey)
    console.log(contractData)
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
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: 60000,
  action: null,
}

function loopRandom(interval, action) {
  clearInterval(intervalId)
  const favorite = JSON.parse(localStorage.getItem("favorite"))

  if (loopState.isLooping !== "true") {
    performAction(action, favorite)
  }

  intervalId = setInterval(() => {
    performAction(action, favorite)
  }, interval)

  loopState = { isLooping: "true", interval, action }
  localStorage.setItem("loopState", JSON.stringify(loopState))
}

function performAction(action, favorite) {
  if (action === "loopAll") getRandom(list)
  else if (action === "favLoop") getRandomKey(favorite)
  else if (action === "curatedLoop") {
    filterList(list, "curated")
    getRandom(filteredList)
  } else if (action === "selectedLoop") {
    let random = Math.floor(
      Math.random() * (contractData.edition + 1)
    ).toString()
    getToken(list, random)
  }
}

function stopRandomLoop() {
  clearInterval(intervalId)
  loopState.isLooping = "false"
  localStorage.setItem("loopState", JSON.stringify(loopState))
}

function checkLocalStorage() {
  loopInput.placeholder = `${loopState.interval / 60000}m`

  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action)
}

function handleLoopClick(action) {
  dropdownMenu.classList.remove("active")

  let inputValue = loopInput.value.trim()
  const inputVal = parseInt(inputValue, 10)

  const interval =
    loopState.interval &&
    (inputValue === "" || loopState.interval === inputVal * 60000)
      ? loopState.interval
      : inputVal * 60000

  if (!isNaN(interval) && interval > 0) {
    loopRandom(interval, action)
    toggleInfobar()
  } else {
    alert("Please enter a time in minutes.")
  }

  if (inputValue !== "" && interval !== loopState.interval) {
    loopState = { isLooping: "false", interval: interval, action: action }
    localStorage.setItem("loopState", JSON.stringify(loopState))
  }
}

function stopLoop() {
  stopRandomLoop()
  toggleInfobar()
  location.reload()
}

/***************************************************
 *           SAVE THE OUTPUT FUNCTION
 **************************************************/
async function saveOutput() {
  clearPanels()
  const content = frame.contentDocument.documentElement.outerHTML
  let id = shortId(contractData.tokenId)
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
 *   MANIPULATE SAVED OUTPUT IN STORAGE FUNCTIONS
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
 *       GET PREVIOUS/NEXT ID FUNCTIONS
 **************************************************/
function incrementTokenId() {
  contractData.tokenId = contractData.tokenId + 1
  updateContractData(contractData.tokenId, contractData.contract)
}

function decrementTokenId() {
  contractData.tokenId = contractData.tokenId - 1
  updateContractData(contractData.tokenId, contractData.contract)
}

inc.addEventListener("click", incrementTokenId)
dec.addEventListener("click", decrementTokenId)

/***************************************************
 *               HELPER FUNCTIONS
 **************************************************/
function clearDataStorage() {
  ;["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d))
}

function clearPanels() {
  ;[listPanel, panel, favPanel].forEach((p) => p.classList.remove("active"))
  overlay.classList.remove("active")
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

  overlay.classList.toggle("active", isActive)
}

function toggleKeyShort(event) {
  document.querySelector(".key-short").style.display =
    event.type === "focusin" ? "none" : "block"
}

function toggleInfobar() {
  const isInfobarInactive = infobar.classList.toggle("inactive")
  localStorage.setItem("infobarInactive", isInfobarInactive)
}

function updateButtons() {
  const isLooping = loopState.isLooping === "true"
  const isInfobarInactive = localStorage.getItem("infobarInactive") === "true"

  document.querySelector(
    isLooping ? ".fa-repeat" : ".fa-circle-stop"
  ).style.display = "none"

  document.querySelector(
    isInfobarInactive ? ".fa-eye-slash" : ".fa-eye"
  ).style.display = "none"

  infobar.classList.toggle("inactive", isInfobarInactive)
}

function addHoverEffect(button, menu) {
  let timer

  function showMenu() {
    clearTimeout(timer)
    menu.classList.add("active")
  }

  function hideMenu() {
    timer = setTimeout(() => {
      menu.classList.remove("active")
    }, 300)
  }

  button.addEventListener("mouseover", showMenu)
  button.addEventListener("mouseout", hideMenu)
  menu.addEventListener("mouseover", showMenu)
  menu.addEventListener("mouseout", hideMenu)
}
addHoverEffect(document.querySelector(".fa-repeat"), dropdownMenu)

/***************************************************
 *                     EVENTS
 **************************************************/
document.addEventListener("DOMContentLoaded", () => {
  updateButtons()
  checkLocalStorage()

  contractData = JSON.parse(localStorage.getItem("contractData"))
  if (contractData) update(...Object.values(contractData))

  const value = contractData ? "block" : "none"
  ;[inc, dec, save].forEach((el) => (el.style.display = value))

  const val = rpcUrl ? "none" : "block"
  ;[rpcUrlInput, instruction].forEach((el) => (el.style.display = val))

  if (!rpcUrl) document.getElementById("infoBox").style.display = "none"
  console.log(contractData)
  root.classList.remove("no-flash")
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

info.addEventListener("click", (event) => {
  event.stopPropagation()
  togglePanel(panel)
})

document.querySelector(".search-icon").addEventListener("click", (event) => {
  event.stopPropagation()
  togglePanel(listPanel)
})

document.querySelector(".fav-icon").addEventListener("click", (event) => {
  event.stopPropagation()
  displayFavoriteList()
  togglePanel(favPanel)
})

document.addEventListener("click", () => {
  clearPanels()
})

panel.addEventListener("click", (event) => {
  event.stopPropagation()
})
listPanel.addEventListener("click", (event) => {
  event.stopPropagation()
})
favPanel.addEventListener("click", (event) => {
  event.stopPropagation()
})

search.addEventListener("input", () => {
  if (search.value.trim() !== "") {
    listPanel.classList.add("active")
    panel.classList.remove("active")
    favPanel.classList.remove("active")
    overlay.classList.add("active")
  }
})

search.addEventListener("focusin", toggleKeyShort)
search.addEventListener("focusout", toggleKeyShort)

document.getElementById("loopAll").addEventListener("click", () => {
  handleLoopClick("loopAll")
})
document.getElementById("favLoop").addEventListener("click", () => {
  handleLoopClick("favLoop")
})
document.getElementById("curatedLoop").addEventListener("click", () => {
  handleLoopClick("curatedLoop")
})
document.getElementById("selectedLoop").addEventListener("click", () => {
  handleLoopClick("selectedLoop")
})

document.querySelector(".fa-circle-stop").addEventListener("click", stopLoop)

document.getElementById("hideInfobar").addEventListener("click", () => {
  toggleInfobar()
  location.reload()
})

document.getElementById("fullscreen").addEventListener("click", () => {
  if (frame.requestFullscreen) {
    frame.requestFullscreen()
  } else if (frame.mozRequestFullScreen) {
    frame.mozRequestFullScreen()
  } else if (frame.webkitRequestFullscreen) {
    frame.webkitRequestFullscreen()
  } else if (frame.msRequestFullscreen) {
    frame.msRequestFullscreen()
  }
})

/***************************************************
 *              DARK/LIGHT MODE TOGGLE
 **************************************************/
const root = document.documentElement

function setDarkMode(isDarkMode) {
  root.classList.toggle("dark-mode", isDarkMode)
  document.querySelector(".fa-sun").style.display = isDarkMode
    ? "inline-block"
    : "none"
  document.querySelector(".fa-moon").style.display = isDarkMode
    ? "none"
    : "inline-block"
}

function toggleDarkMode() {
  const updateTheme = !root.classList.contains("dark-mode")
  localStorage.setItem("darkMode", updateTheme)
  setDarkMode(updateTheme)
}

document.getElementById("theme").addEventListener("click", (event) => {
  event.stopPropagation()
  toggleDarkMode()
})

setDarkMode(JSON.parse(localStorage.getItem("darkMode")))
