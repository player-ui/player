import SwiftUI
import Combine

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `TextField` asset.
struct A2UITextFieldData: AssetData {
    var id: String
    var type: String
    var label: String?
    /// Current value pulled from the data model by the transform.
    var currentValue: String?
    var textFieldType: String?
    var validation: A2UIValidationData?
    /// Commits a new value to the data model.
    var set: WrappedFunction<Void>?
}

/// A custom `AssetViewModel` that buffers editing text and commits via the transform setter.
class A2UITextFieldViewModel: AssetViewModel<A2UITextFieldData> {
    @Published var text: String = ""

    required init(_ data: A2UITextFieldData, userInfo: [CodingUserInfoKey: Any]) {
        super.init(data, userInfo: userInfo)
        $data.sink { [weak self] newData in
            self?.text = newData.currentValue ?? ""
        }.store(in: &bag)
    }

    func commit() { data.set?(text) }
}

/// Text input field bound to the data model.
final class A2UITextFieldAsset: ControlledAsset<A2UITextFieldData, A2UITextFieldViewModel> {
    public override var view: AnyView { AnyView(A2UITextFieldAssetView(model: model)) }
}

struct A2UITextFieldAssetView: View {
    @ObservedObject var model: A2UITextFieldViewModel

    @ViewBuilder private var field: some View {
        if model.data.textFieldType == "obscured" {
            SecureField(model.data.label ?? "", text: $model.text, onCommit: model.commit)
        } else {
            TextField(
                model.data.label ?? "",
                text: $model.text,
                onEditingChanged: { editing in if !editing { model.commit() } },
                onCommit: model.commit
            )
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let label = model.data.label {
                Text(label).font(.headline)
            }
            field
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .accessibility(identifier: model.data.id)
            if let validation = model.data.validation {
                Text(validation.message)
                    .font(.caption)
                    .foregroundColor(.red)
                    .accessibility(identifier: "\(model.data.id)-validation")
            }
        }
    }
}
