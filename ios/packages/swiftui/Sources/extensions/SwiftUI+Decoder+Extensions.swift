//
//  Decoder+Extensions.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/2/21.
//

import Foundation

/// A function that decodes a `SwiftUIAsset`
public typealias DecodeSwiftUIFunction = ((Any) throws -> SwiftUIAsset?)

public extension Decoder {
    /**
     Retrieves a `DecodeSwiftUIFunction` if the decoder has one
     - returns: A `DecodeSwiftUIFunction`
     */
    func getSUIDecodeFunction() throws -> DecodeSwiftUIFunction {
        guard let decodeFunction = self.userInfo[self.decodeFunctionKey] as? DecodeSwiftUIFunction else {
            throw DecodingError.decoderNotAnAssetDecoder
        }
        return decodeFunction
    }
}
