// Location Service for handling location name variations and search
export interface LocationMapping {
  primary: string;
  variations: string[];
  state?: string;
  country?: string;
}

export class LocationService {
  // Comprehensive location mappings for Indian cities
  private static readonly locationMappings: LocationMapping[] = [
    {
      primary: "Bangalore",
      variations: ["Bengaluru", "Bangaluru", "BLR"],
      state: "Karnataka",
      country: "India"
    },
    {
      primary: "Mumbai",
      variations: ["Bombay", "BOM"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Delhi",
      variations: ["New Delhi", "NCR", "National Capital Region", "Gurgaon", "Gurugram", "Noida", "Faridabad", "Ghaziabad"],
      state: "Delhi",
      country: "India"
    },
    {
      primary: "Gurugram",
      variations: ["Gurgaon", "Gurgram"],
      state: "Haryana",
      country: "India"
    },
    {
      primary: "Hyderabad",
      variations: ["Hyd", "Cyberabad"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Chennai",
      variations: ["Madras", "MAA"],
      state: "Tamil Nadu",
      country: "India"
    },
    {
      primary: "Pune",
      variations: ["Poona"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Kolkata",
      variations: ["Calcutta", "CCU"],
      state: "West Bengal",
      country: "India"
    },
    {
      primary: "Ahmedabad",
      variations: ["AMD"],
      state: "Gujarat",
      country: "India"
    },
    {
      primary: "Jaipur",
      variations: ["JPR"],
      state: "Rajasthan",
      country: "India"
    },
    {
      primary: "Lucknow",
      variations: ["LKO"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Kanpur",
      variations: ["Cawnpore"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Nagpur",
      variations: ["NAG"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Indore",
      variations: ["IDR"],
      state: "Madhya Pradesh",
      country: "India"
    },
    {
      primary: "Thane",
      variations: ["Thana"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Bhopal",
      variations: ["BPL"],
      state: "Madhya Pradesh",
      country: "India"
    },
    {
      primary: "Visakhapatnam",
      variations: ["Vizag", "VSP"],
      state: "Andhra Pradesh",
      country: "India"
    },
    {
      primary: "Patna",
      variations: ["PAT"],
      state: "Bihar",
      country: "India"
    },
    {
      primary: "Vadodara",
      variations: ["Baroda", "BDQ"],
      state: "Gujarat",
      country: "India"
    },
    {
      primary: "Ghaziabad",
      variations: ["GZB"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Ludhiana",
      variations: ["LUH"],
      state: "Punjab",
      country: "India"
    },
    {
      primary: "Agra",
      variations: ["AGR"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Nashik",
      variations: ["Nasik", "ISK"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Ranchi",
      variations: ["IXR"],
      state: "Jharkhand",
      country: "India"
    },
    {
      primary: "Faridabad",
      variations: ["FBD"],
      state: "Haryana",
      country: "India"
    },
    {
      primary: "Noida",
      variations: ["NOIDA"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Chandigarh",
      variations: ["CHD"],
      state: "Chandigarh",
      country: "India"
    },
    {
      primary: "Coimbatore",
      variations: ["CBE"],
      state: "Tamil Nadu",
      country: "India"
    },
    {
      primary: "Kochi",
      variations: ["Cochin", "COK"],
      state: "Kerala",
      country: "India"
    },
    {
      primary: "Mysore",
      variations: ["Mysuru", "MYQ"],
      state: "Karnataka",
      country: "India"
    },
    {
      primary: "Vijayawada",
      variations: ["VGA"],
      state: "Andhra Pradesh",
      country: "India"
    },
    {
      primary: "Jabalpur",
      variations: ["JLR"],
      state: "Madhya Pradesh",
      country: "India"
    },
    {
      primary: "Gwalior",
      variations: ["GWL"],
      state: "Madhya Pradesh",
      country: "India"
    },
    {
      primary: "Jodhpur",
      variations: ["JDH"],
      state: "Rajasthan",
      country: "India"
    },
    {
      primary: "Madurai",
      variations: ["IXM"],
      state: "Tamil Nadu",
      country: "India"
    },
    {
      primary: "Guwahati",
      variations: ["GAU"],
      state: "Assam",
      country: "India"
    },
    {
      primary: "Chandigarh",
      variations: ["CHD"],
      state: "Chandigarh",
      country: "India"
    },
    {
      primary: "Hubli",
      variations: ["Hubballi", "HBX"],
      state: "Karnataka",
      country: "India"
    },
    {
      primary: "Mangalore",
      variations: ["Mangaluru", "IXE"],
      state: "Karnataka",
      country: "India"
    },
    {
      primary: "Dehradun",
      variations: ["DED"],
      state: "Uttarakhand",
      country: "India"
    },
    {
      primary: "Amritsar",
      variations: ["ATQ"],
      state: "Punjab",
      country: "India"
    },
    {
      primary: "Varanasi",
      variations: ["Banaras", "VNS"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Allahabad",
      variations: ["Prayagraj", "IXD"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Howrah",
      variations: ["HWH"],
      state: "West Bengal",
      country: "India"
    },
    {
      primary: "Aurangabad",
      variations: ["IXU"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Solapur",
      variations: ["SSE"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Srinagar",
      variations: ["SXR"],
      state: "Jammu and Kashmir",
      country: "India"
    },
    {
      primary: "Kolhapur",
      variations: ["KLH"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Ajmer",
      variations: ["AJM"],
      state: "Rajasthan",
      country: "India"
    },
    {
      primary: "Gulbarga",
      variations: ["Kalaburagi", "GBI"],
      state: "Karnataka",
      country: "India"
    },
    {
      primary: "Loni",
      variations: ["LONI"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Ujjain",
      variations: ["UJN"],
      state: "Madhya Pradesh",
      country: "India"
    },
    {
      primary: "Siliguri",
      variations: ["IXB"],
      state: "West Bengal",
      country: "India"
    },
    {
      primary: "Jhansi",
      variations: ["VNS"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Saharanpur",
      variations: ["SRE"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Warangal",
      variations: ["WGC"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Salem",
      variations: ["SXV"],
      state: "Tamil Nadu",
      country: "India"
    },
    {
      primary: "Malegaon",
      variations: ["MAL"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Guntur",
      variations: ["GNT"],
      state: "Andhra Pradesh",
      country: "India"
    },
    {
      primary: "Bhiwandi",
      variations: ["BHI"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Saharanpur",
      variations: ["SRE"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Cuttack",
      variations: ["BBI"],
      state: "Odisha",
      country: "India"
    },
    {
      primary: "Firozabad",
      variations: ["FZD"],
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      primary: "Kochi",
      variations: ["Cochin", "COK"],
      state: "Kerala",
      country: "India"
    },
    {
      primary: "Nellore",
      variations: ["NLR"],
      state: "Andhra Pradesh",
      country: "India"
    },
    {
      primary: "Bhavnagar",
      variations: ["BHU"],
      state: "Gujarat",
      country: "India"
    },
    {
      primary: "Dehradun",
      variations: ["DED"],
      state: "Uttarakhand",
      country: "India"
    },
    {
      primary: "Durgapur",
      variations: ["RDP"],
      state: "West Bengal",
      country: "India"
    },
    {
      primary: "Asansol",
      variations: ["ASN"],
      state: "West Bengal",
      country: "India"
    },
    {
      primary: "Rourkela",
      variations: ["RRK"],
      state: "Odisha",
      country: "India"
    },
    {
      primary: "Bhilai",
      variations: ["BIL"],
      state: "Chhattisgarh",
      country: "India"
    },
    {
      primary: "Amravati",
      variations: ["AMR"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Nanded",
      variations: ["NDC"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Kolhapur",
      variations: ["KLH"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Sangli",
      variations: ["SLI"],
      state: "Maharashtra",
      country: "India"
    },
    {
      primary: "Bikaner",
      variations: ["BKB"],
      state: "Rajasthan",
      country: "India"
    },
    {
      primary: "Bokaro",
      variations: ["BKR"],
      state: "Jharkhand",
      country: "India"
    },
    {
      primary: "Bhubaneswar",
      variations: ["BBI"],
      state: "Odisha",
      country: "India"
    },
    {
      primary: "Tiruchirappalli",
      variations: ["Trichy", "TRZ"],
      state: "Tamil Nadu",
      country: "India"
    },
    {
      primary: "Tiruppur",
      variations: ["TIR"],
      state: "Tamil Nadu",
      country: "India"
    },
    {
      primary: "Erode",
      variations: ["ERD"],
      state: "Tamil Nadu",
      country: "India"
    },
    {
      primary: "Tirunelveli",
      variations: ["TIR"],
      state: "Tamil Nadu",
      country: "India"
    },
    {
      primary: "Guntur",
      variations: ["GNT"],
      state: "Andhra Pradesh",
      country: "India"
    },
    {
      primary: "Rajahmundry",
      variations: ["RJA"],
      state: "Andhra Pradesh",
      country: "India"
    },
    {
      primary: "Kakinada",
      variations: ["KAK"],
      state: "Andhra Pradesh",
      country: "India"
    },
    {
      primary: "Nizamabad",
      variations: ["NIZ"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Karimnagar",
      variations: ["KRM"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Ramagundam",
      variations: ["RMD"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Warangal",
      variations: ["WGC"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Khammam",
      variations: ["KHM"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Nalgonda",
      variations: ["NLD"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Mahbubnagar",
      variations: ["MBN"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Adilabad",
      variations: ["ADB"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Suryapet",
      variations: ["SRP"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Jagtial",
      variations: ["JGT"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Mancherial",
      variations: ["MCR"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Peddapalli",
      variations: ["PDP"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Kamareddy",
      variations: ["KMR"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Siddipet",
      variations: ["SDP"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Medak",
      variations: ["MDK"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Sangareddy",
      variations: ["SGR"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Medchal",
      variations: ["MCL"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Rangareddy",
      variations: ["RGR"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Vikarabad",
      variations: ["VKB"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Sangareddy",
      variations: ["SGR"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Medchal",
      variations: ["MCL"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Rangareddy",
      variations: ["RGR"],
      state: "Telangana",
      country: "India"
    },
    {
      primary: "Vikarabad",
      variations: ["VKB"],
      state: "Telangana",
      country: "India"
    }
  ];

  // Create a reverse lookup map for quick access
  private static readonly locationLookupMap = new Map<string, string>();

  static {
    // Initialize the lookup map
    LocationService.locationMappings.forEach(mapping => {
      // Add primary name
      LocationService.locationLookupMap.set(
        mapping.primary.toLowerCase(),
        mapping.primary
      );
      
      // Add variations
      mapping.variations.forEach(variation => {
        LocationService.locationLookupMap.set(
          variation.toLowerCase(),
          mapping.primary
        );
      });
    });
  }

  /**
   * Normalize a location name to its primary form
   */
  static normalizeLocation(location: string): string {
    if (!location) return location;
    
    const normalized = location.trim().toLowerCase();
    return LocationService.locationLookupMap.get(normalized) || location;
  }

  /**
   * Get all variations for a location
   */
  static getLocationVariations(location: string): string[] {
    if (!location) return [];
    
    const normalized = location.trim().toLowerCase();
    const primary = LocationService.locationLookupMap.get(normalized);
    
    if (!primary) return [location];
    
    const mapping = LocationService.locationMappings.find(
      m => m.primary.toLowerCase() === primary.toLowerCase()
    );
    
    return mapping ? [mapping.primary, ...mapping.variations] : [location];
  }

  /**
   * Search locations with fuzzy matching
   */
  static searchLocations(query: string, limit: number = 10): string[] {
    if (!query || query.length < 2) return [];
    
    const normalizedQuery = query.toLowerCase();
    const results: string[] = [];
    const seen = new Set<string>();
    
    // First, try exact matches
    LocationService.locationMappings.forEach(mapping => {
      if (mapping.primary.toLowerCase().includes(normalizedQuery) ||
          mapping.variations.some(v => v.toLowerCase().includes(normalizedQuery))) {
        if (!seen.has(mapping.primary)) {
          results.push(mapping.primary);
          seen.add(mapping.primary);
        }
      }
    });
    
    // Then, try fuzzy matches
    LocationService.locationMappings.forEach(mapping => {
      if (results.length >= limit) return;
      
      const similarity = LocationService.calculateSimilarity(
        normalizedQuery,
        mapping.primary.toLowerCase()
      );
      
      if (similarity > 0.6 && !seen.has(mapping.primary)) {
        results.push(mapping.primary);
        seen.add(mapping.primary);
      }
    });
    
    return results.slice(0, limit);
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (matrix[str2.length][str1.length] / maxLength);
  }

  /**
   * Get all primary location names
   */
  static getAllPrimaryLocations(): string[] {
    return LocationService.locationMappings.map(mapping => mapping.primary);
  }

  /**
   * Check if a location is valid
   */
  static isValidLocation(location: string): boolean {
    if (!location) return false;
    const normalized = location.trim().toLowerCase();
    return LocationService.locationLookupMap.has(normalized);
  }
}
