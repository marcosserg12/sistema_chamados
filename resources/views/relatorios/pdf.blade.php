<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1e293b; }
        h1 { font-size: 16px; margin-bottom: 0; }
        p.periodo { color: #64748b; margin-top: 4px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
        th { background: #f8fafc; font-size: 11px; text-transform: uppercase; }
    </style>
</head>
<body>
    <h1>Relatório Semanal de Demandas</h1>
    <p class="periodo">Período: {{ $periodoInicio }} a {{ $periodoFim }}</p>
    <table>
        <thead>
            <tr>
                <th>ID</th><th>Título</th><th>Tipo</th><th>Empresa</th><th>Técnico</th><th>Status</th><th>Categoria</th><th>Data</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($linhas as $linha)
                <tr>
                    <td>#{{ $linha['id'] }}</td>
                    <td>{{ $linha['titulo'] }}</td>
                    <td>{{ $linha['tipo'] }}</td>
                    <td>{{ $linha['empresa'] }}</td>
                    <td>{{ $linha['tecnico'] }}</td>
                    <td>{{ $linha['status'] }}</td>
                    <td>{{ $linha['categoria'] }}</td>
                    <td>{{ $linha['data_referencia'] }}</td>
                </tr>
            @empty
                <tr><td colspan="8">Nenhum chamado neste período.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
