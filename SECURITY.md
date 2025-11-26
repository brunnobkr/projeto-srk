# 🔒 Sistema de Segurança - Sumitomo S-riko

## Senha de Desenvolvimento

**IMPORTANTE**: Este sistema possui proteções de segurança implementadas.

### Senha de Desenvolvimento
A senha de desenvolvimento para acessar o código protegido é: `SRK2024DEV@SECURE`

**⚠️ ATENÇÃO**: 
- Esta senha é necessária apenas em produção
- Em desenvolvimento local (localhost), as proteções são automaticamente desabilitadas
- Mantenha esta senha segura e não a compartilhe publicamente

## Proteções Implementadas

### 1. Autenticação Obrigatória
- Login obrigatório ao acessar o sistema
- Sessão expira ao fechar a aba do navegador (sessionStorage)
- Redirecionamento automático para login se não autenticado

### 2. Proteção de Código
- Detecção de DevTools
- Bloqueio de cópia de texto
- Desabilitação de botão direito
- Proteção contra inspeção de código
- Console desabilitado em produção

### 3. Proteção de Sessão
- Uso de sessionStorage (expira ao fechar aba)
- Limpeza automática ao fechar navegador
- Verificação periódica de autenticação

## Como Funciona

### Em Desenvolvimento (localhost)
- Todas as proteções são desabilitadas automaticamente
- Console e DevTools funcionam normalmente
- Código pode ser inspecionado livremente

### Em Produção
- Proteções ativas
- Senha de desenvolvimento necessária
- DevTools bloqueados
- Código protegido contra inspeção

## Notas Importantes

1. **GitHub**: Este código pode ser compartilhado no GitHub, mas a senha de desenvolvimento deve ser mantida em segredo
2. **Deploy**: Ao fazer deploy, certifique-se de que está em modo produção
3. **Backup**: Mantenha backups seguros da senha de desenvolvimento

## Suporte

Para questões de segurança, entre em contato com o administrador do sistema.

