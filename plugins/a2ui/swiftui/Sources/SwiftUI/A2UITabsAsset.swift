import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// A single tab — title + body component.
struct A2UITabItem: Decodable {
    var title: String
    var child: WrappedAsset?
}

/// Decoded data for the A2UI `Tabs` asset.
struct A2UITabsData: AssetData {
    var id: String
    var type: String
    var tabItems: [A2UITabItem]?
}

/// Tabbed interface organizing content into switchable panels.
final class A2UITabsAsset: UncontrolledAsset<A2UITabsData> {
    public override var view: AnyView { AnyView(A2UITabsAssetView(model: model)) }
}

struct A2UITabsAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UITabsData>
    @State private var selected = 0

    var body: some View {
        let items = model.data.tabItems ?? []
        VStack(alignment: .leading) {
            if !items.isEmpty {
                Picker("", selection: $selected) {
                    ForEach(items.indices, id: \.self) { index in
                        Text(items[index].title).tag(index)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())

                if let child = items[safe: selected]?.child?.asset {
                    child.view
                }
            }
        }
        .accessibility(identifier: model.data.id)
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
