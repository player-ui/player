//
//  AssetFlowView.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/15/21.
//

import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/**
 SwiftUI View to wrap the `SwiftUIPlayer` in a scroll view and handle the result
 for use in UI testing
 */
public struct AssetFlowView: View {
    let flow: String
    let plugins: [NativePlugin]
    let result: Binding<Result<CompletedState, PlayerError>?>

    public init(flow: String, plugins: [NativePlugin], result: Binding<Result<CompletedState, PlayerError>?>) {
        self.flow = flow
        self.plugins = plugins
        self.result = result
        for plugin in self.plugins {
            if let plugin = plugin as? JSBasePlugin {
                plugin.context = nil
            }
        }
    }

    public init(flow: String, plugins: [NativePlugin], completion: ((Result<CompletedState, PlayerError>) -> Void)? = nil) {
        self.init(
            flow: flow,
            plugins: plugins,
            result: Binding(
                get: {nil},
                set: { result in
                    guard let res = result else { return }
                    completion?(res)
                }
            )
        )
    }

    public var body: some View {
        ScrollView {
            player.frame(maxWidth: .infinity, alignment: .topLeading)
        }
    }

    /// The SwiftUI player for this view
    private var player: some View {
        SwiftUIPlayer(
            flow: flow,
            plugins: plugins,
            result: result
        )
    }
}
