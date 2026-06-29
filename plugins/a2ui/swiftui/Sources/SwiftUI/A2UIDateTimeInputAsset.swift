import SwiftUI
import Combine

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `DateTimeInput` asset.
struct A2UIDateTimeInputData: AssetData {
    var id: String
    var type: String
    var currentValue: String?
    var enableDate: Bool?
    var enableTime: Bool?
    var set: WrappedFunction<Void>?
}

/// Buffers the editing text and commits via the transform setter.
class A2UIDateTimeInputViewModel: AssetViewModel<A2UIDateTimeInputData> {
    @Published var text: String = ""

    required init(_ data: A2UIDateTimeInputData, userInfo: [CodingUserInfoKey: Any]) {
        super.init(data, userInfo: userInfo)
        $data.sink { [weak self] newData in
            self?.text = newData.currentValue ?? ""
        }.store(in: &bag)
    }

    func commit() { data.set?(text) }
}

/**
 Date/time entry bound to the data model.

 Note: renders a free-form text field for the value rather than a native picker, to keep
 parity with the cross-platform string round-trip without an extra dependency.
 */
final class A2UIDateTimeInputAsset: ControlledAsset<A2UIDateTimeInputData, A2UIDateTimeInputViewModel> {
    public override var view: AnyView { AnyView(A2UIDateTimeInputAssetView(model: model)) }
}

struct A2UIDateTimeInputAssetView: View {
    @ObservedObject var model: A2UIDateTimeInputViewModel

    private var label: String {
        let date = model.data.enableDate ?? true
        let time = model.data.enableTime ?? false
        if date && time { return "Date & time" }
        if time { return "Time" }
        return "Date"
    }

    var body: some View {
        TextField(
            label,
            text: $model.text,
            onEditingChanged: { editing in if !editing { model.commit() } },
            onCommit: model.commit
        )
        .textFieldStyle(RoundedBorderTextFieldStyle())
        .accessibility(identifier: model.data.id)
    }
}
