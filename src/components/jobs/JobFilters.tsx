
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { JobFilters as JobFiltersType } from "@/types/job";
import { Filter, DollarSign, Clock, MapPin, Building } from "lucide-react";
import { useState } from "react";

interface JobFiltersProps {
  filters: JobFiltersType;
  setFilters: (filters: JobFiltersType) => void;
}

export const JobFilters = ({ filters, setFilters }: JobFiltersProps) => {
  const [salaryRange, setSalaryRange] = useState([50000]);

  const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
  const experienceLevels = ["Entry level", "Mid level", "Senior level", "Executive"];
  const companies = ["Google", "Microsoft", "Apple", "Amazon", "Meta", "Netflix"];

  return (
    <Card className="sticky top-4 h-fit shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Filter className="w-5 h-5 text-blue-600" />
          Filters
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Job Type */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <Label className="font-medium">Job Type</Label>
          </div>
          <div className="space-y-2">
            {jobTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={filters.jobType === type}
                  onCheckedChange={(checked) => 
                    setFilters({ ...filters, jobType: checked ? type : "" })
                  }
                />
                <label htmlFor={type} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div className="space-y-3">
          <Label className="font-medium">Experience Level</Label>
          <Select value={filters.experience} onValueChange={(value) => setFilters({ ...filters, experience: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Salary Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <Label className="font-medium">Salary Range</Label>
          </div>
          <div className="px-2">
            <Slider
              value={salaryRange}
              onValueChange={setSalaryRange}
              max={200000}
              min={30000}
              step={5000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>$30K</span>
              <span className="font-medium">${salaryRange[0].toLocaleString()}</span>
              <span>$200K+</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <Label className="font-medium">Location</Label>
          </div>
          <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="new-york">New York, NY</SelectItem>
              <SelectItem value="san-francisco">San Francisco, CA</SelectItem>
              <SelectItem value="los-angeles">Los Angeles, CA</SelectItem>
              <SelectItem value="chicago">Chicago, IL</SelectItem>
              <SelectItem value="austin">Austin, TX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Company */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-500" />
            <Label className="font-medium">Company</Label>
          </div>
          <div className="space-y-2">
            {companies.map((company) => (
              <div key={company} className="flex items-center space-x-2">
                <Checkbox
                  id={company}
                  checked={filters.company === company}
                  onCheckedChange={(checked) => 
                    setFilters({ ...filters, company: checked ? company : "" })
                  }
                />
                <label htmlFor={company} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {company}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Posted */}
        <div className="space-y-3">
          <Label className="font-medium">Date Posted</Label>
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
      </CardContent>
    </Card>
  );
};
