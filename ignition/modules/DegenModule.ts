import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * Airdrop 1 Constants
 */
const AIRDROP1_CLAIM_DEADLINE = Math.round(
  new Date('2024-06-30').getTime() / 1000
);

const AIRDROP1_MERKLE_ROOT =
  '0x27fec61a3bdf078b258f697120a6c741295bfc5609cafbd5bd21596d6d46bb34';

const AIRDROP1_TRANSFER_AMOUNT = 100000000n * 10n ** 18n;

/**
 * GC Token Constants
 */
const TOKEN_NEXT_MINTING_DATE = Math.round(
  new Date('2026-01-01').getTime() / 1000
);

const TokenModule = buildModule('TokenModule', (m) => {
  /**
   * Parameters
   */
  const nextMintingDate = m.getParameter(
    'nextMintingDate',
    TOKEN_NEXT_MINTING_DATE
  );

  /**
   * Contracts
   */
  const greencandleToken = m.contract('GreenCandleToken', [nextMintingDate]);

  return { greencandleToken };
});

const DegenModule = buildModule('DegenModule', (m) => {
  const { greencandleToken } = m.useModule(TokenModule);

  /**
   * Parameters
   */
  const airdrop1MerkleRoot = m.getParameter(
    'airdrop1MerkleRoot',
    AIRDROP1_MERKLE_ROOT
  );
  const airdrop1ClaimDeadline = m.getParameter(
    'airdrop1ClaimDeadline',
    AIRDROP1_CLAIM_DEADLINE
  );

  /**
   * Contracts
   */
  const greencandleAirdrop = m.contract('GreenCandleAirdrop', [
    greencandleToken,
    airdrop1MerkleRoot,
    airdrop1ClaimDeadline,
  ]);

  /**
   * Transactions
   */
  m.call(greencandleToken, 'transfer', [greencandleAirdrop, AIRDROP1_TRANSFER_AMOUNT]);

  return { greencandleToken, greencandleAirdrop };
});

export default DegenModule;
