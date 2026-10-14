#!/usr/bin/env python3
"""
Aegis Preventive Health & Wellness Coach
Local Development Server with REST API & Static Hosting
"""

import http.server
import socketserver
import json
import os
import sys
from urllib.parse import urlparse

PORT = 8080

class HealthAppHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            response = {
                "status": "healthy",
                "service": "Google Preventive Health & Wellness Platform",
                "integrations": [
                    "Google Health Connect (Android 14+)",
                    "Firebase Cloud Messaging (FCM)",
                    "Cloud Firestore",
                    "Gemini 3.8 Flash (google-genai SDK)"
                ],
                "telemetry": {
                    "steps": 8420,
                    "resting_hr": 58,
                    "sleep_hours": 7.8,
                    "adherence_rate": 1.0,
                    "composite_score": 88
                }
            }
            self.wfile.write(json.dumps(response, indent=2).encode('utf-8'))
            return
        
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/coach":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                body = json.loads(post_data.decode('utf-8'))
            except Exception:
                body = {}

            query = body.get("query", "daily summary")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            # Simulated response from Gemini 3.8 Flash with clinical preventive guardrails
            reply = {
                "coach": "Gemini 3.8 Flash (Preventive Longevity Specialization)",
                "query": query,
                "clinical_guardrail_applied": True,
                "preventive_insight": (
                    "Based on aggregated Google Health Connect metrics, your deep sleep "
                    "rebounded to 1h 45m. Maintain optimal hydration (3L target) and complete your "
                    "Zone-2 cardiovascular stimulus today."
                ),
                "timestamp": "2026-10-12T20:50:00Z"
            }
            self.wfile.write(json.dumps(reply, indent=2).encode('utf-8'))
            return
            
        super().do_POST()

if __name__ == "__main__":
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), HealthAppHandler) as httpd:
        print(f"================================================================")
        print(f"🛡️  Aegis Preventive Health & Wellness Coach")
        print(f"🌐 Running locally at http://localhost:{PORT}")
        print(f"📱 Ready for interactive browser testing & inspection")
        print(f"================================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            sys.exit(0)
