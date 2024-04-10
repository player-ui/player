//
//  Beacon.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/13/20.
//

import Foundation

/**
 An object representing a beacon fired from an `Asset`
 */
public struct AssetBeacon: Codable, Equatable {
    /// The action that caused the beacon
    public var action: String

    /// The element in the asset that triggered the beacon
    public var element: String

    /// The asset that the beacon comes from
    public var asset: BeaconableAsset

    /// Any additional data to add to the beacon payload
    public var data: AnyType?

    /// Constructs an AssetBeacon
    /// - Parameters:
    ///   - action: The action taken for the beacon
    ///   - element: The kind of element that fired the beacon
    ///   - asset: A minimal representation of the asset that fired the beacon
    ///   - data: Arbitrary additional data to add to the beacon payload
    public init(
        action: String,
        element: String,
        asset: BeaconableAsset,
        data: AnyType? = nil
    ) {
        self.action = action
        self.element = element
        self.asset = asset
        self.data = data
    }
}

/// MetaData requirements for `BaseBeaconPlugin` and its extensions
public protocol BeaconableMetaData {
    /// Additional data to include when beaconing this asset
    var beacon: AnyType? { get set }
}

/// Container Object for matching the data type for the JS Beacon Plugin
public struct BeaconableAsset: Codable, Equatable {
    /// The ID of the asset that fired the beacon
    public var id: String

    /// The Type of the asset that fired the beacon
    public var type: String?

    /// The metaData of the asset that fired the beacon
    public var metaData: MetaData?

    /// Constructs a BeaconableAsset
    /// - Parameters:
    ///   - id: The ID of the asset that fired the beacon
    ///   - type: The type of the asset that fired the beacon
    ///   - metaData: Beacon applicable metaData from the asset that fired the beacon
    public init<MetaDataType: BeaconableMetaData>(
        id: String,
        type: String? = nil,
        metaData: MetaDataType? = nil
    ) {
        self.id = id
        self.type = type
        self.metaData = MetaData(beacon: metaData?.beacon)
    }

    /// Constructs a BeaconableAsset
    /// - Parameters:
    ///   - id: The ID of the asset that fired the beacon
    ///   - type: The type of the asset that fired the beacon
    public init(
        id: String,
        type: String? = nil
    ) {
        self.id = id
        self.type = type
        self.metaData = nil
    }
}

extension MetaData: BeaconableMetaData {}

/**
 All potential Beacon Element types
 */
public enum BeaconElement: String, Codable {
    /// The Element was represented as a buttton
    case button

    /// The Element was represented as a buttton
    case link

    /// The Element was represented as a tile
    case tile

    /// The Element was represented as a radio button
    case radio_button

    /// The Element was represented as a dropdown
    case drop_down

    /// The Element was represented as an expand
    case expand

    /// The Element was represented as a checkbox
    case check_box

    /// The Element was represented as a text input
    case text_input

    /// The Element was represented as a search input
    case search_input

    /// The Element was represented as a file input
    case file_input

    /// The Element was represented as a video
    case video

    /// The Element was represented as a view
    case view
}

/**
 All possible Beacon Actions
 */
public enum BeaconAction: String, Codable {
    /// The action taken was a tap
    case clicked

    /// The action taken was opening
    case opened

    /// The action taken was closing
    case closed

    /// The action taken was a selection
    case selected

    /// The action taken was a deselection
    case unselected

    /// The action taken was an autocompletion
    case autocompleted

    /// The action taken was a add
    case added

    /// The action taken was a delete
    case deleted

    /// The action taken was a modify
    case modified

    /// The action taken was a play
    case played

    /// The action taken was a playing ending
    case ended

    /// The action taken was a view
    case viewed
}
