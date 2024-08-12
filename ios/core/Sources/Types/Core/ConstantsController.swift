import JavaScriptCore

public class ConstantsController {
    var constantsController: JSValue?
    
    /// Function to retrieve constants from the providers store
    /// - Parameters:
    ///   - key: Key used for the store access
    ///   - namespace: Namespace values were loaded under
    ///   - fallback:Optional - if key doesn't exist in namespace what to return (will return unknown if not provided)
    /// - Returns: Constant values from store
    public func getConstants<T>(key: Any, namespace: String, fallback: Any? = nil) -> T? {
        if let fallbackValue = fallback {
            let value = self.constantsController?.invokeMethod("getConstants", withArguments: [key, namespace, fallbackValue])
            return value?.toObject() as? T
        } else {
            let value = self.constantsController?.invokeMethod("getConstants", withArguments: [key, namespace])
            return value?.toObject() as? T
        }
    }
    
    /// Function to add constants to the providers store
    /// - Parameters:
    ///   - data: Values to add to the constants store
    ///   - namespace: Namespace values to be added under
    public func addConstants(data: Any, namespace: String) -> Void {
        self.constantsController?.invokeMethod("addConstants", withArguments: [data, namespace])
    }
    
    /// Function to set values to temporarily override certain keys in the perminant store
    /// - Parameters:
    ///   - data: Values to override store with
    ///   - namespace: Namespace to override
    public func setTemporaryValues(data: Any, namespace: String) -> Void {
        self.constantsController?.invokeMethod("setTemporaryValues", withArguments: [data, namespace])
    }
    
    /// Clears any temporary values that were previously set
    public func clearTemporaryValues() -> Void {
        self.constantsController?.invokeMethod("clearTemporaryValues", withArguments: [])
    }

    public init(constantsController: JSValue) {
        self.constantsController = constantsController
    }
}
