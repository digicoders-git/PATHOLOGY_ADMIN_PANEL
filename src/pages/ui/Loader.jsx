import React from "react";
import { useTheme } from "../../context/ThemeContext";

const Loader = ({ size = 40 }) => {
  const { colors } = useTheme();

  return (
    <div className="flex justify-center items-center">
      <div
        className="animate-spin rounded-full border-t-2 border-b-2"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderColor: "transparent",
          borderTopColor: colors.primary,
          borderBottomColor: colors.primary,
        }}
      ></div>
    </div>
  );
};

export default Loader;
