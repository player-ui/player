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
public struct AssetBeacon: Codable {
    /// The action that caused the beacon
    public var action: String

    /// The element in the asset that triggered the beacon
    public var element: String

    /// The asset that the beacon comes from
    public var asset: BeaconableAsset

    /// Any additional data to add to the beacon payload
    public var data: AnyType?
}

/// Container Object for matching the data type for the JS Beacon Plugin
public struct BeaconableAsset: Codable {
    /// The ID of the asset that fired the beacon
    public var id: String

    /// The Type of the asset that fired the beacon
    public var type: String?

    /// The metaData of the asset that fired the beacon
    public var metaData: MetaData?
}

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
