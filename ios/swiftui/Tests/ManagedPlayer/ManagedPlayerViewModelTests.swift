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
@testable import PlayerUISwiftUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUITestUtilitiesCore

class ManagedPlayerViewModelTests: XCTestCase {
    let flow1 = FlowData.COUNTER
    let flow2 = FlowData.COUNTER.replacingOccurrences(of: "counter-flow", with: "counter-flow-2")

    func testViewModelSuccessFlow() async throws {
        let flowManager = ConstantFlowManager([flow1], delay: 0)

        let completed = expectation(description: "Flows Completed")
        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in
            completed.fulfill()
        })

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow1 } action: { await viewModel.next() }

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


        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow1 } action: { await viewModel.next() }

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

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow2 } action: { viewModel.result = .success(state) }
    }

    func testViewModelManagerError() async {
        struct ErrorFlowManager: FlowManager {
            func next(_: CompletedState?) async throws -> NextState {
                throw PlayerError.jsConversionFailure
            }
        }
        let flowManager = ErrorFlowManager()

        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in })

        await assertPublished(AnyPublisher(viewModel.$loadingState), condition: { state in
            guard
                case .failed(let error) = state,
                let _ = error as? PlayerError
            else { return false }

            return true
        }) {
            await viewModel.next()
        }

        XCTAssertFalse(viewModel.loadingState.isLoaded)
    }

    func testViewModelRetry() async throws {
        let flowManager = ConstantFlowManager([flow1, flow2], delay: 0)

        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in})

        await assertPublished(AnyPublisher(viewModel.$loadingState)) { value in
            if case .loaded(let flow) = value, flow == self.flow1 {
                return true
            }
            return false
        } action: {
            await viewModel.next()
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

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow2 } action: { viewModel.result = .success(state) }

        await assertPublished(AnyPublisher(viewModel.$loadingState)) { value in
            if case .failed = value {
                return true
            }
            return false
        } action: {
            viewModel.result = .failure(PlayerError.jsConversionFailure)
        }

        await assertPublished(AnyPublisher(viewModel.$loadingState)) {
            if case .retry = $0 {
                return true
            }
            return false
        } action: {
            viewModel.retry()
        }

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow2 } action: { await viewModel.next(state) }
    }

    func testViewModelReset() async throws {
        let flowManager = ConstantFlowManager([flow1, flow2], delay: 0)

        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in})

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow1 } action: { await viewModel.next() }

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

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow2 } action: { viewModel.result = .success(state) }

        await assertPublished(AnyPublisher(viewModel.$loadingState)) { value in
            if case .failed = value {
                return true
            }
            return false
        } action: {
            viewModel.result = .failure(PlayerError.jsConversionFailure)
        }

        await assertPublished(AnyPublisher(viewModel.$loadingState)) {
            if case .idle = $0 {
                return true
            }
            return false
        } action: {
            viewModel.reset()
        }

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 == self.flow1 } action: { await viewModel.next() }
    }

    func testViewModelErrorFlow() async {
        let flowManager = ConstantFlowManager(["flow1"], delay: 0)

        let completed = expectation(description: "Flows Completed")
        let viewModel = ManagedPlayerViewModel(manager: flowManager, onComplete: {_ in})

        await assertPublished(AnyPublisher(viewModel.$flow)) { $0 != nil } action: { await viewModel.next() }

        let cancellable = viewModel.$loadingState.sink { (loadingState) in
            guard case .failed = loadingState else { return }
            completed.fulfill()
        }

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

        do {
            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "next")
        } catch {
            XCTFail("Transition with 'next' Failed")
        }

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

    func testNextUpdatesLoadingStateOnMainNoFlows() async throws {
        let model = ManagedPlayerViewModel(manager: ConstantFlowManager([], delay: 1/60), onComplete: {_ in})
        try await checkNextUpdatesLoadingStateOnMain(model: model, expectedStateChangeCount: 1)
    }

    func testNextUpdatesLoadingStateOnMainOneFlow() async throws {
        let model = ManagedPlayerViewModel(manager: ConstantFlowManager(["abc"], delay: 1/60), onComplete: {_ in})
        try await checkNextUpdatesLoadingStateOnMain(model: model, nextCallCount: 2, expectedStateChangeCount: 4)
    }

    func testNextUpdatesLoadingStateOnMainMultipleFlows() async throws {
        let model = ManagedPlayerViewModel(manager: ConstantFlowManager(["abc", "def", "ghi"], delay: 1/60), onComplete: {_ in})
        try await checkNextUpdatesLoadingStateOnMain(model: model, nextCallCount: 3, expectedStateChangeCount: 6)
    }

    func testThrowingNextUpdatesLoadingStateOnMain() async throws {
        let model = ManagedPlayerViewModel(manager: ThrowingFlowManager(), onComplete: {_ in})
        try await checkNextUpdatesLoadingStateOnMain(model: model, expectedStateChangeCount: 2)
    }

    private func checkNextUpdatesLoadingStateOnMain(model: ManagedPlayerViewModel, nextCallCount: Int = 1, expectedStateChangeCount: Int) async throws {
        let expect = (0..<expectedStateChangeCount).map {
            expectation(description: "\($0)")
        }
        var stateChangeCount = 0
        // the publisher emits immediately, we only care about changes
        // from the `next` call(s) below, drop the first state received
        let cancellable = model.$loadingState.dropFirst().sink { state in
            XCTAssertTrue(Thread.isMainThread)
            XCTAssertTrue(stateChangeCount < expect.count)
            stateChangeCount += 1
            expect[stateChangeCount - 1].fulfill()
        }
        await withTaskGroup(of: Void.self) { group in
            group.addTask {
                for _ in (0..<nextCallCount) {
                    await model.next()
                }
            }
            for await _ in group {}
        }
        await fulfillment(of: expect)
        XCTAssertEqual(stateChangeCount, expectedStateChangeCount)
        cancellable.cancel()
    }

    private struct ThrowingFlowManager: FlowManager {
        func next(_: CompletedState?) async throws -> NextState {
            throw Errors.failed
        }

        enum Errors: Error {
            case failed
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
    func assertPublished<T>(_ publisher: AnyPublisher<T, Never>, condition: @escaping (T) -> Bool, action: () async -> Void) async {
        let expectation = XCTestExpectation(description: "Waiting for publisher to emit value")
        let cancel = publisher.sink { (value) in
            guard condition(value) else { return }
            expectation.fulfill()
        }
        defer { cancel.cancel() }
        await action()
        await fulfillment(of: [expectation], timeout: 5)
        cancel.cancel()
    }
}
