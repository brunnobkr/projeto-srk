# 📤 Guia para Subir o Projeto no GitHub

## Passo a Passo Completo

### 1️⃣ Verificar se o Git está instalado

Abra o terminal/PowerShell e execute:
```bash
git --version
```

Se não estiver instalado, baixe em: https://git-scm.com/downloads

### 2️⃣ Inicializar o repositório Git (se ainda não foi feito)

```bash
cd "C:\Users\br998\Documents\projeto srk"
git init
```

### 3️⃣ Adicionar todos os arquivos

```bash
git add .
```

### 4️⃣ Fazer o primeiro commit

```bash
git commit -m "Initial commit: Sistema de Controle ITCC Sumitomo S-riko"
```

### 5️⃣ Criar repositório no GitHub

1. Acesse https://github.com
2. Faça login na sua conta
3. Clique no botão **"+"** no canto superior direito
4. Selecione **"New repository"**
5. Preencha:
   - **Repository name**: `sumitomo-sriko-itcc` (ou o nome que preferir)
   - **Description**: "Sistema de Controle ITCC para Sumitomo S-riko"
   - **Visibility**: Escolha **Private** (recomendado) ou **Public**
   - **NÃO marque** "Initialize this repository with a README" (já temos um)
6. Clique em **"Create repository"**

### 6️⃣ Conectar o repositório local ao GitHub

Após criar o repositório, o GitHub mostrará comandos. Use estes:

```bash
git remote add origin https://github.com/SEU-USUARIO/sumitomo-sriko-itcc.git
```

**Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub!**

### 7️⃣ Renomear branch principal (se necessário)

```bash
git branch -M main
```

### 8️⃣ Fazer push para o GitHub

```bash
git push -u origin main
```

Se pedir credenciais:
- **Usuário**: Seu nome de usuário do GitHub
- **Senha**: Use um **Personal Access Token** (não sua senha do GitHub)

### 9️⃣ Criar Personal Access Token (se necessário)

Se o GitHub pedir autenticação:

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome (ex: "Projeto SRK")
4. Selecione as permissões:
   - ✅ `repo` (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você não verá novamente!)
7. Use este token como senha quando o Git pedir

## 🔄 Comandos para Atualizações Futuras

Sempre que fizer alterações no código:

```bash
# 1. Ver o status das alterações
git status

# 2. Adicionar arquivos alterados
git add .

# 3. Fazer commit com mensagem descritiva
git commit -m "Descrição das alterações feitas"

# 4. Enviar para o GitHub
git push
```

## 📋 Checklist Antes de Fazer Push

- ✅ Verificar se `.gitignore` está correto (já está configurado)
- ✅ Não commitar `node_modules/` (já está no .gitignore)
- ✅ Não commitar arquivos `.env` com senhas (já está no .gitignore)
- ✅ README.md criado
- ✅ SECURITY.md criado

## ⚠️ Importante

1. **Senha de Segurança**: A senha `SRK2024DEV@SECURE` está no código, mas está documentada. Se quiser, pode criar um arquivo `.env` e mover a senha para lá (não será commitado).

2. **Credenciais**: O usuário admin padrão (`admin`/`admin2020`) está no código. Em produção, certifique-se de alterar essas credenciais.

3. **Repositório Privado**: Recomendo criar o repositório como **Private** no GitHub para maior segurança.

## 🆘 Problemas Comuns

### Erro: "fatal: not a git repository"
**Solução**: Execute `git init` primeiro

### Erro: "remote origin already exists"
**Solução**: 
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/sumitomo-sriko-itcc.git
```

### Erro de autenticação
**Solução**: Use Personal Access Token em vez da senha do GitHub

### Erro: "failed to push some refs"
**Solução**: 
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## 📞 Precisa de Ajuda?

Se encontrar problemas, verifique:
- Se o Git está instalado corretamente
- Se você tem permissão no repositório do GitHub
- Se a URL do repositório está correta
- Se o Personal Access Token tem as permissões corretas

