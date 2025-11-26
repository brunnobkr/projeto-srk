# 🚀 Início Rápido: Publicar no GitHub

## ✅ Você já tem a extensão do GitHub no Cursor aceita!

### 🎯 Método Mais Fácil (Recomendado)

#### **Usar a Extensão do GitHub no Cursor:**

1. **Abra o Source Control:**
   - Pressione `Ctrl+Shift+G`
   - OU clique no ícone de Git na barra lateral esquerda

2. **Inicialize o Repositório:**
   - Se aparecer "Initialize Repository", clique nele

3. **Adicione os Arquivos:**
   - Clique em **"Stage All Changes"** (ou no "+" ao lado de cada arquivo)

4. **Faça o Commit:**
   - Digite: `Configuração completa para GitHub Pages`
   - Pressione `Ctrl+Enter` ou clique em "Commit"

5. **Publique no GitHub:**
   - Clique em **"Publish Branch"** ou **"Publish to GitHub"**
   - Escolha se quer repositório público ou privado
   - O Cursor criará o repositório e fará o upload automaticamente! 🎉

---

### 🔧 Método Alternativo: Script PowerShell

Se preferir usar linha de comando:

1. **Execute o script:**
   ```powershell
   .\CONFIGURAR_GITHUB.ps1
   ```

2. **Siga as instruções na tela**

---

### 📋 O que será enviado?

✅ **Será enviado:**
- Todo o código fonte (`src/`)
- Arquivos de configuração (`package.json`, `vite.config.ts`, etc.)
- Arquivos públicos (`public/`)
- Workflow do GitHub Actions (`.github/workflows/`)
- Documentação

❌ **NÃO será enviado** (já está no `.gitignore`):
- `node_modules/` (muito grande)
- `dist/` (será gerado automaticamente)
- Arquivos de cache

---

### 🎉 Após Publicar

1. **Acesse seu repositório:**
   - Vá para: `https://github.com/SEU-USUARIO/SEU-REPOSITORIO`

2. **Configure GitHub Pages:**
   - Vá em `Settings` → `Pages`
   - Em `Source`, selecione **GitHub Actions**
   - Salve

3. **Aguarde o deploy:**
   - Vá em `Actions` no GitHub
   - Aguarde o workflow completar (ícone verde ✓)
   - Acesse: `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`

---

### 📚 Documentação Completa

- `USAR_EXTENSAO_GITHUB_CURSOR.md` - Guia detalhado da extensão
- `GUIA_GITHUB.md` - Guia completo do GitHub
- `GUIA_GITHUB_PAGES.md` - Guia para GitHub Pages
- `ARQUIVOS_PARA_UPLOAD.md` - Lista completa de arquivos

---

### ⚡ Resumo Ultra-Rápido

1. `Ctrl+Shift+G` → Abrir Source Control
2. "Stage All Changes" → Adicionar arquivos
3. Digite mensagem → "Commit"
4. "Publish Branch" → Publicar no GitHub
5. Configurar GitHub Pages → Pronto! 🎉


