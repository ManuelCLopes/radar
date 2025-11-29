import { useTranslation } from "react-i18next";
import { MapPin, Building2, FileText, Loader2, Calendar, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Business, BusinessType } from "@shared/schema";

const businessTypeKeys: Record<BusinessType, string> = {
  restaurant: "restaurant",
  cafe: "cafe",
  retail: "retail",
  gym: "gym",
  salon: "salon",
  pharmacy: "pharmacy",
  hotel: "hotel",
  bar: "bar",
  bakery: "bakery",
  supermarket: "supermarket",
  clinic: "clinic",
  dentist: "dentist",
  bank: "bank",
  gas_station: "gasStation",
  car_repair: "carRepair",
  other: "other",
};

interface BusinessListProps {
  businesses: Business[];
  isLoading?: boolean;
  onGenerateReport: (id: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (business: Business) => void;
  generatingReportId?: string | null;
  deletingId?: string | null;
}

function BusinessCardSkeleton() {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t("business.list.empty")}</h3>
      </CardContent>
    </Card>
  );
}

export function BusinessList({
  businesses,
  isLoading = false,
  onGenerateReport,
  onDelete,
  onViewHistory,
  generatingReportId = null,
  deletingId = null,
}: BusinessListProps) {
  const { t } = useTranslation();

  const getBusinessTypeLabel = (type: BusinessType): string => {
    const key = businessTypeKeys[type];
    return t(`business.types.${key}`) as string;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t("business.list.title")}
          </CardTitle>
          <CardDescription>{t("business.list.loading", "Loading...")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <BusinessCardSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (businesses.length === 0) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t("business.list.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState t={t} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {t("business.list.title")}
          <Badge variant="secondary" className="ml-2">{businesses.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {businesses.map((business) => (
          <Card
            key={business.id}
            className="hover-elevate transition-all"
            data-testid={`card-business-${business.id}`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-semibold text-base truncate" data-testid={`text-business-name-${business.id}`}>
                    {business.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" data-testid={`badge-type-${business.id}`}>
                      {getBusinessTypeLabel(business.type)}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
                    </span>
                  </div>
                  {business.address && (
                    <p className="text-sm text-muted-foreground truncate">
                      {business.address}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(business.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => onGenerateReport(business.id)}
                    disabled={generatingReportId === business.id}
                    data-testid={`button-generate-report-${business.id}`}
                  >
                    {generatingReportId === business.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("business.list.generating")}
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        {t("business.list.generateReport")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onViewHistory(business)}
                    data-testid={`button-view-history-${business.id}`}
                    title={t("business.list.viewHistory")}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={deletingId === business.id}
                        data-testid={`button-delete-${business.id}`}
                      >
                        {deletingId === business.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("business.deleteDialog.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("business.deleteDialog.description", { name: business.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">{t("business.deleteDialog.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(business.id)}
                          data-testid="button-confirm-delete"
                        >
                          {t("business.deleteDialog.confirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
