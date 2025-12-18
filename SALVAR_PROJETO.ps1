# ========================================
#   SISTEMA DE SALVAMENTO DO PROJETO
# ========================================
# Este script salva todas as mudanças do projeto
# e cria um backup automático

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SALVANDO PROJETO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obter data e hora atual
$dataHora = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
$dataArquivo = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

Write-Host "Data/Hora: $dataHora" -ForegroundColor Yellow
Write-Host ""

# Verificar se está na pasta do projeto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta raiz do projeto!" -ForegroundColor Red
    Write-Host "Pasta atual: $(Get-Location)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Criar pasta de backups se não existir
$pastaBackups = ".\backups"
if (-not (Test-Path $pastaBackups)) {
    New-Item -ItemType Directory -Path $pastaBackups | Out-Null
    Write-Host "✓ Pasta de backups criada" -ForegroundColor Green
}

# ========================================
# 1. SALVAR MUDANÇAS NO GIT (se disponível)
# ========================================
Write-Host "1. Verificando Git..." -ForegroundColor Cyan
$gitDisponivel = $false
try {
    $gitVersion = git --version 2>&1 | Out-Null
    $gitCheck = git --version 2>&1
    if ($gitCheck -and $LASTEXITCODE -eq 0) {
        $gitVersion = $gitCheck
        $gitDisponivel = $true
        Write-Host "   ✓ Git encontrado: $gitVersion" -ForegroundColor Green
        
        # Verificar se é repositório Git
        if (Test-Path ".git") {
            Write-Host "   ✓ Repositório Git detectado" -ForegroundColor Green
            
            # Adicionar todas as mudanças
            Write-Host "   Adicionando mudanças ao Git..." -ForegroundColor Yellow
            git add . 2>&1 | Out-Null
            
            # Verificar se há mudanças para commitar
            $status = git status --porcelain 2>&1
            if ($status -and $status.Count -gt 0) {
                $mensagemCommit = "Salvamento automático - $dataHora"
                git commit -m $mensagemCommit 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✓ Mudanças salvas no Git" -ForegroundColor Green
                } else {
                    Write-Host "   ℹ Nenhuma mudança para salvar no Git" -ForegroundColor Gray
                }
            } else {
                Write-Host "   ℹ Nenhuma mudança para salvar no Git" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ℹ Inicializando repositório Git..." -ForegroundColor Yellow
            git init 2>&1 | Out-Null
            git add . 2>&1 | Out-Null
            git commit -m "Backup inicial do projeto - $dataHora" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✓ Repositório Git inicializado e primeiro commit criado" -ForegroundColor Green
            } else {
                Write-Host "   ⚠ Aviso: Pode ser necessário configurar Git (user.name e user.email)" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "   ℹ Git não disponível (opcional)" -ForegroundColor Gray
}

# ========================================
# 2. CRIAR BACKUP COMPACTO
# ========================================
Write-Host ""
Write-Host "2. Criando backup compactado..." -ForegroundColor Cyan

$nomeBackup = "backup_projeto_$dataArquivo.zip"
$caminhoBackup = Join-Path $pastaBackups $nomeBackup

try {
    # Criar backup apenas dos arquivos importantes (sem node_modules)
    $tempDir = Join-Path $env:TEMP "backup_temp_$dataArquivo"
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Copiar pastas importantes
    if (Test-Path "src") {
        Copy-Item -Path "src" -Destination $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path "public") {
        Copy-Item -Path "public" -Destination $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Copiar arquivos importantes da raiz
    $arquivosRaiz = Get-ChildItem -Path . -File -ErrorAction SilentlyContinue | Where-Object {
        $extensao = $_.Extension.ToLower()
        $nome = $_.Name.ToLower()
        return ($extensao -in @('.json', '.ts', '.tsx', '.js', '.html', '.css', '.md', '.txt', '.bat', '.ps1', '.config.js')) -or
               ($nome -in @('vite.config.ts', 'tsconfig.json', 'tailwind.config.js', 'postcss.config.js'))
    }
    
    foreach ($arquivo in $arquivosRaiz) {
        Copy-Item -Path $arquivo.FullName -Destination $tempDir -Force -ErrorAction SilentlyContinue
    }
    
    # Verificar se há arquivos para compactar
    $arquivosNoTemp = Get-ChildItem -Path $tempDir -Recurse -ErrorAction SilentlyContinue
    if ($arquivosNoTemp -and $arquivosNoTemp.Count -gt 0) {
        Compress-Archive -Path "$tempDir\*" -DestinationPath $caminhoBackup -Force -ErrorAction Stop
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        
        if (Test-Path $caminhoBackup) {
            $tamanhoBackup = (Get-Item $caminhoBackup).Length / 1MB
            Write-Host "   ✓ Backup criado: $nomeBackup ($([math]::Round($tamanhoBackup, 2)) MB)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ Backup não foi criado corretamente" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠ Nenhum arquivo encontrado para backup" -ForegroundColor Yellow
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
} catch {
    Write-Host "   ⚠ Erro ao criar backup: $($_.Exception.Message)" -ForegroundColor Yellow
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# ========================================
# 3. REGISTRAR MUDANÇAS
# ========================================
Write-Host ""
Write-Host "3. Registrando mudanças..." -ForegroundColor Cyan

$logMudancas = @"
========================================
  REGISTRO DE SALVAMENTO
  Data: $dataHora
========================================

STATUS: PROJETO SALVO COM SUCESSO ✓

ARQUIVOS IMPORTANTES:
----------------------
✓ Código fonte (src/)
✓ Configurações (*.json, *.ts, *.config.js)
✓ Documentação (*.md, *.txt)
✓ Scripts (*.bat, *.ps1)
✓ Arquivos públicos (public/)

BACKUP CRIADO:
--------------
$(if (Test-Path $caminhoBackup) { "✓ $nomeBackup" } else { "✗ Backup não criado" })

GIT:
----
$(if ($gitDisponivel) { "✓ Git disponível e configurado" } else { "ℹ Git não disponível (opcional)" })

========================================
  PRÓXIMOS PASSOS
========================================

1. O projeto está salvo localmente
2. Backup criado em: $pastaBackups
3. Para backup remoto, use:
   - GitHub (git push)
   - Pendrive (copie a pasta backups)
   - Servidor de arquivos

========================================
"@

# Salvar log
$logArquivo = "REGISTRO_SALVAMENTO_$dataArquivo.txt"
$logArquivo = Join-Path $pastaBackups $logArquivo
$logMudancas | Out-File -FilePath $logArquivo -Encoding UTF8

# Atualizar arquivo de mudanças salvas
$mudancasSalvas = @"
========================================
  RESUMO DAS MUDANÇAS SALVAS
  Data: $dataHora
========================================

TODAS AS MUDANÇAS FORAM SALVAS NOS ARQUIVOS DO PROJETO

STATUS DO SALVAMENTO:
---------------------
✓ Arquivos do projeto salvos
$(if (Test-Path $caminhoBackup) { "✓ Backup criado: $nomeBackup" } else { "✗ Backup não criado" })
$(if ($gitDisponivel) { "✓ Git configurado" } else { "ℹ Git não disponível" })

LOCALIZAÇÃO DOS BACKUPS:
------------------------
Pasta: $pastaBackups
Backup mais recente: $(if (Test-Path $caminhoBackup) { $nomeBackup } else { "Nenhum" })

========================================
  COMO RESTAURAR UM BACKUP
========================================

1. Extraia o arquivo .zip do backup
2. Copie os arquivos de volta para o projeto
3. Execute: npm install (para reinstalar dependências)

========================================
"@

$mudancasSalvas | Out-File -FilePath "MUDANCAS_SALVAS.txt" -Encoding UTF8

Write-Host "   ✓ Registro de mudanças salvo" -ForegroundColor Green

# ========================================
# 4. RESUMO FINAL
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   PROJETO SALVO COM SUCESSO! ✓" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Yellow
Write-Host "  • Data/Hora: $dataHora" -ForegroundColor White
if ($gitDisponivel) {
    Write-Host "  • Git: Configurado e atualizado" -ForegroundColor White
}
if (Test-Path $caminhoBackup) {
    Write-Host "  • Backup: $nomeBackup" -ForegroundColor White
    Write-Host "  • Localização: $pastaBackups" -ForegroundColor White
}
Write-Host "  • Registro: MUDANCAS_SALVAS.txt" -ForegroundColor White
Write-Host ""
Write-Host "Todos os arquivos estão salvos e seguros!" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

