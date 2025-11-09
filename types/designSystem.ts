// types/designSystem.ts

// Component variant types
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ComponentState = 'default' | 'hover' | 'active' | 'disabled' | 'loading';

// Color types
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'gray';
export type ColorType = 'bg' | 'text' | 'border';

// Layout types
export type FlexDirection = 'row' | 'col';
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch';

// Spacing types
export type SpacingSize = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

// Border radius types
export type BorderRadiusSize = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

// Shadow types
export type ShadowSize = 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';

// Animation types
export type AnimationType = 'fade-in' | 'slide-in' | 'scale-in' | 'bounce';
export type AnimationDuration = 'fast' | 'normal' | 'slow';

// Breakpoint types
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

// Typography types
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';

// Component base props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  size?: ComponentSize;
  variant?: ComponentVariant;
  disabled?: boolean;
}

// Form component props
export interface FormComponentProps extends BaseComponentProps {
  id?: string;
  name?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
}

// Interactive component props
export interface InteractiveComponentProps extends BaseComponentProps {
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Layout component props
export interface LayoutComponentProps extends BaseComponentProps {
  padding?: SpacingSize;
  margin?: SpacingSize;
  gap?: SpacingSize;
}

// Card component types
export interface CardProps extends Omit<LayoutComponentProps, 'variant'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  hover?: boolean;
  onClick?: () => void;
}

// Modal component types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: ComponentSize | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

// Badge component types
export interface BadgeProps extends Omit<BaseComponentProps, 'variant'> {
  variant?: ColorVariant | 'default';
  rounded?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

// Alert component types
export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: boolean;
  className?: string;
}

// Tooltip component types
export interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

// Theme configuration
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    gray: Record<number, string>;
  };
  typography: {
    fontFamily: Record<string, string[]>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
  };
  spacing: Record<number, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  breakpoints: Record<string, string>;
  animations: Record<string, string>;
  zIndex: Record<string, number>;
}

// Responsive value type
export type ResponsiveValue<T> = T | {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
};

// Style utilities type
export interface StyleUtilities {
  cn: (...classes: (string | undefined | null | false)[]) => string;
  responsive: (mobile: string, tablet?: string, desktop?: string, wide?: string) => string;
  getColorClasses: (variant: ColorVariant, type?: ColorType) => string;
  getSizeClasses: (size: ComponentSize, component?: 'button' | 'input' | 'card' | 'text') => string;
  getFocusRing: (color?: string) => string;
  getTransition: (properties?: string[], duration?: AnimationDuration) => string;
  getShadow: (size?: ShadowSize, hover?: boolean) => string;
  getBorderRadius: (size?: BorderRadiusSize) => string;
  getAnimation: (type?: AnimationType, duration?: AnimationDuration) => string;
  getGridClasses: (mobile?: number, tablet?: number, desktop?: number, wide?: number) => string;
  getFlexClasses: (direction?: FlexDirection, justify?: FlexJustify, align?: FlexAlign, wrap?: boolean) => string;
}