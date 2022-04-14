import JavaScriptCore
/**
 A structure representing the External state
 */
@dynamicMemberLookup
public struct NavigationFlowExternalState {
    /**
     The full state object has some defined properties, but can also have any additional properties that are
     added in the JSON
     */
    private var fullState: [String: Any]

    /// The transitions that are associated with this state
    public var transitions: [String: String]? { fullState["transitions"] as? [String: String] }

    /// A reference for this external state
    public var ref: String? { fullState["ref"] as? String }

    init(from value: JSValue) {
        self.fullState = value.toObject() as? [String: Any] ?? [:]
    }

    /**
     Subscript function to allow fetching any additional properties that the state might have
     - parameters:
        - member: The name of the member to access
     - returns: The member cast to the receiving type if it exists
     */
    public subscript<T>(dynamicMember member: String) -> T? {
        return fullState[member] as? T
    }
}
