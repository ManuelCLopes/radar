import { MapPin, Building2, FileText, Loader2, Calendar, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Business, BusinessType } from "@shared/schema";

const businessTypeLabels: Record<BusinessType, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe",
  retail: "Retail",
  gym: "Gym",
  salon: "Salon",
  pharmacy: "Pharmacy",
  hotel: "Hotel",
  bar: "Bar",
  bakery: "Bakery",
  supermarket: "Supermarket",
  clinic: "Clinic",
  dentist: "Dentist",
  bank: "Bank",
  gas_station: "Gas Station",
  car_repair: "Auto Repair",
  other: "Other",
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

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No businesses registered</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Register your first business using the form to start analyzing your local competition.
        </p>
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
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Your Businesses
          </CardTitle>
          <CardDescription>Loading your registered businesses...</CardDescription>
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
            Your Businesses
          </CardTitle>
          <CardDescription>Manage and analyze your registered businesses</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Your Businesses
          <Badge variant="secondary" className="ml-2">{businesses.length}</Badge>
        </CardTitle>
        <CardDescription>Manage and analyze your registered businesses</CardDescription>
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
                      {businessTypeLabels[business.type]}
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
                    Added {new Date(business.createdAt).toLocaleDateString()}
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
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onViewHistory(business)}
                    data-testid={`button-view-history-${business.id}`}
                    title="View Report History"
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
                        <AlertDialogTitle>Delete Business</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{business.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(business.id)}
                          data-testid="button-confirm-delete"
                        >
                          Delete
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
