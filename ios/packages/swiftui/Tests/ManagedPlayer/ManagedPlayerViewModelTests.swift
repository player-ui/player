//
//  ManagedPlayerViewModelTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 4/5/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import Combine
import XCTest
import JavaScriptCore

@testable import PlayerUI

class ManagedPlayerViewModelTests: XCTestCase {
    let flow1 = FlowData.COUNTER
    let flow2 = FlowData.COUNTER.replacingOccurrences(of: "counter-flow", with: "counter-flow-2")

    func testViewModelSuccessFlow() async throws {
        let flowManager = ConstantFlowManager([flow1], delay: 0)

        let completed = expectation(description: "Flows Completed")
        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in
            completed.fulfill()
        })

        Task { await viewModel.next() }

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow1 }

        let result = """
        {
            "status": "completed",
            "flow": "",
            "endState": {
                "outcome":"done"
            }
        }
        """

        let stateObj = JSContext()?.evaluateScript("(\(result))")

        let state = CompletedState.createInstance(from: stateObj)!

        viewModel.result = .success(state)
        await fulfillment(of: [completed], timeout: 2)
    }

    func testViewModelSuccessMultiFlow() async throws {
        let flowManager = ConstantFlowManager([flow1, flow2], delay: 0)

        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in})

        Task { await viewModel.next() }

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow1 }

        let result = """
        {
            "status": "completed",
            "flow": "",
            "endState": {
                "outcome":"done"
            }
        }
        """

        let stateObj = JSContext()?.evaluateScript("(\(result))")

        let state = CompletedState.createInstance(from: stateObj)!

        viewModel.result = .success(state)

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow2 }
    }

    func testViewModelManagerError() async {
        struct ErrorFlowManager: FlowManager {
            func next(_: CompletedState?) async throws -> NextState {
                throw PlayerError.jsConversionFailure
            }
        }
        let flowManager = ErrorFlowManager()

        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in })

        await viewModel.next()

        guard
            case .failed(let error) = viewModel.loadingState,
            let _ = error as? PlayerError
        else { return XCTFail("Expected PlayerError") }

        XCTAssertFalse(viewModel.loadingState.isLoaded)
    }

    func testViewModelRetry() async throws {
        let flowManager = ConstantFlowManager([flow1, flow2], delay: 0)

        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in})

        await viewModel.next()

        await assertPublished(AnyPublisher(viewModel.$loadingState)) { value in
            if case .loaded(let flow) = value, flow == self.flow1 {
                return true
            }
            return false
        }

        let result = """
        {
            "status": "completed",
            "flow": "",
            "endState": {
                "outcome":"done"
            }
        }
        """

        let stateObj = JSContext()?.evaluateScript("(\(result))")

        let state = CompletedState.createInstance(from: stateObj)!

        viewModel.result = .success(state)

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow2 }

        viewModel.result = .failure(PlayerError.jsConversionFailure)

        await assertPublished(AnyPublisher(viewModel.$loadingState)) { value in
            if case .failed = value {
                return true
            }
            return false
        }

        viewModel.retry()

        await assertPublished(AnyPublisher(viewModel.$loadingState)) {
            if case .retry = $0 {
                return true
            }
            return false
        }

        await viewModel.next(state)

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow2 }
    }

    func testViewModelReset() async throws {
        let flowManager = ConstantFlowManager([flow1, flow2], delay: 0)

        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in})

        await viewModel.next()

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow1 }

        let result = """
        {
            "status": "completed",
            "flow": "",
            "endState": {
                "outcome":"done"
            }
        }
        """

        let stateObj = JSContext()?.evaluateScript("(\(result))")

        let state = CompletedState.createInstance(from: stateObj)!

        viewModel.result = .success(state)

        await assertPublished(AnyPublisher(viewModel.$flow), timeout: 10) { $0 == self.flow2 }

        viewModel.result = .failure(PlayerError.jsConversionFailure)

        await assertPublished(AnyPublisher(viewModel.$loadingState)) { value in
            if case .failed = value {
                return true
            }
            return false
        }

        viewModel.reset()

        await assertPublished(AnyPublisher(viewModel.$loadingState)) {
            if case .idle = $0 {
                return true
            }
            return false
        }

        await viewModel.next()

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow1 }
    }

    func testViewModelErrorFlow() async {
        let flowManager = ConstantFlowManager(["flow1"], delay: 0)

        let completed = expectation(description: "Flows Completed")
        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in})

        await viewModel.next()

        let cancellable = viewModel.$loadingState.sink { (loadingState) in
            guard case .failed = loadingState else { return }
            completed.fulfill()
        }

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 != nil }

        viewModel.result = .failure(.jsConversionFailure)

        await fulfillment(of: [completed], timeout: 2)

        cancellable.cancel()
    }

    func testDefaultTerminate() {
        let flowManager = ConstantFlowManager(["flow1"], delay: 0)

        flowManager.terminate(state: nil)
    }

    func testTerminate() {
        let terminated = XCTestExpectation(description: "terminated with InProgressState")
        let manager = TerminatingManager { _ in
            terminated.fulfill()
        }

        var model: ManagedPlayerViewModel? = ManagedPlayerViewModel(manager: manager, onComplete: {_ in})

        XCTAssertNotNil(model)
        model = nil
        wait(for: [terminated], timeout: 5)
    }

    func testStateHook() {
        let model = ManagedPlayerViewModel(manager: ConstantFlowManager([FlowData.COUNTER]), onComplete: {_ in})

        let player = HeadlessPlayerImpl(plugins: [model])

        player.start(flow: FlowData.COUNTER) { _ in }

        XCTAssertNotNil(model.currentState)

        (player.state as? InProgressState)?.controllers?.flow.transition(with: "next")

        XCTAssertNil(model.currentState)
    }

    func testLoadingStateFailureEmptyFlow() {
        let model = ManagedPlayerViewModel(manager: ConstantFlowManager([FlowData.COUNTER]), onComplete: {_ in})

        model.handleNextState(.flow(""))

        switch model.loadingState {
        case .failed(let error):
            XCTAssertEqual(error as? ManagedPlayerError, ManagedPlayerError.emptyFlow)
        default:
            XCTFail("Should Have entered failed state")
        }
    }

    func testRetryIdleState() {
        let model = ManagedPlayerViewModel(manager: ConstantFlowManager([]), onComplete: {_ in})
        model.handleNextState(.flow(FlowData.COUNTER))

        switch model.loadingState {
        case .loaded(let flow):
            XCTAssertEqual(flow, FlowData.COUNTER)
        default:
            XCTFail("Should have entered loaded state")
        }

        model.retry()
        switch model.loadingState {
        case .idle:
            XCTAssertTrue(true)
        default:
            XCTFail("Should have entered idle state")
        }
    }
}

class TerminatingManager: FlowManager {
    func next(_ result: CompletedState?) async throws -> NextState {
        return .flow(FlowData.COUNTER)
    }
    private var terminateFn: (InProgressState?) -> Void
    init(_ terminate: @escaping (InProgressState?) -> Void ) {
        self.terminateFn = terminate
    }
    public func terminate(state: InProgressState?) {
        self.terminateFn(state)
    }
}

internal extension XCTestCase {
    @discardableResult
    func assertPublished<T>(_ publisher: AnyPublisher<T, Never>, timeout: Double = 2, condition: @escaping(T) -> Bool) async -> Cancellable {
        let expectation = XCTestExpectation(description: "Waiting for publisher to emit value")
        let cancel = publisher.sink { (value) in
            guard condition(value) else { return }
            expectation.fulfill()
        }
        await fulfillment(of: [expectation], timeout: timeout)
        return cancel
    }
}
