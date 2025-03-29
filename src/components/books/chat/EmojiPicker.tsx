
import React from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface EmojiCategory {
  name: string;
  emojis: string[];
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common emoji categories with a selection of popular emojis
const emojiCategories: EmojiCategory[] = [
  {
    name: "Smileys",
    emojis: ["😀", "😁", "😂", "🥰", "😊", "😎", "🙂", "😍", "😘", "🤔", "🙄", "😴", "😮", "🥺"]
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "👏", "🙌", "👋", "🤝", "✋", "👇", "👆", "👉", "👈"]
  },
  {
    name: "Objects",
    emojis: ["📚", "🔍", "📝", "📖", "🏆", "🎵", "🎬", "📱", "💻", "⌚", "🎁", "💡", "🔑", "🔒"]
  },
  {
    name: "Nature",
    emojis: ["🌸", "🌹", "🌈", "☀️", "🌙", "⭐", "🌟", "🍀", "🍁", "🌲", "🐶", "🐱", "🦋", "🐢"]
  },
  {
    name: "Food",
    emojis: ["☕", "🍔", "🍕", "🍰", "🍩", "🍦", "🍫", "🍪", "🥗", "🍷", "🥂", "🧁", "🍎", "🍓"]
  }
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onEmojiSelect, 
  isOpen, 
  onOpenChange 
}) => {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-bookconnect-brown/70 hover:text-bookconnect-brown hover:bg-transparent"
        >
          <Smile className="h-4 w-4" />
          <span className="sr-only">Add emoji</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-2 max-h-[300px] overflow-y-auto w-[250px]">
        <div className="grid grid-cols-1 gap-2">
          {emojiCategories.map((category) => (
            <div key={category.name} className="space-y-1">
              <p className="text-xs font-medium text-bookconnect-brown/70 px-1">{category.name}</p>
              <div className="grid grid-cols-7 gap-1">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onEmojiSelect(emoji)}
                    className="text-lg hover:bg-bookconnect-terracotta/10 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmojiPicker;
