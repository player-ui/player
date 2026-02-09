//
//  ManagedPlayerTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 4/5/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//
import Foundation
import XCTest
import SwiftUI
@preconcurrency import Combine
import ViewInspector
import JavaScriptCore

@testable import PlayerUI
@testable import PlayerUISwiftUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUIReferenceAssets

extension Inspection: @retroactive @unchecked Sendable {}
extension Inspection: @retroactive InspectionEmissary { }

class ManagedPlayer14Tests: XCTestCase {
    func testLoadingView() throws {
        let viewModel = ManagedPlayerViewModel(manager: NeverLoad(), onComplete: {_ in })
        let player = ManagedPlayer(plugins: [], context: .init(), viewModel: viewModel, fallback: { _ in Text("Error")}, loading: { Text("Loading")})

        let playerView = try player.inspect()

        try playerView.find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        waitOnChange(viewModel.$loadingState.eraseToAnyPublisher()) { $0 == ManagedPlayerViewModel.LoadingState.loading }

        let text = try playerView.find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).zStack(0).text(0)

        XCTAssertEqual("Loading", try text.string())
    }

    func testFallbackView() throws {
        let viewModel = ManagedPlayerViewModel(manager: ErrorLoaded(), onComplete: {_ in })
        let player = ManagedPlayer(plugins: [], context: .init(), viewModel: viewModel, fallback: { _ in Text("Error")}, loading: { Text("Loading")})

        let playerView = try player.inspect()

        try playerView.find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        waitOnChange(viewModel.$loadingState.eraseToAnyPublisher()) {
            guard case .failed = $0 else { return false }
            return true
        }

        let text = try playerView.find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).text(0).string()
        XCTAssertEqual(text, "Error")
    }

    @MainActor func testFlowLoadsWithAnimation() throws {
        let player = ManagedPlayer(
            plugins: [ReferenceAssetsPlugin()],
            flowManager: AlwaysLoaded(),
            context: .init(),
            onComplete: {_ in},
            fallback: {(_) in},
            loading: {
                Text("Loading")
            }
        )

        try player.inspect().find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 3) { view in
            let view = try view
                .find(ManagedPlayer14<Text, EmptyView>.self)
                .vStack()
                .group(0)
                .zStack(0)
                .find(SwiftUIPlayer.self)
                .vStack()
                .first?
                .anyView()
                .scrollViewReader()
                .scrollView()
            XCTAssertNotNil(view)
        }

        wait(for: [exp2], timeout: 10)

        ViewHosting.expel()
    }

    func testLoadingViewBeforeActionFlow() throws {
        let viewModel = ManagedPlayerViewModel(manager: ActionLoaded(), onComplete: {_ in })
        let player = ManagedPlayer(plugins: [], context: .init(), viewModel: viewModel, fallback: { _ in Text("Error")}, loading: { Text("Loading Flow")})

        let playerView = try player.inspect()

        try playerView.find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        waitOnChange(viewModel.$loadingState.eraseToAnyPublisher()) { $0 == ManagedPlayerViewModel.LoadingState.loading }

        let text = try playerView.find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).zStack(0).text(0)

        XCTAssertEqual("Loading Flow", try text.string())
    }

    @MainActor func testFlowLoadsWithSuppliedScrollPlugin() throws {
        let player = ManagedPlayer(
            plugins: [ReferenceAssetsPlugin(), ScrollPlugin()],
            flowManager: AlwaysLoaded(),
            context: .init(),
            handleScroll: false, // Passed in ScrollPlugin should ignore this
            onComplete: {_ in},
            fallback: {(_) in},
            loading: {
                Text("Loading")
            }
        )

        try player.inspect().find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 3) { view in
            let view = try view
                .find(ManagedPlayer14<Text, EmptyView>.self)
                .vStack()
                .group(0)
                .zStack(0)
                .find(SwiftUIPlayer.self)
                .vStack()
                .first?
                .anyView()
                .scrollViewReader()
                .scrollView()
            XCTAssertNotNil(view)
        }

        wait(for: [exp2], timeout: 10)

        ViewHosting.expel()
    }

    @MainActor func testFlowLoadsWithoutScrollView() throws {
        let player = ManagedPlayer(
            plugins: [ReferenceAssetsPlugin()],
            flowManager: AlwaysLoaded(),
            context: .init(),
            handleScroll: false,
            onComplete: {_ in},
            fallback: {(_) in},
            loading: {
                Text("Loading")
            }
        )

        try player.inspect().find(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 5) { view in
            let view = try view
                .find(ManagedPlayer14<Text, EmptyView>.self)
                .vStack()
                .group(0)
                .zStack(0)
                .find(SwiftUIPlayer.self)
                .vStack()
                .first?
                .anyView()
                .view(ActionAssetView.self)
            XCTAssertNotNil(view)
        }

        wait(for: [exp2], timeout: 10)

        ViewHosting.expel()
    }
    
    func testSameFlowCanBeReloadedAfterCompletion() async throws {
        // Use same flow twice to simulate flow reuse scenario
        let flow = FlowData.simpleEndFlow
        let flowManager = SameFlowReloadManager(flows: [flow, flow])
        
        var loadedCount = 0
        var cancellables = Set<AnyCancellable>()
        
        let expectBothFlowsLoaded = XCTestExpectation(description: "Both flows loaded")
        expectBothFlowsLoaded.expectedFulfillmentCount = 2
        
        let viewModel = ManagedPlayerViewModel(manager: flowManager) { _ in }
        
        viewModel.$loadingState.sink { state in
            if case .loaded = state {
                loadedCount += 1
                expectBothFlowsLoaded.fulfill()
            }
        }.store(in: &cancellables)
        
        // Load first flow
        await viewModel.next()
        
        // Wait for first flow to be loaded
        try await Task.sleep(nanoseconds: 200_000_000)
        
        XCTAssertEqual(loadedCount, 1, "First flow should be loaded")
        
        // Simulate flow completion
        let result = """
        { "status": "completed", "flow": { "id": "simple-end-flow" }, "endState": { "outcome": "done" } }
        """
        if let completedState = CompletedState.createInstance(from: JSContext()!.evaluateScript("(\(result))")) {
            viewModel.result = .success(completedState)
        }
        
        // Wait for second flow to load
        await fulfillment(of: [expectBothFlowsLoaded], timeout: 5)
        
        XCTAssertEqual(loadedCount, 2,
            "Second flow should be loaded - this FAILS without the .onChange fix that calls context.unload()")
        
        cancellables.removeAll()
    }
    
    /// Test that same flow can be loaded twice without issues
        func testSameFlowCanBeLoadedTwice() async throws {
        let flow = FlowData.COUNTER
        // Create a flow manager that returns the same flow twice
        let flowManager = SameFlowReloadManager(flows: [flow, flow])
        
        var cancellables = Set<AnyCancellable>()
        var loadedFlowCount = 0
        
        let allFlowsLoaded = XCTestExpectation(description: "Both flows loaded")
        allFlowsLoaded.expectedFulfillmentCount = 2
        
        let viewModel = ManagedPlayerViewModel(manager: flowManager) { _ in }
        
        viewModel.$loadingState.sink { state in
            if case .loaded = state {
                loadedFlowCount += 1
                allFlowsLoaded.fulfill()
            }
        }.store(in: &cancellables)
        
        // Load first flow
        await viewModel.next()
        
        // Wait a bit for flow to be loaded
        try await Task.sleep(nanoseconds: 200_000_000)
        
        XCTAssertEqual(loadedFlowCount, 1, "First flow should be loaded")
        
        // Simulate first flow completion
        let result = """
        {
            "status": "completed",
            "flow": "counter-flow",
            "endState": {"outcome":"done"}
        }
        """
        let jsContext = JSContext()!
        let jsValue = jsContext.evaluateScript("(\(result))")
        if let completedState = CompletedState.createInstance(from: jsValue) {
            viewModel.result = .success(completedState)
        }
        
        // Wait for second flow
        await fulfillment(of: [allFlowsLoaded], timeout: 5)
        
        XCTAssertEqual(loadedFlowCount, 2, "Second flow should be loaded after first completion")
        
        cancellables.removeAll()
    }
}

class NeverLoad: FlowManager {
    func next(_ result: CompletedState?) async throws -> NextState {
        try await Task.sleep(nanoseconds: 1_000_000_000 * 5)
        return .flow("")
    }
}

class ErrorLoaded: FlowManager {
    init() {}
    func next(_ result: CompletedState?) async throws -> NextState {
        try await Task.sleep(nanoseconds: 500_000_000)
        throw PlayerError.jsConversionFailure
    }
}

class AlwaysLoaded: FlowManager {
    init() {}
    func next(_ result: CompletedState?) async throws -> NextState {
        return .flow(FlowData.COUNTER)
    }
}

class ActionLoaded: FlowManager {
    init() {}

    func next(_ result: CompletedState?) async throws -> NextState {
        try await Task.sleep(nanoseconds: 1_000_000_000 * 5)
        return .flow(FlowData.flowAction)
    }
}

extension XCTestCase {
    @discardableResult
    func waitOnChange<T>(_ publisher: AnyPublisher<T, Never>, timeout: Double = 5, condition: @escaping (T) -> Bool) -> Cancellable {
        let expectation = XCTestExpectation(description: "Waiting for publisher to emit value")
        let cancel = publisher.sink { (value) in
            guard condition(value) else { return }
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: timeout)
        return cancel
    }
}

// MARK: - Flow Reload Tests
class SameFlowReloadManager: FlowManager {
    private var callCount = 0
    private let flows: [String]
    var loadedFlowCount: Int { callCount }
    
    init(flows: [String]) {
        self.flows = flows
    }
    
    func next(_ result: CompletedState?) async throws -> NextState {
        defer { callCount += 1 }
        
        if callCount < flows.count {
            // Small delay to allow state transitions
            try await Task.sleep(nanoseconds: 100_000_000)
            return .flow(flows[callCount])
        } else {
            return .finished
        }
    }
}
