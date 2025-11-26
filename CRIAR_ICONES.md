# Como Criar os Ícones do App

## Método Rápido (Online)

1. Acesse: https://www.favicon-generator.org/ ou https://realfavicongenerator.net/
2. Faça upload de uma imagem (mínimo 512x512 pixels)
3. Baixe os ícones gerados
4. Coloque os arquivos `icon-192.png` e `icon-512.png` na pasta `public/`

## Método Manual

### Usando Paint ou Photoshop:

1. Crie uma imagem quadrada de 512x512 pixels
2. Desenhe o logo/ícone do app
3. Salve como PNG
4. Redimensione para 192x192 e salve como `icon-192.png`
5. Mantenha o original de 512x512 como `icon-512.png`
6. Coloque ambos na pasta `public/`

## Ícone Temporário

Por enquanto, você pode usar qualquer imagem PNG de 192x192 e 512x512 pixels. O app funcionará normalmente, apenas o ícone será genérico.

## Verificação

Após adicionar os ícones, execute:
```bash
npm run build
npm run preview
```

E verifique se o ícone aparece corretamente quando você tenta instalar o app.

