import Foundation

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Typed view of the aggregated `player.state` context entry. Read it with
/// `contextPlugin.get(name: "player.state", as: PlayerStateContext.self)`.
///
/// Actions are scoped to the construct they operate on — `flow.transition` and
/// `data.set` — and are nil until a flow is in-progress.
public struct PlayerStateContext: Decodable {
    public let status: String?
    public let flow: Flow
    public let view: View
    public let data: Data
    public let validation: Validation

    public struct Flow: Decodable {
        public let id: String?
        public let state: String?
        /// Transition the running flow using the given transition value (e.g. "Next").
        public let transition: WrappedFunction<Void>?
    }

    public struct View: Decodable {
        public let id: String?
        public let resolved: AnyType?
    }

    public struct Data: Decodable {
        /// Full data model tree for the running flow.
        public let model: AnyType?
        /// Set a value in the data model at the given binding.
        public let set: WrappedFunction<Void>?
    }

    /// Validation state for the running view, keyed by binding.
    public struct Validation: Decodable {
        /// Whether the view has no blocking validations.
        public let canTransition: Bool
        /// Active validations per binding string.
        public let byBinding: [String: [ContextValidation]]

        public struct ContextValidation: Decodable {
            public let severity: String
            public let message: String
            public let displayTarget: String?
            /// `true`/`false` or the string `"once"`.
            public let blocking: AnyType?
        }
    }
}
