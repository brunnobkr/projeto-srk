# 🏭 Sumitomo S-riko - Sistema de Controle ITCC

Sistema completo de controle de documentação ITCC para a Sumitomo S-riko, empresa multinacional de fornecimento de tubulações para carros, motos e caminhões.

## 📋 Sobre o Projeto

Sistema desenvolvido para gerenciar documentações de produção, engenharia e almoxarifado, incluindo:

- **Receitas de Máquina**: Configurações para ajustar máquinas (angulação, velocidade, distância, inserção de conectores)
- **Controle de Produção**: Quantidade por hora/30 minutos, tempo de montagem, mão de obra
- **Controle de Funcionários**: Faltas, ausências, tempo ocioso, transferências
- **Problemas Técnicos**: Mecânicos, elétricos e falhas do sistema
- **Mudanças e Melhorias**: Atualizações e ajustes pela engenharia
- **Instruções de Trabalho**: Passo a passo para preparadores e funcionários
- **Componentes por Código**: Lista de componentes necessários para cada produto
- **Segurança do Trabalho**: Procedimentos e check-ups obrigatórios
- **Chat Interno**: Sistema de mensagens com suporte a texto, áudio, fotos e vídeos
- **Dashboard Administrativo**: Controle detalhado de produção, problemas e acidentes

## 🚀 Tecnologias Utilizadas

- **React 18** com TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **React Router** - Navegação
- **Recharts** - Gráficos e visualizações
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas
- **LocalStorage/SessionStorage** - Persistência de dados

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/sumitomo-sriko-itcc.git
cd sumitomo-sriko-itcc
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:5173
```

## 🔐 Credenciais Padrão

**Usuário Administrador Inicial:**
- **Usuário**: `admin`
- **Senha**: `admin2020`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro acesso!

## 🔒 Segurança

Este sistema possui proteções de segurança implementadas. Para mais informações, consulte o arquivo [SECURITY.md](./SECURITY.md).

### Senha de Desenvolvimento
- **Senha**: `SRK2024DEV@SECURE`
- Necessária apenas em produção
- Em desenvolvimento local, as proteções são desabilitadas automaticamente

## 📁 Estrutura do Projeto

```
projeto srk/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # Contextos React (Auth, etc)
│   ├── pages/           # Páginas da aplicação
│   ├── types/           # Definições TypeScript
│   ├── utils/           # Funções utilitárias (storage, security)
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Ponto de entrada
├── public/              # Arquivos estáticos
├── index.html           # HTML principal
├── package.json         # Dependências
├── vite.config.ts       # Configuração do Vite
├── tailwind.config.js   # Configuração do Tailwind
└── tsconfig.json        # Configuração TypeScript
```

## 🎯 Funcionalidades Principais

### Módulos de Produção
- ✅ Receitas de Máquina com configurações detalhadas
- ✅ Controle de Produção em tempo real
- ✅ Controle de Funcionários com presença/faltas
- ✅ Problemas Técnicos (Mecânico, Elétrico, Sistema)
- ✅ Mudanças e Melhorias pela Engenharia

### Módulos de Documentação
- ✅ Instruções de Trabalho passo a passo
- ✅ Componentes por Código de Produto
- ✅ Segurança do Trabalho
- ✅ Histórico de Versões para todas as alterações

### Módulos Administrativos
- ✅ Dashboard Admin com gráficos e métricas
- ✅ Gerenciamento de Usuários
- ✅ Gerenciamento de Setores e Linhas
- ✅ Programação de Pedidos (Logística)
- ✅ Chamados de Manutenção (Mecânica, Elétrica, Ferramentaria, TI)

### Comunicação
- ✅ Chat interno entre usuários
- ✅ Envio de mensagens de texto
- ✅ Envio de áudios (gravação)
- ✅ Envio de fotos
- ✅ Envio de vídeos
- ✅ Sistema de notificações

## 👥 Permissões e Acessos

O sistema possui controle de acesso baseado em funções:

- **Administrador Padrão**: Acesso total ao sistema
- **Engenharia**: Acesso a receitas, componentes, instruções e segurança
- **Logística**: Programação de pedidos e notificações
- **Central de Mecânica**: Chamados de manutenção
- **TI**: Chamados de sistema
- **Segurança do Trabalho**: Documentação de segurança

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 🏢 Informações da Empresa

- **Nome**: Sumitomo S-riko
- **CNPJ**: 60.689.346/0001-70
- **Localização**: Juatuba - MG

## 📄 Licença

Este projeto é privado e de propriedade da Sumitomo S-riko.

## 👨‍💻 Desenvolvimento

Sistema desenvolvido para controle interno de documentação ITCC.

---

**⚠️ ATENÇÃO**: Este sistema contém informações sensíveis. Mantenha as credenciais seguras e não compartilhe publicamente.
