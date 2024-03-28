//
//  ErrorUtilitiesTests.swift
//  PlayerUI_Tests
//
//  Created by bcallaghan  on 5/27/21.
//

import XCTest
@testable import PlayerUI

class ErrorUtilitiesTestCase: XCTestCase {

    func testDecodingErrors() {

        struct Foo: Codable {
            var aaa: String
            var bar: Bar
            // swiftlint:disable nesting
            struct Bar: Codable {
                var bbb: Int
            }
        }

        let decoder = JSONDecoder()
        let decodeFoo = { (jsonString: String) throws -> Void in
            guard let data = jsonString.data(using: .utf8) else {
                return XCTFail("could not get dat")
            }
            _ = try decoder.decode(Foo.self, from: data)
        }

        // typeMismatch
        do {
            try decodeFoo("{\"aaa\": \"Hello,\", \"bar\":{\"bbb\":\"World\"}}")
            XCTFail("DecodingError expected")
        } catch {
            let message = error.playerDescription
            XCTAssertEqual(message, "Expected to decode Int but found a string instead. (coding path bar.bbb)")
        }

        // keyNotFound
        do {
            try decodeFoo("{\"aaa\": \"Hello,\", \"bar\":{}}")
            XCTFail("DecodingError expected")
        } catch {
            let message = error.playerDescription
            XCTAssertEqual(message, "Key not found at coding path bar.bbb.")
        }

        //
        do {
            try decodeFoo("{\"aaa\": \"Hello,\", \"bar\":{\"bbb\":null}}")
            XCTFail("DecodingError expected")
        } catch {
            let message = error.playerDescription
            XCTAssertEqual(message, "Value not found at coding path bar.bbb.")
        }

        do {
            try decodeFoo("{\"aaa\": \"Hello,\", \"bar\":{\"bbb\":null}")
            XCTFail("DecodingError expected")
        } catch {
            let message = error.playerDescription
            XCTAssertEqual(message, "The given data was not valid JSON.")
        }
    }

    func testNonDecodingErrorDescription() {
        enum FakeE: Error {
            case test
        }

        XCTAssertTrue(FakeE.test.playerDescription.contains("FakeE.test"))
    }
}
