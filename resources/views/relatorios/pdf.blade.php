<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 28px 32px; }
        body { font-family: "DejaVu Sans", sans-serif; font-size: 11px; color: #1e293b; }

        .header { width: 100%; margin-bottom: 12px; }
        .header table { width: 100%; border: none; }
        .header td { border: none; padding: 0; vertical-align: middle; }
        .header img { height: 42px; }
        .header h1 { font-size: 18px; margin: 0; color: #1e293b; }
        .header p.periodo { color: #64748b; margin: 2px 0 0; font-size: 11px; }

        .kpis { width: 100%; margin: 14px 0 18px; }
        .kpis table { width: 100%; border: none; }
        .kpis td {
            border: 1px solid #e2e8f0;
            border-left: 4px solid #6366f1;
            padding: 8px 12px;
            width: 33%;
        }
        .kpis .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        .kpis .value { font-size: 20px; font-weight: bold; color: #1e293b; }

        h2.secao { font-size: 12px; color: #1e293b; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }

        .chart-row { margin-bottom: 4px; }
        .chart-row .chart-label { display: inline-block; width: 140px; font-size: 10px; color: #334155; }
        .chart-row .chart-bar-bg { display: inline-block; width: 300px; background: #eef2ff; vertical-align: middle; }
        .chart-row .chart-bar-fill { background: #6366f1; height: 10px; }
        .chart-row .chart-value { display: inline-block; margin-left: 6px; font-size: 10px; font-weight: bold; color: #1e293b; }

        table.dados { width: 100%; border-collapse: collapse; }
        table.dados th, table.dados td { border: 1px solid #e2e8f0; padding: 5px 6px; text-align: left; font-size: 9.5px; }
        table.dados th { background: #f1f5f9; font-size: 9px; text-transform: uppercase; color: #475569; }
        table.dados tr:nth-child(even) td { background: #f8fafc; }
        .status-resolvido { color: #059669; font-weight: bold; }
        .status-andamento { color: #b45309; font-weight: bold; }
        .status-aberto { color: #2563eb; font-weight: bold; }
        .status-aguardando-teste { color: #9333ea; font-weight: bold; }
        .status-pausado { color: #c2410c; font-weight: bold; }
        .status-cancelado { color: #64748b; font-weight: bold; }

        .footer { margin-top: 16px; font-size: 8.5px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                @if($logoBase64)
                <td style="width: 60px;"><img src="{{ $logoBase64 }}" alt="Logo"></td>
                @endif
                <td>
                    <h1>Relatório Semanal de Demandas</h1>
                    <p class="periodo">Período: {{ $periodoInicio }} a {{ $periodoFim }}</p>
                </td>
            </tr>
        </table>
    </div>

    <div class="kpis">
        <table>
            <tr>
                <td>
                    <div class="label">Novos</div>
                    <div class="value">{{ $kpis['novos'] }}</div>
                </td>
                <td>
                    <div class="label">Resolvidos</div>
                    <div class="value">{{ $kpis['resolvidos'] }}</div>
                </td>
                <td>
                    <div class="label">Backlog (ainda em aberto)</div>
                    <div class="value">{{ $kpis['backlog'] }}</div>
                </td>
            </tr>
        </table>
    </div>

    @if(count($cargaPorTecnico) > 0)
        @php $maxCarga = collect($cargaPorTecnico)->max('value'); @endphp
        <h2 class="secao">Carga por Técnico no Período</h2>
        @foreach ($cargaPorTecnico as $tec)
            <div class="chart-row">
                <span class="chart-label">{{ $tec->name }}</span>
                <span class="chart-bar-bg">
                    <span class="chart-bar-fill" style="width: {{ $maxCarga > 0 ? round(($tec->value / $maxCarga) * 100) : 0 }}%;"></span>
                </span>
                <span class="chart-value">{{ $tec->value }}</span>
            </div>
        @endforeach
    @endif

    <h2 class="secao">Chamados do Período</h2>
    <table class="dados">
        <thead>
            <tr>
                <th>ID</th><th>Título</th><th>Tipo</th><th>Motivo</th><th>Detalhe</th><th>Solicitação</th><th>Técnico</th><th>Status</th><th>Categoria</th><th>Data</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($linhas as $linha)
                <tr>
                    <td>#{{ $linha['id'] }}</td>
                    <td>{{ $linha['titulo'] }}</td>
                    <td>{{ $linha['tipo'] }}</td>
                    <td>{{ $linha['motivo'] }}</td>
                    <td>{{ $linha['detalhe'] }}</td>
                    <td>{{ $linha['solicitacao'] }}</td>
                    <td>{{ $linha['tecnico'] }}</td>
                    @php
                        $statusClasse = match ($linha['st_status']) {
                            0 => 'status-aberto',
                            1 => 'status-andamento',
                            2 => 'status-aguardando-teste',
                            3 => 'status-pausado',
                            8 => 'status-cancelado',
                            9 => 'status-resolvido',
                            default => '',
                        };
                    @endphp
                    <td class="{{ $statusClasse }}">{{ $linha['status'] }}</td>
                    <td>{{ $linha['categoria'] }}</td>
                    <td>{{ $linha['data_referencia'] }}</td>
                </tr>
            @empty
                <tr><td colspan="10">Nenhum chamado neste período.</td></tr>
            @endforelse
        </tbody>
    </table>

    <p class="footer">Gerado em {{ now()->format('d/m/Y H:i') }} — Sistema de Chamados Ibranutro</p>
</body>
</html>
