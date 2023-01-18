import Foundation
import FlipperKit

public class DevtoolsFlipperPlugin: NSObject, FlipperPlugin {
    
    fileprivate override init() {}
    
    public static let sharedInstance: DevtoolsFlipperPlugin = DevtoolsFlipperPlugin()
    
    private var connection: FlipperConnection? = nil
    
    private var supportedMethods: Set<String> = Set()
    private var activePlayers: [String: DevtoolsPlugin] = [:]

  public func identifier() -> String! {
    return "player-ui-devtools"
  }

  public func didConnect(_ connection: FlipperConnection!) {
    self.connection = connection

    guard connection != nil else { return }

//    self.supportedMethods.forEach { type ->
//        connection.receive(type) { params, response ->
//            activePlayers[params.getString("playerID")]
//                ?.onMethod(type, params.asJsonObject)
//                ?.asFlipperObject
//                ?.let(response::success) ?: response.success() // TODO: Should we error back?
//        }
//    }
  }

  public func didDisconnect() {
    connection = nil;
  }

  func addPlayer(plugin: DevtoolsPlugin) {
      guard let id = plugin.playerID else { return }
      
      supportedMethods = supportedMethods.union(plugin.supportedMethods)
      activePlayers[id] = plugin
  }

  func removePlayer(plugin: DevtoolsPlugin) {
      guard let id = plugin.playerID else { return }
      
      activePlayers.removeValue(forKey: id)
  }
    
    func publishEvent(event: [AnyHashable : Any]) {
        // TODO: Probably lift type check up?
        if let type = event["type"] as? String {
            connection?.send(type, withParams: event)
        } else {
            // TODO: Log or throw or what?
        }
    }
}
