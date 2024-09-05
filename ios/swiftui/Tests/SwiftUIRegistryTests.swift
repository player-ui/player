//
//  SwiftUIRegistryTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/5/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
import Combine
import SwiftUI
@testable import PlayerUI
@testable import PlayerUISwiftUI
@testable import PlayerUILogger
@testable import PlayerUIReferenceAssets

// swiftlint:disable type_body_length file_length
class SwiftUIRegistryTests: XCTestCase {
    let context: JSContext = JSContext()

    func testDuplicateRegistration() {
        let operationSkipped = expectation(description: "Skipped duplicate registration")
        let override = expectation(description: "Asset Overridden")
        operationSkipped.expectedFulfillmentCount = 2
        let logger = TapableLogger()
        logger.logLevel = .trace
        logger.hooks.trace.tap(name: "test", { message in
            guard message.contains("Duplicate Registration skipped for") else { return }
            operationSkipped.fulfill()
        })

        logger.hooks.warn.tap(name: "test", { message in
            guard message.contains("Overriding registration for match") else { return }
            override.fulfill()
        })
        let registry = SwiftUIRegistry(logger: logger)
        registry.register(["type": "action"], for: ActionAsset.self)
        XCTAssertEqual(1, registry.registeredAssets.count)
        registry.register(["type": "action"], for: ActionAsset.self)
        XCTAssertEqual(1, registry.registeredAssets.count)
        registry.register(["type": "text", "metaData": ["role": "someRole"]], for: TextAsset.self)
        XCTAssertEqual(2, registry.registeredAssets.count)
        registry.register(["type": "text", "metaData": ["role": "someRole"]], for: TextAsset.self)
        XCTAssertEqual(2, registry.registeredAssets.count)
        registry.register(["type": "text", "metaData": ["role": "someRole"]], for: ActionAsset.self)
        XCTAssertEqual(2, registry.registeredAssets.count)
        wait(for: [operationSkipped, override], timeout: 5)
    }

    func testDecodeWrappedAsset() {
        let val = context.evaluateScript("({asset: {id: 'someId', type: 'text', value: 'someValue'}})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.partialMatchRegistry = partialMatch

        guard let object = val else { return XCTFail("object should not be nil") }

        do {
            let decoded = try registry.decodeWrapper(object)
            XCTAssertEqual(decoded.asset?.id, "someId")
        } catch {
            XCTFail("unable to decode wrapper")
        }
    }

    func testDecodeWrappedAssetWithAdditionalData() {
        struct TestAddedData: Decodable, Equatable {
            var extra: String
        }

        struct TestData: AssetData {
            var id: String
            var type: String

            var nested: BaseGenericWrappedAsset<MetaData, TestAddedData>?
        }

        class TestNestedAsset: UncontrolledAsset<TestData> {
            override var view: AnyView { AnyView(EmptyView()) }
        }
        let val = context
            .evaluateScript("({asset: {id: 'someId', type: 'nested', nested: {asset: {id: 'someOtherId', type: 'text', value: ''}, extra: 'value'}}})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 1)
        partialMatch.setMapping(assetId: "someOtherId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.register("nested", asset: TestNestedAsset.self)
        registry.partialMatchRegistry = partialMatch

        guard let object = val else { return XCTFail("object should not be nil") }

        do {
            let decoded = try registry.decodeWrapper(object)
            XCTAssertEqual(decoded.asset?.id, "someId")
            guard let asset = decoded.asset as? TestNestedAsset else { return XCTFail("Decoded asset was not TestNestedAsset") }
            XCTAssertEqual(asset.model.data.nested?.additionalData?.extra, "value")
        } catch {
            XCTFail("unable to decode wrapper")
        }
    }

    func testWrappedAssetEquivalence() {
        let asset1 = context.evaluateScript("({asset: {id: 'someId', type: 'text', value: 'someValue'}})")
        let asset2 = context.evaluateScript("({asset: {id: 'someId', type: 'text', value: 'someOtherValue'}})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.partialMatchRegistry = partialMatch

        guard
            let object = asset1,
            let object2 = asset2 else {
                return XCTFail("object should not be nil")
            }

        do {
            let wrapped1 = try registry.decodeWrapper(object)
            let wrapped2 = try registry.decodeWrapper(object2)
            XCTAssertFalse(wrapped1 == wrapped2)
        } catch {
            XCTFail("assets should not be equal")
        }
    }

    func testDecodeRootAsset() throws {
        let val = context.evaluateScript("({id: 'someId', type: 'text', value: 'someValue'})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.partialMatchRegistry = partialMatch

        guard let object = val else { return XCTFail("object should not be nil") }

        let decoded = try registry.decode(object)
        XCTAssertEqual(decoded.id, "someId")
    }

    func testDecodeJSValue() throws {
        let val = context.evaluateScript("({id: 'someId', type: 'text', value: 'someValue'})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.partialMatchRegistry = partialMatch

        XCTAssertNil(registry.root)

        var set = Set<AnyCancellable>()

        let decodedExpectation = expectation(description: "Root Decoded")
        registry.$root.sink { newVal in
            if newVal != nil {
                XCTAssertEqual(newVal?.id, "someId")
                decodedExpectation.fulfill()
            }
        }.store(in: &set)

        try registry.decode(value: val!)

        wait(for: [decodedExpectation], timeout: 1)
    }

    func testDecodeJSValueUpdatesData() throws {
        let val = context.evaluateScript("({id: 'someId', type: 'text', value: 'someValue'})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.partialMatchRegistry = partialMatch

        XCTAssertNil(registry.root)

        var set = Set<AnyCancellable>()

        var root: AnyObject?

        let decodedExpectation = expectation(description: "Root Decoded")
        registry.$root.sink { newVal in
            if root == nil, newVal != nil {
                root = newVal?.modelObject
            } else if root != nil, newVal != nil {
                XCTAssertFalse(root === newVal?.modelObject)
                decodedExpectation.fulfill()
            }
        }.store(in: &set)

        try registry.decode(value: val!)
        try registry.decode(value: val!)

        wait(for: [decodedExpectation], timeout: 1)
    }

    func testDecodeJSValueUpdatesCustomData() throws {
        let val = context.evaluateScript("({id: 'someId', type: 'text', value: 'someValue'})")

        class TestModel: AssetViewModel<TextData> {}

        class SwiftUITestAsset: ControlledAsset<TextData, TestModel> {
            /// A type erased view object
            public override var view: AnyView { AnyView(EmptyView()) }
        }

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: SwiftUITestAsset.self)
        registry.partialMatchRegistry = partialMatch

        XCTAssertNil(registry.root)

        var set = Set<AnyCancellable>()

        var root: AnyObject?

        let decodedExpectation = expectation(description: "Root Decoded")
        registry.$root.sink { newVal in
            if root == nil, newVal != nil {
                root = newVal?.modelObject
            } else if root != nil, newVal != nil {
                XCTAssertTrue(root === newVal?.modelObject)
                decodedExpectation.fulfill()
            }
        }.store(in: &set)

        try registry.decode(value: val!)
        try registry.decode(value: val!)

        wait(for: [decodedExpectation], timeout: 1)
    }

    func testDecodeJSValueReturnsNewAsset() throws {
        let val = context.evaluateScript("({id: 'someId', type: 'text', value: 'someValue'})")
        let val2 = context.evaluateScript("({id: 'someOtherId', type: 'action', value: 'someValue'})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        partialMatch.setMapping(assetId: "someOtherId", index: 1)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.register("action", asset: ActionAsset.self)
        registry.partialMatchRegistry = partialMatch

        XCTAssertNil(registry.root)

        var set = Set<AnyCancellable>()

        var root: SwiftUIAsset?

        let decodedExpectation = expectation(description: "Root Decoded")
        registry.$root.sink { newVal in
            if root == nil, newVal != nil {
                root = newVal
            } else if root != nil, newVal != nil {
                XCTAssertNotEqual(root?.uuid, newVal?.uuid)
                decodedExpectation.fulfill()
            }
        }.store(in: &set)

        try registry.decode(value: val!)
        try registry.decode(value: val2!)

        wait(for: [decodedExpectation], timeout: 1)
    }

    func testDecodeJSValueUpdatesNestedData() throws {
        let val = context.evaluateScript("""
            ({id: 'someId', type: 'action', label: {asset: {id: 'someOtherId', type: 'text', value: 'value1'}}})
        """)

        let val2 = context.evaluateScript("""
            ({id: 'someId', type: 'action', label: {asset: {id: 'someOtherId', type: 'text', value: 'value2'}}})
        """)

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someOtherId", index: 0)
        partialMatch.setMapping(assetId: "someId", index: 1)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.register("action", asset: ActionAsset.self)
        registry.partialMatchRegistry = partialMatch

        XCTAssertNil(registry.root)

        var set = Set<AnyCancellable>()

        var root: AnyObject?

        let decodedExpectation = expectation(description: "Root Decoded")
        registry.$root.sink { newVal in
            if root == nil, newVal != nil {
                root = newVal?.modelObject
            } else if root != nil, newVal != nil {
                XCTAssertFalse(root === newVal?.modelObject)
                root = newVal?.modelObject
                decodedExpectation.fulfill()
            }
        }.store(in: &set)

        try registry.decode(value: val!)
        try registry.decode(value: val2!)

        wait(for: [decodedExpectation], timeout: 1)

        guard
            let action = root as? AssetViewModel<ActionData>,
            let text = action.data.label?.asset as? TextAsset
        else { return XCTFail("unable to decode asset") }

        XCTAssertEqual(text.model.data.value.stringValue, "value2")

    }

    func testDecodeJSValueUpdatesNestedArrayData() throws {
        let val = context.evaluateScript("""
            ({id: 'someId', type: 'collection', values: [{asset:{id: 'someOtherId', type: 'text', value: 'value1'}}]})
        """)

        let val2 = context.evaluateScript("""
            ({id: 'someId', type: 'collection', values: [{asset: {id: 'someOtherId', type: 'text', value: 'value2'}}]})
        """)

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someOtherId", index: 0)
        partialMatch.setMapping(assetId: "someId", index: 1)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.register("collection", asset: CollectionAsset.self)
        registry.partialMatchRegistry = partialMatch

        XCTAssertNil(registry.root)

        var set = Set<AnyCancellable>()

        var root: AnyObject?

        let decodedExpectation = expectation(description: "Root Decoded")
        registry.$root.sink { newVal in
            if root == nil, newVal != nil {
                root = newVal?.modelObject
            } else if root != nil, newVal != nil {
                XCTAssertFalse(root === newVal?.modelObject)
                root = newVal?.modelObject
                decodedExpectation.fulfill()
            }
        }.store(in: &set)

        try registry.decode(value: val!)
        try registry.decode(value: val2!)

        wait(for: [decodedExpectation], timeout: 1)

        guard
            let action = root as? AssetViewModel<CollectionData>,
            let text = action.data.values.first??.asset as? TextAsset
        else { return XCTFail("unable to decode asset") }

        XCTAssertEqual(text.model.data.value.stringValue, "value2")
    }

    // swiftlint:disable function_body_length
    func testDecodeJSValueDoesNotUpdateAssetsWithMatchingIdentifiers() throws {
        let jsString = """
            ({
                id: 'someId',
                type: 'collection',
                values: [{
                        asset: {id: 'someOtherId-1', type: 'text', value: 'value1'}
                    }, {
                        asset: {id: 'someOtherId-2', type: 'text', value: 'value2'}
                }]
            })
        """

        guard let jsValue = context.evaluateScript(jsString) else {
            return XCTFail("could not create JSValue")
        }

        let updatedJSString = jsString
            .replacingOccurrences(of: "value1", with: "value3")
            .replacingOccurrences(of: "value2", with: "value4")
        guard let updatedJSValue = context.evaluateScript(updatedJSString) else {
            return XCTFail("could not create JSValue")
        }

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someOtherId-1", index: 0)
        partialMatch.setMapping(assetId: "someOtherId-2", index: 0)
        partialMatch.setMapping(assetId: "someId", index: 1)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("text", asset: TextAsset.self)
        registry.register("collection", asset: CollectionAsset.self)
        registry.partialMatchRegistry = partialMatch

        XCTAssertNil(registry.root)

        var root: SwiftUIAsset?
        let waitForRoot = { (expression: () throws -> Void) in
            let decodedExpectation = self.expectation(description: "Root Decoded")
            let subscription = registry.$root.dropFirst().sink { newVal in
                guard newVal != nil else { return }
                root = newVal
                decodedExpectation.fulfill()
            }
            try expression()
            self.wait(for: [decodedExpectation], timeout: 1)
            subscription.cancel()
        }

        try waitForRoot {
            try registry.decode(value: jsValue)
        }
        guard let values = (root as? CollectionAsset)?.model.data.values else {
            return XCTFail("value should not be nil")
        }
        guard 2 == values.count else {
            return XCTFail("incorrect number of values")
        }
        let text1 = values[0]?.asset as? TextAsset
        XCTAssertEqual("value1", text1?.model.data.value.stringValue)
        let text2 = values[1]?.asset as? TextAsset
        XCTAssertEqual("value2", text2?.model.data.value.stringValue)

        try waitForRoot {
            try registry.decode(value: updatedJSValue)
        }
        guard let updatedValues = (root as? CollectionAsset)?.model.data.values else {
            return XCTFail("unable to get updated values")
        }
        guard 2 == updatedValues.count else {
            return XCTFail("incorrect number of updated values")
        }
        let updatedText1 = updatedValues[0]?.asset as? TextAsset
        XCTAssertEqual("value3", updatedText1?.model.data.value.stringValue)
        let updatedText2 = updatedValues[1]?.asset as? TextAsset
        XCTAssertEqual("value4", updatedText2?.model.data.value.stringValue)

        // Because they share matching IDs we expect both references to be updated.
        XCTAssertFalse(updatedText1 === text1)
        XCTAssertFalse(updatedText2 === text2)
    }

    // swiftlint:disable function_body_length
    func testVisitDescendantWrappedAssetsOf() throws {
        let jsString = """
            ({
                id: 'view-1',
                type: 'collection',
                label: {
                    asset: {
                        id: 'collection-label',
                        type: 'text',
                        value: 'Hello'
                    }
                },
                values: [{
                    asset: {
                        id: 'choice-1',
                        label: {
                            asset: {
                                id: 'choice-1-label',
                                type: 'text',
                                value: 'Please select a pet'
                            }
                        },
                        type: 'choice',
                        binding: 'foo.petType',
                        choices: [{
                            id: 'choice-1-option-1',
                            label: {
                                asset: {
                                    id: 'choice-1-option-1-label',
                                    type: 'text',
                                    value: 'Panther'
                                }
                            },
                            value: 'PANTHER',
                            unSelect: {}
                        }, {
                            id: 'choice-1-option-2',
                            label: {
                                asset: {
                                    id: 'choice-1-option-2-label',
                                    type: 'text',
                                    value: 'Racoon'
                                }
                            },
                            value: 'RACOON',
                            select: {}
                        }]
                    }
                }, {
                    asset: {
                        id: 'action',
                        type: 'action',
                        value: 'next',
                        label: {
                            asset: {
                                id: 'action-label',
                                type: 'text',
                                value: 'Continue'
                            }
                        },
                        run: {}
                    }
                }]
            })
        """

        let jsValue = context.evaluateScript(jsString)
        XCTAssertNotNil(jsValue)
        guard let _ = jsValue else {
            return
        }

        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("collection", asset: CollectionAsset.self)
        registry.register("choice", asset: SwiftUIChoiceAsset.self)
        registry.register("text", asset: TextAsset.self)
        registry.register("action", asset: ActionAsset.self)

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "view-1", index: 0)
        partialMatch.setMapping(assetId: "collection-label", index: 2)
        partialMatch.setMapping(assetId: "choice-1", index: 1)
        partialMatch.setMapping(assetId: "choice-1-label", index: 2)
        partialMatch.setMapping(assetId: "choice-1-option-1-label", index: 2)
        partialMatch.setMapping(assetId: "choice-1-option-2-label", index: 2)
        partialMatch.setMapping(assetId: "action", index: 3)
        partialMatch.setMapping(assetId: "action-label", index: 2)
        registry.partialMatchRegistry = partialMatch

        var set = Set<AnyCancellable>()

        var root: SwiftUIAsset?

        let decodedExpectation = expectation(description: "Root Decoded")
        registry.$root.dropFirst().sink { newVal in
            guard newVal != nil else { return }
            root = newVal
            decodedExpectation.fulfill()
        }.store(in: &set)

        try registry.decode(value: jsValue!)

        wait(for: [decodedExpectation], timeout: 1)

        XCTAssertNotNil(root)

        guard let collectionAsset = root as? CollectionAsset else {
            return XCTFail("incorrect root asset")
        }

        guard let choice = collectionAsset.model.data.values.first.flatMap({ $0?.asset as? SwiftUIChoiceAsset }) else {
            return XCTFail("incorrect asset for first value")
        }

        for choice in choice.model.data.choices {
            let hasSelectFunction = (choice.select?.rawValue != nil) || (choice.unSelect?.rawValue != nil)
            XCTAssertTrue(hasSelectFunction)
        }

        guard let action = collectionAsset.model.data.values.last.flatMap({ $0?.asset as? ActionAsset }) else {
            return XCTFail("incorrect asset for last value")
        }

        XCTAssertNotNil(action.model.data.run?.rawValue)
    }
}
