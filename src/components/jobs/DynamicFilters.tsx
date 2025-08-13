import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Zap, 
  Filter,
  X,
  TrendingUp,
  Users,
  Globe,
  Sparkles,
  ChevronDown,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { JobFilters } from "@/types/job";

interface DynamicFiltersProps {
  filters: JobFilters;
  setFilters: (filters: JobFilters) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFilterChange?: (activeFilters: string[]) => void;
}

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
  color: string;
  gradient: string;
}

interface SmartSuggestion {
  type: 'location' | 'company' | 'skill' | 'role';
  value: string;
  count: number;
  trending?: boolean;
}

export const DynamicFilters = ({ 
  filters, 
  setFilters, 
  searchQuery, 
  setSearchQuery,
  onFilterChange 
}: DynamicFiltersProps) => {
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());
  const [salaryRange, setSalaryRange] = useState([50000, 150000]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Mock smart suggestions based on current search
  useEffect(() => {
    const generateSuggestions = () => {
      const suggestions: SmartSuggestion[] = [
        { type: 'location', value: 'Remote', count: 1234, trending: true },
        { type: 'location', value: 'San Francisco, CA', count: 856 },
        { type: 'location', value: 'New York, NY', count: 723 },
        { type: 'company', value: 'Google', count: 45, trending: true },
        { type: 'company', value: 'Meta', count: 38 },
        { type: 'skill', value: 'React', count: 567, trending: true },
        { type: 'skill', value: 'Python', count: 445 },
        { type: 'role', value: 'Senior', count: 892 }
      ];

      if (searchQuery) {
        return suggestions.filter(s => 
          s.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.type === 'skill' && searchQuery.toLowerCase().includes('dev')
        );
      }
      return suggestions.slice(0, 6);
    };

    setSmartSuggestions(generateSuggestions());
  }, [searchQuery]);

  const quickFilters: QuickFilter[] = [
    { 
      id: 'remote', 
      label: 'Remote', 
      icon: Globe, 
      count: 1234, 
      color: 'text-green-600',
      gradient: 'from-green-400 to-green-600'
    },
    { 
      id: 'fulltime', 
      label: 'Full-time', 
      icon: Clock, 
      count: 2156, 
      color: 'text-blue-600',
      gradient: 'from-blue-400 to-blue-600'
    },
    { 
      id: 'urgent', 
      label: 'Urgent', 
      icon: Zap, 
      count: 89, 
      color: 'text-red-600',
      gradient: 'from-red-400 to-red-600'
    },
    { 
      id: 'high-paying', 
      label: '$100k+', 
      icon: DollarSign, 
      count: 567, 
      color: 'text-purple-600',
      gradient: 'from-purple-400 to-purple-600'
    },
    { 
      id: 'startup', 
      label: 'Startup', 
      icon: TrendingUp, 
      count: 234, 
      color: 'text-orange-600',
      gradient: 'from-orange-400 to-orange-600'
    },
    { 
      id: 'big-tech', 
      label: 'Big Tech', 
      icon: Building, 
      count: 345, 
      color: 'text-indigo-600',
      gradient: 'from-indigo-400 to-indigo-600'
    }
  ];

  const toggleQuickFilter = (filterId: string) => {
    const newActive = new Set(activeQuickFilters);
    if (newActive.has(filterId)) {
      newActive.delete(filterId);
    } else {
      newActive.add(filterId);
    }
    setActiveQuickFilters(newActive);
    
    // Update actual filters based on quick filter selection
    const newFilters = { ...filters };
    switch (filterId) {
      case 'remote':
        newFilters.location = newActive.has(filterId) ? 'remote' : '';
        break;
      case 'fulltime':
        newFilters.jobType = newActive.has(filterId) ? 'Full-time' : '';
        break;
      case 'high-paying':
        newFilters.salary = newActive.has(filterId) ? '$100k+' : '';
        break;
    }
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(Array.from(newActive));
    }
  };

  const applySuggestion = (suggestion: SmartSuggestion) => {
    const newFilters = { ...filters };
    switch (suggestion.type) {
      case 'location':
        newFilters.location = suggestion.value;
        break;
      case 'company':
        newFilters.company = suggestion.value;
        break;
      case 'skill':
        setSearchQuery(suggestion.value);
        break;
      case 'role':
        setSearchQuery(`${suggestion.value} ${searchQuery}`.trim());
        break;
    }
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    setActiveQuickFilters(new Set());
    setFilters({
      location: "",
      jobType: "",
      experience: "",
      salary: "",
      company: "",
      datePosted: ""
    });
    setSalaryRange([50000, 150000]);
    setSearchQuery("");
  };

  const hasActiveFilters = activeQuickFilters.size > 0 || 
    Object.values(filters).some(value => value !== "") ||
    searchQuery !== "";

  return (
    <div className="space-y-6">
      {/* Main Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 group-focus-within:text-blue-600 transition-colors" />
          <Input
            type="text"
            placeholder="Search jobs, companies, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:bg-white transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
          />
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}
        </div>

        {/* Smart Suggestions */}
        <AnimatePresence>
          {smartSuggestions.length > 0 && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Smart Suggestions</span>
                </div>
                <div className="space-y-2">
                  {smartSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={`${suggestion.type}-${suggestion.value}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => applySuggestion(suggestion)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {suggestion.type === 'location' && <MapPin className="w-4 h-4 text-blue-500" />}
                        {suggestion.type === 'company' && <Building className="w-4 h-4 text-purple-500" />}
                        {suggestion.type === 'skill' && <Zap className="w-4 h-4 text-green-500" />}
                        {suggestion.type === 'role' && <Users className="w-4 h-4 text-orange-500" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{suggestion.value}</span>
                            {suggestion.trending && (
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 capitalize">{suggestion.type}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 group-hover:text-blue-600">
                        {suggestion.count.toLocaleString()} jobs
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap gap-3 items-center"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4" />
          Quick Filters:
        </div>
        {quickFilters.map((filter, index) => (
          <motion.div
            key={filter.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={activeQuickFilters.has(filter.id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleQuickFilter(filter.id)}
              className={`
                relative overflow-hidden transition-all duration-300 gap-2
                ${activeQuickFilters.has(filter.id) 
                  ? `bg-gradient-to-r ${filter.gradient} text-white border-0 shadow-lg` 
                  : 'bg-white/80 backdrop-blur-sm hover:bg-gray-50 border-gray-200'
                }
              `}
            >
              <filter.icon className="w-4 h-4" />
              <span>{filter.label}</span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  activeQuickFilters.has(filter.id) 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {filter.count}
              </Badge>
              
              {activeQuickFilters.has(filter.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-white/20 rounded-md"
                />
              )}
            </Button>
          </motion.div>
        ))}

        {/* Advanced Filters Toggle */}
        <Popover open={isFilterPanelOpen} onOpenChange={setIsFilterPanelOpen}>
          <PopoverTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                Advanced
                <ChevronDown className={`w-4 h-4 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`} />
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-6" align="start">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterPanelOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Experience Level */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Experience Level</label>
                <Select value={filters.experience} onValueChange={(value) => setFilters({ ...filters, experience: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Range */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Salary Range</label>
                <div className="px-2">
                  <Slider
                    value={salaryRange}
                    onValueChange={setSalaryRange}
                    max={300000}
                    min={30000}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>${(salaryRange[0] / 1000).toFixed(0)}K</span>
                    <span>${(salaryRange[1] / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </div>

              {/* Date Posted */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Date Posted</label>
                <Select value={filters.datePosted} onValueChange={(value) => setFilters({ ...filters, datePosted: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="3-days">Last 3 days</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Apply Filters */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All Filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {(activeQuickFilters.size > 0 || Object.values(filters).some(v => v !== "")) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 p-4 bg-blue-50/50 rounded-lg border border-blue-100"
          >
            <span className="text-sm font-medium text-gray-700 mr-2">Active filters:</span>
            {Array.from(activeQuickFilters).map(filterId => {
              const filter = quickFilters.find(f => f.id === filterId);
              return filter ? (
                <motion.div
                  key={filterId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="gap-1 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleQuickFilter(filterId)}
                  >
                    <filter.icon className="w-3 h-3" />
                    {filter.label}
                    <X className="w-3 h-3" />
                  </Badge>
                </motion.div>
              ) : null;
            })}
            {Object.entries(filters).map(([key, value]) => 
              value ? (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="gap-1 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setFilters({ ...filters, [key]: "" })}
                  >
                    {value}
                    <X className="w-3 h-3" />
                  </Badge>
                </motion.div>
              ) : null
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};