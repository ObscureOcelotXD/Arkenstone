// Human-readable ABI for ArkenstoneToken
const ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function minter() view returns (address)",
];

export default ABI;
