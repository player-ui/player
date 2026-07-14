import PlayerUI
import PlayerUISwiftUI
import SwiftUI

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
    override var view: AnyView {
        AnyView(A2UITextAssetView(model: model))
    }
}

struct A2UITextAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UITextData>

    private var font: Font {
        switch model.data.variant {
        case "h1": .largeTitle
        case "h2": .title
        case "h3": .title2
        case "h4": .title3
        case "h5": .headline
        case "caption": .caption
        default: .body
        }
    }

    var body: some View {
        Text(model.data.text?.stringValue ?? "")
            .font(font)
            .accessibility(identifier: model.data.id)
    }
}
