//
//  SwiftUIRegistry.swift
//  PlayerUI
//
//  Created by Harris Borawski on 2/26/21.
//

import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUILogger
#endif

/**
 Registry for SwiftUI based `SwiftUIAsset` implementations
 */
public class SwiftUIRegistry: BaseAssetRegistry<WrappedAsset>, ObservableObject {
    /// The Root level asset
    @Published public var root: SwiftUIAsset?

    /// Used during decoding to ensure view models are reused
    private let modelCache = ModelCache()

    func resetView(releasePartialMatch: Bool = true) {
        root = nil
        if releasePartialMatch {
            partialMatchRegistry = nil
        }
        modelCache.clear()
    }

    public override init(logger: TapableLogger? = nil) {
        super.init(logger: logger)
        decoder.setModelCache(modelCache)
    }

    /**
     Decodes the given `JSValue` and updates the @Published root asset
     - parameters:
        - value: The JSValue that is the root of a resolved Asset tree from the `HeadlessPlayer`
     */
    public func decode(value: JSValue) throws {
        // remain on the current `root` if decoding fails
        root = try decode(value)
    }
}

/// A key-value store used to hold previously created view models.
final class ModelCache {
    private struct Key: Hashable {
        private let id: String
        private let codingPath: [CodingPath]

        init(id: String, codingPath: [CodingKey]) {
            self.id = id
            self.codingPath = codingPath.map { CodingPath($0) }
        }
    }

    private indirect enum CodingPath: Hashable {
        case int(Int)
        case string(String)

        init(_ key: CodingKey) {
            guard let intValue = key.intValue else {
                self = .string(key.stringValue)
                return
            }
            self = .int(intValue)
        }
    }

    private var entries: [Key: Any] = [:]

    func entry<T, ModelData>(forKey id: String, codingPath: [CodingKey]) -> T? where T: AssetViewModel<ModelData> {
        assert(Thread.isMainThread)
        let key = Key(id: id, codingPath: codingPath)
        return entries[key] as? T
    }

    func set<T, ModelData>(_ entry: T, forKey id: String, codingPath: [CodingKey]) where T: AssetViewModel<ModelData> {
        assert(Thread.isMainThread)
        let key = Key(id: id, codingPath: codingPath)
        entries[key] = entry
    }

    fileprivate func clear() { entries = [:] }
}

extension Decoder {
    func getModelCache() throws -> ModelCache {
        guard let modelCache = userInfo[.modelCache] as? ModelCache else {
            throw DecodingError.decoderNotAnAssetDecoder
        }
        return modelCache
    }
}

extension JSONDecoder {
    fileprivate func setModelCache(_ cache: ModelCache) {
        userInfo[.modelCache] = cache
    }

    /// Adds a new ModelCache to this decoder - exposed for testing.
    func addModelCacheForTesting() {
        setModelCache(ModelCache())
    }
}

private extension CodingUserInfoKey {
    static let modelCache: CodingUserInfoKey! = CodingUserInfoKey(rawValue: "modelCache")
}
