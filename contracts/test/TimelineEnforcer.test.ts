import { expect } from "chai";
import { ethers } from "hardhat";
import { TimelineEnforcer } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const ONE_DAY = 86400;
const TWO_DAYS = 172800;

async function deployFixture() {
  const [platform, reviewer, other] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("TimelineEnforcer");
  const contract = await Factory.deploy(platform.address);
  await contract.waitForDeployment();
  return { contract, platform, reviewer, other };
}

const submissionHash = ethers.keccak256(ethers.toUtf8Bytes("submission-1"));

describe("TimelineEnforcer", function () {
  describe("Deployment", function () {
    it("should set the platform address", async function () {
      const { contract, platform } = await loadFixture(deployFixture);
      expect(await contract.platform()).to.equal(platform.address);
    });

    it("should revert if platform is zero address", async function () {
      const { contract } = await loadFixture(deployFixture);
      const Factory = await ethers.getContractFactory("TimelineEnforcer");
      await expect(Factory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        contract,
        "ZeroAddress"
      );
    });
  });

  describe("registerDeadline", function () {
    it("should register a deadline", async function () {
      const { contract, reviewer } = await loadFixture(deployFixture);
      const now = await time.latest();
      const deadline = now + ONE_DAY;

      await expect(contract.registerDeadline(submissionHash, deadline, reviewer.address))
        .to.emit(contract, "DeadlineRegistered")
        .withArgs(submissionHash, 0, deadline, reviewer.address);

      expect(await contract.getDeadlineCount(submissionHash)).to.equal(1);

      const [dueTimestamp, responsible, completed] = await contract.getDeadline(
        submissionHash,
        0
      );
      expect(dueTimestamp).to.equal(deadline);
      expect(responsible).to.equal(reviewer.address);
      expect(completed).to.equal(false);
    });

    it("should register multiple deadlines for same submission", async function () {
      const { contract, reviewer, other } = await loadFixture(deployFixture);
      const now = await time.latest();

      await contract.registerDeadline(submissionHash, now + ONE_DAY, reviewer.address);
      await contract.registerDeadline(submissionHash, now + TWO_DAYS, other.address);

      expect(await contract.getDeadlineCount(submissionHash)).to.equal(2);
    });

    it("should revert if deadline is in the past", async function () {
      const { contract, reviewer } = await loadFixture(deployFixture);
      const now = await time.latest();
      await expect(
        contract.registerDeadline(submissionHash, now - 1, reviewer.address)
      ).to.be.revertedWithCustomError(contract, "DeadlineMustBeFuture");
    });

    it("should revert if responsible is zero address", async function () {
      const { contract } = await loadFixture(deployFixture);
      const now = await time.latest();
      await expect(
        contract.registerDeadline(submissionHash, now + ONE_DAY, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("should revert if caller is not platform", async function () {
      const { contract, reviewer, other } = await loadFixture(deployFixture);
      const now = await time.latest();
      await expect(
        contract.connect(other).registerDeadline(submissionHash, now + ONE_DAY, reviewer.address)
      ).to.be.revertedWithCustomError(contract, "OnlyPlatform");
    });
  });

  describe("markCompleted", function () {
    async function deployWithDeadlineFixture() {
      const fixture = await deployFixture();
      const now = await time.latest();
      await fixture.contract.registerDeadline(submissionHash, now + ONE_DAY, fixture.reviewer.address);
      return fixture;
    }

    it("should mark a deadline as completed", async function () {
      const { contract, reviewer } = await loadFixture(deployWithDeadlineFixture);

      await expect(contract.markCompleted(submissionHash, 0))
        .to.emit(contract, "DeadlineCompleted")
        .withArgs(submissionHash, 0, reviewer.address);

      const [, , completed] = await contract.getDeadline(submissionHash, 0);
      expect(completed).to.equal(true);
    });

    it("should revert if already completed", async function () {
      const { contract } = await loadFixture(deployWithDeadlineFixture);
      await contract.markCompleted(submissionHash, 0);
      await expect(
        contract.markCompleted(submissionHash, 0)
      ).to.be.revertedWithCustomError(contract, "AlreadyCompleted");
    });

    it("should revert if index out of bounds", async function () {
      const { contract } = await loadFixture(deployWithDeadlineFixture);
      await expect(
        contract.markCompleted(submissionHash, 99)
      ).to.be.revertedWithCustomError(contract, "IndexOutOfBounds");
    });

    it("should revert if caller is not platform", async function () {
      const { contract, other } = await loadFixture(deployWithDeadlineFixture);
      await expect(
        contract.connect(other).markCompleted(submissionHash, 0)
      ).to.be.revertedWithCustomError(contract, "OnlyPlatform");
    });
  });

  describe("checkDeadline", function () {
    async function deployWithDeadlineFixture() {
      const fixture = await deployFixture();
      const now = await time.latest();
      await fixture.contract.registerDeadline(submissionHash, now + ONE_DAY, fixture.reviewer.address);
      return fixture;
    }

    it("should return not overdue before deadline", async function () {
      const { contract } = await loadFixture(deployWithDeadlineFixture);
      const [isOverdue] = await contract.checkDeadline(submissionHash, 0);
      expect(isOverdue).to.equal(false);
    });

    it("should return overdue after deadline passes", async function () {
      const { contract } = await loadFixture(deployWithDeadlineFixture);
      await time.increase(ONE_DAY + 1);

      const [isOverdue] = await contract.checkDeadline(submissionHash, 0);
      expect(isOverdue).to.equal(true);
    });

    it("should return not overdue if completed even after deadline", async function () {
      const { contract } = await loadFixture(deployWithDeadlineFixture);
      await contract.markCompleted(submissionHash, 0);
      await time.increase(ONE_DAY + 1);

      const [isOverdue] = await contract.checkDeadline(submissionHash, 0);
      expect(isOverdue).to.equal(false);
    });
  });

  describe("setPlatform", function () {
    it("should update the platform address", async function () {
      const { contract, platform, other } = await loadFixture(deployFixture);
      await expect(contract.setPlatform(other.address))
        .to.emit(contract, "PlatformUpdated")
        .withArgs(platform.address, other.address);

      expect(await contract.platform()).to.equal(other.address);
    });

    it("should revert if zero address", async function () {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.setPlatform(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("should revert if caller is not platform", async function () {
      const { contract, other } = await loadFixture(deployFixture);
      await expect(
        contract.connect(other).setPlatform(other.address)
      ).to.be.revertedWithCustomError(contract, "OnlyPlatform");
    });
  });
});
