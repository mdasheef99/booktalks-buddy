import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Reusable search bar component with icon
 */
const SearchBar: React.FC<SearchBarProps> = ({ placeholder, value, onChange }) => {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
