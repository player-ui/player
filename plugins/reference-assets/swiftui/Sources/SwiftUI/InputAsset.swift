import SwiftUI
import Combine

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
import PlayerUISwiftUIPendingTransactionPlugin
#endif

/**
 Represents a DataType that is associated with the asset
 */
public struct DataType: Decodable, Hashable {
    /// The type of data for this DataType (IntegerType for example)
    public let type: String
}

/**
 Data Decoded by Player for `InputAsset`
 */
public struct InputData: AssetData, Equatable {
    /// The ID of the asset
    public var id: String
    /// The Type of the asset
    public var type: String
    /// A string to use as a placeholder when there is no value
    var placeholder: String?
    /**
     The value of the asset, as a `ModelReference` so it can be pulled as a string
     in case the primitive type in the data model was a number something else
     */
    var value: ModelReference?
    /// An asset to use as a label for this asset
    var label: WrappedAsset?
    /// A function to set the value into the data model
    var set: WrappedFunction<Void>?
    /// The `DataType` associated with this asset, for formatting the keyboard
    var dataType: DataType?
    /// A validation if present on the input
    var validation: ValidationData?
    /// An asset to use as a note for this asset
    var note: WrappedAsset?
}

/**
 An extended `AssetViewModel` to allow for custom behavior
 */
open class InputAssetViewModel: AssetViewModel<InputData> {
    /// The current string value of the asset
    @Published var text: String = ""

    /**
     Constructs the `InputAssetViewModel`
     - parameters:
        - data: The `InputData` decoded from the core player
        - userInfo: The `userInfo` from the decoder
     */
    public required init(_ data: InputData, userInfo: [CodingUserInfoKey: Any]) {
        super.init(data, userInfo: userInfo)
        $data.sink { [weak self] (newData) in
            (newData.value?.stringValue).map { self?.text = $0 }
        }.store(in: &bag)
    }

    /**
     Sets the current text into the data model in the core player
     */
    public func set() {
        data.set?(text)
    }
}

/**
 Wrapper class to tie `InputData` to a SwiftUI `View`
 */
class InputAsset: ControlledAsset<InputData, InputAssetViewModel> {
    /// A type erased view object
    public override var view: AnyView { AnyView(InputAssetView(model: model)) }
}

/**
 View implementation for `InputAsset`
 */
struct InputAssetView: View {
    /// The viewModel with decoded data, supplied by `InputAsset`
    @ObservedObject var model: InputAssetViewModel

    @Environment(\.transactionContext) private var transactionContext

    /// The color to use for the stroke around the field
    var strokeColor: Color {
        if let validation = model.data.validation {
            return validation.severity.color
        }
        return Color(red: 0.729, green: 0.745, blue: 0.773)
    }

    @ViewBuilder
    var body: some View {
        VStack(alignment: .leading) {
            model.data.label?.asset?.view.foregroundColor(Color(red: 0.102, green: 0.125, blue: 0.173)).padding(.bottom, 8).font(.headline)
            TextField(
                model.data.placeholder ?? "",
                text: $model.text,
                onEditingChanged: onEditingChanged(_:)
            )
            .padding(4)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .stroke(lineWidth: 1)
                    .background(model.data.validation == nil ? Color.clear : strokeColor.opacity(0.1))
                    .foregroundColor(strokeColor)
            )
            .accessibility(identifier: model.data.id)
            if let data = model.data.validation {
                let dismissFunction: (() -> Void)? = data.dismiss == nil ? nil : {data.dismiss?()}
                ValidationView(message: data.message, severity: data.severity, dismiss: dismissFunction)
                    .accessibility(identifier: "\(model.data.id)-validation")
            }
            model.data.note?.asset?.view.foregroundColor(Color(red: 0.729, green: 0.745, blue: 0.773)).padding(.top, 8).font(.subheadline)
        }
    }

    func onEditingChanged(_ editing: Bool) {
        guard !editing else {
            transactionContext.register(.input) {
                self.model.set()
            }
            return
        }
        self.model.set()
        // remove the transaction once editing ends
        transactionContext.clear(.input)
    }
}

/**
 Extensions for PendingTransactionPhases of TransactionContext to create a new Phase for Input callbacks
 */
extension PendingTransactionPhases {
    public static let input = PendingTransactionPhases(rawValue: "input")
}
