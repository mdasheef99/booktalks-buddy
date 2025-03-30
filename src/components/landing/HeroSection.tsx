
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, BookIcon, Library, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  handleStartChatting: () => void;
}

const HeroSection = ({ handleStartChatting }: HeroSectionProps) => {
  return (
    <div 
      className="relative min-h-[90vh] flex items-center justify-center text-center px-4 py-24 md:py-36 overflow-hidden"
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      
      <div className="absolute w-full h-full overflow-hidden">
        <div className="absolute top-[15%] left-[10%] opacity-20 rotate-12 transform scale-75 md:scale-100">
          <BookIcon className="w-16 h-16 text-bookconnect-cream" />
        </div>
        <div className="absolute top-[35%] right-[12%] opacity-20 -rotate-6 transform scale-75 md:scale-100">
          <BookOpen className="w-20 h-20 text-bookconnect-terracotta" />
        </div>
        <div className="absolute bottom-[20%] left-[20%] opacity-20 rotate-3 transform scale-75 md:scale-100">
          <Library className="w-14 h-14 text-bookconnect-sage" />
        </div>
        <div className="absolute top-[60%] right-[25%] opacity-20 -rotate-12 transform scale-75 md:scale-100">
          <Sparkles className="w-10 h-10 text-bookconnect-cream" />
        </div>
      </div>
      
      <div className="z-10 max-w-4xl animate-fade-in">
        <span className="inline-block px-4 py-1 rounded-full bg-bookconnect-terracotta/20 text-bookconnect-cream text-sm font-medium tracking-wide mb-6 backdrop-blur-sm border border-bookconnect-terracotta/30">
          Welcome to BookConnect
        </span>
        
        <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl text-white font-bold mb-6 leading-tight">
          Connect Through <span className="relative">Books
            <span className="absolute bottom-1 left-0 w-full h-2 bg-bookconnect-terracotta/40"></span>
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join our community of book lovers and connect anonymously through your shared passion for reading
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button 
            onClick={handleStartChatting}
            size="lg"
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white px-8 py-7 text-xl rounded-md transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg group"
          >
            <BookOpen className="mr-2" /> 
            Start Chatting Anonymously
            <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>
        </div>
        
        <div className="mt-12 flex justify-center">
          <div className="animate-bounce p-2 bg-white/10 rounded-full backdrop-blur-sm">
            <svg className="w-6 h-6 text-bookconnect-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
