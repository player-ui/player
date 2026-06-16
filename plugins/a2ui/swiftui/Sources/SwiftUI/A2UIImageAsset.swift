import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Image` asset.
struct A2UIImageData: AssetData {
    var id: String
    var type: String
    var url: ModelReference?
    var fit: String?
    var variant: String?
    var accessibility: String?
}

/**
 Display an image from a URL.

 Note: the deployment target (iOS 14) predates SwiftUI `AsyncImage`, so this renders a
 labelled placeholder showing the source URL. Gate `AsyncImage` behind `#available(iOS 15, *)`
 to render the actual bitmap.
 */
final class A2UIImageAsset: UncontrolledAsset<A2UIImageData> {
    public override var view: AnyView { AnyView(A2UIImageAssetView(model: model)) }
}

struct A2UIImageAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIImageData>

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color.gray.opacity(0.4), lineWidth: 1)
            Text(model.data.accessibility ?? model.data.url?.stringValue ?? "")
                .font(.caption)
                .padding(8)
        }
        .frame(minHeight: 80)
        .accessibility(identifier: model.data.id)
    }
}
