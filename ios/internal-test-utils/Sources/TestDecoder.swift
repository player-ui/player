class TestDecoder: Decoder {
    var codingPath: [CodingKey]

    var userInfo: [CodingUserInfoKey: Any]

    init() {
        codingPath = []
        userInfo = [:]
    }

    func container<Key: CodingKey>(keyedBy _: Key.Type) throws -> KeyedDecodingContainer<Key> {
        fatalError("Not Implemented")
    }

    func unkeyedContainer() throws -> UnkeyedDecodingContainer {
        fatalError("Not Implemented")
    }

    func singleValueContainer() throws -> SingleValueDecodingContainer {
        fatalError("Not Implemented")
    }
}
