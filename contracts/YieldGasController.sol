// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAToken} from "./core-v3/contracts/interfaces/IAToken.sol";
import {IBlast} from "./interfaces/IBlast.sol";
import {IGasReceiver} from "./interfaces/IGasReceiver.sol";
import {INativeYieldDistribute} from "./interfaces/INativeYieldDistribute.sol";

contract YieldGasController is Ownable {
    using SafeERC20 for IERC20;

    event RescueToken(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    address public immutable pool;
    address public immutable gasRefund;
    address public immutable aWETH;
    address public immutable aUSDB;
    mapping(address => bool) public isDistributor;

    modifier onlyDistributor() {
        require(isDistributor[msg.sender], "not allowed");
        _;
    }

    constructor(
        address _pool,
        address _gasRefund,
        address _aWETH,
        address _aUSDB
    ) {
        pool = _pool;
        gasRefund = _gasRefund;
        aWETH = _aWETH;
        aUSDB = _aUSDB;
    }

    function distributeYield() external onlyDistributor {
        _distributeYield(aWETH);
        _distributeYield(aUSDB);
    }

    function _distributeYield(address aToken) internal {
        IAToken(aToken).claimYield(address(this));
        address underlying = IAToken(aToken).UNDERLYING_ASSET_ADDRESS();
        uint256 balance = IERC20(underlying).balanceOf(address(this));
        address yieldDistribute = IAToken(aToken).yieldDistributor();
        IERC20(underlying).approve(yieldDistribute, balance);
        INativeYieldDistribute(yieldDistribute).distributeYield(balance);
    }

    function claimRefundedGas() external onlyDistributor {
        IGasReceiver(pool).claimRefundedGas(gasRefund);
    }

    function addDistributor(address distributor) external onlyOwner {
        isDistributor[distributor] = true;
    }

    function transferOwnership(
        address target,
        address newOwner
    ) external onlyOwner {
        Ownable(target).transferOwnership(newOwner);
    }

    function rescueToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            _safeTransferETH(to, amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
        emit RescueToken(token, to, amount);
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }
}
