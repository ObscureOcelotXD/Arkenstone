// assetReceiverDisplayStorage.js

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Retrieve AssetReceiver address from env var.
    if (!process.env.ASSET_RECEIVER_ADDRESS) {
      console.error("ASSET_RECEIVER_ADDRESS not set.");
      process.exit(1);
    }
    const assetReceiverAddress = ethers.getAddress(process.env.ASSET_RECEIVER_ADDRESS);
    const AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    const assetReceiver = AssetReceiver.attach(assetReceiverAddress);
    
    // Display ETH storage duration for deployer.
    try {
      const ethDuration = await assetReceiver.getEthStorageDuration(deployer.address);
      console.log("ETH stored for (seconds):", ethDuration.toString());
    } catch (err) {
      console.log("No ETH deposit found for", deployer.address);
    }
    
    // If a TOKEN_ADDRESS_MAP is provided, try to display the storage duration for MTK.
    if (process.env.TOKEN_ADDRESS_MAP) {
      let tokenAddressMap = {};
      try {
        tokenAddressMap = JSON.parse(process.env.TOKEN_ADDRESS_MAP);
      } catch (err) {
        console.error("Invalid TOKEN_ADDRESS_MAP JSON:", err);
        process.exit(1);
      }
      if (tokenAddressMap.MTK) {
        try {
          const mtkAddress = ethers.getAddress(tokenAddressMap.MTK);
          const tokenDuration = await assetReceiver.getTokenStorageDuration(deployer.address, mtkAddress);
          console.log("MTK stored for (seconds):", tokenDuration.toString());
        } catch (err) {
          console.log("No MTK deposit found for", deployer.address);
        }
      } else {
        console.log("No MTK token address found in TOKEN_ADDRESS_MAP.");
      }
    } else {
      console.log("TOKEN_ADDRESS_MAP not set; skipping token storage duration display.");
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error in storage display script:", error);
      process.exit(1);
    });
  