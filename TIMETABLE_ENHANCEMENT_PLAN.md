# Timetable Tab Enhancement Plan

## Current State (Implemented ✅)
- ✅ Basic TimetablePage with tabs (Timetable / Rooms)
- ✅ TimetableView with grade/section filters
- ✅ TimetableGrid (5 days × 8 periods) with click-to-edit
- ✅ EditSlotDialog with subject/teacher/room selection
- ✅ ValidationPanel showing conflicts and hours summary
- ✅ RoomsView with CRUD operations
- ✅ Manual save with dirty tracking
- ✅ Read-only mode for closed terms
- ✅ Basic conflict detection (teacher/room)
- ✅ Target vs actual hours validation
- ✅ Integration with Tab 1 (Structure), Tab 2 (Subjects), Tab 7 (Teacher Allocation)

## Enhancement Phases

### Phase 1: Drag & Drop in Grid 🎯 NEXT
**Priority: High | Complexity: Medium**
- Implement HTML5 drag & drop for timetable cells
- Allow moving/swapping lessons within the grid
- Show visual feedback during drag
- Validate on drop (conflicts, constraints)
- Mobile fallback: "Move to..." dialog
- Update dirty state on drag operations

### Phase 2: Holiday Integration (Tab 4)
**Priority: High | Complexity: Low**
- Fetch HOLIDAY events from calendar service
- Mark holiday days in grid header as "OFF"
- Disable editing on holiday days
- Block publish if entries exist on holidays
- Add visual indicators for off days

### Phase 3: Auto-Generate Timetable
**Priority: High | Complexity: High**
- Implement basic heuristic solver
- Generate dialog with options (strict/relaxed mode)
- Distribute subjects based on weekly hours targets
- Respect teacher allocations from Tab 7
- Avoid conflicts (teacher/room)
- Show generation report (success/failures)
- Preview before applying

### Phase 4: Copy/Carry-Over
**Priority: Medium | Complexity: Medium**
- Copy from another section (same term)
- Copy from previous term (carry over)
- Options: subjects only / + teachers / + rooms
- Copy dialog with source selection
- Mark dirty after copy

### Phase 5: Enhanced Publish Workflow
**Priority: High | Complexity: Low**
- Pre-publish validation gates
- Block on: conflicts, holiday entries, missing data
- Configurable policies (strict/relaxed)
- Confirmation dialog with issue list
- Notifications hook (stub for backend)
- Unpublish functionality

### Phase 6: Export Functionality
**Priority: Medium | Complexity: Low**
- Export timetable to CSV/XLSX
- Export validation report
- Export teacher load summary
- Use existing export utilities
- Include metadata (year/term/grade/section)

### Phase 7: Analytics & Reporting
**Priority: Low | Complexity: Medium**
- Teacher load distribution chart
- Room utilization stats
- Subject distribution visualization
- Completeness KPIs
- Dashboard widgets

### Phase 8: Advanced Features
**Priority: Low | Complexity: High**
- Bulk operations (apply teacher/room across week)
- Smart suggestions (AI-powered)
- Conflict resolution wizard
- Template management
- Recurring patterns

## Implementation Order
1. ✅ Phase 1: Drag & Drop (Week 1)
2. Phase 2: Holiday Integration (Week 1)
3. Phase 3: Auto-Generate (Week 2)
4. Phase 4: Copy/Carry-Over (Week 2)
5. Phase 5: Enhanced Publish (Week 3)
6. Phase 6: Export (Week 3)
7. Phase 7: Analytics (Week 4)
8. Phase 8: Advanced Features (Future)

## Technical Constraints
- No new dependencies
- Reuse existing components
- RTL/AR/EN support
- Mobile responsive
- Performance: handle 50+ sections
- Accessibility compliant

## Success Criteria
- All core features working end-to-end
- No regressions in existing functionality
- Build passes without errors
- All translations complete
- QA checklist passes 100%
