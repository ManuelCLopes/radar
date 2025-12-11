import { Link } from "wouter";
import { MapPin, Star, Mail, Map, BarChart3, MessageSquare, Lightbulb, Utensils, Scissors, Dumbbell, Hotel, Store, LogIn, Search, Check, X, User, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadiusSelector } from "@/components/RadiusSelector";
import { PreviewReportModal } from "@/components/PreviewReportModal";
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
  const [previewData, setPreviewData] = useState<any>(null);
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
    setSearchError('');
    setIsSearching(true);

    try {
      const response = await fetch('/api/quick-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          language: t('common.language', { defaultValue: 'en' }) // Pass current language code
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Map backend error messages to translated versions
        let errorMessage = t('quickSearch.error');

        if (responseData.message) {
          if (responseData.message.includes('Could not find coordinates')) {
            errorMessage = t('quickSearch.errors.addressNotFound');
          } else if (responseData.message.includes('Radius must be')) {
            errorMessage = t('quickSearch.errors.invalidRadius');
          } else if (responseData.message.includes('required')) {
            errorMessage = t('quickSearch.errors.missingFields');
          } else if (responseData.message.includes('Too many searches')) {
            errorMessage = t('quickSearch.errors.rateLimitExceeded');
          }
        }

        setSearchError(errorMessage);
        setIsSearching(false);
        return;
      }

      // Show preview in modal instead of navigating
      setPreviewData(responseData);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Quick search error:', error);
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
            <div className="landing-header-logo">
              <BarChart3 />
            </div>
            <span className="landing-header-title">{t('landing.brandName')}</span>
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
                <BarChart3 />
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
                <BarChart3 />
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
              <ul>
                {t('landing.sampleSection.features.list').split('\n').map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p>
                {t('landing.sampleSection.features.personalized')}
              </p>
            </div>
            <div className="sample-image-placeholder" data-testid="sample-image-placeholder">
              Screenshot do relatório<br />
              (imagem de exemplo)
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

      {/* CTA FINAL */}
      <section className="cta-final" id="cta-final" data-testid="section-cta-final">
        <div className="landing-container">
          <h2 className="section-title">
            {t('landing.cta.question')}
          </h2>
          <p className="cta-final-text">
            {t('landing.cta.requestSampleDescription')}
          </p>
          <a
            href="mailto:contacto@radarlocal.pt?subject=Pedido de amostra de relatório"
            className="btn-primary"
            data-testid="link-cta-request-sample"
          >
            {t('landing.cta.requestSample')}
          </a>
          <p className="cta-final-subtext">
            {t('landing.cta.noCommitment')}
          </p>
        </div>
      </section>

      {/* LINK PARA DASHBOARD */}
      <section className="dashboard-link-section" data-testid="section-dashboard-link">
        <div className="landing-container">
          <Link href="/dashboard" className="dashboard-link" data-testid="link-dashboard">
            {t('landing.cta.existingCustomer')}
          </Link>
        </div>
      </section>

      {/* Preview Report Modal */}
      {previewData && (
        <PreviewReportModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          competitors={previewData.competitors}
          totalFound={previewData.totalFound}
          aiInsights={previewData.aiInsights}
          location={previewData.location}
          radius={previewData.radius}
          onCreateAccount={() => window.location.href = '/register'}
        />
      )}
    </div>
  );
}
