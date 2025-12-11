import { Heart, Github, Coffee, Gift, Star, Bug, Lightbulb, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3 } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer transition-opacity hover:opacity-80">
                        <BarChart3 className="h-6 w-6" />
                        <span>Radar</span>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Hero */}
                <div className="text-center mb-12">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-red-500 animate-pulse" />
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Support Radar
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Help keep Radar <strong>100% free and open source</strong> for everyone
                    </p>
                </div>

                {/* Why Support */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>💜 Why Your Support Matters</CardTitle>
                        <CardDescription>
                            Radar is a passion project built to help small businesses compete. Every donation keeps the lights on.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-900 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">🗺️</span>
                                    <div className="font-semibold text-blue-700 dark:text-blue-300">Location Data & Maps</div>
                                </div>
                                <div className="text-sm text-muted-foreground">Google Places API powers our competitor discovery</div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-900 rounded-lg border-l-4 border-green-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">☁️</span>
                                    <div className="font-semibold text-green-700 dark:text-green-300">Hosting & Infrastructure</div>
                                </div>
                                <div className="text-sm text-muted-foreground">Reliable servers to keep Radar running 24/7</div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-900 rounded-lg border-l-4 border-purple-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">🤖</span>
                                    <div className="font-semibold text-purple-700 dark:text-purple-300">AI-Powered Insights</div>
                                </div>
                                <div className="text-sm text-muted-foreground">OpenAI API generates actionable competitor analysis</div>
                            </div>
                        </div>
                        <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 text-center">
                            <div className="text-lg font-semibold mb-2 text-indigo-900 dark:text-indigo-100">
                                🎯 Our Mission: Keep Radar 100% Free Forever
                            </div>
                            <div className="text-sm text-muted-foreground max-w-lg mx-auto">
                                No paywalls. No feature limits. No ads. Just a tool built to help local businesses thrive.
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Donation Options */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Choose How to Support</CardTitle>
                        <CardDescription>
                            Every contribution helps, no matter the size!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* GitHub Sponsors */}
                        <a
                            href="https://github.com/sponsors/YourUsername"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <div className="p-6 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 rounded-lg transition-all hover:shadow-lg group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full group-hover:scale-110 transition-transform">
                                            <Github className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">GitHub Sponsors</h3>
                                            <p className="text-sm text-muted-foreground">Monthly recurring support • 0% fees</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        Sponsor
                                    </Button>
                                </div>
                            </div>
                        </a>

                        {/* Ko-fi */}
                        <a
                            href="https://ko-fi.com/radarapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <div className="p-6 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 rounded-lg transition-all hover:shadow-lg group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full group-hover:scale-110 transition-transform">
                                            <Coffee className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Ko-fi</h3>
                                            <p className="text-sm text-muted-foreground">One-time coffee • 0% fees</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        Buy a Coffee
                                    </Button>
                                </div>
                            </div>
                        </a>

                        {/* Buy Me a Coffee */}
                        <a
                            href="https://buymeacoffee.com/radarapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <div className="p-6 border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 rounded-lg transition-all hover:shadow-lg group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full group-hover:scale-110 transition-transform">
                                            <Gift className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Buy Me a Coffee</h3>
                                            <p className="text-sm text-muted-foreground">One-time support • 5% fees</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                                        Support
                                    </Button>
                                </div>
                            </div>
                        </a>
                    </CardContent>
                </Card>

                {/* Other Ways to Help */}
                <Card>
                    <CardHeader>
                        <CardTitle>Can't Donate? No Problem!</CardTitle>
                        <CardDescription>
                            There are many other ways you can help
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <a
                                href="https://github.com/YourUsername/radar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                            >
                                <Star className="h-5 w-5 text-yellow-500" />
                                <div>
                                    <div className="font-semibold">Star on GitHub</div>
                                    <div className="text-sm text-muted-foreground">It helps a lot!</div>
                                </div>
                            </a>
                            <a
                                href="https://github.com/YourUsername/radar/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                            >
                                <Bug className="h-5 w-5 text-red-500" />
                                <div>
                                    <div className="font-semibold">Report Bugs</div>
                                    <div className="text-sm text-muted-foreground">Help improve quality</div>
                                </div>
                            </a>
                            <a
                                href="https://github.com/YourUsername/radar/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                            >
                                <Lightbulb className="h-5 w-5 text-blue-500" />
                                <div>
                                    <div className="font-semibold">Suggest Features</div>
                                    <div className="text-sm text-muted-foreground">Share your ideas</div>
                                </div>
                            </a>
                            <div className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3 cursor-pointer">
                                <Share2 className="h-5 w-5 text-green-500" />
                                <div>
                                    <div className="font-semibold">Share with Friends</div>
                                    <div className="text-sm text-muted-foreground">Spread the word</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Thank You */}
                <div className="text-center mt-12 p-6 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-lg">
                    <h3 className="text-2xl font-bold mb-2">Thank You! ❤️</h3>
                    <p className="text-muted-foreground">
                        Your support makes it possible to keep Radar free for everyone
                    </p>
                </div>
            </main>
        </div>
    );
}
