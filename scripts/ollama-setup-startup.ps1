$ErrorActionPreference = "Stop"

function Test-Command($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "ollama")) {
  Write-Host "Ollama is not installed. Install it from https://ollama.com/ then run this script again."
  exit 1
}

$taskName = "AIChatApp-OllamaServe"
$exe = (Get-Command "ollama").Source
$args = "serve"

Write-Host "Creating Windows Scheduled Task: $taskName"
Write-Host "Command: $exe $args"

schtasks /Create /F /RL HIGHEST /SC ONLOGON /TN $taskName /TR "`"$exe`" $args" | Out-Null

Write-Host "Starting task now..."
schtasks /Run /TN $taskName | Out-Null

Write-Host "Pulling model (this can take time the first run)..."
ollama pull llama3.1

Write-Host ""
Write-Host "Done."
Write-Host "Test: curl http://localhost:11434/api/tags"

