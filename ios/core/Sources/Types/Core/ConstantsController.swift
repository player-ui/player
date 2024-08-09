import JavaScriptCore

public class ConstantsController {
    var constantsController: JSValue?

    public func getConstants<T>(key: Any, namespace: String, fallback: Any? = nil) -> T? {
        if let fallbackValue = fallback {
            let value = self.constantsController?.invokeMethod("getConstants", withArguments: [key, namespace, fallbackValue])
            return value?.toString() as? T
        } else {
            let value = self.constantsController?.invokeMethod("getConstants", withArguments: [key, namespace])
            return value?.toString() as? T
        }
    }

    public func addConstants(data: Any, namespace: String) -> Void {
        self.constantsController?.invokeMethod("addConstants", withArguments: [data, namespace])
    }

    public func setTemporaryValues(data: Any, namespace: String) -> Void {
        self.constantsController?.invokeMethod("setTemporaryValues", withArguments: [data, namespace])
    }
    
    public func clearTemporaryValues() -> Void {
        self.constantsController?.invokeMethod("clearTemporaryValues", withArguments: [])
    }

    public init(constantsController: JSValue) {
        self.constantsController = constantsController
    }
}
