#!/usr/bin/env pwsh

# ============================================================================
# MARKT FAMILIAR — SETUP AUTOMÁTICO (Windows PowerShell)
# Script para instalar e verificar se tudo está funcionando
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           🚀 MARKT FAMILIAR — SETUP AUTOMÁTICO 🚀             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function CheckMark {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function ErrorMark {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function WarningMark {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function InfoMark {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

# ============================================================================
# 1. VERIFICAR PRÉ-REQUISITOS
# ============================================================================

Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow
Write-Host ""

# Node.js
try {
    $nodeVersion = node --version
    CheckMark "Node.js $nodeVersion instalado"
} catch {
    ErrorMark "Node.js não encontrado. Instale em: https://nodejs.org/"
    exit 1
}

# npm
try {
    $npmVersion = npm --version
    CheckMark "npm $npmVersion instalado"
} catch {
    ErrorMark "npm não encontrado"
    exit 1
}

Write-Host ""

# ============================================================================
# 2. SETUP BACKEND
# ============================================================================

Write-Host "🔧 Configurando Backend..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "backend") {
    Set-Location backend

    # Instalar dependências
    if (-not (Test-Path "node_modules")) {
        Write-Host "   📦 Instalando dependências do backend..." -ForegroundColor Gray
        npm install --silent
        CheckMark "Dependências instaladas"
    } else {
        CheckMark "Dependências do backend já instaladas"
    }

    # Verificar .env
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            CheckMark "Arquivo .env criado"
        }
    } else {
        CheckMark "Arquivo .env já existe"
    }

    Set-Location ..
    CheckMark "Backend configurado"
} else {
    ErrorMark "Pasta backend não encontrada"
    exit 1
}

Write-Host ""

# ============================================================================
# 3. SETUP FRONTEND
# ============================================================================

Write-Host "🎨 Configurando Frontend..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "frontend") {
    Set-Location frontend

    # Instalar dependências
    if (-not (Test-Path "node_modules")) {
        Write-Host "   📦 Instalando dependências do frontend..." -ForegroundColor Gray
        npm install --silent
        CheckMark "Dependências instaladas"
    } else {
        CheckMark "Dependências do frontend já instaladas"
    }

    Set-Location ..
    CheckMark "Frontend configurado"
} else {
    ErrorMark "Pasta frontend não encontrada"
    exit 1
}

Write-Host ""

# ============================================================================
# 4. VERIFICAR ARQUIVOS CRIADOS
# ============================================================================

Write-Host "📁 Verificando arquivos criados..." -ForegroundColor Yellow
Write-Host ""

$files = @(
    "frontend/src/styles/design-system.css",
    "frontend/src/components/UI/Button.tsx",
    "frontend/src/components/UI/Card.tsx",
    "frontend/src/components/UI/Input.tsx",
    "frontend/src/components/UI/Badge.tsx",
    "frontend/src/pages/CircleDashboard.tsx",
    "frontend/src/pages/CreateCircle.tsx",
    "frontend/src/pages/SharedLists.tsx",
    "frontend/src/pages/Calendar.tsx",
    "frontend/src/pages/Tasks.tsx",
    "frontend/src/pages/Chat.tsx",
    "frontend/src/pages/LoginNew.tsx",
    "frontend/src/components/BottomNavNew.tsx",
    "COMECE_AQUI.md",
    "INICIAR_APP.md",
    "APP_COMPLETO.md",
    "DESIGN_SYSTEM.md"
)

$missingCount = 0
foreach ($file in $files) {
    if (Test-Path $file) {
        CheckMark $file
    } else {
        ErrorMark "$file NÃO ENCONTRADO"
        $missingCount++
    }
}

Write-Host ""

if ($missingCount -eq 0) {
    CheckMark "Todos os arquivos criados foram encontrados!"
} else {
    WarningMark "$missingCount arquivo(s) faltando"
}

Write-Host ""

# ============================================================================
# 5. VERIFICAÇÕES FINAIS
# ============================================================================

Write-Host "✅ Verificações Finais..." -ForegroundColor Yellow
Write-Host ""

# Verificar TypeScript
Set-Location frontend
try {
    $tsVersion = npm list typescript 2>&1 | Select-String "typescript@"
    if ($tsVersion) {
        CheckMark "TypeScript instalado"
    }
} catch {
    WarningMark "TypeScript não encontrado"
}

# Verificar React
try {
    $reactVersion = npm list react 2>&1 | Select-String "react@"
    if ($reactVersion) {
        CheckMark "React instalado"
    }
} catch {
    ErrorMark "React não encontrado"
    exit 1
}

Set-Location ..

# Verificar Express
Set-Location backend
try {
    $expressVersion = npm list express 2>&1 | Select-String "express@"
    if ($expressVersion) {
        CheckMark "Express instalado"
    }
} catch {
    ErrorMark "Express não encontrado"
    exit 1
}

Set-Location ..

Write-Host ""

# ============================================================================
# 6. INSTRUÇÕES FINAIS
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ SETUP CONCLUÍDO COM SUCESSO! ✅               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Abra dois terminais PowerShell" -ForegroundColor White
Write-Host ""
Write-Host "   Terminal 1 (Backend):" -ForegroundColor Yellow
Write-Host "   PS> cd backend" -ForegroundColor Gray
Write-Host "   PS> npm run dev" -ForegroundColor Gray
Write-Host "   ✓ Rodará em http://localhost:4000" -ForegroundColor Green
Write-Host ""
Write-Host "   Terminal 2 (Frontend):" -ForegroundColor Yellow
Write-Host "   PS> cd frontend" -ForegroundColor Gray
Write-Host "   PS> npm run dev" -ForegroundColor Gray
Write-Host "   ✓ Rodará em http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "   3. Abra no navegador: http://localhost:5173" -ForegroundColor White
Write-Host "   4. Login com:" -ForegroundColor White
Write-Host "      CPF: 12345678900" -ForegroundColor Gray
Write-Host "      Senha: 123456" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Explore o app e divirta-se! 🎉" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Documentação:" -ForegroundColor Cyan
Write-Host "   • COMECE_AQUI.md         — Leia primeiro" -ForegroundColor Gray
Write-Host "   • INICIAR_APP.md         — Como rodar" -ForegroundColor Gray
Write-Host "   • DESIGN_SYSTEM.md       — Componentes" -ForegroundColor Gray
Write-Host "   • ARQUITETURA_TECNICA.md — Detalhes técnicos" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Versão: 1.0.0" -ForegroundColor Gray
Write-Host "Status: 🟢 Pronto para usar" -ForegroundColor Green
Write-Host ""
