# 🚀 Guia Completo: Hospedar no Railway

## ✅ Pré-requisitos
- [ ] Conta GitHub (gratuita em github.com)
- [ ] Conta Railway (gratuita em railway.app)
- [ ] Arquivo `markt-download.html` pronto

---

## 📋 PASSO 1: Criar Repositório no GitHub

### 1.1 - Acesse GitHub
1. Vá para [github.com](https://github.com)
2. Faça login na sua conta
3. Clique no **"+"** no canto superior direito
4. Selecione **"New repository"**

### 1.2 - Configure o Repositório
- **Repository name:** `markt-download` (ou outro nome)
- **Description:** `Página de download - Markt Familiar`
- **Visibilidade:** `Public` (importante para Railway detectar)
- Clique em **"Create repository"**

### 1.3 - Clone o Repositório Localmente
Abra o terminal/PowerShell e execute:

```bash
git clone https://github.com/SEU_USUARIO/markt-download.git
cd markt-download
```

---

## 📁 PASSO 2: Preparar os Arquivos

### 2.1 - Copie os Arquivos para a Pasta
1. Coloque o arquivo `markt-download.html` na raiz da pasta
2. **Renomeie** para `index.html` (importante!)

Sua pasta deve ficar assim:
```
markt-download/
├── index.html           ← Seu arquivo (renomeado)
├── .git/
└── (outros arquivos do git)
```

### 2.2 - Crie um Arquivo `package.json`
Na mesma pasta, crie um arquivo `package.json` com:

```json
{
  "name": "markt-download",
  "version": "1.0.0",
  "description": "Página de download - Markt Familiar",
  "main": "index.html",
  "scripts": {
    "start": "npx http-server -p $PORT"
  },
  "keywords": ["markt", "familiar"],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "http-server": "^14.1.1"
  }
}
```

Sua pasta fica assim agora:
```
markt-download/
├── index.html
├── package.json        ← Novo arquivo
└── .git/
```

---

## 🔼 PASSO 3: Fazer Upload para GitHub

No terminal/PowerShell, execute:

```bash
# Verifica os arquivos
git status

# Adiciona todos os arquivos
git add .

# Faz o commit
git commit -m "Adiciona página de download Markt Familiar"

# Envia para GitHub
git push origin main
```

✅ Seus arquivos estão agora no GitHub!

---

## 🚄 PASSO 4: Conectar Railway

### 4.1 - Acesse Railway
1. Vá para [railway.app](https://railway.app)
2. Faça login (use sua conta GitHub para facilitar)
3. Clique em **"New Project"**

### 4.2 - Selecione "Deploy from GitHub"
1. Clique em **"Deploy from GitHub Repo"**
2. Autorize Railway a acessar seu GitHub
3. Na lista de repositórios, procure por **`markt-download`**
4. Clique nele para selecionar

### 4.3 - Configure o Deployment
1. Railway vai detectar que é um projeto Node.js
2. A variável de ambiente `PORT` será definida automaticamente
3. Clique em **"Deploy"**

⏳ Railway começará a fazer o build automaticamente...

---

## 📊 PASSO 5: Acompanhar o Deployment

### 5.1 - Veja o Status
- Você verá um log em tempo real
- Procure por mensagens como:
  ```
  ✓ Build successful
  ✓ Server running on port...
  ```

### 5.2 - Obter a URL
Quando o deployment terminar:
1. No painel do Railway, clique em **"Settings"**
2. Procure por **"Domain"** ou **"Public URL"**
3. Você receberá uma URL como: `https://markt-download-production.up.railway.app`

---

## ✨ PASSO 6: Testar a Página

1. Clique no link da URL do Railway
2. Sua página deve aparecer perfeitamente!
3. Teste os botões e verifique o responsivo (mobile)

---

## 🔗 PASSO 7: Integrar com os Arquivos APK/AAB

Para que os botões de download funcionem, você precisa:

### Opção A: Usar Railway para servir os arquivos também
1. Suba os arquivos `Markt.apk` e `Markt.aab` para o repositório
2. Modifique o `index.html` nos botões:

```html
<!-- Antes: -->
<button class="download-btn" onclick="downloadAPK()">

<!-- Depois: -->
<a href="/Markt.apk" download class="download-btn">
```

### Opção B: Usar link externo (mais simples)
Se os arquivos estão em outro lugar (Google Drive, etc), no `index.html`:

```html
<a href="https://seu-link-de-download.com/Markt.apk" class="download-btn">
```

---

## 🔄 PASSO 8: Atualizar a Página (sempre que mudar)

Sempre que quiser atualizar, é fácil:

```bash
# Faça as mudanças no index.html

# Depois execute:
git add .
git commit -m "Atualiza página com novas features"
git push origin main
```

Railway **detecta automaticamente** a mudança e faz o redeploy! ✨

---

## 🎯 Resumo Rápido

| Passo | O que fazer | Status |
|-------|-----------|--------|
| 1 | Criar repositório GitHub | ✅ |
| 2 | Copiar arquivos (renomear para `index.html`) | ✅ |
| 3 | Criar `package.json` | ✅ |
| 4 | Fazer push no GitHub | ✅ |
| 5 | Conectar Railway | ✅ |
| 6 | Fazer deploy | ✅ |
| 7 | Testar a URL | ✅ |
| 8 | Compartilhar com todos! | 🎉 |

---

## 🆘 Troubleshooting

### ❌ "Build failed"
- Verifique se o `package.json` está correto
- Confirme que o arquivo é `index.html` (não `markt-download.html`)

### ❌ "Port not found"
- Certifique-se que o script `start` tem `$PORT` definido

### ❌ Página em branco
- Verifique o console do navegador (F12)
- Procure por erros de CSS ou JavaScript

### ❌ Página muito lenta
- Railway tem servidor grátis, é normal
- Considere fazer upgrade ou usar Vercel para melhor performance

---

## 📱 Seu Site ao Vivo!

Após completar todos os passos, você terá:
- ✅ Página hospedada e ao vivo
- ✅ URL própria para compartilhar
- ✅ Atualizações automáticas via GitHub
- ✅ Pronto para receber downloads

**Compartilhe a URL com:**
- Familia
- Amigos
- Redes sociais
- Documentação do projeto

---

## 💡 Dicas Extras

### Customizar a URL (opcional)
1. No Railway, vá em **Settings**
2. Em **Domain**, clique em **"Generate Domain"** ou adicione um domínio próprio
3. Se tiver domínio próprio, aponte o DNS para Railway

### Adicionar mais páginas
Se quiser adicionar mais páginas (ex: `sobre.html`, `contato.html`):
1. Crie os arquivos na mesma pasta
2. Faça `git push`
3. Railway faz o deploy automaticamente

### Monitorar Performance
- No painel Railway, você vê logs em tempo real
- Pode ver quantas vezes a página foi acessada
- Monitore a CPU e memória usada

---

**🎉 Pronto! Sua página está ao vivo no Railway!**

Qualquer dúvida, posso ajudar com os comandos específicos.
