// Texturas desenhadas em canvas: telas dos monitores, painel da parede,
// crachás com foto, nomes e balões de fala.
import * as THREE from "three";

const FONTE = "Inter, 'Segoe UI', system-ui, sans-serif";

function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return [c, c.getContext("2d")];
}

function textura(c) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

function quebrarLinhas(ctx, texto, largura, maxLinhas) {
    const palavras = String(texto ?? "").split(/\s+/);
    const linhas = [];
    let atual = "";
    for (const p of palavras) {
        const teste = atual ? atual + " " + p : p;
        if (ctx.measureText(teste).width > largura && atual) {
            linhas.push(atual);
            atual = p;
            if (linhas.length === maxLinhas) break;
        } else {
            atual = teste;
        }
    }
    if (linhas.length < maxLinhas && atual) linhas.push(atual);
    if (linhas.length === maxLinhas && palavras.join(" ").length > linhas.join(" ").length) {
        linhas[maxLinhas - 1] = linhas[maxLinhas - 1].replace(/\s*\S*$/, "") + "…";
    }
    return linhas;
}

function retArredondado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export function iniciais(nome) {
    return String(nome || "?").split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * Tela do monitor da baia. Mostra o chamado em andamento (estilo editor de
 * código), a fila quando não há nada em andamento, ou o descanso de tela.
 */
export function desenharTela(textura0, pessoa, noite) {
    const c = textura0?.image ?? canvas(512, 316)[0];
    const ctx = c.getContext("2d");
    const W = c.width, H = c.height;
    const atual = pessoa?.atual;
    if (atual) {
        ctx.fillStyle = "#0b1020";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#151b33";
        ctx.fillRect(0, 0, W, 34);
        for (const [i, cor] of ["#ef4444", "#f59e0b", "#22c55e"].entries()) {
            ctx.fillStyle = cor;
            ctx.beginPath();
            ctx.arc(18 + i * 18, 17, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = "#94a3b8";
        ctx.font = `600 15px ${FONTE}`;
        ctx.fillText(`chamado-${atual.id}.php`, 80, 23);
        ctx.fillStyle = atual.cor;
        ctx.fillRect(0, 34, 6, H - 34);
        ctx.fillStyle = "#fbbf24";
        ctx.font = `800 40px ${FONTE}`;
        ctx.fillText(`#${atual.id}`, 22, 84);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = `600 22px ${FONTE}`;
        quebrarLinhas(ctx, atual.titulo, W - 44, 3).forEach((l, i) => ctx.fillText(l, 22, 120 + i * 28));
        // "Código" decorativo
        const cores = ["#818cf8", "#34d399", "#f472b6", "#38bdf8", "#64748b"];
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = cores[(atual.id + i) % cores.length];
            const w = 60 + ((atual.id * 37 + i * 53) % 260);
            ctx.fillRect(22 + (i % 3) * 18, 214 + i * 15, w, 7);
        }
        ctx.fillStyle = "#64748b";
        ctx.font = `500 14px ${FONTE}`;
        ctx.fillText(atual.empresa ?? "", 22, H - 10);
    } else if (pessoa?.fila?.length) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = `800 26px ${FONTE}`;
        ctx.fillText(`Fila: ${pessoa.fila.length}`, 22, 44);
        ctx.font = `500 18px ${FONTE}`;
        pessoa.fila.slice(0, 6).forEach((ch, i) => {
            const y = 82 + i * 38;
            ctx.fillStyle = ch.cor;
            retArredondado(ctx, 22, y - 18, 10, 26, 3);
            ctx.fill();
            ctx.fillStyle = "#cbd5e1";
            const t = `#${ch.id} ${ch.titulo}`;
            ctx.fillText(t.length > 40 ? t.slice(0, 39) + "…" : t, 42, y);
        });
    } else {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, noite ? "#020617" : "#312e81");
        grad.addColorStop(1, noite ? "#0f172a" : "#0e7490");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.font = `800 54px ${FONTE}`;
        ctx.textAlign = "center";
        ctx.fillText("Ibra", W / 2, H / 2 + 4);
        ctx.font = `600 20px ${FONTE}`;
        ctx.fillStyle = "rgba(255,255,255,.7)";
        ctx.fillText(!pessoa ? "Baia livre" : pessoa.chefe ? "Painel da equipe" : "Fila zerada ✓", W / 2, H / 2 + 44);
        ctx.textAlign = "left";
    }
    if (textura0) {
        textura0.needsUpdate = true;
        return textura0;
    }
    return textura(c);
}

/**
 * Painel grande da parede: números da equipe e o relógio.
 */
export function desenharPainel(tex, dados) {
    const c = tex?.image ?? canvas(1024, 576)[0];
    const ctx = c.getContext("2d");
    const W = c.width, H = c.height;
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `800 44px ${FONTE}`;
    ctx.fillText("Central de Chamados", 40, 70);
    const agora = new Date();
    ctx.font = `700 44px ${FONTE}`;
    ctx.textAlign = "right";
    ctx.fillStyle = "#93c5fd";
    ctx.fillText(agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), W - 40, 70);
    ctx.textAlign = "left";
    const k = dados?.kpis ?? {};
    const cards = [
        ["Sem responsável", k.sem_responsavel, "#3b82f6"],
        ["Em andamento", k.em_andamento, "#f59e0b"],
        ["Aguard. teste", k.aguardando_teste, "#a855f7"],
        ["Pausados", k.pausados, "#f97316"],
        ["Atrasados", k.atrasados, "#ef4444"],
        ["Resolvidos hoje", k.resolvidos_hoje, "#10b981"],
    ];
    cards.forEach(([rotulo, valor, cor], i) => {
        const x = 40 + (i % 3) * 320, y = 110 + Math.floor(i / 3) * 190;
        ctx.fillStyle = "#151b33";
        retArredondado(ctx, x, y, 300, 170, 18);
        ctx.fill();
        ctx.fillStyle = cor;
        ctx.fillRect(x, y + 20, 8, 130);
        ctx.fillStyle = "#f8fafc";
        ctx.font = `800 84px ${FONTE}`;
        ctx.fillText(String(valor ?? "–"), x + 30, y + 104);
        ctx.fillStyle = "#94a3b8";
        ctx.font = `600 26px ${FONTE}`;
        ctx.fillText(rotulo, x + 30, y + 146);
    });
    const ev = dados?.eventos?.[0];
    if (ev) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = `500 24px ${FONTE}`;
        const t = `Último: ${ev.quem} → ${ev.status_label} #${ev.id_chamado} ${ev.titulo}`;
        ctx.fillText(t.length > 70 ? t.slice(0, 69) + "…" : t, 40, H - 32);
    }
    if (tex) {
        tex.needsUpdate = true;
        return tex;
    }
    return textura(c);
}

/**
 * Crachá redondo flutuante com a foto (ou iniciais) e anel de cor.
 * A foto carrega depois; o sprite é redesenhado quando chegar.
 */
export function cracha(pessoa, corAnel) {
    const [c, ctx] = canvas(256, 256);
    const tex = textura(c);
    const desenhar = (img) => {
        ctx.clearRect(0, 0, 256, 256);
        ctx.fillStyle = corAnel;
        ctx.beginPath();
        ctx.arc(128, 128, 124, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(128, 128, 108, 0, Math.PI * 2);
        ctx.clip();
        if (img) {
            const lado = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 20, 20, 216, 216);
        } else {
            ctx.fillStyle = "#e0e7ff";
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = "#4338ca";
            ctx.font = `800 96px ${FONTE}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(iniciais(pessoa.nome), 128, 134);
        }
        ctx.restore();
        tex.needsUpdate = true;
    };
    desenhar(null);
    if (pessoa.foto) {
        const img = new Image();
        img.onload = () => desenhar(img);
        img.src = pessoa.foto;
    }
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
    sprite.scale.set(0.42, 0.42, 1);
    sprite.renderOrder = 10;
    return sprite;
}

/**
 * Plaquinha de nome + selo (ex.: "3 na fila").
 */
export function etiqueta(texto, sub, corSub = "#64748b") {
    const [c, ctx] = canvas(512, 128);
    ctx.font = `800 44px ${FONTE}`;
    const wTexto = ctx.measureText(texto).width;
    ctx.font = `700 30px ${FONTE}`;
    const wSub = sub ? ctx.measureText(sub).width + 30 : 0;
    const w = Math.min(500, wTexto + wSub + 48);
    const x = (512 - w) / 2;
    ctx.fillStyle = "rgba(15,23,42,.82)";
    retArredondado(ctx, x, 20, w, 80, 40);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `800 44px ${FONTE}`;
    ctx.textBaseline = "middle";
    ctx.fillText(texto, x + 24, 62);
    if (sub) {
        ctx.fillStyle = corSub;
        ctx.font = `700 30px ${FONTE}`;
        ctx.fillText(sub, x + 24 + wTexto + 22, 63);
    }
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura(c), depthWrite: false }));
    sprite.scale.set(1.6, 0.4, 1);
    sprite.renderOrder = 10;
    return sprite;
}

export function balao(texto) {
    const [c, ctx] = canvas(512, 200);
    ctx.font = `600 30px ${FONTE}`;
    const linhas = quebrarLinhas(ctx, texto, 440, 3);
    const h = 40 + linhas.length * 38;
    const w = Math.max(...linhas.map((l) => ctx.measureText(l).width)) + 48;
    const x = (512 - w) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    retArredondado(ctx, x, 4, w, h, 22);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(240, h + 3);
    ctx.lineTo(256, h + 30);
    ctx.lineTo(272, h + 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    linhas.forEach((l, i) => ctx.fillText(l, x + 24, 44 + i * 38));
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura(c), depthWrite: false, transparent: true }));
    sprite.scale.set(1.6, 0.625, 1);
    sprite.center.set(0.5, 0);
    sprite.renderOrder = 11;
    return sprite;
}

/** Placa da porta / parede com texto simples. */
export function placa(texto, w = 1024, h = 160, fundo = "#0f172a", cor = "#f8fafc") {
    const [c, ctx] = canvas(w, h);
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = cor;
    ctx.font = `800 ${Math.round(h * 0.5)}px ${FONTE}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, w / 2, h / 2 + 4);
    return textura(c);
}

/** Relógio de parede analógico (redesenhado a cada segundo). */
export function desenharRelogio(tex) {
    const c = tex?.image ?? canvas(256, 256)[0];
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();
    ctx.fillStyle = "#1e293b";
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.fillRect(128 + Math.sin(a) * 96 - 3, 128 - Math.cos(a) * 96 - 3, 6, 6);
    }
    const d = new Date();
    const ponteiro = (frac, comp, larg, cor) => {
        const a = frac * Math.PI * 2;
        ctx.strokeStyle = cor;
        ctx.lineWidth = larg;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(128, 128);
        ctx.lineTo(128 + Math.sin(a) * comp, 128 - Math.cos(a) * comp);
        ctx.stroke();
    };
    ponteiro(((d.getHours() % 12) + d.getMinutes() / 60) / 12, 55, 9, "#1e293b");
    ponteiro((d.getMinutes() + d.getSeconds() / 60) / 60, 82, 6, "#1e293b");
    ponteiro(d.getSeconds() / 60, 90, 2, "#ef4444");
    if (tex) {
        tex.needsUpdate = true;
        return tex;
    }
    return textura(c);
}
