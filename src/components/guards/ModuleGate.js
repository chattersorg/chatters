import { useVenue } from '../../context/VenueContext';

/**
 * ModuleGate - Conditionally renders children based on module access
 *
 * @param {string} module - The module code to check (e.g., 'nps')
 * @param {React.ReactNode} children - Content to show if module is enabled
 * @param {React.ReactNode} fallback - Optional content to show if module is disabled
 * @param {React.ReactNode} loadingFallback - Optional content to show while loading
 */
const ModuleGate = ({ module, children, fallback = null, loadingFallback = null }) => {
  const { hasModule, loading } = useVenue();

  // Show loading state placeholder to prevent layout shift
  if (loading) {
    return loadingFallback || (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    );
  }

  // Check if the user has access to the module
  if (!hasModule(module)) {
    return fallback;
  }

  return children;
};

export default ModuleGate;
