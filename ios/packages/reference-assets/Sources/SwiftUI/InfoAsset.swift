import SwiftUI

/**
 Data Decoded by Player for `InfoAsset`
 */
struct InfoData: AssetData {
    /// The ID of the asset
    var id: String
    /// The Type of the asset
    var type: String
    /// An asset to use as a title for this asset
    var title: WrappedAsset?
    /// An asset to use as a subTitle for this asset
    var subTitle: WrappedAsset?
    /// An asset to use as the primary slot for info
    var primaryInfo: WrappedAsset?
    /// Assets to use as actions in this asset
    var actions: [WrappedAsset]?
    /// An asset to use as a footer for this asset
    var footer: WrappedAsset?
}

/**
 Wrapper class to tie `InfoData` to a SwiftUI `View`
 */
class InfoAsset: UncontrolledAsset<InfoData> {
    /// A type erased view object
    override var view: AnyView { AnyView(InfoAssetView(model: model)) }
}

/**
 View implementation for `InfoAsset`
 */
struct InfoAssetView: View {
    /// The viewModel with decoded data, supplied by `InfoAsset`
    @ObservedObject var model: AssetViewModel<InfoData>

    @ViewBuilder
    var body: some View {
        VStack {
            model.data.title?.asset?.view.font(.title)
            model.data.subTitle?.asset?.view.font(.subheadline)
            model.data.primaryInfo?.asset?.view
            if let actions = model.data.actions?.compactMap { $0.asset } {
                ForEach(actions) { action in
                    action.view
                }
            }
            model.data.footer?.asset?.view.font(.subheadline).padding(.top, 12)
        }
        .accessibilityElement(children: .contain)
        .accessibility(identifier: model.data.id)
    }
}
