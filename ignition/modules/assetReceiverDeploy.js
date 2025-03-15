// assetReceiverDeploy.js

async function main() {
    // Read environment variables for the amounts; default to "1.0" ETH and "100" tokens if not provided
    const etherAmountArg = process.env.ETH_AMOUNT || "1.0";
    const tokenAmountArg = process.env.TOKEN_AMOUNT || "100";
  
    // Parse the inputs into proper units:
    const etherAmount = ethers.parseEther(etherAmountArg);
    // Assuming the token has 18 decimals:
    const tokenAmount = ethers.parseUnits(tokenAmountArg, 18);
  
    // Retrieve the deployer's account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    // 1. Deploy the AssetReceiver contract
    const AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    const assetReceiver = await AssetReceiver.deploy();
    await assetReceiver.waitForDeployment();
    const assetReceiverAddress = await assetReceiver.getAddress();
    console.log("AssetReceiver deployed to:", assetReceiverAddress);
  
    // 2. Send user-specified ETH to the AssetReceiver contract
    const sendEthTx = await deployer.sendTransaction({
      to: assetReceiverAddress,
      value: etherAmount,
    });
    await sendEthTx.wait();
    console.log(`Sent ${etherAmountArg} ETH to AssetReceiver`);
  
    // 3. Deploy a MockERC20 token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    // Deploy with an initial supply (e.g., 1000 tokens, assuming 18 decimals)
    const token = await MockERC20.deploy("MockToken", "MTK", ethers.parseUnits("1000", 18));
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("MockERC20 deployed to:", tokenAddress);
  
    // 4. Approve and transfer tokens to AssetReceiver
    const approveTx = await token.approve(assetReceiverAddress, tokenAmount);
    await approveTx.wait();
    console.log(`Approved ${tokenAmountArg} MTK to AssetReceiver`);
  
    const receiveTokensTx = await assetReceiver.receiveTokens(tokenAddress, tokenAmount);
    await receiveTokensTx.wait();
    console.log(`Transferred ${tokenAmountArg} MTK tokens to AssetReceiver`);
  
    // 5. Retrieve and display the asset summary from the contract
    const [etherBalance, tokenBalance] = await assetReceiver.getAssetSummary(tokenAddress);
    console.log("AssetReceiver Ether balance:", ethers.formatEther(etherBalance), "ETH");
    console.log("AssetReceiver token balance:", ethers.formatUnits(tokenBalance, 18), "MTK");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error deploying contracts:", error);
      process.exit(1);
    });
  