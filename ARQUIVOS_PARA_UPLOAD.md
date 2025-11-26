# 📦 Arquivos Necessários para Upload no GitHub

## ✅ Arquivos OBRIGATÓRIOS (Devem ser commitados)

### 📁 Configuração do Projeto (Raiz)
```
✅ package.json              - Dependências e scripts do projeto
✅ package-lock.json         - Versões exatas das dependências
✅ vite.config.ts            - Configuração do Vite (com base path para GitHub Pages)
✅ tsconfig.json             - Configuração do TypeScript
✅ tsconfig.node.json        - Configuração TypeScript para Node
✅ tailwind.config.js        - Configuração do Tailwind CSS
✅ postcss.config.js         - Configuração do PostCSS
✅ index.html                - HTML principal da aplicação
✅ .gitignore                - Arquivos a serem ignorados pelo Git
```

### 📁 Código Fonte (src/)
```
✅ src/
   ✅ main.tsx               - Ponto de entrada da aplicação
   ✅ App.tsx                 - Componente principal
   ✅ index.css               - Estilos globais
   
   ✅ components/
      ✅ Layout.tsx
      ✅ ProtectedRoute.tsx
      ✅ HistoricoModal.tsx
   
   ✅ contexts/
      ✅ AuthContext.tsx
   
   ✅ pages/
      ✅ Login.tsx
      ✅ Registro.tsx
      ✅ Dashboard.tsx
      ✅ DashboardAdmin.tsx
      ✅ ReceitasMaquina.tsx
      ✅ ControleProducao.tsx
      ✅ ControleFuncionarios.tsx
      ✅ ProblemasTecnicos.tsx
      ✅ MudancasMelhorias.tsx
      ✅ InstrucoesTrabalho.tsx
      ✅ ComponentesProduto.tsx
      ✅ SegurancaTrabalho.tsx
      ✅ MeuPerfil.tsx
      ✅ GerenciarUsuarios.tsx
      ✅ ProgramacaoPedidos.tsx
      ✅ GerenciarSetoresLinhas.tsx
      ✅ CentralMecanica.tsx
      ✅ ChamadosTI.tsx
      ✅ ChamadosManutencao.tsx
      ✅ Chat.tsx
      ✅ Equipe.tsx
   
   ✅ types/
      ✅ index.ts
   
   ✅ utils/
      ✅ storage.ts
      ✅ security.ts
      ✅ turno.ts
```

### 📁 Arquivos Públicos (public/)
```
✅ public/
   ✅ 404.html                - Redirecionamento para SPA (GitHub Pages)
   ✅ sw.js                    - Service Worker para PWA
   ✅ manifest.json            - Manifest do PWA
   ✅ icon-192.png            - Ícone 192x192
   ✅ icon-512.png            - Ícone 512x512
```

### 📁 GitHub Actions (.github/)
```
✅ .github/
   ✅ workflows/
      ✅ deploy.yml           - Workflow de deploy automático
```

### 📁 Documentação (Opcional mas recomendado)
```
✅ README.md                  - Documentação principal
✅ README_APP.md              - Documentação do app
✅ GUIA_GITHUB.md             - Guia para usar GitHub
✅ GUIA_GITHUB_PAGES.md       - Guia para GitHub Pages
✅ RESUMO_MUDANCAS_GITHUB_PAGES.md
✅ GUIA_INSTALACAO.md
✅ SECURITY.md
✅ INICIO_RAPIDO.md
✅ CRIAR_ICONES.md
```

## ❌ Arquivos que NÃO devem ser commitados (já no .gitignore)

```
❌ node_modules/              - Dependências (instaladas via npm install)
❌ dist/                      - Build de produção (gerado automaticamente)
❌ .vite/                     - Cache do Vite
❌ .env                       - Variáveis de ambiente (se houver)
❌ *.log                      - Arquivos de log
❌ .DS_Store                  - Arquivos do macOS
❌ .idea/                     - Configurações do IDE
❌ .vscode/                   - Configurações do VS Code
```

## 📋 Checklist Antes do Upload

### 1. Verificar Arquivos Essenciais
- [ ] `package.json` existe
- [ ] `vite.config.ts` existe e está configurado
- [ ] `index.html` existe
- [ ] Pasta `src/` com todo o código
- [ ] Pasta `public/` com assets
- [ ] `.github/workflows/deploy.yml` existe

### 2. Verificar que Arquivos Sensíveis NÃO estão incluídos
- [ ] `.env` não está no repositório (já no .gitignore)
- [ ] `node_modules/` não está no repositório (já no .gitignore)
- [ ] `dist/` não está no repositório (já no .gitignore)

### 3. Verificar Arquivos Novos para GitHub Pages
- [ ] `public/404.html` existe
- [ ] `.github/workflows/deploy.yml` existe
- [ ] `vite.config.ts` tem configuração de base path

## 🚀 Comandos para Fazer Upload

### Primeira vez (se ainda não inicializou Git):
```bash
# 1. Inicializar repositório Git
git init

# 2. Adicionar todos os arquivos (exceto os no .gitignore)
git add .

# 3. Verificar o que será commitado
git status

# 4. Fazer primeiro commit
git commit -m "Initial commit: Sistema ITCC configurado para GitHub Pages"

# 5. Adicionar remote do GitHub (substitua pela URL do seu repositório)
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# 6. Renomear branch para main (se necessário)
git branch -M main

# 7. Fazer push
git push -u origin main
```

### Atualizações futuras:
```bash
# 1. Ver status das mudanças
git status

# 2. Adicionar arquivos alterados
git add .

# 3. Fazer commit
git commit -m "Descrição das alterações"

# 4. Fazer push
git push
```

## 📊 Tamanho Aproximado

- **Código fonte**: ~500 KB - 1 MB
- **Documentação**: ~100 KB
- **Ícones**: ~50 KB
- **Total (sem node_modules)**: ~1-2 MB

## ⚠️ Importante

1. **NÃO commite `node_modules/`** - É muito grande e será instalado via `npm install`
2. **NÃO commite `dist/`** - É gerado automaticamente no build
3. **NÃO commite arquivos `.env`** - Podem conter informações sensíveis
4. **O GitHub Actions fará o build automaticamente** - Não precisa commitar a pasta `dist/`

## 🔍 Verificar o que será commitado

Antes de fazer commit, sempre verifique:

```bash
git status
```

Este comando mostra:
- ✅ Arquivos que serão adicionados (verde)
- ❌ Arquivos ignorados pelo .gitignore (não aparecem)
- ⚠️ Arquivos não rastreados (aparecem em vermelho)

## 📝 Estrutura Final no GitHub

Após o upload, seu repositório deve ter esta estrutura:

```
seu-repositorio/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   ├── 404.html
│   ├── sw.js
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## ✅ Resumo Rápido

**Para fazer upload, você precisa:**
1. ✅ Todo o código em `src/`
2. ✅ Arquivos de configuração (package.json, vite.config.ts, etc.)
3. ✅ Arquivos públicos (public/)
4. ✅ Workflow do GitHub Actions (.github/workflows/)
5. ✅ Documentação (opcional mas recomendado)

**NÃO precisa:**
- ❌ node_modules/ (será instalado automaticamente)
- ❌ dist/ (será gerado automaticamente)
- ❌ Arquivos de cache (.vite/)


