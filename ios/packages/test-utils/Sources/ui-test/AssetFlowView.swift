//
//  AssetFlowView.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/15/21.
//

import SwiftUI

/**
 SwiftUI View to wrap the `SwiftUIPlayer` in a scroll view and handle the result
 for use in UI testing
 */
public struct AssetFlowView: View {
    let flow: String
    let plugins: [NativePlugin]
    let completion: ((Result<CompletedState, PlayerError>) -> Void)?

    public init(flow: String, plugins: [NativePlugin], completion: ((Result<CompletedState, PlayerError>) -> Void)? = nil) {
        self.flow = flow
        self.plugins = plugins
        self.completion = completion
        for plugin in self.plugins {
            if let plugin = plugin as? JSBasePlugin {
                plugin.context = nil
            }
        }
    }

    public var body: some View {
        if #available(iOS 14, *) {
            body14
        } else {
            body13
        }
    }

    internal var body14: some View {
        // on iOS 14 wrapping the scroll view in a geometry reader causes
        // body to be called when the keyboard appears/disappears, which
        // causes our model to be recreated, effectively clearing all inputs
        // the scroll view layout issues on 13 don't exist here anyway...
        ScrollView {
            player.frame(maxWidth: .infinity, alignment: .topLeading)
        }
    }

    internal var body13: some View {
        Body13(player: player)
    }

    // on iOS 13 changing the size of content in the scroll view
    // causes layout issues, the geometry reader is used to pull the current
    // height of Player content and latch it onto the `minHeight` state
    // which in turn is applied as a minimum frame height
    internal struct Body13<Player>: View where Player: View {
        @State private var minHeight: CGFloat = 0
        let player: Player

        var body: some View {
            GeometryReader { proxy in
                ScrollView {
                    player
                        .anchorHeight(proxy)
                        .frame(maxWidth: .infinity, minHeight: minHeight, alignment: .topLeading)
                }
                .onHeightChange { (height) in
                    withAnimation {
                        minHeight = height
                    }
                }
            }
        }
    }

    /// The SwiftUI player for this view
    private var player: some View {
        SwiftUIPlayer(
            flow: flow,
            plugins: plugins,
            result: Binding(
                get: {nil},
                set: { result in
                    guard let res = result else { return }
                    self.completion?(res)
                }
            )
        )
    }
}

private extension View {
    /// Establishes a preference for the height of the view based on the anchor bounds.
    func anchorHeight(_ proxy: GeometryProxy) -> some View {
        anchorPreference(key: ScrollHeightPreferenceKey.self, value: .bounds, transform: { (anchor) in
            proxy[anchor].height
        })
    }

    /// Performs the supplied block whenever the height preference (established with `anchorHeight`)
    /// changes.
    func onHeightChange(perform: @escaping (CGFloat) -> Void) -> some View {
        onPreferenceChange(ScrollHeightPreferenceKey.self, perform: perform)
    }
}

/// Preference key used on iOS 13 for measuring scroll content height.
private struct ScrollHeightPreferenceKey: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}
