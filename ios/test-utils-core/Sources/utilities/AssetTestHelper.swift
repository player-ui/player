import Foundation
import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUILogger
import PlayerUISwiftUI
#endif

extension JSContext {
    func createAssetJsValue(string: String) -> JSValue {
        guard let container = self.evaluateScript("(\(string))") else { fatalError("JSON was malformed") }
        return container
    }

    func loadMakeFlow() {
        guard objectForKeyedSubscript("MakeFlow").isUndefined else { return }
        guard
            let url = bundleUrl,
            let contents = try? String(contentsOf: url)
        else { return }
        evaluateScript(contents)
    }

    var bundleUrl: URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: "MakeFlow.native", ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(
            name: "MakeFlow.native",
            ext: "js",
            bundle: Bundle(for: MakeFlowResourceShim.self), 
            pathComponent: "TestUtilities.bundle"
        )
        #endif
    }
}

class MakeFlowResourceShim {}

open class AssetTestHelper<WrapperType: AssetContainer & Decodable, Registry> where Registry: BaseAssetRegistry<WrapperType> {

    /// The JSContext where utilities are loaded
    /// and asset resolution is performed
    public var context: JSContext = JSContext()

    /// A closure to create the registry for this instance of the AssetTestHelper
    public var makeRegistry: () -> Registry

    /// Create an AssetTestHelper
    /// - Parameter makeRegistry: A closure to create the registry
    public init(makeRegistry: @escaping () -> Registry) {
        self.makeRegistry = makeRegistry
        context.loadMakeFlow()
    }

    /// Retrieves an asset from the provided JSON string definition
    /// This utilizes @player-ui/make-flow to turn a single asset into a flow
    /// and then runs that flow in a headless player to allow the registry to resolve asset IDs
    /// - Parameters:
    ///   - json: The JSON Asset definition to decode
    ///   - plugins: Plugins to include for the headless player that resolves the assets
    /// - Returns: The decoded asset if it was decodable
    public func getAsset<Asset>(_ json: String, plugins: [NativePlugin] = []) async -> Asset? {
        await Task { @MainActor () -> Asset? in
            guard let flow = makeFlow(json) else { return nil }
            let player = TestPlayer<WrapperType, Registry>(
                plugins: plugins,
                registry: makeRegistry()
            )

            let root: JSValue? = try? await withCheckedThrowingContinuation { result in
                player.hooks?.viewController.tap({ (viewController) in
                    viewController.hooks.view.tap { (view) in
                        view.hooks.onUpdate.tap { val in
                            result.resume(returning: val)
                        }
                    }
                })
                player.start(flow: flow) { res in
                    guard case .failure(let error) = res else { return }
                    result.resume(throwing: error)
                }
            }

            let jsValue = context.createAssetJsValue(string: json)
            do {
                return try player.assetRegistry.decode(jsValue) as? Asset
            } catch {
                // If the user passed in an entire flow, decode the asset that was the root of
                // the flow
                guard let root = root else { return nil }
                return try? player.assetRegistry.decode(root) as? Asset
            }
        }.value
    }

    /**
     Turns a single Asset JSON definition into a full flow
     - parameters:
        - json: The JSON definition of a single asset
     - returns: A string that is a full JSON flow containing the single asset
     */
    public func makeFlow(_ json: String) -> String? {
        return context.evaluateScript("JSON.stringify(MakeFlow.makeFlow(\(json)))")?.toString()
    }
}

public typealias SwiftUIAssetTestHelper = AssetTestHelper<WrappedAsset, SwiftUIRegistry>

public extension AssetTestHelper where WrapperType == WrappedAsset, Registry == SwiftUIRegistry {
    /// An AssetTestHelper for `SwiftUIAsset`
    static var swiftui: SwiftUIAssetTestHelper {
        AssetTestHelper<WrappedAsset, SwiftUIRegistry> { SwiftUIRegistry(logger: TapableLogger()) }
    }
}

public extension AssetTestHelper where WrapperType == WrappedAsset {
    /**
     Wraps a completion handler into a WrappedFunction for using XCTestExpectations to test functions
     that are added to assets via a JS transform
     - parameters:
        - completion: A completion handler to run when the function is invoked
     - returns: A WrappedFunction that will call your completion handler
     */
    func getWrappedFunction<T>(completion: @escaping () -> Void) -> WrappedFunction<T>? {
        let callback: @convention(block) (JSValue) -> JSValue = { value in
            completion()
            return value
        }

        guard
            let function = JSValue(object: callback, in: context)
        else { return nil }
        return WrappedFunction(rawValue: function)
    }
}
