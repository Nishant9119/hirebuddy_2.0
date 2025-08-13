import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobFilters as JobFiltersType } from "@/types/job";
import { Filter, X, MapPin, Clock, Building } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { LocationService } from "@/services/locationService";
import { SearchService } from "@/services/searchService";
import { Job } from "@/types/job";

interface EnhancedJobFiltersProps {
  filters: JobFiltersType;
  setFilters: (filters: JobFiltersType) => void;
  onClearFilters: () => void;
  jobs: Job[];
}

export const EnhancedJobFilters = ({
  filters,
  setFilters,
  onClearFilters,
  jobs
}: EnhancedJobFiltersProps) => {
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const locationInputRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);

  // Get location statistics from jobs for better recommendations
  const [locationStats, setLocationStats] = useState<{ location: string; count: number }[]>([]);

  useEffect(() => {
    const stats = LocationService.getLocationStats(jobs);
    setLocationStats(stats);
  }, [jobs]);

  // Popular locations for quick selection (dynamic based on job data)
  const popularLocations = useMemo(() => {
    const topLocations = locationStats.slice(0, 8).map(stat => stat.location);
    const defaultLocations = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Remote"];
    
    // Combine and deduplicate
    const combined = [...topLocations];
    defaultLocations.forEach(loc => {
      if (!combined.includes(loc)) {
        combined.push(loc);
      }
    });
    
    return combined.slice(0, 10);
  }, [locationStats]);

  // Work mode options
  const workModeOptions = [
    { value: "all", label: "All Types" },
    { value: "remote", label: "Remote Only" },
    { value: "onsite", label: "On-site Only" }
  ];

  // Experience level options
  const experienceOptions = [
    { value: "any", label: "Any Experience" },
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior Level" },
    { value: "lead", label: "Lead/Principal" },
    { value: "intern", label: "Internship" }
  ];

  // Generate location suggestions with faster response
  useEffect(() => {
    const generateLocationSuggestions = async () => {
      if (!locationQuery.trim()) {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
        setIsLocationLoading(false);
        return;
      }

      setIsLocationLoading(true);

      try {
        // Use enhanced location recommendations
        const suggestions = LocationService.getLocationRecommendations(locationQuery, 8);
        setLocationSuggestions(suggestions);
        setShowLocationSuggestions(true);
      } catch (error) {
        console.error('Error generating location suggestions:', error);
        setLocationSuggestions([]);
      } finally {
        setIsLocationLoading(false);
      }
    };

    // Faster debounce for better responsiveness
    const debounceTimer = setTimeout(generateLocationSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [locationQuery]);

  // Generate company suggestions with faster response
  useEffect(() => {
    const generateCompanySuggestions = async () => {
      if (!filters.company.trim()) {
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
        setIsCompanyLoading(false);
        return;
      }

      setIsCompanyLoading(true);

      try {
        const suggestions = await SearchService.getSearchSuggestions(jobs, filters.company, 8);
        setSearchSuggestions(suggestions);
        setShowSearchSuggestions(true);
      } catch (error) {
        console.error('Error generating company suggestions:', error);
        setSearchSuggestions([]);
      } finally {
        setIsCompanyLoading(false);
      }
    };

    // Faster debounce for better responsiveness
    const debounceTimer = setTimeout(generateCompanySuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [filters.company, jobs]);

  // Handle location selection
  const handleLocationSelect = (location: string) => {
    setFilters({ ...filters, location });
    setLocationQuery("");
    setShowLocationSuggestions(false);
  };

  // Handle company selection
  const handleCompanySelect = (company: string) => {
    setFilters({ ...filters, company });
    setShowSearchSuggestions(false);
  };

  // Handle popular location click
  const handlePopularLocationClick = (location: string) => {
    setFilters({ ...filters, location });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => value !== "" && value !== "all" && value !== "any").length;

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Filter className="w-4 h-4 text-blue-600" />
            Filters
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <Label className="font-medium text-sm">Location</Label>
          </div>
          
          <div className="relative" ref={locationInputRef}>
            <div className="relative">
              <Input
                placeholder="Search locations..."
                value={locationQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocationQuery(value);
                  // Keep filters in sync so results update as user types
                  setFilters({ ...filters, location: value });
                }}
                onFocus={() => setShowLocationSuggestions(true)}
                className="pr-8"
              />
              {locationQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLocationQuery("");
                    setFilters({ ...filters, location: "" });
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              {isLocationLoading && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Location Suggestions */}
            {showLocationSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {locationSuggestions.map((location) => (
                  <div
                    key={location}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleLocationSelect(location)}
                  >
                    {location}
                  </div>
                ))}
                {locationSuggestions.length === 0 && !isLocationLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500">No locations found</div>
                )}
                {isLocationLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popular Locations */}
          <div className="flex flex-wrap gap-2">
            {popularLocations.map((location) => (
              <Button
                key={location}
                variant="outline"
                size="sm"
                onClick={() => handlePopularLocationClick(location)}
                className="text-xs"
              >
                {location}
              </Button>
            ))}
          </div>
        </div>

        {/* Work Mode Filter */}
        <div className="space-y-2">
          <Label className="font-medium text-sm">Work Mode</Label>
          <Select
            value={filters.remote}
            onValueChange={(value) => setFilters({ ...filters, remote: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select work mode" />
            </SelectTrigger>
            <SelectContent>
              {workModeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <Label className="font-medium text-sm">Experience Level</Label>
          </div>
          <Select
            value={filters.experience}
            onValueChange={(value) => setFilters({ ...filters, experience: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {experienceOptions.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-500" />
            <Label className="font-medium text-sm">Company</Label>
          </div>
          
          <div className="relative" ref={searchInputRef}>
            <div className="relative">
              <Input
                placeholder="Search companies..."
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                onFocus={() => setShowSearchSuggestions(true)}
                className="pr-8"
              />
              {filters.company && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, company: "" })}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              {isCompanyLoading && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Company Suggestions */}
            {showSearchSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searchSuggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleCompanySelect(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
                {searchSuggestions.length === 0 && !isCompanyLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500">No companies found</div>
                )}
                {isCompanyLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <Label className="font-medium text-sm text-gray-600">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.location && (
                <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  <MapPin className="w-3 h-3" />
                  {filters.location}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ ...filters, location: "" })}
                    className="h-4 w-4 p-0 hover:bg-blue-200"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              )}
              
              {filters.remote && filters.remote !== "all" && (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {filters.remote === "remote" ? "Remote" : "On-site"}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ ...filters, remote: "all" })}
                    className="h-4 w-4 p-0 hover:bg-green-200"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              )}
              
              {filters.experience && filters.experience !== "any" && (
                <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  {experienceOptions.find(opt => opt.value === filters.experience)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ ...filters, experience: "any" })}
                    className="h-4 w-4 p-0 hover:bg-purple-200"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              )}
              
              {filters.company && (
                <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                  <Building className="w-3 h-3" />
                  {filters.company}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ ...filters, company: "" })}
                    className="h-4 w-4 p-0 hover:bg-orange-200"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
