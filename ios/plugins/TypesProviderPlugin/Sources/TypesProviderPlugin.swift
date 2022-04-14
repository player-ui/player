//
//  TypesProviderPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 6/24/20.
//

import Foundation
import JavaScriptCore

/**
 Plugin for registering custom types Player
 */
public class TypesProviderPlugin: JSBasePlugin, NativePlugin {
    /// The types to register
    private var types: [CustomType] = []

    /// The validations to register
    private var validators: [ValidationDeclaration] = []

    /// The formatters to register
    private var formats: [FormatDeclaration] = []

    /**
     Constructs the TypesProviderPlugin
     - parameters:
        - types: The new Types to register, these can reference existing, or new custom validators/formatters
        - validators: The new validation functions to register
        - formats: The new formatters/deformatters to register
     */
    public convenience init(types: [CustomType], validators: [ValidationDeclaration], formats: [FormatDeclaration]) {
        self.init(
            fileName: "types-provider-plugin.prod",
            pluginName: "TypesProviderPlugin.TypesProviderPlugin"
        )
        self.types = types
        self.validators = validators
        self.formats = formats
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: TypesProviderPlugin.self), pathComponent: "TypesProviderPlugin.bundle")
    }

    /**
     Gets the arguments for constructing the JS plugin
     - returns: An array of arguments for construction
     */
    override public func getArguments() -> [Any] {
        let constructionObj: [String: Any] = [
            "types": self.types.map(typeToJs(_:)),
            "formats": self.formats.compactMap(formatToJs(_:)),
            "validators": self.validators.compactMap(validatorToJs(_:))
        ]
        return [constructionObj]
    }

    /**
     Converts a CustomType to the appropriate dictionary format to pass to the JS plugin
     - parameters:
        - type: The CustomType to convert
     - returns: A formatted dictionary
     */
    public func typeToJs(_ type: CustomType) -> [String: Any] {
        var typeObj: [String: Any] = [
            "type": type.type,
            "validation": type.validation.map(valRefToDict(_:)),
            "format": formatRefToDict(type.format),
            "isArray": type.isArray
        ]
        if let def = type.defaultValue {
            typeObj["defaultValue"] = def
        }
        return typeObj
    }

    /**
     Converts a FormatReference to the appropriate dicionary format to pass to the JS plugin
     - parameters:
        - ref: The FormatReference to convert
     - returns: A formatted dictionary
     */
    public func formatRefToDict(_ ref: FormatReference?) -> [String: Any] {
        guard let ref = ref else { return [:] }
        return ref.options.merging([
            "type": ref.type
        ], uniquingKeysWith: {$1})
    }

    /**
    Converts a ValidationReference to the appropriate dicionary format to pass to the JS plugin
    - parameters:
       - ref: The ValidationReference to convert
    - returns: A formatted dictionary
    */
    public func valRefToDict(_ ref: ValidationReference) -> [String: Any] {
        var valRef = (ref.options ?? [:])
        valRef["type"] = ref.type
        if let message = ref.message {
            valRef["message"] = message
        }
        if let severity = ref.severity {
            valRef["severity"] = severity
        }
        if let trigger = ref.trigger {
            valRef["trigger"] = trigger
        }
        return valRef
    }

    /**
     Converts a ValidationDeclaration to a JSValue with the handler bound into a callable JS Block
     - parameters:
        - dec: The ValidationDeclaration to convert
     - returns: JSValue representing an array with the type at index 0, and the handler function at index 1
     */
    public func validatorToJs(_ dec: ValidationDeclaration) -> JSValue? {
        let arr = JSValue(newArrayIn: context)
        arr?.setObject(dec.type, atIndexedSubscript: 0)
        let callback: @convention(block) (JSValue, JSValue, JSValue) -> JSValue? = { (context, value, options) in
            let castedOptions = options.toObject() as? [String: Any] ?? [:]
            return JSValue(
                object: dec.handler(context.toObject() as Any, value.toObject() as Any, castedOptions),
                in: self.context
            )
        }
        arr?.setObject(callback, atIndexedSubscript: 1)
        return arr
    }

    /**
    Converts a FormatDeclaration to a JSValue with format/deformat bound into a callable JS Blocks
    - parameters:
       - dec: The FormatDeclaration to convert
    - returns: JSValue representing an object with a name, format, and deformat properties
    */
    public func formatToJs(_ dec: FormatDeclaration) -> JSValue? {
        let val = JSValue(newObjectIn: context)
        val?.setValue(dec.name, forProperty: "name")
        if let format = dec.format {
            let callback: @convention(block) (JSValue, JSValue) -> JSValue? = { (value, options) in
                let castedOptions = options.toObject() as? [String: Any] ?? [:]
                return JSValue(object: format(value.toObject() as Any, castedOptions), in: self.context)
            }
            val?.setObject(callback, forKeyedSubscript: "format")
        }
        if let deformat = dec.deformat {
            let callback: @convention(block) (JSValue, JSValue) -> JSValue? = { (value, options) in
                let castedOptions = options.toObject() as? [String: Any] ?? [:]
                return JSValue(object: deformat(value.toObject() as Any, castedOptions), in: self.context)
            }
            val?.setObject(callback, forKeyedSubscript: "deformat")
        }
        return val
    }
}
