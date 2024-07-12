//
//  AssetRegistry.swift
//
//
//  Created by Borawski, Harris on 2/13/20.
//

import Foundation
import JavaScriptCore
#if SWIFT_PACKAGE
import PlayerUILogger
#endif

/**
 Represents the different errors that occur when decoding
 */
public enum DecodingError: Error {
    /// Unable to decode a base asset, does not contain keys: `id` and `type`
    case baseAssetNotDecodable

    /// The provided type was not registered with the AssetRegistry
    case typeNotRegistered(type: String)

    /// The type was registered with the AssetRegistry, but the provided value could not decode to it
    case typeNotDecodable(type: String)

    /// The decoder being used was not an AssetDecoder
    case decoderNotAnAssetDecoder

    /// More than one asset is using the attached identifier
    case duplicateIdentifier(String)

    /// Update from core player was not convertible
    case malformedData
}

/**
 A registry of assets used to decode the view tree returned by Player
 */
open class BaseAssetRegistry<WrapperType>: PlayerRegistry where
    WrapperType: Decodable,
    WrapperType: AssetContainer,
    WrapperType.AssetType: Decodable {

    /// A type representing an entry in the registry
    public typealias RegistryEntry = (assetType: AssetType.Type, match: [String: Any])

    /// A read-only look at the types of assets that are registered
    public var registeredAssets: [AssetType.Type] {
        return registry.map({ $0.0 })
    }

    /// The registry plugin that wraps the partial-match-registry
    public var partialMatchRegistry: PartialMatchFingerprintPlugin? {
        didSet {
            registerWithPlugin()
        }
    }

    /// Logger instance from the attached player
    public var logger: TapableLogger? {
        didSet { decoder.setLogger(logger) }
    }

    /// The registered assets, and the objects they match with
    private var registry: [RegistryEntry] = [] {
        didSet {
            registerWithPlugin()
        }
    }

    public let decoder = JSONDecoder()

    /**
     Initializes an empty registry
     - parameters:
        - logger: A `TapableLogger` instance to log with
     */
    public init(logger: TapableLogger? = nil) {
        self.logger = logger
        decoder.setDecodeAssetFunction(decodeFunction(_:))
        decoder.setLogger(logger)
    }

    /**
     Register an asset to decode a type, this is converted to ["type": <type>]
     - parameters:
        - type: The string type the asset should decode
        - asset: The swift type representing the asset
     */
    public func register(_ type: String, asset: WrapperType.AssetType.Type) {
        self.register(["type": type], for: asset)
    }

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
    public func register(_ match: [String: Any], for asset: WrapperType.AssetType.Type) {
        if let index = registry.firstIndex(where: { matched in
            return NSDictionary(dictionary: match).isEqual(to: matched.match)
        }) {
            if asset == registry[index].assetType {
                self.logger?.t("Duplicate Registration skipped for \(String(describing: match)) asset: \(String(describing: asset))")
            } else {
                self.logger?.w("Overriding registration for match: \(String(describing: match))")
                registry[index] = (assetType: asset, match: match)
            }
        } else {
            registry.append((assetType: asset, match: match))
        }
    }

    /**
     Helper function to register or reregister all assets with the partial match registry
     */
    private func registerWithPlugin() {
        for (index, entry) in registry.enumerated() {
            partialMatchRegistry?.register(match: entry.match, index: index)
        }
    }

    /**
     Retrieves an asset type from the partial match registry based on the ID
     - parameters:
        - id: The ID of the asset to get the type for
     - returns: The type to decode as
     */
    private func getAssetType(id: String) -> WrapperType.AssetType.Type? {
        guard let index = partialMatchRegistry?.get(assetId: id) else { return nil }
        return registry[index].assetType
    }

    // MARK: Decoding

    private func decodeFunction(_ decoder: Decoder) throws -> WrapperType.AssetType {
        let typeCheck = try decoder.singleValueContainer().decode(TypeCheck.self)
        guard let type = getAssetType(id: typeCheck.id) else {
            throw DecodingError.typeNotRegistered(type: typeCheck.type ?? "nil")
        }
        return try decoder.singleValueContainer().decode(type)
    }

    /// This is used by `decodeFunction` to pickup an `id` to pass to the partial match registry.
    private struct TypeCheck: Decodable {
        let id: String
        let type: String?
    }

    /**
     Decodes a JSValue into an Asset
     - parameters:
        - value: The JSValue representing an asset
     - returns: A decoded Asset
     */
    public func decode(_ value: JSValue) throws -> WrapperType.AssetType {
        assert(Thread.isMainThread, "decoder must be accessed from main")
        typealias Shim = RegistryDecodeShim<WrapperType.AssetType>
        return try decoder.decode(Shim.self, from: value).asset
    }

    /**
     Decodes a JSValue into an AssetWrapper
     - parameters:
        - value: The JSValue representing an asset
     - returns: A decoded Asset
     */
    public func decodeWrapper(_ value: JSValue) throws -> WrapperType {
        assert(Thread.isMainThread, "decoder must be accessed from main")
        return try decoder.decode(WrapperType.self, from: value)
    }
}

public struct RegistryDecodeShim<Asset>: Decodable {
    public let asset: Asset

    public init(from decoder: Decoder) throws {
        let decodeFunction: DecodeAssetFunction<Asset> = try decoder.getDecodeAssetFunction()
        asset = try decodeFunction(decoder)
    }
}

extension JSValue {
    var jsonDisplayString: String {
        do {
            return try String(data: jsonData(pretty: true), encoding: .utf8) ?? "notuf8"
        } catch {
            return error.localizedDescription
        }
    }

    /// Returns the contents of this value encoded into UTF-8 string data. Throws DecodingError.malformedData
    /// if this value can't be transformed.
    func jsonData(pretty: Bool = false) throws -> Data {
        guard
            let json = context?.objectForKeyedSubscript("JSON"),
            !json.isUndefined,
            !json.isNull,
            // replace functions with placeholders, since we retrieve the value in WrappedFunction
            // with the coding path
            let replacer = context?.evaluateScript("(key, value) => (typeof value === 'function' ? {} : value)"),
            let output = json.invokeMethod(
                "stringify",
                withArguments: [
                    self,
                    replacer as Any,
                    (
                        pretty ? 2 : nil
                    ) as Any
                ]
            ),
            !output.isUndefined,
            !output.isNull,
            let data = output.toString().data(using: .utf8)
        else {
            throw DecodingError.malformedData
        }
        return data
    }
}

// MARK: Decoder Extension
public extension Decoder {
    /// A `CodingUserInfoKey` to fetch the decoding function for this decoder
    var decodeFunctionKey: CodingUserInfoKey { CodingUserInfoKey(rawValue: "decodeFunction")! }
}

/// A function that decodes an `Asset`
typealias DecodeAssetFunction<Asset> = ((Decoder) throws -> Asset)

extension Decoder {
    /// A logger that can be used to track useful decoding details
    public var logger: TapableLogger? { userInfo[.logger] as? TapableLogger }

    /**
     Retrieves a `DecodeAssetFunction<Asset>` if the decoder has one
     - returns: A `DecodeSwiftUIFunction`
     */
    func getDecodeAssetFunction<Asset>() throws -> DecodeAssetFunction<Asset> {
        guard let decodeFunction = userInfo[.decodeSUI] as? DecodeAssetFunction<Asset> else {
            throw DecodingError.decoderNotAnAssetDecoder
        }
        return decodeFunction
    }

    /// Returns the JSValue found at the current coding path, or throws an error if decoding was not started
    /// with `JSONDecoder.decoder(_:from:)` provided a `JSValue` value.
    public func getJSValue() throws -> JSValue {
        guard let rootJS = userInfo[.rootJS] as? JSValue else {
            throw DecodingError.decoderNotAnAssetDecoder
        }
        // start at the rootJS value and look up the subscript for each coding
        // path, this will return the JSValue associated with the currently
        // decoding data
        return codingPath.reduce(rootJS) { jsValue, path in
            guard let index = path.intValue else {
                return jsValue.objectForKeyedSubscript(path.stringValue)
            }
            return jsValue.objectAtIndexedSubscript(index)
        }
    }
}

extension JSONDecoder {
    /// Attempts to decode an object of type T from the JSON data found in value.
    /// During decoding calls to `decoder.getJSValue()` will return the object subscripted in value
    /// at the current coding path. A decode function might use this to update RawValueBacked entities.
    public func decode<T>(_ type: T.Type, from value: JSValue) throws -> T where T: Decodable {
        setRootJS(value)
        defer { setRootJS(nil) }

        logger?.t("Decoding: \(value.jsonDisplayString)")
        return try decode(T.self, from: value.jsonData())
    }

    func setDecodeAssetFunction<Asset>(_ function: @escaping DecodeAssetFunction<Asset>) {
        userInfo[.decodeSUI] = function
    }

    private func setRootJS(_ value: JSValue?) {
        userInfo[.rootJS] = value
    }

    /// A logger that can be used to track useful decoding details
    var logger: TapableLogger? { userInfo[.logger] as? TapableLogger }

    func setLogger(_ logger: TapableLogger?) {
        userInfo[.logger] = logger
    }
}

private extension CodingUserInfoKey {
    static let decodeSUI: CodingUserInfoKey! = CodingUserInfoKey(rawValue: "decodeFunction")
    static let rootJS: CodingUserInfoKey! = CodingUserInfoKey(rawValue: "rootJS")
    static let logger: CodingUserInfoKey! = CodingUserInfoKey(rawValue: "logger")
}
