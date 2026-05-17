/**
 * Admin sidebar navigation config. Adding a new module = append an item here.
 * `permission` is checked server-side via `hasPermission()` before rendering.
 */
import type { Permission } from "@/server/auth/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission?: Permission;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/admin/analytics", label: "Analytics", icon: "BarChart3", permission: "analytics.read" },
      { href: "/admin/analytics/funnels", label: "Funnels", icon: "Filter", permission: "analytics.read" },
      { href: "/admin/analytics/seo", label: "SEO performance", icon: "Search", permission: "analytics.read" },
      { href: "/admin/analytics/ctas", label: "CTA clicks", icon: "MousePointerClick", permission: "analytics.read" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/pages", label: "Pages", icon: "FileText", permission: "pages.read" },
      { href: "/admin/sections", label: "Sections", icon: "LayoutPanelTop", permission: "pages.read" },
      { href: "/admin/components", label: "Components", icon: "Boxes", permission: "components.read" },
      { href: "/admin/blog", label: "Blog", icon: "Newspaper", permission: "blog.read" },
      { href: "/admin/testimonials", label: "Testimonials", icon: "Quote", permission: "testimonials.read" },
      { href: "/admin/resources", label: "Resources", icon: "BookOpen", permission: "resources.read" },
      { href: "/admin/countries", label: "Countries", icon: "Globe2", permission: "countries.read" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/leads", label: "Leads", icon: "Inbox", permission: "leads.read" },
      { href: "/admin/forms", label: "Forms", icon: "ListChecks", permission: "forms.read" },
      { href: "/admin/seo", label: "SEO", icon: "Search", permission: "seo.read" },
      { href: "/admin/visa-risk", label: "Visa risk", icon: "ShieldAlert", permission: "visa-risk.read" },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/nav", label: "Navigation", icon: "Menu", permission: "nav.read" },
      { href: "/admin/footer", label: "Footer", icon: "PanelBottom", permission: "footer.read" },
      { href: "/admin/media", label: "Media", icon: "Image", permission: "media.read" },
      { href: "/admin/settings", label: "Settings", icon: "Settings", permission: "settings.read" },
      { href: "/admin/settings/theme", label: "Theme", icon: "Palette", permission: "settings.read" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: "Users", permission: "users.read" },
      { href: "/admin/roles", label: "Roles & permissions", icon: "ShieldCheck", permission: "users.read" },
    ],
  },
];
