/**
 * Barrel export for UI primitives. Components are React 18+ islands;
 * they can be imported from `@/components/ui` inside `.astro` files
 * (with a `client:*` directive) or used directly in `.tsx` islands.
 */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardBodyProps,
  type CardFooterProps,
} from './Card';
export { Badge, type BadgeProps, type BadgeVariant } from './Badge';
export { Tag, type TagProps } from './Tag';
export { Input, Textarea, type InputProps, type TextareaProps } from './Input';
export { Select, type SelectProps, type SelectOption } from './Select';
export { Tabs, type TabsProps, type TabItem } from './Tabs';
export { Dialog, type DialogProps } from './Dialog';
export { Tooltip, type TooltipProps } from './Tooltip';
export { Skeleton, type SkeletonProps } from './Skeleton';
