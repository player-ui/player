//
//  Wrappers.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 3/30/20.
//

import Foundation
import JavaScriptCore

/**
 Protocol for container objects that can contain some type of asset
 */
public protocol AssetContainer {
    /// The type of the Asset contained in this container
    associatedtype AssetType: PlayerAsset

    /// Mutable property for the asset, must be mutable for resolution between view updates
    var asset: AssetType? { get set }

    /**
     Creates a container with the given asset
     - parameters:
        - forAsset: The asset to put in this container
     */
    init(forAsset: AssetType)
}

/**
 Protocol for Asset Implementations, in order to work with `BaseAssetRegistry`
 */
public protocol PlayerAsset {
    /// The ID of this asset in the Flow
    var id: String { get }

    /// The type of this asset
    var type: String { get }
}

/**
 Protocol for Non asset _reference_ types that still exist in the JS tree hierarchy, and have an associated JSValue
 */
public protocol JSValueRepresentable: AnyObject, JSValueBacked {
    /// the `JSValue` that represents this object
    var rawValue: JSValue? { get set }
}

/**
 Protocol for Non asset _value_ types that still exist in the JS tree hierarchy, and have an associated JSValue
 */
public protocol JSValueBacked {
    /// the `JSValue` that represents this object
    var rawValue: JSValue? { get }
}

/**
 A protocol for defining the minimum amount of data an asset needs to contain
 */
public protocol AssetData: Decodable {
    /// The ID of the asset
    var id: String { get }

    /// The type of the asset
    var type: String { get }

    /// Compare this asset data to `other` for equality. This is used instead of Equatable conformance
    /// to avoid generic constraint restrictions.
    func isEqual(_ other: AssetData) -> Bool
}

// by default asset data does not equal other asset data
extension AssetData {
    public func isEqual(_ other: AssetData) -> Bool { false }
}

// when asset data is Equatable then support checking `other` for equality
extension AssetData where Self: Equatable {
    public func isEqual(_ other: AssetData) -> Bool {
        guard let other = other as? Self else { return false }
        return self == other
    }
}

/**
 MetaData associated with an asset
 */
public struct MetaData: Codable, Hashable {
    /// Additional data to include when beaconing this asset
    public var beacon: AnyType?

    /// The role of this asset
    public var role: String?

    public init(beacon: AnyType?, role: String? = nil) {
        self.beacon = beacon
        self.role = role
    }
}
