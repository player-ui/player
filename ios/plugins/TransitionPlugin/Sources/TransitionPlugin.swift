import Combine
import SwiftUI
import SwiftHooks

/**
 A plugin to supply transition animations for initial flow load and between views in a flow
 */
public class TransitionPlugin: NativePlugin, ManagedPlayerPlugin {
    public var pluginName: String = "TransitionPlugin"

    private let tapId = UUID().uuidString

    private let stateTransition: PlayerViewTransition
    private let pushTransition: PlayerViewTransition
    private let popTransition: PlayerViewTransition

    /**
     Initializes a `TransitionPlugin` with transition information.
    
     - parameters:
        - stateTransition: The transition to use when the loaded state of managed player changes
        - pushTransition:  The transition to use when views are pushed in the same flow
        - popTransition:   The transition to use when views are popped in the same flow
     */
    public init(
        stateTransition: PlayerViewTransition = .fadeInSlideOut,
        pushTransition: PlayerViewTransition = .push,
        popTransition: PlayerViewTransition
    ) {
        self.stateTransition = stateTransition
        self.pushTransition = pushTransition
        self.popTransition = popTransition
    }

    public func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }
        let pushTransition = self.pushTransition
        let popTransition = self.popTransition
        player.hooks?.transition.tapNavigationStack(
            name: pluginName,
            player: player,
            push: pushTransition,
            pop: popTransition
        )
    }

    func apply(_ model: ManagedPlayerViewModel) {
        let stateTransition = self.stateTransition
        model.stateTransition.tap(name: pluginName, id: tapId) { .bail(stateTransition) }
    }
}

private extension SyncBailHook where Parameters == Void, ReturnType == PlayerViewTransition {
    /// Taps a standard navigation stack transition onto the supplied player. This will maintain a list of view
    /// identifiers and apply push/pop transitions based on the navigation stack.
    func tapNavigationStack(name: String, player: SwiftUIPlayer, push: PlayerViewTransition = .push, pop: PlayerViewTransition = .pop) {
        // keep track of the root view ids we navigate through
        var navStack: [String] = (player.assetRegistry.root?.id).map { [$0] } ?? []

        // updates the navigation stack and returns a transtion appropriate for
        // the push/pop/none operation that is occurring
        func updateNavStack(_ currentId: String?) -> PlayerViewTransition {
            // if there's no id currently clear the stack and return a pop
            guard let id = currentId else {
                navStack = []
                return pop
            }

            // if the current id is the last element in the nav stack nothing is happening
            guard id != navStack.last else { return .identity }

            // if the current id is somewhere in the navigation stack we'll pop
            // to that location, otherwise we will push the current id onto the stack
            guard let existing = navStack.firstIndex(of: id) else {
                navStack.append(id)
                return push
            }
            navStack = Array(navStack[0 ... existing])
            return pop
        }

        tap(name: name) {
            .bail(updateNavStack(player.assetRegistry.root?.id))
        }
    }
}

public extension PlayerViewTransition {
    /// Transition that slides views in from the trailing edge and out from to the leading edge of the screen
    static let slideInSlideOut: PlayerViewTransition = push

    /// Transition that slides views in from the trailing edge and fades out views on removal
    static let slideInFadeOut: PlayerViewTransition = .init(
        name: .slideInFadeOut,
        transition: .asymmetric(insertion: .move(edge: .trailing), removal: .opacity),
        animationCurve: .inoutDefault
    )

    /// Transition that fades views in and slides out to the leading edge of the screen on removal
    static let fadeInSlideOut = PlayerViewTransition(
        name: .fadeInSlideOut,
        transition: .asymmetric(insertion: .opacity, removal: .move(edge: .leading)),
        animationCurve: .inoutDefault
    )

    /// A standard navigation push transition
    static let push = PlayerViewTransition(name: .push, transition: .push, animationCurve: .inoutDefault)

    /// A standard navigation pop transition
    static let pop = PlayerViewTransition(name: .pop, transition: .pop, animationCurve: .inoutDefault)
}

public extension PlayerViewTransition.Name {
    static let slideInFadeOut = Self(rawValue: "slideInFadeOut")
    static let fadeInSlideOut = Self(rawValue: "fadeInSlideOut")
    static let push = Self(rawValue: "push")
    static let pop = Self(rawValue: "pop")
}

private extension Animation {
    static let inoutDefault = Animation.easeInOut(duration: 0.3)
}

extension AnyTransition {
    static let push = AnyTransition.asymmetric(
        insertion: .move(edge: .trailing),
        removal: .move(edge: .leading)
    )
    static let pop  = AnyTransition.asymmetric(
        insertion: .move(edge: .leading),
        removal: .move(edge: .trailing)
    )
}
