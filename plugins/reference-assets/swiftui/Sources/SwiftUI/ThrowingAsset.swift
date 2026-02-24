import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// throw timing for the throwing asset. exclude 'render' time to force decoding error
enum ThrowTiming: String, Decodable {
    /// throw during transform time.
    case transform
}

/**
 Data Decoded by Player for `ThrowingAsset`
 */
struct ThrowingData: AssetData, Equatable {
    /// The ID of the asset
    var id: String
    /// The Type of the asset
    var type: String
    /// The value of this asset
    var value: ModelReference
    /// The timing with which to throw an error
    var timing: ThrowTiming
}

/**
 Wrapper class to tie `ThrowingData` to a SwiftUI `View`
 */
class ThrowingAsset: UncontrolledAsset<ThrowingData> {
    /// A type erased view object
    public override var view: AnyView { AnyView(ThrowingAssetView(model: model)) }
}

/**
 View implementation for `TextAsset`
 */
struct ThrowingAssetView: View {
    /// The viewModel with decoded data, supplied by `TextAsset`
    @ObservedObject var model: AssetViewModel<ThrowingData>

    @ViewBuilder
    var body: some View  {
        Text(model.data.value.stringValue ?? "").accessibility(identifier: model.data.id)
    }
}
