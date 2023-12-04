//
//  HeadlessPlayer.swift
//  PlayerUI
//
//  Created by Harris Borawski on 11/4/20.
//

import Foundation
import JavaScriptCore
#if SWIFT_PACKAGE
import PlayerUILogger
#endif

// MARK: PlayerError

/**
 Represents the different errors that occur in Player lifecycle
 */
public enum PlayerError: Error {
    /// There was an issue converting a native binding into a JSValue in the context
    case jsConversionFailure

    /// The response from Player was not in a known format
    case unknownResponse(Error)

    /// The JS Player rejected the flow at some point
    case promiseRejected(error: ErrorState)

    /// The JS player has not been created yet
    case playerNotInstantiated
}

extension PlayerError: JSConvertibleError {
    public var jsDescription: String {
        switch self {
        case .unknownResponse(let error):
            return error.playerDescription
        default: return localizedDescription
        }
    }
}

// MARK: CoreHooks
/**
 Defines the minimum hooks that need to be available on a player
 */
public protocol CoreHooks {
    associatedtype DataControllerType: BaseDataController, CreatedFromJSValue

    /// Fired when the FlowController changes
    var flowController: Hook<FlowController> { get }

    /// Fired when the ViewController changes
    var viewController: Hook<ViewController> { get }

    /// Fired when the DataController changes
    var dataController: Hook<DataControllerType> { get }

    /// Fired when the state changes
    var state: Hook<BaseFlowState> { get }

    /// Initialize hooks from reference to javascript core player
    init(from: JSValue)
}

// MARK: PlayerRegistry

/**
 Defines the minimum required functionality for a registry
 */
public protocol PlayerRegistry {
    /// The type of asset that is being used by this player
    associatedtype AssetType
    /// The type of wrapper that contains the `AssetType`
    associatedtype WrapperType

    /// Logger instance from the attached player
    var logger: TapableLogger? { get set }

    /**
     Register an asset to decode a type, this is converted to ["type": <type>]
     - parameters:
        - type: The string type the asset should decode
        - asset: The swift type representing the asset
     */
    func register(_: String, asset: AssetType.Type)
    /**
     Register and asset to decode based on matching the specified object
     This allows registration of multiple assets for the same type, but can match based on other parts of the object

     Example:
     ```swift
     register(["type": "action", "metaData": ["role": "back"]], BackActionAsset.self)
     ```
     This asset will only be used when decoding a view in the JSON tree that is type action, and has the `back` role.
     This means the custom asset gets the `run` function that regular actions get
     - parameters:
        - match: The object to match this asset to
        - for: The Asset type to associate with the match
     */
    func register(_: [String: Any], for: AssetType.Type)

    /**
     Decodes a JSValue into an Asset
     - parameters:
        - value: The JSValue representing an asset
     - returns: A decoded Asset
     */
    func decode(_: JSValue) throws -> AssetType

    /**
     Decodes a JSValue into a `WrapperType`
     - parameters:
        - value: The JSValue representing an asset
     - returns: A decoded Asset
     */
    func decodeWrapper(_ value: JSValue) throws -> WrapperType
}

// MARK: HeadlessPlayer

/**
 A base implementation of a player
 */
public protocol HeadlessPlayer {
    /// The type of hooks that this player has
    associatedtype HooksType: CoreHooks
    /// The type of registry being used for this player
    associatedtype RegistryType: PlayerRegistry
    /// Registry for Assets
    var assetRegistry: RegistryType { get }
    /// The current state of Player
    var state: BaseFlowState? { get }
    /// A reference to the core player in the JSContext
    var jsPlayerReference: JSValue? { get }
    /// The hooks that this player has for lifecycle events
    var hooks: HooksType? { get }
    /// A logger reference for use in plugins to log through the shared player logger
    var logger: TapableLogger { get }

    /**
     Sets up the core javascript player in the given context
     - parameters:
        - context: The context to use for initializing the core player
        - logger: The logger to bind to the javascript logger
     - returns: Reference to the created JS player
     */
    func setupPlayer(context: JSContext, plugins: [NativePlugin]) -> JSValue?

    /**
     Starts the given flow
     - parameters:
        - flow: The JSON Flow
        - completion: A completion handler for when the flow has completed
     */
    func start(flow: String, completion: @escaping (Result<CompletedState, PlayerError>) -> Void)
}

// MARK: HeadlessPlayer Extension

/**
 Default Implementation for player methods
 */
public extension HeadlessPlayer {
    /// The current state of Player
    var state: BaseFlowState? {
        guard
            let jsState = jsPlayerReference?.invokeMethod("getState", withArguments: [])
        else { return nil }
        return BaseFlowState.createInstance(value: jsState)
    }

    /**
     Sets up the core javascript player in the given context
     - parameters:
        - context: The context to use for initializing the core player
        - logger: The logger to bind to the javascript logger
     - returns: Reference to the created JS player
     */
    func setupPlayer(context: JSContext, plugins: [NativePlugin] = []) -> JSValue? {
        JSGarbageCollect(context.jsGlobalContextRef)
        JSUtilities.polyfill(context)
        attachExceptionHandler(to: context)
        let trace = JSValue(object: logger.getJSLogFor(level: .trace), in: context)
        let debug = JSValue(object: logger.getJSLogFor(level: .debug), in: context)
        let info = JSValue(object: logger.getJSLogFor(level: .info), in: context)
        let warn = JSValue(object: logger.getJSLogFor(level: .warning), in: context)
        let error = JSValue(object: logger.getJSLogFor(level: .error), in: context)
        for plugin in plugins {
            if let plugin = plugin as? JSBasePlugin {
                plugin.context = context
            }
        }
        return context
            .getClassReference("Player.Player", load: loadCore(into:))?
            .construct(withArguments: [[
                "plugins": plugins.compactMap({$0 as? JSBasePlugin}).map(\.pluginRef),
                "logger": [
                    "trace": trace,
                    "debug": debug,
                    "info": info,
                    "warn": warn,
                    "error": error
                ]
            ]])
    }

    /// Registers a plugin with player after instantiation
    /// Primarily for plugins to be able to add other plugins to player
    /// - Parameter plugin: The plugin to register
    func registerPlugin<P: JSBasePlugin>(_ plugin: P) {
        assert(jsPlayerReference != nil, "Cannot register plugins before setuPlayer(context:plugins:) is called")
        plugin.context = jsPlayerReference?.context
        jsPlayerReference?.invokeMethod("registerPlugin", withArguments: [plugin.pluginRef as Any])
    }

    /**
     Starts Player for the given flow
     - parameters:
        - flow: The JSON Flow
        - completion: A completion handler for when the flow has completed
     */
    func start(flow: String, completion: @escaping (Result<CompletedState, PlayerError>) -> Void) {
        let promiseHandler: @convention(block) (JSValue?) -> Void = { completedState in
            guard
                let result = CompletedState.createInstance(from: completedState)
            else {
                return completion(.failure(PlayerError.jsConversionFailure))
            }
            completion(.success(result))
        }
        let errorHandler: @convention(block) (JSValue?) -> Void = { _ in
            guard
                let result = self.state as? ErrorState
            else {
                return completion(.failure(PlayerError.jsConversionFailure))
            }
            logger.e(result.error)
            completion(.failure(PlayerError.promiseRejected(error: result)))
        }

        // Ensure these get created because otherwise we will never know when the flow ends/errors
        guard
            let context = jsPlayerReference?.context,
            let flowObject = context.evaluateScript("(\(flow))"),
            !flowObject.isUndefined,
            let callback = JSValue(object: promiseHandler, in: context),
            let catchCallback = JSValue(object: errorHandler, in: context)
        else {
            return completion(.failure(PlayerError.jsConversionFailure))
        }

        // Should not be possible due to fatalError in constructor, but just for handling optionals safely
        guard let player = jsPlayerReference else { return completion(.failure(PlayerError.playerNotInstantiated)) }
        player
            .invokeMethod("start", withArguments: [flowObject])
            .invokeMethod("then", withArguments: [callback])
            .invokeMethod("catch", withArguments: [catchCallback])
    }

    /**
     Loads the headless player into the context
     - parameters:
        - context: The context to load the headless player into
     */
    private func loadCore(into context: JSContext) {
        context.loadCore()
    }

    /**
     Attaches an exception handler into the JS environment
     - parameters:
        - context: The context to attach the exception handler to
     */
    private func attachExceptionHandler(to context: JSContext) {
        context.exceptionHandler = { (_: JSContext!, value: JSValue!) in
            let stacktrace = value.objectForKeyedSubscript("stack").toString()
            let moreInfo = "in method \(String(describing: stacktrace))"
            logger.e("JavaScriptCore Exception: \(String(describing: value)) \(moreInfo)")
        }
    }

    func findPlugin<Plugin: WithSymbol>(_ plugin: Plugin.Type) -> JSValue? {
        return jsPlayerReference?
            .invokeMethod("findPlugin", withArguments: [
                jsPlayerReference?.context.getSymbol(plugin.symbol) as Any
            ])
    }

    func applyTo<Plugin: WithSymbol>(_ plugin: Plugin.Type, apply: @escaping (JSValue) -> Void) {
        guard let plugin = findPlugin(plugin) else { return }
        apply(plugin)
    }
}

public protocol WithSymbol {
    static var symbol: String { get }
}

// Needed to reference the resource bundle, can't use a protocol for referencing
internal class ResourceBundleShim {}

internal extension JSContext {
    var coreBundle: URL? {
        #if SWIFT_PACKAGE
        return ResourceUtilities.urlForFile(name: "player.prod", ext: "js", bundle: Bundle.module)
        #else
        return ResourceUtilities.urlForFile(name: "player.prod", ext: "js", bundle: Bundle(for: ResourceBundleShim.self), pathComponent: "PlayerUI.bundle")
        #endif
    }
    /// Loads the core player bundle into the give JSContext
    func loadCore() {
        guard
            let url = coreBundle,
            let jsString = try? String(contentsOf: url, encoding: String.Encoding.utf8)
        else { return }
        evaluateScript(jsString)
    }

    func getSymbol(_ symbolName: String) -> JSValue? {
        guard
            let ref = getClassReference(symbolName, load: {_ in}),
            ref.isSymbol
        else { return nil }
        return ref
    }
    /**
     Gets a reference to a class in the JSContext, loading the resource if it is not found
     - parameters:
        - className: The name of the class to retrieve
        - load: A closure to load the JS related to the class if it hasn't been loaded in this context
     - returns: A reference to the class if it was able to be found
     */
    func getClassReference(_ className: String, load: (JSContext) -> Void) -> JSValue? {
        if objectAtPath(className)?.toObject() == nil {
            load(self)
        }
        return objectAtPath(className)
    }

    func objectAtPath(_ path: String) -> JSValue? {
        var splitPath = path.split(separator: ".")
        var value = objectForKeyedSubscript(splitPath.remove(at: 0))
        for segment in splitPath {
            value = value?.objectForKeyedSubscript(segment)
        }
        return value
    }
}
