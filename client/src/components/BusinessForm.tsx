import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertBusinessSchema, businessTypes, type InsertBusiness, type BusinessType } from "@shared/schema";

const businessTypeLabels: Record<BusinessType, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe / Coffee Shop",
  retail: "Retail Store",
  gym: "Gym / Fitness",
  salon: "Salon / Spa",
  pharmacy: "Pharmacy",
  hotel: "Hotel / Accommodation",
  bar: "Bar / Nightclub",
  bakery: "Bakery",
  supermarket: "Supermarket / Grocery",
  clinic: "Medical Clinic",
  dentist: "Dental Clinic",
  bank: "Bank / Financial",
  gas_station: "Gas Station",
  car_repair: "Auto Repair",
  other: "Other",
};

interface BusinessFormProps {
  onSubmit: (data: InsertBusiness) => Promise<void>;
  isPending?: boolean;
}

export function BusinessForm({ onSubmit, isPending = false }: BusinessFormProps) {
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

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Register Business
        </CardTitle>
        <CardDescription>
          Add your business to analyze local competition
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
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter business name"
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
                  <FormLabel>Business Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-business-type">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type} data-testid={`option-type-${type}`}>
                          {businessTypeLabels[type]}
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
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Street address"
                      data-testid="input-address"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Physical location of your business
                  </FormDescription>
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
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="-90 to 90"
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
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="-180 to 180"
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
              Use Current Location
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
                  Registering...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Register Business
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
