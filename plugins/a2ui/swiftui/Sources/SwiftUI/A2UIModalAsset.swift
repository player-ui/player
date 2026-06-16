import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Modal` asset.
struct A2UIModalData: AssetData {
    var id: String
    var type: String
    /// Trigger component — tapping opens the modal.
    var entryPointChild: WrappedAsset?
    /// Body of the modal.
    var contentChild: WrappedAsset?
}

/// Overlay dialog triggered by an entry-point component.
final class A2UIModalAsset: UncontrolledAsset<A2UIModalData> {
    public override var view: AnyView { AnyView(A2UIModalAssetView(model: model)) }
}

struct A2UIModalAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIModalData>
    @State private var open = false

    var body: some View {
        Button(action: { open = true }) {
            if let entry = model.data.entryPointChild?.asset {
                entry.view
            } else {
                EmptyView()
            }
        }
        .accessibility(identifier: model.data.id)
        .sheet(isPresented: $open) {
            VStack(alignment: .leading, spacing: 16) {
                if let content = model.data.contentChild?.asset {
                    content.view
                }
                Button("Close") { open = false }
            }
            .padding()
        }
    }
}
