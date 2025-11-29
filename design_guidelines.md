# Design Guidelines: Local Competitor Analyzer

## Design Approach
**System-Based Approach**: Drawing from Linear's clean productivity aesthetic and Material Design's data presentation principles. This is a functional business tool prioritizing clarity, efficiency, and professional presentation of analytical data.

## Typography
- **Primary Font**: Inter or Work Sans via Google Fonts
- **Heading Scale**: 
  - H1: text-3xl font-bold (Dashboard title, Report headers)
  - H2: text-xl font-semibold (Section titles)
  - H3: text-lg font-medium (Card headers, Form labels)
  - Body: text-base (Forms, lists, content)
  - Small: text-sm text-gray-600 (Metadata, hints)

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, and 12
- Component padding: p-6
- Section gaps: gap-8
- Inner element spacing: space-y-4
- Card margins: m-4 or m-6
- Tight spacing: gap-2 for grouped elements

**Container Strategy**:
- Main dashboard: max-w-7xl mx-auto px-6
- Forms: max-w-2xl
- Report view: max-w-5xl

## Core Layout Structure

### Dashboard Layout
Single-page application with left-aligned navigation or top navbar:
- **Header**: Company name/logo, navigation links (Dashboard, Reports History), user info
- **Main Content Area**: Two-column grid on desktop (lg:grid-cols-2)
  - Left column: Business Registration Form
  - Right column: Business List
- Mobile: Stack to single column

### Business Registration Form
- Card-based container with subtle border and shadow
- Form fields stacked vertically with consistent spacing (space-y-4)
- Input groups: Label above input, helper text below
- Clear visual hierarchy between field groups
- Primary action button: Full-width on mobile, auto-width on desktop, positioned at form bottom

### Business List
- Card-based list items with hover states
- Each business card displays:
  - Business name (bold, larger)
  - Type and location details (smaller, muted)
  - Action button: "Generate Report" (secondary button style)
- Empty state: Centered illustration placeholder with helpful text
- Loading state: Skeleton cards matching final layout

### Report View
- Full-width overlay or dedicated page
- Header with business name and back navigation
- Content sections:
  - Executive summary card
  - Competitor data table with alternating row backgrounds
  - AI analysis section with distinct background
- Export/download button prominently placed

## Component Library

### Forms
- **Text Inputs**: 
  - Border: border border-gray-300
  - Focus: ring-2 ring-blue-500
  - Padding: px-4 py-2
  - Rounded: rounded-lg
- **Labels**: font-medium text-sm mb-2
- **Helper Text**: text-sm text-gray-500 mt-1

### Buttons
- **Primary**: Solid background, medium weight text, px-6 py-2, rounded-lg
- **Secondary**: Border style, same padding/rounding
- Icon + text combinations where appropriate

### Cards
- Border: border border-gray-200
- Shadow: shadow-sm hover:shadow-md transition
- Padding: p-6
- Rounded: rounded-xl
- Background: bg-white

### Data Display
- **Tables**: Clean borders, header with bold text, alternating row backgrounds
- **Lists**: Divided list items with consistent spacing, hover states
- **Stats/Metrics**: Grid of stat cards showing key numbers

### Navigation
- **Navbar**: Sticky top, border-bottom, subtle background
- **Tabs** (if needed): Underline style for active state

## Interactions & States
- **Hover**: Subtle shadow increase on cards, background change on buttons
- **Loading**: Spinner or skeleton screens matching content layout
- **Empty States**: Illustration + helpful message + primary CTA
- **Error States**: Red accent color, clear messaging, retry options
- **Success Feedback**: Toast notifications or inline success messages

## Responsive Behavior
- **Desktop (lg+)**: Two-column dashboard layout, side-by-side form and list
- **Tablet (md)**: Single column with full-width components
- **Mobile**: Stack all elements, full-width inputs and buttons, comfortable touch targets (min 44px height)

## Data Presentation Priority
Since this is an analytical tool, emphasize:
- Clear data hierarchy in reports
- Scannable business lists
- Readable forms with good contrast
- Professional presentation suitable for business use
- Print-friendly report layouts

## Images
**No hero images required** - this is a functional dashboard tool, not a marketing page. Focus on clean UI, clear data presentation, and efficient workflows.