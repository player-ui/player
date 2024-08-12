//
//  HeadlessPlayerTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 8/23/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities

class HeadlessPlayerTests: XCTestCase {
    func testViewId() {
        let player = HeadlessPlayerImpl(plugins: [])
        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                XCTAssertEqual(view.id, "action")
                XCTAssertEqual(viewController.currentView?.id, "action")
            }
        }
        player.start(flow: FlowData.COUNTER) { _ in}
    }

    // func testApplyTo() {
    //     let player = HeadlessPlayerImpl(plugins: [MetricsPlugin()])
    //     let pluginExists = expectation(description: "Plugin Found")

    //     player.applyTo(MetricsPlugin.self) { plugin in
    //         guard !plugin.isUndefined else { return }
    //         pluginExists.fulfill()
    //     }

    //     wait(for: [pluginExists], timeout: 2)
    // }

    func testUpdateHook() {
        let player = HeadlessPlayerImpl(plugins: [])
        // this func only exists because the compiler thinks XCTAssertThrowsError throws when it does not
        func checkUnregisteredAssetDecodeFails(_ assetJsValue: JSValue) {
            XCTAssertThrowsError(try player.assetRegistry.decode(assetJsValue))
        }
        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                view.hooks.onUpdate.tap(checkUnregisteredAssetDecodeFails(_:))
            }
        }

        player.start(flow: FlowData.COUNTER) { (result) in
            switch result {
            case .success(let result):
                print(result)
            case .failure(let error):
                print(error.localizedDescription)
            }
        }
    }

    func testStateHook() {
        let player = HeadlessPlayerImpl(plugins: [])
        let inProgress = expectation(description: "inProgress state")
        let completed = expectation(description: "completed state")
        player.hooks?.state.tap({ (newState) in
            if (newState as? InProgressState) != nil {
                inProgress.fulfill()
            }
            if (newState as? CompletedState) != nil {
                completed.fulfill()
            }
        })

        player.start(flow: FlowData.COUNTER, completion: {_ in})
        do {
            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "NEXT")
        } catch {
            XCTFail("Transition with 'NEXT' failed")
        }

        wait(for: [inProgress, completed], timeout: 5)
    }

    func testInProgressStateFail() {
        let player = HeadlessPlayerImpl(plugins: [])
        let inProgress = expectation(description: "inProgress state")
        let completed = expectation(description: "completed state")
        player.hooks?.state.tap({ (newState) in
            if (newState as? InProgressState) != nil {
                inProgress.fulfill()
            }
            if (newState as? ErrorState) != nil {
                completed.fulfill()
            }
        })

        player.start(flow: FlowData.COUNTER, completion: {_ in})
        (player.state as? InProgressState)?.fail(PlayerError.unknownResponse(DecodingError.baseAssetNotDecodable))

        wait(for: [inProgress, completed], timeout: 5)
    }

    func testInProgressStateFailConversion() {
        let player = HeadlessPlayerImpl(plugins: [])
        let inProgress = expectation(description: "inProgress state")
        let completed = expectation(description: "completed state")
        player.hooks?.state.tap({ (newState) in
            if (newState as? InProgressState) != nil {
                inProgress.fulfill()
            }
            if (newState as? ErrorState) != nil {
                completed.fulfill()
            }
        })

        player.start(flow: FlowData.COUNTER, completion: {_ in})
        (player.state as? InProgressState)?.fail(PlayerError.unknownResponse(PlayerError.jsConversionFailure))

        wait(for: [inProgress, completed], timeout: 5)
    }

    func testTransition() {
        let player = HeadlessPlayerImpl(plugins: [])
        XCTAssertNotNil(player.state as? NotStartedState)
        player.hooks?.dataController.tap({ dataController in
            dataController.set(transaction: ["count": 5])
        })

        player.start(flow: FlowData.COUNTER) { (result) in
            switch result {
            case .success(let result):
                print(result)
                XCTAssertNotNil(player.state as? CompletedState)
                XCTAssertEqual(result.endState?.outcome, "done")
                XCTAssertEqual(result.endState?.param?["someKey"] as? String, "someValue")
                let extraKey: String? = result.endState?.extraKey
                XCTAssertEqual(extraKey, "extraValue")
                let extraObject: [String: Any]? = result.endState?.extraObject
                XCTAssertEqual(extraObject?["someInt"] as? Int, 1)
                XCTAssertEqual(result.status, PlayerFlowStatus.completed)
                XCTAssertEqual(result.flow.id, "counter-flow")
                XCTAssertEqual(result.flow.data?["count"] as? Int, 0)
                XCTAssertEqual(result.data["count"] as? Int, 5)
            case .failure(let error):
                print(error.localizedDescription)
                XCTFail("flow should have succeeded")
            }
        }
        XCTAssertNotNil(player.state as? InProgressState)
        XCTAssertEqual(player.state?.status, .inProgress)
        do {
            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "NEXT")
        } catch {
            XCTFail("Transition with 'NEXT' failed")
        }
    }

    func testPlayerControllers() {
        let player = HeadlessPlayerImpl(plugins: [])

        player.start(flow: FlowData.COUNTER) { _ in  }
        XCTAssertNotNil(player.state as? InProgressState)
        guard let state = player.state as? InProgressState else { return XCTFail("state was not InProgressState") }
        XCTAssertNotNil(state.controllers)
    }

    func testRegisterPlugin() {
        class RegisterMePlugin: JSBasePlugin {
            convenience init() {
                self.init(fileName: "", pluginName: "")
            }

            override func setup(context: JSContext) {}
        }
        let player = HeadlessPlayerImpl(plugins: [])

        player.start(flow: FlowData.COUNTER) { _ in  }

        let plugin = RegisterMePlugin()

        player.registerPlugin(plugin)

        XCTAssertNotNil(plugin.context)
    }

    func testEmptyFlowObject() {
        let player = HeadlessPlayerImpl(plugins: [])
        player.start(flow: "{}") { (result) in
            switch result {
            case .success(let result):
                print(result)
                XCTFail("should have failed")
            case .failure(let error):
                switch error {
                case .promiseRejected(let errorState):
                    XCTAssertEqual(errorState.error, "undefined is not an object (evaluating '_this.navigation.BEGIN')")
                default: break
                }
            }
        }
    }

    func testEmptyStringFlow() {
        let player = HeadlessPlayerImpl(plugins: [])
        player.start(flow: "") { (result) in
            switch result {
            case .success(let result):
                print(result)
                XCTFail("should have failed")
            case .failure(let error):
                switch error {
                case .promiseRejected(let errorState):
                    XCTAssertEqual(errorState.error, "undefined is not an object (evaluating \'o.navigation\')")
                default: break
                }
            }
        }
    }

    func testBadStringFlow() {
        let player = HeadlessPlayerImpl(plugins: [])
        player.start(flow: ")") { (result) in
            switch result {
            case .success(let result):
                print(result)
                XCTFail("Should have failed")
            case .failure(let error):
                switch error {
                case .jsConversionFailure:
                    XCTAssertTrue(true)
                default: XCTFail("should have thrown jsConversionFailure")
                }
            }
        }
    }

    func testStartNoContext() {
        let player = HeadlessPlayerImpl(plugins: [])
        player.jsPlayerReference = nil
        player.start(flow: "{}") { (result) in
            switch result {
            case .success(let result):
                print(result)
                XCTFail("Should have failed")
            case .failure(let error):
                switch error {
                case .jsConversionFailure:
                    XCTAssertTrue(true)
                default: XCTFail("should have thrown jsConversionFailure")
                }
            }
        }
    }

    func testDataControllerOnUpdate() {
        let player = HeadlessPlayerImpl(plugins: [])

        let updateExp = expectation(description: "Data Updated")

        XCTAssertNotNil(player.state as? NotStartedState)
        player.hooks?.dataController.tap({ dataController in
            dataController.hooks.onUpdate.tap { updates in
                XCTAssertEqual(updates.first?.binding.asString(), "count")
                XCTAssertEqual(updates.first?.oldValue, AnyType.number(data: 0))
                XCTAssertEqual(updates.first?.newValue, AnyType.number(data: 5))
                updateExp.fulfill()
            }

            dataController.set(transaction: ["count": 5])
        })

        player.start(flow: FlowData.COUNTER) { _ in}
        wait(for: [updateExp], timeout: 1)
    }

    func testConstantsController() {
        let player = HeadlessPlayerImpl(plugins: [])
        
        guard let constantsController = player.constantsController else { return }
        
        // Basic get/set tests
        let data: Any = [
            "firstname": "john",
            "lastname": "doe",
            "favorite": [
                "color": "red"
            ],
            "age": 1
        ]
        
        constantsController.addConstants(data: data, namespace: "constants")

        let firstname: String? = constantsController.getConstants(key: "firstname", namespace: "constants")
        XCTAssertEqual(firstname, "john")

        let middleName: String? = constantsController.getConstants(key:"middlename", namespace: "constants")
        XCTAssertNil(middleName)

        let middleNameSafe: String? = constantsController.getConstants(key:"middlename", namespace: "constants", fallback: "A")
        XCTAssertEqual(middleNameSafe, "A")

        let favoriteColor: String? = constantsController.getConstants(key:"favorite.color", namespace: "constants")
        XCTAssertEqual(favoriteColor, "red")
        
        let age: Int? = constantsController.getConstants(key:"age", namespace: "constants")
        XCTAssertEqual(age, 1)

        let nonExistantNamespace: String? = constantsController.getConstants(key:"test", namespace: "foo")
        XCTAssertNil(nonExistantNamespace)

        let nonExistantNamespaceWithFallback: String? = constantsController.getConstants(key:"test", namespace: "foo", fallback: "B")
        XCTAssertEqual(nonExistantNamespaceWithFallback, "B")
        
        // Test and make sure keys override properly
        let newData: Any = [
           "favorite": [
             "color": "blue",
           ],
        ];

        constantsController.addConstants(data: newData, namespace: "constants");
        
        let newFavoriteColor: String? = constantsController.getConstants(key: "favorite.color", namespace:"constants")
        XCTAssertEqual(newFavoriteColor, "blue")
    }
    
    func testConstantsControllerTempValues() {
        let player = HeadlessPlayerImpl(plugins: [])
        
        guard let constantsController = player.constantsController else { return }
        
        // Add initial constants
        let data: Any = [
            "firstname": "john",
            "lastname": "doe",
            "favorite": [
                "color": "red"
            ]
        ]
        constantsController.addConstants(data: data, namespace: "constants")

        // Override with temporary values
        let tempData: Any = [
            "firstname": "jane",
            "favorite": [
                "color": "blue"
            ]
        ]
        constantsController.setTemporaryValues(data:tempData, namespace: "constants")

        // Test temporary override
        let firstnameTemp: String? = constantsController.getConstants(key:"firstname", namespace: "constants")
        XCTAssertEqual(firstnameTemp, "jane")

        let favoriteColorTemp: String? = constantsController.getConstants(key: "favorite.color", namespace: "constants")
        XCTAssertEqual(favoriteColorTemp, "blue")

        // Test fallback to original values when temporary values are not present
        let lastnameTemp: String? = constantsController.getConstants(key: "lastname", namespace: "constants")
        XCTAssertEqual(lastnameTemp, "doe")
        
        // Reset temp and values should be the same as the original data
        constantsController.clearTemporaryValues();
        
        let firstname: String? = constantsController.getConstants(key:"firstname", namespace: "constants")
        XCTAssertEqual(firstname, "john")

        let favoriteColor: String? = constantsController.getConstants(key: "favorite.color", namespace: "constants")
        XCTAssertEqual(favoriteColor, "red")

        let lastname: String? = constantsController.getConstants(key: "lastname", namespace: "constants")
        XCTAssertEqual(lastname, "doe")
    }
}

class FakePlugin: JSBasePlugin, NativePlugin {
    override func setup(context: JSContext) {

    }

    convenience init() {
        self.init(fileName: "", pluginName: "")
    }
}
