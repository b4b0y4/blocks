// Common function definitions to reduce duplication
const fn = {
  nextProjectId: {
    inputs: [],
    name: "nextProjectId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  ownerOf: {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  tokenIdToHash: {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "tokenIdToHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  projectScriptByIndex: {
    inputs: [
      { internalType: "uint256", name: "_projectId", type: "uint256" },
      { internalType: "uint256", name: "_index", type: "uint256" },
    ],
    name: "projectScriptByIndex",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  preferredIPFSGateway: {
    inputs: [],
    name: "preferredIPFSGateway",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  preferredArweaveGateway: {
    inputs: [],
    name: "preferredArweaveGateway",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  projectExternalAssetDependencyCount: {
    inputs: [{ internalType: "uint256", name: "_projectId", type: "uint256" }],
    name: "projectExternalAssetDependencyCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
};

// Contract ABIs by version
const abi = {
  v1: [
    fn.nextProjectId,
    {
      constant: true,
      inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
      name: "showTokenHashes",
      outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectScriptInfo",
      outputs: [
        { internalType: "string", name: "scriptJSON", type: "string" },
        { internalType: "uint256", name: "scriptCount", type: "uint256" },
        { internalType: "uint256", name: "hashes", type: "uint256" },
        { internalType: "string", name: "ipfsHash", type: "string" },
        { internalType: "bool", name: "locked", type: "bool" },
        { internalType: "bool", name: "paused", type: "bool" },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    fn.projectScriptByIndex,
    {
      constant: true,
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectDetails",
      outputs: [
        { internalType: "string", name: "projectName", type: "string" },
        { internalType: "string", name: "artist", type: "string" },
        { internalType: "string", name: "description", type: "string" },
        { internalType: "string", name: "website", type: "string" },
        { internalType: "string", name: "license", type: "string" },
        { internalType: "bool", name: "dynamic", type: "bool" },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    fn.ownerOf,
    {
      constant: true,
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectTokenInfo",
      outputs: [
        { internalType: "address", name: "artistAddress", type: "address" },
        {
          internalType: "uint256",
          name: "pricePerTokenInWei",
          type: "uint256",
        },
        { internalType: "uint256", name: "invocations", type: "uint256" },
        { internalType: "uint256", name: "maxInvocations", type: "uint256" },
        { internalType: "bool", name: "active", type: "bool" },
        { internalType: "address", name: "additionalPayee", type: "address" },
        {
          internalType: "uint256",
          name: "additionalPayeePercentage",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ],
  v2: [
    fn.nextProjectId,
    {
      constant: true,
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectScriptInfo",
      outputs: [
        { internalType: "string", name: "scriptJSON", type: "string" },
        { internalType: "uint256", name: "scriptCount", type: "uint256" },
        { internalType: "bool", name: "useHashString", type: "bool" },
        { internalType: "string", name: "ipfsHash", type: "string" },
        { internalType: "bool", name: "locked", type: "bool" },
        { internalType: "bool", name: "paused", type: "bool" },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    fn.projectScriptByIndex,
    {
      constant: true,
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectDetails",
      outputs: [
        { internalType: "string", name: "projectName", type: "string" },
        { internalType: "string", name: "artist", type: "string" },
        { internalType: "string", name: "description", type: "string" },
        { internalType: "string", name: "website", type: "string" },
        { internalType: "string", name: "license", type: "string" },
        { internalType: "bool", name: "dynamic", type: "bool" },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    fn.ownerOf,
    {
      constant: true,
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectTokenInfo",
      outputs: [
        { internalType: "address", name: "artistAddress", type: "address" },
        {
          internalType: "uint256",
          name: "pricePerTokenInWei",
          type: "uint256",
        },
        { internalType: "uint256", name: "invocations", type: "uint256" },
        { internalType: "uint256", name: "maxInvocations", type: "uint256" },
        { internalType: "bool", name: "active", type: "bool" },
        { internalType: "address", name: "additionalPayee", type: "address" },
        {
          internalType: "uint256",
          name: "additionalPayeePercentage",
          type: "uint256",
        },
        { internalType: "string", name: "currency", type: "string" },
        { internalType: "address", name: "currencyAddress", type: "address" },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    fn.tokenIdToHash,
  ],
  v3: [
    fn.nextProjectId,
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectDetails",
      outputs: [
        { internalType: "string", name: "projectName", type: "string" },
        { internalType: "string", name: "artist", type: "string" },
        { internalType: "string", name: "description", type: "string" },
        { internalType: "string", name: "website", type: "string" },
        { internalType: "string", name: "license", type: "string" },
      ],
      stateMutability: "view",
      type: "function",
    },
    fn.projectScriptByIndex,
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectScriptDetails",
      outputs: [
        {
          internalType: "string",
          name: "scriptTypeAndVersion",
          type: "string",
        },
        { internalType: "string", name: "aspectRatio", type: "string" },
        { internalType: "uint256", name: "scriptCount", type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectStateData",
      outputs: [
        { internalType: "uint256", name: "invocations", type: "uint256" },
        { internalType: "uint256", name: "maxInvocations", type: "uint256" },
        { internalType: "bool", name: "active", type: "bool" },
        { internalType: "bool", name: "paused", type: "bool" },
        {
          internalType: "uint256",
          name: "completedTimestamp",
          type: "uint256",
        },
        { internalType: "bool", name: "locked", type: "bool" },
      ],
      stateMutability: "view",
      type: "function",
    },
    fn.ownerOf,
    fn.tokenIdToHash,
  ],
  v2Flex: [
    fn.nextProjectId,
    fn.preferredArweaveGateway,
    fn.preferredIPFSGateway,
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectDetails",
      outputs: [
        { internalType: "string", name: "projectName", type: "string" },
        { internalType: "string", name: "artist", type: "string" },
        { internalType: "string", name: "description", type: "string" },
        { internalType: "string", name: "website", type: "string" },
        { internalType: "string", name: "license", type: "string" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
        { internalType: "uint256", name: "_index", type: "uint256" },
      ],
      name: "projectExternalAssetDependencyByIndex",
      outputs: [
        {
          components: [
            { internalType: "string", name: "cid", type: "string" },
            {
              internalType:
                "enum GenArt721CoreV2_BrightMomentsFlex.ExternalAssetDependencyType",
              name: "dependencyType",
              type: "uint8",
            },
          ],
          internalType:
            "struct GenArt721CoreV2_BrightMomentsFlex.ExternalAssetDependency",
          name: "",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    fn.projectExternalAssetDependencyCount,
    fn.projectScriptByIndex,
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectScriptInfo",
      outputs: [
        { internalType: "string", name: "scriptJSON", type: "string" },
        { internalType: "uint256", name: "scriptCount", type: "uint256" },
        { internalType: "string", name: "ipfsHash", type: "string" },
        { internalType: "bool", name: "locked", type: "bool" },
        { internalType: "bool", name: "paused", type: "bool" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectTokenInfo",
      outputs: [
        { internalType: "address", name: "artistAddress", type: "address" },
        {
          internalType: "uint256",
          name: "pricePerTokenInWei",
          type: "uint256",
        },
        { internalType: "uint256", name: "invocations", type: "uint256" },
        { internalType: "uint256", name: "maxInvocations", type: "uint256" },
        { internalType: "bool", name: "active", type: "bool" },
        { internalType: "address", name: "additionalPayee", type: "address" },
        {
          internalType: "uint256",
          name: "additionalPayeePercentage",
          type: "uint256",
        },
        { internalType: "string", name: "currency", type: "string" },
        { internalType: "address", name: "currencyAddress", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    fn.ownerOf,
    fn.tokenIdToHash,
  ],
  v3Flex: [
    fn.nextProjectId,
    fn.preferredArweaveGateway,
    fn.preferredIPFSGateway,
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectDetails",
      outputs: [
        { internalType: "string", name: "projectName", type: "string" },
        { internalType: "string", name: "artist", type: "string" },
        { internalType: "string", name: "description", type: "string" },
        { internalType: "string", name: "website", type: "string" },
        { internalType: "string", name: "license", type: "string" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
        { internalType: "uint256", name: "_index", type: "uint256" },
      ],
      name: "projectExternalAssetDependencyByIndex",
      outputs: [
        {
          components: [
            { internalType: "string", name: "cid", type: "string" },
            {
              internalType:
                "enum IGenArt721CoreContractV3_Engine_Flex.ExternalAssetDependencyType",
              name: "dependencyType",
              type: "uint8",
            },
            {
              internalType: "address",
              name: "bytecodeAddress",
              type: "address",
            },
            { internalType: "string", name: "data", type: "string" },
          ],
          internalType:
            "struct IGenArt721CoreContractV3_Engine_Flex.ExternalAssetDependencyWithData",
          name: "",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    fn.projectExternalAssetDependencyCount,
    fn.projectScriptByIndex,
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectScriptDetails",
      outputs: [
        {
          internalType: "string",
          name: "scriptTypeAndVersion",
          type: "string",
        },
        { internalType: "string", name: "aspectRatio", type: "string" },
        { internalType: "uint256", name: "scriptCount", type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_projectId", type: "uint256" },
      ],
      name: "projectStateData",
      outputs: [
        { internalType: "uint256", name: "invocations", type: "uint256" },
        { internalType: "uint256", name: "maxInvocations", type: "uint256" },
        { internalType: "bool", name: "active", type: "bool" },
        { internalType: "bool", name: "paused", type: "bool" },
        {
          internalType: "uint256",
          name: "completedTimestamp",
          type: "uint256",
        },
        { internalType: "bool", name: "locked", type: "bool" },
      ],
      stateMutability: "view",
      type: "function",
    },
    fn.ownerOf,
    fn.tokenIdToHash,
  ],
  bm: [],
  PMPV0: [
    {
      inputs: [
        { internalType: "address", name: "coreContract", type: "address" },
        { internalType: "uint256", name: "tokenId", type: "uint256" },
      ],
      name: "getTokenParams",
      outputs: [
        {
          components: [
            { internalType: "string", name: "key", type: "string" },
            { internalType: "string", name: "value", type: "string" },
          ],
          internalType: "struct IWeb3Call.TokenParam[]",
          name: "tokenParams",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
};

// Create a modified copy of abi.v2 and store it in abi.bm
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

// Registry of all supported contracts, keyed by short name.
export const contractRegistry = {
  ABPMPV0: {
    abi: abi.PMPV0,
    address: "0x00000000A78E278b2d2e2935FaeBe19ee9F1FF14",
  },
  AB: {
    abi: abi.v1,
    address: "0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a",
  },
  ABII: {
    abi: abi.v2,
    address: "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270",
    startProjId: 3,
  },
  ABIII: {
    abi: abi.v3,
    address: "0x99a9B7c1116f9ceEB1652de04d5969CcE509B069",
    startProjId: 374,
  },
  ABC: {
    abi: abi.v3,
    address: "0xAB0000000000aa06f89B268D604a9c1C41524Ac6",
    platform: "Art Blocks Curated",
    startProjId: 494,
  },
  ABCFLEX: {
    abi: abi.v3Flex,
    address: "0xAB00000000002ADE39f58F9D8278a31574fFBe77",
    platform: "Art Blocks Curated",
    startProjId: 505,
  },
  ABEXP: {
    abi: abi.v3,
    address: "0x942BC2d3e7a589FE5bd4A5C6eF9727DFd82F5C8a",
    platform: "Art Blocks Explorations",
  },
  ABXPACE: {
    abi: abi.v2,
    address: "0x64780CE53f6e966E18a22Af13a2F97369580Ec11",
    platform: "Art Blocks &times; Pace",
  },
  ABXPACEII: {
    abi: abi.v3,
    address: "0xEa698596b6009A622C3eD00dD5a8b5d1CAE4fC36",
    platform: "Art Blocks &times; Pace",
    startProjId: 5,
  },
  ABXBM: {
    abi: abi.v3,
    address: "0x145789247973C5D612bF121e9E4Eef84b63Eb707",
    platform: "Art Blocks &times; Bright Moments",
  },
  ABS: {
    abi: abi.v3Flex,
    address: "0x0000000c687F0226Eaf0bdb39104fAD56738CDF2",
  },
  ABSI: {
    abi: abi.v3Flex,
    address: "0x0000000b0a4340083AFbA8b0B71CBcD80432Cf2c",
  },
  ABSII: {
    abi: abi.v3Flex,
    address: "0x0000000A77593CDa3f3434454AE534163Fe1A431",
  },
  ABSIII: {
    abi: abi.v3Flex,
    address: "0x000000058b5d9E705Ee989fAbc8DFdC1BFBdFA6B",
  },
  ABSIV: {
    abi: abi.v3Flex,
    address: "0x0000000826d45c6b947d485eeB8322AccCad8DdB",
  },
  ABSVII: {
    abi: abi.v3Flex,
    address: "0x00000007cC35dcab4a396249AEFa295A8b6E16Ba",
  },
  ABSVIII: {
    abi: abi.v3Flex,
    address: "0x00000008a4f78D6941786e7fB09Fb59a62CDE226",
  },
  ABSIX: {
    abi: abi.v3Flex,
    address: "0x000009Bb1740EEA484F7DB00000a9227e578bf96",
  },
  ABSX: {
    abi: abi.v3Flex,
    address: "0x000010EFE35a97f37FcDfd00fd20006e5228650A",
  },
  ABSXI: {
    abi: abi.v3,
    address: "0x000000a6E6366BAF7c98a2Ab73D3Df1092DD7bB0",
  },
  ABSXII: {
    abi: abi.v3Flex,
    address: "0x0000000b79eBa5Ae9327D9B802aC778a67E5c156",
  },
  ABSXIII: {
    abi: abi.v3Flex,
    address: "0x000000cB8bad52b0d51f4190Dd1C62Ce1cDE1e9D",
  },
  ABSXV: {
    abi: abi.v3Flex,
    address: "0x000000e0808eAe91ad4D81d2789b8cAf89747B61",
  },
  ABSXVI: {
    abi: abi.v3,
    address: "0x000000fF2fBC55B982010B42E235cC2A0ce3250b",
  },
  ABSXVIII: {
    abi: abi.v3,
    address: "0x0000018afA7Ca51648ed4B2B00C133005Ea17115",
  },
  ABSXX: {
    abi: abi.v3Flex,
    address: "0x1725Dc55c1bd5200BF00566CF20000B10800C68e",
  },
  ABSXXI: {
    abi: abi.v3,
    address: "0x9800005DEB3Cfaf80077DBE9B9004c0020C1D6c5",
  },
  ABSXXII: {
    abi: abi.v3,
    address: "0xd40030fd1d00f1A9944462ff0025e9C8D0003500",
  },
  ABSXXIII: {
    abi: abi.v3Flex,
    address: "0xa73300003E020C436A67809E9300301600013000",
  },
  ABSXXV: {
    abi: abi.v3,
    address: "0xDd6800Ac7a54331b00000080Bbd1EF463475005B",
  },
  ABSXXVI: {
    abi: abi.v3Flex,
    address: "0x5e581e596e9951BB00246E00a70030009b620054",
  },
  ABSXXVII: {
    abi: abi.v3Flex,
    address: "0x45e94b8c6087775c0074003B0056dEeC41008f00",
  },
  ABSXXVIII: {
    abi: abi.v3Flex,
    address: "0xf3cC21a4009093B45B5d005ce7a0A80000580056",
  },
  ABSXXX: {
    abi: abi.v3Flex,
    address: "0x8db6f700A7c90000F92Ac90084aD93a500f1eAE0",
  },
  ABSXXXI: {
    abi: abi.v3,
    address: "0xB3526a6400260078517643cFD8490078803E0000",
  },
  ABSXXXII: {
    abi: abi.v3Flex,
    address: "0x0000003601Ae3F24a52323705FB36b8833071FD3",
  },
  ABSXXXV: {
    abi: abi.v3Flex,
    address: "0x00000038610bc4C96eF657aa1bcB8902ae65C62a",
  },
  ABSXXXVIII: {
    abi: abi.v3,
    address: "0x000000Adf65E202866a4a405AE9629E12a039a62",
  },
  ABSXL: {
    abi: abi.v3Flex,
    address: "0x0000652240c8c945067775d290641000594D0090",
  },
  ABSL: {
    abi: abi.v3Flex,
    address: "0x0000F6Bc84aB98fbD8fce1f6D047965C723F0000",
  },
  ABSLIII: {
    abi: abi.v3Flex,
    address: "0x0000001590abfB45B052C28fB7dAC11C062B9337",
  },
  ABSLIV: {
    abi: abi.v3,
    address: "0x0000B52017e1eC58F64171B6001518C07a9AeC00",
  },
  ABSLVI: {
    abi: abi.v3,
    address: "0x000000A35301Fa5784E820F489003FfcfFdc69a6",
  },
  ABSLXIII: {
    abi: abi.v3,
    address: "0x000000637FddCdD459b047897afB3ea46aa6f334",
  },
  ABSLXVII: {
    abi: abi.v3,
    address: "0x0000000BF96eb73f37239F61c9344E40d4c3F665",
  },
  ABSLXXI: {
    abi: abi.v3,
    address: "0x8Ce22a649a0EA5008900740028007278038d0023",
  },
  ABSLXXII: {
    abi: abi.v3,
    address: "0x7C78F67700e700B4005c8a3d920A1A99e6004800",
  },
  ABSLXXIII: {
    abi: abi.v3,
    address: "0xb265cb2eE300007D8889440041f900f109aE00c9",
  },
  ABSLXXIV: {
    abi: abi.v3,
    address: "0x02f518c529a0002E505000795D00C500EB00534A",
  },
  ABSLXXV: {
    abi: abi.v3,
    address: "0xDCDDfC0003483509ab0066006E00c3386914EB00",
  },
  ABSLXXVIII: {
    abi: abi.v3Flex,
    address: "0x00000053a75735169ad44F6760C11F3d3d3B3544",
  },
  ABSLXXIX: {
    abi: abi.v3Flex,
    address: "0x000000DAb303a194b3F55d4702B24740ad5a2F00",
  },
  ABSLXXX: {
    abi: abi.v3,
    address: "0x000056C200618b979900c3F1eF9Aef86f4C47eaa",
  },
  ABSLXXXI: {
    abi: abi.v3,
    address: "0x000000c9572b8a9A638f238510aF4E90a4E365ee",
  },
  ABSLXXXII: {
    abi: abi.v3Flex,
    address: "0x0000EDe7875F9Ef0AaE96100ceEB0040b85274e6",
  },
  ABSLXXXIII: {
    abi: abi.v3,
    address: "0x000004c65Ceb3182BE720037fb001a6E1962acB4",
  },
  ABSLXXXIV: {
    abi: abi.v3,
    address: "0x0000528A4A3859020A7970110c16941a00FADf00",
  },
  ABSLXXXV: {
    abi: abi.v3Flex,
    address: "0x00000041a2980e05cB4FBBBC735F17EfF443b592",
  },
  ABSLXXXVI: {
    abi: abi.v3,
    address: "0x00000024CA7F3Cfba7084e3289a9048D79261B29",
  },
  ABSLXXXVII: {
    abi: abi.v3Flex,
    address: "0x000000B394cac6057D87Df835bea27844b3E2828",
  },
  ABSLXXXVIII: {
    abi: abi.v3Flex,
    address: "0x000000DC68934eD27Fd11E32491cdF6717ACAF21",
  },
  BM: {
    abi: abi.bm,
    address: "0x0A1BBD57033F57E7B6743621b79fCB9Eb2CE3676",
    platform: "Bright Moments",
  },
  BMF: {
    abi: abi.v3,
    address: "0x381233D5584fDb42e46b4D9ba91876479AAb7AcD",
    platform: "Bright Moments",
  },
  BMFLEX: {
    abi: abi.v2Flex,
    address: "0x7c3Ea2b7B3beFA1115aB51c09F0C9f245C500B18",
    platform: "Bright Moments",
  },
  CITIZEN: {
    abi: abi.v2,
    address: "0xbDdE08BD57e5C9fD563eE7aC61618CB2ECdc0ce0",
    platform: "Bright Moments",
  },
  PLOT: {
    abi: abi.v2,
    address: "0xa319C382a702682129fcbF55d514E61a16f97f9c",
    platform: "Plottables",
  },
  PLOTII: {
    abi: abi.v3,
    address: "0xAc521EA7A83a3Bc3f9f1e09F8300a6301743fB1f",
    platform: "Plottables",
  },
  PLOTFLEX: {
    abi: abi.v2Flex,
    address: "0x18dE6097cE5B5B2724C9Cae6Ac519917f3F178c0",
    platform: "Plottables",
  },
  STBYS: {
    abi: abi.v3Flex,
    address: "0xe034bb2b1B9471e11cf1a0a9199a156fb227aa5D",
    platform: "Sotheby's",
  },
  ATP: {
    abi: abi.v2,
    address: "0x4D928AB507Bf633DD8e68024A1fB4c99316bBdf3",
    platform: "ATP",
  },
  GRAIL: {
    abi: abi.v3Flex,
    address: "0xAf40b66072Fe00CAcF5A25Cd1b7F1688Cde20f2F",
    platform: "Grailers",
    startProjId: 1,
  },
  AOI: {
    abi: abi.v3Flex,
    address: "0x8cDBd7010Bd197848e95C1FD7F6E870AaC9b0d3C",
    platform: "AOI",
  },
  VCA: {
    abi: abi.v2Flex,
    address: "0x32D4BE5eE74376e08038d652d4dc26E62C67F436",
    platform: "Vertical Crypto Art",
  },
  SDAO: {
    abi: abi.v3Flex,
    address: "0x77D4b54e91822E9799AB0900876D6B1cdA752706",
    platform: "SquiggleDAO",
  },
  MINTS: {
    abi: abi.v2,
    address: "0xEafE7b73A3cfA804b761debcF077D4574588dfe7",
    platform: "Endaoment",
  },
  FLUTTER: {
    abi: abi.v2,
    address: "0x13aAe6f9599880edbB7d144BB13F1212CeE99533",
    platform: "FlamingoDAO",
  },
  CDESK: {
    abi: abi.v2,
    address: "0x2b3c48Be4fB33B0724214aFF12b086B0214f8F15",
    platform: "Coindesk",
  },
  ARTCODE: {
    abi: abi.v2,
    address: "0xd10e3DEe203579FcEE90eD7d0bDD8086F7E53beB",
    platform: "Redlion",
  },
  TBOA: {
    abi: abi.v2,
    address: "0x62e37f664b5945629B6549a87F8e10Ed0B6D923b",
    platform: "TBOA Club",
  },
  LOM: {
    abi: abi.v2,
    address: "0x010bE6545e14f1DC50256286d9920e833F809C6A",
    platform: "Legends of Metaterra",
  },
  TDG: {
    abi: abi.v3Flex,
    address: "0x96A83b48dE94E130Cf2AA81b28391c28EE33d253",
    platform: "The Disruptive Gallery",
  },
  VFA: {
    abi: abi.v3Flex,
    address: "0xEdd5c3D8e8fC1E88b93A98282b8ccfD953C483A4",
    platform: "Vertu Fine Art",
  },
  UNITLDN: {
    abi: abi.v3Flex,
    address: "0x5D8EFdc20272CD3E24a27DfE7F25795a107c99a2",
    platform: "Unit London",
    startProjId: 1,
  },
  TRAME: {
    abi: abi.v2Flex,
    address: "0x1D0977e86c70EAbb5c8fD98DB1B08C6d60caa0C1",
    platform: "Trame",
  },
  HODL: {
    abi: abi.v3Flex,
    address: "0x9F79e46A309f804Aa4B7B53a1F72c69137427794",
    platform: "Hodlers",
    startProjId: 1,
  },
  FAB: {
    abi: abi.v3,
    address: "0xC443588d22Fb0f8dAB928e52014CC23d2Df70743",
    platform: "Foundation for Art and Blockchain",
  },
  TENDER: {
    abi: abi.v3,
    address: "0x6DdefE5DB20D79EC718A8960177bEB388f7EbB8d",
    platform: "Tender",
  },
  TENDERFLEX: {
    abi: abi.v3Flex,
    address: "0x959d2F3cAF19d20BDBb4e0A4f21cA8A815EDDF65",
    platform: "Tender",
  },
  PROOF: {
    abi: abi.v3Flex,
    address: "0x1353fd9d3dC70d1a18149C8FB2ADB4FB906DE4E8",
    platform: "PROOF",
    startProjId: 1,
  },
  PROOFII: {
    abi: abi.v3Flex,
    address: "0x294fED5F1D3D30cfA6Fe86A937dC3141EEc8bC6d",
    platform: "PROOF",
  },
  CPG: {
    abi: abi.v3Flex,
    address: "0x000000412217F67742376769695498074f007b97",
    platform: "CPG",
  },
  DE: {
    abi: abi.v3Flex,
    address: "0x5306e34B7437200E0189CbC5F80B0990E49DCBE7",
    platform: "Davis Editions",
  },
  NEWRAFAEL: {
    abi: abi.v2,
    address: "0x68C01Cb4733a82A58D5e7bB31BdDBFF26A3A35d5",
  },
  XCORE: {
    abi: abi.v3Flex,
    address: "0xC04E0000726ED7c5b9f0045Bc0c4806321BC6C65",
  },
  WRLD: {
    abi: abi.v3Flex,
    address: "0x5fdf5E6CAf7b8b0F64c3612aFd85E9407A7e1389",
    platform: "Artwrld",
    startProjId: 1,
  },
  OONA: {
    abi: abi.v3Flex,
    address: "0x000000d1dc20aF3f7746dC61a4718eDCe700cED8",
    startProjId: 2026,
  },
  VERSE: {
    abi: abi.v2Flex,
    address: "0xBB5471c292065d3b01b2e81e299267221ae9a250",
    platform: "Verse",
  },
  HVOID: {
    abi: abi.v3Flex,
    address: "0xF03511eC774289DA497CDb2070Df4c711580fF7A",
  },
  GAZ: {
    abi: abi.v3Flex,
    address: "0xA86cD4EceBd96085fCe4697614d30600803455C4",
    platform: "Gazelli Art House",
  },
  AXIOM: {
    abi: abi.v3,
    address: "0x9209070E1447018638e15b73Dbee46Bf085fcf5f",
    platform: "Axiom",
    startProjId: 35,
  },
  NGEN: {
    abi: abi.v3Flex,
    address: "0x440E1B5A98332BcA7564DbffA4146f976CE75397",
    platform: "Noble Gallery",
  },
  MARILYN: {
    abi: abi.v2,
    address: "0xFF124D975c7792E706552b18ec9DA24781751CAb",
  },
  DOODLE: {
    abi: abi.v2,
    address: "0x28f2D3805652FB5d359486dFfb7D08320D403240",
    platform: "Doodle Labs",
  },
  GLITCH: {
    abi: abi.v3Flex,
    address: "0xE18F2247FE4A69c0E2210331B0604F6D10FecE9E",
    platform: "Glitch Gallery",
    startProjId: 1,
  },
  GLITCHII: {
    abi: abi.v3Flex,
    address: "0x0000000222D40f1aE80791fdC42fa6eb5dA6f80B",
    platform: "Glitch Gallery",
    startProjId: 2,
  },
  STITCH: {
    abi: abi.v3Flex,
    address: "0x00000000E75eadc620f4FCEfAb32F5173749C3a4",
    platform: "Stitchables",
  },
  SHIS: {
    abi: abi.v3Flex,
    address: "0xc74eC888104842277Fa1b74e1C3D415eb673009F",
    platform: "Shiseido",
    startProjId: 1,
  },
  RAVENABE: {
    abi: abi.v3Flex,
    address: "0xd9b7eC74C06c558A59AfdE6a16E614950730F44d",
  },
  ITERATION: {
    abi: abi.v2,
    address: "0x54a6356244059d5A50b97200a928f19a3682b669",
    platform: "9dcc",
  },
  NUMBER: {
    abi: abi.v3Flex,
    address: "0xB8E8Bec0891A7519091E18590e0b60221853dd2B",
  },
  MAYA: {
    abi: abi.v3,
    address: "0x00002491B000Aa008756652C87cc92D87e896f0f",
  },
};

export const is = {
  v3: [],
  flex: [],
  studio: [],
  engine: [],
};

// Populate 'is' categories based on registry and ABI naming.
(function updateIs() {
  Object.entries(contractRegistry).forEach(([key, { abi: contractAbi }]) => {
    const abiName = Object.keys(abi).find((name) => abi[name] === contractAbi);

    // Categorize by ABI name and contract key prefix
    if (abiName?.includes("3")) is.v3.push(key);
    if (abiName?.includes("Flex")) is.flex.push(key);
    if (key.startsWith("ABS")) is.studio.push(key);
    if (!key.startsWith("AB")) is.engine.push(key);
  });
})();
