// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title TimelineEnforcer
/// @notice On-chain deadline tracking for Axiom review assignments.
///         The platform registers deadlines; anyone can check if they are overdue.
contract TimelineEnforcer {
    struct Deadline {
        uint256 dueTimestamp;
        address responsible;
        bool completed;
    }

    address public platform;

    // submissionHash => array of deadlines
    mapping(bytes32 => Deadline[]) public deadlines;

    event DeadlineRegistered(
        bytes32 indexed submissionHash,
        uint256 index,
        uint256 dueTimestamp,
        address indexed responsible
    );

    event DeadlineCompleted(
        bytes32 indexed submissionHash,
        uint256 index,
        address indexed responsible
    );

    event PlatformUpdated(address indexed oldPlatform, address indexed newPlatform);

    error OnlyPlatform();
    error DeadlineMustBeFuture();
    error ZeroAddress();
    error IndexOutOfBounds();
    error AlreadyCompleted();

    modifier onlyPlatform() {
        if (msg.sender != platform) revert OnlyPlatform();
        _;
    }

    constructor(address _platform) {
        if (_platform == address(0)) revert ZeroAddress();
        platform = _platform;
    }

    /// @notice Register a new deadline for a submission.
    /// @param submissionHash Hash identifying the submission
    /// @param dueTimestamp Unix timestamp when the deadline expires
    /// @param responsible Address of the party responsible (reviewer, editor, etc.)
    function registerDeadline(
        bytes32 submissionHash,
        uint256 dueTimestamp,
        address responsible
    ) external onlyPlatform {
        if (dueTimestamp <= block.timestamp) revert DeadlineMustBeFuture();
        if (responsible == address(0)) revert ZeroAddress();

        uint256 index = deadlines[submissionHash].length;
        deadlines[submissionHash].push(
            Deadline({
                dueTimestamp: dueTimestamp,
                responsible: responsible,
                completed: false
            })
        );

        emit DeadlineRegistered(submissionHash, index, dueTimestamp, responsible);
    }

    /// @notice Mark a deadline as completed (on time or not).
    /// @param submissionHash Hash identifying the submission
    /// @param index Index of the deadline in the submission's deadline array
    function markCompleted(bytes32 submissionHash, uint256 index) external onlyPlatform {
        Deadline[] storage arr = deadlines[submissionHash];
        if (index >= arr.length) revert IndexOutOfBounds();
        Deadline storage d = arr[index];
        if (d.completed) revert AlreadyCompleted();

        d.completed = true;
        emit DeadlineCompleted(submissionHash, index, d.responsible);
    }

    /// @notice Check whether a deadline is overdue.
    /// @param submissionHash Hash identifying the submission
    /// @param index Index of the deadline
    /// @return isOverdue True if the deadline has passed and is not completed
    /// @return dueTimestamp The deadline's due timestamp
    /// @return responsible The responsible party's address
    function checkDeadline(
        bytes32 submissionHash,
        uint256 index
    )
        external
        view
        returns (bool isOverdue, uint256 dueTimestamp, address responsible)
    {
        if (index >= deadlines[submissionHash].length) revert IndexOutOfBounds();
        Deadline storage d = deadlines[submissionHash][index];
        return (!d.completed && block.timestamp > d.dueTimestamp, d.dueTimestamp, d.responsible);
    }

    /// @notice Get the number of deadlines for a submission.
    function getDeadlineCount(bytes32 submissionHash) external view returns (uint256) {
        return deadlines[submissionHash].length;
    }

    /// @notice Get a specific deadline's details.
    function getDeadline(
        bytes32 submissionHash,
        uint256 index
    )
        external
        view
        returns (uint256 dueTimestamp, address responsible, bool completed)
    {
        if (index >= deadlines[submissionHash].length) revert IndexOutOfBounds();
        Deadline storage d = deadlines[submissionHash][index];
        return (d.dueTimestamp, d.responsible, d.completed);
    }

    /// @notice Update the platform address (key rotation).
    function setPlatform(address newPlatform) external onlyPlatform {
        if (newPlatform == address(0)) revert ZeroAddress();
        emit PlatformUpdated(platform, newPlatform);
        platform = newPlatform;
    }
}
