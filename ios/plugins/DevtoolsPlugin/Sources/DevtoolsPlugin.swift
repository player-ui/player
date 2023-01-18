//
//  DevtoolsPlugin.swift
//  PlayerUI
//
//  Created by Jeremiah Zucker on 12/22/22.
//

//import FlipperKit
import JavaScriptCore

public var count = 0

public class DevtoolsPlugin: JSBasePlugin, NativePlugin {
    
    /// A custom expression name to register
    fileprivate(set) var playerID: String?
    
//    fileprivate var callbacks: [String : (Decodable) -> Decodable] {
//        pluginRef!.objectForKeyedSubscript("callbacks").toDictionary() as [String : (Decodable) -> Decodable] // TODO: I know this doesn't work
//    }

    /**
     Constructs a DevtoolsPlugin
     - parameters:
        - playerID: The unique ID to distinguish this Player with
     */
    public convenience init(_ playerID: String = "ios-player-\(count)") {
//        #if FB_SONARKIT_ENABLED
//        // TODO: Should I just init here?
//        let client: FlipperClient = FlipperClient.shared()
//        let plugin = client.pluginWithIdentifier("player-ui-devtools")
//
//        #endif
        
        self.init(fileName: "devtools-plugin.prod", pluginName: "DevtoolsPlugin.DevtoolsPlugin")
        
        self.playerID = playerID
                
        count += 1
    }
    
    public override func getArguments() -> [Any] {
        let onEvent: @convention(block) (JSValue) -> Void = { event in
            DevtoolsFlipperPlugin.sharedInstance.publishEvent(event: event.toDictionary())
        }
        
        return [playerID, JSValue(object: onEvent, in: context) as Any]
    }

    public override func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: DevtoolsPlugin.self), pathComponent: "DevtoolsPlugin.bundle")
    }
    
    public func apply<P>(player: P) where P : HeadlessPlayer {
        DevtoolsFlipperPlugin.sharedInstance.addPlayer(plugin: self)
        
        player.hooks?.state.tap { state in
            // TODO: Should be on GC? Not entirely sure
            if (state is CompletedState) {
                DevtoolsFlipperPlugin.sharedInstance.removePlayer(plugin: self)
            }
        }
    }
    
//    func onMethod(type: String, params: NSObject) -> Decodable? {
//        pluginRef?.objectForKeyedSubscript("callbacks")?.invokeMethod(type, withArguments: [params]).toDictionary()
////        return callbacks[type]?(params)
//    }

    var supportedMethods: Set<String> {
        Set(/** callbacks.keys */)
    }
}
