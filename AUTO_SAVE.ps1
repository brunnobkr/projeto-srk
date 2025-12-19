# Script de Auto-Save para GitHub
# Monitora mudanças e faz commit/push automaticamente

$projectPath = "C:\Users\X\Documents\projeto-srk"
$intervalo = 30  # Verifica a cada 30 segundos

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AUTO-SAVE GITHUB ATIVADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitorando: $projectPath" -ForegroundColor Yellow
Write-Host "Intervalo: $intervalo segundos" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Red
Write-Host ""

Set-Location $projectPath

while ($true) {
    # Verifica se há mudanças
    $status = git status --porcelain
    
    if ($status) {
        $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
        $arquivos = ($status | Measure-Object).Count
        
        Write-Host "[$timestamp] Detectadas $arquivos alteração(ões)..." -ForegroundColor Yellow
        
        # Adiciona todas as mudanças
        git add -A
        
        # Cria mensagem de commit automática
        $mensagem = "auto-save: atualização automática - $timestamp"
        
        # Faz o commit
        $commitResult = git commit -m $mensagem 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$timestamp] Commit realizado!" -ForegroundColor Green
            
            # Faz o push
            Write-Host "[$timestamp] Enviando para GitHub..." -ForegroundColor Cyan
            $pushResult = git push origin main 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[$timestamp] Enviado com sucesso!" -ForegroundColor Green
                Write-Host ""
            } else {
                Write-Host "[$timestamp] Erro ao enviar: $pushResult" -ForegroundColor Red
            }
        }
    }
    
    Start-Sleep -Seconds $intervalo
}

