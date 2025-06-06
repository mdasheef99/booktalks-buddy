import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { 
  HeroCustomizationAPI, 
  HeroCustomizationFormData,
  DEFAULT_HERO_CUSTOMIZATION,
  FONT_STYLE_CONFIGS,
  CHAT_BUTTON_CONFIGS
} from '@/lib/api/store/heroCustomization';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Quote, 
  MessageCircle, 
  Eye, 
  RotateCcw, 
  Save,
  Type,
  Palette,
  Move,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

/**
 * Hero Customization Page for Store Owners
 * Provides interface for customizing hero section quotes and chat button
 */
export const HeroCustomization: React.FC = () => {
  const { storeId } = useStoreOwnerContext();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('quote');
  const [formData, setFormData] = useState<HeroCustomizationFormData>(DEFAULT_HERO_CUSTOMIZATION);

  // Fetch hero customization
  const {
    data: heroCustomization,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['hero-customization', storeId],
    queryFn: () => HeroCustomizationAPI.getHeroCustomizationWithDefaults(storeId),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Update form data when customization loads
  React.useEffect(() => {
    if (heroCustomization) {
      setFormData(heroCustomization);
    }
  }, [heroCustomization]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: HeroCustomizationFormData) => 
      HeroCustomizationAPI.upsertHeroCustomization(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-customization', storeId] });
      toast.success('Hero customization saved successfully');
    },
    onError: (error: any) => {
      console.error('Error saving hero customization:', error);
      toast.error(error.message || 'Failed to save hero customization');
    }
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: () => HeroCustomizationAPI.resetHeroCustomization(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-customization', storeId] });
      setFormData(DEFAULT_HERO_CUSTOMIZATION);
      toast.success('Hero customization reset to defaults');
    },
    onError: (error: any) => {
      console.error('Error resetting hero customization:', error);
      toast.error('Failed to reset hero customization');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all hero customization to defaults? This cannot be undone.')) {
      resetMutation.mutate();
    }
  };

  const updateFormData = (updates: Partial<HeroCustomizationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateSectionsEnabled = (key: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      sections_enabled: {
        ...prev.sections_enabled,
        [key]: enabled
      }
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading hero customization..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load hero customization. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hero Section Customization</h1>
          <p className="text-gray-600 mt-2">
            Customize your hero section with quotes and chat button settings
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link to="/">
              <Eye className="h-4 w-4" />
              Preview Landing Page
            </Link>
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2"
            disabled={resetMutation.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          
          <Button
            onClick={handleSave}
            className="flex items-center gap-2"
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Customization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quote" className="flex items-center gap-2">
            <Quote className="h-4 w-4" />
            Hero Quote
          </TabsTrigger>
          <TabsTrigger value="chat-button" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat Button
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Hero Quote Tab */}
        <TabsContent value="quote" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Hero Quote</CardTitle>
              <CardDescription>
                Add an inspirational quote to your hero section. Leave empty to use default content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Quote Section */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-quote" className="text-base font-medium">
                    Enable Custom Quote
                  </Label>
                  <p className="text-sm text-gray-600">
                    Show a custom quote in the hero section
                  </p>
                </div>
                <Switch
                  id="enable-quote"
                  checked={formData.sections_enabled?.hero_quote || false}
                  onCheckedChange={(checked) => updateSectionsEnabled('hero_quote', checked)}
                />
              </div>

              {formData.sections_enabled?.hero_quote && (
                <>
                  {/* Quote Text */}
                  <div className="space-y-2">
                    <Label htmlFor="hero-quote">Quote Text</Label>
                    <Textarea
                      id="hero-quote"
                      placeholder="Enter your inspirational quote..."
                      value={formData.hero_quote || ''}
                      onChange={(e) => updateFormData({ hero_quote: e.target.value })}
                      maxLength={200}
                      rows={3}
                    />
                    <p className="text-sm text-gray-500">
                      {(formData.hero_quote || '').length}/200 characters
                    </p>
                  </div>

                  {/* Quote Author */}
                  <div className="space-y-2">
                    <Label htmlFor="hero-quote-author">Author (Optional)</Label>
                    <Input
                      id="hero-quote-author"
                      placeholder="Quote author or source..."
                      value={formData.hero_quote_author || ''}
                      onChange={(e) => updateFormData({ hero_quote_author: e.target.value })}
                      maxLength={100}
                    />
                    <p className="text-sm text-gray-500">
                      {(formData.hero_quote_author || '').length}/100 characters
                    </p>
                  </div>

                  {/* Font Style */}
                  <div className="space-y-2">
                    <Label htmlFor="font-style">Font Style</Label>
                    <Select
                      value={formData.hero_font_style}
                      onValueChange={(value: any) => updateFormData({ hero_font_style: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FONT_STYLE_CONFIGS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Type className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs text-gray-500">{config.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Button Tab */}
        <TabsContent value="chat-button" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chat Button Customization</CardTitle>
              <CardDescription>
                Customize the appearance and behavior of the chat button in your hero section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Chat Button */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-chat-button" className="text-base font-medium">
                    Enable Chat Button
                  </Label>
                  <p className="text-sm text-gray-600">
                    Show the chat button in the hero section
                  </p>
                </div>
                <Switch
                  id="enable-chat-button"
                  checked={formData.is_chat_button_enabled}
                  onCheckedChange={(checked) => updateFormData({ is_chat_button_enabled: checked })}
                />
              </div>

              {formData.is_chat_button_enabled && (
                <>
                  {/* Button Text */}
                  <div className="space-y-2">
                    <Label htmlFor="chat-button-text">Button Text</Label>
                    <Input
                      id="chat-button-text"
                      placeholder="Start Chatting Anonymously"
                      value={formData.chat_button_text}
                      onChange={(e) => updateFormData({ chat_button_text: e.target.value })}
                      maxLength={50}
                    />
                    <p className="text-sm text-gray-500">
                      {formData.chat_button_text.length}/50 characters
                    </p>
                  </div>

                  {/* Button Position */}
                  <div className="space-y-2">
                    <Label htmlFor="chat-button-position">Position</Label>
                    <Select
                      value={formData.chat_button_position}
                      onValueChange={(value: any) => updateFormData({ chat_button_position: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CHAT_BUTTON_CONFIGS.positions).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Move className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Button Size */}
                  <div className="space-y-2">
                    <Label htmlFor="chat-button-size">Size</Label>
                    <Select
                      value={formData.chat_button_size}
                      onValueChange={(value: any) => updateFormData({ chat_button_size: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CHAT_BUTTON_CONFIGS.sizes).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Button Color Scheme */}
                  <div className="space-y-2">
                    <Label htmlFor="chat-button-color">Color Scheme</Label>
                    <Select
                      value={formData.chat_button_color_scheme}
                      onValueChange={(value: any) => updateFormData({ chat_button_color_scheme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CHAT_BUTTON_CONFIGS.colorSchemes).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Palette className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                Preview how your hero section will look with the current settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">Hero Section Preview</p>
                <p className="text-sm text-gray-500">
                  Preview functionality will be implemented in the next update.
                  Use "Preview Landing Page" button to see actual changes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
