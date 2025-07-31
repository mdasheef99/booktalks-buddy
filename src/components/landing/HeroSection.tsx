
import React from "react";
import { BookOpen, BookIcon, Library, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeroCustomization } from "@/hooks/useHeroCustomization";
import { FONT_STYLE_CONFIGS, CHAT_BUTTON_CONFIGS } from "@/lib/api/store/heroCustomization";
import { cn } from "@/lib/utils";
import { useSectionAnimation } from "../../hooks/useScrollAnimation";
import { useSectionVisibilityTracking } from "@/hooks/useLandingPageTracking";

interface HeroSectionProps {
  handleStartChatting: () => void;
  storeId?: string;
  analytics?: any;
}

const HeroSection = ({ handleStartChatting, storeId, analytics }: HeroSectionProps) => {
  const { data: heroCustomization, isLoading } = useHeroCustomization(storeId);
  const { elementRef, animationClass } = useSectionAnimation('fade-scale');

  // Track hero section visibility
  const heroRef = useSectionVisibilityTracking('hero', analytics || {
    trackSectionView: () => {},
    isEnabled: false
  });

  // Enhanced chat button click handler with analytics
  const handleChatButtonClick = () => {
    // Track analytics if available
    if (analytics && analytics.isEnabled) {
      analytics.trackChatButtonClick({
        buttonText: heroCustomization?.chatButton.text || 'Start Chatting Anonymously',
        buttonPosition: heroCustomization?.chatButton.position || 'center',
        buttonSize: heroCustomization?.chatButton.size || 'large',
        colorScheme: heroCustomization?.chatButton.colorScheme || 'terracotta',
        isCustomized: !!heroCustomization?.chatButton.enabled
      });
    }

    // Original functionality
    handleStartChatting();
  };
  return (
    <section
      ref={heroRef}
      className="relative min-h-[65vh] flex items-center justify-center text-center px-4 py-24 md:py-36 overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')"
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

      <div ref={elementRef} className={cn("z-10 max-w-4xl", animationClass)}>
        <span className="inline-block px-4 py-1 rounded-full bg-bookconnect-terracotta/20 text-bookconnect-cream text-sm font-medium tracking-wide mb-6 backdrop-blur-sm border border-bookconnect-terracotta/30">
          Welcome to BookConnect
        </span>

        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-white font-bold mb-6 leading-tight tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          Connect Through <span className="relative">Books
            <span className="absolute bottom-1 left-0 w-full h-2 bg-bookconnect-terracotta/40"></span>
          </span>
        </h1>

        <p className="text-base md:text-lg lg:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          Join our community of book lovers and connect anonymously through your shared passion for reading
        </p>

        {/* Custom Hero Quote Section */}
        {heroCustomization?.hasCustomQuote && (
          <div className="mb-10 max-w-3xl mx-auto">
            <div className="relative">
              {/* Quote Icon */}
              <div className="absolute -top-4 -left-4 text-white/20">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 17h3l2-4V7h-6v6h3M6 17h3l2-4V7H5v6h3z"/>
                </svg>
              </div>

              {/* Quote Text */}
              <blockquote
                className={cn(
                  "text-xl md:text-2xl text-white/95 italic leading-relaxed mb-4",
                  FONT_STYLE_CONFIGS[heroCustomization.fontStyle as keyof typeof FONT_STYLE_CONFIGS]?.className
                )}
              >
                "{heroCustomization.quote}"
              </blockquote>

              {/* Quote Author */}
              {heroCustomization.author && (
                <cite className="text-white/80 text-sm md:text-base not-italic">
                  — {heroCustomization.author}
                </cite>
              )}
            </div>
          </div>
        )}

        {/* Chat Button Section */}
        {heroCustomization?.chatButton.enabled ? (
          <div className={cn(
            "flex flex-col sm:flex-row gap-4 items-center",
            CHAT_BUTTON_CONFIGS.positions[heroCustomization.chatButton.position as keyof typeof CHAT_BUTTON_CONFIGS.positions]?.className || "justify-center"
          )}>
            <Button
              onClick={handleChatButtonClick}
              size="lg"
              className={cn(
                "text-white rounded-md button-hover-lift focus-ring-enhanced group",
                CHAT_BUTTON_CONFIGS.sizes[heroCustomization.chatButton.size as keyof typeof CHAT_BUTTON_CONFIGS.sizes]?.className || "px-8 py-7 text-xl",
                CHAT_BUTTON_CONFIGS.colorSchemes[heroCustomization.chatButton.colorScheme as keyof typeof CHAT_BUTTON_CONFIGS.colorSchemes]?.className || "enhanced-chat-button"
              )}
            >
              <BookOpen className="mr-2 icon-transition" />
              {heroCustomization.chatButton.text}
              <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 icon-transition" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button
              onClick={handleChatButtonClick}
              size="lg"
              className="enhanced-chat-button text-white px-8 py-7 text-xl rounded-md button-hover-lift focus-ring-enhanced group"
            >
              <BookOpen className="mr-2 icon-transition" />
              Start Chatting Anonymously
              <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 icon-transition" />
            </Button>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <div className="animate-bounce p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-all duration-300 cursor-pointer">
            <svg className="w-6 h-6 text-bookconnect-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
