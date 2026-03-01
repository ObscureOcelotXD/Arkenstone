import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Deposited,
  Withdrawn,
  InterestRateUpdated,
  ArknDeposited,
  ArknWithdrawn,
  ArknInterestRateUpdated,
} from "../generated/ArkenstoneStaking/ArkenstoneStaking";
import {
  Protocol,
  TvlSnapshot,
  InterestRateChange,
  EthDeposit,
  EthWithdraw,
  ArknDeposit,
  ArknWithdraw,
} from "../generated/schema";

const PROTOCOL_ID = "global";
const DEFAULT_BPS = BigInt.fromI32(400);

function makeEventId(hash: Bytes, logIndex: BigInt): string {
  return hash.toHexString() + "-" + logIndex.toString();
}

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_ID);
  if (protocol == null) {
    protocol = new Protocol(PROTOCOL_ID);
    protocol.totalEthStaked = BigInt.fromI32(0);
    protocol.totalArknStaked = BigInt.fromI32(0);
    protocol.currentInterestRateBps = DEFAULT_BPS;
    protocol.currentArknInterestRateBps = DEFAULT_BPS;
    protocol.updatedAtBlock = BigInt.fromI32(0);
    protocol.updatedAtTimestamp = BigInt.fromI32(0);
  }
  return protocol;
}

export function handleDeposited(event: Deposited): void {
  let protocol = getOrCreateProtocol();
  protocol.totalEthStaked = protocol.totalEthStaked.plus(event.params.amount);
  protocol.updatedAtBlock = event.block.number;
  protocol.updatedAtTimestamp = event.block.timestamp;
  protocol.save();

  let snapId = makeEventId(event.transaction.hash, event.logIndex);
  let snap = new TvlSnapshot(snapId);
  snap.totalEthStaked = protocol.totalEthStaked;
  snap.totalArknStaked = protocol.totalArknStaked;
  snap.blockNumber = event.block.number;
  snap.timestamp = event.block.timestamp;
  snap.save();

  let id = makeEventId(event.transaction.hash, event.logIndex);
  let deposit = new EthDeposit(id);
  deposit.user = event.params.user;
  deposit.amount = event.params.amount;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.transactionHash = event.transaction.hash;
  deposit.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let protocol = getOrCreateProtocol();
  protocol.totalEthStaked = protocol.totalEthStaked.minus(event.params.amount);
  protocol.updatedAtBlock = event.block.number;
  protocol.updatedAtTimestamp = event.block.timestamp;
  protocol.save();

  let snapId = makeEventId(event.transaction.hash, event.logIndex);
  let snap = new TvlSnapshot(snapId);
  snap.totalEthStaked = protocol.totalEthStaked;
  snap.totalArknStaked = protocol.totalArknStaked;
  snap.blockNumber = event.block.number;
  snap.timestamp = event.block.timestamp;
  snap.save();

  let id = makeEventId(event.transaction.hash, event.logIndex);
  let withdraw = new EthWithdraw(id);
  withdraw.user = event.params.user;
  withdraw.amount = event.params.amount;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.transactionHash = event.transaction.hash;
  withdraw.save();
}

export function handleInterestRateUpdated(event: InterestRateUpdated): void {
  let protocol = getOrCreateProtocol();
  protocol.currentInterestRateBps = event.params.newBps;
  protocol.updatedAtBlock = event.block.number;
  protocol.updatedAtTimestamp = event.block.timestamp;
  protocol.save();

  let id = makeEventId(event.transaction.hash, event.logIndex);
  let change = new InterestRateChange(id);
  change.pool = "eth";
  change.oldBps = event.params.oldBps;
  change.newBps = event.params.newBps;
  change.blockNumber = event.block.number;
  change.timestamp = event.block.timestamp;
  change.transactionHash = event.transaction.hash;
  change.save();
}

export function handleArknDeposited(event: ArknDeposited): void {
  let protocol = getOrCreateProtocol();
  protocol.totalArknStaked = protocol.totalArknStaked.plus(event.params.amount);
  protocol.updatedAtBlock = event.block.number;
  protocol.updatedAtTimestamp = event.block.timestamp;
  protocol.save();

  let snapId = makeEventId(event.transaction.hash, event.logIndex);
  let snap = new TvlSnapshot(snapId);
  snap.totalEthStaked = protocol.totalEthStaked;
  snap.totalArknStaked = protocol.totalArknStaked;
  snap.blockNumber = event.block.number;
  snap.timestamp = event.block.timestamp;
  snap.save();

  let id = makeEventId(event.transaction.hash, event.logIndex);
  let deposit = new ArknDeposit(id);
  deposit.user = event.params.user;
  deposit.amount = event.params.amount;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.transactionHash = event.transaction.hash;
  deposit.save();
}

export function handleArknWithdrawn(event: ArknWithdrawn): void {
  let protocol = getOrCreateProtocol();
  protocol.totalArknStaked = protocol.totalArknStaked.minus(event.params.amount);
  protocol.updatedAtBlock = event.block.number;
  protocol.updatedAtTimestamp = event.block.timestamp;
  protocol.save();

  let snapId = makeEventId(event.transaction.hash, event.logIndex);
  let snap = new TvlSnapshot(snapId);
  snap.totalEthStaked = protocol.totalEthStaked;
  snap.totalArknStaked = protocol.totalArknStaked;
  snap.blockNumber = event.block.number;
  snap.timestamp = event.block.timestamp;
  snap.save();

  let id = makeEventId(event.transaction.hash, event.logIndex);
  let withdraw = new ArknWithdraw(id);
  withdraw.user = event.params.user;
  withdraw.amount = event.params.amount;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.transactionHash = event.transaction.hash;
  withdraw.save();
}

export function handleArknInterestRateUpdated(event: ArknInterestRateUpdated): void {
  let protocol = getOrCreateProtocol();
  protocol.currentArknInterestRateBps = event.params.newBps;
  protocol.updatedAtBlock = event.block.number;
  protocol.updatedAtTimestamp = event.block.timestamp;
  protocol.save();

  let id = makeEventId(event.transaction.hash, event.logIndex);
  let change = new InterestRateChange(id);
  change.pool = "arkn";
  change.oldBps = event.params.oldBps;
  change.newBps = event.params.newBps;
  change.blockNumber = event.block.number;
  change.timestamp = event.block.timestamp;
  change.transactionHash = event.transaction.hash;
  change.save();
}
