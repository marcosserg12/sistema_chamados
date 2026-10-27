// Modelos low-poly do escritório. Unidades em metros; a "frente" dos objetos é +z local.
import * as THREE from "three";

const cacheMat = new Map();
export function mat(cor, extra = {}) {
    const chave = cor + JSON.stringify(extra);
    if (!cacheMat.has(chave)) {
        cacheMat.set(chave, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.8, metalness: 0.05, ...extra }));
    }
    return cacheMat.get(chave);
}

export function caixa(w, h, d, cor, x = 0, y = 0, z = 0, extra) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof cor === "string" ? mat(cor, extra) : cor);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
}

export function cilindro(r1, r2, h, cor, seg = 16, extra) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), typeof cor === "string" ? mat(cor, extra) : cor);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
}

export function esfera(r, cor, phiLen = Math.PI * 2, thetaIni = 0, thetaLen = Math.PI, extra) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14, 0, phiLen, thetaIni, thetaLen), mat(cor, extra));
    m.castShadow = true;
    return m;
}

export function grupo(...filhos) {
    const g = new THREE.Group();
    filhos.flat().forEach((f) => f && g.add(f));
    return g;
}

// ---------- Pessoas ----------

export const APARENCIA_PADRAO = {
    pele: "#d9a77f",
    cabelo: "curto",
    corCabelo: "#2b1b12",
    barba: "nenhuma",
    oculos: "nenhum",
    brinco: false,
    roupa: "camiseta",
    corRoupa: "#475569",
    corpo: "reto",
};

export const OPCOES_APARENCIA = {
    cabelo: ["curto", "topete", "ondulado", "cacheado", "crespo", "longo", "coque", "raspado", "careca"],
    barba: ["nenhuma", "bigode", "cavanhaque", "curta", "cheia"],
    oculos: ["nenhum", "redondo", "quadrado", "escuro"],
    roupa: ["camiseta", "moletom", "polo", "social", "terno"],
    corpo: ["reto", "curvo"],
};

function cacho(r, cor) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(cor, { flatShading: true }));
    m.castShadow = true;
    return m;
}

// Cabelo, rosto, barba e óculos em volta do centro da cabeça (raio 0.15).
function cabecaCompleta(ap) {
    const c = new THREE.Group();
    c.add(esfera(0.15, ap.pele));
    for (const x of [-0.152, 0.152]) {
        const orelha = esfera(0.035, ap.pele);
        orelha.position.set(x, -0.01, 0);
        orelha.scale.set(0.6, 1, 1);
        c.add(orelha);
    }
    for (const x of [-0.052, 0.052]) {
        const olho = esfera(0.017, "#111827");
        olho.position.set(x, 0.02, 0.137);
        c.add(olho);
        const sobrancelha = caixa(0.05, 0.012, 0.012, ap.corCabelo, x, 0.058, 0.138);
        c.add(sobrancelha);
    }
    c.add(caixa(0.03, 0.045, 0.03, ap.pele, 0, -0.04, 0.15));
    c.add(caixa(0.06, 0.012, 0.01, "#9f1239", 0, -0.088, 0.141));

    const ch = ap.corCabelo;
    const topo = (r = 0.163, alt = 0.04) => {
        const t = esfera(r, ch, Math.PI * 2, 0, Math.PI * 0.5);
        t.position.y = alt;
        t.scale.y = 0.85;
        return t;
    };
    const nuca = () => caixa(0.27, 0.12, 0.07, ch, 0, -0.09, -0.115);

    switch (ap.cabelo) {
        case "raspado": {
            const r = esfera(0.154, ch, Math.PI * 2, 0, Math.PI * 0.5);
            r.position.y = 0.03;
            c.add(r);
            break;
        }
        case "curto":
            c.add(topo(), nuca());
            break;
        case "topete": {
            c.add(topo(), nuca());
            const t = caixa(0.2, 0.07, 0.12, ch, 0, 0.12, 0.06);
            t.rotation.x = -0.35;
            c.add(t);
            const lado = caixa(0.1, 0.06, 0.1, ch, -0.07, 0.13, 0.0);
            lado.rotation.z = 0.3;
            c.add(lado);
            break;
        }
        case "ondulado":
            c.add(topo(0.166, 0.05), nuca());
            for (let i = 0; i < 7; i++) {
                const a = -0.4 + (i / 6) * 3.9;
                const b = cacho(0.05, ch);
                b.position.set(Math.sin(a) * 0.1, 0.15 - Math.abs(Math.cos(a)) * 0.02, Math.cos(a) * 0.08);
                c.add(b);
            }
            break;
        case "cacheado":
            c.add(nuca());
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                const b = cacho(0.07, ch);
                b.position.set(Math.cos(a) * 0.12, i % 2 ? 0.11 : 0.07, Math.sin(a) * 0.11 - 0.01);
                c.add(b);
            }
            for (const [x, z] of [[-0.05, 0.03], [0.05, 0.02], [0, -0.06]]) {
                const b = cacho(0.08, ch);
                b.position.set(x, 0.15, z);
                c.add(b);
            }
            // Franja caindo na testa.
            for (const x of [-0.07, 0, 0.07]) {
                const b = cacho(0.045, ch);
                b.position.set(x, 0.1, 0.12);
                c.add(b);
            }
            break;
        case "crespo": {
            const afro = new THREE.Mesh(new THREE.IcosahedronGeometry(0.172, 1), mat(ch, { flatShading: true, roughness: 1 }));
            afro.position.set(0, 0.055, -0.012);
            afro.scale.set(1, 0.78, 1);
            afro.castShadow = true;
            c.add(afro, nuca());
            break;
        }
        case "longo":
            c.add(topo(), nuca());
            c.add(caixa(0.3, 0.44, 0.08, ch, 0, -0.38, -0.12));
            for (const x of [-0.15, 0.15]) c.add(caixa(0.05, 0.36, 0.14, ch, x, -0.31, -0.02));
            break;
        case "coque": {
            c.add(topo(), nuca());
            const q = esfera(0.075, ch);
            q.position.set(0, 0.12, -0.12);
            c.add(q);
            break;
        }
        default: // careca
            break;
    }

    if (ap.barba === "bigode") c.add(caixa(0.1, 0.02, 0.03, ch, 0, -0.07, 0.138));
    if (ap.barba === "cavanhaque") {
        c.add(caixa(0.1, 0.02, 0.03, ch, 0, -0.07, 0.138), caixa(0.06, 0.06, 0.05, ch, 0, -0.155, 0.112));
    }
    if (ap.barba === "curta" || ap.barba === "cheia") {
        // Parte de baixo da esfera, só na metade da frente (phi 0..π = +z).
        const r = ap.barba === "cheia" ? 0.158 : 0.153;
        c.add(esfera(r, ch, Math.PI, Math.PI * 0.55, Math.PI * 0.42));
        if (ap.barba === "cheia") c.add(caixa(0.11, 0.024, 0.03, ch, 0, -0.07, 0.14));
    }

    const armacao = "#111827";
    if (ap.oculos === "redondo") {
        for (const x of [-0.055, 0.055]) {
            const lente = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.006, 6, 18), mat(armacao));
            lente.position.set(x, 0.02, 0.152);
            c.add(lente);
        }
        c.add(caixa(0.04, 0.007, 0.007, armacao, 0, 0.02, 0.153));
    }
    if (ap.oculos === "quadrado") {
        for (const x of [-0.056, 0.056]) {
            const aro = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.006, 4, 4), mat(armacao));
            aro.rotation.z = Math.PI / 4;
            aro.position.set(x, 0.02, 0.152);
            c.add(aro);
        }
        c.add(caixa(0.04, 0.007, 0.007, armacao, 0, 0.022, 0.153));
    }
    if (ap.oculos === "escuro") {
        for (const x of [-0.056, 0.056]) {
            const lente = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), mat("#0b1220", { roughness: 0.1, metalness: 0.7 }));
            lente.scale.set(1.05, 0.85, 1);
            lente.position.set(x, 0.015, 0.156);
            c.add(lente);
        }
        c.add(caixa(0.16, 0.007, 0.007, "#a16207", 0, 0.045, 0.155, { metalness: 0.8, roughness: 0.3 }));
    }
    if (ap.oculos !== "nenhum" && ap.oculos) {
        for (const x of [-0.12, 0.12]) c.add(caixa(0.006, 0.006, 0.12, armacao, x, 0.02, 0.09));
    }
    if (ap.brinco) {
        const b = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 12), mat("#d4d4d8", { metalness: 0.9, roughness: 0.2 }));
        b.position.set(-0.16, -0.055, 0.005);
        b.rotation.y = Math.PI / 2;
        c.add(b);
    }
    return c;
}

// Tronco com o tipo de roupa; devolve um grupo com origem no quadril.
function tronco(ap) {
    const g = new THREE.Group();
    const cor = ap.corRoupa;
    const larg = ap.corpo === "curvo" ? 0.42 : 0.46;
    if (ap.corpo === "curvo") {
        g.add(caixa(0.42, 0.2, 0.26, cor, 0, 0, 0));
        g.add(caixa(0.35, 0.16, 0.23, cor, 0, 0.2, 0));
        g.add(caixa(0.42, 0.24, 0.27, cor, 0, 0.36, 0));
    } else {
        g.add(caixa(larg, 0.6, 0.27, cor, 0, 0, 0));
    }
    const frente = 0.137;
    if (ap.roupa === "polo") {
        const gola = caixa(0.2, 0.05, 0.05, cor, 0, 0.57, frente - 0.01);
        gola.rotation.x = -0.4;
        g.add(gola);
        g.add(caixa(0.03, 0.14, 0.01, "#e5e7eb", 0, 0.44, frente));
        // Logo do grupo em três cores no peito.
        ["#ef4444", "#f59e0b", "#3b82f6"].forEach((c, i) => g.add(caixa(0.025, 0.025, 0.01, c, 0.11 + i * 0.026, 0.42, frente)));
    }
    if (ap.roupa === "social") {
        for (const x of [-0.05, 0.05]) {
            const gola = caixa(0.09, 0.05, 0.02, cor, x, 0.56, frente);
            gola.rotation.z = x < 0 ? 0.5 : -0.5;
            g.add(gola);
        }
        for (let i = 0; i < 4; i++) g.add(esfera(0.009, "#d1d5db").translateY(0.12 + i * 0.12).translateZ(frente + 0.005));
    }
    if (ap.roupa === "moletom") {
        g.add(caixa(0.3, 0.12, 0.12, cor, 0, 0.5, -0.17)); // capuz caído nas costas
        g.add(caixa(0.24, 0.12, 0.01, new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).offsetHSL(0, 0, -0.04), roughness: 0.9 }), 0, 0.08, frente));
        for (const x of [-0.04, 0.04]) g.add(caixa(0.008, 0.14, 0.008, "#e2e8f0", x, 0.38, frente + 0.004));
    }
    if (ap.roupa === "terno") {
        g.add(caixa(0.12, 0.3, 0.01, "#f8fafc", 0, 0.3, frente)); // camisa
        g.add(caixa(0.035, 0.26, 0.012, "#991b1b", 0, 0.3, frente + 0.004)); // gravata
        for (const x of [-0.06, 0.06]) {
            const lapela = caixa(0.05, 0.22, 0.012, new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).offsetHSL(0, 0, -0.05) }), x, 0.34, frente + 0.006);
            lapela.rotation.z = x < 0 ? -0.25 : 0.25;
            g.add(lapela);
        }
    }
    return g;
}

/**
 * Boneco sentado (ou em pé, para andar). Os braços e pernas ficam em pivôs
 * para a animação: userData.bracos, userData.pernas, userData.cabeca.
 */
export function boneco(aparencia = {}, sentado = true) {
    const ap = { ...APARENCIA_PADRAO, ...aparencia };
    const calca = ap.roupa === "terno" ? ap.corRoupa : "#1e293b";
    const sapato = "#111827";
    const g = new THREE.Group();
    const yQuadril = sentado ? 0.5 : 0.86;
    const pernas = [];
    for (const x of [-0.11, 0.11]) {
        const pivo = new THREE.Group();
        pivo.position.set(x, yQuadril + 0.04, 0);
        if (sentado) {
            pivo.add(caixa(0.17, 0.16, 0.5, calca, 0, -0.1, 0.2));
            pivo.add(caixa(0.15, 0.46, 0.15, calca, 0, -0.52, 0.42));
            pivo.add(caixa(0.16, 0.08, 0.26, sapato, 0, -0.54, 0.48));
        } else {
            pivo.add(caixa(0.17, 0.82, 0.18, calca, 0, -0.82, 0));
            pivo.add(caixa(0.18, 0.1, 0.28, sapato, 0, -0.9, 0.04));
        }
        pernas.push(pivo);
        g.add(pivo);
    }
    const t = tronco(ap);
    t.position.y = yQuadril;
    g.add(t);

    const bracos = [];
    const ombro = ap.corpo === "curvo" ? 0.265 : 0.29;
    for (const x of [-ombro, ombro]) {
        const pivo = new THREE.Group();
        pivo.position.set(x, yQuadril + 0.55, 0);
        const manga = ap.roupa === "terno" || ap.roupa === "moletom" || ap.roupa === "social" ? ap.corRoupa : ap.pele;
        pivo.add(caixa(0.12, 0.22, 0.13, ap.corRoupa, 0, -0.22, 0));
        pivo.add(caixa(0.1, 0.28, 0.11, manga, 0, -0.48, 0));
        const mao = esfera(0.052, ap.pele);
        mao.position.set(0, -0.5, 0);
        pivo.add(mao);
        if (sentado) pivo.rotation.x = -1.05;
        bracos.push(pivo);
        g.add(pivo);
    }

    const pescoco = cilindro(0.06, 0.06, 0.08, ap.pele, 10);
    pescoco.position.y = yQuadril + 0.63;
    g.add(pescoco);
    const cabeca = cabecaCompleta(ap);
    // Cabeça maior que o natural (estilo chibi) para o rosto aparecer de longe.
    cabeca.scale.setScalar(1.3);
    cabeca.position.set(0, yQuadril + 0.84, 0);
    g.add(cabeca);

    g.userData.cabeca = cabeca;
    g.userData.bracos = bracos;
    g.userData.pernas = pernas;
    g.userData.altura = yQuadril + 1.08;
    return g;
}

// ---------- Móveis ----------

export function cadeira(cor = "#1f2937") {
    const g = grupo(
        caixa(0.5, 0.08, 0.5, cor, 0, 0.42, 0),
        caixa(0.48, 0.6, 0.08, cor, 0, 0.55, -0.24),
    );
    const haste = cilindro(0.035, 0.035, 0.38, "#64748b");
    haste.position.y = 0.22;
    g.add(haste);
    for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const pe = caixa(0.04, 0.03, 0.3, "#334155", Math.sin(a) * 0.13, 0.03, Math.cos(a) * 0.13);
        pe.rotation.y = a;
        g.add(pe);
    }
    for (const x of [-0.27, 0.27]) g.add(caixa(0.05, 0.04, 0.3, "#334155", x, 0.62, 0));
    return g;
}

/**
 * Baia: mesa em frente à pessoa (+z), divisórias atrás e dos lados, monitor
 * em ângulo à esquerda para dar para ver a tela de frente e de lado.
 * Devolve { grupo, tela (Mesh do monitor), pilha (Group dos papéis), luminaria }.
 */
export function baia(corDivisoria = "#4c5a88") {
    const g = new THREE.Group();
    const madeira = "#c8a77e";
    // Mesa
    g.add(caixa(1.7, 0.05, 0.8, madeira, 0, 0.72, 0.62));
    for (const x of [-0.8, 0.8]) g.add(caixa(0.05, 0.72, 0.72, "#e5e7eb", x, 0, 0.62));
    g.add(caixa(0.6, 0.55, 0.6, "#e5e7eb", 0.5, 0, 0.62)); // gaveteiro
    // Divisórias
    const tecido = mat(corDivisoria, { roughness: 1 });
    g.add(caixa(2.0, 1.2, 0.05, tecido, 0, 0, -0.55));
    g.add(caixa(2.0, 0.04, 0.07, "#cbd5e1", 0, 1.2, -0.55));
    for (const x of [-1.0, 1.0]) {
        g.add(caixa(0.05, 1.05, 1.5, tecido, x, 0, 0.2));
        g.add(caixa(0.07, 0.04, 1.5, "#cbd5e1", x, 1.05, 0.2));
    }
    // Monitor (tela recebe textura própria)
    const monitor = new THREE.Group();
    monitor.add(caixa(0.18, 0.02, 0.14, "#1f2937", 0, 0, 0));
    monitor.add(caixa(0.04, 0.22, 0.04, "#1f2937", 0, 0, -0.02));
    monitor.add(caixa(0.66, 0.42, 0.035, "#0f172a", 0, 0.2, 0));
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.38), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    tela.position.set(0, 0.41, 0.019);
    monitor.add(tela);
    // Fica à direita da pessoa, virado para ela e para a frente: assim a
    // câmera (vindo da frente/direita) também vê a tela.
    monitor.position.set(-0.52, 0.77, 0.55);
    monitor.rotation.y = Math.PI / 2 - 0.45;
    g.add(monitor);
    // Teclado, mouse, caneca
    const teclado = caixa(0.45, 0.02, 0.15, "#334155", -0.15, 0.77, 0.42);
    teclado.rotation.y = -0.35;
    g.add(teclado);
    g.add(caixa(0.06, 0.02, 0.1, "#334155", 0.18, 0.77, 0.4));
    const caneca = cilindro(0.045, 0.045, 0.1, "#f8fafc", 12);
    caneca.position.set(0.6, 0.82, 0.38);
    g.add(caneca);
    // Plantinha
    const vaso = cilindro(0.06, 0.05, 0.1, "#b45309", 10);
    vaso.position.set(0.72, 0.82, 0.88);
    const folhas = cacho(0.1, "#16a34a");
    folhas.position.set(0.72, 0.95, 0.88);
    g.add(vaso, folhas);
    // Pilha de papéis da fila
    const pilha = new THREE.Group();
    pilha.position.set(0.32, 0.745, 0.85);
    g.add(pilha);
    // Lâmpada de alerta (chamados atrasados)
    const alerta = new THREE.Group();
    alerta.add(cilindro(0.06, 0.07, 0.04, "#334155", 12));
    const luz = esfera(0.055, "#ef4444", Math.PI * 2, 0, Math.PI / 2, { emissive: "#ef4444", emissiveIntensity: 1.2 });
    luz.position.y = 0.02;
    alerta.add(luz);
    alerta.position.set(0.85, 1.22, -0.55);
    alerta.visible = false;
    alerta.userData.luz = luz;
    g.add(alerta);

    return { grupo: g, tela, pilha, alerta };
}

export function folha(cor) {
    const m = caixa(0.3, 0.018, 0.22, "#f8fafc");
    m.add(caixa(0.3, 0.004, 0.05, cor, 0, 0.016, -0.085));
    return m;
}

export function trofeu() {
    const ouro = { metalness: 0.9, roughness: 0.25, emissive: "#7c5a00", emissiveIntensity: 0.3 };
    const g = grupo(caixa(0.14, 0.05, 0.14, "#1f2937"));
    const haste = cilindro(0.02, 0.03, 0.08, "#eab308", 10, ouro);
    haste.position.y = 0.09;
    const taca = cilindro(0.09, 0.04, 0.12, "#eab308", 16, ouro);
    taca.position.y = 0.19;
    for (const x of [-0.1, 0.1]) {
        const alca = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12), mat("#eab308", ouro));
        alca.position.set(x, 0.2, 0);
        g.add(alca);
    }
    g.add(haste, taca);
    return g;
}

export function planta(alt = 1.2) {
    const vaso = cilindro(0.25, 0.2, 0.45, "#e7e5e4", 14);
    vaso.position.y = 0.22;
    const g = grupo(vaso);
    for (let i = 0; i < 6; i++) {
        const f = cacho(0.22 + (i % 3) * 0.05, i % 2 ? "#15803d" : "#22c55e");
        const a = (i / 6) * Math.PI * 2;
        f.position.set(Math.cos(a) * 0.15, 0.5 + alt * (0.3 + (i % 3) * 0.2), Math.sin(a) * 0.15);
        g.add(f);
    }
    return g;
}

export function sofa(cor = "#64748b") {
    const g = grupo(
        caixa(2.0, 0.4, 0.85, cor, 0, 0.05, 0),
        caixa(2.0, 0.5, 0.2, cor, 0, 0.4, -0.33),
        caixa(0.2, 0.3, 0.85, cor, -0.9, 0.4, 0),
        caixa(0.2, 0.3, 0.85, cor, 0.9, 0.4, 0),
    );
    for (const x of [-0.9, 0.9]) for (const z of [-0.35, 0.35]) g.add(caixa(0.06, 0.05, 0.06, "#1f2937", x, 0, z));
    return g;
}

export function cafeteira() {
    const g = grupo(
        caixa(1.4, 0.9, 0.6, "#e5e7eb", 0, 0, 0),
        caixa(1.45, 0.05, 0.65, "#78716c", 0, 0.9, 0),
        caixa(0.35, 0.45, 0.35, "#1f2937", -0.35, 0.95, -0.05),
        caixa(0.2, 0.06, 0.05, "#ef4444", -0.35, 1.25, 0.13, { emissive: "#ef4444", emissiveIntensity: 0.6 }),
    );
    for (const x of [0.15, 0.3, 0.45]) {
        const xic = cilindro(0.04, 0.035, 0.07, "#f8fafc", 10);
        xic.position.set(x, 0.99, 0.1);
        g.add(xic);
    }
    // Galão de água
    const galao = cilindro(0.16, 0.16, 0.4, "#93c5fd", 16, { transparent: true, opacity: 0.6, roughness: 0.1 });
    galao.position.set(0.95, 1.35, 0);
    g.add(caixa(0.4, 1.1, 0.4, "#f1f5f9", 0.95, 0, 0), galao);
    return g;
}

export function estante() {
    const g = grupo(caixa(1.4, 2.0, 0.4, "#78350f", 0, 0, 0));
    const cores = ["#1d4ed8", "#b91c1c", "#15803d", "#a16207", "#6d28d9", "#0f766e"];
    for (let p = 0; p < 4; p++) {
        g.add(caixa(1.3, 0.03, 0.36, "#92400e", 0, 0.12 + p * 0.47, 0.02));
        let x = -0.58;
        for (let i = 0; i < 8; i++) {
            const h = 0.25 + ((i * 7 + p * 3) % 5) * 0.03;
            g.add(caixa(0.1, h, 0.26, cores[(i + p) % cores.length], x, 0.15 + p * 0.47, 0.04));
            x += 0.135;
        }
    }
    return g;
}

export function mesaChefe() {
    const g = new THREE.Group();
    g.add(caixa(2.3, 0.06, 1.0, "#5b3a1e", 0, 0.74, 0.6));
    g.add(caixa(2.3, 0.72, 0.05, "#4a2f18", 0, 0, 1.08));
    for (const x of [-1.12, 1.12]) g.add(caixa(0.06, 0.72, 1.0, "#4a2f18", x, 0, 0.6));
    // Dois monitores
    for (const x of [-0.4, 0.4]) {
        const m = grupo(
            caixa(0.04, 0.22, 0.04, "#111827", 0, 0, 0),
            caixa(0.62, 0.38, 0.03, "#0f172a", 0, 0.2, 0),
        );
        m.position.set(x, 0.8, 0.95);
        m.rotation.y = Math.PI + (x < 0 ? 0.15 : -0.15);
        g.add(m);
    }
    const telas = [];
    for (const x of [-0.4, 0.4]) {
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
        tela.position.set(x - (x < 0 ? 0.0023 : -0.0023), 1.19, 0.93);
        tela.rotation.y = Math.PI + (x < 0 ? 0.15 : -0.15);
        g.add(tela);
        telas.push(tela);
    }
    g.add(caixa(0.45, 0.02, 0.15, "#334155", 0, 0.8, 0.45));
    // Placa de mesa
    const placa = caixa(0.4, 0.1, 0.04, "#d4af37", 0.75, 0.8, 1.05, { metalness: 0.8, roughness: 0.3 });
    g.add(placa);
    g.userData.telas = telas;
    return g;
}

export function cadeiraChefe() {
    const g = cadeira("#111827");
    g.add(caixa(0.52, 0.35, 0.09, "#111827", 0, 1.1, -0.26));
    return g;
}

export function mesaTriagem() {
    const g = grupo(
        caixa(1.6, 0.05, 0.9, "#e2e8f0", 0, 0.9, 0),
        caixa(1.6, 0.9, 0.05, "#64748b", 0, 0, 0.43),
        caixa(0.05, 0.9, 0.9, "#64748b", -0.78, 0, 0),
        caixa(0.05, 0.9, 0.9, "#64748b", 0.78, 0, 0),
    );
    // Bandeja da pilha de chamados sem dono
    g.add(caixa(0.42, 0.04, 0.34, "#1e293b", -0.3, 0.95, 0));
    const pilha = new THREE.Group();
    pilha.position.set(-0.3, 0.99, 0);
    g.add(pilha);
    // Sininho de atendimento
    const sino = esfera(0.07, "#eab308", Math.PI * 2, 0, Math.PI / 2, { metalness: 0.8, roughness: 0.3 });
    sino.position.set(0.45, 0.95, 0.1);
    g.add(sino);
    g.userData.pilha = pilha;
    return g;
}
