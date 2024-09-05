class TestDecoder: Decoder {
    init() {
        self.codingPath = []
        self.userInfo = [:]
    }
    var codingPath: [CodingKey]

    var userInfo: [CodingUserInfoKey: Any]

    func container<Key>(keyedBy type: Key.Type) throws -> KeyedDecodingContainer<Key> where Key: CodingKey {
        fatalError("Not Implemented")
    }

    func unkeyedContainer() throws -> UnkeyedDecodingContainer {
        fatalError("Not Implemented")
    }

    func singleValueContainer() throws -> SingleValueDecodingContainer {
        fatalError("Not Implemented")
    }
}
