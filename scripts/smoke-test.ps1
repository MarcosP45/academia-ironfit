param([string]$Base = "http://localhost:8080")

$ErrorActionPreference = "Stop"
$script:ok = 0
$script:falhas = @()

function Passo($nome, [scriptblock]$bloco) {
    try {
        $r = & $bloco
        if ($r -eq $false) { throw "condicao falsa" }
        Write-Host ("[OK]    " + $nome) -ForegroundColor Green
        $script:ok++
    } catch {
        Write-Host ("[FALHA] " + $nome + "  -> " + $_.Exception.Message) -ForegroundColor Red
        $script:falhas += $nome
    }
}

function Chamar($metodo, $caminho, $corpo = $null) {
    $p = @{ Uri = "$Base$caminho"; Method = $metodo; ContentType = "application/json; charset=utf-8"; UseBasicParsing = $true }
    if ($null -ne $corpo) { $p.Body = [System.Text.Encoding]::UTF8.GetBytes(($corpo | ConvertTo-Json -Depth 6)) }
    Invoke-RestMethod @p
}

function EsperarErro($codigo, [scriptblock]$bloco) {
    try { & $bloco | Out-Null } catch {
        $s = [int]$_.Exception.Response.StatusCode
        if ($s -eq $codigo) { return $true }
        throw "esperava HTTP $codigo mas veio $s"
    }
    throw "esperava HTTP $codigo mas a chamada deu certo"
}

function CpfValido($n) {
    $d = ("{0:D9}" -f (100000000 + $n * 7919)).ToCharArray() | ForEach-Object { [int]::Parse($_) }
    $d = [int[]]$d
    foreach ($t in 9, 10) {
        $soma = 0
        for ($i = 0; $i -lt $t; $i++) { $soma += $d[$i] * ($t + 1 - $i) }
        $r = ($soma * 10) % 11
        $d += $(if ($r -eq 10) { 0 } else { $r })
    }
    $s = -join $d
    "{0}.{1}.{2}-{3}" -f $s.Substring(0, 3), $s.Substring(3, 3), $s.Substring(6, 3), $s.Substring(9, 2)
}

$n = Get-Random -Minimum 20000 -Maximum 90000
$hoje = (Get-Date).ToString("yyyy-MM-dd")
$ids = @{}

Write-Host "Testando $Base`n"

Passo "Servidor responde (painel)" { (Chamar GET "/api/dashboard").alunosAtivos -ge 0 }
Passo "Front-end carrega (index.html)" { (Invoke-WebRequest "$Base/" -UseBasicParsing).StatusCode -eq 200 }

Passo "Planos: cadastra e calcula total do contrato" {
    $p = Chamar POST "/api/planos" @{ nome = "Smoke $n"; valorMensal = 119.90; duracaoMeses = 2 }
    $ids.plano = $p.id
    $p.valorTotal -eq 239.80
}
Passo "Planos: consulta pela listagem" { (Chamar GET "/api/planos") | Where-Object { $_.id -eq $ids.plano } }

Passo "Professores: cadastra" {
    $p = Chamar POST "/api/professores" @{ nome = "Professor Smoke $n"; cpf = (CpfValido ($n + 1)); cref = "SMK-$n"; especialidade = "Smoke" }
    $ids.prof = $p.id
    $p.ativo -eq $true
}
Passo "Professores: busca por especialidade" { (Chamar GET "/api/professores?busca=Smoke") | Where-Object { $_.id -eq $ids.prof } }

Passo "Alunos: cadastra no plano" {
    $a = Chamar POST "/api/alunos" @{ nome = "Aluno Smoke $n"; cpf = (CpfValido ($n + 2)); email = "smoke$n@email.com"; telefone = "(24) 90000-0000"; dataNascimento = "1995-05-20"; planoId = $ids.plano }
    $ids.aluno = $a.id
    $a.planoId -eq $ids.plano
}
Passo "Alunos: consulta por id" { (Chamar GET "/api/alunos/$($ids.aluno)").nome -eq "Aluno Smoke $n" }
Passo "Alunos: CPF invalido e rejeitado (422)" {
    EsperarErro 422 { Chamar POST "/api/alunos" @{ nome = "Fulano Invalido"; cpf = "123.456.789-00"; dataNascimento = "1990-01-01" } }
}

Passo "Mensalidades: foram geradas 2 (plano de 2 meses)" {

    $m = @(Chamar GET "/api/mensalidades?alunoId=$($ids.aluno)" | ForEach-Object { $_ })
    $ids.mens = $m[0].id
    $m.Count -eq 2
}
Passo "Mensalidades: pagar muda para PAGA" {
    (Chamar PATCH "/api/mensalidades/$($ids.mens)/pagar" @{ formaPagamento = "PIX" }).status -eq "PAGA"
}
Passo "Mensalidades: estornar volta para PENDENTE" {
    (Chamar PATCH "/api/mensalidades/$($ids.mens)/estornar").status -eq "PENDENTE"
}

Passo "Treinos: cria ficha com exercicios" {
    $f = Chamar POST "/api/fichas" @{ alunoId = $ids.aluno; professorId = $ids.prof; nome = "Ficha Smoke"; dataInicio = $hoje; itens = @(
        @{ exercicio = "Supino"; series = 3; repeticoes = "10"; carga = 20; descansoSegundos = 60 },
        @{ exercicio = "Agachamento"; series = 3; repeticoes = "12"; carga = 40; descansoSegundos = 90 }) }
    $ids.ficha = $f.id
    $f.totalExercicios -eq 2
}
Passo "Treinos: duplica a ficha" {
    $c = Chamar POST "/api/fichas/$($ids.ficha)/duplicar"
    $ids.copia = $c.id
    $c.nome -like "*(cópia)"
}

Passo "Avaliacoes: registra e calcula IMC (80 kg, 1,75 m -> 26,1)" {
    $v = Chamar POST "/api/avaliacoes" @{ alunoId = $ids.aluno; professorId = $ids.prof; dataAvaliacao = $hoje; peso = 80; altura = 1.75; percentualGordura = 20 }
    $ids.aval = $v.id
    ($v.imc -eq 26.1) -and ($v.classificacaoImc -eq "Sobrepeso")
}
Passo "Avaliacoes: evolucao do aluno responde" { (Chamar GET "/api/avaliacoes/evolucao/$($ids.aluno)").totalAvaliacoes -eq 1 }

Passo "Integridade: plano com aluno nao pode ser excluido (422)" { EsperarErro 422 { Chamar DELETE "/api/planos/$($ids.plano)" } }
Passo "Integridade: professor com ficha nao pode ser excluido (422)" { EsperarErro 422 { Chamar DELETE "/api/professores/$($ids.prof)" } }

Passo "Limpeza: exclui aluno (leva mensalidades, fichas e avaliacoes)" {
    Chamar DELETE "/api/alunos/$($ids.aluno)" | Out-Null
    EsperarErro 404 { Chamar GET "/api/alunos/$($ids.aluno)" }
}
Passo "Limpeza: exclui professor" { Chamar DELETE "/api/professores/$($ids.prof)" | Out-Null; $true }
Passo "Limpeza: exclui plano" { Chamar DELETE "/api/planos/$($ids.plano)" | Out-Null; $true }

Write-Host ""
if ($script:falhas.Count -eq 0) {
    Write-Host "TUDO CERTO: $($script:ok) verificacoes passaram." -ForegroundColor Green
    exit 0
} else {
    Write-Host "$($script:falhas.Count) falha(s), $($script:ok) ok:" -ForegroundColor Red
    $script:falhas | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}
