/**
 A declaration of a new formatter
 This can have format and deformat, or either
 */
public struct FormatDeclaration {
    /**
     The name of the formatter.
     This corresponds to the 'type' format property when creating a DataType
    */
    public let name: String
    /**
     An optional function to format data for display to the user.
     This goes from dataModel -> UI display
    */
    public let format: ((Any, [String: Any]) -> Any)?
    /**
     An optional function for undo the action of a format function for storage.
     This goes from UI -> dataModel
    */
    public let deformat: ((Any, [String: Any]) -> Any)?

    /**
     Constructs a new formatter/deformatter
     - parameters:
        - name: The name of the formatter
        - format: A function to run for formatting
        - deformat: A function to run for deformatting
     */
    public init(
        name: String,
        format: ((Any, [String: Any]) -> Any)? = nil,
        deformat: ((Any, [String: Any]) -> Any)? = nil
    ) {
        self.name = name
        self.format = format
        self.deformat = deformat
    }
}
