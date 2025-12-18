# 💾 Guia de Salvamento do Projeto

## 📋 Como Salvar o Projeto

### Método Rápido (Recomendado)

**Opção 1: Usando o script .bat (mais fácil)**
```
1. Clique duas vezes em: SALVAR_PROJETO.bat
2. Aguarde o processo terminar
3. Pronto! Projeto salvo e backup criado
```

**Opção 2: Usando o script PowerShell**
```
1. Clique com botão direito em: SALVAR_PROJETO.ps1
2. Selecione: "Executar com PowerShell"
3. Aguarde o processo terminar
```

### O que o script faz:

✅ **Salva todas as mudanças no Git** (se disponível)
- Adiciona todos os arquivos modificados
- Cria um commit automático com data/hora
- Se não houver repositório Git, inicializa um novo

✅ **Cria backup compactado (.zip)**
- Salva todos os arquivos importantes
- Exclui node_modules (pode ser reinstalado)
- Armazena na pasta `backups/`
- Nome do arquivo: `backup_projeto_AAAA-MM-DD_HH-mm-ss.zip`

✅ **Registra todas as mudanças**
- Cria arquivo `MUDANCAS_SALVAS.txt` com resumo
- Cria log detalhado na pasta `backups/`
- Inclui data/hora do salvamento

## 📁 Estrutura de Backups

```
projeto srk/
├── backups/                    ← Pasta de backups
│   ├── backup_projeto_2024-01-15_14-30-00.zip
│   ├── backup_projeto_2024-01-15_15-45-00.zip
│   └── REGISTRO_SALVAMENTO_2024-01-15_14-30-00.txt
├── MUDANCAS_SALVAS.txt         ← Resumo das mudanças
└── ...
```

## 🔄 Restaurar um Backup

### Passo a passo:

1. **Localize o backup**
   - Vá para a pasta `backups/`
   - Escolha o backup mais recente (ou o desejado)

2. **Extraia o arquivo .zip**
   - Clique com botão direito no arquivo .zip
   - Selecione "Extrair tudo..."
   - Escolha uma pasta temporária

3. **Copie os arquivos de volta**
   - Copie todos os arquivos extraídos
   - Cole na pasta do projeto (substitua os existentes)

4. **Reinstale as dependências**
   ```bash
   npm install
   ```

5. **Pronto!**
   - Seu projeto foi restaurado

## 🚀 Salvamento Automático com Git

### Configurar Git (primeira vez):

1. **Instalar Git** (se ainda não tiver)
   - Baixe em: https://git-scm.com/download/win
   - Siga as instruções em: `CONFIGURAR_GIT_POS_INSTALACAO.md`

2. **Configurar Git** (após instalar):
   ```powershell
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@exemplo.com"
   ```

3. **Usar o script de salvamento**
   - O script detecta automaticamente o Git
   - Cria commits automáticos a cada salvamento

### Enviar para GitHub (opcional):

1. **Criar repositório no GitHub**
   - Acesse: https://github.com/new
   - Crie um novo repositório

2. **Conectar ao GitHub**:
   ```powershell
   git remote add origin https://github.com/seu-usuario/seu-repositorio.git
   git branch -M main
   git push -u origin main
   ```

3. **Enviar mudanças futuras**:
   ```powershell
   git push
   ```

## 📝 Quando Salvar

Salve o projeto regularmente, especialmente:

- ✅ Antes de fazer mudanças grandes
- ✅ Após implementar novas funcionalidades
- ✅ Antes de atualizar dependências
- ✅ Ao final de cada dia de trabalho
- ✅ Antes de fazer testes experimentais

## 🔒 Segurança dos Backups

### O que é salvo:
- ✅ Todo o código fonte (`src/`)
- ✅ Configurações (`package.json`, `vite.config.ts`, etc.)
- ✅ Documentação (`*.md`, `*.txt`)
- ✅ Scripts (`*.bat`, `*.ps1`)
- ✅ Arquivos públicos (`public/`)

### O que NÃO é salvo:
- ❌ `node_modules/` (pode ser reinstalado)
- ❌ `dist/` (pode ser reconstruído)
- ❌ Arquivos temporários
- ❌ Logs

## 💡 Dicas

1. **Backups regulares**
   - Execute o script de salvamento diariamente
   - Mantenha pelo menos os últimos 5 backups

2. **Backup em múltiplos locais**
   - Salve backups em pendrive
   - Use serviços de nuvem (Google Drive, OneDrive)
   - Configure GitHub para backup remoto

3. **Organização**
   - Os backups são nomeados com data/hora
   - Fácil identificar qual backup usar

4. **Espaço em disco**
   - Backups excluem `node_modules` (economiza espaço)
   - Cada backup tem ~1-5 MB (dependendo do projeto)

## ❓ Problemas Comuns

### "PowerShell não encontrado"
- Use o arquivo `.bat` em vez do `.ps1`
- Ou instale PowerShell (já vem no Windows 10+)

### "Git não disponível"
- Não é obrigatório, mas recomendado
- O backup ainda funciona sem Git
- Instale Git seguindo: `CONFIGURAR_GIT_POS_INSTALACAO.md`

### "Erro ao criar backup"
- Verifique se tem espaço em disco
- Verifique permissões de escrita na pasta
- Tente executar como administrador

### "Backup muito grande"
- Normal se incluir `node_modules`
- O script já exclui `node_modules` automaticamente
- Se ainda estiver grande, verifique outros arquivos grandes

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs em `backups/REGISTRO_SALVAMENTO_*.txt`
2. Leia `MUDANCAS_SALVAS.txt` para ver o último status
3. Verifique se todos os arquivos estão salvos corretamente

---

**Última atualização:** Criado sistema completo de salvamento e backup automático






