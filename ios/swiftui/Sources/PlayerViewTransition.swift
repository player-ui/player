import Combine
import SwiftUI

/// Holds information needed for transition animations when a new view in a flow is being shown
public struct PlayerViewTransition: Equatable {
    public static let identity: PlayerViewTransition = .init(
        name: .identity,
        transition: .identity,
        animationCurve: .default
    )

    /// The animation curve to use for the transition
    public var animationCurve: Animation

    private var _transition: Transition

    /// The transition to show the new view with
    public var transition: AnyTransition {
        _transition.transition
    }

    /// Creates a new `PlayerViewTransition`
    /// - parameters:
    ///   - transition: The transition to show the new view with
    ///   - animationCurve: The animation curve to use for the transition
    public init(
        transition: AnyTransition,
        animationCurve: Animation
    ) {
        _transition = .unnamed(transition)
        self.animationCurve = animationCurve
    }

    /// Creates a new `PlayerViewTransition`
    /// - parameters:
    ///   - transition: The transition to show the new view with
    ///   - animationCurve: The animation curve to use for the transition
    public init(
        name: Name,
        transition: AnyTransition,
        animationCurve: Animation
    ) {
        _transition = .named(name, transition)
        self.animationCurve = animationCurve
    }

    /// Name mostly exists as a way to allow testing of transition hooks.
    public struct Name: RawRepresentable {
        public static let identity: Name = .init(rawValue: "identity")

        public let rawValue: String

        public init(rawValue: String) {
            self.rawValue = rawValue
        }
    }

    private enum Transition: Equatable {
        case named(Name, AnyTransition)
        case unnamed(AnyTransition)

        var transition: AnyTransition {
            switch self {
            case let .named(_, transition): transition
            case let .unnamed(transition): transition
            }
        }

        static func == (lhs: Self, rhs: Self) -> Bool {
            switch (lhs, rhs) {
            case let (.named(lName, _), .named(rName, _)): lName == rName
            default: false
            }
        }
    }
}
