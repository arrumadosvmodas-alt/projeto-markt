#!/bin/bash

# ============================================================================
# MARKT FAMILIAR — SETUP AUTOMÁTICO
# Script para instalar e verificar se tudo está funcionando
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🚀 MARKT FAMILIAR — SETUP AUTOMÁTICO 🚀             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark() {
    echo -e "${GREEN}✓${NC} $1"
}

error_mark() {
    echo -e "${RED}✗${NC} $1"
}

warning_mark() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ============================================================================
# 1. VERIFICAR PRÉ-REQUISITOS
# ============================================================================

echo "📋 Verificando pré-requisitos..."
echo ""

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_mark "Node.js $NODE_VERSION instalado"
else
    error_mark "Node.js não encontrado. Instale em: https://nodejs.org/"
    exit 1
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_mark "npm $NPM_VERSION instalado"
else
    error_mark "npm não encontrado"
    exit 1
fi

echo ""

# ============================================================================
# 2. SETUP BACKEND
# ============================================================================

echo "🔧 Configurando Backend..."
echo ""

if [ -d "backend" ]; then
    cd backend

    # Instalar dependências
    if [ ! -d "node_modules" ]; then
        echo "   📦 Instalando dependências do backend..."
        npm install --silent
        check_mark "Dependências instaladas"
    else
        check_mark "Dependências do backend já instaladas"
    fi

    # Verificar .env
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            check_mark "Arquivo .env criado"
        fi
    else
        check_mark "Arquivo .env já existe"
    fi

    cd ..
    check_mark "Backend configurado"
else
    error_mark "Pasta backend não encontrada"
    exit 1
fi

echo ""

# ============================================================================
# 3. SETUP FRONTEND
# ============================================================================

echo "🎨 Configurando Frontend..."
echo ""

if [ -d "frontend" ]; then
    cd frontend

    # Instalar dependências
    if [ ! -d "node_modules" ]; then
        echo "   📦 Instalando dependências do frontend..."
        npm install --silent
        check_mark "Dependências instaladas"
    else
        check_mark "Dependências do frontend já instaladas"
    fi

    cd ..
    check_mark "Frontend configurado"
else
    error_mark "Pasta frontend não encontrada"
    exit 1
fi

echo ""

# ============================================================================
# 4. VERIFICAR ARQUIVOS CRIADOS
# ============================================================================

echo "📁 Verificando arquivos criados..."
echo ""

FILES=(
    "frontend/src/styles/design-system.css"
    "frontend/src/components/UI/Button.tsx"
    "frontend/src/components/UI/Card.tsx"
    "frontend/src/components/UI/Input.tsx"
    "frontend/src/components/UI/Badge.tsx"
    "frontend/src/pages/CircleDashboard.tsx"
    "frontend/src/pages/CreateCircle.tsx"
    "frontend/src/pages/SharedLists.tsx"
    "frontend/src/pages/Calendar.tsx"
    "frontend/src/pages/Tasks.tsx"
    "frontend/src/pages/Chat.tsx"
    "frontend/src/pages/LoginNew.tsx"
    "frontend/src/components/BottomNavNew.tsx"
    "COMECE_AQUI.md"
    "INICIAR_APP.md"
    "APP_COMPLETO.md"
    "DESIGN_SYSTEM.md"
)

MISSING_COUNT=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        check_mark "$file"
    else
        error_mark "$file NÃO ENCONTRADO"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
done

echo ""

if [ $MISSING_COUNT -eq 0 ]; then
    check_mark "Todos os arquivos criados foram encontrados!"
else
    warning_mark "$MISSING_COUNT arquivo(s) faltando"
fi

echo ""

# ============================================================================
# 5. VERIFICAÇÕES FINAIS
# ============================================================================

echo "✅ Verificações Finais..."
echo ""

# Verificar TypeScript
cd frontend
if npm list typescript &> /dev/null; then
    check_mark "TypeScript instalado"
else
    warning_mark "TypeScript não encontrado"
fi
cd ..

# Verificar React
cd frontend
if npm list react &> /dev/null; then
    check_mark "React instalado"
else
    error_mark "React não encontrado"
    exit 1
fi
cd ..

# Verificar Express
cd backend
if npm list express &> /dev/null; then
    check_mark "Express instalado"
else
    error_mark "Express não encontrado"
    exit 1
fi
cd ..

echo ""

# ============================================================================
# 6. INSTRUÇÕES FINAIS
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ SETUP CONCLUÍDO COM SUCESSO! ✅               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "🚀 PRÓXIMOS PASSOS:"
echo ""
echo "   1. Abra dois terminais"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ cd backend"
echo "   $ npm run dev"
echo "   ✓ Rodará em http://localhost:4000"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd frontend"
echo "   $ npm run dev"
echo "   ✓ Rodará em http://localhost:5173"
echo ""
echo "   3. Abra no navegador: http://localhost:5173"
echo "   4. Login com:"
echo "      CPF: 12345678900"
echo "      Senha: 123456"
echo ""
echo "   5. Explore o app e divirta-se! 🎉"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 Documentação:"
echo "   • COMECE_AQUI.md         — Leia primeiro"
echo "   • INICIAR_APP.md         — Como rodar"
echo "   • DESIGN_SYSTEM.md       — Componentes"
echo "   • ARQUITETURA_TECNICA.md — Detalhes técnicos"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Versão: 1.0.0"
echo "Status: 🟢 Pronto para usar"
echo ""
