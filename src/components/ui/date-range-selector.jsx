import * as React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

// Default preset ranges for rating trends (Google/TripAdvisor)
const defaultPresetRanges = [
  { label: "Last 7 days", value: "last7" },
  { label: "Last 14 days", value: "last14" },
  { label: "Last 30 days", value: "last30" },
  { label: "Last 60 days", value: "last60" },
  { label: "All time", value: "alltime" },
];

// Overview preset ranges (includes Today/Yesterday for metrics)
export const overviewPresetRanges = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "last7" },
  { label: "Last 14 days", value: "last14" },
  { label: "Last 30 days", value: "last30" },
  { label: "Last 60 days", value: "last60" },
];

export function DateRangeSelector({ value = "last7", onChange, className, presets = defaultPresetRanges }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState(value);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getDateRangeFromPreset = (preset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case "today":
        return {
          from: today,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: yesterday,
          to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case "last7":
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 6);
        return { from: last7, to: today };
      case "last14":
        const last14 = new Date(today);
        last14.setDate(last14.getDate() - 13);
        return { from: last14, to: today };
      case "last30":
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 29);
        return { from: last30, to: today };
      case "last60":
        const last60 = new Date(today);
        last60.setDate(last60.getDate() - 59);
        return { from: last60, to: today };
      case "alltime":
        // Set to 2 years ago as a reasonable "all time" limit
        const allTime = new Date(today);
        allTime.setFullYear(allTime.getFullYear() - 2);
        return { from: allTime, to: today };
      default:
        // Default to today
        return {
          from: today,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
    }
  };

  const handlePresetClick = (preset) => {
    setActivePreset(preset);
    const range = getDateRangeFromPreset(preset);
    onChange({ preset, range });
    setIsOpen(false);
  };

  const getDisplayText = () => {
    const preset = presets.find(p => p.value === activePreset);
    return preset?.label || "Select date range";
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full sm:w-[200px] px-4 py-2 text-left text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span>{getDisplayText()}</span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full sm:w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="py-1">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value)}
                className={cn(
                  "w-full px-4 py-2 text-sm text-left transition-colors",
                  activePreset === preset.value
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
