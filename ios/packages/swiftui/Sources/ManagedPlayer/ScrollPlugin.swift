import SwiftUI

/// A plugin to wrap player content in a scrollview
/// and provide `EnvironmentValues` for
/// `\.scrollToProxy` for scrolling to elements
/// `\.playerScrollPluginSize` for the size of the contained content
public class ScrollPlugin: NativePlugin {
    public var pluginName: String = "ScrollPlugin"

    private let ignoredEdges: Edge.Set

    /// Wraps SwiftUIPlayer content in `ScrollView`
    /// - Parameter edgesIgnoringSafeArea: Edges to ignore for the safe area
    public init(edgesIgnoringSafeArea: Edge.Set = []) {
        self.ignoredEdges = edgesIgnoringSafeArea
    }

    public func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }
        let ignoredEdges = self.ignoredEdges
        player.hooks?.view.tap(name: pluginName) { view in
            return AnyView(
                ScrollViewReader { proxy in
                    ScrollView {
                        view.scrollToProxy(proxy)
                    }
                }
                .edgesIgnoringSafeArea(ignoredEdges)
                .modifier(MeasureToEnvironment(path: \.playerScrollPluginSize))
            )
        }
    }
}

struct MeasureToEnvironment: ViewModifier {
    let path: WritableKeyPath<EnvironmentValues, CGSize>
    @State var size: CGSize = .zero
    func body(content: Content) -> some View {
        content
            .background(
                GeometryReader { proxy in
                    Color.clear
                        .onAppear { size = proxy.size }
                        .onChange(of: proxy.size, perform: { size = $0 })

                }
            )
            .environment(path, size)
    }
}

struct ScrollPluginSizeKey: EnvironmentKey {
    static var defaultValue: CGSize = .zero
}

public extension EnvironmentValues {
    /// The size of the ScrollView from SwiftUIPlayer ``ScrollViewPlugin``
    var playerScrollPluginSize: CGSize {
        get { self[ScrollPluginSizeKey.self] }
        set { self[ScrollPluginSizeKey.self] = newValue }
    }
}
