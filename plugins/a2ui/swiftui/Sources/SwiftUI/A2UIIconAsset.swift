import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Icon` asset.
struct A2UIIconData: AssetData {
    var id: String
    var type: String
    var name: ModelReference?
    var accessibility: String?
}

/// Display an icon by `name`, resolved to an SF Symbol.
final class A2UIIconAsset: UncontrolledAsset<A2UIIconData> {
    public override var view: AnyView { AnyView(A2UIIconAssetView(model: model)) }
}

struct A2UIIconAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIIconData>

    var body: some View {
        let name = model.data.name?.stringValue
        // Pass the name through as an SF Symbol; fall back to a neutral glyph.
        Image(systemName: (name?.isEmpty == false ? name! : "questionmark.circle"))
            .accessibility(label: Text(model.data.accessibility ?? name ?? ""))
            .accessibility(identifier: model.data.id)
    }
}
