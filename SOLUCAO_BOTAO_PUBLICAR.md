# 🔧 Solução: Botão "Publicar" Não Aparece

## 🔍 Diagnóstico

O botão "Publish Branch" pode não aparecer por alguns motivos:

1. **Não está logado no GitHub no Cursor**
2. **Extensão do GitHub não está totalmente configurada**
3. **Precisa recarregar a janela do Cursor**

---

## ✅ Soluções (Tente nesta ordem)

### Solução 1: Recarregar a Janela do Cursor

1. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
2. Digite: `Reload Window`
3. Selecione: **"Developer: Reload Window"**
4. Aguarde o Cursor recarregar
5. Abra o Source Control novamente (`Ctrl+Shift+G`)
6. Verifique se o botão "Publish Branch" aparece

---

### Solução 2: Verificar Autenticação do GitHub

1. Pressione `Ctrl+Shift+P`
2. Digite: `GitHub: Sign in`
3. Selecione: **"GitHub: Sign in"**
4. Siga as instruções para fazer login
5. Após login, recarregue a janela (`Ctrl+Shift+P` → `Reload Window`)
6. Abra o Source Control novamente

---

### Solução 3: Publicar Manualmente via Terminal

Se o botão ainda não aparecer, você pode publicar manualmente:

#### Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `sumitomo-sriko-itcc` (ou o nome que preferir)
3. Escolha: **Private** (recomendado) ou **Public**
4. **NÃO marque** "Initialize with README"
5. Clique em **"Create repository"**

#### Passo 2: Conectar e Publicar

Abra o terminal no Cursor (`Ctrl+`` `) e execute:

```powershell
# Conectar ao repositório (substitua SEU-USUARIO e SEU-REPOSITORIO)
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Verificar se foi conectado
git remote -v

# Publicar no GitHub
git push -u origin main
```

**Exemplo:**
```powershell
git remote add origin https://github.com/brunnobkr/sumitomo-sriko-itcc.git
git push -u origin main
```

---

### Solução 4: Usar GitHub Desktop

Se preferir uma interface gráfica:

1. Baixe o GitHub Desktop: https://desktop.github.com/
2. Instale e faça login
3. No GitHub Desktop:
   - Clique em **"File"** → **"Add Local Repository"**
   - Selecione a pasta: `C:\Users\br998\Documents\projeto srk`
   - Clique em **"Publish repository"**
   - Escolha se quer público ou privado
   - Clique em **"Publish Repository"**

---

## 🔍 Verificações Adicionais

### Verificar se está no Source Control correto:

1. Certifique-se de estar na aba **"Source Control"** (ícone de Git)
2. Não confunda com "Explorer" ou outras abas
3. Use o atalho: `Ctrl+Shift+G` para garantir

### Verificar se há commits:

Execute no terminal:
```powershell
git log --oneline
```

Se aparecer commits, está tudo certo!

---

## 📋 Checklist

- [ ] Cursor foi recarregado (`Ctrl+Shift+P` → `Reload Window`)
- [ ] Está logado no GitHub (`Ctrl+Shift+P` → `GitHub: Sign in`)
- [ ] Está na aba Source Control (`Ctrl+Shift+G`)
- [ ] Há commits no repositório (`git log` mostra commits)
- [ ] Tentou a Solução 3 (publicar manualmente)

---

## 🎯 Método Mais Confiável

**Recomendo usar a Solução 3 (Terminal)** - É mais direto e sempre funciona:

1. Crie o repositório no GitHub (https://github.com/new)
2. Execute os comandos no terminal do Cursor
3. Pronto! Seu código estará no GitHub

---

## 💡 Dica

Após publicar, configure o GitHub Pages:
1. Vá em `Settings` → `Pages` no repositório
2. Em `Source`, selecione **GitHub Actions**
3. Salve

O workflow já está configurado e fará o deploy automaticamente! 🚀

