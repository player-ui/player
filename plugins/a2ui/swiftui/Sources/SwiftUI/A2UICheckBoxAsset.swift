import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `CheckBox` asset.
struct A2UICheckBoxData: AssetData {
    var id: String
    var type: String
    var label: String?
    var currentValue: Bool?
    var set: WrappedFunction<Void>?
}

/// Boolean toggle control bound to the data model.
final class A2UICheckBoxAsset: UncontrolledAsset<A2UICheckBoxData> {
    public override var view: AnyView { AnyView(A2UICheckBoxAssetView(model: model)) }
}

struct A2UICheckBoxAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UICheckBoxData>

    private var binding: Binding<Bool> {
        Binding(
            get: { model.data.currentValue ?? false },
            set: { newValue in _ = model.data.set?(newValue) }
        )
    }

    var body: some View {
        Toggle(isOn: binding) {
            Text(model.data.label ?? "")
        }
        .accessibility(identifier: model.data.id)
    }
}
