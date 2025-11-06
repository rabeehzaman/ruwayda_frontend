import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PWAInfoPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Ghadeer Al Sharq Trading EST PWA</h1>
          <p className="text-muted-foreground">
            Progressive Web App Features & Installation Guide
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📱 iPhone Installation
                <Badge variant="secondary">Standalone Mode</Badge>
              </CardTitle>
              <CardDescription>
                Get native app experience on iOS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Open in Safari browser</li>
                  <li>Tap Share button (square with arrow)</li>
                  <li>Select &quot;Add to Home Screen&quot;</li>
                  <li>Tap &quot;Add&quot;</li>
                </ol>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ No Safari address bar when installed!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 Android Installation
                <Badge variant="secondary">Native Integration</Badge>
              </CardTitle>
              <CardDescription>
                Install directly from Chrome
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Look for install banner</li>
                  <li>Tap &quot;Install&quot; or menu → &quot;Install app&quot;</li>
                  <li>Confirm installation</li>
                </ol>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ✅ Appears in app drawer like native apps
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💻 Desktop Installation
                <Badge variant="secondary">Dedicated Window</Badge>
              </CardTitle>
              <CardDescription>
                Install on Windows, Mac, Linux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Chrome/Edge:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Look for install icon in address bar</li>
                  <li>Click &quot;Install Ghadeer Al Sharq Trading EST&quot;</li>
                  <li>App opens in dedicated window</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔄 Offline Support
                <Badge variant="secondary">Always Available</Badge>
              </CardTitle>
              <CardDescription>
                Works without internet connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Previously loaded pages work offline</li>
                  <li>Custom offline page for new requests</li>
                  <li>Automatic sync when back online</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>✨ PWA Benefits</CardTitle>
            <CardDescription>
              Why install Ghadeer Al Sharq Trading EST as a PWA?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600 dark:text-green-400">🚀 Performance</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Faster loading</li>
                  <li>• Offline caching</li>
                  <li>• Optimized experience</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600 dark:text-blue-400">📱 Native Feel</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• No browser UI</li>
                  <li>• Full-screen experience</li>
                  <li>• App-like navigation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-purple-600 dark:text-purple-400">🔧 Convenience</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Home screen access</li>
                  <li>• Always available</li>
                  <li>• Auto-updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Ready to Install?</h3>
          <p className="text-sm text-muted-foreground">
            Look for the install prompt or use your browser&apos;s install option to get the full PWA experience!
          </p>
        </div>
      </div>
    </div>
  );
}