import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const OtcTestToken1Module = buildModule('OtcTestToken1Module', (m) => {
  const greenOTC1 = m.contract('GreenOTC1');

  return { greenOTC1 };
});

export default OtcTestToken1Module;
