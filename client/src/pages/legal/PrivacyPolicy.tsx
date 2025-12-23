import { Link } from "wouter";
import { ChevronLeft, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function PrivacyPolicy() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">{t("auth.backToHome")}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <LanguageSelector />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold">
                            {t("legal.privacy.title")}
                        </h1>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        {t("legal.privacy.lastUpdated")}
                    </p>

                    <div className="prose prose-blue dark:prose-invert max-w-none space-y-8">
                        <section>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {t("legal.privacy.intro")}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">
                                {t("legal.privacy.sections.dataCollection")}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {t("legal.privacy.dataCollection")}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">
                                {t("legal.privacy.sections.useOfInfo")}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {t("legal.privacy.useOfInfo")}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">
                                {t("legal.privacy.sections.userRights")}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {t("legal.privacy.userRights")}
                            </p>
                        </section>

                        <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl font-semibold mb-4">
                                {t("legal.privacy.sections.contact")}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {t("legal.privacy.contactDesc")}
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
