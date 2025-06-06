import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  Tag,
  Quote as QuoteIcon,
  GripVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CustomQuote } from '@/lib/api/store/quotes';

interface QuoteManagementGridProps {
  quotes: CustomQuote[];
  onEdit: (quote: CustomQuote) => void;
  onDelete: (quoteId: string) => void;
  onToggleStatus: (quoteId: string, isActive: boolean) => void;
  onReorder?: (quoteIds: string[]) => void;
  isLoading?: boolean;
}

const CATEGORY_COLORS = {
  general: 'bg-gray-100 text-gray-800',
  inspirational: 'bg-blue-100 text-blue-800',
  literary: 'bg-green-100 text-green-800',
  seasonal: 'bg-orange-100 text-orange-800',
  store_specific: 'bg-purple-100 text-purple-800',
};

export const QuoteManagementGrid: React.FC<QuoteManagementGridProps> = ({
  quotes,
  onEdit,
  onDelete,
  onToggleStatus,
  onReorder,
  isLoading = false
}) => {
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteQuoteId) {
      onDelete(deleteQuoteId);
      setDeleteQuoteId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isQuoteActive = (quote: CustomQuote) => {
    if (!quote.is_active) return false;
    
    const now = new Date();
    const startDate = quote.start_date ? new Date(quote.start_date) : null;
    const endDate = quote.end_date ? new Date(quote.end_date) : null;
    
    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;
    
    return true;
  };

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <QuoteIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes yet</h3>
          <p className="text-gray-500 text-center mb-4">
            Create your first custom quote to personalize your landing page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {quotes.map((quote, index) => {
          const isCurrentlyActive = isQuoteActive(quote);
          
          return (
            <Card key={quote.id} className={`transition-all duration-200 ${
              isCurrentlyActive ? 'ring-2 ring-bookconnect-terracotta/20 bg-bookconnect-terracotta/5' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {onReorder && (
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    )}
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={CATEGORY_COLORS[quote.quote_category]}
                      >
                        {quote.quote_category.replace('_', ' ')}
                      </Badge>
                      {isCurrentlyActive && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                      {!quote.is_active && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={quote.is_active}
                      onCheckedChange={(checked) => onToggleStatus(quote.id, checked)}
                      disabled={isLoading}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(quote)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteQuoteId(quote.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Quote Text */}
                  <div>
                    <p className="text-lg font-serif italic text-gray-900 leading-relaxed">
                      "{truncateText(quote.quote_text, 150)}"
                    </p>
                    {(quote.quote_author || quote.quote_source) && (
                      <p className="text-sm text-gray-600 mt-2">
                        — {quote.quote_author}
                        {quote.quote_source && `, ${quote.quote_source}`}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {quote.quote_tags && quote.quote_tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-3 w-3 text-gray-400" />
                      {quote.quote_tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Scheduling Info */}
                  {(quote.start_date || quote.end_date) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {quote.start_date && (
                        <span>From {formatDate(quote.start_date)}</span>
                      )}
                      {quote.start_date && quote.end_date && <span>•</span>}
                      {quote.end_date && (
                        <span>Until {formatDate(quote.end_date)}</span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                    <span>Order: {quote.display_order}</span>
                    <span>Created: {formatDate(quote.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuoteId} onOpenChange={() => setDeleteQuoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
