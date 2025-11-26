# 🚀 Guia Completo: Hospedagem no GitHub Pages

## 📋 Análise do Código Atual

### ✅ O que já está correto:
- Projeto Vite + React configurado
- Service Worker implementado
- PWA com manifest.json
- React Router configurado

### ⚠️ Mudanças Necessárias para GitHub Pages:

#### 1. **Base Path no Vite**
   - **Problema**: GitHub Pages serve o site em `https://usuario.github.io/repositorio/`
   - **Solução**: Configurar `base` no `vite.config.ts`

#### 2. **React Router (BrowserRouter)**
   - **Problema**: GitHub Pages não suporta roteamento baseado em histórico sem configuração
   - **Solução**: Criar arquivo `404.html` que redireciona para `index.html`

#### 3. **Service Worker**
   - **Problema**: Caminhos absolutos não funcionam com base path
   - **Solução**: Ajustar caminhos no service worker para usar base path relativo

#### 4. **Manifest.json**
   - **Problema**: Caminhos absolutos não funcionam com base path
   - **Solução**: Ajustar caminhos para serem relativos ao base path

#### 5. **GitHub Actions Workflow**
   - **Necessário**: Criar workflow para deploy automático

## 🔧 Mudanças Implementadas

### 1. Vite Config (`vite.config.ts`)
- ✅ Adicionado `base` configurável via variável de ambiente
- ✅ Suporta desenvolvimento local (base: '/') e produção (base: '/repositorio/')

### 2. GitHub Actions (`.github/workflows/deploy.yml`)
- ✅ Workflow automático para build e deploy
- ✅ Executa em push para branch `main`
- ✅ Build automático e deploy no GitHub Pages

### 3. Arquivo 404.html
- ✅ Redireciona todas as rotas para `index.html` (necessário para SPAs)
- ✅ Permite que React Router gerencie as rotas

### 4. Service Worker (`public/sw.js`)
- ✅ Ajustado para funcionar com base path dinâmico
- ✅ Detecta automaticamente o base path

### 5. Manifest.json (`public/manifest.json`)
- ✅ Caminhos ajustados para funcionar com base path

### 6. Main.tsx (`src/main.tsx`)
- ✅ Registro do service worker ajustado para base path

## 📝 Passo a Passo para Deploy

### 1. Preparar o Repositório

```bash
# 1. Certifique-se de que está na branch main
git checkout main

# 2. Adicione e commite as mudanças
git add .
git commit -m "Configuração para GitHub Pages"

# 3. Faça push
git push origin main
```

### 2. Configurar GitHub Pages

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione **GitHub Actions**
4. Salve as configurações

### 3. Definir o Nome do Repositório

**IMPORTANTE**: Antes de fazer o deploy, você precisa definir o nome do repositório:

1. Abra o arquivo `.github/workflows/deploy.yml`
2. Procure pela linha: `REPO_NAME: seu-repositorio`
3. Substitua `seu-repositorio` pelo nome real do seu repositório no GitHub
4. Salve e faça commit

**OU** defina como variável de ambiente no GitHub:
- Settings → Secrets and variables → Actions
- Adicione uma variável: `REPO_NAME` = nome do seu repositório

### 4. Verificar o Deploy

1. Após fazer push, vá em **Actions** no GitHub
2. Aguarde o workflow completar (ícone verde ✓)
3. Acesse: `https://seu-usuario.github.io/nome-do-repositorio/`

## 🔍 Verificações Pós-Deploy

### ✅ Checklist:
- [ ] Site carrega corretamente
- [ ] Rotas funcionam (não dá 404)
- [ ] Service Worker registra sem erros
- [ ] PWA funciona (manifest.json carrega)
- [ ] Imagens e assets carregam corretamente
- [ ] Login e autenticação funcionam
- [ ] Navegação entre páginas funciona

## 🐛 Problemas Comuns

### Problema: Página em branco
**Solução**: Verifique se o `base` no `vite.config.ts` está correto

### Problema: Rotas dão 404
**Solução**: Verifique se o arquivo `404.html` está na pasta `public/`

### Problema: Assets não carregam
**Solução**: Verifique se o `base` está configurado corretamente

### Problema: Service Worker não registra
**Solução**: Verifique se o caminho no `main.tsx` está correto com o base path

## 📌 Notas Importantes

1. **Base Path**: O nome do repositório define o base path. Se mudar o nome, atualize o workflow.

2. **Branch**: O workflow está configurado para a branch `main`. Se usar outra branch, atualize o workflow.

3. **HTTPS**: GitHub Pages sempre usa HTTPS, o que é bom para PWAs.

4. **Cache**: Após deploy, limpe o cache do navegador para ver as mudanças.

5. **Build Local**: Teste localmente com `npm run build && npm run preview` antes de fazer deploy.

## 🔄 Atualizações Futuras

Sempre que fizer alterações:
1. Faça commit e push para `main`
2. O GitHub Actions fará o deploy automaticamente
3. Aguarde alguns minutos para o deploy completar

## 📞 Suporte

Se encontrar problemas:
- Verifique os logs em **Actions** no GitHub
- Teste localmente com `npm run preview`
- Verifique se o nome do repositório está correto no workflow


