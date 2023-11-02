//
//  AssetUITestCase.swift
//  PlayerUI
//
//  Created by Harris Borawski on 2/25/21.
//

import Foundation
import XCTest

/**
 Base Class for Asset UI Testing when using `AssetCollectionController`
 */
open class AssetUITestCase: XCTestCase {
    /// The current XCUIApplication instance
    public var app: XCUIApplication = XCUIApplication()

    /**
     Sets up before each test
     */
    open override func setUp() {
        app = XCUIApplication()
        app.launchEnvironment = [
            "UI_TESTING": "true"
        ]
        app.launch()
    }

    /**
     Tears down after each test
     */
    open override func tearDown() {
        app.terminate()
    }

    /**
     If the `AssetCollectionController` is not the first screen in your testing app
     override this function to navigate to where it is
     */
    open func navigateToAssetCollection() {}

    /**
     Opens a flow with the specified mock name.
     Mock names are the name of the section and then the text in the cell
     generally just the JSON file name with spaces instead of dashes

     Example:
     `action-basic.json` -> `"action basic"`
     - parameters:
        - mockName: The name of the mock to open
     */
    open func openFlow(_ mockName: String) {
        navigateToAssetCollection()

        let button = app.otherElements.buttons[mockName].firstMatch
        app.scrollToElement(element: button)

        waitFor(button)
        button.tap()
    }

    open func switchToPlayerTab() {
        app.otherElements.buttons["Player"].firstMatch.tap()
    }

    /**
     Waits for an element to exist before tapping it
     - parameters:
        - element: The XCUIElement to wait for
        - timeout: How long to wait for it to exist
     */
    public func waitAndTap(_ element: XCUIElement, timeout: TimeInterval = 5) {
        waitFor(element, timeout: timeout)
        tap(element)
    }

    /**
     Tap the first matching element from an XCUIElement query

     Just cleans up the code to remove lots of `.firstMatch.tap()`
     - parameters:
        - element: The XCUIElement to tap
     */
    public func tap(_ element: XCUIElement) { element.firstMatch.tap() }

    /**
     Waits for an XCUIElement to exist
     - parameters:
        - element: The XCUIElement to wait for
        - timeout: How long to wait for it to exist
     */
    public func waitFor(_ element: XCUIElement, timeout: TimeInterval = 5) {
        let predicate = NSPredicate { (_, _) -> Bool in
            return element.firstMatch.exists
        }
        let expectation = self.expectation(for: predicate, evaluatedWith: nil, handler: nil)
        wait(for: [expectation], timeout: timeout)
    }
}

extension XCUIElement {
    func scrollToElement(element: XCUIElement, maxTries: Int = 5) {
        if element.visible() { return }
        for _ in 0..<maxTries { // Do not scroll endlessly
            swipeUp()
            if element.visible() { return }
        }
        XCTFail("Scrolled \(maxTries) times but could not find element=\(element)")
    }

    func visible() -> Bool {
        guard self.exists && !self.frame.isEmpty else { return false }
        return XCUIApplication().windows.element(boundBy: 0).frame.contains(self.frame)
    }
}
