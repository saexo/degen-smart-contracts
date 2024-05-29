import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const OtcTestToken2Module = buildModule('OtcTestToken2Module', (m) => {
  const greenOTC2 = m.contract('GreenOTC2');

  return { greenOTC2 };
});

export default OtcTestToken2Module;
