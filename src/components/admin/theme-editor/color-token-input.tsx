"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { HslColorPicker } from "react-colorful";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { cn } from "@/lib/utils";
import { formatHslString, parseHslString, hslDisplay } from "@/lib/theme";
import type { ThemeTokens } from "@/lib/theme";
import type { ThemeFormValues } from "./types";

interface ColorTokenInputProps {
  tokenKey: keyof ThemeTokens;
  label: string;
}

/**
 * One color row in the editor — swatch button opens an HSL picker popover,
 * text field accepts manual "H S% L%" input. Picker and text stay in sync
 * via the RHF form value.
 */
export function ColorTokenInput({ tokenKey, label }: ColorTokenInputProps) {
  const { watch, setValue } = useFormContext<ThemeFormValues>();
  const stored = watch(`tokens.${tokenKey}`);
  const parsed = parseHslString(stored) ?? { h: 0, s: 0, l: 0 };

  // Local text-input state — only commits to the form when it parses cleanly,
  // so users can mid-edit a value without seeing the picker jump.
  const [textInput, setTextInput] = useState(stored);
  useEffect(() => {
    setTextInput(stored);
  }, [stored]);

  function commitText(value: string) {
    setTextInput(value);
    const next = parseHslString(value);
    if (next) {
      setValue(`tokens.${tokenKey}`, formatHslString(next), { shouldDirty: true });
    }
  }

  function commitPicker(next: { h: number; s: number; l: number }) {
    const formatted = formatHslString(next);
    setValue(`tokens.${tokenKey}`, formatted, { shouldDirty: true });
  }

  return (
    <div className="grid grid-cols-[auto_1fr_minmax(0,12rem)] items-center gap-3">
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={`Pick color for ${label}`}
            className="h-9 w-9 shrink-0 rounded-md border border-border ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ backgroundColor: hslDisplay(stored) }}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="start"
            sideOffset={6}
            className="z-50 rounded-lg border border-border bg-popover p-3 shadow-md"
          >
            <HslColorPicker color={parsed} onChange={commitPicker} />
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground">{stored}</p>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <Label className="cursor-default text-sm">{label}</Label>
      <Input
        value={textInput}
        onChange={(e) => commitText(e.target.value)}
        placeholder="H S% L%"
        spellCheck={false}
        className={cn("font-mono text-xs", !parseHslString(textInput) && "border-destructive")}
      />
    </div>
  );
}
