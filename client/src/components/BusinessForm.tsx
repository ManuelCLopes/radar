import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Building2, MapPin, Search, Loader2, AlertTriangle, CheckCircle, Navigation, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBusinessSchema, businessTypes, type InsertBusiness, type BusinessType, type PlaceResult } from "@shared/schema";
import { z } from "zod";

const businessTypeIcons: Record<BusinessType, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  retail: "🛍️",
  gym: "💪",
  salon: "💇",
  pharmacy: "💊",
  hotel: "🏨",
  bar: "🍺",
  bakery: "🥖",
  supermarket: "🛒",
  clinic: "🏥",
  dentist: "🦷",
  bank: "🏦",
  gas_station: "⛽",
  car_repair: "🔧",
  other: "🏢",
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
    type: z.enum(businessTypes).optional(),
    address: z.string().min(1, t("validation.required")),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      type: initialValues?.type || undefined,
      address: initialValues?.address || "",
    },
    mode: "onChange", // Enable validation on change for better UX in wizard
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

  const addressValue = form.watch("address");
  const nameValue = form.watch("name");

  // Auto-verify address on debounce
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const subscription = form.watch((value, { name }) => {
      if (name === "address" || name === "name") {
        clearTimeout(timer);
        if (value.address && value.name && !selectedPlace && !manualCoordinates && !pendingLocationAddress) {
          timer = setTimeout(() => {
            handleSearchAddress();
          }, 1500); // 1.5s debounce to avoid too many API calls
        }
      }
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [selectedPlace, manualCoordinates, pendingLocationAddress]);

  const getBusinessTypeLabel = (type: BusinessType): string => {
    return t(`business.types.${type}`) as string;
  };

  const handleSearchAddress = async (isAutoSubmit = false) => {
    const address = form.getValues("address");
    const name = form.getValues("name");

    if (!address.trim()) {
      form.trigger("address");
      return null;
    }

    const searchQuery = name ? `${name}, ${address}` : address;

    try {
      const result = await searchMutation.mutateAsync(searchQuery);

      if (result.apiKeyMissing) {
        setPendingSubmitData(form.getValues());
        setShowApiKeyMissingDialog(true);
        return null;
      }

      if (result.results.length === 0) {
        setPendingSubmitData(form.getValues());
        setShowNoResultsDialog(true);
        return null;
      } else if (result.results.length === 1) {
        const place = result.results[0];
        const inputAddress = address.toLowerCase().trim();
        const foundAddress = place.address.toLowerCase();

        if (inputAddress !== foundAddress && foundAddress.includes(inputAddress.split(",")[0])) {
          setSuggestedPlace(place);
          setShowAddressSuggestionDialog(true);
          return null;
        } else {
          selectPlace(place);
          return place;
        }
      } else {
        setSearchResults(result.results);
        setShowMultipleResultsModal(true);
        return null;
      }
    } catch (error) {
      toast({
        title: t("toast.error.title"),
        description: t("addressSearch.searchFailed"),
        variant: "destructive",
      });
      return null;
    }
  };

  const mapGoogleTypeToBusinessType = (googleTypes: string[] = []): BusinessType | undefined => {
    const mapping: Record<string, BusinessType> = {
      restaurant: "restaurant",
      food: "restaurant",
      meal_takeaway: "restaurant",
      meal_delivery: "restaurant",
      cafe: "cafe",
      coffee_shop: "cafe",
      bakery: "bakery",
      bar: "bar",
      night_club: "bar",
      store: "retail",
      clothing_store: "retail",
      shopping_mall: "retail",
      gym: "gym",
      fitness_center: "gym",
      spa: "salon",
      beauty_salon: "salon",
      hair_care: "salon",
      pharmacy: "pharmacy",
      drugstore: "pharmacy",
      lodging: "hotel",
      hotel: "hotel",
      supermarket: "supermarket",
      grocery_or_supermarket: "supermarket",
      doctor: "clinic",
      hospital: "clinic",
      health: "clinic",
      dentist: "dentist",
      bank: "bank",
      finance: "bank",
      gas_station: "gas_station",
      car_repair: "car_repair",
      car_service: "car_repair",
      shoe_store: "retail",
      electronics_store: "retail",
      home_goods_store: "retail",
      hardware_store: "retail",
      furniture_store: "retail",
      department_store: "retail",
      book_store: "retail",
      liquor_store: "retail",
      pet_store: "retail",
      jewelry_store: "retail",
      bicycle_store: "retail",
      florist: "retail",
    };

    for (const type of googleTypes) {
      if (mapping[type]) {
        return mapping[type];
      }
    }
    return undefined;
  };

  const selectPlace = (place: PlaceResult) => {
    setSelectedPlace(place);
    setManualCoordinates(null);
    setPendingLocationAddress(null);
    form.setValue("address", place.address);

    // Auto-fill type if not already set or if user wants to overwrite (we'll just overwrite for now as it's a helpful feature)
    const mappedType = mapGoogleTypeToBusinessType(place.types);
    if (mappedType) {
      form.setValue("type", mappedType);
    }

    setShowMultipleResultsModal(false);
    setShowAddressSuggestionDialog(false);
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
        locationStatus: "validated",
      };
      await onSubmit(businessData);
      form.reset();

      return;
    }

    if (!selectedPlace && !manualCoordinates && !pendingLocationAddress) {
      const verifiedPlace = await handleSearchAddress(true);
      if (!verifiedPlace) return; // Wait for user interaction with dialogs

      // If we got a verified place, use it immediately
      const businessData: InsertBusiness = {
        name: data.name,
        type: data.type || mapGoogleTypeToBusinessType(verifiedPlace.types),
        address: verifiedPlace.address,
        latitude: verifiedPlace.latitude,
        longitude: verifiedPlace.longitude,
        locationStatus: "validated",
      };

      await onSubmit(businessData);
      form.reset();
      setSelectedPlace(null);
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



  const isAddressVerified = !!(selectedPlace || manualCoordinates || pendingLocationAddress);

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
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("business.form.address")}</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FormControl>
                      <Input
                        placeholder={t("business.form.addressPlaceholder")}
                        data-testid="input-address"
                        {...field}
                        className={selectedPlace ? "pr-10 border-green-500 ring-green-500/10" : ""}
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
                    {selectedPlace && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-in zoom-in duration-300" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSearchAddress()}
                    disabled={searchMutation.isPending || !form.watch("name")}
                    data-testid="button-search-address"
                    className={!isAddressVerified && form.watch("name") ? "border-2 border-blue-500 ring-4 ring-blue-400/30 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]" : ""}
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

          {isAddressVerified && (
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {t("business.form.type")}
                    {selectedPlace && form.watch("type") && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{t("business.form.typeAutoDetected")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </FormLabel>
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
                          <span className="mr-2">{businessTypeIcons[type]}</span>
                          {getBusinessTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!field.value && selectedPlace && (
                    <p className="text-[0.8rem] font-medium text-yellow-600 dark:text-yellow-400 mt-1 italic">
                      {t("business.form.noTypeDetected")}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || searchMutation.isPending || (!selectedPlace && !manualCoordinates && !pendingLocationAddress)}
            data-testid="button-submit-business"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("business.form.submitting")}
              </>
            ) : (
              t("business.form.submit")
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
