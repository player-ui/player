import JavaScriptCore
import PlayerUI
#if SWIFT_PACKAGE
    import PlayerUILogger
#endif

open class HeadlessPlayerImpl: HeadlessPlayer {
    public var assetRegistry: BaseAssetRegistry<TestWrapper>
    public var hooks: HeadlessHooks?
    public var logger: TapableLogger = .init()

    public var jsPlayerReference: JSValue?

    let match: PartialMatchFingerprintPlugin = .init()

    public init(plugins: [NativePlugin], context: JSContext = JSContext()) {
        assetRegistry = BaseAssetRegistry<TestWrapper>(logger: logger)
        jsPlayerReference = setupPlayer(context: context, plugins: plugins + [match])
        assetRegistry.partialMatchRegistry = match
        guard let player = jsPlayerReference else { return }
        hooks = HeadlessHooks(from: player)
        for plugin in plugins {
            plugin.apply(player: self)
        }
    }
}

public class HeadlessHooks: CoreHooks {
    public var flowController: Hook<FlowController>

    public var viewController: Hook<ViewController>

    public var dataController: Hook<DataController>

    public var state: Hook<BaseFlowState>

    public var onStart: Hook<FlowType>

    public required init(from value: JSValue) {
        flowController = Hook(baseValue: value, name: "flowController")
        viewController = Hook(baseValue: value, name: "viewController")
        dataController = Hook(baseValue: value, name: "dataController")
        state = Hook(baseValue: value, name: "state")
        onStart = Hook<FlowType>(baseValue: value, name: "onStart")
    }
}

public class TestAssetType: PlayerAsset, Decodable {
    public var id: String
    public var type: String

    var rawValue: JSValue?
    var value: String?

    public required init(from decoder: Decoder) throws {
        let data = try decoder.singleValueContainer().decode(Data.self)
        id = data.id
        type = data.type
        value = data.value
    }

    struct Data: Decodable {
        var id: String
        var type: String
        var value: String?
    }
}

public class TestWrapper: AssetContainer, Decodable {
    public var asset: TestAssetType?

    public required init(forAsset: TestAssetType) {
        asset = forAsset
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

    public enum CodingKeys: String, CodingKey {
        case asset
    }
}

/// A function that decodes a `SwiftUIAsset`
typealias DecodeTestFunction = (Any) throws -> TestAssetType?

extension Decoder {
    /// Retrieves a `DecodeSwiftUIFunction` if the decoder has one
    /// - returns: A `DecodeSwiftUIFunction`
    func getTestDecodeFunction() throws -> DecodeTestFunction {
        guard let decodeFunction = userInfo[decodeFunctionKey] as? DecodeTestFunction else {
            throw DecodingError.decoderNotAnAssetDecoder
        }
        return decodeFunction
    }
}
