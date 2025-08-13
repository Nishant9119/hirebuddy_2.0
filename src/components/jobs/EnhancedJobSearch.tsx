import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { SearchService } from "@/services/searchService";
import { LocationService } from "@/services/locationService";
import { Job } from "@/types/job";

interface EnhancedJobSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  jobs: Job[];
  placeholder?: string;
  className?: string;
}

export const EnhancedJobSearch = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  jobs,
  placeholder = "Search jobs, companies, skills...",
  className = ""
}: EnhancedJobSearchProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendingTerms, setTrendingTerms] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  // Load trending terms
  useEffect(() => {
    const loadTrendingTerms = async () => {
      try {
        const terms = await SearchService.getTrendingSearchTerms(jobs);
        setTrendingTerms(terms.slice(0, 5));
      } catch (error) {
        console.error('Error loading trending terms:', error);
      }
    };
    loadTrendingTerms();
  }, [jobs]);

  // Generate suggestions when search query changes
  useEffect(() => {
    const generateSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        // Get search suggestions
        const searchSuggestions = await SearchService.getSearchSuggestions(jobs, searchQuery, 5);
        
        // Get location suggestions
        const locationSuggestions = await LocationService.searchLocations(searchQuery, 5);
        
        // Combine and deduplicate suggestions
        const allSuggestions = Array.from(new Set([...searchSuggestions, ...locationSuggestions]));
        setSuggestions(allSuggestions.slice(0, 8));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error generating suggestions:', error);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(generateSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, jobs]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    // Add to recent searches
    const newRecent = [suggestion, ...recentSearches.filter(s => s !== suggestion)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    
    onSearch();
  };

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    }
    setShowSuggestions(false);
    onSearch();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Remove from recent searches
  const removeRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter(s => s !== search);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={searchInputRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          className="pl-10 pr-10 h-11 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Recent Searches
              </div>
              {recentSearches.map((search) => (
                <div
                  key={search}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => handleSuggestionClick(search)}
                >
                  <span>{search}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => removeRecentSearch(search, e)}
                    className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Trending Terms */}
          {trendingTerms.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Trending
              </div>
              {trendingTerms.map((term) => (
                <div
                  key={term}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSuggestionClick(term)}
                >
                  {term}
                </div>
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500">
                Suggestions
              </div>
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          {!recentSearches.length && !trendingTerms.length && !suggestions.length && (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No suggestions available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
