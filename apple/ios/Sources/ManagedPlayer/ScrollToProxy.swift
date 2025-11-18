//
//  ScrollToProxy.swift
//  PlayerUI
//
//  Created by apatterson6 on 2021-10-27.
//

import SwiftUI

/// Adopters of ScrollToProxy must provide the ability to scroll a view with a specified identifier into the
/// current viewport.
///
/// A ScrollToProxy can be added to the environment and will be utilized by any contained input assets to
/// ensure they are visible when focused.
public protocol ScrollToProxy {
    func scrollTo<Item>(_ item: Item, anchor: UnitPoint?) where Item: Hashable
}

// ScrollViewProxy is only available on 14+
extension ScrollViewProxy: ScrollToProxy {}

public extension View {
    /// Add the supplied `scrollTo` proxy to the returned views environment.
    ///
    /// The supplied proxy is added under the `\.scrollToProxy` environment keypath. It will be used
    /// to keep focused input assets inside the current viewport.
    ///
    /// The `scrollTo` argument is typically a `ScrollViewProxy` from a `ScrollViewReader`.
    ///
    /// eg.
    /// ```
    /// ScrollView {
    ///     ScrollViewReader { proxy in
    ///         SwiftUIPlayer()
    ///             .scrollToProxy(proxy)
    ///     }
    /// }
    /// ```
    func scrollToProxy(_ scrollTo: ScrollToProxy) -> some View {
        return environment(\.scrollToProxy, scrollTo)
    }
}

public extension EnvironmentValues {
    var scrollToProxy: ScrollToProxy {
        get { self[ScrollToEnvironmentKey.self] }
        set { self[ScrollToEnvironmentKey.self] = newValue }
    }
}

extension ScrollToProxy {
    public func scrollTo<Item>(_ item: Item) where Item: Hashable {
        scrollTo(item, anchor: nil)
    }
}

private struct ScrollToEnvironmentKey: EnvironmentKey {
    static let defaultValue: ScrollToProxy = VoidScrollToProxy()

    private struct VoidScrollToProxy: ScrollToProxy {
        func scrollTo<Item>(_ item: Item, anchor: UnitPoint?) where Item: Hashable {}
    }
}
