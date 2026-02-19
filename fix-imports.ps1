# Fix all imports in app directory
$files = Get-ChildItem -Path "src/app" -Include "*.tsx","*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Students-guardians imports
    $content = $content -replace '@/components/students-guardians/guardian-tabs/', '@/components/features/students-guardians/components/tabs/guardian/'
    $content = $content -replace '@/components/students-guardians/profile-tabs/', '@/components/features/students-guardians/components/tabs/student/'
    $content = $content -replace '@/components/students-guardians/transfers-withdrawals/', '@/components/features/students-guardians/components/transfers-withdrawals/'
    $content = $content -replace '@/components/students-guardians/([A-Z][a-zA-Z]+)', '@/components/features/students-guardians/components/pages/$1'
    
    # Leads imports
    $content = $content -replace '@/components/leads/', '@/components/features/leads/components/'
    
    # Dashboard imports
    $content = $content -replace '@/components/dashboard/', '@/components/features/dashboard/components/'
    
    # Admissions imports
    $content = $content -replace '@/components/admissions/application-tabs/', '@/components/features/admissions/components/tabs/'
    $content = $content -replace '@/components/admissions/pages/', '@/components/features/admissions/components/pages/'
    $content = $content -replace '@/components/admissions/lists/', '@/components/features/admissions/components/lists/'
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Done!"
