//
//  ControlledAsset.swift
//  PlayerUI
//
//  Created by Harris Borawski on 2/26/21.
//

import Combine
import SwiftUI

/**
 A ViewModel that contains decoded AssetData for an Asset
 */
open class AssetViewModel<T: AssetData>: ObservableObject {
    /// The decoded data
    @Published public var data: T

    /// Any contextual information set by the user
    public var userInfo: [CodingUserInfoKey: Any]

    /// Set to store subscriptions in for cancellation
    public var bag = Set<AnyCancellable>()

    /**
     Constructs an instance of this ViewModel with the given data
     - parameters:
        - data: The data to publish from this ViewModel
        - userInfo:  Any contextual information set by the user
     */
    public required init(_ data: T, userInfo: [CodingUserInfoKey: Any] = [:]) {
        self._data = Published(initialValue: data)
        self.userInfo = userInfo
    }
}

/**
 An Asset with a default ViewModel
 */
open class UncontrolledAsset<DataType: AssetData>: ControlledAsset<DataType, AssetViewModel<DataType>> {}

/**
 An Asset with a custom ViewModel that extends the default one to receive data updates
 */
open class ControlledAsset<DataType: AssetData, ModelType>: SwiftUIAsset where ModelType: AssetViewModel<DataType> {
    /// The ViewModel associated with this asset
    public let model: ModelType

    /// The decoded data associated with this asset
    override open var valueData: AssetData { model.data }

    override var modelObject: AnyObject { model }

    /**
     Constructs a SwiftUIAsset from a decoder
     - parameters:
        - from: The decoder to decode from
     */
    public required init(from decoder: Decoder) throws {
        let data = try decoder.singleValueContainer().decode(DataType.self)

        // When we have a plain old AssetViewModel, not a subclass with custom
        // properties, we want to bypass the model cache altogether.
        //
        // This is because the decode process can mutate reference types in the
        // cache without properly publishing the changes to SwiftUI (meaning
        // missed view updates).
        //
        // Eliminating the model cache altogether would be ideal but doing so
        // leads to bugs where state stored by custom view models @Published
        // properties is lost. On iOS 14+ this can be avoided by using
        // @StateObject without a model cache - something to revisit...
        //
        let needsModelCache = (ModelType.self != AssetViewModel<DataType>.self)
        let modelCache = needsModelCache ? try decoder.getModelCache() : nil
        if let model: ModelType = modelCache?.entry(forKey: data.id, codingPath: decoder.codingPath) {
            // we can't safely take advantage of AssetData.isEqual here because
            // the process of decoding can alter the contents of previously
            // cached model data (because AssetData can contain reference types)
            self.model = model
            decoder.logger?.t("Updating model for \(data.id)")
            model.data = data
            model.userInfo = decoder.userInfo
        } else {
            self.model = ModelType(data, userInfo: decoder.userInfo)
            decoder.logger?.t("Creating model for \(data.id)")
            modelCache?.set(model, forKey: data.id, codingPath: decoder.codingPath)
        }
        try super.init(from: decoder)
    }
}
