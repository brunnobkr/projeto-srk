# 📱 App ITCC - Sumitomo S-riko

Sistema de Controle ITCC transformado em Progressive Web App (PWA) instalável.

## ✨ Funcionalidades do App

- ✅ **Instalável** como app nativo no celular e computador
- ✅ **Funciona offline** (com cache)
- ✅ **Atualizações automáticas**
- ✅ **Interface responsiva** para mobile e desktop
- ✅ **Acesso rápido** direto da tela inicial

## 🚀 Como Usar

### 1. Instalar o App

#### No Computador:
1. Abra o site no Chrome ou Edge
2. Clique no ícone de instalação na barra de endereços
3. Confirme a instalação

#### No Celular:
- **Android:** Chrome → Menu → "Adicionar à tela inicial"
- **iPhone:** Safari → Compartilhar → "Adicionar à Tela de Início"

### 2. Rodar Localmente

```bash
# Instalar dependências (primeira vez)
npm install

# Modo desenvolvimento
npm run dev

# Build de produção
npm run build

# Visualizar build
npm run preview
```

### 3. Compartilhar na Rede

```bash
# Iniciar servidor acessível na rede
npm run dev
# Acesse de outros dispositivos: http://SEU_IP:5173
```

## 📦 Estrutura do Projeto

```
projeto srk/
├── public/
│   ├── manifest.json      # Configuração PWA
│   ├── icon-192.png       # Ícone pequeno
│   └── icon-512.png       # Ícone grande
├── src/                   # Código fonte
├── dist/                  # Build de produção (gerado)
└── package.json           # Dependências
```

## 🔧 Configurações

### PWA
- Configurado automaticamente via `vite-plugin-pwa`
- Service Worker para cache offline
- Manifest para instalação

### Build
- Otimizado para produção
- Minificação automática
- Assets otimizados

## 📝 Próximos Passos

1. **Criar ícones personalizados:**
   - Coloque `icon-192.png` e `icon-512.png` na pasta `public/`
   - Veja `CRIAR_ICONES.md` para instruções

2. **Fazer build de produção:**
   ```bash
   npm run build
   ```

3. **Servir o build:**
   ```bash
   npm run preview
   # ou
   serve -s dist -l 5173
   ```

4. **Deploy (opcional):**
   - Vercel, Netlify, ou qualquer servidor web
   - Faça upload da pasta `dist/`

## 🆘 Problemas Comuns

**App não instala?**
- Use HTTPS ou localhost
- Verifique se o manifest.json está acessível

**Ícones não aparecem?**
- Certifique-se de que os arquivos estão em `public/`
- Limpe o cache do navegador

**Build falha?**
- Execute `npm install` novamente
- Limpe `node_modules` e reinstale

## 📚 Documentação

- [Guia de Instalação](GUIA_INSTALACAO.md)
- [Como Criar Ícones](CRIAR_ICONES.md)
- [Como Compartilhar Acesso](COMPARTILHAR_ACESSO.md)

---

**Desenvolvido para Sumitomo S-riko** 🏭

