import XCTest
import JavaScriptCore
@testable import PlayerUI

class LocalModelTests: XCTestCase {
    func testLocalModel() {
        let context = JSContext()!

        let model = LocalModel(data: ["foo": "bar"], in: context)

        XCTAssertEqual("bar", model.get(path: "foo")?.toString())

        model.set(transaction: [(BindingInstance(rawBinding: "baz.bar", in: context), "test")])

        XCTAssertEqual("test", model.get(path: "baz.bar")?.toString())
    }
}

class BindingParserTests: XCTestCase {
    func testBindingParser() {
        let context = JSContext()!

        let options = BindingParserOptions(get: { _ in nil })
        let parser = BindingParser(options: options, in: context)

        XCTAssertEqual(["foo"], parser.parse(path: "foo")?.asArray())
        XCTAssertEqual(["foo", "bar"], parser.parse(path: "foo.bar")?.asArray())
        XCTAssertEqual(["baz", "1", "key"], parser.parse(path: "baz[1].key")?.asArray())
    }

    func testBindingParserThroughModel() {
        let context = JSContext()!

        let model = LocalModel(data: ["foo": ["baz": "value"], "bar": "baz"], in: context)

        let options = BindingParserOptions(get: { model.get(binding: $0) })
        let parser = BindingParser(options: options, in: context)

        XCTAssertEqual(["foo"], parser.parse(path: "foo")?.asArray())
        XCTAssertEqual(["foo", "bar"], parser.parse(path: "foo.bar")?.asArray())

        XCTAssertEqual("value", parser.parse(path: "foo.{{bar}}").map { model.get(binding: $0)?.toString() })
    }
}

class BindingInstanceTests: XCTestCase {
    func testSimpleBinding() {
        let context = JSContext()!

        let binding = BindingInstance(rawBinding: "foo.bar", in: context)

        XCTAssertEqual(["foo", "bar"], binding.asArray())

        XCTAssertEqual("foo.bar", binding.asString())
    }
}
