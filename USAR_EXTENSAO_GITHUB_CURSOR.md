# 🚀 Como Usar a Extensão do GitHub no Cursor

## ✅ Você já aceitou a extensão! Agora siga estes passos:

### 📋 Passo a Passo Rápido

#### 1. **Abrir o Source Control**
   - Pressione `Ctrl+Shift+G` (ou `Cmd+Shift+G` no Mac)
   - OU clique no ícone de controle de versão na barra lateral esquerda

#### 2. **Inicializar Repositório (se ainda não foi feito)**
   - No painel Source Control, você verá uma mensagem
   - Clique em **"Initialize Repository"** ou **"Inicializar Repositório"**

#### 3. **Adicionar Arquivos**
   - Todos os arquivos aparecerão na lista
   - Clique no **"+"** ao lado de cada arquivo para adicionar
   - OU clique em **"Stage All Changes"** para adicionar tudo de uma vez

#### 4. **Fazer Commit**
   - Digite uma mensagem de commit (ex: "Configuração para GitHub Pages")
   - Clique em **"Commit"** ou pressione `Ctrl+Enter`

#### 5. **Publicar no GitHub**
   - Após o commit, você verá a opção **"Publish Branch"** ou **"Publicar Branch"**
   - Clique nela
   - Se for a primeira vez, o Cursor vai:
     - Pedir para fazer login no GitHub (se ainda não fez)
     - Perguntar se quer criar um repositório público ou privado
     - Criar o repositório automaticamente
     - Fazer o push dos arquivos

### 🎯 Alternativa: Usar o Menu

1. **Menu Superior**: `View` → `Source Control`
2. **Ou**: Clique no ícone de Git na barra de status (canto inferior)

### 🔧 Se não aparecer a opção "Publish Branch"

1. **Verifique se fez commit:**
   - Você precisa fazer pelo menos um commit primeiro
   - Digite uma mensagem e clique em "Commit"

2. **Verifique se está logado no GitHub:**
   - Vá em `File` → `Preferences` → `Settings`
   - Procure por "GitHub"
   - Verifique se está autenticado

3. **Configure manualmente:**
   - Abra o terminal integrado (`Ctrl+`` `)
   - Execute:
     ```bash
     git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
     git push -u origin main
     ```

### 📝 Mensagem de Commit Sugerida

```
Configuração completa para GitHub Pages - Sistema ITCC Sumitomo S-riko
```

### ⚠️ Importante

- **NÃO adicione** arquivos que estão no `.gitignore`:
  - `node_modules/`
  - `dist/`
  - `.vite/`
  - Arquivos `.log`

- O Cursor respeita automaticamente o `.gitignore` ✅

### 🎉 Após Publicar

1. **Acesse seu repositório no GitHub:**
   - `https://github.com/SEU-USUARIO/SEU-REPOSITORIO`

2. **Configure GitHub Pages:**
   - Vá em `Settings` → `Pages`
   - Em `Source`, selecione **GitHub Actions**
   - Salve

3. **Aguarde o deploy:**
   - Vá em `Actions` no GitHub
   - Aguarde o workflow completar
   - Acesse: `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`

### 🆘 Problemas?

#### "Git não encontrado"
- Instale o Git: https://git-scm.com/download/win
- Reinicie o Cursor

#### "Não consigo fazer login no GitHub"
- Vá em `File` → `Preferences` → `Settings`
- Procure por "GitHub Authentication"
- Siga as instruções para autenticar

#### "Erro ao fazer push"
- Verifique se você tem permissão no repositório
- Verifique se o repositório existe no GitHub
- Tente usar um Personal Access Token

### 📚 Documentação Adicional

- `GUIA_GITHUB.md` - Guia completo do GitHub
- `GUIA_GITHUB_PAGES.md` - Guia para GitHub Pages
- `ARQUIVOS_PARA_UPLOAD.md` - Lista de arquivos necessários


