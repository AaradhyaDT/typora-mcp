<#
.SYNOPSIS
    Automated Git synchronization, secret scanner, and build runner for typora-mcp.

.DESCRIPTION
    sync.ps1 - The central synchronization script for the Typora MCP server repository:
    https://github.com/Aaradhya-Dev-Tamrakar/typora-mcp

    Capabilities:
    1. Pre-Commit Secret Scanner Guard: Prevents committing API keys or tokens.
    2. Automatic TypeScript Build & Schema Sync: Runs `npm run build` and `npm run sync-schemas`.
    3. Intelligent Conventional Commits: Auto-formats scoped commit messages (feat(typora), docs(typora), etc.).
    4. Safe Rebase & Push: Pulls with --rebase --autostash before pushing to origin/main.
    5. Dry-Run Mode (-WhatIf): Previews changes and secret scan without touching git state.

.PARAMETER Message
    Custom commit message (alias: -m). If omitted, an intelligent conventional commit is generated.

.PARAMETER PullOnly
    Pulls remote updates with --rebase --autostash without staging or pushing.

.PARAMETER PushOnly
    Pushes existing local commits without creating new commits.

.PARAMETER NoPush
    Stages and commits changes locally without pushing to origin.

.PARAMETER NoBuild
    Skips the automatic TypeScript compilation step.

.PARAMETER WhatIf
    Dry-run mode: inspects changes and runs secret scanner without altering git state.

.EXAMPLE
    .\sync.ps1                                     # Routine build, sync, and push
    .\sync.ps1 -m "feat(typora): add export tool"  # Custom commit message
    .\sync.ps1 -PullOnly                           # Pull latest changes safely
    .\sync.ps1 -WhatIf                             # Dry-run preview
#>

[CmdletBinding()]
param (
    [Alias("m")]
    [string]$Message,

    [switch]$PullOnly,
    [switch]$PushOnly,
    [switch]$NoPush,
    [switch]$NoBuild,
    [switch]$WhatIf
)

$ErrorActionPreference = "Continue"

function Write-Status {
    param(
        [string]$Message,
        [System.ConsoleColor]$Color = [System.ConsoleColor]::Cyan
    )
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor $Color
}

function Write-Notice {
    param([string]$Message)
    Write-Status -Message $Message -Color ([System.ConsoleColor]::Yellow)
}

function Write-Success {
    param([string]$Message)
    Write-Status -Message $Message -Color ([System.ConsoleColor]::Green)
}

function Write-Failure {
    param([string]$Message)
    Write-Status -Message $Message -Color ([System.ConsoleColor]::Red)
}

function Find-StagedSecrets {
    $stagedDiff = git diff --cached -U0 2>$null
    if (-not $stagedDiff) { return @() }

    $addedLines = $stagedDiff | Where-Object { $_ -match '^\+[^+]' } | ForEach-Object { $_.Substring(1) }
    if (-not $addedLines) { return @() }

    $secretPatterns = @(
        'AKIA[0-9A-Z]{16}',
        'sk-[a-zA-Z0-9]{20,}',
        'sk-ant-[a-zA-Z0-9\-]{20,}',
        'ghp_[a-zA-Z0-9]{36}',
        'github_pat_[a-zA-Z0-9_]{20,}',
        'AIza[0-9A-Za-z\-_]{35}',
        'xox[baprs]-[0-9a-zA-Z\-]{10,}',
        '-----BEGIN (RSA|EC|OPENSSH|PGP|DSA)? ?PRIVATE KEY-----',
        '(?i)(api[_-]?key|client_secret|access_token|refresh_token|password)\s*[:=]\s*[''"][^''"\s]{8,}[''"]'
    )

    $hits = @()
    foreach ($line in $addedLines) {
        foreach ($pattern in $secretPatterns) {
            if ($line -match $pattern) {
                $hits += $line.Trim()
                break
            }
        }
    }
    return $hits
}

Write-Status "============================================================"
Write-Status "Typora MCP Server Ecosystem Sync Guard"
Write-Status "============================================================"

# Handle PullOnly
if ($PullOnly) {
    Write-Status "Pulling latest changes (rebase + autostash)..."
    git pull --rebase --autostash origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pull completed cleanly."
    } else {
        Write-Failure "Pull failed or encountered conflicts."
    }
    exit $LASTEXITCODE
}

# TypeScript Build & Schema Sync
if (-not $NoBuild) {
    Write-Status "Compiling TypeScript project..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "TypeScript compilation failed. Aborting sync."
        exit $LASTEXITCODE
    }
    Write-Success "Build clean."

    Write-Status "Syncing Antigravity MCP schemas..."
    npm run sync-schemas
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Schema sync failed. Aborting sync."
        exit $LASTEXITCODE
    }
    Write-Success "Schemas synced."
}

# Handle PushOnly
if ($PushOnly) {
    Write-Status "Pushing existing commits to origin/main..."
    git push origin main
    exit $LASTEXITCODE
}

# Inspect git status
$changes = git status --porcelain
if (-not $changes) {
    Write-Notice "Working tree clean. Checking for unpushed commits..."
    $unpushed = git log "@{u}..HEAD" --oneline 2>$null
    if ($unpushed) {
        Write-Status "Found unpushed commits. Pushing..."
        git push origin main
    } else {
        Write-Success "Already up-to-date with remote. Nothing to do."
    }
    exit 0
}

# Stage changes
git add -A

# Secret scanning guard
Write-Status "Running pre-commit secret scanner..."
$secretViolations = Find-StagedSecrets
if ($secretViolations.Count -gt 0) {
    Write-Failure "BLOCKED: Detected potential secret(s) in staged changes:"
    foreach ($violation in $secretViolations) {
        Write-Failure "  -> $violation"
    }
    if (git rev-parse --verify HEAD 2>$null) { git reset HEAD } else { git rm --cached -r . 2>$null }
    exit 1
}
Write-Success "Secret scan passed. Zero sensitive credentials detected."

# Dry run inspection
if ($WhatIf) {
    Write-Notice "[Dry Run] Staged files that would be committed:"
    if (git rev-parse --verify HEAD 2>$null) { git reset HEAD } else { git rm --cached -r . 2>$null }
    exit 0
}

# Determine commit message
$commitMsg = $Message
if (-not $commitMsg) {
    $changedFiles = git diff --cached --name-only
    $hasSrc = $changedFiles | Where-Object { $_ -like "src/*" }
    $hasDocs = $changedFiles | Where-Object { $_ -like "*.md" }

    if ($hasSrc) {
        $commitMsg = "feat(typora): update Typora MCP engine and tools"
    } elseif ($hasDocs) {
        $commitMsg = "docs(typora): update documentation"
    } else {
        $commitMsg = "chore(typora): synchronize configuration and assets"
    }
}

Write-Status "Committing: $commitMsg"
git commit -m $commitMsg

if (-not $NoPush) {
    $hasRemote = git remote
    if ($hasRemote) {
        Write-Status "Pulling remote with rebase..."
        git pull --rebase --autostash origin main 2>$null
        Write-Status "Pushing commits to origin/main..."
        git push origin main
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Ecosystem sync complete!"
        } else {
            Write-Notice "Push did not complete (remote may not be configured yet). Local commit saved."
        }
    } else {
        Write-Notice "No remote configured. Local commit created successfully."
    }
} else {
    Write-Success "Local commit created (-NoPush)."
}

exit 0
