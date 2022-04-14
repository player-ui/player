//
//  TestPlayer.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/8/21.
//

import Foundation
import JavaScriptCore

/**
 A `HeadlessPlayer` implementation for testing purposes. It utilizes @player-ui/make-flow as a means of resolving assets IDs to types
 so the registry can decode assets without needing to forcefully map them
 */
public class TestPlayer<WrapperType: AssetContainer, RegistryType: BaseAssetRegistry<WrapperType>>: HeadlessPlayer {
    public var jsPlayerReference: JSValue?

    public var hooks: TestHooks?

    public var logger = TapableLogger()

    public let assetRegistry: RegistryType

    public init(plugins: [NativePlugin], registry: RegistryType, context: JSContext = JSContext()) {
        let partialMatchPlugin = PartialMatchFingerprintPlugin()
        let allPlugins = plugins + [partialMatchPlugin]
        assetRegistry = registry
        jsPlayerReference = setupPlayer(context: context, plugins: allPlugins)
        guard let player = jsPlayerReference else { return }
        hooks = TestHooks(from: player)
        for plugin in allPlugins { plugin.apply(player: self) }
        partialMatchPlugin.pluginRef?.invokeMethod("apply", withArguments: [player as Any])
        assetRegistry.partialMatchRegistry = partialMatchPlugin
    }
}

public class TestHooks: CoreHooks {
    public var flowController: Hook<FlowController>

    public var viewController: Hook<ViewController>

    public var dataController: Hook<DataController>

    public var state: Hook<BaseFlowState>

    public required init(from player: JSValue) {
        flowController = Hook<FlowController>(baseValue: player, name: "flowController")
        viewController = Hook<ViewController>(baseValue: player, name: "viewController")
        dataController = Hook<DataController>(baseValue: player, name: "dataController")
        state = Hook<BaseFlowState>(baseValue: player, name: "state")
    }
}
