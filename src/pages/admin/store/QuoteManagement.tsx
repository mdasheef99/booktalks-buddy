import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { QuotesAPI, CustomQuote, QuoteFormData } from '@/lib/api/store/quotes';
import { QuoteManagementGrid } from '@/components/admin/store/quotes/QuoteManagementGrid';
import { QuoteEditor } from '@/components/admin/store/quotes/QuoteEditor';
import { QuotePreview } from '@/components/admin/store/quotes/QuotePreview';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Quote as QuoteIcon, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Quote Management Page for Store Owners
 * Provides complete interface for managing custom quotes
 */
export const QuoteManagement: React.FC = () => {
  const { storeId } = useStoreOwnerContext();
  const queryClient = useQueryClient();
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingQuote, setEditingQuote] = useState<CustomQuote | null>(null);
  const [activeTab, setActiveTab] = useState('manage');

  // Fetch quotes
  const {
    data: quotes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['store-quotes-admin', storeId],
    queryFn: () => QuotesAPI.getStoreQuotes(storeId),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create quote mutation
  const createMutation = useMutation({
    mutationFn: (data: QuoteFormData) => QuotesAPI.createQuote(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-quotes-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['current-quote', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-quotes', storeId] });
      setShowEditor(false);
      setEditingQuote(null);
      toast.success('Quote created successfully');
    },
    onError: (error) => {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
    },
  });

  // Update quote mutation
  const updateMutation = useMutation({
    mutationFn: ({ quoteId, data }: { quoteId: string; data: Partial<QuoteFormData> }) =>
      QuotesAPI.updateQuote(storeId, quoteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-quotes-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['current-quote', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-quotes', storeId] });
      setShowEditor(false);
      setEditingQuote(null);
      toast.success('Quote updated successfully');
    },
    onError: (error) => {
      console.error('Error updating quote:', error);
      toast.error('Failed to update quote');
    },
  });

  // Delete quote mutation
  const deleteMutation = useMutation({
    mutationFn: (quoteId: string) => QuotesAPI.deleteQuote(storeId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-quotes-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['current-quote', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-quotes', storeId] });
      toast.success('Quote deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ quoteId, isActive }: { quoteId: string; isActive: boolean }) =>
      QuotesAPI.toggleQuoteStatus(storeId, quoteId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-quotes-admin', storeId] });
      queryClient.invalidateQueries({ queryKey: ['current-quote', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-quotes', storeId] });
      toast.success('Quote status updated');
    },
    onError: (error) => {
      console.error('Error updating quote status:', error);
      toast.error('Failed to update quote status');
    },
  });

  // Reorder quotes mutation
  const reorderMutation = useMutation({
    mutationFn: (quoteIds: string[]) => QuotesAPI.reorderQuotes(storeId, quoteIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-quotes-admin', storeId] });
      toast.success('Quotes reordered successfully');
    },
    onError: (error) => {
      console.error('Error reordering quotes:', error);
      toast.error('Failed to reorder quotes');
    },
  });

  const handleCreateQuote = () => {
    setEditingQuote(null);
    setShowEditor(true);
  };

  const handleEditQuote = (quote: CustomQuote) => {
    setEditingQuote(quote);
    setShowEditor(true);
  };

  const handleSaveQuote = (data: QuoteFormData) => {
    if (editingQuote) {
      updateMutation.mutate({ quoteId: editingQuote.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    deleteMutation.mutate(quoteId);
  };

  const handleToggleStatus = (quoteId: string, isActive: boolean) => {
    toggleStatusMutation.mutate({ quoteId, isActive });
  };

  const handleReorderQuotes = (quoteIds: string[]) => {
    reorderMutation.mutate(quoteIds);
  };

  const handleCancelEditor = () => {
    setShowEditor(false);
    setEditingQuote(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading quotes..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load quotes. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Show editor
  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingQuote ? 'Edit Quote' : 'Create Quote'}
            </h1>
            <p className="text-gray-600">
              {editingQuote ? 'Update your custom quote' : 'Add a new custom quote to your landing page'}
            </p>
          </div>
        </div>

        <QuoteEditor
          quote={editingQuote || undefined}
          onSave={handleSaveQuote}
          onCancel={handleCancelEditor}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quote Management</h1>
          <p className="text-gray-600">
            Manage custom quotes for your landing page
          </p>
        </div>
        <Button onClick={handleCreateQuote}>
          <Plus className="h-4 w-4 mr-2" />
          Add Quote
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manage Quotes
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Manage Quotes Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Quotes ({quotes.length})</CardTitle>
              <CardDescription>
                Create and manage quotes that will be displayed on your landing page. 
                Quotes rotate automatically if multiple active quotes are configured.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteManagementGrid
                quotes={quotes}
                onEdit={handleEditQuote}
                onDelete={handleDeleteQuote}
                onToggleStatus={handleToggleStatus}
                onReorder={handleReorderQuotes}
                isLoading={deleteMutation.isPending || toggleStatusMutation.isPending || reorderMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <QuotePreview 
            storeId={storeId} 
            onRefresh={refetch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
