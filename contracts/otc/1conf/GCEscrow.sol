//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.20;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GCEscrow
 * @dev Slightly modified version of: https://gist.github.com/rchen8/b7cbfefbcb0b3fa2a25c8f4bf9643064
 * Changes include:
 * - Upgrading the Solidity version
 * - Renaming variables
 * - Removed modifiers
 * A simple OTC swap contract allowing two users to set the parameters of an OTC
 * deal in the constructor arguments, and deposits the sold tokens into a vesting
 * contract when a swap is completed.
 * @custom:security-contact joy@kvantum.guru
 */
contract GCEscrow is Ownable {
    using SafeERC20 for IERC20;

    /* ========== Events =========== */

    /**
     *  @dev This event is called when the vesting contract is deployed
     */
    event VestingDeployed(address indexed vesting);

    /* ====== Errors ======== */

    /**
     *  @dev Insufficient Green Candle balance in the contract
     */
    error InsufficientGreenca();

    /**
     *  @dev The contract has already been run
     */
    error SwapAlreadyExecuted();

    /* ======== State Variables ======= */

    address public immutable WETH;
    address public immutable GCA;

    address public immutable BUYER;
    address public immutable SELLER;

    address public immutable VESTING_CONTRACT;

    uint256 public immutable WETH_AMOUNT;
    uint256 public immutable GCA_AMOUNT;

    bool public hasRun;

    /* ====== Constructor ======== */

    /**
     * Sets the state variables that encode the terms of the OTC sale
     *
     * @param _buyer             Address that will purchase GC
     * @param _seller            Address that will receive WETH
     * @param _vestingContract   Address of the vesting contract
     * @param _weth_amount       Amount of WETH swapped for the sale
     * @param _greencandle_amount      Amount of GC swapped for the sale
     * @param _wethAddress       Address of the WETH token
     * @param _greencandleAddress      Address of the Green Candle token
     */
    constructor(
        address _buyer,
        address _seller,
        address _vestingContract,
        uint256 _weth_amount,
        uint256 _greencandle_amount,
        address _wethAddress,
        address _greencandleAddress
    ) Ownable(msg.sender) {
        BUYER = _buyer;
        SELLER = _seller;

        VESTING_CONTRACT = _vestingContract;
        WETH_AMOUNT = _weth_amount;
        GCA_AMOUNT = _greencandle_amount;

        WETH = _wethAddress;
        GCA = _greencandleAddress;
        hasRun = false;
    }

    /* ======= External Functions ======= */

    /**
     * Executes the GCOTC deal. Sends the WETH from the buyer to seller, and
     * locks the Green Candle in the vesting contract. Can only be called once.
     */
    function swap() external onlyOwner {
        if (hasRun) revert SwapAlreadyExecuted();
        hasRun = true;

        if (IERC20(GCA).balanceOf(address(this)) < GCA_AMOUNT)
            revert InsufficientGreenca();

        // Transfer expected WETH from buyer
        IERC20(WETH).safeTransferFrom(BUYER, address(this), WETH_AMOUNT);

        // Transfer green candle to vesting contract
        IERC20(GCA).safeTransfer(VESTING_CONTRACT, GCA_AMOUNT);

        // Transfer WETH to seller
        IERC20(WETH).safeTransfer(SELLER, WETH_AMOUNT);

        emit VestingDeployed(VESTING_CONTRACT);
    }

    /**
     * Return Green Candle to seller to revoke the deal
     */
    function revoke() external onlyOwner {
        uint256 greencandleBalance = IERC20(GCA).balanceOf(address(this));
        IERC20(GCA).safeTransfer(SELLER, greencandleBalance);
    }

    /**
     * Recovers WETH accidentally sent to the contract
     */
    function recoverWeth() external onlyOwner {
        uint256 wethBalance = IERC20(WETH).balanceOf(address(this));
        IERC20(WETH).safeTransfer(BUYER, wethBalance);
    }
}
