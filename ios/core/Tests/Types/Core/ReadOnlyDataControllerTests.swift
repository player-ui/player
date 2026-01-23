//
//  ReadOnlyDataControllerTests.swift
//  PlayerUI
//
//  Created by Koriann South with Augment on 2026-01-22.
//

import XCTest
import JavaScriptCore
@testable import PlayerUI

class ReadOnlyDataControllerTests: XCTestCase {
    var context: JSContext!
    var readOnlyController: ReadOnlyDataController!

    override func setUp() {
        super.setUp()
        context = JSContext()!
        context.loadCore()

        // Create a DataController and convert to read-only
        let initialData: [String: Any] = ["product": ["name": "Widget", "price": 99.99], "inStock": true]

        // Create a BindingParser - we need a dummy get function since the DataController creates its own LocalModel
        let getCallback: @convention(block) (JSValue) -> JSValue? = { _ in nil }
        let parserValue = context
            .getClassReference("Player.BindingParser", load: { $0.loadCore() })?
            .construct(withArguments: [[
                "get": JSValue(object: getCallback, in: context) as Any
            ]])

        let dcClass = context.getClassReference("Player.DataController", load: { $0.loadCore() })
        let dcValue = dcClass?.construct(withArguments: [
            initialData,
            [
                "pathResolver": parserValue as Any
            ]
        ])

        readOnlyController = dcValue
            .flatMap { DataController($0).makeReadOnly() }
    }

    func testGetReturnsCorrectValue() {
        XCTAssertEqual(readOnlyController.get(binding: "product.name") as? String, "Widget")
        XCTAssertEqual(readOnlyController.get(binding: "product.price") as? Double, 99.99)
        XCTAssertEqual(readOnlyController.get(binding: "inStock") as? Bool, true)
    }
}
