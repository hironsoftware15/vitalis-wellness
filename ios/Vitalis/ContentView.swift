import SwiftUI

/**
 * ContentView
 * Primary view displaying the Vitalis web application container with status bar styling
 * and instant on-appear HealthKit authorization trigger.
 */
struct ContentView: View {
    @StateObject private var healthKitManager = HealthKitManager.shared
    private let appURL = URL(string: "https://medicore-wellness.web.app")!
    
    var body: some View {
        ZStack {
            Color(red: 10/255, green: 15/255, blue: 29/255)
                .ignoresSafeArea()
            
            WebViewContainer(url: appURL, healthKitManager: healthKitManager)
                .ignoresSafeArea(edges: .bottom)
        }
        .task {
            _ = await healthKitManager.requestAuthorization()
        }
    }
}
