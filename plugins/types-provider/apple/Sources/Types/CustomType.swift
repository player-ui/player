/**
 A Custom type to register with Player, with pre-determined validations and formatters
 */
public struct CustomType {
    /// The Type to register this CustomType as
    let type: String

    /**
     Any additional validations that are associated with this property
     These will add to any base validations associated with the "type"
    */
    let validation: [ValidationReference]

    /**
     A reference to a specific data format to use.
     If none is specified, will fallback to that of the base type
    */
    let format: FormatReference?

    /// The referenced object represents an array rather than an object
    let isArray: Bool

    /**
     A default value for this property.
     Any reads for this property will result in this default value being written to the model.
    */
    let defaultValue: Any?

    /**
     Creates a CustomType definition
     - parameters:
        - type: The type to register this as
        - validation: A list of validations to run for this type
        - format: A formatter to run for this type
        - isArray: Whether or not this is an Array type
        - defaultValue: A default value to use for this type if the value is undefined in the data model
     */
    public init(
        type: String,
        validation: [ValidationReference] = [],
        format: FormatReference?,
        isArray: Bool = false,
        defaultValue: Any? = nil
    ) {
        self.type = type
        self.validation = validation
        self.format = format
        self.isArray = isArray
        self.defaultValue = defaultValue
    }
}
