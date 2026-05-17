"use client";

import {
  LayoutDashboard, BarChart3, FileText, LayoutPanelTop, Boxes, Newspaper,
  Quote, BookOpen, Globe2, Inbox, ListChecks, Search, ShieldAlert, Menu,
  PanelBottom, Image, Settings, Palette, Users, ShieldCheck, Filter,
  MousePointerClick, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, BarChart3, FileText, LayoutPanelTop, Boxes, Newspaper,
  Quote, BookOpen, Globe2, Inbox, ListChecks, Search, ShieldAlert, Menu,
  PanelBottom, Image, Settings, Palette, Users, ShieldCheck, Filter,
  MousePointerClick,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const I = ICONS[name] ?? LayoutDashboard;
  return <I className={className} aria-hidden />;
}
