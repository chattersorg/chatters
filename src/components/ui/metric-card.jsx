import * as React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Consistent color scheme for all reports (with dark mode support)
export const reportColors = {
  primary: {
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-700",
    text: "text-slate-900 dark:text-slate-100",
    muted: "text-slate-600 dark:text-slate-400",
    accent: "text-slate-900 dark:text-slate-100"
  },
  success: {
    bg: "bg-green-50 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-900 dark:text-green-100",
    accent: "text-custom-green dark:text-green-400",
    icon: "text-custom-green dark:text-green-400"
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-900/30",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-900 dark:text-yellow-100",
    accent: "text-custom-yellow dark:text-yellow-400",
    icon: "text-custom-yellow dark:text-yellow-400"
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-900 dark:text-red-100",
    accent: "text-custom-red dark:text-red-400",
    icon: "text-custom-red dark:text-red-400"
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-100",
    accent: "text-custom-blue dark:text-blue-400",
    icon: "text-custom-blue dark:text-blue-400"
  },
  neutral: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    text: "text-gray-900 dark:text-gray-100",
    accent: "text-gray-600 dark:text-gray-400",
    icon: "text-gray-600 dark:text-gray-400"
  }
};

const MetricCard = React.forwardRef(({ 
  className,
  title,
  description, 
  value,
  metric,
  trend,
  variant = "primary",
  icon: Icon,
  loading = false,
  ...props 
}, ref) => {
  const colors = reportColors[variant] || reportColors.primary;
  
  if (loading) {
    return (
      <Card ref={ref} className={cn("h-full", className)} {...props}>
        <CardContent className="h-full flex flex-col">
          <div className="animate-pulse space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              {Icon && <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>}
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className={cn("h-full", className)} {...props}>
      <CardContent className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          {Icon && (
            <Icon className={cn("h-5 w-5", colors.icon)} />
          )}
        </div>

        <div className="space-y-1 flex-1 flex flex-col">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
            {metric && <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{metric}</span>}
          </div>

          {description && (
            <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
              {description}
            </CardDescription>
          )}

          <div className="mt-auto pt-2">
            {trend && (
              <div className="flex items-center gap-1.5">
                {trend.direction === "up" && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    trend.positive
                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                  )}>
                    <TrendingUp className="w-3 h-3" />
                    {trend.value && <span>{trend.value}</span>}
                  </div>
                )}
                {trend.direction === "down" && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    trend.positive
                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                  )}>
                    <TrendingDown className="w-3 h-3" />
                    {trend.value && <span>{trend.value}</span>}
                  </div>
                )}
                {trend.direction === "neutral" && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <Minus className="w-3 h-3" />
                    {trend.value && <span>{trend.value}</span>}
                  </div>
                )}
                {trend.text && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {trend.text}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
MetricCard.displayName = "MetricCard";

export { MetricCard };