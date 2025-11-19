/**
 A declaration of a new Validation
 */
public struct ValidationDeclaration {
    /// The Type to register this validation as
    public let type: String

    /// A function to run for validation, taking parameters (context, value, options)
    public let handler: (Any, Any, [String: Any]) -> Any?

    /**
     Constructs a new validation function
     - parameters:
        - type: The type to register this validation as
        - handler: The function to run as the validation function
     */
    public init(type: String, handler: @escaping (Any, Any, [String: Any]) -> Any?) {
        self.type = type
        self.handler = handler
    }
}
