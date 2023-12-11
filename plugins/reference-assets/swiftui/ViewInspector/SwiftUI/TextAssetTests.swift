//
//  TextAssetTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/8/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import ViewInspector
import SwiftUI
@testable import PlayerUI
@testable import PlayerUIReferenceAssets
@testable import PlayerUISwiftUI
@testable import PlayerUITestUtilities

extension TextAssetView: Inspectable {}
extension LinkModifier: Inspectable {}

class TextAssetTests: SwiftUIAssetUnitTestCase {
    override func register(registry: SwiftUIRegistry) {
        registry.register("text", asset: TextAsset.self)
    }
    func testAssetDecoding() async throws {
        let json = """
        {
          "id": "text",
          "type": "text",
          "value": "Hello World"
        }
        """

        guard let text: TextAsset = await getAsset(json) else { return XCTFail("could not get asset") }

        _ = try text.view.inspect().find(TextAssetView.self).text()

    }

    func testView() throws {
        let val = context.evaluateScript("('Hello World')")
        let ref = ModelReference(rawValue: val)
        let model = AssetViewModel<TextData>(TextData(id: "id", type: "text", value: ref))

        let view = TextAssetView(model: model)

        let value = try view.inspect().text().string()

        XCTAssertEqual("Hello World", value)
    }

    func testLinkView() throws {
        let val = context.evaluateScript("('Hello World')")
        let ref = ModelReference(rawValue: val)
        let model = AssetViewModel<TextData>(
            TextData(
                id: "id",
                type: "text",
                value: ref,
                modifiers: [
                    Modifier(
                        type: "link",
                        value: nil,
                        name: nil,
                        metaData: ModifierMetaData(ref: "https://intuit.com")
                    )
                ]
            )
        )

        let view = TextAssetView(model: model)

        let text = try view.inspect().text()

        XCTAssertEqual("Hello World", try text.string())

        let modifier = try text.modifier(LinkModifier.self)
        XCTAssertEqual(Color(red: 0.000, green: 0.467, blue: 0.773), try modifier.foregroundColor())
        try text.callOnTapGesture()
    }
}
