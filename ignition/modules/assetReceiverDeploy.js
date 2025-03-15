// assetReceiverDeploy.js

async function main() {
    // Retrieve the deployer's account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    // 1. Deploy the AssetReceiver contract
    const AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    const assetReceiver = await AssetReceiver.deploy();
    await assetReceiver.waitForDeployment();
    const assetReceiverAddress = await assetReceiver.getAddress();
    console.log("AssetReceiver deployed to:", assetReceiverAddress);
  
    // 2. Send 1 ETH to the AssetReceiver contract
    const sendEthTx = await deployer.sendTransaction({
      to: assetReceiverAddress,
      value: ethers.parseEther("1.0"),
    });
    await sendEthTx.wait();
    console.log("Sent 1 ETH to AssetReceiver");
  
    // 3. Deploy a MockERC20 token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("MockToken", "MTK", 1000);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("MockERC20 deployed to:", tokenAddress);
  
    // 4. Approve and transfer 100 tokens from deployer to AssetReceiver
    // The deployer must approve the AssetReceiver contract to spend tokens on their behalf
    const approveTx = await token.approve(assetReceiverAddress, 100);
    await approveTx.wait();
    console.log("Approved 100 MTK to AssetReceiver");
  
    // Now, call the receiveTokens function on AssetReceiver to transfer tokens
    const receiveTokensTx = await assetReceiver.receiveTokens(tokenAddress, 100);
    await receiveTokensTx.wait();
    console.log("Transferred 100 MTK tokens to AssetReceiver");
  
    // 5. Retrieve the asset summary from the contract
    const [etherBalance, tokenBalance] = await assetReceiver.getAssetSummary(tokenAddress);
    console.log("AssetReceiver Ether balance:", ethers.formatEther(etherBalance), "ETH");
    console.log("AssetReceiver token balance:", tokenBalance.toString(), "MTK");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error deploying contracts:", error);
      process.exit(1);
    });
  