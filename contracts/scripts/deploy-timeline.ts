import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TimelineEnforcer with account:", deployer.address);

  const TimelineEnforcer = await ethers.getContractFactory("TimelineEnforcer");
  const contract = await TimelineEnforcer.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("TimelineEnforcer deployed to:", address);
  console.log("\nAdd to .env.local:");
  console.log(`TIMELINE_ENFORCER_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
