const { ethers } = require('ethers');
const fs = require('fs');

async function generateAddresses() {
  const addressData = {};

  for (let i = 0; i < 50; i++) {
    const wallet = ethers.Wallet.createRandom();
    addressData[wallet.address] = 100;
  }

  fs.writeFileSync('addresses.json', JSON.stringify(addressData, null, 2));
  console.log('50 addresses have been generated and saved to addresses.json');
}

generateAddresses();
