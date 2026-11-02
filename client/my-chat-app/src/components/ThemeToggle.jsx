import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/useTheme";

export default function ThemeToggle({ floating = false }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = nextTheme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      className={`theme-toggle ${floating ? "theme-toggle-floating" : ""}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{nextTheme === "dark" ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
