# 🔓 Como Remover a Proteção por Senha do Sistema

## Método 1: Desabilitar Temporariamente (Recomendado)

Para remover a proteção por senha sem deletar o código, basta alterar uma linha no arquivo `src/utils/security.ts`:

1. Abra o arquivo `src/utils/security.ts`
2. Localize a linha 4:
   ```typescript
   const DISABLE_SECURITY = false;
   ```
3. Altere para:
   ```typescript
   const DISABLE_SECURITY = true;
   ```
4. Salve o arquivo e recarregue a aplicação

**Resultado:** O sistema não pedirá mais senha e todas as proteções serão desabilitadas.

**Para reativar:** Basta alterar de volta para `false`.

---

## Método 2: Remover Completamente (Permanente)

Se você quiser remover completamente o código de proteção:

1. Abra o arquivo `src/main.tsx`
2. Comente ou remova a linha 15:
   ```typescript
   // initSecurity(); // Proteção desabilitada
   ```
3. Salve o arquivo

**Resultado:** O sistema não aplicará nenhuma proteção.

---

## Método 3: Apenas Remover a Senha (Manter Outras Proteções)

Se quiser manter as proteções (DevTools, cópia, etc.) mas remover apenas a senha:

1. Abra o arquivo `src/utils/security.ts`
2. Na função `initSecurity()`, comente ou remova as linhas 195-200:
   ```typescript
   // Verificar senha primeiro
   // const savedPassword = sessionStorage.getItem('srk_dev_password');
   // if (savedPassword !== DEV_PASSWORD) {
   //   if (!checkSecurityPassword()) {
   //     return;
   //   }
   // }
   ```

---

## ⚠️ Importante

- **Método 1 é o mais recomendado** porque permite reativar facilmente se necessário
- A proteção já está **automaticamente desabilitada em desenvolvimento** (localhost)
- Em produção, a proteção ajuda a proteger o código contra inspeção não autorizada

---

## 📝 Nota

A senha de segurança é: `SRK2024DEV@SECURE`

Esta mesma senha é usada para:
- Proteção do código do sistema (antes de abrir o site)
- Configuração Cloud (página de configuração do Firebase)


