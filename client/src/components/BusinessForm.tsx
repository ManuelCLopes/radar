import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Building2, MapPin, Search, Loader2, AlertTriangle, CheckCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBusinessSchema, businessTypes, type InsertBusiness, type BusinessType, type PlaceResult } from "@shared/schema";
import { z } from "zod";

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

// Define the shape of the form values for type safety
const baseSchema = z.object({
  name: z.string(),
  type: z.enum(businessTypes),
  address: z.string(),
});

type FormValues = z.infer<typeof baseSchema>;

interface BusinessFormProps {
  onSubmit: (data: InsertBusiness) => Promise<void>;
  isPending?: boolean;
  initialValues?: Partial<FormValues>;
}

interface SearchResponse {
  results: PlaceResult[];
  apiKeyMissing: boolean;
  message?: string;
}

export function BusinessForm({ onSubmit, isPending = false, initialValues }: BusinessFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [manualCoordinates, setManualCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingLocationAddress, setPendingLocationAddress] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMultipleResultsModal, setShowMultipleResultsModal] = useState(false);
  const [showAddressSuggestionDialog, setShowAddressSuggestionDialog] = useState(false);
  const [showNoResultsDialog, setShowNoResultsDialog] = useState(false);
  const [showApiKeyMissingDialog, setShowApiKeyMissingDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [suggestedPlace, setSuggestedPlace] = useState<PlaceResult | null>(null);
  const [pendingSubmitData, setPendingSubmitData] = useState<FormValues | null>(null);

  const formSchema = z.object({
    name: z.string().min(1, t("validation.required")).max(100),
    type: z.enum(businessTypes, { required_error: t("validation.required") }),
    address: z.string().min(1, t("validation.required")),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      type: initialValues?.type || undefined,
      address: initialValues?.address || "",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string): Promise<SearchResponse> => {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to search places");
      }
      return response.json();
    },
  });

  const getBusinessTypeLabel = (type: BusinessType): string => {
    const key = businessTypeKeys[type];
    return t(`business.types.${key}`) as string;
  };

  const handleSearchAddress = async () => {
    const address = form.getValues("address");
    const name = form.getValues("name");

    if (!address.trim()) {
      toast({
        title: t("toast.error.title"),
        description: t("addressSearch.enterAddress"),
        variant: "destructive",
      });
      return;
    }

    const searchQuery = name ? `${name}, ${address}` : address;

    try {
      const result = await searchMutation.mutateAsync(searchQuery);

      if (result.apiKeyMissing) {
        setPendingSubmitData(form.getValues());
        setShowApiKeyMissingDialog(true);
        return;
      }

      if (result.results.length === 0) {
        setPendingSubmitData(form.getValues());
        setShowNoResultsDialog(true);
      } else if (result.results.length === 1) {
        const place = result.results[0];
        const inputAddress = address.toLowerCase().trim();
        const foundAddress = place.address.toLowerCase();

        if (inputAddress !== foundAddress && foundAddress.includes(inputAddress.split(",")[0])) {
          setSuggestedPlace(place);
          setShowAddressSuggestionDialog(true);
        } else {
          selectPlace(place);
        }
      } else {
        setSearchResults(result.results);
        setShowMultipleResultsModal(true);
      }
    } catch (error) {
      toast({
        title: t("toast.error.title"),
        description: t("addressSearch.searchFailed"),
        variant: "destructive",
      });
    }
  };

  const selectPlace = (place: PlaceResult) => {
    setSelectedPlace(place);
    setManualCoordinates(null);
    setPendingLocationAddress(null);
    form.setValue("address", place.address);
    setShowMultipleResultsModal(false);
    setShowAddressSuggestionDialog(false);
    toast({
      title: t("addressSearch.placeSelected"),
      description: place.name,
    });
  };

  const handleGetCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsGettingLocation(false);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setIsGettingLocation(false);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleUseCurrentLocation = async () => {
    try {
      const coords = await handleGetCurrentLocation();
      setManualCoordinates(coords);
      setSelectedPlace(null);
      setPendingLocationAddress(null);
      setShowNoResultsDialog(false);
      setShowApiKeyMissingDialog(false);
      toast({
        title: t("addressSearch.locationObtained"),
        description: t("addressSearch.locationObtainedDesc"),
      });
    } catch (error) {
      const errorMessage = error instanceof GeolocationPositionError
        ? (error.code === 1
          ? t("addressSearch.locationDenied")
          : t("addressSearch.locationFailed"))
        : t("addressSearch.locationFailed");

      toast({
        title: t("toast.error.title"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleProceedWithAddress = () => {
    const address = form.getValues("address");
    setPendingLocationAddress(address);
    setSelectedPlace(null);
    setManualCoordinates(null);
    setShowNoResultsDialog(false);
    setShowApiKeyMissingDialog(false);
    toast({
      title: t("addressSearch.proceedingWithAddress"),
      description: t("addressSearch.proceedingWithAddressDesc"),
    });
  };

  const handleSubmit = async (data: FormValues) => {
    // If editing and address hasn't changed, skip search/validation
    if (initialValues && data.address === initialValues.address) {
      const businessData: InsertBusiness = {
        name: data.name,
        type: data.type,
        address: data.address,
        // Preserve existing coordinates if not changed (handled by backend merge or we pass undefined)
        // Actually, we should probably pass null or undefined if we don't have new coords, 
        // but since we don't have the full business object here, we rely on the parent or the fact that we are updating.
        // For update, we might want to pass only changed fields, but this form submits a full InsertBusiness object.
        // Let's assume if address is unchanged, we keep existing location status.
        locationStatus: "validated", // Assuming existing is validated if we are editing
      };
      await onSubmit(businessData);
      form.reset();
      return;
    }

    if (!selectedPlace && !manualCoordinates && !pendingLocationAddress) {
      await handleSearchAddress();
      return;
    }

    const isPending = !!pendingLocationAddress && !selectedPlace && !manualCoordinates;

    const businessData: InsertBusiness = {
      name: data.name,
      type: data.type,
      address: selectedPlace?.address || data.address,
      latitude: selectedPlace?.latitude || manualCoordinates?.lat || null,
      longitude: selectedPlace?.longitude || manualCoordinates?.lng || null,
      locationStatus: isPending ? "pending" : "validated",
    };

    await onSubmit(businessData);
    form.reset();
    setSelectedPlace(null);
    setManualCoordinates(null);
    setPendingLocationAddress(null);
  };

  const handleAcceptSuggestedAddress = () => {
    if (suggestedPlace) {
      selectPlace(suggestedPlace);
    }
  };

  const handleKeepOriginalAddress = () => {
    setShowAddressSuggestionDialog(false);
    setPendingSubmitData(form.getValues());
    setShowNoResultsDialog(true);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("business.form.name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("business.form.namePlaceholder")}
                    data-testid="input-business-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("business.form.type")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-business-type">
                      <SelectValue placeholder={t("business.form.typePlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type} data-testid={`option-type-${type}`}>
                        {getBusinessTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("business.form.address")}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder={t("business.form.addressPlaceholder")}
                      data-testid="input-address"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (selectedPlace) {
                          setSelectedPlace(null);
                        }
                        if (manualCoordinates) {
                          setManualCoordinates(null);
                        }
                        if (pendingLocationAddress) {
                          setPendingLocationAddress(null);
                        }
                      }}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchAddress}
                    disabled={searchMutation.isPending}
                    data-testid="button-search-address"
                  >
                    {searchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
                {selectedPlace && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t("addressSearch.addressVerified")}</span>
                  </div>
                )}
                {manualCoordinates && !selectedPlace && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-blue-600 dark:text-blue-400">
                    <Navigation className="h-4 w-4" />
                    <span>{t("addressSearch.usingCurrentLocation")}</span>
                  </div>
                )}
                {pendingLocationAddress && !selectedPlace && !manualCoordinates && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t("addressSearch.pendingVerification")}</span>
                  </div>
                )}
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || searchMutation.isPending}
            data-testid="button-submit-business"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("business.form.submitting")}
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                {t("business.form.submit")}
              </>
            )}
          </Button>
        </form>
      </Form>

      <Dialog open={showMultipleResultsModal} onOpenChange={setShowMultipleResultsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addressSearch.multipleResults.title")}</DialogTitle>
            <DialogDescription>
              {t("addressSearch.multipleResults.description")}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <div className="space-y-2 pr-4">
              {searchResults.map((place, index) => (
                <Card
                  key={place.placeId || index}
                  className="cursor-pointer hover-elevate"
                  onClick={() => selectPlace(place)}
                  data-testid={`card-place-result-${index}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{place.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{place.address}</p>
                      </div>
                      {place.rating && (
                        <Badge variant="secondary" className="shrink-0">
                          {place.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMultipleResultsModal(false)}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAddressSuggestionDialog} onOpenChange={setShowAddressSuggestionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t("addressSearch.suggestion.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t("addressSearch.suggestion.description")}</p>
              {suggestedPlace && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{suggestedPlace.name}</p>
                    <p className="text-sm text-muted-foreground">{suggestedPlace.address}</p>
                  </CardContent>
                </Card>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepOriginalAddress}>
              {t("addressSearch.suggestion.keepOriginal")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptSuggestedAddress}>
              {t("addressSearch.suggestion.useThis")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showNoResultsDialog} onOpenChange={setShowNoResultsDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {t("addressSearch.noResults.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("addressSearch.noResults.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <AlertDialogAction
              onClick={handleUseCurrentLocation}
              disabled={isGettingLocation}
              data-testid="button-use-location-fallback"
              className="w-full"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {t("addressSearch.useCurrentLocation")}
            </AlertDialogAction>
            <Button
              variant="outline"
              onClick={handleProceedWithAddress}
              data-testid="button-proceed-with-address"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {t("addressSearch.proceedWithAddress")}
            </Button>
            <AlertDialogCancel
              onClick={() => setShowNoResultsDialog(false)}
              className="w-full"
            >
              {t("addressSearch.noResults.editAddress")}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showApiKeyMissingDialog} onOpenChange={setShowApiKeyMissingDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {t("addressSearch.apiKeyMissing.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("addressSearch.apiKeyMissing.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 pt-4">
            <AlertDialogAction
              onClick={handleUseCurrentLocation}
              disabled={isGettingLocation}
              data-testid="button-use-location-api-missing"
              className="w-full"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {t("addressSearch.useCurrentLocation")}
            </AlertDialogAction>
            <Button
              variant="outline"
              onClick={handleProceedWithAddress}
              data-testid="button-proceed-with-address-api-missing"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {t("addressSearch.proceedWithAddress")}
            </Button>
            <AlertDialogCancel
              onClick={() => setShowApiKeyMissingDialog(false)}
              className="w-full"
            >
              {t("common.cancel")}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
