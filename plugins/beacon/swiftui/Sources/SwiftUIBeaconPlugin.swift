//
//  BeaconPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 3/11/20.
//

import Foundation
import JavaScriptCore
import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
import PlayerUIBaseBeaconPlugin
#endif

/**
 Plugin used by `SwiftUIPlayer` for beaconing in a uniform format between platforms
 */
public class BeaconPlugin<BeaconStruct: Decodable>: BaseBeaconPlugin<BeaconStruct>, NativePlugin {
    /**
     Constructs a BeaconPlugin
     - parameters:
        - context: The context to load the plugin into
        - onBeacon: A callback to receive beacon events
     */
    public convenience init(plugins: [JSBasePlugin] = [], onBeacon: ((BeaconStruct) -> Void)?) {
        self.init(fileName: "BeaconPlugin.native", pluginName: "BeaconPlugin.BeaconPlugin")
        self.callback = onBeacon
        self.plugins = plugins
    }

    public func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }
        let beacon = self.beacon(assetBeacon:)
        player.hooks?.view.tap(name: "BeaconPlugin") { view in
            AnyView(view.environment(\.beaconContext, BeaconContext(beacon)))
        }
    }
}

/**
 Context object that contains a function to send a beacon
 */
public class BeaconContext: ObservableObject {
    private let beaconFn: (AssetBeacon) -> Void

    /**
     Constructs a BeaconContext
     - parameters:
        - beacon: The function to use for sending the beacon
     */
    public init(_ beacon: @escaping (AssetBeacon) -> Void) {
        self.beaconFn = beacon
    }

    /**
     Sends a beacon through the JavaScript beacon plugin
     - parameters:
        - action: The type of action that occurred
        - element: The type of element in the asset that triggered the beacon
        - id: The ID of the asset that triggered the beacon
        - metaData: `BeaconableMetaData` to include as extra data to the core BeaconPlugin
        - data: Additional arbitrary data to include in the beacon
     */
    public func beacon<MetaDataType: BeaconableMetaData>(
        action: String,
        element: String,
        id: String,
        type: String? = nil,
        metaData: MetaDataType? = nil,
        data: AnyType? = nil
    ) {
        self.beaconFn(
            AssetBeacon(
                action: action,
                element: element,
                asset: BeaconableAsset(id: id, type: type, metaData: metaData.map { MetaData(beacon: $0.beacon) }),
                data: data
            )
        )
    }

    /**
     Sends a beacon through the JavaScript beacon plugin
     - parameters:
        - action: The type of action that occurred
        - element: The type of element in the asset that triggered the beacon
        - id: The ID of the asset that triggered the beacon
        - data: Additional arbitrary data to include in the beacon
     */
    public func beacon(
        action: String,
        element: String,
        id: String,
        type: String? = nil,
        data: AnyType? = nil
    ) {
        self.beaconFn(
            AssetBeacon(
                action: action,
                element: element,
                asset: BeaconableAsset(id: id, type: type),
                data: data
            )
        )
    }
}

/// EnvironmentKey for setting a `BeaconContext`
public struct BeaconContextKey: EnvironmentKey {
    /// Default value for this key
    public static let defaultValue: BeaconContext? = nil
}

/// EnvironmentValue for `BeaconContext` for the `BeaconPlugin`
public extension EnvironmentValues {
    /// The `BeaconContext` if it exists in the environment
    var beaconContext: BeaconContext? {
        get { self[BeaconContextKey.self] }
        set { self[BeaconContextKey.self] = newValue }
    }
}
