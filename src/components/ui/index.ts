/**
 * Design system barrel — single entry point for all UI primitives.
 *
 * Prefer:    import { Button, Card, Drawer } from "@/components/ui";
 * Over:      import { Button } from "@/components/ui/atoms/button";
 *
 * Both work, but the barrel keeps consumer imports stable if a primitive
 * moves between atomic tiers in the future.
 */

// ── Atoms ───────────────────────────────────────────────────────────────────
export { Button, buttonVariants, type ButtonProps } from "./atoms/button";
export { Input, inputVariants, type InputProps } from "./atoms/input";
export { Label } from "./atoms/label";
export { Textarea, textareaVariants, type TextareaProps } from "./atoms/textarea";
export { Switch } from "./atoms/switch";
export { Skeleton, skeletonVariants, type SkeletonProps } from "./atoms/skeleton";
export { Badge, badgeVariants, type BadgeProps } from "./atoms/badge";
export { Heading, headingVariants, type HeadingProps } from "./atoms/heading";
export { Text, textVariants, type TextProps } from "./atoms/text";
export { Spinner, spinnerVariants, type SpinnerProps } from "./atoms/spinner";

// ── Molecules ───────────────────────────────────────────────────────────────
export { Field } from "./molecules/field";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
} from "./molecules/card";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "./molecules/select";

// ── Layout (design-system tier) ─────────────────────────────────────────────
//
//  Source files live in `components/layout/` because they're also used by
//  the public site's chrome (Navbar/Footer). Re-exporting them here makes
//  them part of the design-system surface — consumers don't need to know
//  about the layout/ directory.
export { Container, containerVariants, type ContainerProps } from "../layout/container";
export { SectionWrapper, sectionVariants, type SectionWrapperProps } from "../layout/section-wrapper";

// ── Organisms ───────────────────────────────────────────────────────────────
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./organisms/dialog";
export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  type DrawerContentProps,
} from "./organisms/drawer";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
} from "./organisms/dropdown-menu";
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
} from "./organisms/tabs";
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./organisms/accordion";
