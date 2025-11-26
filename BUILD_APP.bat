@echo off
echo ========================================
echo   Criando Build de Producao
echo ========================================
echo.

echo [1/2] Compilando o app...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [2/2] Build concluido com sucesso!
    echo.
    echo Os arquivos estao na pasta: dist\
    echo.
    echo Para visualizar o build, execute:
    echo   npm run preview
    echo.
    echo Ou sirva a pasta dist com qualquer servidor web
    echo.
) else (
    echo.
    echo ERRO: Falha no build
    echo Verifique os erros acima
    echo.
)

pause

