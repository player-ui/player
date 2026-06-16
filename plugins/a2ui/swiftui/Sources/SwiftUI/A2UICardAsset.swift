import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Card` asset.
struct A2UICardData: AssetData {
    var id: String
    var type: String
    var child: WrappedAsset?
}

/// Container with elevation/border and padding.
final class A2UICardAsset: UncontrolledAsset<A2UICardData> {
    public override var view: AnyView { AnyView(A2UICardAssetView(model: model)) }
}

struct A2UICardAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UICardData>

    var body: some View {
        VStack {
            if let child = model.data.child?.asset {
                child.view
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.12))
                .shadow(radius: 2)
        )
        .accessibility(identifier: model.data.id)
    }
}
