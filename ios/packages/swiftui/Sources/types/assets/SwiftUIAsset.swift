//
//  SwiftUIAsset.swift
//  PlayerUI
//
//  Created by Harris Borawski on 2/26/21.
//

import JavaScriptCore
import SwiftUI

/**
 A base class representing a Player Asset that will be rendering using SwiftUI
 */
open class SwiftUIAsset: Decodable, PlayerAsset, Identifiable {
    /// UUID of this Asset for identifying the instance
    public var uuid = UUID()

    /// id of the asset
    public var id: String { valueData.id }

    /// type of the asset
    public var type: String { valueData.type }

    /// Used for model cache testing
    var modelObject: AnyObject { self }

    /// Default data that an asset will contain
    public struct Data: AssetData, Codable {
        /// The ID of the asset
        public var id: String
        /// The Type of the asset
        public var type: String
        /// MetaData associated with this asset
        public var metaData: MetaData?
    }

    /// Decoded `Data`
    public var baseData: Data

    /// Full data decoded by the implementation of this asset
    open var valueData: AssetData { baseData }

    /**
     Decodes an asset to create an instance
      - parameters:
        - decoder: The decoder to decode from
     */
    public required init(from decoder: Decoder) throws {
        baseData = try decoder.singleValueContainer().decode(Data.self)
    }

    /// A type erased SwiftUI view to use for rendering this asset
    open var view: AnyView { AnyView(EmptyView()) }
}
