import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Text` asset.
struct A2UITextData: AssetData {
    var id: String
    var type: String
    /// Post-transform value — a literal string or a resolved binding.
    var text: ModelReference?
    var variant: String?
}

/// Display text content with styling guidance via `variant`.
final class A2UITextAsset: UncontrolledAsset<A2UITextData> {
    public override var view: AnyView { AnyView(A2UITextAssetView(model: model)) }
}

struct A2UITextAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UITextData>

    private var font: Font {
        switch model.data.variant {
        case "h1": return .largeTitle
        case "h2": return .title
        case "h3": return .title2
        case "h4": return .title3
        case "h5": return .headline
        case "caption": return .caption
        default: return .body
        }
    }

    var body: some View {
        Text(model.data.text?.stringValue ?? "")
            .font(font)
            .accessibility(identifier: model.data.id)
    }
}
