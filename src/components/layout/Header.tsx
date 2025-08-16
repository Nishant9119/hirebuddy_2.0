import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  Briefcase,
  Sparkles,
  Zap,
  Users,
  BarChart3,
  Calendar,
  FileText,
  Search,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  openSignIn?: () => void;
}

const navigationItems = [
  {
    title: "Features",
    href: "#features",
    description: "Discover our powerful AI-driven tools",
    items: [
      {
        title: "AI Resume Builder",
        href: "/resume-builder",
        description: "Create ATS-optimized resumes with AI assistance",
        icon: FileText,
        badge: "Popular",
      },
      {
        title: "Smart Job Matching",
        href: "/jobs",
        description: "Find perfect job matches with AI",
        icon: Search,
        badge: "New",
      },
    ],
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Access your personalized career dashboard",
  },
  {
    title: "Analytics",
    href: "/analytics",
    description: "Track your job search performance",
  },
];

const mobileNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { title: "Find Jobs", href: "/jobs", icon: Search },
  { title: "Resume Builder", href: "/resume-builder", icon: FileText },
  { title: "Calendar", href: "/calendar", icon: Calendar },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];

export const Header = ({ openSignIn }: HeaderProps = {}) => {
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 bg-[#fff7f8]",
        isScrolled ? "shadow-lg backdrop-blur-md" : ""
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <nav className="w-full py-4 px-6 md:px-8 lg:px-12 flex items-center justify-between relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link href="/" className="text-[#633b3d] font-sans text-2xl font-bold tracking-tighter">
        Hirebuddy
      </Link>
        </motion.div>

        {/* Hamburger Menu Button (Mobile) */}
        <button 
          className="md:hidden flex flex-col justify-center items-center w-8 h-8"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-[#b24e55] transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#b24e55] my-1 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#b24e55] transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>

        {/* Navigation Links (Desktop) */}
        <motion.div
          className="hidden md:flex items-center space-x-8 font-medium lg:-mr-24 lg:-ml-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            to="/blogs"
            className="text-[#b24e55] font-bold hover:text-[#E75A82] transition-colors"
          >
            Blogs
          </Link>
          <Link
            to="/community"
            className="text-[#b24e55] font-bold hover:text-[#E75A82] transition-colors"
          >
            Community
          </Link>
          <Link
            to="/blogs?post=4"
            className="text-[#b24e55] font-bold hover:text-[#E75A82] transition-colors"
          >
            About
          </Link>
          <Link
            to="/pricing"
            className="text-[#b24e55] font-bold hover:text-[#E75A82] transition-colors"
          >
            Pricing
          </Link>
        </motion.div>

        {/* Mobile Menu (Conditional Rendering) */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#fff7f8] shadow-lg z-50 py-4 px-6">
            <div className="flex flex-col space-y-4">
              <Link
                to="/blogs"
                className="text-[#b24e55] hover:text-[#E75A82] transition-colors"
                onClick={toggleMobileMenu}
              >
                Blogs
              </Link>
              <Link
                to="/community"
                className="text-[#b24e55] hover:text-[#E75A82] transition-colors"
                onClick={toggleMobileMenu}
              >
                Community
              </Link>
              {user ? (
                <div className="pt-2 flex flex-col space-y-3">
                  <Link
                    to="/dashboard"
                    className="w-full text-[#b24e55] hover:text-[#E75A82] transition-colors text-center py-2"
                    onClick={toggleMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <Button
                    onClick={() => {
                      signOut();
                      toggleMobileMenu();
                    }}
                    className="w-full bg-gradient-to-t from-[#b24e55] to-[#E3405F] text-white rounded-lg"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="pt-2 flex flex-col space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full text-[#b24e55] hover:text-[#fc6f78] border border-[#b24e55] hover:border-[#fc6f78] hover:bg-transparent rounded-lg"
                    onClick={() => {
                      if (openSignIn) {
                        openSignIn();
                      }
                      toggleMobileMenu();
                    }}
                  >
                    Log in
                  </Button>
                  <Link to="/signup">
                    <Button
                      className="w-full bg-gradient-to-t from-[#b24e55] to-[#E3405F] text-white rounded-lg"
                      onClick={toggleMobileMenu}
                    >
                      Try for free!
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons (Desktop) */}
        <motion.div
          className="hidden md:flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {user ? (
            <>
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  className="text-[#b24e55] hover:text-[#fc6f78] border border-[#b24e55] hover:border-[#fc6f78] hover:bg-transparent rounded-lg"
                >
                  Dashboard
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt="User" />
                      <AvatarFallback className="bg-[#b24e55] text-white">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-[#b24e55] hover:text-[#fc6f78] border border-[#b24e55] hover:border-[#fc6f78] hover:bg-transparent rounded-lg"
                onClick={() => {
                  if (openSignIn) {
                    openSignIn();
                  }
                }}
              >
                Log in
              </Button>
              <Link to="/signup">
                <Button
                  className="bg-gradient-to-t from-[#b24e55] to-[#E3405F] text-white rounded-lg"
                >
                  Try for free!
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </nav>
    </motion.header>
  );
};
