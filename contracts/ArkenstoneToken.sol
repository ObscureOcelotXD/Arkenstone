// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArkenstoneToken is ERC20 {
    address public minter;

    error NotMinter();
    error ZeroAddress();

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    constructor() ERC20("Arkenstone", "ARKN") {
        minter = msg.sender;
    }

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotMinter();
        _;
    }

    function setMinter(address _minter) external onlyMinter {
        if (_minter == address(0)) revert ZeroAddress();
        emit MinterUpdated(minter, _minter);
        minter = _minter;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}
