# Calendar Display System - Quick Start Guide

## What's New?

The Academic Calendar now has **3 views** and **3 display modes** for maximum flexibility.

## Views

### 📅 Month View (Default)
Traditional calendar grid showing the entire month.
- **Use when**: You need to see the big picture
- **Features**: Drag-and-drop, event chips, day navigation

### 📆 Week View
7-day view showing the current week in detail.
- **Use when**: You need to focus on the current week
- **Features**: Larger event display, drag-and-drop, week navigation

### 📋 Agenda View
List-based view showing all events grouped by date.
- **Use when**: You need to see event details at a glance
- **Features**: Full event information, easy scanning, no navigation needed

## Display Modes (Month & Week only)

### 🔹 Compact (Default)
- Month: 2 events per day
- Week: 3 events per day
- Best for: Standard use

### 🔹 Comfortable
- Month: 4 events per day
- Week: 6 events per day
- Best for: Detailed planning

### 🔹 Minimal
- Shows only event count badges
- Click day to see all events
- Best for: Quick overview

## How to Use

### Switching Views
1. **Desktop**: Click tabs at top (Month / Week / Agenda)
2. **Mobile**: Use dropdown menu

### Changing Display Mode
1. Select from dropdown: Compact / Comfortable / Minimal
2. Only available in Month and Week views

### Navigation
- **Month View**: Navigate by month
- **Week View**: Navigate by week
- **Agenda View**: Shows current month (no navigation)

### Creating Events
- **Month/Week**: Click empty day cell
- **Agenda**: Use "Add Event" button

### Editing Events
- Click any event chip or row to open edit dialog

### Moving Events (Month/Week only)
- **Desktop**: Drag event chip to another day
- **Mobile**: Use "Move to date..." option

## URL Parameters

The system saves your preferences in the URL:
```
?year=year-1&term=term-1-1&view=month&mode=compact
```

This means:
- Your view persists when you refresh
- You can share links with specific views
- Browser back/forward works

## Tips

1. **Quick Overview**: Use Minimal mode to see event counts at a glance
2. **Detailed Planning**: Use Comfortable mode in Week view
3. **Event Details**: Use Agenda view to see all information
4. **Sharing**: Copy URL to share your current view with others
5. **Mobile**: All views are touch-friendly and responsive

## Keyboard Shortcuts

- **Tab**: Navigate between controls
- **Enter**: Activate selected button
- **Escape**: Close dialogs and popovers

## Filters

All filters work across all views:
- **Type Filters**: Holiday, Exam, Activity, Other
- **Scope Filters**: School, Stage, Grade, Section, All

## Read-Only Mode

When viewing a closed term:
- ✅ View switching works
- ✅ Display mode switching works
- ✅ Events are viewable
- ❌ Creating/editing/deleting disabled
- ❌ Drag-and-drop disabled

## Troubleshooting

**Q: Events not showing?**
- Check your filters (click Filters button)
- Verify you're in the correct term

**Q: Can't drag events?**
- Ensure you're not in Minimal mode
- Ensure term is not closed (read-only)
- Try using "Move to date..." option

**Q: View not persisting?**
- Check URL includes ?view= parameter
- Clear browser cache if needed

**Q: Mobile drag-and-drop not working?**
- Use "Move to date..." option from event menu
- This is the mobile-friendly alternative

## Support

For issues or questions, refer to:
- `CALENDAR_DISPLAY_SYSTEM_COMPLETE.md` - Full documentation
- `CALENDAR_DND_INTEGRATION_COMPLETE.md` - Drag-and-drop details
- `ACADEMIC_CALENDAR_IMPLEMENTATION.md` - Original calendar docs
