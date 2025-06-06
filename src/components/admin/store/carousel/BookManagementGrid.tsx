import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { CarouselItem } from '@/lib/api/store/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Edit, 
  Trash2, 
  Plus, 
  GripVertical,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookManagementGridProps {
  items: CarouselItem[];
  onEdit: (item: CarouselItem) => void;
  onDelete: (itemId: string) => void;
  onReorder: (items: { id: string; position: number }[]) => void;
  onAdd: () => void;
  isReordering?: boolean;
}

const badgeConfig = {
  new_arrival: { label: 'New Arrival', color: 'bg-green-500' },
  staff_pick: { label: 'Staff Pick', color: 'bg-bookconnect-terracotta' },
  bestseller: { label: 'Bestseller', color: 'bg-red-500' },
  on_sale: { label: 'On Sale', color: 'bg-orange-500' },
  featured: { label: 'Featured', color: 'bg-bookconnect-sage' },
  none: null
};

/**
 * Drag-and-drop grid for managing carousel books
 * 6 fixed positions with empty slot placeholders
 */
export const BookManagementGrid: React.FC<BookManagementGridProps> = ({
  items,
  onEdit,
  onDelete,
  onReorder,
  onAdd,
  isReordering = false
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Create array of 6 positions with items or empty slots
  const gridItems = Array.from({ length: 6 }, (_, index) => {
    const position = index + 1;
    const item = items.find(item => item.position === position);
    return { position, item };
  });

  const handleDragStart = (start: any) => {
    setDraggedItem(start.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggedItem(null);

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // Create new order based on drag result
    const newItems = [...items];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(destinationIndex, 0, movedItem);

    // Update positions
    const reorderedItems = newItems.map((item, index) => ({
      id: item.id,
      position: index + 1
    }));

    onReorder(reorderedItems);
  };

  const EmptySlot: React.FC<{ position: number }> = ({ position }) => (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-6 text-center">
        <div className="space-y-4">
          <div className="w-16 h-20 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Position {position}</p>
            <p className="text-xs text-gray-400 mt-1">Empty slot</p>
          </div>
          <Button
            onClick={onAdd}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={items.length >= 6}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const BookSlot: React.FC<{ item: CarouselItem; index: number }> = ({ item, index }) => {
    const badgeInfo = item.featured_badge && item.featured_badge !== 'none' 
      ? badgeConfig[item.featured_badge] 
      : null;

    return (
      <Draggable draggableId={item.id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "transition-all duration-200",
              snapshot.isDragging && "shadow-lg rotate-2 scale-105",
              !item.is_active && "opacity-60"
            )}
          >
            <CardContent className="p-4">
              {/* Drag Handle */}
              <div
                {...provided.dragHandleProps}
                className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    Position {item.position}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {item.is_active ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  {item.click_destination_url && (
                    <ExternalLink className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>

              {/* Book Cover */}
              <div className="relative mb-3">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  {item.book_image_url ? (
                    <img
                      src={item.book_image_url}
                      alt={item.book_image_alt || `Cover of ${item.book_title}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Featured Badge */}
                {badgeInfo && (
                  <Badge 
                    className={cn(
                      "absolute top-2 left-2 text-xs",
                      badgeInfo.color && `${badgeInfo.color} text-white border-0`
                    )}
                  >
                    {badgeInfo.label}
                  </Badge>
                )}
              </div>

              {/* Book Info */}
              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-sm line-clamp-2 leading-tight">
                  {item.book_title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-1">
                  by {item.book_author}
                </p>
                {item.custom_description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {item.custom_description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(item)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => onDelete(item.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </Draggable>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{items.length} of 6 positions filled</span>
        {isReordering && (
          <span className="text-blue-600">Updating order...</span>
        )}
      </div>

      {/* Grid */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="carousel-grid" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
            >
              {gridItems.map(({ position, item }) => 
                item ? (
                  <BookSlot 
                    key={item.id} 
                    item={item} 
                    index={items.findIndex(i => i.id === item.id)} 
                  />
                ) : (
                  <EmptySlot key={`empty-${position}`} position={position} />
                )
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
