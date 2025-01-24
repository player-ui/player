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
import Combine
import ViewInspector

@testable import PlayerUI
@testable import PlayerUISwiftUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUIReferenceAssets

extension Inspection: InspectionEmissary { }

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

    func testFlowLoadsWithAnimation() throws {
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

    func testFlowLoadsWithSuppliedScrollPlugin() throws {
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

    func testFlowLoadsWithoutScrollView() throws {
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
