require("@nomiclabs/hardhat-waffle");
const fs = require('fs');
// const infuraId = fs.readFileSync(".infuraid").toString().trim() || "";
const infuraId = "bf21e32938944d1b8e9cd02d41e2b0bc";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
    /*
    mumbai: {
      // Infura
      url: `https://polygon-mumbai.infura.io/v3/${infuraId}`,
      accounts: [process.env.privateKey]
    },
    mainnet: {
      // Infura
      url: `https://polygon-mainnet.infura.io/v3/${infuraId}`,
      //url: "https://polygon-mainnet.infura.io/v3/bf21e32938944d1b8e9cd02d41e2b0bc",
      accounts: [process.env.privateKey]
    }
    */
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};

