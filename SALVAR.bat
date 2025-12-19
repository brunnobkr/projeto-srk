@echo off
chcp 65001 >nul
echo ========================================
echo    SALVANDO ALTERAÇÕES NO GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Adicionando arquivos modificados...
git add -A

echo.
set /p msg="Digite a mensagem do commit (ou pressione ENTER para usar mensagem padrão): "

if "%msg%"=="" set msg=Atualização do projeto

echo.
echo [2/3] Criando commit: %msg%
git commit -m "%msg%"

echo.
echo [3/3] Enviando para o GitHub...
git push origin main

echo.
echo ========================================
echo    ALTERAÇÕES SALVAS COM SUCESSO!
echo ========================================
echo.
pause

