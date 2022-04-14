//
//  SwiftUIChoiceAsset.swift
//  PlayerUI
//
//  Created by bcallaghan  on 5/27/21.
//

import SwiftUI
import Combine
import PlayerUI

/**
 Data Decoded by Player for `ChoiceAssetData`
 */
public struct ChoiceData: AssetData {
    public var id: String
    public var type: String
    public var label: WrappedAsset?
    public var choices: [Choice]

    public class Choice: Decodable, Identifiable {
        public var id: String
        public var label: WrappedAsset

        public var select: WrappedFunction<Void>?
        public var unSelect: WrappedFunction<Void>?
    }
}

/**
 Wrapper class to tie `ChoiceData` to a SwiftUI `View`
 */
final class SwiftUIChoiceAsset: UncontrolledAsset<ChoiceData> {
    public override var view: AnyView { AnyView(ChoiceAssetView(model: model)) }
}

/**
 View implementation for `ChoiceAsset`
 */
struct ChoiceAssetView: View {
    @ObservedObject var model: AssetViewModel<ChoiceData>

    @ViewBuilder
    var body: some View {
        VStack {
            ForEach(model.data.choices) { choice in
                choice.label.asset?.view
            }
        }
        .accessibilityElement(children: .contain)
        .accessibility(identifier: model.data.id)
    }
}
