import SwiftUI
import Combine

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
import PlayerUISwiftUIPendingTransactionPlugin
import PlayerUIBeaconPlugin
#endif

/**
 Data Decoded by Player for `ActionAsset`
 */
struct ActionData: AssetData {
    /// The ID of the asset
    var id: String
    /// The Type of the asset
    var type: String
    /// A label to use on this asset if it exists
    var label: WrappedAsset?
    /// A function to run in the core when this action is invoked
    var run: WrappedFunction<Void>?

    /// Additional metaData for beaconing
    var metaData: MetaData?
}

/**
 Wrapper class to tie `ActionData` to a SwiftUI `View`
 */
final class ActionAsset: UncontrolledAsset<ActionData> {
    /// A type erased view object
    public override var view: AnyView { AnyView(ActionAssetView(model: model)) }
}

/**
 View implementation for `ActionAsset`
 */
public struct ActionAssetView: View {
    /// The viewModel with decoded data, supplied by `ActionAsset`
    @ObservedObject var model: AssetViewModel<ActionData>

    /// The `BeaconContext` if the `SwiftUIBeaconPlugin` is used in this player instance
    @Environment(\.beaconContext) var beaconContext

    /// The `TransactionContext` if the `SwiftUIPendingTransactionPlugin` is used in this player instance
    @Environment(\.transactionContext) private var transactionContext

    // For Testing Purposes
    internal var didAppear: ((Self) -> Void)?

    @ViewBuilder
    public var body: some View {
        Button(
            action: {
                beaconContext?.beacon(action: "clicked", element: "button", id: model.data.id, metaData: model.data.metaData)

                // commit the pendingTransactionContext input callbacks before running the wrapped function
                model.data.run?.commitCallbacksThenCall()
            },
            label: {
                if let label = model.data.label?.asset {
                    label.view.foregroundColor(.white).padding()
                        .frame(maxWidth: .infinity, maxHeight: 44)
                        .background(
                            Rectangle()
                                .foregroundColor(Color(red: 0.000, green: 0.467, blue: 0.773))
                        )
                        .cornerRadius(4)
                } else {
                    EmptyView()
                }
            }
        )
        .accessibility(identifier: model.data.id)
        .onAppear { self.didAppear?(self) }
    }
}

extension WrappedFunction {
    ///  commits the pendingTransactionContext callbacks before running the wrapped function
    public func commitCallbacksThenCall(_ args: Any...) {
        let pendingTransactions = userInfo?[.pendingTransactionContext] as? TransactionContext<PendingTransactionPhases>
        pendingTransactions?.commit(.input)

        guard let jsValue = rawValue else { return }
        jsValue.call(withArguments: args)
    }
}

