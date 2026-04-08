import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";

interface EventAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export interface EventAutocompleteRef {
  focus: () => void;
  select: () => void;
}

const EventAutocomplete = forwardRef<EventAutocompleteRef, EventAutocompleteProps>(
  ({ value, onChange, onBlur, onKeyDown, suggestions, placeholder, className }, ref) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input value
    const filteredSuggestions = suggestions.filter(s => 
      s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
    ).slice(0, 5);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      select: () => inputRef.current?.select(),
    }));

    useEffect(() => {
      setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
      setSelectedIndex(-1);
    }, [value, filteredSuggestions.length]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (showSuggestions && filteredSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          return;
        }
        if (e.key === 'Tab' && selectedIndex >= 0) {
          e.preventDefault();
          onChange(filteredSuggestions[selectedIndex]);
          setShowSuggestions(false);
          return;
        }
        if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          onChange(filteredSuggestions[selectedIndex]);
          setShowSuggestions(false);
          return;
        }
      }
      onKeyDown(e);
    };

    const handleBlur = (e: React.FocusEvent) => {
      // Delay blur to allow click on suggestion
      setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          setShowSuggestions(false);
          onBlur();
        }
      }, 150);
    };

    const selectSuggestion = (suggestion: string) => {
      onChange(suggestion);
      setShowSuggestions(false);
      inputRef.current?.focus();
    };

    return (
      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={className}
          placeholder={placeholder}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded shadow-lg mt-0.5 max-h-32 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-2 py-1 text-[9px] cursor-pointer hover:bg-muted ${
                  index === selectedIndex ? 'bg-muted' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

EventAutocomplete.displayName = 'EventAutocomplete';

export default EventAutocomplete;
