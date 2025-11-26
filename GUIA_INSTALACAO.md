# Guia de Instalação e Uso do App ITCC

## 📱 Como Instalar como App (PWA)

### No Computador (Chrome/Edge):

1. **Acesse o site** no navegador Chrome ou Edge
2. **Procure o ícone de instalação** na barra de endereços (ao lado da URL)
3. **Clique em "Instalar"** quando aparecer a opção
4. O app será instalado e poderá ser aberto como um aplicativo independente

### No Celular (Android):

1. **Abra o Chrome** no seu celular
2. **Acesse o site**
3. **Toque no menu** (três pontos) no canto superior direito
4. **Selecione "Adicionar à tela inicial"** ou "Instalar app"
5. O app aparecerá na sua tela inicial como um aplicativo

### No iPhone/iPad (Safari):

1. **Abra o Safari** no seu iPhone/iPad
2. **Acesse o site**
3. **Toque no botão de compartilhar** (quadrado com seta)
4. **Role para baixo e toque em "Adicionar à Tela de Início"**
5. O app aparecerá na sua tela inicial

---

## 🚀 Como Rodar o App Localmente

### Opção 1: Modo Desenvolvimento (para testes)

```bash
npm run dev
```

O app estará disponível em: `http://localhost:5173`

### Opção 2: Build de Produção (para uso real)

1. **Criar o build:**
```bash
npm run build
```

2. **Visualizar o build:**
```bash
npm run preview
```

O app estará disponível em: `http://localhost:4173`

---

## 📦 Como Compartilhar o App

### Opção 1: Servidor Local na Rede

1. **Encontre seu IP local:**
   - Windows: `ipconfig` (procure por "IPv4 Address")
   - Mac/Linux: `ifconfig` ou `ip addr`

2. **Inicie o servidor:**
```bash
npm run dev
```

3. **Compartilhe o endereço:**
   - `http://SEU_IP:5173` (ex: `http://192.168.1.100:5173`)
   - Outros dispositivos na mesma rede podem acessar

### Opção 2: Túnel (Acesso Remoto)

#### Usando ngrok:

1. **Instale o ngrok:** https://ngrok.com/
2. **Inicie o app:**
```bash
npm run dev
```

3. **Em outro terminal, crie o túnel:**
```bash
ngrok http 5173
```

4. **Compartilhe a URL** fornecida pelo ngrok (ex: `https://abc123.ngrok.io`)

#### Usando Cloudflare Tunnel (Gratuito):

1. **Instale cloudflared:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. **Crie o túnel:**
```bash
cloudflared tunnel --url http://localhost:5173
```

---

## 🖥️ Como Servir o Build de Produção

### Usando serve (Recomendado):

1. **Instale o serve globalmente:**
```bash
npm install -g serve
```

2. **Faça o build:**
```bash
npm run build
```

3. **Sirva a pasta dist:**
```bash
serve -s dist -l 5173
```

### Usando Python (se tiver instalado):

```bash
# Python 3
cd dist
python -m http.server 5173
```

### Usando Node.js http-server:

```bash
npm install -g http-server
cd dist
http-server -p 5173
```

---

## 🔧 Configurações Importantes

### Acesso na Rede Local

O app já está configurado para permitir acesso via IP na rede local. Basta iniciar com `npm run dev` e acessar de outros dispositivos usando seu IP.

### PWA (Progressive Web App)

O app está configurado como PWA, permitindo:
- ✅ Instalação como app nativo
- ✅ Funcionamento offline (cache)
- ✅ Ícone na tela inicial
- ✅ Experiência de app nativo

### Build de Produção

O build otimizado está configurado para:
- ✅ Minificação de código
- ✅ Otimização de assets
- ✅ Service Worker para cache
- ✅ Manifest para PWA

---

## 📝 Notas Importantes

1. **Dados Locais:** Os dados são salvos no `localStorage` do navegador. Para backup, exporte os dados ou configure um servidor backend.

2. **Atualizações:** O app verifica atualizações automaticamente quando instalado como PWA.

3. **Offline:** O app funciona parcialmente offline graças ao Service Worker, mas algumas funcionalidades podem precisar de conexão.

4. **Segurança:** Em produção, configure HTTPS para habilitar todas as funcionalidades do PWA.

---

## 🆘 Solução de Problemas

### App não instala?
- Verifique se está usando HTTPS ou localhost
- No Chrome, verifique se o modo de instalação está habilitado

### Não acessa na rede local?
- Verifique o firewall do Windows
- Certifique-se de que está na mesma rede Wi-Fi

### Build não funciona?
- Limpe o cache: `rm -rf dist node_modules/.vite`
- Reinstale dependências: `npm install`
- Tente novamente: `npm run build`

---

## 📞 Suporte

Para mais informações, consulte a documentação do projeto ou entre em contato com o suporte técnico.

