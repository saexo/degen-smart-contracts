import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers, ignition } from 'hardhat';
import DegenModule from '../ignition/modules/DegenModule';

describe('GreenCandleToken', function () {
  async function deployDegenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2] = await ethers.getSigners();

    const { greencandleToken, greencandleAirdrop } = await ignition.deploy(DegenModule);

    return {
      owner,
      addr1,
      addr2,
      greencandleToken,
      greencandleAirdrop,
    };
  }

  describe('Deployment', function () {
    it('Should allocate the total supply of tokens to the owner and airdrop1 contract', async function () {
      const { owner, greencandleToken, greencandleAirdrop } = await loadFixture(
        deployDegenFixture
      );

      const ownerBalance = await greencandleToken.balanceOf(owner.address);
      const airdrop1Balance = await greencandleToken.balanceOf(greencandleAirdrop);

      expect(await greencandleToken.totalSupply()).to.equal(
        ownerBalance + airdrop1Balance
      );
    });
  });

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      const { greencandleToken, owner, addr1, addr2 } = await loadFixture(
        deployDegenFixture
      );

      // Transfer 50 tokens from owner to addr1
      await expect(
        greencandleToken.transfer(addr1.address, 50)
      ).to.changeTokenBalances(greencandleToken, [owner, addr1], [-50, 50]);

      // Transfer 50 tokens from addr1 to addr2
      await expect(
        greencandleToken.connect(addr1).transfer(addr2.address, 50)
      ).to.changeTokenBalances(greencandleToken, [addr1, addr2], [-50, 50]);
    });

    it('Should emit Transfer events', async function () {
      const { greencandleToken, owner, addr1, addr2 } = await loadFixture(
        deployDegenFixture
      );

      // Transfer 50 tokens from owner to addr1
      await expect(greencandleToken.transfer(addr1.address, 50))
        .to.emit(greencandleToken, 'Transfer')
        .withArgs(owner.address, addr1.address, 50);

      // Transfer 50 tokens from addr1 to addr2
      await expect(greencandleToken.connect(addr1).transfer(addr2.address, 50))
        .to.emit(greencandleToken, 'Transfer')
        .withArgs(addr1.address, addr2.address, 50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { greencandleToken, owner, addr1 } = await loadFixture(
        deployDegenFixture
      );
      const initialOwnerBalance = await greencandleToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner.
      // `require` will evaluate false and revert the transaction.
      await expect(
        greencandleToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(greencandleToken, 'ERC20InsufficientBalance');

      // Owner balance shouldn't have changed.
      expect(await greencandleToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe('Burn', function () {
    it('Should burn tokens', async function () {
      const { greencandleToken, owner, addr1 } = await loadFixture(
        deployDegenFixture
      );
      const initialTotalSupply = await greencandleToken.totalSupply();

      // Transfer 50 tokens from owner to addr1
      greencandleToken.transfer(addr1.address, 50);

      // Burn 25 tokens from addr1
      await expect(greencandleToken.connect(addr1).burn(25)).to.changeTokenBalances(
        greencandleToken,
        [addr1],
        [-25]
      );

      // Total supply should be reduced by 25
      expect(await greencandleToken.totalSupply()).to.equal(
        initialTotalSupply - BigInt(25)
      );
    });
  });

  describe('Mint', function () {
    it('Should fail if the set date and time are not met', async function () {
      const { greencandleToken, owner } = await loadFixture(deployDegenFixture);

      // Attempt to mint 25 tokens to the owner's account
      await expect(
        greencandleToken.connect(owner).mint(owner.address, 25)
      ).to.be.revertedWithCustomError(greencandleToken, 'MintingDateNotReached');
    });

    it('Should reject minting attempts by non-owner accounts', async function () {
      const { greencandleToken, owner, addr1 } = await loadFixture(
        deployDegenFixture
      );

      const mintingTimestamp = await greencandleToken.mintingAllowedAfter();
      await time.increaseTo(mintingTimestamp);

      // # Attempt to mint 2500 tokens to addr1's account
      await expect(
        greencandleToken.connect(addr1).mint(addr1.address, 2500)
      ).to.be.revertedWithCustomError(greencandleToken, 'OwnableUnauthorizedAccount');
    });

    it('Should fail when attempting to mint more than 1% of the tokens', async function () {
      const { greencandleToken, owner, addr1 } = await loadFixture(
        deployDegenFixture
      );
      const initialTotalSupply = await greencandleToken.totalSupply();
      const mintAmount = initialTotalSupply / 50n;

      const mintingTimestamp = await greencandleToken.mintingAllowedAfter();
      await time.increaseTo(mintingTimestamp);

      // Attemp to mint tokens to addr1's account
      await expect(
        greencandleToken.connect(owner).mint(addr1.address, mintAmount)
      ).to.be.revertedWithCustomError(greencandleToken, 'GreenMintCapExceeded');
    });

    it('Should mint 1% to the addr1 address', async function () {
      const { greencandleToken, owner, addr1 } = await loadFixture(
        deployDegenFixture
      );
      const addr1Balance = await greencandleToken.balanceOf(addr1.address);
      const initialTotalSupply = await greencandleToken.totalSupply();
      const mintAmount = initialTotalSupply / 100n;

      const mintingTimestamp = await greencandleToken.mintingAllowedAfter();
      await time.increaseTo(mintingTimestamp);

      await greencandleToken.connect(owner).mint(addr1.address, mintAmount);

      // Mint tokens to addr1's account
      expect(await greencandleToken.balanceOf(addr1.address)).to.equal(
        addr1Balance + mintAmount
      );
    });
  });
});
