import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Building2, MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertBusinessSchema, businessTypes, type InsertBusiness, type BusinessType } from "@shared/schema";

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

interface BusinessFormProps {
  onSubmit: (data: InsertBusiness) => Promise<void>;
  isPending?: boolean;
}

export function BusinessForm({ onSubmit, isPending = false }: BusinessFormProps) {
  const { t } = useTranslation();
  const form = useForm<InsertBusiness>({
    resolver: zodResolver(insertBusinessSchema),
    defaultValues: {
      name: "",
      type: undefined,
      latitude: 0,
      longitude: 0,
      address: "",
    },
  });

  const handleSubmit = async (data: InsertBusiness) => {
    await onSubmit(data);
    form.reset();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude);
        form.setValue("longitude", position.coords.longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  const getBusinessTypeLabel = (type: BusinessType): string => {
    const key = businessTypeKeys[type];
    return t(`business.types.${key}`) as string;
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {t("business.form.title")}
        </CardTitle>
        <CardDescription>
          {t("dashboard.header.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  <FormControl>
                    <Input
                      placeholder={t("business.form.addressPlaceholder")}
                      data-testid="input-address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("business.form.latitude")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder={t("business.form.latitudePlaceholder")}
                        data-testid="input-latitude"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("business.form.longitude")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder={t("business.form.longitudePlaceholder")}
                        data-testid="input-longitude"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGetCurrentLocation}
              data-testid="button-get-location"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t("business.form.useCurrentLocation", "Use Current Location")}
            </Button>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
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
      </CardContent>
    </Card>
  );
}
