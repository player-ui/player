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

    @ViewBuilder
    var body: some View {
        if let link = model.data.modifiers?.first(where: { $0.type == "link" })?.metaData?.ref {
            Text(model.data.value.stringValue ?? "").bold().modifier(LinkModifier(link)).accessibility(identifier: model.data.id)
        } else {
            Text(model.data.value.stringValue ?? "").accessibility(identifier: model.data.id)
        }
    }
}

/**
 A `ViewModifier` to make a `View` open a string URL
 */
struct LinkModifier: ViewModifier {
    /// The URL location to visit
    let destination: URL
    /**
     Constructs a `LinkModifier` with a string destination
     - parameters:
        - destination: A string URL destination
     */
    init(_ destination: String) {
        self.destination = URL(string: destination)!
    }

    func body(content: Content) -> some View {
        content
            .onTapGesture {
                UIApplication.shared.open(destination)
            }
            .foregroundColor(Color(red: 0.000, green: 0.467, blue: 0.773))
    }
}
