//
//  PartialMatchRegistry.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 5/19/20.
//

import Foundation
import JavaScriptCore

/**
 Plugin used to register match dictionaries and an associated index for use in the AssetRegistry
 */
public class PartialMatchFingerprintPlugin: JSBasePlugin, NativePlugin {
    /**
     Initializes a PartialMatchFingerprintPlugin
     */
    public convenience init() {
        self.init(
            fileName: "partial-match-fingerprint-plugin.prod",
            pluginName: "PartialMatchFingerprintPlugin.PartialMatchFingerprintPlugin"
        )
    }

    /**
     Retrieves arguments for the JS plugin construction
     - returns: An array of arguments for construction
     */
    override public func getArguments() -> [Any] {
        guard let context = self.context else { return [] }
        let registry = PartialMatchRegistry()
        registry.context = context
        return [registry.pluginRef as Any]
    }

    /**
     Register a match object with an index
     A match object is a dictionary describing the structure of desired keys to match an asset
     ```swift
     ["type": "action": "metaData": ["role": "back"]]
     ```
     - parameters:
        - match: The dictionary object to register as a match structure
        - index: The index to register this match object with
     */
    public func register(match: [String: Any], index: Int) {
        guard let context = self.context, let matchObj = JSValue(object: match, in: context) else { return }
        pluginRef?.invokeMethod("register", withArguments: [matchObj, index])
    }

    /**
     Retrieves the stored index for an asset Id if it exists in the registry
     - parameters:
        - assetId: The asset Id to get the index for
     - returns: The index if it exists
     */
    public func get(assetId: String) -> Int? {
        pluginRef?.invokeMethod("get", withArguments: [assetId])?.toObject() as? Int
    }

    /**
     **For testing only** , forcefully sets an index in the registry for an assetId
     - parameters:
        - assetId: The asset Id to set an index for
        - index: The index to set
     */
    public func setMapping(assetId: String, index: Int) {
        pluginRef?.objectForKeyedSubscript("mapping")?.invokeMethod("set", withArguments: [assetId, index])
    }
}

/**
 Wrapper to instantiate @player-ui/partial-match-registry
 */
class PartialMatchRegistry: JSBasePlugin {
    /**
     Constructs a PartialMatchRegistry JS object
     */
    convenience init() {
        self.init(fileName: "partial-match-registry.prod", pluginName: "Registry.Registry")
    }
}
