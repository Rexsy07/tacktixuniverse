# Layout Shift Prevention Guide

This document explains the layout shift prevention system implemented in TacktixEdge to create a smooth, stable user experience without content jumping as pages update.

## Problem Solved

Cumulative Layout Shift (CLS) issues were occurring due to:
- Dynamic content loading without reserved space
- Header elements changing size based on authentication state
- Lists and grids loading without consistent dimensions
- Abrupt content transitions causing visual jarring

## Solution Components

### 1. Skeleton Loading Components (`src/components/ui/loading-skeletons.tsx`)

Provides skeleton placeholders that match the exact dimensions of loaded content:

- `MatchCardSkeleton` - For match cards (280px fixed height)
- `LeaderboardRowSkeleton` - For leaderboard rows (88px fixed height)  
- `HeaderSkeletons` - For header user actions
- `LiveMatchFeedSkeleton` - For entire live match section
- `LeaderboardSectionSkeleton` - For entire leaderboard section
- `ContentSkeleton` - Generic skeleton wrapper

### 2. CSS Layout Stability (`src/index.css`)

Added CSS classes for consistent dimensions and smooth transitions:

```css
/* Fixed dimensions for common elements */
.header-actions { min-width: 200px; }
.wallet-display { width: 120px; height: 32px; }
.notification-button { width: 36px; height: 36px; }
.match-card-slot { height: 280px; min-height: 280px; }
.leaderboard-row { height: 88px; min-height: 88px; }

/* Smooth content transitions */
.content-transition { transition: opacity 0.3s ease, transform 0.3s ease; }
.content-transition.loading { opacity: 0.7; transform: translateY(2px); }

/* Layout shift prevention */
.prevent-layout-shift { min-height: 1px; contain: layout style; }
.content-container { min-height: var(--content-min-height, 200px); }
```

### 3. LayoutShiftPrevent Component (`src/components/LayoutShiftPrevent.tsx`)

A reusable wrapper component that prevents layout shifts:

```tsx
import { LayoutShiftPrevent } from '@/components/LayoutShiftPrevent';

<LayoutShiftPrevent 
  isLoading={loading}
  minHeight="200px"
  fallback={<CustomSkeleton />}
>
  <YourContent />
</LayoutShiftPrevent>
```

## Usage Examples

### Basic Skeleton Usage

```tsx
// In LiveMatchFeed.tsx
{loading ? (
  [...Array(3)].map((_, i) => (
    <MatchCardSkeleton key={`skeleton-${i}`} />
  ))
) : (
  matches.map(match => <MatchCard key={match.id} match={match} />)
)}
```

### Header Layout Stability

```tsx
// Fixed dimensions for header elements
<div className="header-actions">
  <div className="wallet-display">
    {profileLoading ? '₦—' : `₦${balance.toLocaleString()}`}
  </div>
  <Button className="notification-button">
    <Bell className="h-4 w-4" />
  </Button>
</div>
```

### Container with Reserved Space

```tsx
// Using CSS custom properties for min-height
<div 
  className="content-transition"
  style={{"--content-min-height": "400px"} as React.CSSProperties}
>
  {content}
</div>
```

### Smooth Animations

```tsx
// Staggered list item animations
{items.map((item, index) => (
  <div key={item.id} className="stagger-item">
    {item.content}
  </div>
))}
```

## Implementation Strategy

### 1. Fixed Dimensions
- All dynamic UI elements have consistent, fixed dimensions
- Skeleton components match exact dimensions of real content
- Grid layouts use fixed heights to prevent jumping

### 2. Reserved Space
- Minimum heights set on containers before content loads
- CSS custom properties allow flexible height management
- Fallback dimensions for different screen sizes

### 3. Smooth Transitions  
- Content opacity and transform transitions during loading
- Staggered animations for list items
- Respects `prefers-reduced-motion` for accessibility

### 4. Performance Optimizations
- CSS `contain: layout style` prevents layout recalculation
- Shorter transition durations on mobile devices
- Skeleton components use pure CSS animations

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Graceful degradation for older browsers
- Respects accessibility preferences (reduced motion)

## Accessibility Features

- `prefers-reduced-motion` media query support
- Semantic skeleton structure maintained
- Screen reader friendly loading states
- Keyboard navigation preserved during transitions

## Performance Impact

- Minimal JavaScript overhead
- CSS-driven animations for better performance
- Layout containment prevents expensive reflows
- Mobile-optimized transition durations

## Testing Layout Shifts

To test the effectiveness:

1. Open Chrome DevTools
2. Go to Performance tab
3. Enable "Web Vitals" in settings
4. Record page interactions
5. Look for CLS score improvements

## Migration Guide

For existing components:

1. Wrap dynamic content with skeleton loading states
2. Add fixed dimensions to CSS classes
3. Use `content-transition` class for smooth loading
4. Test with slow network connections to verify

## Future Enhancements

- Implement Intersection Observer for progressive loading
- Add more sophisticated skeleton matching
- Create automated CLS testing
- Expand to cover all dynamic components