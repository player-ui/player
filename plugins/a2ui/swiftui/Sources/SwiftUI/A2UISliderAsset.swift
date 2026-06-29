import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Slider` asset.
struct A2UISliderData: AssetData {
    var id: String
    var type: String
    var currentValue: Double?
    var minValue: Double?
    var maxValue: Double?
    var set: WrappedFunction<Void>?
}

/// Numeric range input bound to the data model.
final class A2UISliderAsset: UncontrolledAsset<A2UISliderData> {
    public override var view: AnyView { AnyView(A2UISliderAssetView(model: model)) }
}

struct A2UISliderAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UISliderData>

    private var range: ClosedRange<Double> {
        let lower = model.data.minValue ?? 0
        let upper = model.data.maxValue ?? 100
        return lower <= upper ? lower...upper : lower...lower
    }

    private var binding: Binding<Double> {
        Binding(
            get: { model.data.currentValue ?? (model.data.minValue ?? 0) },
            set: { newValue in _ = model.data.set?(newValue) }
        )
    }

    var body: some View {
        VStack(alignment: .leading) {
            Slider(value: binding, in: range)
            Text(String(model.data.currentValue ?? 0))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .accessibility(identifier: model.data.id)
    }
}
