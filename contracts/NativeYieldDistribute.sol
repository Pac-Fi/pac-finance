// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IScaledBalanceToken} from "./core-v3/contracts/interfaces/IScaledBalanceToken.sol";
import {IBlast} from "./interfaces/IBlast.sol";

contract NativeYieldDistribute is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    event YieldDistributed(uint256 amount, uint256 timestamp);

    event RescueToken(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    struct UserInfo {
        uint256 currentBalance;
        uint256 balanceUpdateTime;
        uint256 pointSettleRound;
        uint256 settledPoint;
        uint256 yieldSettleRound;
        //roundId => point
        mapping(uint256 => uint256) roundPoint;
    }
    uint256 internal constant RAY = 1e27;
    address public immutable BLAST;

    address public yieldToken;
    address public aToken;

    // pool info
    //roundId => yield per point
    mapping(uint256 => uint256) public yieldPerPoint;
    //roundId => pool settle timestamp
    mapping(uint256 => uint256) public roundSettleTime;
    //current round info
    uint256 public lastTotalPointUpdateTime;
    uint256 public currentTotalSupply;
    uint256 public currentRoundTotalPoint;
    uint256 public currentRound;

    // user info
    mapping(address => UserInfo) public userInfo;

    constructor(address _blast) {
        BLAST = _blast;
    }

    function initialize(
        address _aToken,
        address _yieldToken
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        currentRound = 1;
        aToken = _aToken;
        yieldToken = _yieldToken;
        if (BLAST != address(0)) {
            IBlast(BLAST).configureClaimableGas();
        }
    }

    function aTokenBalanceChange(address user) external {
        //update total point
        _updateTotalPoint();
        currentTotalSupply = IScaledBalanceToken(aToken).scaledTotalSupply();

        //update user info
        UserInfo storage info = userInfo[user];
        _updateUserPoint(info);
        info.currentBalance = IScaledBalanceToken(aToken).scaledBalanceOf(user);
    }

    function getUserRoundPoint(
        address user,
        uint256 round
    ) public view returns (uint256) {
        if (round >= currentRound) {
            return 0;
        }

        UserInfo storage info = userInfo[user];
        if (round <= info.pointSettleRound) {
            return info.roundPoint[round];
        }

        uint256 roundStartTime = roundSettleTime[round - 1];
        uint256 roundEndTime = roundSettleTime[round];
        if (info.balanceUpdateTime <= roundStartTime) {
            uint256 roundDuration = roundEndTime - roundStartTime;
            return info.currentBalance * roundDuration;
        } else {
            uint256 roundDuration = roundEndTime - info.balanceUpdateTime;
            return info.settledPoint + info.currentBalance * roundDuration;
        }
    }

    function getPendingYield(address user) external view returns (uint256) {
        UserInfo storage info = userInfo[user];
        uint256 poolSettledRound = currentRound - 1;
        uint256 accYield = 0;
        for (
            uint256 index = info.yieldSettleRound + 1;
            index <= poolSettledRound;
            index++
        ) {
            uint256 userPoint = getUserRoundPoint(user, index);
            uint256 yield = (userPoint * yieldPerPoint[index]) / RAY;
            accYield += yield;
        }
        return accYield;
    }

    function claimYield() external whenNotPaused nonReentrant {
        address user = msg.sender;
        UserInfo storage info = userInfo[user];
        _updateUserPoint(info);

        uint256 poolSettledRound = currentRound - 1;
        uint256 accYield = 0;
        for (
            uint256 index = info.yieldSettleRound + 1;
            index <= poolSettledRound;
            index++
        ) {
            uint256 userPoint = info.roundPoint[index];
            uint256 yield = (userPoint * yieldPerPoint[index]) / RAY;
            accYield += yield;
        }
        info.yieldSettleRound = poolSettledRound;
        _transferYield(msg.sender, accYield);
    }

    function _updateTotalPoint() internal {
        uint256 timeDiff = block.timestamp - lastTotalPointUpdateTime;
        uint256 pendingPoint = currentTotalSupply * timeDiff;
        currentRoundTotalPoint = currentRoundTotalPoint + pendingPoint;
        lastTotalPointUpdateTime = block.timestamp;
    }

    function _updateUserPoint(UserInfo storage info) internal {
        //update point for every passed round
        for (
            uint256 index = info.pointSettleRound + 1;
            index < currentRound;
            index++
        ) {
            uint256 roundEndTime = roundSettleTime[index];
            uint256 roundDuration = roundEndTime - info.balanceUpdateTime;
            uint256 totalRoundPoint = info.settledPoint +
                info.currentBalance *
                roundDuration;
            info.roundPoint[index] = totalRoundPoint;
            info.settledPoint = 0;
            info.balanceUpdateTime = roundEndTime;
        }
        uint256 pointSettleRound = currentRound - 1;
        info.pointSettleRound = pointSettleRound;

        //update current round point
        uint256 duration;
        if (info.balanceUpdateTime > roundSettleTime[pointSettleRound]) {
            duration = block.timestamp - info.balanceUpdateTime;
        } else {
            duration = block.timestamp - roundSettleTime[pointSettleRound];
        }
        info.settledPoint = info.settledPoint + duration * info.currentBalance;
        info.balanceUpdateTime = block.timestamp;
    }

    function _transferYield(address to, uint256 amount) internal {
        if (yieldToken == address(0)) {
            _safeTransferETH(to, amount);
        } else {
            IERC20(yieldToken).safeTransfer(to, amount);
        }
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }

    function distributeYield(uint256 amount) external payable onlyOwner {
        //1. update total point
        _updateTotalPoint();

        //2. calculate yield per point
        if (yieldToken == address(0)) {
            require(amount == msg.value, "invalid amount");
        } else {
            IERC20(yieldToken).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
        }
        uint256 currentRoundYieldPerPoint = (amount * RAY) /
            currentRoundTotalPoint;

        //3. update round info
        yieldPerPoint[currentRound] = currentRoundYieldPerPoint;
        roundSettleTime[currentRound] = block.timestamp;
        currentRoundTotalPoint = 0;
        currentRound++;

        emit YieldDistributed(amount, block.timestamp);
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

    function claimRefundedGas(address recipient) external onlyOwner {
        IBlast(BLAST).claimMaxGas(address(this), recipient);
    }
}
