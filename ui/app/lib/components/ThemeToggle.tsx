import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.theme || (
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    );
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    localStorage.theme = newTheme;
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 p-2 rounded-full bg-neutral-200 dark:bg-gray-800 shadow-md hover:bg-neutral-300 dark:hover:bg-gray-700"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-gray-800" />}
    </button>
  );
}
