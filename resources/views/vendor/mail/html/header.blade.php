@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block; font-size: 19px; font-weight: bold; color: #3d4852; text-decoration: none;">
{{ $slot }}
</a>
</td>
</tr>
