// assetReceiverFullTest.js

async function main() {
    // 1. Read environment variables:
    // ETH_AMOUNT: the amount of Ether to send (as a string, e.g. "30")
    // TOKENS: JSON array string with objects { name, symbol, amount }
    // Example: '[{"name": "MockToken", "symbol": "MTK", "amount": "152.20"}, {"name": "QTUM Token", "symbol": "QTUM", "amount": "75"}, {"name": "DoggyEth", "symbol": "DGE", "amount": "420"}]'
    const etherAmountArg = process.env.ETH_AMOUNT || "1.0";
    const etherAmount = ethers.parseEther(etherAmountArg);
  
    let tokensData = [];
    if (process.env.TOKENS) {
      try {
        tokensData = JSON.parse(process.env.TOKENS);
      } catch (err) {
        console.error("Invalid TOKENS JSON:", err);
        process.exit(1);
      }
    }
  
    // 2. Deploy the AssetReceiver contract.
    const AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    const assetReceiver = await AssetReceiver.deploy();
    await assetReceiver.waitForDeployment();
    const assetReceiverAddress = await assetReceiver.getAddress();
    console.log("AssetReceiver deployed to:", assetReceiverAddress);
  
    // 3. Prepare arrays for token addresses and amounts.
    let tokenAddresses = [];
    let tokenAmounts = [];
    if (tokensData.length > 0) {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      for (const tokenInfo of tokensData) {
        // Deploy each token with an initial supply of 1000 (18 decimals)
        const initialSupply = ethers.parseUnits("1000", 18);
        const token = await MockERC20.deploy(tokenInfo.name, tokenInfo.symbol, initialSupply);
        await token.waitForDeployment();
        const tokenAddress = await token.getAddress();
        console.log(`${tokenInfo.symbol} deployed to: ${tokenAddress}`);
        // Parse the token amount (assumes 18 decimals)
        const amountBN = ethers.parseUnits(tokenInfo.amount, 18);
        // Approve the AssetReceiver to spend the tokens
        await token.approve(assetReceiverAddress, amountBN);
        console.log(`Approved ${tokenInfo.amount} ${tokenInfo.symbol} to AssetReceiver`);
        // Add the token details to our arrays.
        tokenAddresses.push(tokenAddress);
        tokenAmounts.push(amountBN);
      }
    }
  
    // 4. Deposit assets: send Ether and, if provided, tokens.
    const depositTx = await assetReceiver.depositAssets(tokenAddresses, tokenAmounts, { value: etherAmount });
    await depositTx.wait();
    console.log(`Deposited ${etherAmountArg} ETH and ${tokensData.length > 0 ? "tokens" : "no tokens"} into AssetReceiver`);
  
    // 5. Deploy AssetWithdrawler.
    // For demonstration, we use the deployer's address as the withdrawal recipient.
    const [deployer] = await ethers.getSigners();
    const recipient = deployer.address;
    const AssetWithdrawler = await ethers.getContractFactory("AssetWithdrawler");
    const assetWithdrawler = await AssetWithdrawler.deploy(assetReceiverAddress, recipient);
    await assetWithdrawler.waitForDeployment();
    const assetWithdrawlerAddress = await assetWithdrawler.getAddress();
    console.log("AssetWithdrawler deployed to:", assetWithdrawlerAddress);
  
    // 6. Update AssetReceiver's withdrawler to be the deployed AssetWithdrawler.
    await assetReceiver.setWithdrawler(assetWithdrawlerAddress);
    console.log("AssetReceiver withdrawler set to:", assetWithdrawlerAddress);
  
    // 7. Withdraw Ether via AssetWithdrawler.
    const withdrawTx = await assetWithdrawler.withdrawAllEther();
    await withdrawTx.wait();
    console.log("Withdrawal executed via AssetWithdrawler");
  
    // 8. Log final balances.
    const finalEthBalance = await assetReceiver.getEtherBalance();
    console.log("Final Ether balance in AssetReceiver:", ethers.formatEther(finalEthBalance), "ETH");
  
    if (tokenAddresses.length > 0) {
      for (let i = 0; i < tokenAddresses.length; i++) {
        const tokenBalance = await assetReceiver.tokenBalance(tokenAddresses[i]);
        console.log(`Final balance for token at ${tokenAddresses[i]}:`, ethers.formatUnits(tokenBalance, 18));
      }
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error in full test:", error);
      process.exit(1);
    });
  