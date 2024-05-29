import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers, ignition } from 'hardhat';
import DegenModule from '../ignition/modules/DegenModule';
import BalanceTree from '../scripts/balance-tree';

const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

describe('GreenCandleAirdrop', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployDegenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2] = await ethers.getSigners();

    const airdrop1MerkleRoot = ZERO_BYTES32;

    const { greencandleAirdrop, greencandleToken } = await ignition.deploy(DegenModule, {
      parameters: {
        DegenModule: {
          airdrop1MerkleRoot,
        },
      },
    });

    return {
      owner,
      addr1,
      addr2,
      greencandleAirdrop,
      greencandleToken,
    };
  }

  async function deployDegenSmallTreeFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2] = await ethers.getSigners();

    const merkleTree = new BalanceTree([
      { account: addr1.address, amount: 100n },
      { account: addr2.address, amount: 101n },
    ]);
    const airdrop1MerkleRoot = merkleTree.getHexRoot();

    const { greencandleAirdrop, greencandleToken } = await ignition.deploy(DegenModule, {
      parameters: {
        DegenModule: {
          airdrop1MerkleRoot,
        },
      },
    });

    const proof0 = merkleTree.getProof(0, addr1.address, 100n);
    const proof1 = merkleTree.getProof(1, addr2.address, 101n);

    return {
      owner,
      addr1,
      addr2,
      merkleTree,
      greencandleAirdrop,
      proof0,
      proof1,
      greencandleToken,
    };
  }

  describe('Airdrop', function () {
    describe('Claim', function () {
      it('Should return the zero merkle root', async function () {
        const { greencandleAirdrop } = await loadFixture(deployDegenFixture);

        expect(await greencandleAirdrop.MERKLE_ROOT()).to.eq(ZERO_BYTES32);
      });

      it('Should fail for empty proof', async function () {
        const { greencandleAirdrop, owner } = await loadFixture(deployDegenFixture);

        await expect(
          greencandleAirdrop.claim(0, owner.address, 10, [])
        ).to.be.revertedWithCustomError(greencandleAirdrop, 'InvalidProof');
      });

      describe('Two account Merkle tree', async function () {
        it('Should be successful claim', async () => {
          const { addr1, addr2, greencandleAirdrop, proof0, proof1 } =
            await loadFixture(deployDegenSmallTreeFixture);

          await expect(
            greencandleAirdrop.connect(addr1).claim(0, addr1.address, 100n, proof0)
          )
            .to.emit(greencandleAirdrop, 'Claimed')
            .withArgs(0, addr1.address, 100n);

          await expect(
            greencandleAirdrop.connect(addr2).claim(1, addr2.address, 101n, proof1)
          )
            .to.emit(greencandleAirdrop, 'Claimed')
            .withArgs(1, addr2.address, 101n);
        });

        it('Should change balance on token claim', async () => {
          const { addr1, greencandleAirdrop, proof0, greencandleToken } =
            await loadFixture(deployDegenSmallTreeFixture);

          expect(await greencandleToken.balanceOf(addr1.address)).to.eq(0);

          await greencandleAirdrop
            .connect(addr1)
            .claim(0, addr1.address, 100n, proof0);

          expect(await greencandleToken.balanceOf(addr1.address)).to.eq(100n);
        });

        it('Should set #isClaimed', async () => {
          const { addr1, greencandleAirdrop, proof0 } = await loadFixture(
            deployDegenSmallTreeFixture
          );

          expect(await greencandleAirdrop.isClaimed(0)).to.eq(false);
          expect(await greencandleAirdrop.isClaimed(1)).to.eq(false);
          await greencandleAirdrop
            .connect(addr1)
            .claim(0, addr1.address, 100n, proof0);
          expect(await greencandleAirdrop.isClaimed(0)).to.eq(true);
          expect(await greencandleAirdrop.isClaimed(1)).to.eq(false);
        });

        it('Should not allow two claims', async () => {
          const { addr1, greencandleAirdrop, proof0 } = await loadFixture(
            deployDegenSmallTreeFixture
          );

          await greencandleAirdrop
            .connect(addr1)
            .claim(0, addr1.address, 100n, proof0);

          await expect(
            greencandleAirdrop.connect(addr1).claim(0, addr1.address, 100, proof0)
          ).to.be.revertedWithCustomError(greencandleAirdrop, 'AlreadyClaimed');
        });

        it('Should not be able claim for address other than proof', async () => {
          const { addr1, greencandleAirdrop, proof0 } = await loadFixture(
            deployDegenSmallTreeFixture
          );

          await expect(
            greencandleAirdrop.connect(addr1).claim(1, addr1.address, 101n, proof0)
          ).to.be.revertedWithCustomError(greencandleAirdrop, 'InvalidProof');
        });

        it('Should not be able to claim more than proof', async () => {
          const { addr1, greencandleAirdrop, proof0 } = await loadFixture(
            deployDegenSmallTreeFixture
          );

          await expect(
            greencandleAirdrop.connect(addr1).claim(0, addr1.address, 101n, proof0)
          ).to.be.revertedWithCustomError(greencandleAirdrop, 'InvalidProof');
        });

        it('Should not be able to claim after airdrop deadline', async () => {
          const { addr1, greencandleAirdrop, proof0 } = await loadFixture(
            deployDegenSmallTreeFixture
          );

          const endTimeTimestamp = await greencandleAirdrop.END_TIME();
          await time.increaseTo(endTimeTimestamp);

          await expect(
            greencandleAirdrop.connect(addr1).claim(0, addr1.address, 100n, proof0)
          ).to.be.revertedWithCustomError(greencandleAirdrop, 'ClaimWindowFinished');
        });

        it('Should be able to withdraw after airdrop deadline', async () => {
          const { owner, greencandleAirdrop, greencandleToken } = await loadFixture(
            deployDegenSmallTreeFixture
          );

          const endTimeTimestamp = await greencandleAirdrop.END_TIME();
          await time.increaseTo(endTimeTimestamp);

          const initialOwnerBalance = await greencandleToken.balanceOf(owner.address);
          const initialAirdrop1Balance = await greencandleToken.balanceOf(
            greencandleAirdrop
          );

          await greencandleAirdrop.connect(owner).withdraw();

          expect(await greencandleToken.balanceOf(owner.address)).to.eq(
            initialOwnerBalance + initialAirdrop1Balance
          );
        });
      });
    });
  });
});
