# Arkenstone Hardhat project

This project is a smart contract that can send and receive assets on the Ethereum network.
Example query (run in terminal):

---- receive

$env:ETH_AMOUNT = "30"; 
$env:TOKENS = '[{"name": "MockToken", "symbol": "MTK", "amount": "152.20"}, {"name": "QTUM Token", "symbol": "QTUM", "amount": "75"}, {"name": "DoggyEth", "symbol": "DGE", "amount": "420"}]';
$env:WITHDRAW_AMOUNT = "35";
$env:WITHDRAW_TOKEN = '{"MTK": "50", "QTUM": "33.3334", "DGE": "100"}';
npx hardhat run ignition/modules/FullFunctionalityDeploy.js --network localhost

$env:ETH_AMOUNT = "35"; 
$env:TOKENS = '[{"name": "MockToken", "symbol": "MTK", "amount": "155.55"}, {"name": "QTUM Token", "symbol": "QTUM", "amount": "85"}, {"name": "DoggyEth", "symbol": "DGE", "amount": "420"}]';
npx hardhat run ignition/modules/assetReceiverDeploy.js --network localhost

----


---- withdrawal

$env:ASSET_RECEIVER_ADDRESS = "0xYourAssetReceiverAddress"
$env:WITHDRAW_AMOUNT = "35"
$env:WITHDRAW_RECIPIENT = "0xRecipientAddress"  # optional; defaults to deployer address if not set.
npx hardhat run scripts/assetReceiverDeployWithdrawETH.js --network localhost

$env:ASSET_RECEIVER_ADDRESS = "0xYourAssetReceiverAddress"
$env:WITHDRAW_AMOUNT = "35"
$env:WITHDRAW_TOKEN = '{"MTK": "50", "QTUM": "33.3334", "DGE": "100"}'
$env:TOKEN_ADDRESS_MAP = '{"MTK": "0xTokenAddress1", "QTUM": "0xTokenAddress2", "DGE": "0xTokenAddress3"}'
$env:WITHDRAW_RECIPIENT = "0xRecipientAddress"  # Optional
npx hardhat run ignintion/modules/assetReceiverDeployWithdraw.js --network localhost

----

Also This project can integrate with Blockscout to visualzie the network

setup blockscout in docker desktop or command line then go to localhost.

might need to use this instead of regular docker compoose since this project uses hard hat:
docker-compose -f hardhat-network.yml up -d



Example of determining what the address would be to get a withdrawal working based on a receive/deposit.
----
Deploying AssetReceiver with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
AssetReceiver deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
MTK token deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Approved 155.55 MTK to AssetReceiver
QTUM token deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
Approved 85 QTUM to AssetReceiver
DGE token deployed to: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
Approved 420 DGE to AssetReceiver
Deposited 35 ETH and tokens as specified into AssetReceiver
Asset summary after deposit:
Ether: 35.0 ETH
Token at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 balance: 155.55
Token at 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 balance: 85.0
Token at 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 balance: 420.0

withdrawal would be 

$env:ASSET_RECEIVER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
$env:WITHDRAW_AMOUNT = "35"
$env:WITHDRAW_TOKEN = '{"MTK": "50", "QTUM": "33.3334", "DGE": "100"}'
$env:TOKEN_ADDRESS_MAP = '{"MTK": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "QTUM": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", "DGE": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"}'
# $env:WITHDRAW_RECIPIENT = "0xRecipientAddress"  # Optional; if not set, defaults to deployer's address. also you can get an address from the hardhat when you first run npx hardhat node
npx hardhat run ignition/modules/assetWithdrawalDeploy.js --network localhost        

----