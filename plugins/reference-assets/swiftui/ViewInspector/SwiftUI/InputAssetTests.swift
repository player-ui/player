//
//  InputAssetTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/9/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import Combine
import SwiftUI
import ViewInspector
import XCTest
import JavaScriptCore

@testable import PlayerUI
@testable import PlayerUITestUtilities
@testable import PlayerUIReferenceAssets
@testable import PlayerUISwiftUI


class InputAssetTests: SwiftUIAssetUnitTestCase {
    override func register(registry: SwiftUIRegistry) {
        registry.register("input", asset: InputAsset.self)
        registry.register("text", asset: TextAsset.self)
    }

    func testDecoding() async throws {
        let json = """
        {
          "id": "input",
          "type": "input",
          "binding": "textInput",
          "placeholder": "Enter Some Text",
          "label": {
            "asset": {
              "id": "input-label",
              "type": "text",
              "value": "{{textInput}}"
            }
          }
        }
        """

        guard let input: InputAsset = await getAsset(json) else { return XCTFail("could not get asset") }

        _ = try input.view.inspect().find(InputAssetView.self).vStack().textField(1)
    }

    func testViewModelUpdating() {
        var bag = Set<AnyCancellable>()
        let val = context.evaluateScript("('a')")
        let modelRef = ModelReference(rawValue: val)

        let setExpectation = expectation(description: "Model Set called")
        guard
            let wrapper: WrappedFunction<Void> = getWrappedFunction(completion: { setExpectation.fulfill() })
        else { return XCTFail("could not create function") }

        let data = InputData(
            id: "input",
            type: "input",
            placeholder: nil,
            value: modelRef,
            label: nil,
            set: wrapper,
            dataType: nil,
            validation: nil
        )

        let model = InputAssetViewModel(data, userInfo: [:])
        let update1expect = expectation(description: "Initial value")
        model.$data.sink { (data) in
            guard data.value?.stringValue == "a" else { return }
            update1expect.fulfill()
        }.store(in: &bag)

        wait(for: [update1expect], timeout: 3)

        let val2 = context.evaluateScript("('b')")
        let modelRef2 = ModelReference(rawValue: val2)

        let newData = InputData(
            id: "input",
            type: "input",
            placeholder: nil,
            value: modelRef2,
            label: nil,
            set: wrapper,
            dataType: nil,
            validation: nil
        )

        model.data = newData

        let update2expect = expectation(description: "Updated value")
        model.$data.sink { (data) in
            guard data.value?.stringValue == "b" else { return }
            update2expect.fulfill()
        }.store(in: &bag)

        wait(for: [update2expect], timeout: 3)

        model.set()

        wait(for: [setExpectation], timeout: 1)
    }

    func testViewNoLabel() throws {
        let val = context.evaluateScript("('a')")
        let modelRef = ModelReference(rawValue: val)
        let data = InputData(id: "input", type: "input", placeholder: nil, value: modelRef, label: nil, set: nil, dataType: nil, validation: nil)

        let model = InputAssetViewModel(data, userInfo: [:])

        let view = InputAssetView(model: model)

        let stack = try view.inspect().vStack()

        let field = try stack.textField(1)

        let background = try field.background()

        XCTAssertEqual(Color(red: 0.729, green: 0.745, blue: 0.773), try background.foregroundColor())
    }

    func testViewWithLabel() async throws {
        guard
            let label: TextAsset = await getAsset("{\"id\": \"text\", \"type\": \"text\", \"value\":\"hello world\"}")
        else { return XCTFail("could not get asset") }
        let val = context.evaluateScript("('a')")
        let modelRef = ModelReference(rawValue: val)
        let data = InputData(
            id: "input",
            type: "input",
            placeholder: nil,
            value: modelRef,
            label: WrappedAsset(forAsset: label),
            set: nil,
            dataType: nil,
            validation: nil
        )

        let model = InputAssetViewModel(data, userInfo: [:])

        let view = await InputAssetView(model: model)

        let stack = try view.inspect().vStack()

        let text = try stack.anyView(0).find(TextAssetView.self).text()
        XCTAssertEqual("hello world", try text.string())
        _ = try stack.textField(1)
    }

    func testViewWithValidation() throws {
        let dismissExpectation = expectation(description: "Dismiss called")
        let validationDataString = "{\"severity\": \"warning\", \"message\":\"something should be done\"}"
        guard
            let validationObject = context.evaluateScript("(\(validationDataString))")
        else { return XCTFail("could not get validation object") }

        let validation = try JSONDecoder().decode(ValidationData.self, from: validationObject)
            .withDismiss(context: context, dismiss: {
                dismissExpectation.fulfill()
            })

        let val = context.evaluateScript("('a')")
        let modelRef = ModelReference(rawValue: val)
        let data = InputData(
            id: "input",
            type: "input",
            placeholder: nil,
            value: modelRef,
            label: nil,
            set: nil,
            dataType: nil,
            validation: validation
        )

        let model = InputAssetViewModel(data, userInfo: [:])

        let view = InputAssetView(model: model)

        let stack = try view.inspect().vStack()

        let field = try stack.textField(1)
        let background = try field.background()

        XCTAssertEqual(ValidationSeverity.warning.color, try background.foregroundColor())

        let validationview = try stack.view(ValidationView.self, 2)

        let dismiss = try validationview.hStack().tupleView(2).button(1)

        try dismiss.tap()

        wait(for: [dismissExpectation], timeout: 1)
    }

    func testTextfieldEditingFalse() throws {
        let setExpectation = expectation(description: "Model Set called")
        guard
            let wrapper: WrappedFunction<Void> = getWrappedFunction(completion: { setExpectation.fulfill() })
        else { return XCTFail("could not create function") }

        let data = InputData(id: "input", type: "input", placeholder: nil, value: nil, label: nil, set: wrapper, dataType: nil, validation: nil)

        let model = InputAssetViewModel(data, userInfo: [:])

        let view = InputAssetView(model: model)

        let stack = try view.inspect().vStack()

        _ = try stack.textField(1)

        model.text = "new text"
        model.set()

        wait(for: [setExpectation], timeout: 1)
    }

    func testTextfieldCommit() throws {
        let setExpectation = expectation(description: "Model Set called")
        guard
            let wrapper: WrappedFunction<Void> = getWrappedFunction(completion: { setExpectation.fulfill() })
        else { return XCTFail("could not create function") }

        let data = InputData(id: "input", type: "input", placeholder: nil, value: nil, label: nil, set: wrapper, dataType: nil, validation: nil)

        let model = InputAssetViewModel(data, userInfo: [:])

        let view = InputAssetView(model: model)

        let stack = try view.inspect().vStack()

        model.text = "new text"

        // When iOS 15 is the minimum and we can use @FocusState in the InputAsset
        // we can update and call through ViewInspector for the new APIs
        // for some reason it only ever calls it with true as it stands
        view.onEditingChanged(false)

        wait(for: [setExpectation], timeout: 1)
    }
}

extension ValidationData {
    func withDismiss(context: JSContext, dismiss: @escaping () -> Void) -> ValidationData {
        let dismissCallback: @convention(block) (JSValue) -> JSValue = { value in
            dismiss()
            return value
        }
        let jsDismiss = JSValue(object: dismissCallback, in: context)
        return ValidationData(severity: severity, message: message, dismiss: WrappedFunction(rawValue: jsDismiss))
    }
}
