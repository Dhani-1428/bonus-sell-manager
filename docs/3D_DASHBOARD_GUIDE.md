# 3D Animated Dashboard Guide

## Overview

The 3D Dashboard is a modern, glassmorphism-style admin panel featuring floating 3D panels with smooth animations, parallax effects, and animated number counters.

## Features

### 🎨 Visual Design
- **Glassmorphism**: Frosted glass effect with backdrop blur
- **3D Tilt Effects**: Panels tilt on mouse movement for depth
- **Neon Accents**: Green and orange colors for food commerce theme
- **Animated Background**: Floating gradient orbs with parallax movement
- **Dark Theme**: Modern dark mode default

### ✨ Animations
- **Entrance Animations**: Staggered panel appearance
- **Hover Effects**: 3D tilt and glow on hover
- **Number Counters**: Animated counting from 0 to target value
- **Expansion**: Panels expand when clicked
- **Smooth Transitions**: Spring-based animations for natural feel

### 🎯 Interactive Elements
- **Click to Expand**: Click any panel to expand it
- **Mouse Parallax**: Panels respond to mouse movement
- **Quick Actions**: Direct links to Users, Menu Items, and Orders pages

## Components

### Panel3D
The core 3D panel component with glassmorphism and tilt effects.

**Props:**
- `children`: Panel content
- `className`: Additional CSS classes
- `delay`: Animation delay in seconds
- `glowColor`: RGBA color for glow effect
- `onClick`: Click handler
- `expanded`: Whether panel is expanded

### AnimatedNumber
Animated number counter that counts from 0 to target value.

**Props:**
- `value`: Target number
- `prefix`: Text before number (e.g., "€")
- `suffix`: Text after number (e.g., "%")
- `decimals`: Number of decimal places
- `duration`: Animation duration in seconds
- `className`: Additional CSS classes

### Dashboard3DGrid
Main dashboard grid component that displays all stats panels.

**Props:**
- `stats`: Dashboard statistics object

## Usage

### Accessing the Dashboard

Navigate to `/admin/dashboard-3d` in your admin panel, or click "3D Dashboard" in the sidebar.

### Integration

The dashboard automatically fetches data from:
- `/api/admin/users` - User statistics
- `/api/admin/payments` - Payment data
- `/api/admin/orders` - Order counts
- `/api/admin/menu-items` - Menu item counts

### Customization

#### Changing Colors

Edit `glowColor` in the `panels` array in `components/admin/3d-dashboard-grid.tsx`:

```typescript
{
  id: "users",
  title: "Total Users",
  value: stats.totalUsers,
  icon: Users,
  glowColor: "rgba(59, 130, 246, 0.4)", // Change this
  description: "Registered users",
}
```

#### Adding New Panels

Add a new panel object to the `panels` array:

```typescript
{
  id: "new-panel",
  title: "New Metric",
  value: stats.newMetric,
  icon: YourIcon,
  glowColor: "rgba(255, 0, 0, 0.4)",
  description: "Description here",
  trend: {
    value: 15,
    isPositive: true,
  },
}
```

#### Adjusting Animation Speed

Modify the `delay` multiplier in the grid mapping:

```typescript
delay={index * 0.1} // Increase for slower stagger
```

## Performance

### Optimizations
- Uses CSS transforms (GPU accelerated)
- Lazy loading with `useInView` hook
- Spring animations for smooth performance
- Minimal re-renders with React hooks

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires CSS backdrop-filter support
- Works best with hardware acceleration enabled

## Technical Stack

- **React**: Component framework
- **Next.js**: Server-side rendering
- **Framer Motion**: Animation library
- **TailwindCSS**: Styling
- **TypeScript**: Type safety

## File Structure

```
components/admin/
  ├── 3d-panel.tsx          # Core 3D panel component
  ├── animated-number.tsx    # Number counter animation
  └── 3d-dashboard-grid.tsx  # Main dashboard grid

app/(admin)/admin/
  └── dashboard-3d/
      └── page.tsx           # Dashboard page component
```

## Troubleshooting

### Panels not animating
- Check if Framer Motion is installed
- Verify browser supports CSS transforms
- Check console for errors

### Numbers not counting
- Ensure `useInView` hook is working
- Check if panel is visible in viewport
- Verify data is loading correctly

### Performance issues
- Reduce number of panels
- Lower animation complexity
- Check for unnecessary re-renders

## Future Enhancements

Potential improvements:
- Drag and drop panel reordering
- Customizable panel layouts
- More chart types
- Real-time data updates
- Export dashboard as image
- Custom themes

## Credits

Built with modern web technologies for optimal performance and user experience.
