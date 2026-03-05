# Fix all remaining import path issues

Write-Host "Fixing students-guardians page imports..."

# Fix students-guardians dashboard page
$file = "src/app/[lang]/(dashboard)/students-guardians/page.tsx"
if (Test-Path $file) {
    (Get-Content $file -Raw) -replace '@/components/features/students-guardians/components/pages/StudentsGuardiansDashboard', '@/features/students-guardians/dashboard/pages/StudentsGuardiansDashboard' | Set-Content $file -NoNewline
    Write-Host "Fixed: $file"
}

# Fix transfers-withdrawals pages
$files = @(
    "src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/transfers/applications/page.tsx",
    "src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/transfers/page.tsx",
    "src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/withdrawals/applications/page.tsx",
    "src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/withdrawals/page.tsx",
    "src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/transfers/[requestId]/page.tsx",
    "src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/withdrawals/[requestId]/page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace '@/components/features/students-guardians/components/transfers-withdrawals/transfers-withdrawals/TransfersApplicationsPage', '@/features/students-guardians/transfers-withdrawals/components/TransfersApplicationsPage'
        $content = $content -replace '@/components/features/students-guardians/components/transfers-withdrawals/transfers-withdrawals/TransfersOverviewPage', '@/features/students-guardians/transfers-withdrawals/components/TransfersOverviewPage'
        $content = $content -replace '@/components/features/students-guardians/components/transfers-withdrawals/transfers-withdrawals/WithdrawalsApplicationsPage', '@/features/students-guardians/transfers-withdrawals/components/WithdrawalsApplicationsPage'
        $content = $content -replace '@/components/features/students-guardians/components/transfers-withdrawals/transfers-withdrawals/WithdrawalsOverviewPage', '@/features/students-guardians/transfers-withdrawals/components/WithdrawalsOverviewPage'
        $content = $content -replace '@/components/features/students-guardians/components/transfers-withdrawals/transfers-withdrawals/details/TransferRequestDetailsPage', '@/features/students-guardians/transfers-withdrawals/components/details/TransferRequestDetailsPage'
        $content = $content -replace '@/components/features/students-guardians/components/transfers-withdrawals/transfers-withdrawals/details/WithdrawalRequestDetailsPage', '@/features/students-guardians/transfers-withdrawals/components/details/WithdrawalRequestDetailsPage'
        Set-Content $file -Value $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "`nFixing academics page imports..."

# Fix academics pages
$academicsFiles = @(
    "src/app/[lang]/(dashboard)/academics/structure/page.tsx",
    "src/app/[lang]/(dashboard)/academics/curriculum/lessons/[lessonId]/assignments/[assignmentId]/page.tsx",
    "src/app/[lang]/(dashboard)/academics/calendar/page.tsx",
    "src/app/[lang]/(dashboard)/academics/timetable/page.tsx",
    "src/app/[lang]/(dashboard)/academics/subjects/page.tsx",
    "src/app/[lang]/(dashboard)/academics/teacher-allocation/page.tsx"
)

foreach ($file in $academicsFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace '@/features/academics/academic-structure-tree/AcademicStructurePage', '@/features/academics/academic-structure-tree/pages/AcademicStructurePage'
        $content = $content -replace '@/features/academics/assignments/builder/pages/AssignmentBuilderPage', '@/features/academics/curriculum/pages/AssignmentBuilderPage'
        $content = $content -replace '@/features/academics/calendar/AcademicCalendarPage', '@/features/academics/calendar/pages/AcademicCalendarPage'
        $content = $content -replace '@/features/academics/components/pages/TimetablePageContent', '@/features/academics/timetable/pages/TimetablePageContent'
        $content = $content -replace '@/features/academics/subjects/SubjectsAllocationPage', '@/features/academics/subjects/pages/SubjectsAllocationPage'
        $content = $content -replace '@/features/academics/teacher-allocation/TeacherAllocationPage', '@/features/academics/teacher-allocation/pages/TeacherAllocationPage'
        Set-Content $file -Value $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "`nFixing studentsService imports in app routes..."

# Fix studentsService imports in all app route files
$studentFiles = Get-ChildItem -Path "src/app/[lang]/(dashboard)/students-guardians" -Recurse -Filter "*.tsx" -File

foreach ($file in $studentFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match '@/services/studentsService') {
        $content = $content -replace '@/services/studentsService', '@/features/students-guardians/students/services/studentsService'
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "`nAll fixes completed!"
