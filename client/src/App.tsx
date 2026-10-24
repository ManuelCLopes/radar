import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import Dashboard from "@/pages/Dashboard";
import SettingsPage from "@/pages/SettingsPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PublicReportPage from "@/pages/PublicReportPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminActivity from "@/pages/AdminActivity";
import AdminWaitlist from "@/pages/AdminWaitlist";
import SupportPage from "@/pages/SupportPage";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import CookiePolicy from "@/pages/legal/CookiePolicy";
import NotFound from "@/pages/not-found";
import MarketingPage from "@/pages/MarketingPage";
import SampleReportPage from "@/pages/SampleReportPage";
import { getRouteLocale, isLocalizedPublicPath, localizePath } from "@/lib/localeRoutes";
import ScrollToTop from "@/components/ScrollToTop";
import { CookieConsent } from "@/components/CookieConsent";
import './i18n';
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import VerifyEmail from "@/pages/VerifyEmail";
import { VerificationBanner } from "@/components/VerificationBanner";
import { PricingModalProvider } from "@/context/PricingModalContext";
import { Analytics } from "@vercel/analytics/react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <VerificationBanner />
      <Component />
    </>
  );
}

function ProtectedDashboard() {
  return <ProtectedRoute component={Dashboard} />;
}

function ProtectedSettings() {
  return <ProtectedRoute component={SettingsPage} />;
}

// Keeps the UI language and the /pt URL prefix of public pages in sync. Runs
// only when the location changes, so a language picked in the selector (which
// navigates itself) is never overridden.
function RouteLanguageSync() {
  const [location, navigate] = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!isLocalizedPublicPath(location)) return;
    const language = i18n.resolvedLanguage || i18n.language || "en";
    if (getRouteLocale(location) === "pt") {
      if (!language.startsWith("pt")) i18n.changeLanguage("pt");
    } else if (language.startsWith("pt")) {
      navigate(localizePath(location, "pt"), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/pt" component={LandingPage} />
      <Route path="/local-competitor-analysis" component={MarketingPage} />
      <Route path="/pt/local-competitor-analysis" component={MarketingPage} />
      <Route path="/competitor-tracker" component={MarketingPage} />
      <Route path="/pt/competitor-tracker" component={MarketingPage} />
      <Route path="/competitor-analysis-report" component={SampleReportPage} />
      <Route path="/pt/competitor-analysis-report" component={SampleReportPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/r/:token" component={PublicReportPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/settings" component={ProtectedSettings} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/waitlist" component={AdminWaitlist} />
      <Route path="/admin/activity" component={AdminActivity} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PricingModalProvider>
          <Toaster />
          <ScrollToTop />
          <RouteLanguageSync />
          <Router />
          <CookieConsent />
          <Analytics />
        </PricingModalProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
