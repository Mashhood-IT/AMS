import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

const SearchableDropdown = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options...",
  label = "",
  isMulti = false,
  error = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    if (isMulti) {
      const newValue = Array.isArray(value)
        ? (value.includes(option.value)
          ? value.filter(v => v !== option.value)
          : [...value, option.value])
        : [option.value];
      if (onChange) onChange(newValue);
    } else {
      if (onChange) onChange(option.value);
      setIsOpen(false);
    }
  };

  const selectedLabels = options
    .filter(opt => isMulti ? value.includes(opt.value) : value === opt.value)
    .map(opt => opt.label);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-[34px] px-3 py-0.5 bg-white border rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-between gap-2
          ${isOpen ? "border-brand-active ring-4 ring-brand-active/10" : "border-slate-200 hover:border-slate-300"}
          ${error ? "border-red-300 ring-red-100" : ""}
        `}
      >
        <div className="flex flex-wrap gap-1.5 overflow-hidden">
          {selectedLabels.length > 0 ? (
            isMulti ? (
              options.filter(opt => value.includes(opt.value)).map(opt => (
                <span key={opt.value} className="bg-brand-active/10 text-brand-active text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 group animate-in fade-in zoom-in duration-200">
                  {label}
                  <X
                    size={12}
                    className="hover:text-brand-hover cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const val = options.find(o => o.label === label).value;
                      handleSelect({ value: val });
                    }}
                  />
                </span>
              ))
            ) : (
              <span className="text-slate-700 font-medium">{selectedLabels[0]}</span>
            )
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-lg shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
            <Search size={16} className="text-slate-400 ml-2" />
            <input
              type="text"
              className="w-full bg-transparent border-none outline-none p-2 text-sm text-slate-700 placeholder:text-slate-400"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = isMulti ? value.includes(option.value) : value === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-0.5 last:mb-0
                      ${isSelected ? "bg-brand-active/5 text-brand-active font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                    `}
                  >
                    <span className="text-sm">{option.label}</span>
                    {isSelected && <Check size={16} className="text-brand-active" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-slate-400 italic">No results found</div>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default SearchableDropdown;
