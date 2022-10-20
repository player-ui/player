import SwiftUI
import Combine

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
struct ActionAssetView: View {
    /// The viewModel with decoded data, supplied by `ActionAsset`
    @ObservedObject var model: AssetViewModel<ActionData>

    /// The `BeaconContext` if the `SwiftUIBeaconPlugin` is used in this player instance
    @Environment(\.beaconContext) var beaconContext

    // For Testing Purposes
    internal var didAppear: ((Self) -> Void)?

    @ViewBuilder
    var body: some View {
        Button(
            action: {
                beaconContext?.beacon(action: "clicked", element: "button", id: model.data.id, metaData: model.data.metaData)
                self.model.data.run?()
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
