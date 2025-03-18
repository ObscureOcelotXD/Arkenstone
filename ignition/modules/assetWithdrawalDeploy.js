// assetReceiverDeployWithdraw.js

async function main() {
  // 1. Retrieve the deployer's account.
  const [deployer] = await ethers.getSigners();
  console.log("Using account for withdrawal operations:", deployer.address);

  // 2. Ensure the AssetReceiver address is set and valid.
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

  // 3. Set the recipient address for withdrawals.
  let recipient;
  if (process.env.WITHDRAW_RECIPIENT) {
    try {
      recipient = ethers.getAddress(process.env.WITHDRAW_RECIPIENT);
    } catch (error) {
      console.error("Invalid WITHDRAW_RECIPIENT address:", error);
      process.exit(1);
    }
  } else {
    recipient = deployer.address;
  }

  // 4. Deploy AssetWithdrawler with AssetReceiver's address and the recipient.
  const AssetWithdrawler = await ethers.getContractFactory("AssetWithdrawler");
  const assetWithdrawler = await AssetWithdrawler.deploy(assetReceiverAddress, recipient);
  await assetWithdrawler.waitForDeployment();
  const assetWithdrawlerAddress = await assetWithdrawler.getAddress();
  console.log("AssetWithdrawler deployed to:", assetWithdrawlerAddress);

  // 5. Update AssetReceiver's withdrawler to be the deployed AssetWithdrawler.
  const setWithdrawTx = await assetReceiver.setWithdrawler(assetWithdrawlerAddress);
  await setWithdrawTx.wait();
  console.log("AssetReceiver withdrawler set to:", assetWithdrawlerAddress);

  // 6. Withdraw Ether.
  // Read ETH withdrawal amount from environment variable; default to "0" if not provided.
  const withdrawEthAmountArg = process.env.WITHDRAW_AMOUNT || "0";
  const withdrawEthAmount = ethers.parseEther(withdrawEthAmountArg);
  if (withdrawEthAmount > 0n) {
    const withdrawEthTx = await assetWithdrawler.withdrawEther(withdrawEthAmount);
    await withdrawEthTx.wait();
    console.log(`Withdrew ${withdrawEthAmountArg} ETH via AssetWithdrawler`);
  } else {
    console.log("No ETH withdrawal amount specified; skipping ETH withdrawal.");
  }

  // 7. Withdraw Tokens.
  // Expected format for WITHDRAW_TOKEN: '{"MTK": "50", "QTUM": "33.3334", "DGE": "100"}'
  if (process.env.WITHDRAW_TOKEN) {
    let withdrawTokenMap = {};
    try {
      withdrawTokenMap = JSON.parse(process.env.WITHDRAW_TOKEN);
    } catch (err) {
      console.error("Invalid WITHDRAW_TOKEN JSON:", err);
      process.exit(1);
    }
    console.log("Processing token withdrawals...");

    // Expected format for TOKEN_ADDRESS_MAP: '{"MTK": "0xTokenAddress1", "QTUM": "0xTokenAddress2", "DGE": "0xTokenAddress3"}'
    if (!process.env.TOKEN_ADDRESS_MAP) {
      console.error("TOKEN_ADDRESS_MAP not set. Cannot process token withdrawals.");
      process.exit(1);
    }
    let tokenAddressMap = {};
    try {
      tokenAddressMap = JSON.parse(process.env.TOKEN_ADDRESS_MAP);
    } catch (err) {
      console.error("Invalid TOKEN_ADDRESS_MAP JSON:", err);
      process.exit(1);
    }

    // Validate each token address.
    for (const symbol of Object.keys(tokenAddressMap)) {
      try {
        tokenAddressMap[symbol] = ethers.getAddress(tokenAddressMap[symbol]);
      } catch (error) {
        console.error(`Invalid token address for ${symbol}:`, error);
        process.exit(1);
      }
    }

    for (const [symbol, amountStr] of Object.entries(withdrawTokenMap)) {
      if (!tokenAddressMap[symbol]) {
        console.log(`Token with symbol ${symbol} not found in TOKEN_ADDRESS_MAP. Skipping.`);
        continue;
      }
      const tokenAddress = tokenAddressMap[symbol];
      const withdrawTokenAmount = ethers.parseUnits(amountStr, 18);
      const tokenWithdrawTx = await assetWithdrawler.withdrawToken(tokenAddress, withdrawTokenAmount);
      await tokenWithdrawTx.wait();
      const remaining = await assetReceiver.tokenBalance(tokenAddress);
      console.log(`After withdrawing ${amountStr} ${symbol}, remaining balance at ${tokenAddress}:`, ethers.formatUnits(remaining, 18));
    }
  } else {
    console.log("No token withdrawal amounts specified; skipping token withdrawals.");
  }

  // 8. Log final Ether balance after withdrawal.
  const postWithdrawEthBalance = await assetReceiver.getEtherBalance();
  console.log("Final Ether balance in AssetReceiver after withdrawal:", ethers.formatEther(postWithdrawEthBalance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in withdrawal script:", error);
    process.exit(1);
  });
