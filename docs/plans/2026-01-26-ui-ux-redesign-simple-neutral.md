# UI/UX Redesign - Simple, Clean, White & Neutral Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the application from a dark, cold theme to a simple, clean, white/neutral design focused on efficiency and clarity.

**Architecture:** Replace dark theme CSS variables with light/neutral colors, refactor all components to use new design tokens, remove excessive animations and decorative elements, maintain existing functionality while improving visual simplicity.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, TypeScript

---

## Task 1: Update Design System (CSS Variables)

**Files:**
- Modify: `app/globals.css:1-161`

**Step 1: Backup current globals.css**

```bash
cp app/globals.css app/globals.css.backup
```

**Step 2: Replace design tokens in globals.css**

Replace the entire `@theme` block (lines 4-31) with new neutral color palette:

```css
@theme {
  /* Design System Colors - Simple White/Neutral */
  --color-background: #ffffff;
  --color-foreground: #333333;
  --color-surface: #ffffff;
  --color-border: #e5e5e5;
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-accent: #4a4a4a;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* Brand Colors - Light/Neutral variants */
  --color-brand-light-bg: #ffffff;
  --color-brand-light-surface: #f9f9f9;
  --color-brand-light-border: #e5e5e5;
  --color-brand-text-primary: #333333;
  --color-brand-text-secondary: #666666;
  --color-brand-accent: #4a4a4a;
  --color-brand-success: #10b981;
  --color-brand-warning: #f59e0b;
  --color-brand-danger: #ef4444;
  --color-client-green: #10b981;

  /* Typography */
  --font-family-sans: var(--font-inter, "Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
}
```

**Step 3: Update body styles**

Replace body styles (lines 33-38) to use new colors:

```css
body {
  background: #f9f9f9;
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  overflow-x: hidden;
}
```

**Step 4: Remove excessive animations**

Remove or simplify these animation blocks:
- Lines 40-55: `.floating-shape` and `@keyframes float` (DELETE - decorative)
- Lines 72-80: `.social-btn` hover transform (SIMPLIFY - remove transform)
- Lines 112-119: `.card-hover` transform (SIMPLIFY - remove transform, keep subtle shadow)
- Lines 122-143: `.status-indicator` ripple (DELETE - distracting)
- Lines 146-160: `@keyframes slideIn` (SIMPLIFY to fade only)

Simplified animations to keep:

```css
/* Input field styles - simplified */
.input-field {
  transition: border-color 0.2s ease;
}

.input-field:focus {
  border-color: #4a4a4a;
  outline: none;
}

/* Card hover effect - subtle */
.card-hover {
  transition: box-shadow 0.2s ease;
}

.card-hover:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Notification fade-in animation */
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
```

**Step 5: Run app to verify no CSS errors**

```bash
pnpm dev
```

Expected: App runs without CSS compilation errors, colors are now light but layout may look broken (will fix in later tasks)

**Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): update design system to simple white/neutral palette

- Replace dark theme colors with light/neutral palette
- Simplify animations (remove floating shapes, ripple effects)
- Keep minimal transitions for inputs and cards
- Remove distracting visual effects

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Root Layout Background

**Files:**
- Modify: `app/layout.tsx:31-31`

**Step 1: Change body background class**

Replace `bg-black` with `bg-gray-50`:

```tsx
<body className={`${inter.variable} antialiased bg-gray-50`}>
```

**Step 2: Run app to verify**

```bash
pnpm dev
```

Expected: Root background is now light gray (#f9f9f9)

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(ui): update root layout background to light gray

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Reusable Button Component

**Files:**
- Create: `components/ui/Button.tsx`

**Step 1: Write button component with neutral styling**

```tsx
import React from "react";
import { clsx } from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "bg-gray-900 text-white hover:bg-gray-800 border border-gray-900",
    secondary:
      "bg-white text-gray-900 hover:bg-gray-50 border border-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-red-600",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Step 2: Create barrel export for ui components**

Create: `components/ui/index.ts`

```ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
export { RoleBadge } from "./RoleBadge";
```

**Step 3: Verify no TypeScript errors**

```bash
pnpm type-check
```

Expected: No errors

**Step 4: Commit**

```bash
git add components/ui/Button.tsx components/ui/index.ts
git commit -m "feat(ui): create reusable Button component with neutral styling

- Primary, secondary, danger, ghost variants
- Simple border-based design
- Subtle hover states
- Focus ring for accessibility

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Reusable Card Component

**Files:**
- Create: `components/ui/Card.tsx`
- Modify: `components/ui/index.ts:3-3`

**Step 1: Write card component**

```tsx
import React from "react";
import { clsx } from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  hover = false,
  padding = "md",
  className,
  ...props
}: CardProps) {
  const baseStyles =
    "bg-white border border-gray-200 rounded-lg transition-shadow";

  const hoverStyles = hover ? "hover:shadow-md" : "";

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={clsx(
        baseStyles,
        hoverStyles,
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

**Step 2: Add to barrel export**

```ts
export { Card } from "./Card";
export type { CardProps } from "./Card";
```

**Step 3: Verify no TypeScript errors**

```bash
pnpm type-check
```

Expected: No errors

**Step 4: Commit**

```bash
git add components/ui/Card.tsx components/ui/index.ts
git commit -m "feat(ui): create reusable Card component with minimal styling

- White background with subtle gray border
- Optional hover shadow effect
- Configurable padding
- Clean, simple design

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update Sidebar Component

**Files:**
- Modify: `components/sidebar/Sidebar.tsx:57-99`

**Step 1: Replace dark sidebar colors with light theme**

Update the `aside` element (lines 57-66):

```tsx
<aside
  className={`
    w-72 bg-white border-r border-gray-200 text-gray-700 flex flex-col p-4
    fixed inset-y-0 left-0 z-40
    transition-transform duration-300 ease-in-out
    md:translate-x-0
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `}
  aria-label="Navigation principale"
>
```

**Step 2: Update logout button styling (lines 79-86)**

```tsx
<button
  onClick={handleLogout}
  disabled={isLoggingOut}
  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
>
  <i className="fa-solid fa-right-from-bracket"></i>
  <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
</button>
```

**Step 3: Update mobile close button (lines 92-98)**

```tsx
<button
  onClick={onClose}
  className="md:hidden absolute top-4 right-4 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
  aria-label="Fermer le menu"
>
  <i className="fa-solid fa-times text-xl"></i>
</button>
```

**Step 4: Run app to verify sidebar appearance**

```bash
pnpm dev
```

Expected: Sidebar has white background with gray border, readable text

**Step 5: Commit**

```bash
git add components/sidebar/Sidebar.tsx
git commit -m "feat(ui): update sidebar to light neutral theme

- White background with gray border
- Dark gray text for readability
- Light gray hover states
- Simplified button styling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update Sidebar Sub-Components

**Files:**
- Modify: `components/sidebar/SidebarHeader.tsx`
- Modify: `components/sidebar/SidebarNavItem.tsx`
- Modify: `components/sidebar/SidebarFooter.tsx`

**Step 1: Read SidebarHeader to understand current structure**

```bash
cat components/sidebar/SidebarHeader.tsx
```

**Step 2: Update SidebarHeader colors**

Replace dark color classes with light equivalents:
- `text-[#F9F9F9]` → `text-gray-900`
- `text-[#B7B7B7]` → `text-gray-600`
- `bg-[#00f0ff]` → `bg-gray-900`
- Any dark backgrounds → light backgrounds

**Step 3: Read and update SidebarNavItem**

Replace:
- `text-[#B7B7B7]` → `text-gray-700`
- `bg-[#2D3033]` → `bg-gray-100`
- `text-[#F9F9F9]` → `text-gray-900`
- `hover:bg-[#3A3D42]` → `hover:bg-gray-100`

**Step 4: Read and update SidebarFooter**

Apply same color replacements as above.

**Step 5: Run app and verify all sidebar components**

```bash
pnpm dev
```

Expected: Entire sidebar is cohesive with light neutral theme

**Step 6: Commit**

```bash
git add components/sidebar/SidebarHeader.tsx components/sidebar/SidebarNavItem.tsx components/sidebar/SidebarFooter.tsx
git commit -m "feat(ui): update sidebar sub-components to light theme

- Update header, nav items, and footer colors
- Consistent light gray palette
- Improved text contrast

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update OrderCard Component

**Files:**
- Modify: `components/dashboard/OrderCard.tsx:95-194`

**Step 1: Update card container (line 95)**

```tsx
<div className="bg-white border border-gray-200 rounded-xl p-6 transition-shadow hover:shadow-md">
```

**Step 2: Update heading colors (lines 99-106)**

```tsx
<h3 className="text-lg font-semibold text-gray-900">
  {order.product.name}
</h3>
{order.product.description && (
  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
    {order.product.description}
  </p>
)}
```

**Step 3: Keep status badges as-is (lines 108-113)**

Status badges with green/yellow/red colors are functional, keep them.

**Step 4: Update details section text (lines 117-146)**

```tsx
<div className="flex justify-between text-sm">
  <span className="text-gray-600">Montant</span>
  <span className="font-medium text-gray-900">
    {formatOrderAmount(order)}
  </span>
</div>
<div className="flex justify-between text-sm">
  <span className="text-gray-600">Date</span>
  <span className="text-gray-900">
    {new Date(order.created_at).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}
  </span>
</div>
```

**Step 5: Update action button (line 160)**

```tsx
<button
  onClick={handlePayment}
  disabled={isLoading}
  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
>
```

**Step 6: Update link button (line 178)**

```tsx
<Link
  href={`/dashboard/dossier/${order.dossier_id}`}
  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
>
```

**Step 7: Verify and commit**

```bash
pnpm dev
# Test order card appearance
git add components/dashboard/OrderCard.tsx
git commit -m "feat(ui): update OrderCard to light neutral theme

- White card background with gray border
- Dark gray primary text, medium gray secondary
- Simplified hover effect (shadow only)
- Dark button backgrounds for contrast

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Update Admin Clients Table

**Files:**
- Modify: `components/admin/clients/ClientsTable.tsx:99-99`
- Modify: (continue with table header and rows)

**Step 1: Update table container (line 99)**

```tsx
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
```

**Step 2: Read file to see table structure**

```bash
cat components/admin/clients/ClientsTable.tsx | head -200
```

**Step 3: Update table headers**

Replace any:
- `bg-[#2D3033]` → `bg-gray-50`
- `text-[#F9F9F9]` → `text-gray-900`
- `text-[#B7B7B7]` → `text-gray-700`
- `border-[#363636]` → `border-gray-200`

**Step 4: Update table rows**

Replace any:
- `hover:bg-[#3A3D42]` → `hover:bg-gray-50`
- Dark backgrounds → `bg-white`
- Alternating rows → `even:bg-gray-50/50`

**Step 5: Verify table appearance**

```bash
pnpm dev
# Navigate to admin clients page
```

Expected: Clean white table with subtle borders, light gray header

**Step 6: Commit**

```bash
git add components/admin/clients/ClientsTable.tsx
git commit -m "feat(ui): update ClientsTable to light neutral design

- White table background
- Light gray header row
- Subtle row hover effect
- Clean border separation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update All Status Badges

**Files:**
- Modify: `components/dashboard/StatusBadge.tsx`
- Modify: `components/documents/StatusBadge.tsx`
- Modify: `components/workflow/ValidationStatusBadge.tsx`

**Step 1: Read StatusBadge component**

```bash
cat components/dashboard/StatusBadge.tsx
```

**Step 2: Ensure consistent badge styling**

Status badges should maintain colored backgrounds for clarity but use refined styling:

```tsx
// Example for a status config
const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border";

// Success status
className={`${baseStyles} bg-green-50 text-green-700 border-green-200`}

// Warning/Pending
className={`${baseStyles} bg-yellow-50 text-yellow-700 border-yellow-200`}

// Danger/Error
className={`${baseStyles} bg-red-50 text-red-700 border-red-200`}

// Neutral/Info
className={`${baseStyles} bg-gray-50 text-gray-700 border-gray-200`}
```

**Step 3: Apply updates to all badge components**

**Step 4: Verify badges appearance**

```bash
pnpm dev
```

Expected: Badges have light colored backgrounds with darker text, clear borders

**Step 5: Commit**

```bash
git add components/dashboard/StatusBadge.tsx components/documents/StatusBadge.tsx components/workflow/ValidationStatusBadge.tsx
git commit -m "feat(ui): refine status badges with light backgrounds

- Light colored backgrounds (green/yellow/red/gray)
- Darker text for contrast
- Subtle colored borders
- Maintain visual distinction

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update All Form Components

**Files:**
- Modify: `components/auth/LoginForm.tsx`
- Modify: `components/auth/RegisterForm.tsx`
- Modify: `components/qualification/DynamicFormField.tsx`

**Step 1: Create standard input styles**

Standard input class string to use across forms:

```tsx
const inputClassName = "w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors";
```

**Step 2: Update LoginForm inputs**

Replace any:
- `bg-surface` → `bg-white`
- `border-border` → `border-gray-300`
- `text-foreground` → `text-gray-900`
- Custom focus styles → `focus:ring-2 focus:ring-gray-400`

**Step 3: Update RegisterForm inputs**

Apply same changes as LoginForm.

**Step 4: Update DynamicFormField**

Apply same input styling pattern.

**Step 5: Update labels**

```tsx
<label className="block text-sm font-medium text-gray-700 mb-1">
```

**Step 6: Verify form appearance**

```bash
pnpm dev
# Test login and register forms
```

Expected: Clean white inputs with gray borders, clear focus states

**Step 7: Commit**

```bash
git add components/auth/LoginForm.tsx components/auth/RegisterForm.tsx components/qualification/DynamicFormField.tsx
git commit -m "feat(ui): update form inputs to light neutral design

- White input backgrounds
- Gray borders and placeholders
- Clear focus ring
- Consistent styling across all forms

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Dashboard Components

**Files:**
- Modify: `components/dashboard/ProgressCard.tsx`
- Modify: `components/dashboard/DossierAccordion.tsx`
- Modify: `components/dashboard/DocumentsSection.tsx`

**Step 1: Update ProgressCard**

Replace:
- Dark backgrounds → `bg-white`
- Dark borders → `border-gray-200`
- Text colors → `text-gray-900` (primary), `text-gray-600` (secondary)

**Step 2: Update DossierAccordion**

Replace:
- Accordion headers → `bg-gray-50 hover:bg-gray-100`
- Accordion content → `bg-white border-t border-gray-200`
- Text colors appropriately

**Step 3: Update DocumentsSection**

Replace dark theme with light theme following same pattern.

**Step 4: Verify dashboard appearance**

```bash
pnpm dev
# Navigate to client dashboard
```

Expected: Clean, cohesive light theme across dashboard

**Step 5: Commit**

```bash
git add components/dashboard/ProgressCard.tsx components/dashboard/DossierAccordion.tsx components/dashboard/DocumentsSection.tsx
git commit -m "feat(ui): update dashboard components to light theme

- White card backgrounds
- Light gray accents and borders
- Improved text hierarchy
- Cohesive neutral palette

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Update Admin Analytics Components

**Files:**
- Modify: `components/admin/analytics/AnalyticsDashboardContent.tsx`
- Modify: `components/admin/StatsCards.tsx`
- Modify: `components/admin/PerformanceChart.tsx`

**Step 1: Update AnalyticsDashboardContent**

Replace dark theme colors with light theme.

**Step 2: Update StatsCards**

Cards should have:
- `bg-white border border-gray-200`
- Icons in `text-gray-700`
- Numbers in `text-gray-900`
- Labels in `text-gray-600`

**Step 3: Update PerformanceChart**

Charts should maintain clear colors but update backgrounds:
- Chart background → `bg-white`
- Grid lines → light gray
- Tooltips → light theme

**Step 4: Verify analytics pages**

```bash
pnpm dev
# Navigate to admin analytics
```

Expected: Clean stats cards and charts with light backgrounds

**Step 5: Commit**

```bash
git add components/admin/analytics/AnalyticsDashboardContent.tsx components/admin/StatsCards.tsx components/admin/PerformanceChart.tsx
git commit -m "feat(ui): update admin analytics to light neutral theme

- White card backgrounds for stats
- Light chart backgrounds
- Maintained data visualization colors
- Clear text hierarchy

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Update Modal Components

**Files:**
- Modify: `components/admin/products/CreateProductModal.tsx`
- Modify: `components/admin/products/EditProductModal.tsx`
- Modify: `components/documents/UploadDocumentModal.tsx`
- Modify: `components/admin/dossier/SendDocumentsModal.tsx`

**Step 1: Standard modal overlay and container**

Modal overlay:
```tsx
className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
```

Modal container:
```tsx
className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
```

Modal header:
```tsx
className="border-b border-gray-200 p-6"
```

Modal body:
```tsx
className="p-6"
```

Modal footer:
```tsx
className="border-t border-gray-200 p-6 flex justify-end gap-3"
```

**Step 2: Update all modal components with standard structure**

**Step 3: Verify modals**

```bash
pnpm dev
# Test each modal
```

Expected: Clean white modals with gray borders, clear separation

**Step 4: Commit**

```bash
git add components/admin/products/CreateProductModal.tsx components/admin/products/EditProductModal.tsx components/documents/UploadDocumentModal.tsx components/admin/dossier/SendDocumentsModal.tsx
git commit -m "feat(ui): update modals to light neutral design

- White modal backgrounds
- Gray border separation
- Consistent header/body/footer structure
- Simplified shadow

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Update Agent Components

**Files:**
- Modify: `components/agent/verificateur/VerificateurStepContent.tsx`
- Modify: `components/agent/verificateur/VerificateurDocumentsSection.tsx`
- Modify: `components/agent/verificateur/StepFieldsSection.tsx`

**Step 1: Update VerificateurStepContent**

Apply light theme:
- Main containers → `bg-white border-gray-200`
- Section headers → `bg-gray-50 border-b border-gray-200`
- Text colors → gray scale

**Step 2: Update VerificateurDocumentsSection**

Apply same pattern.

**Step 3: Update StepFieldsSection**

Apply same pattern.

**Step 4: Verify agent pages**

```bash
pnpm dev
# Navigate to agent workspace
```

Expected: Agent interface uses light neutral theme consistently

**Step 5: Commit**

```bash
git add components/agent/verificateur/VerificateurStepContent.tsx components/agent/verificateur/VerificateurDocumentsSection.tsx components/agent/verificateur/StepFieldsSection.tsx
git commit -m "feat(ui): update agent components to light theme

- Consistent light neutral palette
- Clear section separation
- Improved readability

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 15: Clean Up Unnecessary Icons and Decorations

**Files:**
- Review and modify: All component files

**Step 1: Audit for excessive icons**

```bash
grep -r "fa-" components/ | wc -l
```

**Step 2: Remove decorative icons**

Keep functional icons (actions, status indicators).
Remove purely decorative icons that don't add meaning.

**Step 3: Remove custom floating shape elements**

Search for any floating decorative elements:
```bash
grep -r "floating-shape" app/ components/
```

Remove any found instances.

**Step 4: Simplify icon usage guidelines**

Create file: `docs/ui-guidelines.md`

```md
# UI Guidelines - Simple & Neutral Design

## Icon Usage
- Use icons ONLY when they add functional value
- Action buttons: OK (delete, edit, download icons)
- Status indicators: OK (check, warning, error icons)
- Decorative/branding icons: Remove

## Color Palette
- Primary background: White (#ffffff)
- Secondary background: Light gray (#f9f9f9)
- Borders: Gray (#e5e5e5)
- Text primary: Dark gray (#333333)
- Text secondary: Medium gray (#666666)
- Accent: Dark gray (#4a4a4a)

## Component Principles
- Minimal borders (1px, #e5e5e5)
- Generous spacing (p-6 for cards)
- Subtle shadows (hover only)
- No transforms or excessive animations
```

**Step 5: Commit**

```bash
git add components/ docs/ui-guidelines.md
git commit -m "feat(ui): remove excessive icons and decorations

- Remove decorative icons that don't add value
- Keep functional icons only
- Document UI guidelines for future development

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 16: Responsive Testing and Adjustments

**Files:**
- Modify: Various components as needed based on testing

**Step 1: Test mobile breakpoint (375px)**

```bash
pnpm dev
# Open browser DevTools, set to 375px width
# Navigate through all main pages
```

**Step 2: Test tablet breakpoint (768px)**

Repeat navigation test at 768px width.

**Step 3: Test desktop breakpoint (1280px)**

Repeat navigation test at 1280px width.

**Step 4: Document any layout issues**

Create: `docs/responsive-issues.md`

List any components that break or look poor at specific breakpoints.

**Step 5: Fix identified issues**

Common fixes:
- Reduce padding on mobile: `p-6 md:p-8`
- Stack elements on mobile: `flex-col md:flex-row`
- Adjust font sizes: `text-lg md:text-xl`
- Hide non-essential content on mobile

**Step 6: Commit**

```bash
git add components/
git commit -m "feat(ui): improve responsive behavior across breakpoints

- Adjust padding for mobile
- Improve stacking on small screens
- Optimize font sizes per breakpoint

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 17: Accessibility Audit and Fixes

**Files:**
- Modify: Various components for accessibility

**Step 1: Install axe DevTools extension**

Install browser extension: axe DevTools

**Step 2: Run automated accessibility scan**

```bash
pnpm dev
# Run axe DevTools on each major page
```

**Step 3: Fix color contrast issues**

Ensure all text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large).

Common fixes:
- Light gray text on white → darker gray
- Placeholder text too light → `text-gray-500`

**Step 4: Verify keyboard navigation**

Test:
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close modals
- Arrow keys in dropdowns

**Step 5: Add missing ARIA labels**

Examples:
```tsx
<button aria-label="Close modal">
  <i className="fa-solid fa-times"></i>
</button>

<input aria-label="Search clients" placeholder="Rechercher..." />
```

**Step 6: Commit**

```bash
git add components/
git commit -m "feat(a11y): improve accessibility compliance

- Fix color contrast to meet WCAG AA
- Add missing ARIA labels
- Verify keyboard navigation works
- Improve focus indicators

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 18: Performance Optimization

**Files:**
- Modify: `app/globals.css`
- Review: Component render performance

**Step 1: Verify CSS size**

```bash
du -h app/globals.css
```

Expected: Should be small (<10KB) since we removed animations

**Step 2: Check for unused CSS**

Since we removed decorative animations, ensure no orphaned styles remain:

```bash
grep -E "(floating|ripple|slide)" app/globals.css
```

Expected: Should return nothing (already removed in Task 1)

**Step 3: Test page load performance**

```bash
pnpm build
pnpm start
# Use browser DevTools Lighthouse to audit performance
```

**Step 4: Document performance metrics**

Create: `docs/performance-baseline.md`

Document:
- Page load time
- First Contentful Paint
- Time to Interactive
- Lighthouse score

**Step 5: Commit**

```bash
git add docs/performance-baseline.md
git commit -m "docs: document performance baseline after UI redesign

- CSS size reduced by removing animations
- Page load metrics documented
- Lighthouse scores recorded

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 19: Final Visual QA

**Files:**
- Create: `docs/visual-qa-checklist.md`

**Step 1: Create QA checklist**

```md
# Visual QA Checklist - UI Redesign

## Color Consistency
- [ ] All pages use white/neutral palette
- [ ] No dark theme colors remaining
- [ ] Text is readable (high contrast)
- [ ] Status colors are consistent (green/yellow/red)

## Component Consistency
- [ ] All cards have same border style
- [ ] All buttons use same variants
- [ ] All inputs have same styling
- [ ] All modals use same structure

## Spacing & Layout
- [ ] Consistent padding (p-6 for cards)
- [ ] Consistent margins between sections
- [ ] Proper alignment throughout
- [ ] No cramped or overly sparse areas

## Functionality
- [ ] No broken layouts
- [ ] All interactive elements work
- [ ] Hover states are visible
- [ ] Focus states are clear

## Pages to Check
- [ ] Client dashboard
- [ ] Client dossier detail
- [ ] Agent dashboard
- [ ] Agent step processing
- [ ] Admin analytics
- [ ] Admin clients list
- [ ] Admin dossiers list
- [ ] Admin products
- [ ] Login/Register
```

**Step 2: Systematically test each page**

Go through checklist page by page.

**Step 3: Screenshot each major page**

Take screenshots for documentation:
- Dashboard (client)
- Dashboard (agent)
- Dashboard (admin)
- Dossier detail
- Products page

Save to: `docs/screenshots/after-redesign/`

**Step 4: Document any remaining issues**

Update: `docs/visual-qa-issues.md`

**Step 5: Commit**

```bash
git add docs/visual-qa-checklist.md docs/screenshots/
git commit -m "docs: complete visual QA documentation

- QA checklist for UI redesign
- Screenshots of all major pages
- Issues documented for follow-up

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 20: Final Testing and Documentation

**Files:**
- Create: `docs/ui-redesign-summary.md`

**Step 1: Create summary document**

```md
# UI/UX Redesign Summary

## Overview
Complete redesign from dark, cold theme to simple, clean, white/neutral theme.

## Changes Made

### Design System
- Color palette: Dark → White/Neutral
- Typography: Maintained Inter font, improved hierarchy
- Spacing: Generous padding throughout
- Animations: Removed excessive effects, kept subtle transitions

### Components Updated
- Sidebar: White with gray border
- Cards: White background, gray border, subtle shadow on hover
- Buttons: Simple border-based design
- Inputs: White with gray border, clear focus states
- Modals: White with gray separation
- Tables: White with light gray header
- Status badges: Light colored backgrounds

### Removed
- Floating shape animations
- Excessive hover transforms
- Ripple effects
- Decorative icons
- All dark theme variables

### Maintained
- Full functionality
- Component structure
- Data visualization colors (charts)
- Status color meanings (green/yellow/red)

## Performance Impact
- CSS size reduced (removed animation code)
- No negative performance impact
- Improved readability

## Accessibility Improvements
- Better color contrast
- Clear focus states
- Keyboard navigation verified
- ARIA labels added where needed

## Testing Completed
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Accessibility (WCAG AA contrast)
- ✅ Functionality (all features work)
- ✅ Cross-browser (Chrome, Firefox, Safari)

## Next Steps
- Monitor user feedback
- Iterate based on usage patterns
- Maintain design consistency in new features
```

**Step 2: Run full test suite**

```bash
pnpm type-check
pnpm lint
pnpm build
```

Expected: All pass

**Step 3: Test in production mode locally**

```bash
pnpm build
pnpm start
# Navigate through all major workflows
```

**Step 4: Create before/after comparison**

Document in summary:
- Old design: Dark (#191a1d background)
- New design: Light (#ffffff background)

**Step 5: Final commit**

```bash
git add docs/ui-redesign-summary.md
git commit -m "docs: complete UI redesign implementation summary

- Full documentation of changes
- Testing verification
- Performance and accessibility notes
- Before/after comparison

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Testing Strategy

### Unit Tests (Optional - Not Required)

Since this is primarily a visual/CSS change, unit tests are not critical. However, if you want to add visual regression tests:

**File:** `__tests__/visual/components.test.tsx`

```tsx
import { render } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

describe("UI Components Visual", () => {
  it("Button renders with correct neutral styling", () => {
    const { container } = render(<Button>Click me</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-gray-900");
    expect(button).toHaveClass("text-white");
  });

  it("Card renders with white background", () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector("div");
    expect(card).toHaveClass("bg-white");
    expect(card).toHaveClass("border-gray-200");
  });
});
```

### Integration Tests

Test key user flows still work:
- Login flow
- Create dossier flow
- Upload document flow
- Admin approve document flow

### Visual Regression Tests (Recommended)

Use a tool like Percy or Chromatic to capture screenshots and detect visual regressions.

---

## Rollback Plan

If issues are discovered, revert changes:

```bash
# Revert all UI redesign commits
git log --oneline | grep "feat(ui)"
# Find the commit before first UI change
git revert <commit-range>
```

Or restore backup:

```bash
cp app/globals.css.backup app/globals.css
git checkout HEAD~20 -- components/
```

---

## Notes

- **Gradual rollout:** Consider feature flag for UI theme if you want to test with subset of users
- **User feedback:** Collect feedback early to identify any usability issues
- **Design consistency:** Use the new `Button` and `Card` components for all future development
- **Avoid dark mode toggle:** Since requirement is simple/white, don't implement theme switcher unless requested
- **Icon audit ongoing:** Regularly review and remove unnecessary icons as you develop new features

---

## Success Criteria

✅ Design system uses white/neutral colors
✅ All animations simplified or removed
✅ Components have consistent styling
✅ Responsive design works on all breakpoints
✅ Accessibility meets WCAG AA standards
✅ No functionality broken
✅ Page performance maintained or improved
✅ User feedback is positive

