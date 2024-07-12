/**
 A reference to a validation, to associate with a type
 */
public struct ValidationReference {
    /**
     The name of the referenced validation type
     This will be used to lookup the proper handler
    */
    public let type: String

    /// An optional means of overriding the default message if the validation is triggered
    public let message: String?

    /// An optional means of overriding the default severity of the validation if triggered
    public let severity: String?

    /// When to run this particular validation
    public let trigger: String?

    /// Additional props to send down to a Validator
    public let options: [String: Any]?

    /**
     Construct a ValidationReference object, used for referencing a validation in a `CustomType`
     - parameters:
        - type: The type of validation
        - message: An optional message to use for the validation
        - severity: An optional severity to use for this validation
        - trigger: An optional trigger for the validation
        - options: Additional options passed to the validation function
     */
    public init(
        type: String,
        message: String? = nil,
        severity: String? = nil,
        trigger: String? = nil,
        options: [String: Any]? = nil
    ) {
        self.type = type
        self.message = message
        self.severity = severity
        self.trigger = trigger
        self.options = options
    }
}
