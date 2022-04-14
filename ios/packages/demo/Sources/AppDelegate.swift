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
        if
            UserDefaults.standard.bool(forKey: "isAppetize"),
            let flowStr = UserDefaults.standard.string(forKey: "json")
        {
            launch(flow: flowStr)
            return true
        }

        let root = UINavigationController()

        root.setViewControllers(
            [
                UIHostingController(
                    rootView: AssetCollection(
                        plugins: plugins,
                        sections: MockFlows.sections,
                        completion: self.completion(result:)
                    )
                )
            ],
            animated: false
        )

        self.window?.rootViewController = root
        self.window?.makeKeyAndVisible()
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

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        guard
            userActivity.activityType == NSUserActivityTypeBrowsingWeb,
            let url = userActivity.webpageURL,
            let components = URLComponents.init(url: url, resolvingAgainstBaseURL: true),
            let jsonQuery = components.queryItems?.first(where: { $0.name == "json" }),
            let flowString = jsonQuery.value
        else {
            return false
        }

        launch(flow: flowString)
        return true
    }

    func launch(flow: String) {
        guard let navController = window?.rootViewController as? UINavigationController else { return }

        navController.popToRootViewController(animated: false)
        navController.pushViewController(
            UIHostingController(
                rootView: AssetFlowView(
                    flow: flow,
                    plugins: plugins,
                    completion: self.completion(result:)
                ).navigationBarTitle(Text("Storybook Flow"))
            ),
            animated: true
        )
    }
}

extension AppDelegate {
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
