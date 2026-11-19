$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceFiles = Get-ChildItem -LiteralPath (Join-Path $projectRoot 'backend') -Recurse -File -Filter '*.go' |
    Where-Object { $_.FullName -notmatch '[\\/](\.pgdata|vendor|node_modules)[\\/]' }

foreach ($sourceFile in $sourceFiles) {
    & gofmt -w $sourceFile.FullName

    if ($LASTEXITCODE -ne 0) {
        throw "gofmt failed: $($sourceFile.FullName)"
    }

    $sourceText = [IO.File]::ReadAllText($sourceFile.FullName)
    $sourceText = $sourceText.Replace("`t", '    ')
    [IO.File]::WriteAllText($sourceFile.FullName, $sourceText, [Text.UTF8Encoding]::new($false))
}
