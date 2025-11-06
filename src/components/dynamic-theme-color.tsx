"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function DynamicThemeColor() {
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    const updateThemeColor = () => {
      // Get the actual computed background color from the DOM
      const bodyStyles = window.getComputedStyle(document.body);
      const computedBgColor = bodyStyles.backgroundColor;
      
      // Convert RGB to hex
      const rgbToHex = (rgb: string): string => {
        // Handle rgb() format
        const result = rgb.match(/\d+/g);
        if (result && result.length >= 3) {
          const r = parseInt(result[0]).toString(16).padStart(2, '0');
          const g = parseInt(result[1]).toString(16).padStart(2, '0');
          const b = parseInt(result[2]).toString(16).padStart(2, '0');
          return `#${r}${g}${b}`.toUpperCase();
        }
        return rgb;
      };

      // Get the exact color being rendered
      let themeColor = rgbToHex(computedBgColor);

      // If we couldn't get the color, fall back to exact computed values
      if (!themeColor.startsWith("#")) {
        const currentTheme = theme === "system" ? systemTheme : theme;
        // EXACT conversions from OKLCH values
        // Light: oklch(0.9818 0.0054 95.0986) = #FAF9F5
        // Dark: oklch(0.2679 0.0036 106.6427) = #262624
        themeColor = currentTheme === "dark" ? "#262624" : "#FAF9F5";
      }

      const backgroundColor = themeColor;

      // Update theme-color meta tag
      let themeMetaTag = document.querySelector('meta[name="theme-color"]');
      if (!themeMetaTag) {
        themeMetaTag = document.createElement("meta");
        themeMetaTag.setAttribute("name", "theme-color");
        document.head.appendChild(themeMetaTag);
      }
      themeMetaTag.setAttribute("content", themeColor);

      // Update Apple status bar style based on theme
      let appleStatusBarTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!appleStatusBarTag) {
        appleStatusBarTag = document.createElement("meta");
        appleStatusBarTag.setAttribute("name", "apple-mobile-web-app-status-bar-style");
        document.head.appendChild(appleStatusBarTag);
      }
      
      // Use "black-translucent" for better integration with your theme
      appleStatusBarTag.setAttribute("content", "black-translucent");

      // Update manifest theme color dynamically if supported
      if ('serviceWorker' in navigator) {
        // Some browsers support dynamic manifest updates
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          // Update internal manifest cache if possible
          fetch('/manifest.json')
            .then(response => response.json())
            .then(manifest => {
              manifest.theme_color = themeColor;
              manifest.background_color = backgroundColor;
            })
            .catch(() => {
              // Silently fail if manifest update isn't supported
            });
        }
      }
    };

    // Update on theme change
    updateThemeColor();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === "system") {
        updateThemeColor();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, systemTheme]);

  return null; // This component doesn't render anything
}