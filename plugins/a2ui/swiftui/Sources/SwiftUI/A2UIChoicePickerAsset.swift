import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// A single option in an A2UI `ChoicePicker`.
struct A2UIChoiceOption: Decodable, Equatable, Identifiable {
    var label: String
    var value: String
    var id: String { value }
}

/// Decoded data for the A2UI `ChoicePicker` asset.
struct A2UIChoicePickerData: AssetData {
    var id: String
    var type: String
    var options: [A2UIChoiceOption]?
    var currentValue: [String]?
    var maxAllowedSelections: Int?
    var set: WrappedFunction<Void>?
}

/// Select one (radio) or more (checkbox) options, bound to the data model.
final class A2UIChoicePickerAsset: UncontrolledAsset<A2UIChoicePickerData> {
    public override var view: AnyView { AnyView(A2UIChoicePickerAssetView(model: model)) }
}

struct A2UIChoicePickerAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIChoicePickerData>

    private var multi: Bool { (model.data.maxAllowedSelections ?? 1) != 1 }

    private func toggle(_ value: String) {
        let current = model.data.currentValue ?? []
        let next: [String]
        if !multi {
            next = [value]
        } else if current.contains(value) {
            next = current.filter { $0 != value }
        } else {
            if current.count >= (model.data.maxAllowedSelections ?? 1) { return }
            next = current + [value]
        }
        model.data.set?(next)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(model.data.options ?? []) { option in
                let checked = (model.data.currentValue ?? []).contains(option.value)
                Button(action: { toggle(option.value) }) {
                    HStack(spacing: 8) {
                        Image(systemName: checkmark(checked: checked))
                        Text(option.label)
                        Spacer()
                    }
                }
                .buttonStyle(PlainButtonStyle())
                .accessibility(identifier: "\(model.data.id)-\(option.value)")
            }
        }
        .accessibility(identifier: model.data.id)
    }

    private func checkmark(checked: Bool) -> String {
        if multi {
            return checked ? "checkmark.square.fill" : "square"
        }
        return checked ? "largecircle.fill.circle" : "circle"
    }
}
