import XCTest
@testable import PlayerUI

class AssetTestHelperTests: XCTestCase {
    let helper = AssetTestHelper<TestWrapper, BaseAssetRegistry<TestWrapper>> {
        BaseAssetRegistry<TestWrapper>(logger: TapableLogger())
    }

    struct TestPlugin: NativePlugin {
        var pluginName: String = "TestPlugin"
        func apply<P>(player: P) where P: HeadlessPlayer {
            guard let player = player as? TestPlayer<TestWrapper, BaseAssetRegistry<TestWrapper>> else { return }
            player.assetRegistry.register("test", asset: TestAssetType.self)
        }
    }

    var plugins: [NativePlugin] = [
        TestPlugin()
    ]

    func testRegistration() {
        let player = TestPlayer<TestWrapper, BaseAssetRegistry<TestWrapper>>(
            plugins: plugins,
            registry: BaseAssetRegistry<TestWrapper>(logger: TapableLogger())
        )
        XCTAssertEqual(player.assetRegistry.registeredAssets.count, 1)
    }

    func testShouldNotDecode() async {
        let assetJSON = """
        {
            "id": "test-id",
            "type": "test",
            "value": 1
        }
        """
        let asset: TestAssetType? = await helper.getAsset(assetJSON, plugins: plugins)

        XCTAssertNil(asset)
    }

    func testShouldDecode() async {
        let assetJSON = """
        {
            "id": "test-id",
            "type": "test",
            "value": "test value"
        }
        """
        let asset: TestAssetType? = await helper.getAsset(assetJSON, plugins: plugins)

        XCTAssertNotNil(asset)
        XCTAssertEqual("test value", asset?.value)
    }

    func testShouldDecodeFlow() async {
        let assetJSON = """
        {
          "id": "generated-flow",
          "views": [
            {
              "id": "test-id",
              "type": "test",
              "value": "test value"
            }
          ],
          "data": {},
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "VIEW_1",
              "VIEW_1": {
                "state_type": "VIEW",
                "ref": "test-id",
                "transitions": {
                  "*": "END_Done"
                }
              },
              "END_Done": {
                "state_type": "END",
                "outcome": "done"
              }
            }
          }
        }
        """
        let asset: TestAssetType? = await helper.getAsset(assetJSON, plugins: plugins)

        XCTAssertNotNil(asset)
        XCTAssertEqual("test value", asset?.value)
    }
}
