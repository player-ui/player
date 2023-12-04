//
//  SwiftUIPlayerTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/9/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import ViewInspector
import SwiftUI
import Combine
import JavaScriptCore

@testable import PlayerUI
@testable import PlayerUISwiftUI
@testable import PlayerUIInternalTestUtilities

extension SwiftUIPlayer: Inspectable {}

class SwiftUIPlayerTests: XCTestCase {
    func testFlowLoads() throws {
        var bag = Set<AnyCancellable>()
        let context = SwiftUIPlayer.Context { JSContext() }
        let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [], context: context)

        let initialLoad = expectation(description: "Root loaded")
        player.assetRegistry.$root.sink { (asset) in
            guard asset != nil else { return }
            initialLoad.fulfill()
        }.store(in: &bag)

        let view = try player.inspect().vStack().first?.anyView()
        XCTAssertNotNil(view)

        wait(for: [initialLoad], timeout: 5)

        XCTAssertTrue(context.isLoaded)
    }

    func testbadDecodeGoesToErrorState() throws {
        var result: Result<CompletedState, PlayerError>?

        let failed = XCTestExpectation(description: "Error State reached")

        let binding = Binding<Result<CompletedState, PlayerError>?>(get: {result}, set: {
            result = $0
            guard
                case let .failure(error) = $0,
                case let .promiseRejected(errorState) = error,
                errorState.error.contains("Key not found at coding path label.asset.value")
            else { return }
            failed.fulfill()
        })
        let context = SwiftUIPlayer.Context { JSContext() }
        _ = SwiftUIPlayer(
            flow: FlowData.COUNTER.replacingOccurrences(of: "value\"", with: "valu\""),
            plugins: [ReferenceAssetsPlugin()],
            result: binding,
            context: context
        )
    }

    func testViewHook() throws {
        var bag = Set<AnyCancellable>()
        let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [ViewHookPlugin()])

        let initialLoad = expectation(description: "Root loaded")
        player.assetRegistry.$root.sink { (asset) in
            guard asset != nil else { return }
            initialLoad.fulfill()
        }.store(in: &bag)
        wait(for: [initialLoad], timeout: 3)

        let color = try player.body.inspect().vStack().first?.anyView().anyView().foregroundColor()

        XCTAssertEqual(Color.black, color)
    }
}

class ViewHookPlugin: NativePlugin {
    var pluginName: String = "ViewHookPlugin"

    func apply<P>(player: P) where P: HeadlessPlayer {
        guard let swiftuiplayer = player as? SwiftUIPlayer else { return }
        swiftuiplayer.hooks?.view.tap(name: pluginName) { view in
            return AnyView(view.foregroundColor(.black))
        }
    }
}
