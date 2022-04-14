//
//  AssetUnitTestCaseBase.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/8/21.
//

import Foundation
import XCTest
import JavaScriptCore

/**
 Shared functionality for Creating flows for unit test cases
 */
open class AssetUnitTestCaseBase: XCTestCase {
    // MARK: Private Properties

    /// The context used for  makeFlow
    public var context: JSContext = JSContext()

    /**
     Sets up utilities before tests
     */
    open override func setUp() {
        guard
            let url = ResourceUtilities.urlForFile(
                name: "make-flow.prod",
                ext: "js",
                bundle: Bundle(for: AssetUnitTestCaseBase.self), pathComponent: "TestUtilities.bundle"),
            let contents = try? String(contentsOf: url)
        else { return }
        context.evaluateScript(contents)
    }

    /**
     Turns a single Asset JSON definition into a full flow
     - parameters:
        - json: The JSON definition of a single asset
     - returns: A string that is a full JSON flow containing the single asset
     */
    public func makeFlow(_ json: String) -> String? {
        return context.evaluateScript("JSON.stringify(MakeFlow.makeFlow(\(json)))")?.toString()
    }
}

extension JSContext {
    func createAssetJsValue(string: String) -> JSValue {
        guard let container = self.evaluateScript("(\(string))") else { fatalError("JSON was malformed") }
        return container
    }
}
