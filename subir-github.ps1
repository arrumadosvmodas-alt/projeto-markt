# 🚀 Script para Subir os Arquivos para GitHub
# Execute no PowerShell como administrador na pasta: C:\Projeto Markt

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Subindo Arquivos para GitHub" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se estamos na pasta certa
if (-not (Test-Path ".git")) {
    Write-Host "❌ Erro: Você não está na pasta do projeto GitHub!" -ForegroundColor Red
    Write-Host "Execute este script de dentro de: C:\Projeto Markt" -ForegroundColor Yellow
    exit
}

# 1. Renomear arquivo
Write-Host "1️⃣  Renomeando markt-download.html para index.html..." -ForegroundColor Yellow
if (Test-Path "markt-download.html") {
    Remove-Item "index.html" -ErrorAction SilentlyContinue
    Rename-Item "markt-download.html" "index.html"
    Write-Host "   ✅ Arquivo renomeado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Arquivo markt-download.html não encontrado!" -ForegroundColor Yellow
}

Write-Host ""

# 2. Verificar package.json
Write-Host "2️⃣  Verificando package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "   ✅ package.json encontrado!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  package.json não encontrado!" -ForegroundColor Yellow
}

Write-Host ""

# 3. Git Status
Write-Host "3️⃣  Verificando status do Git..." -ForegroundColor Yellow
git status
Write-Host ""

# 4. Adicionar arquivos
Write-Host "4️⃣  Adicionando arquivos..." -ForegroundColor Yellow
git add index.html package.json
Write-Host "   ✅ Arquivos adicionados!" -ForegroundColor Green
Write-Host ""

# 5. Commit
Write-Host "5️⃣  Fazendo commit..." -ForegroundColor Yellow
git commit -m "🚀 Adiciona página de download do Markt Familiar - Deploy no Railway"
Write-Host "   ✅ Commit realizado!" -ForegroundColor Green
Write-Host ""

# 6. Push
Write-Host "6️⃣  Enviando para GitHub..." -ForegroundColor Yellow
git push origin main
Write-Host "   ✅ Push realizado!" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✨ Concluído com sucesso! ✨" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Vá para: https://railway.app" -ForegroundColor White
Write-Host "2. Clique em 'New Project'" -ForegroundColor White
Write-Host "3. Selecione 'Deploy from GitHub'" -ForegroundColor White
Write-Host "4. Procure por seu repositório" -ForegroundColor White
Write-Host "5. Clique em 'Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "Seu site estará pronto em 2-3 minutos! 🎉" -ForegroundColor Green
