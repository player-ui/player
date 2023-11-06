//
//  AppDelegate.swift
//  PlayerUI
//
//  Created by hborawski on 02/20/2020.
//  Copyright (c) 2020 hborawski. All rights reserved.
//

import UIKit
import PlayerUI
import SwiftUI
import Combine

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    let plugins: [NativePlugin] = [
        PrintLoggerPlugin(level: .trace),
        ReferenceAssetsPlugin(),
        CommonTypesPlugin(),
        ExpressionPlugin(),
        CommonExpressionsPlugin(),
        ExternalActionPlugin(handler: { _, _, _ in
            print("external state")
        }),
        MetricsPlugin { timing, render, flow in
            print(timing as Any)
            print(render as Any)
            print(flow as Any)
        },
        RequestTimePlugin { 5 },
        PubSubPlugin([]),
        TypesProviderPlugin(types: [], validators: [], formats: []),
        TransitionPlugin(popTransition: .pop),
        BeaconPlugin<DefaultBeacon> { print(String(describing: $0)) }
    ]

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }
}

class SceneDelegate: UIResponder, UISceneDelegate {
    let plugins: [NativePlugin] = [
        PrintLoggerPlugin(level: .trace),
        ReferenceAssetsPlugin(),
        CommonTypesPlugin(),
        ExpressionPlugin(),
        CommonExpressionsPlugin(),
        ExternalActionPlugin(handler: { state, options, transition in
            guard state.ref == "test-1" else { return transition("Prev") }
            let transitionValue = options.data.get(binding: "transitionValue") as? String
            options.expression.evaluate("{{foo}} = 'bar'")
            transition(transitionValue ?? "Next")
        }),
        MetricsPlugin { timing, render, flow in
            print(timing as Any)
            print(render as Any)
            print(flow as Any)
        },
        RequestTimePlugin { 5 },
        PubSubPlugin([]),
        TypesProviderPlugin(types: [], validators: [], formats: []),
        TransitionPlugin(popTransition: .pop),
        BeaconPlugin<DefaultBeacon> { print(String(describing: $0)) }
    ]

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = window ?? UIWindow(windowScene: windowScene)

        if
            UserDefaults.standard.bool(forKey: "isAppetize"),
            let flowStr = UserDefaults.standard.string(forKey: "json")
        {
            window.loadView(
                view:
                    AssetFlowView(
                        flow: flowStr,
                        plugins: plugins,
                        completion: self.completion(result:)
                    ).navigationBarTitle(Text("Storybook Flow"))
            )
        }

        let isUiTest = ProcessInfo.processInfo.environment["UI_TESTING"] == "true"

        window.loadView(
            view: NavigationView {
                AssetAndPluginCollection(
                    sections: MockFlows.sections
                )
                .navigationBarTitleDisplayMode(.inline)
            },
            hideStatusBar: isUiTest
        )
    }
}

extension SceneDelegate {
    func completion(result: Result<CompletedState, PlayerError>) {
        switch result {
        case .success(let result):
            showAlert(message: result.endState?.outcome ?? "No Outcome")
        case .failure(let error):
            guard case let .promiseRejected(errorState) = error else {
                showAlert(message: "\(error)", error: true)
                return
            }
            showAlert(message: "\(errorState.error)", error: true)
        }
    }

    func showAlert(message: String, error: Bool = false) {
        let alertController = UIAlertController(title: error ? "Flow Error" : "Flow Finished", message: message, preferredStyle: .alert)
        alertController.view.accessibilityIdentifier = "FlowFinished"
        alertController.addAction(UIAlertAction(title: "Done", style: .default, handler: { _ in
            alertController.dismiss(animated: true, completion: nil)
        }))
        self.window?.rootViewController?.present(alertController, animated: true, completion: nil)
    }
}

extension Optional where Wrapped == UIWindow {
    func loadView<V: View>(view: V, hideStatusBar: Bool = false) {
        self?.rootViewController = UIHostingController(rootView: view.statusBar(hidden: hideStatusBar))
        self?.makeKeyAndVisible()
    }
}
