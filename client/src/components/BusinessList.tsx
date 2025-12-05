import { useTranslation } from "react-i18next";
import { MapPin, Building2, FileText, Loader2, Calendar, Trash2, History, AlertTriangle, CheckCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  onEdit: (business: Business) => void;
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
  onEdit,
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
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold flex items-center gap-2 flex-wrap">
          <Building2 className="h-5 w-5 text-primary" />
          {t("business.list.title")}
          <Badge variant="secondary">{businesses.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 min-w-0">
        {businesses.map((business) => {
          const isPending = business.locationStatus === "pending" || business.latitude === null || business.longitude === null;

          return (
            <Card
              key={business.id}
              className="hover-elevate transition-all min-w-0"
              data-testid={`card-business-${business.id}`}
            >
              <CardContent className="p-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base break-words" data-testid={`text-business-name-${business.id}`}>
                        {business.name}
                      </h3>
                      {isPending ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 text-yellow-600 border-yellow-600 shrink-0"
                              data-testid={`badge-pending-${business.id}`}
                              aria-label={t("locationStatus.pending")}
                            >
                              <AlertTriangle className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="start">
                            <p className="text-sm font-medium text-yellow-600">{t("locationStatus.pending")}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t("locationStatus.pendingNote")}</p>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 text-green-600 border-green-600 shrink-0"
                              data-testid={`badge-verified-${business.id}`}
                              aria-label={t("locationStatus.validated")}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="start">
                            <p className="text-sm font-medium text-green-600">{t("locationStatus.validated")}</p>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" data-testid={`badge-type-${business.id}`}>
                        {getBusinessTypeLabel(business.type)}
                      </Badge>
                      {business.latitude !== null && business.longitude !== null && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                    {business.address && (
                      <p className="text-sm text-muted-foreground break-words">
                        {business.address}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(business.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      onClick={() => onGenerateReport(business.id)}
                      disabled={generatingReportId === business.id || isPending}
                      data-testid={`button-generate-report-${business.id}`}
                      title={isPending ? t("locationStatus.pendingNote") : undefined}
                      size="sm"
                    >
                      {generatingReportId === business.id ? (
                        <>
                          <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">{t("business.list.generating")}</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{t("business.list.generateReport")}</span>
                          <span className="sm:hidden">{t("business.list.report")}</span>
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(business)}
                      data-testid={`button-edit-${business.id}`}
                      title={t("common.edit")}
                    >
                      <Pencil className="h-4 w-4" />
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
          )
        })}
      </CardContent>
    </Card>
  );
}
