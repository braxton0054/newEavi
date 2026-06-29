# EAVI College — Admin UI Consistency

## Purpose

Single source of truth for all admin dashboard UI across EAVI College.  
Every admin-facing page (super admin, campus admin, settings) must use these exact tokens.

---

## 1. Color Palette

| Token | Tailwind | Hex | Usage |
|-------|----------|-----|-------|
| Page background | `bg-zinc-50` | `#fafafa` | Every admin page |
| Card background | `bg-white` | `#ffffff` | Stats, cards, sections |
| Card border | `border-zinc-200` | `#e4e4e7` | All card/panel edges |
| Primary text | `text-zinc-900` | `#18181b` | Titles, names, values |
| Subtitle text | `text-zinc-400` | `#a1a1aa` | Small labels, secondary info |
| Detail text | `text-zinc-500` | `#71717a` | Body text, descriptions |
| **Primary accent** | **`blue-700`** | **`#2563eb`** | Buttons, active states, links |
| Primary hover | `bg-blue-800` | `#1d4ed8` | Button hover state |
| Primary light | `bg-blue-50` | `#eff6ff` | Avatar backgrounds, active nav |
| Primary light text | `text-blue-700` | `#2563eb` | Icon containers, active nav text |
| Success | `green-700` | `#15803d` | Approved status, positive |
| Success light | `bg-green-50` | `#f0fdf4` | Approved badge bg |
| Warning | `amber-700` | `#a16207` | Pending status, awaiting |
| Warning light | `bg-amber-50` | `#fffbeb` | Pending badge bg |
| Danger | `red-700` | `#b91c1c` | Rejected status, destructive |
| Danger light | `bg-red-50` | `#fef2f2` | Rejected badge bg |
| Divider / subtle | `border-zinc-200` | `#e4e4e7` | All borders, dividers, hr |
| Muted icon | `text-zinc-300` | `#d4d4d8` | Empty state icons |
| Button bg | `bg-zinc-100` | `#f4f4f5` | Secondary/cancel buttons |

**Never use:**
- `gray-*` — everything must be `zinc-*`
- Custom hex colors (`#0066ff`, `#eee`, etc.) — use exact Tailwind tokens
- `shadow-*` on cards — use borders only (`border border-zinc-200`)

---

## 2. Typography

| Element | Classes | Notes |
|---------|---------|-------|
| Page / section title | `text-base font-medium text-zinc-900` | h1 |
| Header subtitle | `text-xs text-zinc-400` | Below page title |
| Stat count value | `text-2xl font-medium text-zinc-900` | Large number |
| Stat label | `text-[11px] font-medium text-zinc-400` | Above stat count |
| Stat footnote | `text-[11px] text-zinc-400` | Below stat count |
| Card title (name) | `text-sm font-medium text-zinc-900` | Student/course name |
| Card detail row | `text-xs text-zinc-500` | Subtitle info |
| Card metadata | `text-xs text-zinc-400` | Secondary metadata |
| Form label | `text-[11px] font-medium text-zinc-500` | Above form inputs |
| Result count | `text-[11px] text-zinc-400` | "25 students" next to search |
| Modal title | `text-sm font-medium text-zinc-900` | Modal heading |
| Action button | `text-[11px] font-medium` | Small approve/reject |
| Primary button | `text-sm font-medium` | Save/Submit |
| Badge text | `text-[11px] font-medium` | Status badge |
| Sidebar brand | `text-sm font-medium text-zinc-900` | Campus name |
| Sidebar email | `text-[11px] text-zinc-400` | User email |
| Sidebar nav link | `text-sm` | Navigation items |

**Sentence case everywhere.**
- Correct: "Save changes", "Search students", "Approve application"
- Wrong: "Save Changes", "SEARCH STUDENTS", "Approve Application"

**Font weight: `font-medium` (500) for all text.**
- Never `font-bold` (700) or `font-semibold` (600).
- Exception: SVG icons have no text weight.

**Letter spacing: normal.** No `tracking-wide` or `tracking-tight`.

---

## 3. Layout & Spacing

### Page Structure

```
┌─────────────────────────────────────────────┐
│  Sidebar (fixed)  │  Header (sticky, z-30)   │
│                   ├─────────────────────────┤
│  w-48             │  Main content area       │
│  bg-white         │  px-6 lg:px-8 py-5       │
│  border-r         │                          │
│  border-zinc-200  │                          │
└─────────────────────────────────────────────┘
```

### Spacing Values

| Element | Classes |
|---------|---------|
| Page wrapper | `min-h-screen bg-zinc-50 flex` |
| Sidebar width | `w-48` (192px) |
| Main content flex | `flex-1 min-w-0` (prevents overflow) |
| Header bar | `bg-white border-b border-zinc-200 px-6 lg:px-8 py-3.5 sticky top-0 z-30` |
| Header inner | `flex items-center justify-between` |
| Content area | `px-6 lg:px-8 py-5` |
| Between sections | `mb-4` or `mb-5` |
| Stats grid | `grid grid-cols-2 lg:grid-cols-4 gap-3` |
| Cards spacing | `space-y-2` or `gap-2` |
| Card padding | `p-4` |
| Card border | `border border-zinc-200 rounded-xl` |
| Divider (inside card) | `border-t border-zinc-200 my-3` |
| Empty state | `bg-white border border-zinc-200 rounded-xl p-12 text-center` |
| Form grid | `grid grid-cols-1 sm:grid-cols-2 gap-3` |
| Form 3-col grid | `grid grid-cols-1 sm:grid-cols-3 gap-3` |
| Action row gap | `gap-2` (between adjacent buttons) |
| Left offset for sidebar | `lg:pl-0 pl-10` (on header text) |

### Admin Dashboard (3 stats)
- `grid grid-cols-3 gap-3 mb-5`

### Super Admin Dashboard (4 stats)
- `grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5`

### Sidebar
- Mobile: fixed off-screen, toggle via hamburger button
- Desktop: `fixed` → `lg:static`, `-translate-x-full` → `lg:translate-x-0`
- Background: `bg-white border-r border-zinc-200`
- Width: `w-48`
- Brand: `px-4 py-4 border-b border-zinc-200`
- Logo: `w-8 h-8 rounded-lg bg-blue-700` with `text-white font-medium text-xs`
- Nav: `flex-1 px-3 py-3 space-y-0.5`
- Nav item active: `bg-blue-50 text-blue-700 font-medium rounded-lg`
- Nav item inactive: `text-zinc-500 hover:bg-zinc-100 rounded-lg`
- Nav icon: `w-4 h-4 flex-shrink-0`
- Bottom (sign out): `px-3 py-3 border-t border-zinc-200`, `text-red-500 hover:bg-red-50`
- Mobile hamburger: `fixed top-4 left-4 z-40 lg:hidden bg-white rounded-lg border border-zinc-200 p-2`
- Overlay: `fixed inset-0 bg-black/40 z-40 lg:hidden`

---

## 4. Component Patterns

### 4.1 Status Badges

Bordered style — transparent background, tinted text, tinted border:

```
bg-{tint}-50 text-{color}-700 border border-{color}-200 rounded-full text-[11px] font-medium px-2.5 py-0.5
```

| Status | Classes |
|--------|---------|
| Approved | `bg-green-50 text-green-700 border border-green-200 rounded-full text-[11px] font-medium px-2.5 py-0.5` |
| Pending | `bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-medium px-2.5 py-0.5` |
| Rejected | `bg-red-50 text-red-700 border border-red-200 rounded-full text-[11px] font-medium px-2.5 py-0.5` |

In JSX use a ternary rendering the three variants — never a single dynamic class builder.

### 4.2 Student Avatar

Solid blue-50 background, initials, no image:

```jsx
<div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-medium shrink-0">
  {student.firstName[0]}{student.lastName[0]}
</div>
```

### 4.3 Search Bar

Magnifying glass SVG icon embedded inside the input container. Dynamic result count label on the right:

```jsx
<div className="flex items-center gap-2 mb-4">
  <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-400 w-full sm:w-56">
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      type="text"
      placeholder="Search students..."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      className="bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none w-full"
    />
  </div>
  <span className="text-[11px] text-zinc-400 whitespace-nowrap">
    {filtered.length} student{filtered.length !== 1 ? "s" : ""}
  </span>
</div>
```

### 4.4 Filter Pills

Pill-style toggle filters used on the super admin dashboard for campus filter:

| State | Classes |
|-------|---------|
| Active | `px-3.5 py-1 rounded-full bg-blue-700 text-white text-xs font-medium border border-blue-700` |
| Inactive | `px-3.5 py-1 rounded-full bg-white text-zinc-500 text-xs font-medium border border-zinc-200 hover:border-zinc-400 transition-colors` |

### 4.5 Stat Cards

```jsx
<div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-medium text-zinc-400">Total</span>
    <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
      <svg className="w-3.5 h-3.5" ... />
    </div>
  </div>
  <p className="text-2xl font-medium text-zinc-900">{totalStudents}</p>
  <p className="text-[11px] text-zinc-400">all students</p>
</div>
```

Stat card icon containers by type:

| Stat | Icon container classes |
|------|----------------------|
| Total | `w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center` |
| Approved | `w-7 h-7 rounded-md bg-green-50 text-green-700 flex items-center justify-center` |
| Pending | `w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center` |
| West campus | `w-7 h-7 rounded-md bg-violet-50 text-violet-700 flex items-center justify-center` |

### 4.6 Action Buttons

| Action | Classes |
|--------|---------|
| Primary (blue save) | `flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50` |
| Secondary (cancel) | `px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 transition-colors` |
| Approve (review) | `px-3 py-1.5 text-[11px] font-medium rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors` |
| Reject (review) | `px-3 py-1.5 text-[11px] font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors` |
| Admission letter | `flex items-center gap-1.5 border border-blue-700 text-blue-700 text-xs font-medium rounded-lg px-3.5 py-1.5 hover:bg-blue-50 transition-colors` |
| Upload PDF | `inline-block cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors` |

**Rules:**
- Approve/reject/admission letter buttons are bordered with transparent backgrounds (not solid)
- Primary save is solid blue-700
- All buttons use `transition-colors` (not `transition-all`)
- No `shadow-*` classes on any button
- `font-medium` always — never bold or semibold

### 4.7 Icon Buttons

```jsx
<button
  className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors"
  title="Edit"
>
  <svg className="w-3.5 h-3.5" ... />
</button>
```

Pattern: `w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors`

### 4.8 Input Fields / Selects

```jsx
<input className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
<label className="block text-[11px] font-medium text-zinc-500 mb-1">First name</label>
<select className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700">
  <option value="">Select</option>
</select>
```

**Rules:**
- Every input has a label above it (`mb-1`)
- Focus ring: `focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700`
- All inputs and selects share identical border/ring classes
- Placeholder text: `text-zinc-400`

### 4.9 Loading State

```jsx
<div className="min-h-screen flex items-center justify-center bg-zinc-50">
  <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
</div>
```

### 4.10 Empty State

```jsx
<div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
  <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" ... />
  <p className="text-sm text-zinc-500">No students found</p>
</div>
```

### 4.11 Message / Toast Banner

Used on settings pages for success/error feedback:

| Type | Classes |
|------|---------|
| Success | `p-4 rounded-lg mb-6 bg-green-50 text-green-700 border border-green-200` |
| Error | `p-4 rounded-lg mb-6 bg-red-50 text-red-700 border border-red-200` |

### 4.12 Settings Card

```jsx
<div className="bg-white border border-zinc-200 rounded-xl p-5 mb-5">
  <h2 className="text-base font-medium text-zinc-900 mb-2">Email settings</h2>
  <p className="text-sm text-zinc-500 mb-4">Configure SMTP for sending notifications.</p>
  <div className="space-y-3">
    {/* form fields */}
  </div>
  <button onClick={...}>Save</button>
</div>
```

Settings layout: `max-w-3xl` for the page, card `p-5` with `space-y-3` between fields.

---

## 5. Page-Specific Layouts

### 5.1 Admin Dashboard (`/admin`)
- Stats grid: `grid grid-cols-3 gap-3 mb-5` (3 cards: Total / Approved / Pending)
- Search: at top of student list, `mb-4`
- Student card: `p-4` with header row (avatar + name/details on left, badge+buttons on right)
- Application sub-card: `ml-[52px]`, `border-t border-zinc-200 my-3` divider

### 5.2 Super Admin Dashboard (`/super-admin`)
- Stats grid: `grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5` (4 cards: Total / Approved / Pending / West)
- Filter pills: above search, `gap-2` horizontal
- Search + filters row: `flex flex-col sm:flex-row sm:items-center gap-3 mb-4`
- Same student card pattern as admin dashboard

### 5.3 Settings (`/admin/settings` or `/super-admin/settings`)
- Layout: sidebar with sub-navigation inside settings area
- Each section in a `bg-white border border-zinc-200 rounded-xl p-5` card
- Cards stacked with `space-y-5` or `mb-5`
- Message banner above cards, `mb-6`
- Fields in `space-y-3` inside card
- Toggle switches: `w-9 h-5 rounded-full` with `bg-blue-700` for on state

### 5.4 Admission PDF (`/super-admin/settings/admission-pdf`)
- `px-6 py-6 max-w-3xl`
- Card with `p-5`
- Status indicator: `w-3 h-3 rounded-full bg-green-500` + `text-sm font-medium text-green-700`

---

## 6. SVG Icon Conventions

- Size: `w-4 h-4` (sidebar nav), `w-3.5 h-3.5` (search, icon buttons, stat card icons)
- Stroke width: `strokeWidth={1.5}` or `strokeWidth={1.8}` (sidebar: 1.8, elsewhere: 1.5 or 2)
- Standard SVG: `fill="none" stroke="currentColor" viewBox="0 0 24 24"`
- Inside icon buttons: `w-3.5 h-3.5` size
- Inside stat card icon containers: `w-3.5 h-3.5` size
- Empty state icons: `w-10 h-10 text-zinc-300` with `mx-auto mb-3`

---

## 7. Sidebar Patterns

### Admin sidebar (2 links)
1. Dashboard (`/admin`) — house icon
2. Settings (`/admin/settings`) — cog icon

### Super Admin sidebar (3 links)
1. Dashboard (`/super-admin`) — house icon
2. Courses (`/super-admin/courses`) — book icon
3. Settings (`/super-admin/settings`) — cog icon

### Navigation active state
```jsx
isActive
  ? "bg-blue-50 text-blue-700 font-medium"
  : "text-zinc-500 hover:bg-zinc-100"
```

### Brand area
```jsx
<div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
  <span className="text-white font-medium text-xs">EAVI</span>
</div>
```

---

## 8. Mobile Responsiveness

| Pattern | Implementation |
|---------|---------------|
| Sidebar | Hamburger on mobile (`lg:hidden`), fixed overlay, slide-in animation. Desktop: `lg:static lg:translate-x-0`. |
| Sidebar overlay backdrop | `fixed inset-0 bg-black/40 z-40 lg:hidden` |
| Stats grid | Admin: `grid-cols-3` (always 3). Super admin: `grid-cols-2 lg:grid-cols-4`. |
| Filter + search row | `flex flex-col sm:flex-row sm:items-center gap-3`. Search pushes right on desktop via `sm:ml-auto`. |
| Form field grids | `grid grid-cols-1 sm:grid-cols-2 gap-3` (or `sm:grid-cols-3` for 3-col). Single column on mobile. |
| Header text left offset | `lg:pl-0 pl-10` — accounts for hamburger spacing on mobile |
| Card action buttons | `gap-1.5` — tight spacing on mobile |
| Tables (settings rows) | Stack vertically on mobile, horizontal on desktop |

---

## 9. Consistency Rules

### When building ANY new admin page:
1. Start with the wrapper: `min-h-screen bg-zinc-50 flex`
2. Include `AdminSidebar` with correct role
3. Main content: `flex-1 min-w-0`
4. Sticky header: `bg-white border-b border-zinc-200 px-6 lg:px-8 py-3.5 sticky top-0 z-30`
5. Content padding: `px-6 lg:px-8 py-5`

### Do NOT use:
- `font-bold` or `font-semibold` on any UI text
- `gray-*` colors (use `zinc-*`)
- Custom hex color values (use Tailwind tokens)
- `uppercase` or `tracking-wide` on labels
- `shadow-*` on cards or buttons
- `bg-gray-50` as page background (must be `bg-zinc-50`)
- Inline styles for layout/color

### Cross-page parity checks:
- When modifying **super admin dashboard**, check **campus admin dashboard** uses the same token values
- When modifying **super admin settings**, check **campus admin settings** mirrors the same patterns
- Any new stat card must use the standard `p-4 flex flex-col gap-2` pattern
- Any new action button must use the standard size/spacing (not arbitrary px values)
- All status badges must use the three defined variants — never invent new badge styles

### HTML patterns to always follow:

**Student card header:**
```jsx
<div className="flex items-start justify-between">
  <div className="flex items-start gap-3">
    {/* avatar */}
    {/* name + details */}
  </div>
  <div className="flex items-center gap-1.5">
    {/* badge */}
    {/* action buttons */}
  </div>
</div>
```

**Application sub-card (under student card):**
```jsx
<div className="mt-3 ml-[52px]">
  <div className="border-t border-zinc-200 my-3"></div>
  <div className="flex items-center justify-between">
    {/* course info */}
    {/* action buttons */}
  </div>
</div>
```

---

## 10. Reference: Component → Token Map

| Component | bg | border | text | text size | weight |
|-----------|----|--------|------|-----------|--------|
| Page body | `zinc-50` | — | — | — | — |
| Header bar | `white` | `zinc-200` (bottom) | `zinc-900` title | `text-base` | `font-medium` |
| Stat card | `white` | `zinc-200` | `zinc-900` count | `text-2xl` | `font-medium` |
| Stat label | — | — | `zinc-400` | `text-[11px]` | `font-medium` |
| Student card | `white` | `zinc-200` | `zinc-900` name | `text-sm` | `font-medium` |
| Detail row | — | — | `zinc-500` | `text-xs` | normal |
| Badge (approved) | `green-50` | `green-200` | `green-700` | `text-[11px]` | `font-medium` |
| Badge (pending) | `amber-50` | `amber-200` | `amber-700` | `text-[11px]` | `font-medium` |
| Badge (rejected) | `red-50` | `red-200` | `red-700` | `text-[11px]` | `font-medium` |
| Avatar | `blue-50` | — | `blue-700` | `text-sm` | `font-medium` |
| Input | `white` | `zinc-200` | `zinc-900` | `text-sm` | normal |
| Input label | — | — | `zinc-500` | `text-[11px]` | `font-medium` |
| Primary button | `blue-700` | — | `white` | `text-sm` | `font-medium` |
| Secondary button | `zinc-100` | — | `zinc-700` | `text-sm` | `font-medium` |
| Approve button | `green-50` | `green-200` | `green-700` | `text-[11px]` | `font-medium` |
| Reject button | `red-50` | `red-200` | `red-700` | `text-[11px]` | `font-medium` |
| Admission link | transparent | `blue-700` | `blue-700` | `text-xs` | `font-medium` |
| Icon button | `zinc-50` | `zinc-200` | `zinc-500` | — | — |
| Empty state | `white` | `zinc-200` | `zinc-500` | `text-sm` | normal |
| Search input | `white` | `zinc-200` | `zinc-900` | `text-sm` | normal |
| Active filter pill | `blue-700` | `blue-700` | `white` | `text-xs` | `font-medium` |
| Inactive filter pill | `white` | `zinc-200` | `zinc-500` | `text-xs` | `font-medium` |
| Sidebar active nav | `blue-50` | — | `blue-700` | `text-sm` | `font-medium` |
| Sidebar inactive nav | transparent | — | `zinc-500` | `text-sm` | normal |
| Success message | `green-50` | `green-200` | `green-700` | `text-sm` | normal |
| Error message | `red-50` | `red-200` | `red-700` | `text-sm` | normal |
| Loading spinner | — | `border-blue-700` | — | — | — |
