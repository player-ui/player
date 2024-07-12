/**
 A reference to a format to associate with a type
 */
public struct FormatReference {
    /// The name of the formatter (and de-formatter) to use
    public let type: String

    /// Any additional properties will be passed as options to the formatter function
    public let options: [String: Any]

    /**
     Construct a FormatReference object. Used for referencing a formatter in a `CustomType`
     - parameters:
        - type: The format type
        - options: Additional options to pass to the formatter
     */
    public init(type: String, options: [String: Any]? = nil) {
        self.type = type
        self.options = options ?? [:]
    }
}
