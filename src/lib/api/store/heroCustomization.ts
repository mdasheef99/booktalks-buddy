import { supabase } from '@/lib/supabase';

/**
 * Hero Customization API for Store Management
 * Handles hero section customization including quotes and chat button settings
 */

// Types for hero customization
export interface HeroCustomization {
  id: string;
  store_id: string;
  hero_quote?: string;
  hero_quote_author?: string;
  hero_font_style: 'elegant' | 'modern' | 'classic' | 'bold';
  chat_button_text: string;
  chat_button_position: 'left' | 'center' | 'right';
  chat_button_color_scheme: 'terracotta' | 'sage' | 'brown' | 'cream' | 'custom';
  chat_button_size: 'small' | 'medium' | 'large';
  is_chat_button_enabled: boolean;
  sections_enabled: {
    hero_quote: boolean;
    [key: string]: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface HeroCustomizationFormData {
  hero_quote?: string;
  hero_quote_author?: string;
  hero_font_style: 'elegant' | 'modern' | 'classic' | 'bold';
  chat_button_text: string;
  chat_button_position: 'left' | 'center' | 'right';
  chat_button_color_scheme: 'terracotta' | 'sage' | 'brown' | 'cream' | 'custom';
  chat_button_size: 'small' | 'medium' | 'large';
  is_chat_button_enabled: boolean;
  sections_enabled: {
    hero_quote: boolean;
    [key: string]: boolean;
  };
}

// Default hero customization values
export const DEFAULT_HERO_CUSTOMIZATION: Omit<HeroCustomizationFormData, 'sections_enabled'> & {
  sections_enabled: { hero_quote: boolean };
} = {
  hero_quote: '',
  hero_quote_author: '',
  hero_font_style: 'elegant',
  chat_button_text: 'Start Chatting Anonymously',
  chat_button_position: 'center',
  chat_button_color_scheme: 'terracotta',
  chat_button_size: 'large',
  is_chat_button_enabled: true,
  sections_enabled: {
    hero_quote: false
  }
};

/**
 * Hero Customization API Class
 */
export class HeroCustomizationAPI {
  /**
   * Get hero customization for a store
   */
  static async getHeroCustomization(storeId: string): Promise<HeroCustomization | null> {
    try {
      const { data, error } = await supabase
        .from('store_landing_customization')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No customization found, return null
          return null;
        }
        throw error;
      }

      return data as HeroCustomization;
    } catch (error) {
      console.error('Error fetching hero customization:', error);
      throw new Error('Failed to fetch hero customization');
    }
  }

  /**
   * Create or update hero customization
   */
  static async upsertHeroCustomization(
    storeId: string,
    data: HeroCustomizationFormData
  ): Promise<HeroCustomization> {
    try {
      // Validate data
      this.validateHeroCustomizationData(data);

      const { data: result, error } = await supabase
        .from('store_landing_customization')
        .upsert({
          store_id: storeId,
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'store_id'
        })
        .select()
        .single();

      if (error) throw error;

      return result as HeroCustomization;
    } catch (error) {
      console.error('Error upserting hero customization:', error);
      throw new Error('Failed to save hero customization');
    }
  }

  /**
   * Reset hero customization to defaults
   */
  static async resetHeroCustomization(storeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('store_landing_customization')
        .delete()
        .eq('store_id', storeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting hero customization:', error);
      throw new Error('Failed to reset hero customization');
    }
  }

  /**
   * Get hero customization with fallback to defaults
   */
  static async getHeroCustomizationWithDefaults(storeId: string): Promise<HeroCustomizationFormData> {
    try {
      const customization = await this.getHeroCustomization(storeId);

      if (!customization) {
        return DEFAULT_HERO_CUSTOMIZATION;
      }

      return {
        hero_quote: customization.hero_quote || '',
        hero_quote_author: customization.hero_quote_author || '',
        hero_font_style: customization.hero_font_style,
        chat_button_text: customization.chat_button_text,
        chat_button_position: customization.chat_button_position,
        chat_button_color_scheme: customization.chat_button_color_scheme,
        chat_button_size: customization.chat_button_size,
        is_chat_button_enabled: customization.is_chat_button_enabled,
        sections_enabled: customization.sections_enabled
      };
    } catch (error) {
      console.error('Error getting hero customization with defaults:', error);
      return DEFAULT_HERO_CUSTOMIZATION;
    }
  }

  /**
   * Validate hero customization data
   */
  private static validateHeroCustomizationData(data: HeroCustomizationFormData): void {
    // Validate quote length
    if (data.hero_quote && data.hero_quote.length > 200) {
      throw new Error('Hero quote must be 200 characters or less');
    }

    // Validate author length
    if (data.hero_quote_author && data.hero_quote_author.length > 100) {
      throw new Error('Hero quote author must be 100 characters or less');
    }

    // Validate chat button text length
    if (data.chat_button_text.length > 50) {
      throw new Error('Chat button text must be 50 characters or less');
    }

    // Validate enum values
    const validFontStyles = ['elegant', 'modern', 'classic', 'bold'];
    if (!validFontStyles.includes(data.hero_font_style)) {
      throw new Error('Invalid font style');
    }

    const validPositions = ['left', 'center', 'right'];
    if (!validPositions.includes(data.chat_button_position)) {
      throw new Error('Invalid chat button position');
    }

    const validColorSchemes = ['terracotta', 'sage', 'brown', 'cream', 'custom'];
    if (!validColorSchemes.includes(data.chat_button_color_scheme)) {
      throw new Error('Invalid chat button color scheme');
    }

    const validSizes = ['small', 'medium', 'large'];
    if (!validSizes.includes(data.chat_button_size)) {
      throw new Error('Invalid chat button size');
    }
  }

  /**
   * Check if hero quote is enabled and has content
   */
  static async isHeroQuoteActive(storeId: string): Promise<boolean> {
    try {
      const customization = await this.getHeroCustomization(storeId);

      return !!(
        customization &&
        customization.sections_enabled?.hero_quote &&
        customization.hero_quote &&
        customization.hero_quote.trim().length > 0
      );
    } catch (error) {
      console.error('Error checking hero quote status:', error);
      return false;
    }
  }

  /**
   * Get hero customization for public display
   */
  static async getPublicHeroCustomization(storeId: string): Promise<{
    hasCustomQuote: boolean;
    quote?: string;
    author?: string;
    fontStyle: string;
    chatButton: {
      text: string;
      position: string;
      colorScheme: string;
      size: string;
      enabled: boolean;
    };
  }> {
    try {
      const customization = await this.getHeroCustomizationWithDefaults(storeId);
      const hasCustomQuote = !!(
        customization.sections_enabled?.hero_quote &&
        customization.hero_quote &&
        customization.hero_quote.trim().length > 0
      );

      return {
        hasCustomQuote,
        quote: hasCustomQuote ? customization.hero_quote : undefined,
        author: hasCustomQuote ? customization.hero_quote_author : undefined,
        fontStyle: customization.hero_font_style,
        chatButton: {
          text: customization.chat_button_text,
          position: customization.chat_button_position,
          colorScheme: customization.chat_button_color_scheme,
          size: customization.chat_button_size,
          enabled: customization.is_chat_button_enabled
        }
      };
    } catch (error) {
      console.error('Error getting public hero customization:', error);
      // Return defaults on error
      return {
        hasCustomQuote: false,
        fontStyle: 'elegant',
        chatButton: {
          text: 'Start Chatting Anonymously',
          position: 'center',
          colorScheme: 'terracotta',
          size: 'large',
          enabled: true
        }
      };
    }
  }
}

// Font style configurations
export const FONT_STYLE_CONFIGS = {
  elegant: {
    label: 'Elegant',
    className: 'font-serif',
    description: 'Classic serif font with elegant styling'
  },
  modern: {
    label: 'Modern',
    className: 'font-sans',
    description: 'Clean sans-serif font for modern look'
  },
  classic: {
    label: 'Classic',
    className: 'font-serif font-medium',
    description: 'Traditional serif with medium weight'
  },
  bold: {
    label: 'Bold',
    className: 'font-sans font-bold',
    description: 'Bold sans-serif for strong impact'
  }
} as const;

// Chat button configurations
export const CHAT_BUTTON_CONFIGS = {
  positions: {
    left: { label: 'Left', className: 'justify-start' },
    center: { label: 'Center', className: 'justify-center' },
    right: { label: 'Right', className: 'justify-end' }
  },
  sizes: {
    small: { label: 'Small', className: 'px-4 py-2 text-sm' },
    medium: { label: 'Medium', className: 'px-6 py-3 text-base' },
    large: { label: 'Large', className: 'px-8 py-4 text-lg' }
  },
  colorSchemes: {
    terracotta: {
      label: 'Terracotta',
      className: 'bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90'
    },
    sage: {
      label: 'Sage',
      className: 'bg-bookconnect-sage hover:bg-bookconnect-sage/90'
    },
    brown: {
      label: 'Brown',
      className: 'bg-bookconnect-brown hover:bg-bookconnect-brown/90'
    },
    cream: {
      label: 'Cream',
      className: 'bg-bookconnect-cream hover:bg-bookconnect-cream/90 text-bookconnect-brown'
    },
    custom: {
      label: 'Custom',
      className: 'bg-gray-800 hover:bg-gray-700'
    }
  }
} as const;
