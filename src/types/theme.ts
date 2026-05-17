import type { ThemeSettings, ThemeTokens } from "@/lib/theme";

export interface ActiveTheme extends ThemeSettings {
  id: string;
  key: string;
  name: string;
}

export interface ThemePreset {
  id: string;
  key: string;
  name: string;
  tokens: ThemeTokens;
  radius: number;
  fontHeading: string | null;
  fontBody: string | null;
  isActive: boolean;
  isDefault: boolean;
  isDarkMode: boolean;
}
