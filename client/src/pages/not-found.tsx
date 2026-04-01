import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Seo } from "@/components/Seo";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <Seo
        title={`404 | Competitor Watcher`}
        description={t("notFound.description")}
        path="/404"
        noIndex
      />
      <Card className="w-full max-w-md border-gray-200 dark:border-gray-800">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">404</p>
            <CardTitle className="text-2xl">{t("notFound.title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("notFound.description")}
          </p>
          <Button asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.backToHome")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
