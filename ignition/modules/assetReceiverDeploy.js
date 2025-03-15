// assetReceiverDeploy.js

async function main() {
    // 1. Read Ether deposit amount from environment variable; default to "1.0".
    const etherAmountArg = process.env.ETH_AMOUNT || "1.0";
    const etherAmount = ethers.parseEther(etherAmountArg);
  
    // 2. Read tokens input from environment variable as JSON.
    let tokensData = [];
    if (process.env.TOKENS) {
      try {
        tokensData = JSON.parse(process.env.TOKENS);
      } catch (err) {
        console.error("Invalid TOKENS JSON:", err);
        process.exit(1);
      }
    }
  
    // 3. Retrieve the deployer's account.
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    // 4. Deploy the AssetReceiver contract.
    const AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    const assetReceiver = await AssetReceiver.deploy();
    await assetReceiver.waitForDeployment();
    const assetReceiverAddress = await assetReceiver.getAddress();
    console.log("AssetReceiver deployed to:", assetReceiverAddress);
  
    // 5. Prepare arrays for token addresses and amounts.
    let tokenAddresses = [];
    let tokenAmounts = [];
    if (tokensData.length > 0) {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      for (const tokenInfo of tokensData) {
        const initialSupply = ethers.parseUnits("1000", 18);
        const token = await MockERC20.deploy(tokenInfo.name, tokenInfo.symbol, initialSupply);
        await token.waitForDeployment();
        const tokenAddress = await token.getAddress();
        console.log(`${tokenInfo.symbol} token deployed to:`, tokenAddress);
  
        const amountBN = ethers.parseUnits(tokenInfo.amount, 18);
        const approveTx = await token.approve(assetReceiverAddress, amountBN);
        await approveTx.wait();
        console.log(`Approved ${tokenInfo.amount} ${tokenInfo.symbol} to AssetReceiver`);
  
        tokenAddresses.push(tokenAddress);
        tokenAmounts.push(amountBN);
      }
    }
  
    // 6. Call depositAssets to send Ether and tokens.
    const depositTx = await assetReceiver.depositAssets(
      tokenAddresses,
      tokenAmounts,
      { value: etherAmount }
    );
    await depositTx.wait();
    console.log(`Deposited ${etherAmountArg} ETH and tokens as specified into AssetReceiver`);
  
    // 7. Log final asset summary after deposit.
    console.log("Asset summary after deposit:");
    const finalEthBalance = await assetReceiver.getEtherBalance();
    console.log("Ether:", ethers.formatEther(finalEthBalance), "ETH");
    if (tokenAddresses.length > 0) {
      for (let i = 0; i < tokenAddresses.length; i++) {
        const balance = await assetReceiver.tokenBalance(tokenAddresses[i]);
        console.log(`Token at ${tokenAddresses[i]} balance:`, ethers.formatUnits(balance, 18));
      }
    }
  
    // 8. Deploy AssetWithdrawler (using deployer as recipient).
    const AssetWithdrawler = await ethers.getContractFactory("AssetWithdrawler");
    const assetWithdrawler = await AssetWithdrawler.deploy(assetReceiverAddress, deployer.address);
    await assetWithdrawler.waitForDeployment();
    const assetWithdrawlerAddress = await assetWithdrawler.getAddress();
    console.log("AssetWithdrawler deployed to:", assetWithdrawlerAddress);
  
    // 9. Update AssetReceiver's withdrawler to be the deployed AssetWithdrawler.
    const setWithdrawTx = await assetReceiver.setWithdrawler(assetWithdrawlerAddress);
    await setWithdrawTx.wait();
    console.log("AssetReceiver withdrawler set to:", assetWithdrawlerAddress);
  
    // 10. Optionally, withdraw a specified amount of Ether.
    // Read withdrawal amount from environment variable; default to "0" if not provided.
    const withdrawAmountArg = process.env.WITHDRAW_AMOUNT || "0";
    const withdrawAmount = ethers.parseEther(withdrawAmountArg);
    if (withdrawAmount > 0n) { // using bigint comparison
      const withdrawTx = await assetWithdrawler.withdrawEther(withdrawAmount);
      await withdrawTx.wait();
      console.log(`Withdrew ${withdrawAmountArg} ETH via AssetWithdrawler`);
    } else {
      console.log("No withdrawal amount specified; skipping withdrawal.");
    }
  
    // 11. Log final Ether balance after withdrawal.
    const postWithdrawEthBalance = await assetReceiver.getEtherBalance();
    console.log("Final Ether balance in AssetReceiver after withdrawal:", ethers.formatEther(postWithdrawEthBalance), "ETH");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error deploying contracts:", error);
      process.exit(1);
    });
  