# Arkenstone Hardhat project

This project is a smart contract that can send and receive assets on the Ethereum network.
Example query (run in terminal):
$env:ETH_AMOUNT = "30"; 
$env:TOKENS = '[{"name": "MockToken", "symbol": "MTK", "amount": "152.20"}, {"name": "QTUM Token", "symbol": "QTUM", "amount": "75"}, {"name": "DoggyEth", "symbol": "DGE", "amount": "420"}]';
$env:WITHDRAW_AMOUNT = "35";
$env:WITHDRAW_TOKEN = '{"MTK": "50", "QTUM": "33.3334", "DGE": "100"}';
npx hardhat run ignition/modules/assetReceiverDeploy.js --network localhost

```
Also This project can integrate with Blockscout to visualzie the network

setup blockscout in docker desktop or command line then go to localhost.

might need to use this instead of regular docker compoose since this project uses hard hat:
docker-compose -f hardhat-network.yml up -d