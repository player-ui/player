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
                    XCTAssertEqual(errorState.error, "undefined is not an object (evaluating 'this.navigation.BEGIN')")
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
}

class FakePlugin: JSBasePlugin, NativePlugin {
    override func setup(context: JSContext) {

    }

    convenience init() {
        self.init(fileName: "", pluginName: "")
    }
}
