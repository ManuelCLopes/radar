import { Heart, Github, Coffee, Gift, Star, Bug, Lightbulb, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

export default function SupportPage() {
    const { t } = useTranslation();
    const { toast } = useToast();

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.origin);
        toast({
            title: t('toast.linkCopied.title'),
            description: t('toast.linkCopied.description'),
        });
    };

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
                        <Button variant="outline">{t('support.backToDashboard')}</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Hero */}
                <div className="text-center mb-12">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-red-500 animate-pulse" />
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {t('support.title')}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t('support.subtitle')}
                    </p>
                </div>

                {/* Why Support */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>💜 {t('support.whySupport.title')}</CardTitle>
                        <CardDescription>
                            {t('support.whySupport.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-900 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">🗺️</span>
                                    <div className="font-semibold text-blue-700 dark:text-blue-300">{t('support.costs.maps')}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">{t('support.costs.mapsDesc')}</div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-900 rounded-lg border-l-4 border-green-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">☁️</span>
                                    <div className="font-semibold text-green-700 dark:text-green-300">{t('support.costs.hosting')}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">{t('support.costs.hostingDesc')}</div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-900 rounded-lg border-l-4 border-purple-500">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">🤖</span>
                                    <div className="font-semibold text-purple-700 dark:text-purple-300">{t('support.costs.ai')}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">{t('support.costs.aiDesc')}</div>
                            </div>
                        </div>
                        <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 text-center">
                            <div className="text-lg font-semibold mb-2 text-indigo-900 dark:text-indigo-100">
                                🎯 {t('support.mission')}
                            </div>
                            <div className="text-sm text-muted-foreground max-w-lg mx-auto">
                                {t('support.missionDesc')}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Donation Options */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{t('support.howToSupport')}</CardTitle>
                        <CardDescription>
                            {t('support.everyContribution')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            {/* GitHub Sponsors */}
                            <a
                                href="https://github.com/sponsors/ManuelCLopes"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className="p-4 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 rounded-lg transition-all hover:shadow-lg group text-center h-full flex flex-col">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full group-hover:scale-110 transition-transform mx-auto mb-3">
                                        <Github className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="font-bold mb-2">{t('support.platforms.github.name')}</h3>
                                    <p className="text-xs text-muted-foreground mb-4 flex-grow">{t('support.platforms.github.desc')}</p>
                                    <Button variant="outline" size="sm" className="group-hover:bg-purple-600 group-hover:text-white transition-colors w-full">
                                        {t('support.platforms.github.cta')}
                                    </Button>
                                </div>
                            </a>

                            {/* Ko-fi */}
                            <a
                                href="https://ko-fi.com/manuel_clopes"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className="p-4 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 rounded-lg transition-all hover:shadow-lg group text-center h-full flex flex-col">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full group-hover:scale-110 transition-transform mx-auto mb-3">
                                        <Coffee className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="font-bold mb-2">{t('support.platforms.kofi.name')}</h3>
                                    <p className="text-xs text-muted-foreground mb-4 flex-grow">{t('support.platforms.kofi.desc')}</p>
                                    <Button variant="outline" size="sm" className="group-hover:bg-amber-600 group-hover:text-white transition-colors w-full">
                                        {t('support.platforms.kofi.cta')}
                                    </Button>
                                </div>
                            </a>

                            {/* Buy Me a Coffee */}
                            <a
                                href="https://buymeacoffee.com/manuel_clopes"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className="p-4 border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 rounded-lg transition-all hover:shadow-lg group text-center h-full flex flex-col">
                                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full group-hover:scale-110 transition-transform mx-auto mb-3">
                                        <Gift className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <h3 className="font-bold mb-2">{t('support.platforms.bmac.name')}</h3>
                                    <p className="text-xs text-muted-foreground mb-4 flex-grow">{t('support.platforms.bmac.desc')}</p>
                                    <Button variant="outline" size="sm" className="group-hover:bg-yellow-600 group-hover:text-white transition-colors w-full">
                                        {t('support.platforms.bmac.cta')}
                                    </Button>
                                </div>
                            </a>
                        </div>
                    </CardContent>
                </Card>

                {/* Other Ways to Help */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('support.other.title')}</CardTitle>
                        <CardDescription>
                            {t('support.other.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <a
                                href="https://github.com/ManuelCLopes/radar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                            >
                                <Star className="h-5 w-5 text-yellow-500" />
                                <div>
                                    <div className="font-semibold">{t('support.other.starGithub')}</div>
                                    <div className="text-sm text-muted-foreground">{t('support.other.starGithubDesc')}</div>
                                </div>
                            </a>
                            <a
                                href="https://github.com/ManuelCLopes/radar/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                            >
                                <Bug className="h-5 w-5 text-red-500" />
                                <div>
                                    <div className="font-semibold">{t('support.other.reportBugs')}</div>
                                    <div className="text-sm text-muted-foreground">{t('support.other.reportBugsDesc')}</div>
                                </div>
                            </a>
                            <a
                                href="https://github.com/ManuelCLopes/radar/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                            >
                                <Lightbulb className="h-5 w-5 text-blue-500" />
                                <div>
                                    <div className="font-semibold">{t('support.other.suggestFeatures')}</div>
                                    <div className="text-sm text-muted-foreground">{t('support.other.suggestFeaturesDesc')}</div>
                                </div>
                            </a>
                            <div
                                onClick={handleShare}
                                className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3 cursor-pointer"
                            >
                                <Share2 className="h-5 w-5 text-green-500" />
                                <div>
                                    <div className="font-semibold">{t('support.other.shareWithFriends')}</div>
                                    <div className="text-sm text-muted-foreground">{t('support.other.shareWithFriendsDesc')}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Thank You */}
                <div className="text-center mt-12 p-6 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-lg">
                    <h3 className="text-2xl font-bold mb-2">{t('support.thankYou')}</h3>
                    <p className="text-muted-foreground">
                        {t('support.thankYouMessage')}
                    </p>
                </div>
            </main>
        </div>
    );
}
