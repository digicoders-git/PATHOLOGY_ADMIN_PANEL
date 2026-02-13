import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { ChevronDown } from "lucide-react";

const ModernSelect = React.memo(
  ({
    value,
    onChange,
    options,
    placeholder = "Select option",
    label,
    fullWidth,
  }) => {
    const { colors } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div
        className={`flex flex-col gap-2 ${fullWidth ? "w-full" : "w-full md:w-48"}`}
        ref={dropdownRef}
      >
        {label && (
          <label
            className="text-xs font-bold uppercase tracking-wider opacity-60"
            style={{ color: colors.text }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-sm border text-sm font-medium transition-all"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.accent + "30",
              color: colors.text,
            }}
          >
            <span className={!selectedOption ? "opacity-50" : ""}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              size={18}
            />
          </button>

          {isOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 z-70 rounded-sm border shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.accent + "20",
              }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-black/5"
                  style={{
                    color:
                      value === option.value ? colors.primary : colors.text,
                    backgroundColor:
                      value === option.value
                        ? colors.primary + "10"
                        : "transparent",
                    fontWeight: value === option.value ? "700" : "400",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default ModernSelect;
