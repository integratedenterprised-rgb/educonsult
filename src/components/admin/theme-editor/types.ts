import type { ThemeTokens } from "@/lib/theme";

export interface ThemeFormValues {
  key: string;
  name: string;
  isDarkMode: boolean;
  radius: number;
  fontHeading: string | null;
  fontBody: string | null;
  tokens: ThemeTokens;
}
