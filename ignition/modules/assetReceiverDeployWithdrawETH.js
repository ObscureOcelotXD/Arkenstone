// assetReceiverDeployWithdrawETH.js

async function main() {
    // 1. Retrieve the deployer's account.
    const [deployer] = await ethers.getSigners();
    console.log("Using account for withdrawal operations:", deployer.address);
  
    // 2. Get the AssetReceiver address from the environment variable.
    if (!process.env.ASSET_RECEIVER_ADDRESS) {
      console.error("ASSET_RECEIVER_ADDRESS not set. Exiting.");
      process.exit(1);
    }
    let assetReceiverAddress;
    try {
      assetReceiverAddress = ethers.getAddress(process.env.ASSET_RECEIVER_ADDRESS);
    } catch (error) {
      console.error("Invalid ASSET_RECEIVER_ADDRESS:", error);
      process.exit(1);
    }
    const AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    const assetReceiver = AssetReceiver.attach(assetReceiverAddress);
    console.log("Using AssetReceiver at:", assetReceiverAddress);
  
    // 3. Set the recipient address for the withdrawal.
    let recipient;
    if (process.env.WITHDRAW_RECIPIENT) {
      try {
        recipient = ethers.getAddress(process.env.WITHDRAW_RECIPIENT);
      } catch (error) {
        console.error("Invalid WITHDRAW_RECIPIENT:", error);
        process.exit(1);
      }
    } else {
      recipient = deployer.address;
    }
    console.log("Withdraw recipient:", recipient);
  
    // 4. Deploy AssetWithdrawler with the AssetReceiver address and the recipient.
    const AssetWithdrawler = await ethers.getContractFactory("AssetWithdrawler");
    const assetWithdrawler = await AssetWithdrawler.deploy(assetReceiverAddress, recipient);
    await assetWithdrawler.waitForDeployment();
    const assetWithdrawlerAddress = await assetWithdrawler.getAddress();
    console.log("AssetWithdrawler deployed to:", assetWithdrawlerAddress);
  
    // 5. Update AssetReceiver's withdrawler to be the deployed AssetWithdrawler.
    const setWithdrawTx = await assetReceiver.setWithdrawler(assetWithdrawlerAddress);
    await setWithdrawTx.wait();
    console.log("AssetReceiver withdrawler set to:", assetWithdrawlerAddress);
  
    // 6. Read and parse the ETH withdrawal amount from environment variable; default to "0".
    const withdrawEthAmountArg = process.env.WITHDRAW_AMOUNT || "0";
    const withdrawEthAmount = ethers.parseEther(withdrawEthAmountArg);
    if (withdrawEthAmount > 0n) {  // using bigint comparison
      console.log(`Attempting to withdraw ${withdrawEthAmountArg} ETH...`);
      const withdrawTx = await assetWithdrawler.withdrawEther(withdrawEthAmount);
      await withdrawTx.wait();
      console.log(`Withdrew ${withdrawEthAmountArg} ETH via AssetWithdrawler`);
    } else {
      console.log("No ETH withdrawal amount specified; skipping ETH withdrawal.");
    }
  
    // 7. Log the final Ether balance in AssetReceiver.
    const finalEthBalance = await assetReceiver.getEtherBalance();
    console.log("Final Ether balance in AssetReceiver:", ethers.formatEther(finalEthBalance), "ETH");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error in ETH withdrawal script:", error);
      process.exit(1);
    });
  