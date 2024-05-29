//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title GreenOTC2
 * @custom:security-contact joy@kvantum.guru
 */
contract GreenOTC2 is ERC20 {
    /**
     * @dev Total number of tokens in circulation
     */
    uint256 public constant TOKEN_INITIAL_SUPPLY = 1_000_000_000;

    constructor() ERC20("GreenOTC2", "GCTD") {
        _mint(msg.sender, TOKEN_INITIAL_SUPPLY * 10 ** decimals());
    }
}
