import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface RadiusSelectorProps {
    value: number;
    onChange: (radius: number) => void;
    className?: string;
}

const radiusOptions = [
    { value: 500, label: "500m", descriptionKey: "radiusOptions.immediate" },
    { value: 1000, label: "1km", descriptionKey: "radiusOptions.walking" },
    { value: 2000, label: "2km", descriptionKey: "radiusOptions.drive" },
    { value: 5000, label: "5km", descriptionKey: "radiusOptions.extended" },
];

export function RadiusSelector({ value, onChange, className }: RadiusSelectorProps) {
    const { t } = useTranslation();

    return (
        <div className={cn("flex gap-2", className)}>
            {radiusOptions.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        "border-2 hover:border-blue-400 dark:hover:border-blue-500",
                        value === option.value
                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                    )}
                    title={t(option.descriptionKey)}
                >
                    <div className="flex flex-col items-center">
                        <span className="font-bold">{option.label}</span>
                        <span className="text-xs opacity-75 hidden sm:block">{t(option.descriptionKey)}</span>
                    </div>
                </button>
            ))}
        </div>
    );
}
