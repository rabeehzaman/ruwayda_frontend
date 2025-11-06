"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function DebugColorsPage() {
  const { theme } = useTheme();
  const [bgColor, setBgColor] = useState("");
  const [computedBg, setComputedBg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get the computed background color
      const bodyStyles = window.getComputedStyle(document.body);
      const bgValue = bodyStyles.getPropertyValue("background-color");
      setComputedBg(bgValue);

      // Get CSS variable value
      const rootStyles = window.getComputedStyle(document.documentElement);
      const cssVarBg = rootStyles.getPropertyValue("--background");
      setBgColor(cssVarBg);

      // Convert RGB to hex
      const rgbToHex = (rgb: string) => {
        const result = rgb.match(/\d+/g);
        if (result && result.length >= 3) {
          const r = parseInt(result[0]).toString(16).padStart(2, '0');
          const g = parseInt(result[1]).toString(16).padStart(2, '0');
          const b = parseInt(result[2]).toString(16).padStart(2, '0');
          return `#${r}${g}${b}`;
        }
        return rgb;
      };

      console.log("Background CSS var:", cssVarBg);
      console.log("Computed background:", bgValue);
      console.log("As hex:", rgbToHex(bgValue));
    }
  }, [theme]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Dashboard Colors</h1>
      <div className="space-y-4">
        <div>
          <strong>Current theme:</strong> {theme}
        </div>
        <div>
          <strong>CSS Variable (--background):</strong> {bgColor}
        </div>
        <div>
          <strong>Computed background-color:</strong> {computedBg}
        </div>
        <div className="p-4 border rounded">
          <strong>Instructions:</strong>
          <ol className="list-decimal list-inside mt-2">
            <li>Open browser console (F12)</li>
            <li>Look for the hex color values printed</li>
            <li>These are the EXACT colors your dashboard uses</li>
          </ol>
        </div>
      </div>
    </div>
  );
}