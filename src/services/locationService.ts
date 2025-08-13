// Location Service for handling location name variations and search
export interface LocationMapping {
  primary: string;
  variations: string[];
  state?: string;
  country?: string;
}

export class LocationService {
  // Comprehensive location mappings for Indian cities
  static locationMappings: Record<string, string[]> = {
    "Bangalore": ["Bengaluru", "Bangaluru", "BLR", "Bangalore, Karnataka", "Bengaluru, Karnataka"],
    "Bengaluru": ["Bangalore", "Bangaluru", "BLR", "Bangalore, Karnataka", "Bengaluru, Karnataka"],
    "Mumbai": ["Bombay", "BOM", "Mumbai, Maharashtra", "Bombay, Maharashtra"],
    "Bombay": ["Mumbai", "BOM", "Mumbai, Maharashtra", "Bombay, Maharashtra"],
    "Delhi": ["New Delhi", "NCR", "Delhi, India", "New Delhi, India", "National Capital Region"],
    "New Delhi": ["Delhi", "NCR", "Delhi, India", "New Delhi, India", "National Capital Region"],
    "Gurugram": ["Gurgaon", "Gurgram", "Gurugram, Haryana", "Gurgaon, Haryana"],
    "Gurgaon": ["Gurugram", "Gurgram", "Gurugram, Haryana", "Gurgaon, Haryana"],
    "Hyderabad": ["Hyd", "Hyderabad, Telangana", "Hyderabad, AP"],
    "Chennai": ["Madras", "Chennai, Tamil Nadu", "Madras, Tamil Nadu"],
    "Madras": ["Chennai", "Chennai, Tamil Nadu", "Madras, Tamil Nadu"],
    "Pune": ["Pune, Maharashtra"],
    "Noida": ["Noida, UP", "Noida, Uttar Pradesh"],
    "Kolkata": ["Calcutta", "Kolkata, West Bengal", "Calcutta, West Bengal"],
    "Calcutta": ["Kolkata", "Kolkata, West Bengal", "Calcutta, West Bengal"],
    "Ahmedabad": ["Ahmadabad", "Ahmedabad, Gujarat", "Ahmadabad, Gujarat"],
    "Ahmadabad": ["Ahmedabad", "Ahmedabad, Gujarat", "Ahmadabad, Gujarat"],
    "Jaipur": ["Jaipur, Rajasthan"],
    "Lucknow": ["Lucknow, UP", "Lucknow, Uttar Pradesh"],
    "Chandigarh": ["Chandigarh, Punjab", "Chandigarh, Haryana"],
    "Indore": ["Indore, Madhya Pradesh"],
    "Bhopal": ["Bhopal, Madhya Pradesh"],
    "Vadodara": ["Baroda", "Vadodara, Gujarat", "Baroda, Gujarat"],
    "Baroda": ["Vadodara", "Vadodara, Gujarat", "Baroda, Gujarat"],
    "Coimbatore": ["Coimbatore, Tamil Nadu"],
    "Vishakhapatnam": ["Vizag", "Vishakhapatnam, Andhra Pradesh", "Vizag, Andhra Pradesh"],
    "Vizag": ["Vishakhapatnam", "Vishakhapatnam, Andhra Pradesh", "Vizag, Andhra Pradesh"],
    "Remote": ["Work from Home", "WFH", "Remote Work", "Home Office", "Virtual", "Online"],
    "Work from Home": ["Remote", "WFH", "Remote Work", "Home Office", "Virtual", "Online"],
    "WFH": ["Remote", "Work from Home", "Remote Work", "Home Office", "Virtual", "Online"]
  };

  // Create a lookup map for quick normalization
  static locationLookupMap: Record<string, string> = {};
  
  static {
    // Build the lookup map
    Object.entries(LocationService.locationMappings).forEach(([primary, variations]) => {
      LocationService.locationLookupMap[primary.toLowerCase()] = primary;
      variations.forEach(variation => {
        LocationService.locationLookupMap[variation.toLowerCase()] = primary;
      });
    });
  }

  // Get all unique locations for recommendations
  static getAllLocations(): string[] {
    const allLocations = new Set<string>();
    
    Object.entries(LocationService.locationMappings).forEach(([primary, variations]) => {
      allLocations.add(primary);
      variations.forEach(variation => {
        allLocations.add(variation);
      });
    });
    
    return Array.from(allLocations).sort();
  }

  // Get popular locations for quick recommendations
  static getPopularLocations(): string[] {
    return [
      "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", 
      "Pune", "Gurugram", "Noida", "Kolkata", "Ahmedabad",
      "Jaipur", "Lucknow", "Chandigarh", "Indore", "Remote"
    ];
  }

  // Normalize location to primary name
  static normalizeLocation(location: string): string {
    if (!location) return "";
    
    const normalized = location.trim().toLowerCase();
    return LocationService.locationLookupMap[normalized] || location.trim();
  }

  // Get all variations of a location
  static getLocationVariations(location: string): string[] {
    const normalized = LocationService.normalizeLocation(location);
    const variations = LocationService.locationMappings[normalized] || [];
    return [normalized, ...variations];
  }

  // Check if two locations are the same
  static areLocationsSame(location1: string, location2: string): boolean {
    const normalized1 = LocationService.normalizeLocation(location1);
    const normalized2 = LocationService.normalizeLocation(location2);
    return normalized1 === normalized2;
  }

  // Search locations with fuzzy matching and recommendations
  static searchLocations(query: string, limit: number = 10): string[] {
    if (!query || query.trim().length === 0) {
      return LocationService.getPopularLocations().slice(0, limit);
    }

    const searchTerm = query.toLowerCase().trim();
    const results = new Set<string>();

    // First, try exact matches and variations
    Object.entries(LocationService.locationMappings).forEach(([primary, variations]) => {
      const allNames = [primary, ...variations];
      
      allNames.forEach(name => {
        const nameLower = name.toLowerCase();
        
        // Exact match
        if (nameLower === searchTerm) {
          results.add(primary);
          return;
        }
        
        // Starts with
        if (nameLower.startsWith(searchTerm)) {
          results.add(primary);
          return;
        }
        
        // Contains (letter-by-letter allowed)
        if (nameLower.includes(searchTerm)) {
          results.add(primary);
          return;
        }
        
        // Fuzzy match (simple similarity check)
        if (LocationService.calculateSimilarity(nameLower, searchTerm) > 0.6) {
          results.add(primary);
          return;
        }
      });
    });

    // Convert to array and sort by relevance
    const resultArray = Array.from(results);
    
    // Sort by relevance (exact matches first, then starts with, then contains, then fuzzy)
    resultArray.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // Exact match gets highest priority
      if (aLower === searchTerm && bLower !== searchTerm) return -1;
      if (bLower === searchTerm && aLower !== searchTerm) return 1;
      
      // Starts with gets second priority
      if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
      if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1;
      
      // Contains gets third priority
      if (aLower.includes(searchTerm) && !bLower.includes(searchTerm)) return -1;
      if (bLower.includes(searchTerm) && !aLower.includes(searchTerm)) return 1;
      
      // Alphabetical order for same relevance
      return a.localeCompare(b);
    });

    return resultArray.slice(0, limit);
  }

  // Get location recommendations based on partial input
  static getLocationRecommendations(partialInput: string, limit: number = 8): string[] {
    if (!partialInput || partialInput.trim().length === 0) {
      return LocationService.getPopularLocations().slice(0, limit);
    }

    const searchResults = LocationService.searchLocations(partialInput, limit);
    
    // If we have good results, return them
    if (searchResults.length >= 3) {
      return searchResults;
    }

    // Otherwise, add popular locations that might be relevant
    const popular = LocationService.getPopularLocations();
    const combined = [...searchResults];
    
    popular.forEach(location => {
      if (combined.length < limit && !combined.includes(location)) {
        combined.push(location);
      }
    });

    return combined.slice(0, limit);
  }

  // Calculate similarity between two strings (simple implementation)
  private static calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0) return 0.0;
    if (str2.length === 0) return 0.0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = LocationService.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance calculation
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Get location statistics for a job dataset
  static getLocationStats(jobs: any[]): { location: string; count: number }[] {
    const locationCounts: Record<string, number> = {};
    
    jobs.forEach(job => {
      const location = job.location || job.job_location || "";
      if (location) {
        const normalized = LocationService.normalizeLocation(location);
        locationCounts[normalized] = (locationCounts[normalized] || 0) + 1;
      }
    });

    return Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Find similar primary locations for a possibly misspelled query
  static getSimilarPrimaryLocations(query: string, limit: number = 5, threshold: number = 0.6): string[] {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();

    const scored: Array<{ primary: string; score: number }> = [];

    Object.entries(LocationService.locationMappings).forEach(([primary, variations]) => {
      const primaryLower = primary.toLowerCase();
      const primaryScore = LocationService.calculateSimilarity(primaryLower, q);
      let bestScore = primaryScore;

      for (const variation of variations) {
        const variationLower = variation.toLowerCase();
        const variationScore = LocationService.calculateSimilarity(variationLower, q);
        if (variationScore > bestScore) bestScore = variationScore;
      }

      if (bestScore >= threshold) {
        scored.push({ primary, score: bestScore });
      }
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.primary);
  }
}
