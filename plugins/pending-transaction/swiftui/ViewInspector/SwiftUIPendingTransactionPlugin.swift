//
//  SwiftUIPendingTransactionPluginTests.swift
//  iOSPlayer
//
//  Created by Zhao Xia Wu on 2023-09-28.
//

import Foundation
import XCTest
import SwiftUI
import ViewInspector
@testable import PlayerUI
@testable import PlayerUISwiftUI
@testable import PlayerUISwiftUIPendingTransactionPlugin

class SwiftUIPendingTransactionPluginTests: XCTestCase {
    func testContextAttachment() throws {
        let player = SwiftUIPlayer(flow: "", plugins: [SwiftUIPendingTransactionPlugin(keyPath: \.transactionContext)])

        guard let view: AnyView = player.hooks?.view.call(AnyView(TestButtons())) else {
            return XCTFail("no view returned from hook")
        }

        // Should be wrapped in 2 anyviews, one for playercontrollers, one for transactionContext
        _ = try view.inspect().anyView().anyView().view(TestButtons.self)
    }

    func testAddPendingTransactionAndCallCommitCallbackSingleNamespace() throws {
        var tree = TestButtons()

        let appear = tree.on(\.didAppear) { view in
            let context = try view.actualView().transactionContext

            _ = try view.find(text: "Button 1")

            try view.find(button: "Button 1").tap()
            _ = try view.find(text: "Button 1 Transaction Registered")

            XCTAssertTrue(context.callbacks[.button1] != nil)

            XCTAssertEqual(context.callbacks[.button1]?.count, 1)

            try view.find(button: "Button 2").tap()
            XCTAssertEqual(context.callbacks.count, 0)

            _ = try view.find(button: "Button 1 Transaction Commited")
        }

        ViewHosting.host(view: tree.environment(\.transactionContext, TransactionContext()))

        wait(for: [appear], timeout: 2)
    }

    func testAddPendingTransactionAndCallCommitCallbackMultipleNamespaces() throws {
        var tree = TestButtons2()

        let appear = tree.on(\.didAppear) { view in
            let context = try view.actualView().transactionContext

            _ = try view.find(text: "Button 1")

            try view.find(button: "Button 1").tap()
            _ = try view.find(text: "Button 1 Transaction Registered")

            XCTAssertEqual(context.callbacks[.button1]?.count, 2)

            _ = try view.find(text: "Button 2")

            try view.find(button: "Button 2").tap()
            _ = try view.find(text: "Button 2 Transaction Registered")

            XCTAssertEqual(context.callbacks[.button2]?.count, 1)

            XCTAssertEqual(context.callbacks.count, 2)

            try view.find(button: "Button 3").tap()
            XCTAssertEqual(context.callbacks.count, 0)

            _ = try view.find(button: "Button 1 Second Transaction Commited")
            _ = try view.find(button: "Button 2 First Transaction Commited")
        }

        ViewHosting.host(view: tree.environment(\.transactionContext, TransactionContext()))

        wait(for: [appear], timeout: 2)
    }
}

extension TestButtons: Inspectable {}
private struct TestButtons: View {
    @Environment(\.transactionContext) var transactionContext

    @State var button1Text = "Button 1"

    internal var didAppear: ((Self) -> Void)?
    var body: some View {
        VStack {
            Button(action: {
                transactionContext.register(.button1) {
                    button1Text = "Button 1 Transaction Commited"
                }

                button1Text = "Button 1 Transaction Registered"

            }, label: {Text(button1Text)}).id("button-1")

            Button(action: {
                // clicking second button will trigger callback registered in first button
                transactionContext.commit(.button1)
                transactionContext.clear(.button1)
            }, label: {Text("Button 2")}).id("button-2")
        }
        .onAppear { didAppear?(self) }
    }
}

extension TestButtons2: Inspectable {}
private struct TestButtons2: View {
    @Environment(\.transactionContext) var transactionContext

    @State var button1Text = "Button 1"
    @State var button2Text = "Button 2"

    internal var didAppear: ((Self) -> Void)?
    var body: some View {
        VStack {
            Button(action: {
                transactionContext.register(.button1) {
                    button1Text = "Button 1 First Transaction Commited"
                }

                transactionContext.register(.button1) {
                    button1Text = "Button 1 Second Transaction Commited"
                }

                button1Text = "Button 1 Transaction Registered"

            }, label: {Text(button1Text)}).id("button-1")

            Button(action: {
                transactionContext.register(.button2) {
                    button2Text = "Button 2 First Transaction Commited"
                }

                button2Text = "Button 2 Transaction Registered"

            }, label: {Text(button2Text)}).id("button-2")

            Button(action: {
                // clicking button 3 will commit transactions registered in button 1 and button 2
                transactionContext.commit([.button1, .button2])
                transactionContext.clear([.button1, .button2])
            }, label: {Text("Button 3")}).id("button3")
        }
        .onAppear { didAppear?(self) }
    }
}

extension PendingTransactionPhases {
    public static let button1 = PendingTransactionPhases(rawValue: "button1")
    public static let button2 = PendingTransactionPhases(rawValue: "button2")
}
