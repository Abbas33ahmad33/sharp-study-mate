import { useTheme, themeConfigs, bgConfigs, ColorTheme, BgTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Check, Sun, Moon, Layout } from "lucide-react";

export const ThemeSelector = () => {
  const { theme, colorTheme, bgTheme, toggleTheme, setColorTheme, setBgTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full hover:bg-primary/10 active:scale-90 transition-transform"
          aria-label="Theme settings"
        >
          <Palette className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-slate-900 border shadow-2xl rounded-2xl p-2">
        <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2">
          <Palette className="w-4 h-4 text-primary" />
          Appearance Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Light/Dark Mode Toggle */}
        <DropdownMenuItem
          onClick={toggleTheme}
          className="cursor-pointer gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {theme === "light" ? (
              <Sun className="w-5 h-5 text-warning" />
            ) : (
              <Moon className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm tracking-tight">{theme === "light" ? "Light Mode" : "Dark Mode"}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch Appearance</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 py-2">Accent Themes</DropdownMenuLabel>

        {/* Color Theme Options */}
        <div className="px-1 py-2 grid grid-cols-3 gap-2">
          {themeConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setColorTheme(config.id)}
              className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95 ${colorTheme === config.id ? "bg-primary/5 ring-2 ring-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
            >
              <div
                className="w-8 h-8 rounded-full shadow-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(${config.colors.primary}), hsl(${config.colors.secondary}))`
                }}
              />
              <span className="text-[10px] font-bold">{config.name}</span>
              {colorTheme === config.id && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 py-2">Surface Colors</DropdownMenuLabel>

        {/* Background Theme Options */}
        <div className="px-1 py-2 grid grid-cols-2 gap-2">
          {bgConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setBgTheme(config.id)}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all active:scale-95 border-2 ${bgTheme === config.id ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
            >
              <div
                className="w-6 h-6 rounded-md border shadow-sm"
                style={{
                  background: `hsl(${theme === "light" ? config.colors.light : config.colors.dark})`
                }}
              />
              <span className="text-[11px] font-bold">{config.name}</span>
              {bgTheme === config.id && <Check className="w-3.5 h-3.5 text-primary ml-auto mr-1" />}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;