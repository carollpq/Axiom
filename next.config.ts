import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@hashgraph/sdk",
    "@lit-protocol/lit-node-client",
    "@lit-protocol/auth-helpers",
    "@lit-protocol/constants",
    "ethers",
  ],
  experimental: {
    optimizePackageImports: ["thirdweb", "lucide-react", "react-pdf"],
  },
};

const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default analyzeBundles(nextConfig);
