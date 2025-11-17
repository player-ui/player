import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/**
 Data Decoded by Player for `TextAsset`
 */
struct TextData: AssetData, Equatable {
    /// The ID of the asset
    var id: String
    /// The Type of the asset
    var type: String
    /// The value of this asset
    var value: ModelReference
    var modifiers: [Modifier]?
}

/**
 Wrapper class to tie `TextData` to a SwiftUI `View`
 */
class TextAsset: UncontrolledAsset<TextData> {
    /// A type erased view object
    public override var view: AnyView { AnyView(TextAssetView(model: model)) }
}

/**
 View implementation for `TextAsset`
 */
struct TextAssetView: View {
    /// The viewModel with decoded data, supplied by `TextAsset`
    @ObservedObject var model: AssetViewModel<TextData>

    var body: some View {
        if let link = model.data.modifiers?.first(where: { $0.type == "link" })?.metaData?.ref {
            Link(destination: URL(string: link)!) {
                let text = model.data.value.stringValue ?? ""
                Text(text)
                    .bold()
                    .foregroundColor(Color(red: 0.000, green: 0.467, blue: 0.773))
            }.accessibility(identifier: model.data.id)
        } else {
            Text(model.data.value.stringValue ?? "").accessibility(identifier: model.data.id)
        }
    }
}
