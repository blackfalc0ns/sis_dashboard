# Progress Bar - Quick Guide

## What It Does
Shows a thin progress bar at the top of the screen during navigation.

## How It Works

### User Clicks Sidebar
```
Click → Progress bar appears (instant)
      → Animates 15% → 90%
      → Route changes
      → Completes at 100%
      → Fades out
```

### Visual
```
┌─────────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░░░░░░░░░ │ ← 3px bar at top
└─────────────────────────────────────┘
```

## Files

### Created
1. `src/providers/ProgressBarProvider.tsx` - Progress logic
2. `src/hooks/useProgressDoneOnMount.ts` - Optional hook

### Modified
1. `src/app/[lang]/(dashboard)/layout.tsx` - Added provider
2. `src/components/navigation/GuardedLink.tsx` - Starts progress

## Usage

### Automatic (Default)
Progress starts automatically on all GuardedLink clicks.
No code changes needed!

### Manual Control
```typescript
import { useProgressBar } from "@/providers/ProgressBarProvider";

function MyComponent() {
  const progress = useProgressBar();
  
  const handleAction = async () => {
    progress.start();
    await doSomething();
    progress.done();
  };
}
```

### Auto-complete on Mount
```typescript
import { useProgressDoneOnMount } from "@/hooks/useProgressDoneOnMount";

function PageShell() {
  useProgressDoneOnMount();
  return <div>...</div>;
}
```

## Features

✅ Instant start on navigation
✅ Smooth animation
✅ Auto-completes when route changes
✅ Works with navigation guards
✅ RTL safe
✅ Zero dependencies

## Test It

1. Click any sidebar item
2. Watch the top of the screen
3. See progress bar animate
4. Bar completes and fades out

## Customization

### Change Color
Edit `ProgressBarProvider.tsx` line 107:
```typescript
backgroundColor: "var(--primary-color, #036C80)"
```

### Change Height
Edit `ProgressBarProvider.tsx` line 105:
```typescript
style={{ height: "3px" }}
```

### Change Speed
Edit `ProgressBarProvider.tsx` line 56:
```typescript
}, 300);  // milliseconds
```

## Status
🎉 Active and working!
