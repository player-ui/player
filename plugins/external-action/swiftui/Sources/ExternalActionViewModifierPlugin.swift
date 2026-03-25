import JavaScriptCore
import SwiftUI

import PlayerUI
import PlayerUISwiftUI
import PlayerUIExternalActionPlugin

public struct ExternalActionViewModifierHandler {
    /// Map of properties to match against external states.
    /// Must include "ref" key.
    public typealias Match = [String: Any]

    /**
     The handler function to run when an external state is transitioned to
     - parameters:
        - state: The state object that represents the external state
        - options: An object containing the dataModel instance and evaluate function
        - transition: A completion handler that takes a string to transition with
     - returns: A view to show as content by the ViewModifier
     */
    public typealias Handler = (
        NavigationFlowExternalState,
        PlayerControllers,
        @escaping (String) -> Void
    ) throws -> AnyView

    public let match: Match
    public let handler: Handler

    public init(match: Match, handler: @escaping Handler) {
        self.match = match
        self.handler = handler
    }
}

/**
 A variation on `ExternalActionPlugin` for `SwiftUIPlayer` that applies a ViewModifier to
 SwiftUIPlayer content when in an external state
 */
open class ExternalActionViewModifierPlugin<ModifierType: ExternalActionViewModifier>:
    JSBasePlugin, NativePlugin, ObservableObject {

    /// Whether or not Player is currently in an EXTERNAL state
    @Published public var isExternalAction = false
    /// The content the plugin has determined to show during the current EXTERNAL state
    @Published public var content: AnyView?
    /// The current state if player is in an EXTERNAL state
    @Published public var state: NavigationFlowExternalState?

    private var handlers: [ExternalActionViewModifierHandler]

    /**
     Construct a plugin to handle external states
     - parameters:
        - handlers: array of handlers with matchers and handler functions
     */
    public init(handlers: [ExternalActionViewModifierHandler]) throws {
        try handlers.forEach { handler in
            let match = handler.match
            if match["ref"] == nil {
                throw ExternalActionPluginError.matchMissingRef(match: match)
            }
        }
        self.handlers = handlers
        super.init(
            fileName: "ExternalActionPlugin.native",
            pluginName: "ExternalActionPlugin.ExternalActionPlugin"
        )
    }

    open func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }
        player.hooks?.view.tap(name: pluginName, { (view) -> AnyView in
            return AnyView(view.modifier(ModifierType.init(plugin: self)))
        })

        // If the state changes without our intervention
        // we should update our state
        player.hooks?.flowController.tap({ flowController in
            flowController.hooks.flow.tap { flow in
                flow.hooks.transition.tap {[weak self] old, newState in
                    guard
                        old?.value?.stateType == "EXTERNAL",
                        newState.value?.stateType != "EXTERNAL"
                    else { return }
                    self?.isExternalAction = false
                    self?.state = nil
                }
            }
        })
    }

    /**
     Retrieves the arguments for constructing this plugin.
     This is necessary because the arguments need to be supplied after construction of the swift object,
     once the context has been provided.
     - returns: An array of arguments to construct the plugin
     */
    override open func getArguments() -> [Any] {
        guard let context = context else { return [] }

        // Convert handlers to array of tuples [match, callback]
        let jsHandlers = handlers.map { handler in
            let callback: @convention(block) (JSValue, JSValue) -> JSValue? = { [weak self] (state, options) in
                guard
                    let context = self?.context,
                    let controllers = PlayerControllers(from: options),
                    let promise = JSUtilities.createPromise(context: context, handler: { (resolve, reject) in
                        Task { @MainActor in
                            self?.isExternalAction = true
                            let state = NavigationFlowExternalState(state)
                            self?.state = state
                            do {
                                self?.content = try handler.handler(state, controllers) { transition in
                                    resolve(transition)
                                    withAnimation {
                                        self?.isExternalAction = false
                                        self?.state = nil
                                    }
                                    self?.content = nil
                                }
                            } catch {
                                // Reset state when handler throws
                                self?.isExternalAction = false
                                self?.state = nil
                                self?.content = nil
                                reject(JSValue(newErrorFromMessage: error.playerDescription, in: context) as Any)
                            }
                        }
                    })
                else { return nil }
                return promise
            }

            let jsMatch = JSValue(object: handler.match, in: context)
            let jsCallback = JSValue(object: callback, in: context)
            return [jsMatch, jsCallback]
        }

        return [jsHandlers]
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(
            name: fileName, ext: "js",
            bundle: ExternalActionPlugin.bundle
        )
    }
}

/**
 ViewModifier type specifically for the `ExternalActionViewModifierPlugin` to provide observable properties
 to present content in an external action
 */
public protocol ExternalActionViewModifier: ViewModifier {
    /// An observable reference to the presenting plugin, to know when we are in an external state
    var plugin: ExternalActionViewModifierPlugin<Self> { get }

    /**
     Creates a new `ExternalActionViewModifier` with the plugin that is presenting it
     - parameters:
        - plugin: The plugin presenting this view modifier
     */
    init(plugin: ExternalActionViewModifierPlugin<Self>)
}

/**
 A ViewModifier for the `ExternalActionViewModifierPlugin` that presents the external state with the `.sheet` modifier
 */
public struct ExternalActionSheetModifier: ExternalActionViewModifier {
    @ObservedObject public var plugin: ExternalActionViewModifierPlugin<Self>
    /**
     Constructs this ViewModifier
     - parameters:
        - plugin: The plugin presenting the external state
     */
    public init(plugin: ExternalActionViewModifierPlugin<Self>) {
        self.plugin = plugin
    }
    @ViewBuilder
    public func body(content: Content) -> some View {
        content.inspectableSheet(isPresented: $plugin.isExternalAction, content: {
            plugin.content
        })
    }
}

// MARK: ViewInspector
extension View {
    func inspectableSheet<Sheet>(
        isPresented: Binding<Bool>,
        onDismiss: (() -> Void)? = nil,
        @ViewBuilder content: @escaping () -> Sheet
    ) -> some View where Sheet: View {
        return self.modifier(
            InspectableSheet(isPresented: isPresented, onDismiss: onDismiss, popupBuilder: content)
        )
    }
}

struct InspectableSheet<Sheet>: ViewModifier where Sheet: View {

    let isPresented: Binding<Bool>
    let onDismiss: (() -> Void)?
    let popupBuilder: () -> Sheet

    func body(content: Self.Content) -> some View {
        content.sheet(isPresented: isPresented, onDismiss: onDismiss, content: popupBuilder)
    }
}
