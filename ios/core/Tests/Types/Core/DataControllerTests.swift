//
//  DataControllerTests.swift
//  PlayerUI
//
//  Created by Koriann South with Augment on 2026-01-22.
//

import XCTest
import JavaScriptCore
@testable import PlayerUI

class DataControllerTests: XCTestCase {
    var context: JSContext!
    var dataController: DataController!

    override func setUp() {
        super.setUp()
        context = JSContext()!
        context.loadCore()

        // Create a DataController with initial data
        let initialData: [String: Any] = ["user": ["name": "Alice", "age": 30], "count": 5]

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

        dataController = dcValue.map { DataController($0) }
    }

    func testGetReturnsCorrectValue() {
        XCTAssertEqual(dataController.get(binding: "user.name") as? String, "Alice")
        XCTAssertEqual(dataController.get(binding: "user.age") as? Int, 30)
        XCTAssertEqual(dataController.get(binding: "count") as? Int, 5)
    }

    func testSetUpdatesValue() {
        dataController.set(transaction: ["user.name": "Bob"])
        XCTAssertEqual(dataController.get(binding: "user.name") as? String, "Bob")
    }

    func testGetRootReturnsFullModel() {
        // Get the root data using empty string binding
        let model = dataController.get(binding: "") as? [String: Any]
        let user = model?["user"] as? [String: Any]

        XCTAssertEqual(user?["name"] as? String, "Alice")
        XCTAssertEqual(user?["age"] as? Int, 30)
        XCTAssertEqual(model?["count"] as? Int, 5)
    }

    func testOnUpdateHookFiresWithCorrectData() {
        let expectation = XCTestExpectation(description: "onUpdate hook fires")

        dataController.hooks.onUpdate.tap { updates in
            XCTAssertEqual(updates.count, 1)
            XCTAssertEqual(updates[0].binding.asString(), "user.name")
            XCTAssertEqual(updates[0].oldValue, AnyType.string(data: "Alice"))
            XCTAssertEqual(updates[0].newValue, AnyType.string(data: "Charlie"))
            expectation.fulfill()
        }

        dataController.set(transaction: ["user.name": "Charlie"])

        wait(for: [expectation], timeout: 1.0)
    }

    func testMakeReadOnlyCreatesReadOnlyController() {
        let readOnly = dataController.makeReadOnly()

        XCTAssertEqual(readOnly?.get(binding: "user.name") as? String, "Alice")
        XCTAssertEqual(readOnly?.get(binding: "user.age") as? Int, 30)
    }

    func testGetModelReturnsPipelinedDataModel() {
        let model = dataController.getModel()

        let userName = model?.invokeMethod("get", withArguments: [
            dataController.value.context.evaluateScript("new Player.BindingParser({ get: () => null }).parse('user.name')")!
        ])?.toObject() as? String

        XCTAssertEqual(userName, "Alice")
    }
}
