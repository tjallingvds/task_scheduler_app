import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Link,
  Globe,
  Briefcase,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const timeZones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland"
];

const ProfilePage = () => {
  const navigate = useNavigate();
  
  // State for profile data
  const [profileData, setProfileData] = useState({
    id: null,
    email: "",
    name: "",
    bio: "",
    location: "",
    website: "",
    time_zone: "UTC",
    phone: "",
    job_title: "",
    created_at: ""
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Error state
  const [formErrors, setFormErrors] = useState({});
  
  // Load profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const data = await api.get("profile");
        setProfileData(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Error loading profile", {
          description: error.message || "Failed to load profile data."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name, value) => {
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  

  
  // Save profile changes
  const handleSaveProfile = async () => {
    // Basic validation
    const errors = {};
    
    if (!profileData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (profileData.website && !isValidUrl(profileData.website)) {
      errors.website = "Please enter a valid URL";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSaving(true);
    
    try {
      await api.put("profile", profileData);
      
      toast.success("Profile updated", {
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Save failed", {
        description: error.message || "Failed to save profile changes."
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Validate URL format
  const isValidUrl = (url) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Format date for display
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Badge variant="outline">
          Member since {formatDate(profileData.created_at)}
        </Badge>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
            
            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Full Name</span>
                    </div>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Address</span>
                    </div>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    placeholder="Your email address"
                  />
                  <p className="text-xs text-muted-foreground">
                    To change your email address, please contact support.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </div>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileData.phone || ""}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </div>
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={profileData.location || ""}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="job_title">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>Job Title</span>
                    </div>
                  </Label>
                  <Input
                    id="job_title"
                    name="job_title"
                    value={profileData.job_title || ""}
                    onChange={handleInputChange}
                    placeholder="Your job title"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Additional Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Tell others more about yourself and provide additional contact options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Bio</span>
                    </div>
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio || ""}
                    onChange={handleInputChange}
                    placeholder="A short bio about yourself"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      <span>Website</span>
                    </div>
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    value={profileData.website || ""}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                  />
                  {formErrors.website && (
                    <p className="text-sm text-red-500">{formErrors.website}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time_zone">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Time Zone</span>
                    </div>
                  </Label>
                  <Select
                    value={profileData.time_zone}
                    onValueChange={(value) => handleSelectChange("time_zone", value)}
                  >
                    <SelectTrigger id="time_zone">
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeZones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving || isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
      </div>
    </div>
  );
};

export default ProfilePage;