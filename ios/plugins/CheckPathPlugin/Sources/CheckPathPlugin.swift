//
//  CheckPathPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 7/17/20.
//

import Foundation

/// Base functionality for CheckPath
open class BaseCheckPathPlugin: JSBasePlugin {
    /**
     The getParent method allows you to query up the tree and return the first parent that matches the given query if such exists.
     In case when query is not provided, the closest parent returned.
     ```swift
     // return an "action" asset if an asset has the "action" asset as a parent
     checkPathPlugin.getParentContext(id: "some-asset-id", query: "action")
     ```
     - parameters:
        - id: The ID of the asset to check
        - query: The type of the parent to check for
     */
    public func getParentContext(id: String, query: String? = nil) -> Any? {
        let arguments = query != nil ? [id, query!] : [id]
        let parent = pluginRef?.invokeMethod("getParent", withArguments: arguments)?.toObject()
        return parent
    }

    /**
     The getParentProp method returns the property on the parent object that the current object falls under.
     ```swift
     // an input with a text asset as the label,
     // will return label for the parentProp of the text asset
     checkPathPlugin.getParentProp(id: "some-asset-id")
     ```
     - parameters:
        - id: The ID of the asset to check
     */
    public func getParentProp(id: String) -> String? {
        let parentProp = pluginRef?.invokeMethod("getParentProp", withArguments: [id])?.toString()
        return parentProp
    }

    /**
     Checks if the id has a parent that matches the query
     ```swift
     // check if an asset has an "action" asset as a parent
     checkPathPlugin.hasParentContext(id: "some-asset-id", query: "action")
     ```
     - parameters:
        - id: The ID of the asset to check
        - query: The type of the parent to check for
     */
    public func hasParentContext(id: String, query: String) -> Bool {
        guard let exists = pluginRef?.invokeMethod("hasParentContext", withArguments: [id, query])?.toBool() else { return false }
        return exists
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: BaseCheckPathPlugin.self), pathComponent: "CheckPathPlugin.bundle")
    }
}

/**
 A plugin that can query the asset tree for contextual information about the hierarchy
 */
open class CheckPathPlugin: BaseCheckPathPlugin, NativePlugin {
    /**
     Constructs the CheckPathPlugin
     */
    public convenience init() {
        self.init(fileName: "check-path-plugin.prod", pluginName: "CheckPathPlugin.CheckPathPlugin")
    }
}
