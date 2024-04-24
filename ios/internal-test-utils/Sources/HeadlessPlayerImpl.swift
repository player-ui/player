import JavaScriptCore
import PlayerUI
import PlayerUILogger

class HeadlessPlayerImpl: HeadlessPlayer {
    var assetRegistry: BaseAssetRegistry<TestWrapper>
    var hooks: HeadlessHooks?
    var logger = TapableLogger()

    var jsPlayerReference: JSValue?

    let match = PartialMatchFingerprintPlugin()

    init(plugins: [NativePlugin], context: JSContext = JSContext()) {
        assetRegistry = BaseAssetRegistry<TestWrapper>(logger: logger)
        jsPlayerReference = setupPlayer(context: context, plugins: plugins + [match])
        assetRegistry.partialMatchRegistry = match
        guard let player = jsPlayerReference else { return }
        hooks = HeadlessHooks(from: player)
        for plugin in plugins { plugin.apply(player: self) }
    }
}

class HeadlessHooks: CoreHooks {
    var flowController: Hook<FlowController>

    var viewController: Hook<ViewController>

    var dataController: Hook<DataController>

    var state: Hook<BaseFlowState>

    required init(from value: JSValue) {
        flowController = Hook(baseValue: value, name: "flowController")
        viewController = Hook(baseValue: value, name: "viewController")
        dataController = Hook(baseValue: value, name: "dataController")
        state = Hook(baseValue: value, name: "state")
    }
}

class TestAssetType: PlayerAsset, Decodable {
    var rawValue: JSValue?
    var id: String
    var type: String
    var value: String?
    struct Data: Decodable {
        var id: String
        var type: String
        var value: String?
    }
    required init(from decoder: Decoder) throws {
        let data = try decoder.singleValueContainer().decode(Data.self)
        id = data.id
        type = data.type
        value = data.value
    }
}

class TestWrapper: AssetContainer, Decodable {
    public enum CodingKeys: String, CodingKey {
        case asset
    }
    var asset: TestAssetType?
    required init(forAsset: TestAssetType) {
        self.asset = forAsset
    }

    public required init(from decoder: Decoder) throws {
        let decodeAsset = try decoder.getTestDecodeFunction()
        let keyedContainer = try decoder.container(keyedBy: CodingKeys.self)

        if let asset = try decodeAsset(keyedContainer) {
            self.asset = asset
        } else {
            let singleContainer = try decoder.singleValueContainer()
            asset = try decodeAsset(singleContainer)
        }
    }
}

/// A function that decodes a `SwiftUIAsset`
typealias DecodeTestFunction = ((Any) throws -> TestAssetType?)

extension Decoder {
    /**
     Retrieves a `DecodeSwiftUIFunction` if the decoder has one
     - returns: A `DecodeSwiftUIFunction`
     */
    func getTestDecodeFunction() throws -> DecodeTestFunction {
        guard let decodeFunction = self.userInfo[self.decodeFunctionKey] as? DecodeTestFunction else {
            throw DecodingError.decoderNotAnAssetDecoder
        }
        return decodeFunction
    }
}
