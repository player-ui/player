import Foundation
import XCTest
import ViewInspector
import SwiftUI
@testable import PlayerUI
@testable import PlayerUIA2UI
@testable import PlayerUISwiftUI
@testable import PlayerUITestUtilities

@MainActor
class A2UIAssetTests: SwiftUIAssetUnitTestCase {
    override open func plugins() -> [NativePlugin] { [A2UIPlugin()] }

    /// Renders a `Text` asset from its post-transform data shape.
    func testTextView() throws {
        let val = context.evaluateScript("('Hello A2UI')")
        let ref = ModelReference(rawValue: val)
        let model = AssetViewModel<A2UITextData>(
            A2UITextData(id: "t", type: "Text", text: ref, variant: "body")
        )

        let view = A2UITextAssetView(model: model)
        XCTAssertEqual("Hello A2UI", try view.inspect().text().string())
    }

    /// Decodes a `Text` asset through the JS runtime and finds its rendered view.
    func testTextDecoding() async throws {
        let json = """
        { "id": "t", "type": "Text", "text": "Hello A2UI", "variant": "body" }
        """

        guard let text: A2UITextAsset = await getAsset(json) else {
            return XCTFail("could not get A2UI Text asset")
        }
        _ = try text.view.inspect().find(A2UITextAssetView.self)
    }

    /// Renders a `Button` and verifies its wrapped action fires on tap.
    func testButtonRunsAction() throws {
        let expectation = XCTestExpectation(description: "button run invoked")
        let run: WrappedFunction<Void>? = getWrappedFunction { expectation.fulfill() }
        let model = AssetViewModel<A2UIButtonData>(
            A2UIButtonData(id: "b", type: "Button", child: nil, variant: "primary", run: run)
        )

        let view = A2UIButtonAssetView(model: model)
        try view.inspect().find(ViewType.Button.self).tap()

        wait(for: [expectation], timeout: 1.0)
    }
}
