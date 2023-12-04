import SwiftUI
import PlayerUILogger

@main
struct BazelApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationView {
                Text("Hello from Bazel!").onAppear {
                    print(Bundle.main.resourceURL)
                }
            }
        }
    }
}
