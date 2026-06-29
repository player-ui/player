import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
import PlayerUIA2UI
#endif

/**
 A `SwiftUIPlayer` preconfigured for A2UI content — the `A2UIPlugin` (SwiftUI renderers +
 content adapter + asset transforms + expression functions) — and `StartOptions.a2ui` so
 the flow is started in the A2UI format.

 Extra `plugins` are appended after the A2UI defaults so consumer-supplied taps run later
 and win on conflict (mirrors `A2UIReactPlayer`).

 - Example:
 ```swift
 A2UISwiftUIPlayer(flow: snapshot, result: $result)
 ```
 */
public struct A2UISwiftUIPlayer: View {
    /// The underlying preconfigured player.
    let player: SwiftUIPlayer

    public init(
        flow: String,
        plugins: [NativePlugin] = [],
        result: Binding<Result<CompletedState, PlayerError>?>,
        context: SwiftUIPlayer.Context = .shared,
        unloadOnDisappear: Bool = true
    ) {
        let defaults: [NativePlugin] = [A2UIPlugin()]
        player = SwiftUIPlayer(
            flow: flow,
            plugins: defaults + plugins,
            result: result,
            context: context,
            unloadOnDisappear: unloadOnDisappear,
            startOptions: .a2ui
        )
    }

    public var body: some View { player }
}
