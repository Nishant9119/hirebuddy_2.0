import { RainbowButton } from "@/components/ui/rainbow-button";
import { Input } from "@/components/ui/input";
import { ShimmerButton } from "../ui/shimmer-button";
import { TypingAnimation } from "../ui/typing-animation";
import { Button } from "../ui/button";
import { useState, useRef } from "react";

const AnimatedPlaceholderInput = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholderTexts = [
    "Software Engineer in Delhi",
    "Product Manager in Mumbai",
    "Data Scientist in Bangalore",
    "UX Designer in Hyderabad",
    "Marketing Manager in Chennai",
    "DevOps Engineer in Pune",
    "Business Analyst in Kolkata",
    "Frontend Developer in Noida",
    "Backend Developer in Gurgaon",
    "Full Stack Developer in Delhi"
  ];

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex-1 h-14 relative bg-gray-50 rounded-lg">
      {!isFocused && value === "" && (
        <div className="absolute inset-0 flex items-center px-4 pointer-events-none z-10">
          <TypingAnimation
            texts={placeholderTexts}
            className="text-lg text-[#b88c8e] font-medium"
            typingSpeed={80}
            deletingSpeed={40}
            pauseDuration={1500}
          />
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        className="w-full h-full px-4 bg-transparent border-none outline-none text-lg text-[#b88c8e] font-medium rounded-lg relative z-20"
        placeholder=""
      />
    </div>
  );
};

export const Hero = () => {
  return (
    <div className="pt-8 lg:pt-20 w-full flex flex-col items-center justify-center px-4 bg-[#fff7f8]">
      {/* What's new badge */}
      <div className="mb-8">
        <div className="inline-flex items-center rounded-full border border-[#ffe0e0] bg-[#ffe0e0] px-4 py-1.5">
          <span className="text-sm font-medium font-bold text-[#3e3233]">What's new</span>
          <div className="mx-2 h-4 w-[1px] bg-[#b16368]" />
          <span className="text-sm font-bold text-[#b16368]">
            Coming soon to mobile
          </span>
        </div>
      </div>

      {/* Main heading */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl text-center  font-mabry font-bold text-[#403334] max-w-4xl mb-6">
        Land your <span className="text-[#b24e55]">next opportunity</span>{" "}
        without lifting a finger.
      </h1>

      {/* Subheading */}
      <p className="font-light text-lg md:text-xl text-center text-[#4A3D55] max-w-3xl mb-12">
        Answer a brief set of questions, and our AI will match you with
        opportunities, tailor your applications, and submit them — automating
        your whole search for the right role.
      </p>

      {/* Job title animation and CTA section */}
      <div className="w-full max-w-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-xl shadow-[0_4px_60px_rgba(231,90,130,0.35)]">
          <AnimatedPlaceholderInput />
          <Button
            className="h-14 px-8 text-lg font-normal rounded-xl bg-gradient-to-t from-[#b24e55] to-[#E3405F] hover:opacity-90 text-white font-bold whitespace-nowrap"
            onClick={() => (window.location.href = "/signup")}
          >
            Find your next role
            <svg
              className="ml-2"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
        <p className="text-sm text-center text-[#b26469]">
          
        </p>
      </div>
    </div>
  );
};