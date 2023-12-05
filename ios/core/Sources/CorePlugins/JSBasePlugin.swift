//
//  JSBasePlugin.swift
//  PlayerUI
//
//  Created by Harris Borawski on 12/17/20.
//

import Foundation
import JavaScriptCore

/**
 Base class for wrapping and loading javascript plugins
 */
open class JSBasePlugin {
    /// Reference to the plugin inside the context
    public var pluginRef: JSValue?

    /// The context of the plugin
    public var context: JSContext? {
        // Once this is set, then we call and construct the plugin in the context
        didSet {
            guard let jsContext = context else { return }
            setup(context: jsContext)
        }
    }

    /// The filename to load this plugin from
    public let fileName: String

    /// The name of the plugin to construct
    public let pluginName: String

    /**
     Constructs the plugin
     - parameters:
        - fileName: The filename of the js plugin in the framework resources
        - pluginName: The object name to construct the plugin from
     */
    public init(fileName: String, pluginName: String) {
        self.fileName = fileName
        self.pluginName = pluginName
    }

    /**
     Constructs the JS Plugin in the given context
     - parameters:
        - context: The context to load the plugin into
     */
    open func setup(context: JSContext) {
        pluginRef = getPlugin(context: context, fileName: fileName, pluginName: pluginName, arguments: getArguments())
    }

    /**
     Retrieves the arguments for deferred construction of the plugin
     - returns: An array of arguments to pass to the JS constructor
     */
    open func getArguments() -> [Any] { [] }

    /**
     Function to get the URL for a file.
     This should be overridden by plugins that are outside of the PlayerUI bundle
     - parameters:
        - fileName: The name of the JS file to load
     - returns: A URL to the file in the bundle if found
     */
    open func getUrlForFile(fileName: String) -> URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: JSBasePlugin.self), pathComponent: "PlayerUI.bundle")
        #endif
    }

    /**
     Retrieves the JS Binding for the constructed plugin
     - parameters:
        - context: The context to load the plugin into
     - returns:
        The JS Binding to the plugin
     */
    private func getPlugin(context: JSContext, fileName: String, pluginName: String, arguments: [Any] = []) -> JSValue {
        guard
            let plugin = context.getClassReference(pluginName, load: {loadJSResource(into: $0, fileName: fileName)}),
            let pluginValue = plugin.construct(withArguments: arguments)
        else {
            fatalError("Unable To Construct \(pluginName)")
        }
        return pluginValue
    }

    private func loadJSResource(into context: JSContext, fileName: String) {
        guard
            let url = getUrlForFile(fileName: fileName),
            let jsString = try? String(contentsOf: url, encoding: String.Encoding.utf8)
        else {
            fatalError("Resource not found for \(fileName)")
        }
        context.evaluateScript(jsString)
    }
}
