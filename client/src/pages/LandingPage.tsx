import { Link } from "wouter";
import { MapPin, Star, Mail, Map, MessageSquare, Lightbulb, Utensils, Scissors, Dumbbell, Hotel, Store, LogIn, Search, Check, X, User, LayoutDashboard, ChevronLeft, ChevronRight, Heart, Sparkles, Rocket, Target, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadiusSelector } from "@/components/RadiusSelector";
import { ReportView } from "@/components/ReportView";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import "./LandingPage.css";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Pricing removed - app is 100% free with donations

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // Quick search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const searchSchema = z.object({
    address: z.string().min(1, t("validation.required")),
    type: z.string().min(1, t("validation.required")),
    radius: z.number().min(1, t("validation.required")),
  });

  type SearchFormValues = z.infer<typeof searchSchema>;

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      address: '',
      type: 'restaurant',
      radius: 1000,
    },
  });





  const onSearchSubmit = async (data: SearchFormValues) => {
    // Check if user has already generated a free report (only for guests)
    if (!isAuthenticated) {
      const hasGenerated = localStorage.getItem('competitive_watcher_free_report_generated');
      if (hasGenerated) {
        setShowLimitModal(true);
        return;
      }
    }

    setSearchError('');
    setIsSearching(true);

    try {
      // Determine which endpoint to use based on auth status
      const endpoint = isAuthenticated ? '/api/analyze-address' : '/api/quick-search';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          language: t('common.language', { defaultValue: 'en' })
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Map backend error messages to translated versions
        let errorMessage = t('quickSearch.error');

        if (responseData.message || responseData.error) {
          const msg = responseData.message || responseData.error;
          if (msg.includes('Could not find coordinates') || msg.includes('Address not found')) {
            errorMessage = t('quickSearch.errors.addressNotFound');
          } else if (msg.includes('Radius must be')) {
            errorMessage = t('quickSearch.errors.invalidRadius');
          } else if (msg.includes('required') || msg.includes('Missing')) {
            errorMessage = t('quickSearch.errors.missingFields');
          } else if (msg.includes('Too many searches')) {
            errorMessage = t('quickSearch.errors.rateLimitExceeded');
          }
        }

        setSearchError(errorMessage);
        setIsSearching(false);
        return;
      }

      // Show full report in modal
      // For authenticated users, the response is the report directly (or wrapped)
      // For guests, it's { report: ... }
      const report = isAuthenticated ? responseData : responseData.report;

      setReportData(report);
      setShowPreviewModal(true);

      // Mark as generated only for guests
      if (!isAuthenticated) {
        localStorage.setItem('competitive_watcher_free_report_generated', 'true');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(t('quickSearch.errors.searchFailed'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="landing-page">
      {/* HEADER */}
      <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-container">
          <div className="landing-header-brand">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Competitive Watcher" className="h-14 w-auto" />
            </Link>
          </div>
          <div className="landing-header-actions">
            <LanguageSelector />
            <ThemeToggle />
            {!isLoading && (
              isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" title="Dashboard" className="expandable-btn">
                    <LayoutDashboard className="h-5 w-5" />
                    <span aria-hidden="true">Dashboard</span>
                    <span className="sr-only">Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="icon" data-testid="button-login" title="Login" className="expandable-btn">
                    <User className="h-5 w-5" />
                    <span aria-hidden="true">Login</span>
                    <span className="sr-only">Login</span>
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* HERO WITH QUICK SEARCH */}
      <section className="hero">
        <div className="landing-container">
          <h1 className="hero-headline" data-testid="hero-headline">
            {t('quickSearch.title')}
          </h1>
          <p className="hero-subheadline" data-testid="hero-subheadline">
            {t('quickSearch.subtitle')}
          </p>

          {/* Quick Search Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearchSubmit)} className="max-w-4xl mx-auto mt-8">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Address Input */}
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('quickSearch.addressPlaceholder')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="Rua de Belém 84-92, 1300-085 Lisboa"
                              className="h-12 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Business Type Selector */}
                  <div>
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('quickSearch.selectType')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="restaurant">🍽️ {t("businessTypes.restaurant")}</SelectItem>
                              <SelectItem value="cafe">☕ {t("businessTypes.cafe")}</SelectItem>
                              <SelectItem value="retail">🛍️ {t("businessTypes.retail")}</SelectItem>
                              <SelectItem value="gym">💪 {t("businessTypes.gym")}</SelectItem>
                              <SelectItem value="salon">💇 {t("businessTypes.salon")}</SelectItem>
                              <SelectItem value="hotel">🏨 {t("businessTypes.hotel")}</SelectItem>
                              <SelectItem value="bar">🍺 {t("businessTypes.bar")}</SelectItem>
                              <SelectItem value="bakery">🥖 {t("businessTypes.bakery")}</SelectItem>
                              <SelectItem value="pharmacy">💊 {t("businessTypes.pharmacy")}</SelectItem>
                              <SelectItem value="supermarket">🛒 {t("businessTypes.supermarket")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Radius Selector */}
                  <div>
                    <FormField
                      control={form.control}
                      name="radius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('quickSearch.selectRadius')}
                          </FormLabel>
                          <FormControl>
                            <RadiusSelector
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {searchError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {searchError}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSearching ? (
                    <>
                      <Search className="w-5 h-5 mr-2 animate-spin" />
                      {t('quickSearch.searching')}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      {t('quickSearch.analyzeButton')}
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                  ✨ {t('quickSearch.noSignupRequired')}
                </p>
              </div>
            </form>
          </Form>

          {/* Features */}
          <div className="hero-features mt-12" data-testid="hero-features">
            <div className="hero-feature">
              <MapPin className="hero-feature-icon" />
              <span>{t('landing.heroFeatures.competitors')}</span>
            </div>
            <div className="hero-feature">
              <Star className="hero-feature-icon" />
              <span>{t('landing.heroFeatures.ratings')}</span>
            </div>
            <div className="hero-feature">
              <Mail className="hero-feature-icon" />
              <span>{t('landing.heroFeatures.monthlyReport')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="landing-section" data-testid="section-how-it-works">
        <div className="landing-container">
          <h2 className="section-title">{t('landing.howItWorks.title')}</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">
                <Utensils />
              </div>
              <h3 className="step-title">{t('landing.howItWorks.step1.title')}</h3>
              <p className="step-description">
                {t('landing.howItWorks.step1.description')}
              </p>
            </div>
            <div className="step-arrow">
              <ChevronRight />
            </div>
            <div className="step-card">
              <div className="step-icon">
                <Mail />
              </div>
              <h3 className="step-title">{t('landing.howItWorks.step2.title')}</h3>
              <p className="step-description">
                {t('landing.howItWorks.step2.description')}
              </p>
            </div>
            <div className="step-arrow">
              <ChevronRight />
            </div>
            <div className="step-card">
              <div className="step-icon">
                <TrendingUp />
              </div>
              <h3 className="step-title">{t('landing.howItWorks.step3.title')}</h3>
              <p className="step-description">
                {t('landing.howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* O QUE VEM NO RELATÓRIO */}
      <section className="landing-section" data-testid="section-report-features">
        <div className="landing-container">
          <h2 className="section-title">{t('landing.reportFeatures.title')}</h2>
          <p className="section-subtitle">
            {t('landing.reportFeatures.subtitle')}
          </p>
          <div className="report-cards">
            <div className="report-card">
              <div className="report-card-icon">
                <Map />
              </div>
              <h3 className="report-card-title">{t('landing.reportFeatures.map.title')}</h3>
              <p className="report-card-description">
                {t('landing.reportFeatures.map.description')}
              </p>
            </div>
            <div className="report-card">
              <div className="report-card-icon">
                <TrendingUp />
              </div>
              <h3 className="report-card-title">{t('landing.reportFeatures.comparison.title')}</h3>
              <p className="report-card-description">
                {t('landing.reportFeatures.comparison.description')}
              </p>
            </div>
            <div className="report-card">
              <div className="report-card-icon">
                <MessageSquare />
              </div>
              <h3 className="report-card-title">{t('landing.reportFeatures.reviews.title')}</h3>
              <p className="report-card-description">
                {t('landing.reportFeatures.reviews.description')}
              </p>
            </div>
            <div className="report-card">
              <div className="report-card-icon">
                <Lightbulb />
              </div>
              <h3 className="report-card-title">{t('landing.reportFeatures.recommendations.title')}</h3>
              <p className="report-card-description">
                {t('landing.reportFeatures.recommendations.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AMOSTRA DO RELATÓRIO */}
      <section className="landing-section" data-testid="section-sample">
        <div className="landing-container">
          <div className="sample-section">
            <div className="sample-text">
              <h2 className="section-title">{t('landing.sampleSection.title')}</h2>
              <p>
                {t('landing.sampleSection.description')}
              </p>

            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 w-full max-w-lg" data-testid="sample-features-grid">
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <Map className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">{t('landing.sampleSection.features.keyPoints.map')}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <Target className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">{t('landing.sampleSection.features.keyPoints.swot')}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">{t('landing.sampleSection.features.keyPoints.trends')}</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">{t('landing.sampleSection.features.keyPoints.sentiment')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="landing-section" data-testid="section-audience">
        <div className="landing-container centered">
          <h2 className="section-title">{t('landing.targetAudience.title')}</h2>
          <p className="section-subtitle">
            {t('landing.targetAudience.subtitle')}
          </p>
          <div className="audience-grid" data-testid="audience-list">
            <div className="audience-item">
              <div className="audience-icon">
                <Utensils />
              </div>
              <span>{t('landing.targetAudience.restaurants')}</span>
            </div>
            <div className="audience-item">
              <div className="audience-icon">
                <Scissors />
              </div>
              <span>{t('landing.targetAudience.beauty')}</span>
            </div>
            <div className="audience-item">
              <div className="audience-icon">
                <Dumbbell />
              </div>
              <span>{t('landing.targetAudience.fitness')}</span>
            </div>
            <div className="audience-item">
              <div className="audience-icon">
                <Hotel />
              </div>
              <span>{t('landing.targetAudience.hotels')}</span>
            </div>
            <div className="audience-item">
              <div className="audience-icon">
                <Store />
              </div>
              <span>{t('landing.targetAudience.retail')}</span>
            </div>
          </div>
          <p className="audience-final">
            {t('landing.targetAudience.conclusion')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" data-testid="section-faq">
        <div className="landing-container">
          <h2 className="section-title">{t('landing.faq.title')}</h2>
          <div className="faq-list">
            <div className="faq-item" data-testid="faq-item-1">
              <h3 className="faq-question">{t('landing.faq.q1.question')}</h3>
              <p className="faq-answer">
                {t('landing.faq.q1.answer')}
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-2">
              <h3 className="faq-question">{t('landing.faq.q2.question')}</h3>
              <p className="faq-answer">
                {t('landing.faq.q2.answer')}
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-3">
              <h3 className="faq-question">{t('landing.faq.q3.question')}</h3>
              <p className="faq-answer">
                {t('landing.faq.q3.answer')}
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-4">
              <h3 className="faq-question">{t('landing.faq.q4.question')}</h3>
              <p className="faq-answer">
                {t('landing.faq.q4.answer')}
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-5">
              <h3 className="faq-question">{t('landing.faq.q5.question')}</h3>
              <p className="faq-answer">
                {t('landing.faq.q5.answer')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT PROJECT CTA */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20" id="cta-final" data-testid="section-cta-final">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-20 right-20 w-64 h-64 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="landing-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Heart icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-lg animate-bounce">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {t('landing.support.title')}
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              {t('landing.support.description')}
            </p>

            <Link href="/support">
              <button className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" data-testid="link-support-project">
                <Heart className="w-4 h-4" />
                <span>{t('landing.support.cta')}</span>
              </button>
            </Link>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('landing.support.footer')}
            </p>
          </div>
        </div>
      </section>

      {/* LINK PARA DASHBOARD */}
      <section className="dashboard-link-section" data-testid="section-dashboard-link">
        <div className="landing-container">
          <Link href={isAuthenticated ? "/dashboard" : "/login"} className="dashboard-link" data-testid="link-dashboard">
            {t('landing.cta.existingAccount')}
          </Link>
        </div>
      </section>

      {/* Full Report Modal (Guest Mode) */}
      {reportData && (
        <ReportView
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          report={reportData}
          isGuest={!isAuthenticated}
        />
      )}

      {/* Limit Reached Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2 text-center w-full">
              <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t("previewReport.benefits.limitReachedTitle")}
              </DialogTitle>
              <DialogDescription className="text-center text-base text-gray-600 dark:text-gray-300 max-w-[350px] mx-auto">
                {t("previewReport.benefits.limitReachedDesc")}
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                {t("previewReport.benefits.fullAnalysis")}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                {t("previewReport.benefits.saveTrack")}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                {t("previewReport.benefits.export")}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <Button
              onClick={() => window.location.href = '/register'}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Rocket className="w-4 h-4 mr-2" />
              {t("auth.signUp")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowLimitModal(false)}
              className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
