import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const BUYER = '0xf1E7DBEDD9e06447e2F99B1310c09287b734addc';
const SELLER = '0xeE6fb338E75C43cc9153FF86600700459e9871Da';
const VESTING_START = Math.round(new Date('2024-02-06').getTime() / 1000);
const VESTING_CLIFF = Math.round(new Date('2024-03-06').getTime() / 1000);
const VESTING_END = Math.round(new Date('2025-02-06').getTime() / 1000);
const WETH_AMOUNT = 1n * 10n ** 18n;
const DEGEN_AMOUNT = 100n * 10n ** 18n;
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const DEGEN_ADDRESS = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed';

const OtcEscrowModule = buildModule('OtcEscrowModule', (m) => {
  /**
   * Parameters
   */
  const buyer = m.getParameter('buyer', BUYER);
  const seller = m.getParameter('seller', SELLER);
  const wethAddress = m.getParameter('wethAddress', WETH_ADDRESS);
  const degenAddress = m.getParameter('degenAddress', DEGEN_ADDRESS);

  const otcEscrow = m.contract('OtcEscrow', [
    buyer,
    seller,
    VESTING_START,
    VESTING_CLIFF,
    VESTING_END,
    WETH_AMOUNT,
    DEGEN_AMOUNT,
    wethAddress,
    degenAddress,
  ]);

  return { otcEscrow };
});

export default OtcEscrowModule;