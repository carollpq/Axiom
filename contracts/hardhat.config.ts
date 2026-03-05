import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env from project root (shared with Next.js)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const HEDERA_EVM_PRIVATE_KEY =
  process.env.HEDERA_EVM_PRIVATE_KEY || process.env.HEDERA_OPERATOR_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      chainId: 296,
      accounts: HEDERA_EVM_PRIVATE_KEY ? [HEDERA_EVM_PRIVATE_KEY] : [],
    },
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api",
      chainId: 295,
      accounts: HEDERA_EVM_PRIVATE_KEY ? [HEDERA_EVM_PRIVATE_KEY] : [],
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
