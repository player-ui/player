//
//  Utilities.swift
//  PlayerUI_Example
//
//  Created by Borawski, Harris on 3/11/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import JavaScriptCore
import XCTest
import Combine

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
