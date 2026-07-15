#!/bin/bash

# 🚀 Script para Subir os Arquivos para GitHub
# Execute no Terminal/Bash na pasta: C:\Projeto Markt

echo "============================================"
echo "  Subindo Arquivos para GitHub"
echo "============================================"
echo ""

# Verifica se estamos na pasta certa
if [ ! -d ".git" ]; then
    echo "❌ Erro: Você não está na pasta do projeto GitHub!"
    echo "Execute este script de dentro de: C:\Projeto Markt"
    exit 1
fi

# 1. Renomear arquivo
echo "1️⃣  Renomeando markt-download.html para index.html..."
if [ -f "markt-download.html" ]; then
    rm -f index.html
    mv markt-download.html index.html
    echo "   ✅ Arquivo renomeado com sucesso!"
else
    echo "   ⚠️  Arquivo markt-download.html não encontrado!"
fi

echo ""

# 2. Verificar package.json
echo "2️⃣  Verificando package.json..."
if [ -f "package.json" ]; then
    echo "   ✅ package.json encontrado!"
else
    echo "   ⚠️  package.json não encontrado!"
fi

echo ""

# 3. Git Status
echo "3️⃣  Verificando status do Git..."
git status
echo ""

# 4. Adicionar arquivos
echo "4️⃣  Adicionando arquivos..."
git add index.html package.json
echo "   ✅ Arquivos adicionados!"
echo ""

# 5. Commit
echo "5️⃣  Fazendo commit..."
git commit -m "🚀 Adiciona página de download do Markt Familiar - Deploy no Railway"
echo "   ✅ Commit realizado!"
echo ""

# 6. Push
echo "6️⃣  Enviando para GitHub..."
git push origin main
echo "   ✅ Push realizado!"
echo ""

echo "============================================"
echo "  ✨ Concluído com sucesso! ✨"
echo "============================================"
echo ""
echo "Próximos passos:"
echo "1. Vá para: https://railway.app"
echo "2. Clique em 'New Project'"
echo "3. Selecione 'Deploy from GitHub'"
echo "4. Procure por seu repositório"
echo "5. Clique em 'Deploy'"
echo ""
echo "Seu site estará pronto em 2-3 minutos! 🎉"
