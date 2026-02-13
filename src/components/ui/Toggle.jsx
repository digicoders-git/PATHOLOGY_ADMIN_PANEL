import React from "react";
import { useTheme } from "../../context/ThemeContext";

const Toggle = React.memo(({ checked, onChange, label, loading }) => {
  const { colors } = useTheme();

  return (
    <div
      className={`flex items-center gap-3 py-2 cursor-pointer group ${loading ? "pointer-events-none opacity-80" : ""}`}
      onClick={() => !loading && onChange(!checked)}
    >
      <div
        className={`w-11 h-6 rounded-sm transition-all relative flex items-center px-1 ${
          checked ? "" : "bg-gray-300"
        }`}
        style={{
          backgroundColor: checked ? "#22C55E" : "rgba(156, 163, 175, 0.5)",
        }}
      >
        <div
          className={`w-4 h-4 rounded-sm bg-white transition-all shadow-sm flex items-center justify-center ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        >
          {loading && (
            <div className="w-2.5 h-2.5 border border-black/20 border-t-black rounded-full animate-spin"></div>
          )}
        </div>
      </div>
      {label && (
        <span
          className="text-sm font-bold select-none"
          style={{ color: colors.text }}
        >
          {label}:{" "}
          <span
            style={{ color: checked ? colors.primary : colors.textSecondary }}
          >
            {checked ? "Active" : "Inactive"}
          </span>
        </span>
      )}
    </div>
  );
});

export default Toggle;
