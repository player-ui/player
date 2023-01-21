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
public typealias WrappedAsset = GenericWrappedAsset<DefaultAdditionalData>

public struct GenericWrappedAsset<AdditionalData>: Decodable, AssetContainer where AdditionalData: Decodable&Equatable {
    /// The keys used to decode the wrapper
    public enum CodingKeys: String, CodingKey {
        /// Key to decode asset in a wrapper
        case asset
    }

    /// The underlying asset if it decoded
    public var asset: SwiftUIAsset?

    /// Additional data that is associated with the adjacent asset
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
        self.additionalData = try decoder.singleValueContainer().decode(AdditionalData.self)
    }
}

extension GenericWrappedAsset where AdditionalData == DefaultAdditionalData {
    /// MetaData associated with the sibling key `asset`
    public var metaData: MetaData? { additionalData?.metaData }
}

// MARK: - Equatable conformance

extension GenericWrappedAsset: Equatable where AdditionalData: Equatable {
    public static func == (lhs: Self, rhs: Self) -> Bool {
        let isMetaDataSame   = lhs.additionalData == rhs.additionalData
        let areBothAssetsNil = lhs.asset == nil && rhs.asset == nil
        var areAssetsEqual: Bool { (lhs.asset?.valueData).flatMap { rhs.asset?.valueData.isEqual($0) } ?? false }
        return isMetaDataSame && (areBothAssetsNil || areAssetsEqual)
    }
}
