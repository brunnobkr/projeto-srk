# ⚙️ Configuração do Git Após Instalação

## 📝 Durante a Instalação

### Quando perguntar "Which editor would you like Git to use?"

**✅ Recomendado:**
- **"Visual Studio Code"** (melhor opção)
- **"Cursor"** (se aparecer na lista)
- **"Notepad++"** (alternativa simples)

**❌ Evite:**
- **"Vim"** ou **"Vi"** (difícil para iniciantes)

---

## 🔧 Outras Configurações Durante a Instalação

### 1. **"Adjusting your PATH environment"**
   - ✅ Escolha: **"Git from the command line and also from 3rd-party software"**
   - Isso permite usar Git em qualquer terminal

### 2. **"Choosing the default branch name"**
   - ✅ Escolha: **"Let Git decide"** ou **"main"**
   - Ambos funcionam bem

### 3. **"Configuring the line ending conversions"**
   - ✅ Escolha: **"Checkout Windows-style, commit Unix-style line endings"**
   - Melhor para Windows

### 4. **"Configuring the terminal emulator"**
   - ✅ Escolha: **"Use Windows' default console window"**
   - Funciona bem com PowerShell

### 5. **"Configuring extra options"**
   - ✅ Marque: **"Enable file system caching"**
   - ✅ Marque: **"Enable Git Credential Manager"**
   - Isso facilita o login no GitHub

---

## ✅ Após a Instalação

### 1. **Reinicie o Terminal/PowerShell**
   - Feche e abra novamente o terminal
   - Isso carrega o Git no PATH

### 2. **Verifique se o Git está funcionando:**
   ```powershell
   git --version
   ```
   Deve mostrar algo como: `git version 2.x.x`

### 3. **Configure seu nome e email:**
   ```powershell
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@exemplo.com"
   ```

### 4. **Agora você pode:**
   - Usar o script `CONFIGURAR_GITHUB.ps1`
   - OU usar a extensão do GitHub no Cursor (`Ctrl+Shift+G`)

---

## 🎯 Próximos Passos

Após instalar o Git:

1. **Reinicie o Cursor** (para carregar o Git)
2. **Abra o Source Control** (`Ctrl+Shift+G`)
3. **Siga as instruções em `INICIO_RAPIDO_GITHUB.md`**

---

## 💡 Dica

Se escolher "Visual Studio Code" como editor, o Git abrirá o Cursor automaticamente quando precisar de um editor (por exemplo, para mensagens de commit longas).


