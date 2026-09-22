const view = (name, inputs, outputs) => ({
  inputs,
  name,
  outputs,
  stateMutability: "view",
  type: "function",
});

const legacy = (fn) => ({
  ...fn,
  constant: true,
  payable: false,
});

const u = (n) => ({ internalType: "uint256", name: n, type: "uint256" });
const s = (n) => ({ internalType: "string", name: n, type: "string" });
const b = (n) => ({ internalType: "bool", name: n, type: "bool" });
const a = (n) => ({ internalType: "address", name: n, type: "address" });
const pid = () => [u("_projectId")];

const fn = {
  nextProjectId: view("nextProjectId", [], [u("")]),
  ownerOf: view("ownerOf", [u("tokenId")], [a("")]),
  tokenIdToHash: view("tokenIdToHash", [u("")], [
    { internalType: "bytes32", name: "", type: "bytes32" },
  ]),
  projectScriptByIndex: view("projectScriptByIndex", [u("_projectId"), u("_index")], [s("")]),
  preferredIPFSGateway: view("preferredIPFSGateway", [], [s("")]),
  preferredArweaveGateway: view("preferredArweaveGateway", [], [s("")]),
  projectExternalAssetDependencyCount: view(
    "projectExternalAssetDependencyCount",
    pid(),
    [u("")],
  ),
  projectDetailsDynamic: () =>
    legacy(
      view("projectDetails", pid(), [
        s("projectName"),
        s("artist"),
        s("description"),
        s("website"),
        s("license"),
        b("dynamic"),
      ]),
    ),
  projectDetailsPlain: () =>
    view("projectDetails", pid(), [
      s("projectName"),
      s("artist"),
      s("description"),
      s("website"),
      s("license"),
    ]),
  projectScriptInfoV1: () =>
    legacy(
      view("projectScriptInfo", pid(), [
        s("scriptJSON"),
        u("scriptCount"),
        u("hashes"),
        s("ipfsHash"),
        b("locked"),
        b("paused"),
      ]),
    ),
  projectScriptInfoV2: () =>
    legacy(
      view("projectScriptInfo", pid(), [
        s("scriptJSON"),
        u("scriptCount"),
        b("useHashString"),
        s("ipfsHash"),
        b("locked"),
        b("paused"),
      ]),
    ),
  projectScriptInfoFlex: () =>
    view("projectScriptInfo", pid(), [
      s("scriptJSON"),
      u("scriptCount"),
      s("ipfsHash"),
      b("locked"),
      b("paused"),
    ]),
  projectTokenInfoBase: [
    a("artistAddress"),
    u("pricePerTokenInWei"),
    u("invocations"),
    u("maxInvocations"),
    b("active"),
    a("additionalPayee"),
    u("additionalPayeePercentage"),
  ],
  projectTokenInfoV1: () =>
    legacy(view("projectTokenInfo", pid(), fn.projectTokenInfoBase)),
  projectTokenInfoV2: () =>
    legacy(
      view("projectTokenInfo", pid(), [
        ...fn.projectTokenInfoBase,
        s("currency"),
        a("currencyAddress"),
      ]),
    ),
  projectTokenInfoFlex: () =>
    view("projectTokenInfo", pid(), [
      ...fn.projectTokenInfoBase,
      s("currency"),
      a("currencyAddress"),
    ]),
  projectScriptDetails: () =>
    view("projectScriptDetails", pid(), [
      s("scriptTypeAndVersion"),
      s("aspectRatio"),
      u("scriptCount"),
    ]),
  projectStateData: () =>
    view("projectStateData", pid(), [
      u("invocations"),
      u("maxInvocations"),
      b("active"),
      b("paused"),
      u("completedTimestamp"),
      b("locked"),
    ]),
  extDepByIndex: (enumName, structName, withExtra) =>
    view("projectExternalAssetDependencyByIndex", [u("_projectId"), u("_index")], [
      {
        components: [
          s("cid"),
          {
            internalType: `enum ${enumName}.ExternalAssetDependencyType`,
            name: "dependencyType",
            type: "uint8",
          },
          ...(withExtra
            ? [
                a("bytecodeAddress"),
                s("data"),
              ]
            : []),
        ],
        internalType: `struct ${structName}`,
        name: "",
        type: "tuple",
      },
    ]),
  getTokenParams: () =>
    view(
      "getTokenParams",
      [a("coreContract"), u("tokenId")],
      [
        {
          components: [s("key"), s("value")],
          internalType: "struct IWeb3Call.TokenParam[]",
          name: "tokenParams",
          type: "tuple[]",
        },
      ],
    ),
};

const abi = {
  v1: [
    fn.nextProjectId,
    legacy(
      view("showTokenHashes", [u("_tokenId")], [
        { internalType: "bytes32[]", name: "", type: "bytes32[]" },
      ]),
    ),
    fn.projectScriptInfoV1(),
    fn.projectScriptByIndex,
    fn.projectDetailsDynamic(),
    fn.ownerOf,
    fn.projectTokenInfoV1(),
  ],
  v2: [
    fn.nextProjectId,
    fn.projectScriptInfoV2(),
    fn.projectScriptByIndex,
    fn.projectDetailsDynamic(),
    fn.ownerOf,
    fn.projectTokenInfoV2(),
    fn.tokenIdToHash,
  ],
  v3: [
    fn.nextProjectId,
    fn.projectDetailsPlain(),
    fn.projectScriptByIndex,
    fn.projectScriptDetails(),
    fn.projectStateData(),
    fn.ownerOf,
    fn.tokenIdToHash,
  ],
  v2Flex: [
    fn.nextProjectId,
    fn.preferredArweaveGateway,
    fn.preferredIPFSGateway,
    fn.projectDetailsPlain(),
    fn.extDepByIndex(
      "GenArt721CoreV2_BrightMomentsFlex",
      "GenArt721CoreV2_BrightMomentsFlex.ExternalAssetDependency",
      false,
    ),
    fn.projectExternalAssetDependencyCount,
    fn.projectScriptByIndex,
    fn.projectScriptInfoFlex(),
    fn.projectTokenInfoFlex(),
    fn.ownerOf,
    fn.tokenIdToHash,
  ],
  v3Flex: [
    fn.nextProjectId,
    fn.preferredArweaveGateway,
    fn.preferredIPFSGateway,
    fn.projectDetailsPlain(),
    fn.extDepByIndex(
      "IGenArt721CoreContractV3_Engine_Flex",
      "IGenArt721CoreContractV3_Engine_Flex.ExternalAssetDependencyWithData",
      true,
    ),
    fn.projectExternalAssetDependencyCount,
    fn.projectScriptByIndex,
    fn.projectScriptDetails(),
    fn.projectStateData(),
    fn.ownerOf,
    fn.tokenIdToHash,
  ],
  bm: [],
  PMPV0: [fn.getTokenParams()],
};

abi.bm = abi.v2.map((entry) =>
  entry.name === "projectScriptInfo"
    ? {
        ...entry,
        outputs: entry.outputs.filter(
          (output) => output.name !== "useHashString",
        ),
      }
    : entry,
);

const reg = (abi, address, platform, startProjId) => ({
  abi,
  address,
  ...(platform ? { platform } : {}),
  ...(startProjId !== undefined ? { startProjId } : {}),
});

export const contractRegistry = {
  ABPMPV0: reg(abi.PMPV0, "0x00000000A78E278b2d2e2935FaeBe19ee9F1FF14"),
  AB: reg(abi.v1, "0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a"),
  ABII: reg(abi.v2, "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270", undefined, 3),
  ABIII: reg(abi.v3, "0x99a9B7c1116f9ceEB1652de04d5969CcE509B069", undefined, 374),
  ABC: reg(abi.v3, "0xAB0000000000aa06f89B268D604a9c1C41524Ac6", "Art Blocks Curated", 494),
  ABCFLEX: reg(abi.v3Flex, "0xAB00000000002ADE39f58F9D8278a31574fFBe77", "Art Blocks Curated", 505),
  ABEXP: reg(abi.v3, "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a", "Art Blocks Explorations"),
  ABEXPII: reg(abi.v3Flex, "0xAbaBabABAb20053426aD1C782de9ea8444358070", "Art Blocks Explorations"),
  ABXPACE: reg(abi.v2, "0x64780CE53f6e966E18a22Af13a2F97369580Ec11", "Art Blocks &times; Pace"),
  ABXPACEII: reg(abi.v3, "0xEa698596b6009A622C3eD00dD5a8b5d1CAE4fC36", "Art Blocks &times; Pace", 5),
  ABXBM: reg(abi.v3, "0x145789247973C5D612bF121e9E4Eef84b63Eb707", "Art Blocks &times; Bright Moments"),
  ABS: reg(abi.v3Flex, "0x0000000c687F0226Eaf0bdb39104fAD56738CDF2"),
  ABSI: reg(abi.v3Flex, "0x0000000b0a4340083AFbA8b0B71CBcD80432Cf2c"),
  ABSII: reg(abi.v3Flex, "0x0000000A77593CDa3f3434454AE534163Fe1A431"),
  ABSIII: reg(abi.v3Flex, "0x000000058b5d9E705Ee989fAbc8DFdC1BFBdFA6B"),
  ABSIV: reg(abi.v3Flex, "0x0000000826d45c6b947d485eeB8322AccCad8DdB"),
  ABSV: reg(abi.v3, "0x000000098a14b4e08132Fd55fAec521Ab597a001"),
  ABSVII: reg(abi.v3Flex, "0x00000007cC35dcab4a396249AEFa295A8b6E16Ba"),
  ABSVIII: reg(abi.v3Flex, "0x00000008a4f78D6941786e7fB09Fb59a62CDE226"),
  ABSIX: reg(abi.v3Flex, "0x000009Bb1740EEA484F7DB00000a9227e578bf96"),
  ABSX: reg(abi.v3Flex, "0x000010EFE35a97f37FcDfd00fd20006e5228650A"),
  ABSXI: reg(abi.v3, "0x000000a6E6366BAF7c98a2Ab73D3Df1092DD7bB0"),
  ABSXII: reg(abi.v3Flex, "0x0000000b79eBa5Ae9327D9B802aC778a67E5c156"),
  ABSXIII: reg(abi.v3Flex, "0x000000cB8bad52b0d51f4190Dd1C62Ce1cDE1e9D"),
  ABSXV: reg(abi.v3Flex, "0x000000e0808eAe91ad4D81d2789b8cAf89747B61"),
  ABSXVI: reg(abi.v3, "0x000000fF2fBC55B982010B42E235cC2A0ce3250b"),
  ABSXVIII: reg(abi.v3, "0x0000018afA7Ca51648ed4B2B00C133005Ea17115"),
  ABSXX: reg(abi.v3Flex, "0x1725Dc55c1bd5200BF00566CF20000B10800C68e"),
  ABSXXI: reg(abi.v3, "0x9800005DEB3Cfaf80077DBE9B9004c0020C1D6c5"),
  ABSXXII: reg(abi.v3, "0xd40030fd1d00f1A9944462ff0025e9C8D0003500"),
  ABSXXIII: reg(abi.v3Flex, "0xa73300003E020C436A67809E9300301600013000"),
  ABSXXV: reg(abi.v3, "0xDd6800Ac7a54331b00000080Bbd1EF463475005B"),
  ABSXXVI: reg(abi.v3Flex, "0x5e581e596e9951BB00246E00a70030009b620054"),
  ABSXXVII: reg(abi.v3Flex, "0x45e94b8c6087775c0074003B0056dEeC41008f00"),
  ABSXXVIII: reg(abi.v3Flex, "0xf3cC21a4009093B45B5d005ce7a0A80000580056"),
  ABSXXX: reg(abi.v3Flex, "0x8db6f700A7c90000F92Ac90084aD93a500f1eAE0"),
  ABSXXXI: reg(abi.v3, "0xB3526a6400260078517643cFD8490078803E0000"),
  ABSXXXII: reg(abi.v3Flex, "0x0000003601Ae3F24a52323705FB36b8833071FD3"),
  ABSXXXV: reg(abi.v3Flex, "0x00000038610bc4C96eF657aa1bcB8902ae65C62a"),
  ABSXXXVIII: reg(abi.v3, "0x000000Adf65E202866a4a405AE9629E12a039a62"),
  ABSXL: reg(abi.v3Flex, "0x0000652240c8c945067775d290641000594D0090"),
  ABSXLI: reg(abi.v3Flex, "0x0000186A8bA59C7f63423B0E528e384000008Ac9"),
  ABSL: reg(abi.v3Flex, "0x0000F6Bc84aB98fbD8fce1f6D047965C723F0000"),
  ABSLI: reg(abi.v3Flex, "0x0000149485Af7433F8dA00419b931100D4AaEF42"),
  ABSLIII: reg(abi.v3Flex, "0x0000001590abfB45B052C28fB7dAC11C062B9337"),
  ABSLIV: reg(abi.v3, "0x0000B52017e1eC58F64171B6001518C07a9AeC00"),
  ABSLVI: reg(abi.v3, "0x000000A35301Fa5784E820F489003FfcfFdc69a6"),
  ABSLXIII: reg(abi.v3, "0x000000637FddCdD459b047897afB3ea46aa6f334"),
  ABSLXVI: reg(abi.v3Flex, "0x0000006693e685fcFc54C9d423b5E321B4A15192"),
  ABSLXVII: reg(abi.v3, "0x0000000BF96eb73f37239F61c9344E40d4c3F665"),
  ABSLXXI: reg(abi.v3, "0x8Ce22a649a0EA5008900740028007278038d0023"),
  ABSLXXII: reg(abi.v3, "0x7C78F67700e700B4005c8a3d920A1A99e6004800"),
  ABSLXXIII: reg(abi.v3, "0xb265cb2eE300007D8889440041f900f109aE00c9"),
  ABSLXXIV: reg(abi.v3, "0x02f518c529a0002E505000795D00C500EB00534A"),
  ABSLXXV: reg(abi.v3, "0xDCDDfC0003483509ab0066006E00c3386914EB00"),
  ABSLXXVI: reg(abi.v3Flex, "0xaa00B2b2dB36B8F8004A9AA96F0012005D92B300"),
  ABSLXXVIII: reg(abi.v3Flex, "0x00000053a75735169ad44F6760C11F3d3d3B3544"),
  ABSLXXIX: reg(abi.v3Flex, "0x000000DAb303a194b3F55d4702B24740ad5a2F00"),
  ABSLXXX: reg(abi.v3, "0x000056C200618b979900c3F1eF9Aef86f4C47eaa"),
  ABSLXXXI: reg(abi.v3, "0x000000c9572b8a9A638f238510aF4E90a4E365ee"),
  ABSLXXXII: reg(abi.v3Flex, "0x0000EDe7875F9Ef0AaE96100ceEB0040b85274e6"),
  ABSLXXXIII: reg(abi.v3, "0x000004c65Ceb3182BE720037fb001a6E1962acB4"),
  ABSLXXXIV: reg(abi.v3, "0x0000528A4A3859020A7970110c16941a00FADf00"),
  ABSLXXXV: reg(abi.v3Flex, "0x00000041a2980e05cB4FBBBC735F17EfF443b592"),
  ABSLXXXVI: reg(abi.v3, "0x00000024CA7F3Cfba7084e3289a9048D79261B29"),
  ABSLXXXVII: reg(abi.v3Flex, "0x000000B394cac6057D87Df835bea27844b3E2828"),
  ABSLXXXVIII: reg(abi.v3Flex, "0x000000DC68934eD27Fd11E32491cdF6717ACAF21"),
  ABSLXXXIX: reg(abi.v3, "0x000000399EFC1EF4666A18b9c29325234CCea397"),
  ABSXC: reg(abi.v3, "0x00009F857C1ccD5ca0DC5900427fb8DA00628099"),
  ABSXCI: reg(abi.v3Flex, "0x000019bD92633E9e00dC08aDB0d0DFfB00A1fe2a"),
  ABSXCII: reg(abi.v3, "0x0000000C687DaeD0fbA60d1dBA4e5f6149E8B894"),
  ABSXCIII: reg(abi.v3, "0x70270E65bC37832ef845fA330C2B71501970DaB9"),
  ABSXCIV: reg(abi.v3, "0xe9e108B3085b2C9EbB32b65D8c452853ED40c47B"),
  ABSXCVI: reg(abi.v3Flex, "0x935606f8A3A707e67e56408bA98aC286Ab46fe2A"),
  ABSXCVIII: reg(abi.v3, "0x78AC66980B3e5fEc2ee5242ffd509F0AeCBfaA8F"),
  ABSXCIX: reg(abi.v3, "0x9F01D15cDE74BB479102e9b6fae1958A3C08b524"),
  ABSCI: reg(abi.v3, "0x16DA6C9f17b525613950BFBA89f7719DAD35607d"),
  ABSCII: reg(abi.v3Flex, "0x51144c0cb2b77dC4a2D6573211602eC27a343112"),
  ABSCIV: reg(abi.v3Flex, "0xcfa6A2d5bc2a77C0cDd3046E09Da21E45d1dF0F1"),
  ABSCV: reg(abi.v3Flex, "0xA144fe940DD7aA85Ff79c1C5E3ED35c163e313A8"),
  ABSCVI: reg(abi.v3Flex, "0xa246Bf4293E6c293450428Bf804429e214a2aDeA"),
  ABSCVII: reg(abi.v3, "0xcEb0C691553c416fe68BC740f769b12064b75e9A"),
  ABSCVIII: reg(abi.v3Flex, "0xD0B1B81C2821aBe2ADBBaE79dB7037a5c1F72A94"),
  ABSCIX: reg(abi.v3, "0x0000007cd0fEB822A31293D3eA5F2325c624a29b"),
  ABSCXI: reg(abi.v3Flex, "0x00000096DF621F2A8EF2f103B7299b7910d8cD99"),
  BM: reg(abi.bm, "0x0A1BBD57033F57E7B6743621b79fCB9Eb2CE3676", "Bright Moments"),
  BMF: reg(abi.v3, "0x381233D5584fDb42e46b4D9ba91876479AAb7AcD", "Bright Moments"),
  BMFLEX: reg(abi.v2Flex, "0x7c3Ea2b7B3beFA1115aB51c09F0C9f245C500B18", "Bright Moments"),
  CITIZEN: reg(abi.v2, "0xbDdE08BD57e5C9fD563eE7aC61618CB2ECdc0ce0", "Bright Moments"),
  PLOT: reg(abi.v2, "0xa319C382a702682129fcbF55d514E61a16f97f9c", "Plottables"),
  PLOTII: reg(abi.v3, "0xAc521EA7A83a3Bc3f9f1e09F8300a6301743fB1f", "Plottables"),
  PLOTFLEX: reg(abi.v2Flex, "0x18dE6097cE5B5B2724C9Cae6Ac519917f3F178c0", "Plottables"),
  STBYS: reg(abi.v3Flex, "0xe034bb2b1B9471e11cf1a0a9199a156fb227aa5D", "Sotheby's"),
  ATP: reg(abi.v2, "0x4D928AB507Bf633DD8e68024A1fB4c99316bBdf3", "ATP"),
  GRAIL: reg(abi.v3Flex, "0xAf40b66072Fe00CAcF5A25Cd1b7F1688Cde20f2F", "Grailers", 1),
  AOI: reg(abi.v3Flex, "0x8cDBd7010Bd197848e95C1FD7F6E870AaC9b0d3C", "AOI"),
  VCA: reg(abi.v2Flex, "0x32D4BE5eE74376e08038d652d4dc26E62C67F436", "Vertical Crypto Art"),
  SDAO: reg(abi.v3Flex, "0x77D4b54e91822E9799AB0900876D6B1cdA752706", "SquiggleDAO"),
  MINTS: reg(abi.v2, "0xEafE7b73A3cfA804b761debcF077D4574588dfe7", "Endaoment"),
  FLUTTER: reg(abi.v2, "0x13aAe6f9599880edbB7d144BB13F1212CeE99533", "FlamingoDAO"),
  CDESK: reg(abi.v2, "0x2b3c48Be4fB33B0724214aFF12b086B0214f8F15", "Coindesk"),
  ARTCODE: reg(abi.v2, "0xd10e3DEe203579FcEE90eD7d0bDD8086F7E53beB", "Redlion"),
  TBOA: reg(abi.v2, "0x62e37f664b5945629B6549a87F8e10Ed0B6D923b", "TBOA Club"),
  LOM: reg(abi.v2, "0x010bE6545e14f1DC50256286d9920e833F809C6A", "Legends of Metaterra"),
  TDG: reg(abi.v3Flex, "0x96A83b48dE94E130Cf2AA81b28391c28EE33d253", "The Disruptive Gallery"),
  VFA: reg(abi.v3Flex, "0xEdd5c3D8e8fC1E88b93A98282b8ccfD953C483A4", "Vertu Fine Art"),
  UNITLDN: reg(abi.v3Flex, "0x5D8EFdc20272CD3E24a27DfE7F25795a107c99a2", "Unit London", 1),
  TRAME: reg(abi.v2Flex, "0x1D0977e86c70EAbb5c8fD98DB1B08C6d60caa0C1", "Trame"),
  HODL: reg(abi.v3Flex, "0x9F79e46A309f804Aa4B7B53a1F72c69137427794", "Hodlers", 1),
  FAB: reg(abi.v3, "0xC443588d22Fb0f8dAB928e52014CC23d2Df70743", "Foundation for Art and Blockchain"),
  TENDER: reg(abi.v3, "0x6DdefE5DB20D79EC718A8960177bEB388f7EbB8d", "Tender"),
  TENDERFLEX: reg(abi.v3Flex, "0x959d2F3cAF19d20BDBb4e0A4f21cA8A815EDDF65", "Tender"),
  PROOF: reg(abi.v3Flex, "0x1353fd9d3dC70d1a18149C8FB2ADB4FB906DE4E8", "PROOF", 1),
  PROOFII: reg(abi.v3Flex, "0x294fED5F1D3D30cfA6Fe86A937dC3141EEc8bC6d", "PROOF"),
  CPG: reg(abi.v3Flex, "0x000000412217F67742376769695498074f007b97", "CPG"),
  DE: reg(abi.v3Flex, "0x5306e34B7437200E0189CbC5F80B0990E49DCBE7", "Davis Editions"),
  NEWRAFAEL: reg(abi.v2, "0x68C01Cb4733a82A58D5e7bB31BdDBFF26A3A35d5"),
  XCORE: reg(abi.v3Flex, "0xC04E0000726ED7c5b9f0045Bc0c4806321BC6C65"),
  WRLD: reg(abi.v3Flex, "0x5fdf5E6CAf7b8b0F64c3612aFd85E9407A7e1389", "Artwrld", 1),
  OONA: reg(abi.v3Flex, "0x000000d1dc20aF3f7746dC61a4718eDCe700cED8", undefined, 2026),
  VERSE: reg(abi.v2Flex, "0xBB5471c292065d3b01b2e81e299267221ae9a250", "Verse"),
  HVOID: reg(abi.v3Flex, "0xF03511eC774289DA497CDb2070Df4c711580fF7A"),
  GAZ: reg(abi.v3Flex, "0xA86cD4EceBd96085fCe4697614d30600803455C4", "Gazelli Art House"),
  AXIOM: reg(abi.v3, "0x9209070E1447018638e15b73Dbee46Bf085fcf5f", "Axiom", 35),
  NGEN: reg(abi.v3Flex, "0x440E1B5A98332BcA7564DbffA4146f976CE75397", "Noble Gallery"),
  MARILYN: reg(abi.v2, "0xFF124D975c7792E706552b18ec9DA24781751CAb"),
  DOODLE: reg(abi.v2, "0x28f2D3805652FB5d359486dFfb7D08320D403240", "Doodle Labs"),
  GLITCH: reg(abi.v3Flex, "0xE18F2247FE4A69c0E2210331B0604F6D10FecE9E", "Glitch Gallery", 1),
  GLITCHII: reg(abi.v3Flex, "0x0000000222D40f1aE80791fdC42fa6eb5dA6f80B", "Glitch Gallery", 2),
  STITCH: reg(abi.v3Flex, "0x00000000E75eadc620f4FCEfAb32F5173749C3a4", "Stitchables"),
  SHIS: reg(abi.v3Flex, "0xc74eC888104842277Fa1b74e1C3D415eb673009F", "Shiseido", 1),
  RAVENABE: reg(abi.v3Flex, "0xd9b7eC74C06c558A59AfdE6a16E614950730F44d"),
  ITERATION: reg(abi.v2, "0x54a6356244059d5A50b97200a928f19a3682b669", "9dcc"),
  NUMBER: reg(abi.v3Flex, "0xB8E8Bec0891A7519091E18590e0b60221853dd2B"),
  MAYA: reg(abi.v3, "0x00002491B000Aa008756652C87cc92D87e896f0f", "Maya Spirits"),
};

export const is = {
  v3: [],
  flex: [],
  studio: [],
  engine: [],
};

(function updateIs() {
  Object.entries(contractRegistry).forEach(([key, { abi: contractAbi }]) => {
    const abiName = Object.keys(abi).find((name) => abi[name] === contractAbi);

    if (abiName?.includes("3")) is.v3.push(key);
    if (abiName?.includes("Flex")) is.flex.push(key);
    if (key.startsWith("ABS")) is.studio.push(key);
    if (!key.startsWith("AB")) is.engine.push(key);
  });
})();
