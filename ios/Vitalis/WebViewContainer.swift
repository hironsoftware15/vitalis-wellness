import SwiftUI
import WebKit

/**
 * WebViewContainer
 * SwiftUI wrapper around WKWebView with full bi-directional JavaScript bridge
 * for Apple HealthKit synchronization and Universal Link deep linking.
 */
struct WebViewContainer: UIViewRepresentable {
    let url: URL
    @ObservedObject var healthKitManager: HealthKitManager
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let controller = WKUserContentController()
        
        // Register JavaScript message handler
        controller.add(context.coordinator, name: "vitalisHealthKit")
        configuration.userContentController = controller
        
        // Enable media playback and inspection
        configuration.allowsInlineMediaPlayback = true
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.bounces = true
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        
        context.coordinator.webView = webView
        
        let request = URLRequest(url: url)
        webView.load(request)
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Handle URL updates or reload if necessary
    }
    
    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: WebViewContainer
        weak var webView: WKWebView?
        
        init(_ parent: WebViewContainer) {
            self.parent = parent
        }
        
        // MARK: - WKScriptMessageHandler
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "vitalisHealthKit" else { return }
            
            if let body = message.body as? [String: Any], let action = body["action"] as? String {
                Task { @MainActor in
                    if action == "requestSync" || action == "authorize" {
                        _ = await self.parent.healthKitManager.requestAuthorization()
                        await self.parent.healthKitManager.refreshAllBiometrics()
                        self.pushBiometricsToWeb()
                    }
                }
            } else {
                Task { @MainActor in
                    await self.parent.healthKitManager.refreshAllBiometrics()
                    self.pushBiometricsToWeb()
                }
            }
        }
        
        // MARK: - Push HealthKit telemetry into the Web Dashboard
        @MainActor
        func pushBiometricsToWeb() {
            guard let webView = self.webView else { return }
            let payload = parent.healthKitManager.biometricsPayload()
            
            guard let jsonData = try? JSONSerialization.data(withJSONObject: payload),
                  let jsonString = String(data: jsonData, encoding: .utf8) else { return }
            
            let jsCode = "if (window.vitalisReceiveAppleHealthData) { window.vitalisReceiveAppleHealthData(\(jsonString)); }"
            webView.evaluateJavaScript(jsCode) { result, error in
                if let error = error {
                    print("Error injecting Apple HealthKit telemetry: \(error)")
                } else {
                    print("Successfully synchronized Apple HealthKit telemetry to web container!")
                }
            }
        }
        
        // MARK: - WKNavigationDelegate
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            Task { @MainActor in
                self.pushBiometricsToWeb()
            }
        }
    }
}
