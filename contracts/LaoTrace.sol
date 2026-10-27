// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LaoTrace Web3 — On-Chain Traceability for Premium Lao Products
 * @notice Supports multi-category products (Coffee, Silk, Tea, etc.) with dynamic action steps
 * @dev Designed for LAB Chain (Chain ID: 5222)
 */
contract LaoTrace {
    struct Product {
        string productId;
        string productName;
        string category;
        address creator;
        uint256 createdAt;
        bool exists;
    }

    struct TraceStep {
        string action;
        string location;
        string ipfsHash;
        uint256 timestamp;
        address actor;
    }

    // Mapping from productId => Product metadata
    mapping(string => Product) private products;

    // Mapping from productId => Array of traceability timeline steps
    mapping(string => TraceStep[]) private timelines;

    // Array of all registered productIds for discovery
    string[] private allProductIds;

    event ProductRegistered(
        string indexed productIdHash,
        string productId,
        string productName,
        string category,
        address indexed creator,
        uint256 timestamp
    );

    event TraceStepAdded(
        string indexed productIdHash,
        string productId,
        string action,
        string location,
        string ipfsHash,
        address indexed actor,
        uint256 timestamp
    );

    /**
     * @notice 1. registerProduct — สำหรับ "ต้นน้ำ" (ชาวสวน/ผู้ผลิต) ลงทะเบียนสินค้าล็อตใหม่
     */
    function registerProduct(
        string calldata _productId,
        string calldata _productName,
        string calldata _category,
        string calldata _initialAction,
        string calldata _location,
        string calldata _ipfsHash
    ) external {
        require(bytes(_productId).length > 0, "LaoTrace: productId is required");
        require(bytes(_productName).length > 0, "LaoTrace: productName is required");
        require(!products[_productId].exists, "LaoTrace: productId already exists");

        products[_productId] = Product({
            productId: _productId,
            productName: _productName,
            category: _category,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        timelines[_productId].push(
            TraceStep({
                action: _initialAction,
                location: _location,
                ipfsHash: _ipfsHash,
                timestamp: block.timestamp,
                actor: msg.sender
            })
        );

        allProductIds.push(_productId);

        emit ProductRegistered(
            _productId,
            _productId,
            _productName,
            _category,
            msg.sender,
            block.timestamp
        );

        emit TraceStepAdded(
            _productId,
            _productId,
            _initialAction,
            _location,
            _ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice 2. addTraceStep — สำหรับ "กลางน้ำ" (โรงคั่ว/จุดตรวจ/ขนส่ง) อัปเดตสถานะต่อท้ายประวัติเดิม
     */
    function addTraceStep(
        string calldata _productId,
        string calldata _action,
        string calldata _location,
        string calldata _ipfsHash
    ) external {
        require(products[_productId].exists, "LaoTrace: product does not exist");
        require(bytes(_action).length > 0, "LaoTrace: action is required");

        timelines[_productId].push(
            TraceStep({
                action: _action,
                location: _location,
                ipfsHash: _ipfsHash,
                timestamp: block.timestamp,
                actor: msg.sender
            })
        );

        emit TraceStepAdded(
            _productId,
            _productId,
            _action,
            _location,
            _ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Alias สำหรับ updateTraceability (เผื่อเรียกใช้ชื่อนี้)
     */
    function updateTraceability(
        string calldata _productId,
        string calldata _action,
        string calldata _location,
        string calldata _ipfsHash
    ) external {
        require(products[_productId].exists, "LaoTrace: product does not exist");
        require(bytes(_action).length > 0, "LaoTrace: action is required");

        timelines[_productId].push(
            TraceStep({
                action: _action,
                location: _location,
                ipfsHash: _ipfsHash,
                timestamp: block.timestamp,
                actor: msg.sender
            })
        );

        emit TraceStepAdded(
            _productId,
            _productId,
            _action,
            _location,
            _ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice 3. getTimeline — สำหรับ "ปลายน้ำ" (ผู้บริโภค) ดึงประวัติการเดินทางทั้งหมด
     */
    function getTimeline(
        string calldata _productId
    ) external view returns (TraceStep[] memory) {
        require(products[_productId].exists, "LaoTrace: product does not exist");
        return timelines[_productId];
    }

    /**
     * @notice Alias สำหรับ getProductHistory (เผื่อเรียกใช้ชื่อนี้)
     */
    function getProductHistory(
        string calldata _productId
    ) external view returns (TraceStep[] memory) {
        require(products[_productId].exists, "LaoTrace: product does not exist");
        return timelines[_productId];
    }

    /**
     * @notice 4. getProductDetails — ดึงข้อมูลหน้าปกของสินค้า
     */
    function getProductDetails(
        string calldata _productId
    ) external view returns (Product memory) {
        require(products[_productId].exists, "LaoTrace: product does not exist");
        return products[_productId];
    }

    /**
     * @notice ดึงรายการรหัสสินค้าทั้งหมดในระบบ
     */
    function getAllProductIds() external view returns (string[] memory) {
        return allProductIds;
    }
}
