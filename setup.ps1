# oh-my-vst Setup Script
# Progressive agent-based VST plugin development for OpenCode

Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        oh-my-vst :: Setup             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$skillPath = "$env:USERPROFILE\.config\opencode\skills\oh-my-vst"
$configPath = "$env:USERPROFILE\.config\opencode\opencode.jsonc"

Write-Host "📍 Skill installed at:" -ForegroundColor Yellow
Write-Host "   $skillPath"
Write-Host ""

# Check opencode.jsonc has context7 MCP
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    $hasContext7 = $config.mcp.PSObject.Properties.Name -contains "context7"
    
    if (-not $hasContext7) {
        Write-Host "⚠️  context7 MCP not found in opencode.jsonc" -ForegroundColor Yellow
        Write-Host "   It's recommended for framework documentation lookups." -ForegroundColor Yellow
        Write-Host "   Install via: opencode plugin add @opencode-ai/context7-mcp" -ForegroundColor DarkYellow
        Write-Host ""
    } else {
        Write-Host "✅ context7 MCP found" -ForegroundColor Green
    }
}

Write-Host "📂 Structure:" -ForegroundColor Yellow
Write-Host "   SKILL.md          - Main skill manifest (auto-discovered)" -ForegroundColor Gray
Write-Host "   prompts/          - Agent prompts (orchestrator, spec, architect, dsp, gui, validate)" -ForegroundColor Gray
Write-Host "   presets/          - Framework presets (iplug2, juce, faust, cmajor, rust)" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Usage:" -ForegroundColor Green
Write-Host "   /oh-my-vst        - Load the skill" -ForegroundColor White
Write-Host "   Then describe your plugin idea, and the orchestrator" -ForegroundColor Gray
Write-Host "   guides through: Spec → Architect → DSP → GUI → Validate" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Prerequisites:" -ForegroundColor Yellow
Write-Host "   - vst-creation skill (for framework-specific reference docs)" -ForegroundColor Gray
Write-Host "   - context7 MCP (for live API documentation)" -ForegroundColor Gray
Write-Host "   - Framework toolchain (CMake/Ninja, JUCE, Faust, etc.)" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ oh-my-vst ready!" -ForegroundColor Cyan
Write-Host "   (Auto-discovered by OpenCode — no registration needed)" -ForegroundColor DarkCyan
