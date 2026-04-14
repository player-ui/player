import JavaScriptCore
import SwiftUI

import PlayerUI
import PlayerUISwiftUI
import PlayerUIExternalStatePlugin

public struct ExternalStateViewModifierHandler {
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
    public typealias Function = (
        NavigationFlowExternalState,
        PlayerControllers,
        @escaping (String) -> Void
    ) throws -> AnyView

    public let ref: String
    public let match: Match?
    public let handlerFunction: Function

    public init(ref: String, match: Match? = nil, handlerFunction: @escaping Function) {
        self.ref = ref
        self.match = match
        self.handlerFunction = handlerFunction
    }
}

/**
 A variation on `ExternalStatePlugin` for `SwiftUIPlayer` that applies a ViewModifier to
 SwiftUIPlayer content when in an external state
 */
open class ExternalStateViewModifierPlugin<ModifierType: ExternalStateViewModifier>:
    JSBasePlugin, NativePlugin, ObservableObject {

    /// Whether or not Player is currently in an EXTERNAL state
    @Published public var isExternalState = false
    /// The content the plugin has determined to show during the current EXTERNAL state
    @Published public var content: AnyView?
    /// The current state if player is in an EXTERNAL state
    @Published public var state: NavigationFlowExternalState?

    private var handlers: [ExternalStateViewModifierHandler]

    /**
     Construct a plugin to handle external states
     - parameters:
        - handlers: array of handlers with matchers and handler functions
     */
    public init(handlers: [ExternalStateViewModifierHandler]) {
        self.handlers = handlers
        super.init(
            fileName: "ExternalStatePlugin.native",
            pluginName: "ExternalStatePlugin.ExternalStatePlugin"
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
                    self?.isExternalState = false
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

        let jsHandlers = handlers.map { handler -> JSValue? in
            let callback: @convention(block) (JSValue, JSValue) -> JSValue? = { [weak self] (state, options) in
                guard
                    let context = self?.context,
                    let controllers = PlayerControllers(from: options),
                    let promise = JSUtilities.createPromise(context: context, handler: { (resolve, reject) in
                        let updateUI: () -> Void = {
                            self?.isExternalState = true
                            let state = NavigationFlowExternalState(state)
                            self?.state = state
                            do {
                                self?.content = try handler.handlerFunction(state, controllers) { transition in
                                    resolve(transition)
                                    let resetWithAnimation: () -> Void = {
                                        withAnimation {
                                            self?.resetState()
                                        }
                                    }
                                    if Thread.isMainThread {
                                        resetWithAnimation()
                                    } else {
                                        DispatchQueue.main.sync { resetWithAnimation() }
                                    }
                                }
                            } catch {
                                // Reset state when handler throws
                                self?.resetState()
                                reject(JSValue(newErrorFromMessage: error.playerDescription, in: context) as Any)
                            }
                        }

                        if Thread.isMainThread {
                            updateUI()
                        } else {
                            DispatchQueue.main.sync(execute: updateUI)
                        }
                    })
                else { return nil }
                return promise
            }

            return JSValue(object: [
                "ref": handler.ref,
                "match": handler.match,
                "handlerFunction": JSValue(object: callback, in: context) as Any
            ], in: context)
        }

        return [jsHandlers]
    }

    private func resetState() {
        isExternalState = false
        state = nil
        content = nil
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(
            name: fileName, ext: "js",
            bundle: ExternalStatePlugin.bundle
        )
    }
}

/**
 ViewModifier type specifically for the `ExternalStateViewModifierPlugin` to provide observable properties
 to present content in an external action
 */
public protocol ExternalStateViewModifier: ViewModifier {
    /// An observable reference to the presenting plugin, to know when we are in an external state
    var plugin: ExternalStateViewModifierPlugin<Self> { get }

    /**
     Creates a new `ExternalStateViewModifier` with the plugin that is presenting it
     - parameters:
        - plugin: The plugin presenting this view modifier
     */
    init(plugin: ExternalStateViewModifierPlugin<Self>)
}

/**
 A ViewModifier for the `ExternalStateViewModifierPlugin` that presents the external state with the `.sheet` modifier
 */
public struct ExternalStateSheetModifier: ExternalStateViewModifier {
    @ObservedObject public var plugin: ExternalStateViewModifierPlugin<Self>
    /**
     Constructs this ViewModifier
     - parameters:
        - plugin: The plugin presenting the external state
     */
    public init(plugin: ExternalStateViewModifierPlugin<Self>) {
        self.plugin = plugin
    }
    @ViewBuilder
    public func body(content: Content) -> some View {
        content.inspectableSheet(isPresented: $plugin.isExternalState, content: {
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
