import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * Airdrop 1 Constants
 */
const AIRDROP1_CLAIM_DEADLINE = Math.round(
  new Date('2024-05-01').getTime() / 1000
);

const AIRDROP1_MERKLE_ROOT =
  '0x8acba91a17780db1efcdc7e53ea7da2cae1fa3182694ef17e761b794aa02ba3e';

const AIRDROP1_TRANSFER_AMOUNT = 1000000000n * 10n ** 18n;

/**
 * Degen Token Constants
 */
const TOKEN_NEXT_MINTING_DATE = Math.round(
  new Date('2028-01-01').getTime() / 1000
);

export default buildModule('DegenModule', (m) => {
  /**
   * Parameters
   */
  const airdrop1MerkleRoot = m.getParameter(
    'airdrop1MerkleRoot',
    AIRDROP1_MERKLE_ROOT
  );
  const nextMintingDate = m.getParameter(
    'nextMintingDate',
    TOKEN_NEXT_MINTING_DATE
  );
  const airdrop1ClaimDeadline = m.getParameter(
    'airdrop1ClaimDeadline',
    AIRDROP1_CLAIM_DEADLINE
  );

  /**
   * Contracts
   */
  const degenToken = m.contract('DegenToken', [nextMintingDate]);
  const degenAirdrop1 = m.contract('DegenAirdrop1', [
    degenToken,
    airdrop1MerkleRoot,
    airdrop1ClaimDeadline,
  ]);

  /**
   * Transactions
   */
  m.call(degenToken, 'transfer', [degenAirdrop1, AIRDROP1_TRANSFER_AMOUNT]);

  return { degenToken, degenAirdrop1 };
});
