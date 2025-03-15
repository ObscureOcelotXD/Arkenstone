// assetReceiverDeploy.js

async function main() {
    // Read Ether amount from environment variable; default to "1.0" if not provided.
    const etherAmountArg = process.env.ETH_AMOUNT || "1.0";
    const etherAmount = ethers.parseEther(etherAmountArg);
  
    // Read tokens input from environment variable as JSON.
    // Expected format: 
    //   [{"name": "MockToken", "symbol": "MTK", "amount": "152.20"}, {"name": "QTUM Token", "symbol": "QTUM", "amount": "75"}]
    let tokensData = [];
    if (process.env.TOKENS) {
      try {
        tokensData = JSON.parse(process.env.TOKENS);
      } catch (err) {
        console.error("Invalid TOKENS JSON:", err);
        process.exit(1);
      }
    }
  
    // Retrieve the deployer's account.
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    // 1. Deploy the AssetReceiver contract.
    const AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    const assetReceiver = await AssetReceiver.deploy();
    await assetReceiver.waitForDeployment();
    const assetReceiverAddress = await assetReceiver.getAddress();
    console.log("AssetReceiver deployed to:", assetReceiverAddress);
  
    // Prepare arrays to hold token addresses and amounts.
    let tokenAddresses = [];
    let tokenAmounts = [];
  
    // 2. If token data is provided, deploy tokens dynamically.
    if (tokensData.length > 0) {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      for (const tokenInfo of tokensData) {
        // Deploy each token with a default initial supply of 1000 tokens.
        const initialSupply = ethers.parseUnits("1000", 18);
        const token = await MockERC20.deploy(tokenInfo.name, tokenInfo.symbol, initialSupply);
        await token.waitForDeployment();
        const tokenAddress = await token.getAddress();
        console.log(`${tokenInfo.symbol} token deployed to:`, tokenAddress);
  
        // Parse the token amount (assumes 18 decimals).
        const amountBN = ethers.parseUnits(tokenInfo.amount, 18);
  
        // Approve the AssetReceiver contract to spend this token amount.
        const approveTx = await token.approve(assetReceiverAddress, amountBN);
        await approveTx.wait();
        console.log(`Approved ${tokenInfo.amount} ${tokenInfo.symbol} to AssetReceiver`);
  
        // Add token details to the arrays.
        tokenAddresses.push(tokenAddress);
        tokenAmounts.push(amountBN);
      }
    }
  
    // 3. Call depositAssets on AssetReceiver to send Ether and tokens.
    const depositTx = await assetReceiver.depositAssets(
      tokenAddresses,   // Can be an empty array if no tokens are provided.
      tokenAmounts,
      { value: etherAmount }
    );
    await depositTx.wait();
    console.log(`Deposited ${etherAmountArg} ETH and tokens as specified into AssetReceiver`);
  
    // 4. Retrieve and log the asset summary.
    console.log("Final asset summary:");
    const finalEthBalance = await assetReceiver.getEtherBalance();
    console.log("Ether:", ethers.formatEther(finalEthBalance), "ETH");
  
    if (tokenAddresses.length > 0) {
      for (let i = 0; i < tokenAddresses.length; i++) {
        const balance = await assetReceiver.tokenBalance(tokenAddresses[i]);
        console.log(`Token at ${tokenAddresses[i]} balance:`, ethers.formatUnits(balance, 18));
      }
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error deploying contracts:", error);
      process.exit(1);
    });
  