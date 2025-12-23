import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Heart, Github, Twitter, Linkedin, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Footer() {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand and Mission */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center">
                            <img src="/logo-dark.png" alt="Competitor Watcher" className="h-8 w-auto mb-4 dark:hidden" />
                            <img src="/logo.png" alt="Competitor Watcher" className="h-8 w-auto mb-4 hidden dark:block" />
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6 leading-relaxed">
                            {t("footer.mission", { defaultValue: "Empowering local businesses with AI-driven competitor insights. 100% free and open source." })}
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
                            {t("footer.sections.project", { defaultValue: "Project" })}
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/support" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                                    <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                                    {t("footer.links.support", { defaultValue: "Support Us" })}
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {t("footer.links.home", { defaultValue: "Home" })}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Account Section - Incorporating the "Already a customer" link */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
                            {t("footer.sections.account", { defaultValue: "Account" })}
                        </h3>
                        <ul className="space-y-3">
                            {isAuthenticated ? (
                                <li>
                                    <Link href="/dashboard" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2">
                                        <User className="h-3.5 w-3.5" />
                                        {t("footer.links.dashboard", { defaultValue: "Dashboard" })}
                                    </Link>
                                </li>
                            ) : (
                                <>
                                    <li>
                                        <Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                                            {t("landing.cta.existingAccount")}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/register" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            {t("auth.signUp")}
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
                            {t("footer.sections.legal", { defaultValue: "Legal" })}
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/privacy-policy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {t("legal.privacy.title")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookie-policy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {t("legal.cookies.title")}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-400 text-center md:text-left">
                        &copy; {currentYear} Competitor Watcher. {t("footer.allRightsReserved", { defaultValue: "All rights reserved." })}
                    </p>
                    <p className="text-sm text-gray-400 flex items-center gap-1 justify-center md:justify-end">
                        {t("footer.madeWith", { defaultValue: "Made with" })} <Heart className="h-3 w-3 text-red-500 fill-current" /> {t("footer.forSmallBusinesses", { defaultValue: "for small businesses." })}
                    </p>
                </div>
            </div>
        </footer>
    );
}
