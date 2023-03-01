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

extension ManagedPlayer: Inspectable {}
extension Inspection: InspectionEmissary where V: Inspectable { }

@available(iOS 14, *)
extension ManagedPlayer14: Inspectable {}

@available(iOS 14, *)
class ManagedPlayer14Tests: ViewInspectorTestCase {
    func testLoadingView() throws {
        let viewModel = ManagedPlayerViewModel(manager: NeverLoad(), onComplete: {_ in })
        let player = ManagedPlayer(plugins: [], context: .init(), viewModel: viewModel, fallback: { _ in Text("Error")}, loading: { Text("Loading")})

        let playerView = try player.inspect()

        try playerView.anyView().view(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        waitOnChange(viewModel.$loadingState.eraseToAnyPublisher()) { $0 == ManagedPlayerViewModel.LoadingState.loading }

        let text = try playerView.anyView().view(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).text(0)

        XCTAssertEqual("Loading", try text.string())
    }

    func testFallbackView() throws {
        let viewModel = ManagedPlayerViewModel(manager: ErrorLoaded(), onComplete: {_ in })
        let player = ManagedPlayer(plugins: [], context: .init(), viewModel: viewModel, fallback: { _ in Text("Error")}, loading: { Text("Loading")})

        let playerView = try player.inspect()

        try playerView.anyView().view(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        waitOnChange(viewModel.$loadingState.eraseToAnyPublisher()) {
            guard case .failed = $0 else { return false }
            return true
        }

        let text = try playerView.anyView().view(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).text(0).string()
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

        try player.inspect().anyView().view(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 3) { view in
            let view = try view.anyView()
                .view(ManagedPlayer14<Text, EmptyView>.self)
                .vStack()
                .group(0)
                .view(SwiftUIPlayer.self, 0)
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

        try player.inspect().anyView().view(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 3) { view in
            let view = try view.anyView()
                .view(ManagedPlayer14<Text, EmptyView>.self)
                .vStack()
                .group(0)
                .view(SwiftUIPlayer.self, 0)
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

        try player.inspect().anyView().view(ManagedPlayer14<Text, EmptyView>.self).vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 3) { view in
            let view = try view.anyView()
                .view(ManagedPlayer14<Text, EmptyView>.self)
                .vStack()
                .group(0)
                .view(SwiftUIPlayer.self, 0)
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

extension ManagedPlayer13: Inspectable {}

@available(iOS 14, *)
class ManagedPlayer13Tests: XCTestCase {
    func testLoadingView() throws {
        let viewModel = ManagedPlayerViewModel(
            manager: NeverLoad(),
            onComplete: {_ in}
        )
        let player = ManagedPlayer13(
            viewModel: viewModel,
            plugins: [],
            context: .init(),
            fallback: {(_) in},
            loading: {
                Text("Loading")
            }
        )

        let playerView = try player.inspect()

        try playerView.vStack().group(0).color(0).callOnAppear()

        waitOnChange(viewModel.$loadingState.eraseToAnyPublisher()) { $0 == ManagedPlayerViewModel.LoadingState.loading }

        let text = try playerView.vStack().group(0).text(0)

        XCTAssertEqual("Loading", try text.string())

    }

    func testFallbackView() throws {
        let viewModel = ManagedPlayerViewModel(
            manager: ErrorLoaded(),
            onComplete: {_ in}
        )
        let player = ManagedPlayer13(
            viewModel: viewModel,
            plugins: [],
            context: .init(),
            fallback: {(_) in
                Text("Error")
            }, loading: {
                Text("Loading")
            }
        )

        let playerView = try player.inspect()

        try playerView.vStack().group(0).color(0).callOnAppear()

        waitOnChange(viewModel.$loadingState.eraseToAnyPublisher()) {
            guard case .failed = $0 else { return false }
            return true
        }

        let text = try playerView.vStack().group(0).text(0).string()
        XCTAssertEqual(text, "Error")
    }

    func testFlowLoads() throws {
        let player = ManagedPlayer13(
            viewModel: ManagedPlayerViewModel(
                manager: AlwaysLoaded(),
                onComplete: {_ in}
            ),
            plugins: [ReferenceAssetsPlugin()],
            context: .init(),
            fallback: {(_) in},
            loading: {
                Text("Loading")
            }
        )

        try player.inspect().vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 3) { view in
            let view = try view.vStack()
                .group(0)
                .view(SwiftUIPlayer.self, 0)
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
        let player = ManagedPlayer13(
            viewModel: ManagedPlayerViewModel(
                manager: AlwaysLoaded(),
                onComplete: {_ in}
            ),
            plugins: [ReferenceAssetsPlugin(), ScrollPlugin()],
            context: .init(),
            handleScroll: false, // ScrollPlugin passed in should ignore this
            fallback: {(_) in},
            loading: {
                Text("Loading")
            }
        )

        try player.inspect().vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 3) { view in
            let view = try view.vStack()
                .group(0)
                .view(SwiftUIPlayer.self, 0)
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
        let player = ManagedPlayer13(
            viewModel: ManagedPlayerViewModel(
                manager: AlwaysLoaded(),
                onComplete: {_ in}
            ),
            plugins: [ReferenceAssetsPlugin()],
            context: .init(),
            handleScroll: false,
            fallback: {(_) in},
            loading: {
                Text("Loading")
            }
        )

        try player.inspect().vStack().group(0).color(0).callOnAppear()

        ViewHosting.host(view: player)

        let exp2 = player.inspection.inspect(after: 3) { view in
            let view = try view.vStack()
                .group(0)
                .view(SwiftUIPlayer.self, 0)
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
