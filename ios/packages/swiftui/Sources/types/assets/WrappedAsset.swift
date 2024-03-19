//
//  WrappedAsset.swift
//  PlayerUI
//
//  Created by Harris Borawski on 2/26/21.
//

/**
 Represents the wrapping object that contains a SwiftUIAsset
 The JS Player will return assets in the format
 ```
 { asset: {id, type} }
 ```
 or
 ```
 { id, type }
 ```
 This wrapper decodes either to provide a consistent access mechanism
 */
public typealias WrappedAsset = GenericWrappedAsset<MetaData>

public typealias GenericWrappedAsset<MetaDataType: Decodable&Equatable> = BaseGenericWrappedAsset<MetaDataType, DefaultAdditionalData>

public struct DefaultAdditionalData: Decodable, Equatable {}

public struct BaseGenericWrappedAsset<MetaData, AdditionalData>: Decodable, AssetContainer
    where MetaData: Decodable&Equatable, AdditionalData: Decodable&Equatable {
    /// The keys used to decode the wrapper
    public enum CodingKeys: String, CodingKey {
        /// Key to decode asset in a wrapper
        case asset
        /// Key to decode metadata in a wrapper
        case metaData
    }

    /// The underlying asset if it decoded
    public var asset: SwiftUIAsset?

    /// MetaData that is associated with the adjacent asset
    public var metaData: MetaData?

    /// Additional data to decode as sibling keys to `asset` or `metaData`
    public var additionalData: AdditionalData?

    /**
     Constructs an AssetWrapper, this is used as a fallback when decoding fails
     so the base asset can be used in the tree
     - parameters:
        - forAsset: The asset to put into the wrapper
     */
    public init(forAsset: SwiftUIAsset) {
        self.asset = forAsset
    }

    /**
     Constructs an AssetWrapper from a decoder instance
     - parameters:
        - decoder: The decoder to decode from
     - throws:
        Throws an error if the decoder does not contain a DecodeFunction
     */
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.asset = try container.decodeIfPresent(RegistryDecodeShim<SwiftUIAsset>.self, forKey: .asset)?.asset
        self.metaData = try container.decodeIfPresent(MetaData.self, forKey: .metaData)
        self.additionalData = try decoder.singleValueContainer().decode(AdditionalData.self)
    }
}

// MARK: - Equatable conformance
extension GenericWrappedAsset: Equatable where MetaData: Equatable {
    public static func == (lhs: Self, rhs: Self) -> Bool {
        let isMetaDataSame   = lhs.metaData == rhs.metaData
        let areBothAssetsNil = lhs.asset == nil && rhs.asset == nil
        var areAssetsEqual: Bool { (lhs.asset?.valueData).flatMap { rhs.asset?.valueData.isEqual($0) } ?? false }
        return isMetaDataSame && (areBothAssetsNil || areAssetsEqual)
    }
}
