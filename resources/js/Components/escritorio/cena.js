// Cena 3D do escritório: baias da equipe, sala de vidro do chefe, mesa de
// triagem, painel da parede e copa. Recebe o JSON de /api/escritorio em
// atualizar() e devolve cliques por callback.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    mat, caixa, cilindro, grupo, boneco, baia, folha, trofeu, planta, sofa, cafeteira,
    estante, mesaChefe, cadeiraChefe, cadeira, mesaTriagem,
} from "./modelos";
import { desenharTela, desenharPainel, cracha, etiqueta, balao, placa, desenharRelogio } from "./texturas";

// Baias: até 4 por fileira, distribuídas por igual e centralizadas; as fileiras ficam de frente para a câmera (+z).
const XS_BAIA = [-7.6, -5.4, -3.2, -1.0];
const ZS_FILEIRA = [-4.6, 0.9, 6.0];
// Área da infraestrutura: frente da sala do chefe, do lado direito.
const XS_INFRA = [7.6, 9.8];
const Z_INFRA = 0.6;
const CORES_DIVISORIA = ["#4c5a88", "#3f6f73", "#6b4c7a", "#7a5c3f"];

const CHEFE = { x: 7.8, z: -6.4 };
const PORTA_CHEFE = { x: 5.7, z: -2.6 };
const CORREDOR_Z = -1.7;
const CORREDOR_LATERAL_X = 2.2;
const VELOCIDADE = 1.4;

// Copa: corredores livres até lá, ponto de encontro e os lugares de pausa.
const CORREDOR_MEIO_Z = -2.6;
const CORREDOR_FRENTE_Z = 2.6;
const CORREDOR_COPA_X = -9.3;
const INTERVALO_PAUSA = 10 * 60000;
const PONTO_COPA = { x: -8.2, z: 4.0 };
const LUGARES_COPA = [
    { id: "cafe", tipo: "cafe", chegada: [], ponto: { x: -9.85, z: 5.75 }, rotY: -Math.PI / 2, duracao: 11000, frase: "☕ Pausa pro café" },
    { id: "agua", tipo: "agua", chegada: [], ponto: { x: -9.75, z: 4.45 }, rotY: -Math.PI / 2, duracao: 9000, frase: "💧 Bebendo uma água" },
    { id: "sofa1", tipo: "sofa", chegada: [{ x: -9.75, z: 3.4 }], ponto: { x: -10.3, z: 3.0 }, rotY: Math.PI / 2, duracao: 18000, frase: "😌 Descansando uns minutinhos" },
    { id: "sofa2", tipo: "sofa", chegada: [{ x: -9.75, z: 3.4 }, { x: -9.75, z: 1.85 }], ponto: { x: -10.3, z: 2.2 }, rotY: Math.PI / 2, duracao: 18000, frase: "😌 Descansando uns minutinhos" },
];

// Volume de clique: não aparece, mas o raycaster acerta (visible:false seria ignorado).
const MAT_INVISIVEL = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });

const CAMERA_PADRAO = { pos: new THREE.Vector3(7.4, 13.6, 16.2), alvo: new THREE.Vector3(-2.4, 0.3, -1.4) };

// Quem mais resolveu nos últimos 7 dias (empates levam troféu também).
export function idsLideres(dados) {
    const ranking = dados.ranking_sete_dias ?? [];
    const max = ranking[0]?.total ?? 0;
    return new Set(max > 0 ? ranking.filter((r) => r.total === max).map((r) => r.id) : []);
}

export class CenaEscritorio {
    constructor(container, { aoSelecionar, aoPassarMouse } = {}) {
        this.container = container;
        this.aoSelecionar = aoSelecionar ?? (() => {});
        this.aoPassarMouse = aoPassarMouse ?? (() => {});
        this.pessoas = new Map(); // id -> entidade
        this.slots = new Map(); // id -> índice da baia
        this.baias = [];
        this.efeitos = [];
        this.ultimoEvento = null;
        this.ultimoChat = null;
        this.selecionado = null;
        this.noite = false;
        this.dados = null;
        this.tween = null;
        this.relogioSeg = -1;
        // Uma pausa na copa a cada ~10 min para o escritório todo; a primeira sai 2 min depois de abrir.
        this.proximaPausa = performance.now() + 2 * 60000;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.display = "block";
        this.renderer.domElement.style.touchAction = "none";

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
        this.camera.position.copy(CAMERA_PADRAO.pos);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.copy(CAMERA_PADRAO.alvo);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = 1.38;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 34;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.addEventListener("start", () => (this.tween = null));

        this.montarAmbiente();
        this.montarSalaChefe();
        this.montarTriagemECopa();

        this.raycaster = new THREE.Raycaster();
        this.ponteiro = new THREE.Vector2();
        this.clicaveis = [];
        this.instalarEventos();

        this.relogioCena = new THREE.Clock();
        this.redimensionar();
        this.observador = new ResizeObserver(() => this.redimensionar());
        this.observador.observe(container);
        this.renderer.setAnimationLoop(() => this.quadro());
    }

    // ------------------------------------------------------------ ambiente

    montarAmbiente() {
        const s = this.scene;
        this.ceu = new THREE.Color("#dbeafe");
        s.background = this.ceu.clone();
        s.fog = new THREE.Fog(s.background, 40, 80);

        this.luzHemi = new THREE.HemisphereLight("#ffffff", "#94a3b8", 1.4);
        s.add(this.luzHemi);
        this.sol = new THREE.DirectionalLight("#fff7ed", 2.2);
        this.sol.position.set(10, 18, 8);
        this.sol.castShadow = true;
        this.sol.shadow.mapSize.set(2048, 2048);
        Object.assign(this.sol.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 1, far: 50 });
        this.sol.shadow.bias = -0.0005;
        s.add(this.sol);
        // Luz de preenchimento vinda da frente, para os rostos não ficarem no escuro.
        this.preenchimento = new THREE.DirectionalLight("#ffffff", 0.7);
        this.preenchimento.position.set(2, 5, 16);
        s.add(this.preenchimento);

        // Piso e tapetes
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(22, 16), mat("#d6c3a5", { roughness: 0.9 }));
        piso.rotation.x = -Math.PI / 2;
        piso.receiveShadow = true;
        s.add(piso);
        for (let i = -10; i <= 10; i += 1.1) {
            s.add(caixa(0.01, 0.002, 16, "#c2ad8b", i, 0.001, 0));
        }
        const tapete = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 9.4), mat("#cbd5e1", { roughness: 1 }));
        tapete.rotation.x = -Math.PI / 2;
        tapete.position.set(-4.3, 0.005, -1.6);
        tapete.receiveShadow = true;
        s.add(tapete);

        // Paredes do fundo e da esquerda (as da frente ficam abertas para a câmera)
        const parede = "#f1f5f9";
        s.add(caixa(22, 3.0, 0.2, parede, 0, 0, -8.1));
        s.add(caixa(0.2, 3.0, 16.2, parede, -11.1, 0, 0));
        s.add(caixa(22, 0.12, 0.05, "#cbd5e1", 0, 0, -7.98)); // rodapé
        s.add(caixa(0.05, 0.12, 16, "#cbd5e1", -10.98, 0, 0));

        // Janelas com o céu (cor muda de dia/noite)
        this.matJanela = new THREE.MeshBasicMaterial({ color: "#bae6fd" });
        for (const x of [-8.2, -4.6, -1.0]) {
            s.add(caixa(2.6, 1.4, 0.05, "#94a3b8", x, 0.95, -7.97));
            const vidro = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), this.matJanela);
            vidro.position.set(x, 1.65, -7.94);
            s.add(vidro);
            s.add(caixa(0.05, 1.2, 0.03, "#94a3b8", x, 1.05, -7.92));
        }

        // Faixa com o nome da equipe
        const faixa = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.5), new THREE.MeshBasicMaterial({ map: placa("EQUIPE DE DESENVOLVIMENTO · IBRA", 1536, 128, "#1e1b4b", "#e0e7ff") }));
        faixa.position.set(-4.6, 2.65, -7.98);
        s.add(faixa);

        // Relógio de parede
        this.texRelogio = desenharRelogio();
        const relogio = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ map: this.texRelogio, transparent: true }));
        relogio.position.set(2.2, 2.2, -7.98);
        s.add(relogio);

        // Painel grande na parede da esquerda
        this.texPainel = desenharPainel(null, null);
        const moldura = caixa(0.1, 2.0, 3.5, "#0f172a", -10.95, 0.9, -2.2);
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.86), new THREE.MeshBasicMaterial({ map: this.texPainel }));
        tela.rotation.y = Math.PI / 2;
        tela.position.set(-10.88, 1.9, -2.2);
        tela.userData.alvo = "equipe";
        s.add(moldura, tela);
        this.painelParede = tela;

        // Plantas nos cantos
        for (const [x, z] of [[-10.4, -7.4], [3.6, -7.4], [-10.4, 7.4]]) {
            const p = planta();
            p.position.set(x, 0, z);
            s.add(p);
        }

        this.montarInfra();
    }

    montarSalaChefe() {
        const s = this.scene;
        const vidro = new THREE.MeshStandardMaterial({ color: "#bfdbfe", transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3, depthWrite: false });
        const perfil = "#475569";
        // Frente (z = -2.6) com vão de porta e lateral (x = 4.5)
        const vidroFrente1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.04), vidro);
        vidroFrente1.position.set(4.85, 1.3, -2.6);
        const vidroFrente2 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.6, 0.04), vidro);
        vidroFrente2.position.set(8.6, 1.3, -2.6);
        const vidroLado = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.6, 5.5), vidro);
        vidroLado.position.set(4.5, 1.3, -5.35);
        s.add(vidroFrente1, vidroFrente2, vidroLado);
        s.add(caixa(6.5, 0.08, 0.08, perfil, 7.75, 2.6, -2.6));
        s.add(caixa(0.08, 0.08, 5.5, perfil, 4.5, 2.6, -5.35));
        for (const x of [4.5, 5.2, 6.2, 11]) s.add(caixa(0.07, 2.6, 0.07, perfil, x, 0, -2.6));
        s.add(caixa(0.07, 2.6, 0.07, perfil, 4.5, 0, -8));
        s.add(caixa(0.2, 3.0, 5.6, "#f1f5f9", 11.1, 0, -5.3)); // parede direita da sala

        const piso = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 5.4), mat("#9a7b5c", { roughness: 0.7 }));
        piso.rotation.x = -Math.PI / 2;
        piso.position.set(7.75, 0.006, -5.3);
        piso.receiveShadow = true;
        s.add(piso);
        const tapete = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.6), mat("#7f1d1d", { roughness: 1 }));
        tapete.rotation.x = -Math.PI / 2;
        tapete.position.set(CHEFE.x, 0.01, CHEFE.z + 0.6);
        s.add(tapete);

        const mesa = mesaChefe();
        mesa.position.set(CHEFE.x, 0, CHEFE.z);
        s.add(mesa);
        this.telasChefe = mesa.userData.telas;
        const cad = cadeiraChefe();
        cad.position.set(CHEFE.x, 0, CHEFE.z);
        s.add(cad);
        // Cadeiras de visita
        for (const x of [-0.6, 0.6]) {
            const c = cadeira("#7c2d12");
            c.position.set(CHEFE.x + x, 0, CHEFE.z + 2.2);
            c.rotation.y = Math.PI;
            s.add(c);
        }
        const est = estante();
        est.position.set(9.9, 0, -7.7);
        s.add(est);
        const p = planta(1.4);
        p.position.set(5.1, 0, -7.4);
        s.add(p);

        // Placa da sala
        const tex = placa("COORDENAÇÃO", 768, 128, "#0f172a", "#fde68a");
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.3), new THREE.MeshBasicMaterial({ map: tex }));
        pl.position.set(8.6, 2.35, -2.57);
        s.add(pl);
    }

    // Canto da infraestrutura: piso escuro, racks de servidor com LEDs piscando e placa.
    montarInfra() {
        const s = this.scene;
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.6), mat("#94a3b8", { roughness: 0.6 }));
        piso.rotation.x = -Math.PI / 2;
        piso.position.set(8.7, 0.006, -0.1);
        piso.receiveShadow = true;
        s.add(piso);
        this.leds = [];
        const cores = ["#22c55e", "#22c55e", "#38bdf8", "#f59e0b"];
        for (const x of [7.4, 8.3, 9.2, 10.1]) {
            const rack = grupo(caixa(0.75, 2.0, 0.8, "#111827", 0, 0, 0), caixa(0.65, 1.85, 0.02, "#1f2937", 0, 0.07, 0.41));
            for (let i = 0; i < 9; i++) {
                rack.add(caixa(0.6, 0.12, 0.02, "#334155", 0, 0.2 + i * 0.19, 0.42));
                for (let j = 0; j < 3; j++) {
                    const led = caixa(0.03, 0.03, 0.01, cores[(i + j) % cores.length], 0.2 + j * 0.06, 0.25 + i * 0.19, 0.435, { emissive: cores[(i + j) % cores.length], emissiveIntensity: 1 });
                    led.material = led.material.clone();
                    led.userData.fase = Math.random() * 10;
                    this.leds.push(led);
                    rack.add(led);
                }
            }
            rack.position.set(x, 0, -1.75);
            s.add(rack);
        }
        const tex = placa("INFRAESTRUTURA", 1024, 128, "#14532d", "#dcfce7");
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.3), new THREE.MeshBasicMaterial({ map: tex }));
        pl.position.set(8.75, 2.3, -1.33);
        s.add(pl);
    }

    montarTriagemECopa() {
        const s = this.scene;
        const tri = mesaTriagem();
        tri.position.set(2.8, 0, 3.4);
        tri.traverse((o) => (o.userData.alvo = "equipe"));
        s.add(tri);
        this.pilhaTriagem = tri.userData.pilha;
        const tex = placa("TRIAGEM", 512, 128, "#1d4ed8", "#ffffff");
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: tex }));
        pl.position.set(2.8, 1.35, 3.86);
        s.add(pl);
        this.alvoTriagem = tri;

        const cafe = cafeteira();
        cafe.position.set(-10.6, 0, 5.4);
        cafe.rotation.y = Math.PI / 2;
        s.add(cafe);
        const so = sofa("#475569");
        so.position.set(-10.45, 0, 2.6);
        so.rotation.y = Math.PI / 2;
        s.add(so);
        const mesinha = grupo(caixa(0.9, 0.05, 0.6, "#78350f", 0, 0.4, 0));
        for (const x of [-0.4, 0.4]) for (const z of [-0.25, 0.25]) mesinha.add(caixa(0.04, 0.4, 0.04, "#451a03", x, 0, z));
        mesinha.position.set(-9.1, 0, 2.6);
        s.add(mesinha);
        const tex2 = placa("COPA ☕", 512, 128, "#78350f", "#fef3c7");
        const pl2 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: tex2 }));
        pl2.rotation.y = Math.PI / 2;
        pl2.position.set(-10.97, 2.3, 4.2);
        s.add(pl2);
    }

    // ------------------------------------------------------------ dados

    atualizar(dados) {
        this.dados = dados;
        const hora = new Date().getHours();
        const noite = !dados.expediente && (hora < 7 || hora >= 18);
        if (noite !== this.noite || !this.iluminacaoFeita) this.aplicarIluminacao(noite);

        const equipe = dados.pessoas.filter((p) => !p.chefe);
        const chefe = dados.pessoas.find((p) => p.chefe);
        const ids = new Set(dados.pessoas.map((p) => p.id));

        for (const [id, ent] of this.pessoas) {
            if (!ids.has(id)) {
                this.removerPessoa(ent);
                this.pessoas.delete(id);
                this.slots.delete(id);
            }
        }
        // Baias: só muda o arranjo quando entra/sai alguém ou alguém troca de setor.
        const chaveLayout = equipe.map((p) => `${p.id}:${p.setor}:${p.fileira}`).join(",");
        if (chaveLayout !== this.chaveLayout) {
            this.chaveLayout = chaveLayout;
            this.montarBaias(equipe);
        }

        for (const p of equipe) {
            if (this.slots.has(p.id)) this.atualizarPessoa(p, this.baias[this.slots.get(p.id)]);
        }
        if (chefe) this.atualizarChefe(chefe);

        // Troféu de quem mais resolveu nos últimos 7 dias
        const lideres = idsLideres(dados);
        for (const [id, ent] of this.pessoas) {
            if (ent.trofeu) ent.trofeu.visible = lideres.has(id);
        }

        this.atualizarPilha(this.pilhaTriagem, dados.triagem.map((c) => c.cor), 20);
        desenharPainel(this.texPainel, dados);

        const novos = this.processarEventos(dados);
        this.processarChat(dados.chat ?? []);
        return novos;
    }

    criarBaia(b, i) {
        const { grupo: g, tela, pilha, alerta } = baia(b.cor ?? CORES_DIVISORIA[i % CORES_DIVISORIA.length]);
        g.position.set(b.x, 0, b.z);
        this.scene.add(g);
        const cad = cadeira();
        cad.position.set(b.x, 0, b.z - 0.05);
        this.scene.add(cad);
        const tr = trofeu();
        tr.position.set(b.x + 0.62, 0.75, b.z + 0.62);
        tr.visible = false;
        this.scene.add(tr);
        tela.material = new THREE.MeshBasicMaterial({ map: desenharTela(null, null, this.noite) });
        b.objeto = { grupo: g, tela, pilha, alerta, cadeira: cad, trofeu: tr };
    }

    atualizarPessoa(p, b) {
        let ent = this.pessoas.get(p.id);
        const chaveAparencia = JSON.stringify(p.aparencia);
        if (!ent) {
            ent = { id: p.id, ancora: new THREE.Group(), fase: Math.random() * 10, baia: b, trofeu: b.objeto.trofeu };
            ent.ancora.position.set(b.x, 0, b.z);
            ent.ancora.userData.idPessoa = p.id;
            this.scene.add(ent.ancora);
            const anel = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.12, 48), new THREE.MeshBasicMaterial({ color: "#6366f1", transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
            anel.rotation.x = -Math.PI / 2;
            anel.position.set(0, 0.02, 0.3);
            ent.ancora.add(anel);
            ent.anel = anel;
            // Caixa invisível que pega o clique na baia toda
            const alvo = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 1.9), MAT_INVISIVEL);
            alvo.position.set(0, 1.1, 0.3);
            alvo.userData.idPessoa = p.id;
            ent.ancora.add(alvo);
            this.clicaveis.push(alvo);
            this.pessoas.set(p.id, ent);
        }
        if (ent.chaveAparencia !== chaveAparencia) {
            if (ent.pausa) this.encerrarPausa(ent);
            for (const b0 of [ent.boneco, ent.empe]) if (b0) ent.ancora.remove(b0);
            ent.boneco = boneco(p.aparencia, true);
            ent.boneco.rotation.y = -0.1; // quase de frente para a câmera; o monitor fica à direita
            // Versão em pé para as idas à copa, com um copo na mão direita.
            ent.empe = boneco(p.aparencia, false);
            ent.empe.visible = false;
            const copo = cilindro(0.045, 0.038, 0.11, "#f8fafc", 10);
            copo.position.set(0, -0.56, 0.06);
            copo.visible = false;
            ent.empe.userData.bracos[0].add(copo);
            ent.empe.userData.copo = copo;
            ent.ancora.add(ent.boneco, ent.empe);
            ent.chaveAparencia = chaveAparencia;
        }
        const chaveCracha = `${p.foto}|${p.ativo_recente}|${p.nome}`;
        if (ent.chaveCracha !== chaveCracha) {
            if (ent.cracha) ent.ancora.remove(ent.cracha);
            ent.cracha = cracha(p, p.ativo_recente ? "#22c55e" : "#94a3b8");
            ent.cracha.position.set(0, 2.05, 0);
            ent.ancora.add(ent.cracha);
            ent.chaveCracha = chaveCracha;
        }
        const c = p.contagem;
        const sub = c.fila ? `${c.fila} na fila` : "livre";
        const chaveEtiqueta = `${p.apelido}|${sub}|${c.atrasados}`;
        if (ent.chaveEtiqueta !== chaveEtiqueta) {
            if (ent.etiqueta) ent.ancora.remove(ent.etiqueta);
            ent.etiqueta = etiqueta(p.apelido, sub, c.atrasados ? "#fca5a5" : c.fila ? "#fde68a" : "#86efac");
            ent.etiqueta.position.set(0, 1.66, 0);
            ent.ancora.add(ent.etiqueta);
            ent.chaveEtiqueta = chaveEtiqueta;
        }
        const chaveTela = `${p.atual?.id}|${p.atual?.titulo}|${p.fila.map((f) => f.id + ":" + f.status).join(",")}|${this.noite}`;
        if (ent.chaveTela !== chaveTela) {
            desenharTela(b.objeto.tela.material.map, p, this.noite);
            ent.chaveTela = chaveTela;
        }
        this.atualizarPilha(b.objeto.pilha, p.fila.map((f) => f.cor), 14);
        b.objeto.alerta.visible = c.atrasados > 0;
        ent.dados = p;
    }

    atualizarChefe(p) {
        let ent = this.pessoas.get(p.id);
        const chaveAparencia = JSON.stringify(p.aparencia);
        if (!ent) {
            ent = { id: p.id, chefe: true, ancora: new THREE.Group(), estado: "sentado", proximaRonda: performance.now() + 15000, fase: 0 };
            ent.ancora.position.set(CHEFE.x, 0, CHEFE.z);
            this.scene.add(ent.ancora);
            const alvo = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 1.0), MAT_INVISIVEL);
            alvo.position.y = 1;
            alvo.userData.idPessoa = p.id;
            ent.ancora.add(alvo);
            this.clicaveis.push(alvo);
            const anel = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.8, 48), new THREE.MeshBasicMaterial({ color: "#eab308", transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
            anel.rotation.x = -Math.PI / 2;
            anel.position.y = 0.02;
            ent.ancora.add(anel);
            ent.anel = anel;
            this.pessoas.set(p.id, ent);
            for (const t of this.telasChefe) t.material = new THREE.MeshBasicMaterial({ map: this.texPainel });
        }
        if (ent.chaveAparencia !== chaveAparencia) {
            for (const b of [ent.sentado, ent.empe]) if (b) ent.ancora.remove(b);
            ent.sentado = boneco(p.aparencia, true);
            ent.empe = boneco(p.aparencia, false);
            ent.empe.visible = ent.estado !== "sentado";
            ent.sentado.visible = ent.estado === "sentado";
            ent.ancora.add(ent.sentado, ent.empe);
            ent.chaveAparencia = chaveAparencia;
        }
        const chaveCracha = `${p.foto}|${p.nome}`;
        if (ent.chaveCracha !== chaveCracha) {
            if (ent.cracha) ent.ancora.remove(ent.cracha);
            if (ent.etiqueta) ent.ancora.remove(ent.etiqueta);
            ent.cracha = cracha(p, "#eab308");
            ent.etiqueta = etiqueta(p.apelido, "chefe", "#fde68a");
            ent.ancora.add(ent.cracha, ent.etiqueta);
            ent.chaveCracha = chaveCracha;
        }
        ent.dados = p;
    }

    atualizarPilha(pilha, cores, max) {
        const chave = cores.join(",");
        if (pilha.userData.chave === chave) return;
        pilha.userData.chave = chave;
        while (pilha.children.length) pilha.remove(pilha.children[0]);
        cores.slice(0, max).forEach((cor, i) => {
            const f = folha(cor);
            f.position.y = i * 0.022;
            f.rotation.y = ((i * 37) % 11 - 5) * 0.03;
            pilha.add(f);
        });
    }

    /**
     * Monta as fileiras de devs (as fixadas no config e, sem config, divididas
     * por igual, até 4 por fileira) e centraliza cada fileira no tapete; infra vai
     * para a área dos racks. Só cria as baias ocupadas.
     */
    montarBaias(equipe) {
        for (const b of this.baias) {
            if (!b.objeto) continue;
            this.scene.remove(b.objeto.grupo, b.objeto.cadeira, b.objeto.trofeu);
        }
        for (const [id, ent] of this.pessoas) {
            if (ent.chefe) continue;
            this.removerPessoa(ent);
            this.pessoas.delete(id);
        }
        this.slots.clear();
        this.baias = [];

        const devs = equipe.filter((p) => p.setor !== "infra");
        const infra = equipe.filter((p) => p.setor === "infra");
        const max = XS_BAIA.length;

        // Fileiras fixadas no config (escritorio.fileiras) primeiro; quem não
        // está lá é distribuído por igual nas vagas que sobrarem.
        const grupos = ZS_FILEIRA.map(() => []);
        const soltos = [];
        for (const p of devs) {
            const f = p.fileira;
            if (f != null && grupos[f] && grupos[f].length < max) grupos[f].push(p);
            else soltos.push(p);
        }
        if (grupos.every((g) => !g.length)) {
            const n = Math.min(ZS_FILEIRA.length, Math.max(1, Math.ceil(soltos.length / max)));
            const base = Math.floor(soltos.length / n);
            const sobra = soltos.length % n;
            for (let f = 0; f < n; f++) grupos[f] = soltos.splice(0, base + (f < sobra ? 1 : 0));
        } else {
            for (const p of soltos) {
                const usadas = grupos.filter((g) => g.length);
                const alvo = usadas.filter((g) => g.length < max).sort((a, b) => a.length - b.length)[0] ?? grupos.find((g) => !g.length);
                if (alvo) alvo.push(p);
            }
        }

        const centro = (XS_BAIA[0] + XS_BAIA[max - 1]) / 2;
        const passo = XS_BAIA[1] - XS_BAIA[0];
        grupos.forEach((grupoFileira, f) => {
            const n = grupoFileira.length;
            grupoFileira.forEach((p, k) => {
                this.slots.set(p.id, this.baias.length);
                this.baias.push({ x: centro + (k - (n - 1) / 2) * passo, z: ZS_FILEIRA[f], fileira: f, objeto: null });
            });
        });
        infra.slice(0, XS_INFRA.length).forEach((p, k) => {
            this.slots.set(p.id, this.baias.length);
            this.baias.push({ x: XS_INFRA[k], z: Z_INFRA, fileira: "infra", infra: true, cor: "#2f5d50", objeto: null });
        });
        this.baias.forEach((b, k) => this.criarBaia(b, k));
    }

    removerPessoa(ent) {
        this.scene.remove(ent.ancora);
        this.clicaveis = this.clicaveis.filter((c) => c.parent !== ent.ancora);
    }

    aplicarIluminacao(noite) {
        this.noite = noite;
        this.iluminacaoFeita = true;
        const ceu = new THREE.Color(noite ? "#0b1226" : "#dbeafe");
        this.scene.background = ceu;
        this.scene.fog.color = ceu;
        this.matJanela.color.set(noite ? "#1e293b" : "#bae6fd");
        // À noite as luzes do escritório continuam acesas, só o céu escurece.
        this.luzHemi.intensity = noite ? 1.0 : 1.4;
        this.sol.intensity = noite ? 1.1 : 2.2;
        this.sol.color.set(noite ? "#e0e7ff" : "#fff7ed");
        for (const [, ent] of this.pessoas) ent.chaveTela = null;
    }

    processarEventos(dados) {
        const eventos = dados.eventos ?? [];
        const maior = eventos.reduce((m, e) => Math.max(m, e.id), 0);
        if (this.ultimoEvento === null) {
            this.ultimoEvento = maior;
            return [];
        }
        const novos = eventos.filter((e) => e.id > this.ultimoEvento);
        this.ultimoEvento = Math.max(this.ultimoEvento, maior);
        for (const e of novos) {
            if (e.status === 9 && this.pessoas.has(e.id_usuario)) this.confete(e.id_usuario);
        }
        return novos;
    }

    processarChat(chat) {
        const maior = chat.reduce((m, c) => Math.max(m, c.id), 0);
        const primeira = this.ultimoChat === null;
        const novos = chat.filter((c) => primeira || c.id > this.ultimoChat).reverse();
        this.ultimoChat = Math.max(this.ultimoChat ?? 0, maior);
        // Na primeira carga mostra só a última mensagem de cada pessoa.
        const vistos = new Set();
        for (const m of primeira ? [...novos].reverse() : novos) {
            if (primeira && vistos.has(m.id_usuario)) continue;
            vistos.add(m.id_usuario);
            this.falar(m.id_usuario, m.texto, 14000);
        }
    }

    falar(id, texto, ms = 8000) {
        const ent = this.pessoas.get(id);
        if (!ent) return;
        if (ent.balao) ent.ancora.remove(ent.balao);
        ent.balao = balao(texto);
        ent.balao.position.set(0, 2.33, 0);
        ent.balao.userData.ate = performance.now() + ms;
        ent.ancora.add(ent.balao);
    }

    confete(id) {
        const ent = this.pessoas.get(id);
        if (!ent) return;
        const cores = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
        const g = new THREE.Group();
        g.position.copy(ent.ancora.position).add(new THREE.Vector3(0, 2.8, 0.3));
        const pedacos = [];
        for (let i = 0; i < 90; i++) {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.15), new THREE.MeshBasicMaterial({ color: cores[i % cores.length], side: THREE.DoubleSide }));
            m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 3, 2 + Math.random() * 2.5, (Math.random() - 0.5) * 3);
            m.userData.giro = new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0);
            g.add(m);
            pedacos.push(m);
        }
        this.scene.add(g);
        this.efeitos.push({ grupo: g, pedacos, ate: performance.now() + 4500 });
    }

    // ------------------------------------------------------------ câmera e seleção

    selecionar(id) {
        this.selecionado = id;
        for (const [pid, ent] of this.pessoas) ent.anel.material.opacity = pid === id ? 0.9 : 0;
        if (id && this.pessoas.has(id)) this.focar(id, true);
    }

    // comPainel: desloca o enquadramento para a pessoa não ficar atrás do painel lateral.
    focar(id, comPainel = false) {
        const ent = this.pessoas.get(id);
        if (!ent) return;
        const alvo = ent.ancora.position.clone().add(new THREE.Vector3(0, 1.15, 0.4));
        const recuo = new THREE.Vector3(2.0, 2.3, 4.6);
        const pos = alvo.clone().add(recuo);
        if (comPainel) {
            const direita = new THREE.Vector3(recuo.z, 0, -recuo.x).normalize().multiplyScalar(1.5);
            alvo.add(direita);
            pos.add(direita);
        }
        this.voarPara(pos, alvo);
    }

    visaoGeral() {
        this.selecionar(null);
        this.voarPara(CAMERA_PADRAO.pos.clone(), CAMERA_PADRAO.alvo.clone());
    }

    voarPara(pos, alvo) {
        this.tween = { de: this.camera.position.clone(), deAlvo: this.controls.target.clone(), para: pos, paraAlvo: alvo, t: 0 };
    }

    modoTV(ligado) {
        this.controls.autoRotate = ligado;
        if (ligado) this.visaoGeral();
    }

    instalarEventos() {
        const el = this.renderer.domElement;
        let inicio = null;
        this._down = (e) => (inicio = { x: e.clientX, y: e.clientY });
        this._up = (e) => {
            if (!inicio || Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 6) return;
            const alvo = this.pegar(e);
            if (alvo?.idPessoa) this.aoSelecionar(alvo.idPessoa);
            else if (alvo?.alvo === "equipe") this.aoSelecionar("equipe");
            else this.aoSelecionar(null);
        };
        this._move = (e) => {
            const alvo = this.pegar(e);
            el.style.cursor = alvo ? "pointer" : "grab";
            const id = alvo?.idPessoa ?? null;
            if (id !== this.hover) {
                this.hover = id;
                for (const [pid, ent] of this.pessoas) {
                    if (pid !== this.selecionado) ent.anel.material.opacity = pid === id ? 0.45 : 0;
                }
                this.aoPassarMouse(id);
            }
        };
        el.addEventListener("pointerdown", this._down);
        el.addEventListener("pointerup", this._up);
        el.addEventListener("pointermove", this._move);
    }

    pegar(e) {
        const r = this.renderer.domElement.getBoundingClientRect();
        this.ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        this.raycaster.setFromCamera(this.ponteiro, this.camera);
        const objetos = [...this.clicaveis, this.painelParede, this.alvoTriagem];
        const hit = this.raycaster.intersectObjects(objetos, true)[0];
        if (!hit) return null;
        let o = hit.object;
        while (o) {
            if (o.userData.idPessoa) return { idPessoa: o.userData.idPessoa };
            if (o.userData.alvo) return { alvo: o.userData.alvo };
            o = o.parent;
        }
        return null;
    }

    // ------------------------------------------------------------ ronda do chefe

    rotaAte(ent) {
        const b = ent.baia;
        // Sai pela lateral da mesa, passa pela porta de vidro e segue pelo corredor.
        const pontos = [
            { x: 6.1, z: CHEFE.z },
            { x: PORTA_CHEFE.x, z: -3.6 },
            { x: PORTA_CHEFE.x, z: PORTA_CHEFE.z },
            { x: PORTA_CHEFE.x, z: CORREDOR_Z },
        ];
        const xParada = b.x + 0.45;
        if (b.infra) {
            // Área da infra fica à direita, na frente da sala do chefe.
            const zFrente = b.z + 1.95;
            pontos.push({ x: PORTA_CHEFE.x, z: zFrente }, { x: xParada, z: zFrente });
        } else if (b.fileira === 0) {
            pontos.push({ x: xParada, z: CORREDOR_Z }, { x: xParada, z: b.z + 1.75 });
        } else {
            const zFrente = b.z + 1.95;
            pontos.push({ x: CORREDOR_LATERAL_X, z: CORREDOR_Z }, { x: CORREDOR_LATERAL_X, z: zFrente }, { x: xParada, z: zFrente });
        }
        return pontos;
    }

    // ------------------------------------------------------------ pausas na copa

    // Caminho da cadeira até o ponto de encontro da copa (sai pelo vão entre a
    // mesa e a divisória e segue pelo corredor livre mais próximo).
    rotaAteCopa(b) {
        const xVao = b.x + 0.92;
        const pontos = [{ x: xVao, z: b.z + 0.15 }];
        if (b.fileira === 0) {
            pontos.push({ x: xVao, z: CORREDOR_MEIO_Z }, { x: CORREDOR_COPA_X, z: CORREDOR_MEIO_Z }, { x: CORREDOR_COPA_X, z: 2.0 }, { x: -8.3, z: 2.0 });
        } else {
            const zFrente = b.infra || b.fileira === 1 ? CORREDOR_FRENTE_Z : b.z + 1.95;
            pontos.push({ x: xVao, z: zFrente }, { x: -8.3, z: zFrente });
        }
        pontos.push(PONTO_COPA);
        return pontos;
    }

    sortearPausa(agora, chefe) {
        const candidatos = [...this.pessoas.values()].filter((e) => !e.chefe && !e.pausa && e.baia && e.empe);
        candidatos.sort(() => Math.random() - 0.5);
        const saiu = candidatos.some((e) => this.comecarPausa(e, agora, chefe));
        this.proximaPausa = agora + (saiu ? INTERVALO_PAUSA * (0.9 + Math.random() * 0.2) : 30000);
    }

    comecarPausa(ent, agora, chefe) {
        // Ninguém sai enquanto o chefe vem visitar, e cada lugar da copa recebe um por vez.
        const fora = [...this.pessoas.values()].filter((e) => e.pausa).length;
        if (fora >= 2 || (chefe && chefe.estado !== "sentado" && chefe.alvo === ent) || !ent.baia) {
            return false;
        }
        const ocupados = new Set([...this.pessoas.values()].filter((e) => e.pausa).map((e) => e.pausa.lugar.id));
        const livres = LUGARES_COPA.filter((l) => !ocupados.has(l.id));
        if (!livres.length) {
            return false;
        }
        const lugar = livres[Math.floor(Math.random() * livres.length)];
        const ida = [...this.rotaAteCopa(ent.baia), ...lugar.chegada, lugar.ponto];
        ent.pausa = { lugar, rota: ida, ida, passo: 0, fase: "indo" };
        ent.boneco.visible = false;
        ent.empe.visible = true;
        ent.empe.userData.copo.visible = false;
        return true;
    }

    animarPausa(ent, dt, agora) {
        const pz = ent.pausa;
        const a = ent.ancora;
        const t = agora / 1000 + ent.fase;
        if (pz.fase === "parado") {
            const [be] = ent.empe.userData.bracos;
            if (pz.lugar.tipo === "sofa") {
                const [e, d] = ent.boneco.userData.bracos;
                e.rotation.x = d.rotation.x = -0.35;
                ent.boneco.userData.cabeca.rotation.y = Math.sin(t * 0.3) * 0.5;
            } else {
                // Bebendo de tempos em tempos
                this.pose(ent.empe, 0);
                be.rotation.x = Math.sin(t * 0.9) > 0.55 ? -2.3 : -0.6;
                ent.empe.userData.cabeca.rotation.x = be.rotation.x < -2 ? -0.25 : 0;
            }
            if (agora > pz.ate) {
                pz.fase = "voltando";
                pz.rota = [...pz.ida].reverse().slice(1).concat([{ x: ent.baia.x, z: ent.baia.z }]);
                pz.passo = 0;
                ent.boneco.visible = false;
                ent.empe.visible = true;
                ent.empe.userData.cabeca.rotation.x = 0;
            }
            return;
        }
        if (this.andar(a, pz.rota, pz, dt)) {
            if (pz.fase === "indo") {
                pz.fase = "parado";
                pz.ate = agora + pz.lugar.duracao * (0.8 + Math.random() * 0.5);
                a.rotation.y = pz.lugar.rotY;
                if (pz.lugar.tipo === "sofa") {
                    ent.empe.visible = false;
                    ent.boneco.visible = true;
                    ent.boneco.rotation.y = 0;
                    ent.boneco.position.y = -0.04;
                } else {
                    ent.empe.userData.copo.visible = true;
                    ent.empe.userData.copo.material = mat(pz.lugar.tipo === "cafe" ? "#78350f" : "#bfdbfe");
                }
                this.falar(ent.id, pz.lugar.frase, 5000);
            } else {
                this.encerrarPausa(ent);
            }
            return;
        }
        this.pose(ent.empe, Math.sin(agora / 110));
    }

    encerrarPausa(ent) {
        ent.pausa = null;
        ent.ancora.position.set(ent.baia.x, 0, ent.baia.z);
        ent.ancora.rotation.y = 0;
        ent.boneco.visible = true;
        ent.boneco.rotation.y = -0.1;
        ent.boneco.position.y = 0;
        ent.empe.visible = false;
        ent.empe.userData.copo.visible = false;
    }

    // Move o grupo pelos pontos da rota; devolve true ao chegar no fim.
    andar(grupoMovel, rota, estado, dt) {
        const p = rota[estado.passo];
        if (!p) return true;
        const dx = p.x - grupoMovel.position.x, dz = p.z - grupoMovel.position.z;
        const dist = Math.hypot(dx, dz);
        const passo = VELOCIDADE * dt;
        if (dist <= passo) {
            grupoMovel.position.set(p.x, 0, p.z);
            estado.passo++;
            return estado.passo >= rota.length;
        }
        grupoMovel.position.x += (dx / dist) * passo;
        grupoMovel.position.z += (dz / dist) * passo;
        grupoMovel.rotation.y = Math.atan2(dx, dz);
        return false;
    }

    escolherVisita() {
        const equipe = [...this.pessoas.values()].filter((e) => !e.chefe && e.dados && !e.pausa);
        if (!equipe.length) return null;
        // Rodízio: passa em todo mundo, sempre em quem está há mais tempo sem visita.
        // Entre os que nunca foram visitados, quem tem mais atrasados vai primeiro.
        equipe.sort((a, b) => (a.visitadoEm ?? 0) - (b.visitadoEm ?? 0) || b.dados.contagem.atrasados - a.dados.contagem.atrasados);
        return equipe[0];
    }

    fraseVisita(alvo) {
        const d = alvo.dados;
        if (d.atual) return `E o #${d.atual.id}, ${d.apelido}? Como está?`;
        if (d.contagem.atrasados) return `${d.apelido}, tem ${d.contagem.atrasados} atrasado(s) aí, hein!`;
        if (d.contagem.fila) return `Bora pra fila, ${d.apelido}!`;
        return `Fila zerada, ${d.apelido}? Show! 👏`;
    }

    animarChefe(ent, dt, agora) {
        if (!ent.sentado) return;
        const ancora = ent.ancora;
        if (ent.estado === "sentado") {
            ent.sentado.userData.cabeca.rotation.y = Math.sin(agora / 2200) * 0.5;
            if (agora > ent.proximaRonda && !this.controls.autoRotate) {
                const alvo = this.escolherVisita();
                if (!alvo) {
                    ent.proximaRonda = agora + 60000;
                    return;
                }
                ent.alvo = alvo;
                ent.rota = this.rotaAte(alvo);
                ent.passo = 0;
                ent.estado = "indo";
                ent.sentado.visible = false;
                ent.empe.visible = true;
            }
            return;
        }
        if (ent.estado === "visitando") {
            this.pose(ent.empe, 0);
            ent.empe.userData.cabeca.rotation.y = Math.sin(agora / 600) * 0.15;
            if (agora > ent.ate) {
                ent.rota = [...ent.rotaIda].reverse().concat([{ x: CHEFE.x, z: CHEFE.z }]);
                ent.passo = 0;
                ent.estado = "voltando";
            }
            return;
        }
        // Andando (indo ou voltando)
        const p = ent.rota[ent.passo];
        const dx = p.x - ancora.position.x, dz = p.z - ancora.position.z;
        const dist = Math.hypot(dx, dz);
        const passo = VELOCIDADE * dt;
        if (dist <= passo) {
            ancora.position.set(p.x, 0, p.z);
            ent.passo++;
            if (ent.passo >= ent.rota.length) {
                if (ent.estado === "indo") {
                    ent.estado = "visitando";
                    ent.rotaIda = ent.rota;
                    ent.ate = agora + 7000;
                    ancora.rotation.y = Math.PI; // de frente para a baia
                    ent.alvo.visitadoEm = agora;
                    this.falar(ent.id, this.fraseVisita(ent.alvo), 6500);
                } else {
                    ent.estado = "sentado";
                    ancora.position.set(CHEFE.x, 0, CHEFE.z);
                    ancora.rotation.y = 0;
                    ent.sentado.visible = true;
                    ent.empe.visible = false;
                    ent.proximaRonda = agora + 25000 + Math.random() * 20000;
                }
            }
        } else {
            ancora.position.x += (dx / dist) * passo;
            ancora.position.z += (dz / dist) * passo;
            ancora.rotation.y = Math.atan2(dx, dz);
        }
        this.pose(ent.empe, Math.sin(agora / 110));
    }

    // Nome, crachá e balão crescem com a distância da câmera, para continuarem
    // legíveis na visão geral sem ficarem enormes de perto.
    posicionarRotulos(ent) {
        const d = this.camera.position.distanceTo(ent.ancora.position);
        const k = THREE.MathUtils.clamp(d / 8, 1, 2.4);
        const emPe = ent.chefe ? ent.estado !== "sentado" : !!ent.pausa && ent.empe?.visible;
        const base = emPe ? 2.0 : 1.66;
        const yEtiqueta = base + (k - 1) * 0.12;
        const yCracha = yEtiqueta + 0.39 * k;
        if (ent.etiqueta) {
            ent.etiqueta.position.y = yEtiqueta;
            ent.etiqueta.scale.set(1.6 * k, 0.4 * k, 1);
        }
        if (ent.cracha) {
            ent.cracha.position.y = yCracha;
            ent.cracha.scale.set(0.42 * k, 0.42 * k, 1);
        }
        if (ent.balao) {
            ent.balao.position.y = yCracha + 0.24 * k;
            ent.balao.scale.set(2.2 * k, 0.86 * k, 1);
        }
    }

    pose(b, balanco) {
        const [pe, pd] = b.userData.pernas;
        const [be, bd] = b.userData.bracos;
        pe.rotation.x = balanco * 0.5;
        pd.rotation.x = -balanco * 0.5;
        be.rotation.x = -balanco * 0.4;
        bd.rotation.x = balanco * 0.4;
    }

    // ------------------------------------------------------------ loop

    quadro() {
        const dt = Math.min(this.relogioCena.getDelta(), 0.1);
        const agora = performance.now();

        if (this.tween) {
            const tw = this.tween;
            tw.t = Math.min(1, tw.t + dt / 1.1);
            const k = 1 - Math.pow(1 - tw.t, 3);
            this.camera.position.lerpVectors(tw.de, tw.para, k);
            this.controls.target.lerpVectors(tw.deAlvo, tw.paraAlvo, k);
            if (tw.t >= 1) this.tween = null;
        }
        this.controls.update();

        const chefe = [...this.pessoas.values()].find((e) => e.chefe);
        if (agora > this.proximaPausa) this.sortearPausa(agora, chefe);
        for (const [, ent] of this.pessoas) {
            if (ent.chefe) this.animarChefe(ent, dt, agora);
            this.posicionarRotulos(ent);
            if (!ent.chefe && ent.pausa) {
                this.animarPausa(ent, dt, agora);
            } else if (!ent.chefe && ent.boneco) {
                const b = ent.boneco;
                const d = ent.dados;
                const t = agora / 1000 + ent.fase;
                const [be, bd] = b.userData.bracos;
                if (d?.contagem.andamento) {
                    // Digitando
                    be.rotation.x = -1.05 + Math.sin(t * 17) * 0.07;
                    bd.rotation.x = -1.05 + Math.sin(t * 17 + Math.PI) * 0.07;
                    b.userData.cabeca.rotation.x = 0.08 + Math.sin(t * 1.3) * 0.03;
                    b.userData.cabeca.rotation.y = -0.3 + Math.sin(t * 0.4) * 0.08; // olhando o monitor de canto de olho
                } else {
                    be.rotation.x = -0.95;
                    bd.rotation.x = -0.95;
                    b.userData.cabeca.rotation.x = -0.05;
                    b.userData.cabeca.rotation.y = Math.sin(t * 0.5) * 0.45;
                }
                // Cabeça vira para o chefe quando ele está visitando
                if (chefe?.estado === "visitando" && chefe.alvo === ent) b.userData.cabeca.rotation.y = 0.6;
            }
            if (ent.balao && agora > ent.balao.userData.ate) {
                ent.ancora.remove(ent.balao);
                ent.balao = null;
            }
            if (ent.anel && ent.id === this.selecionado) ent.anel.material.opacity = 0.6 + Math.sin(agora / 250) * 0.3;
        }

        // Lâmpadas de alerta piscando devagar
        const pulso = 0.6 + Math.sin(agora / 400) * 0.6;
        for (const b of this.baias) if (b.objeto?.alerta.visible) b.objeto.alerta.userData.luz.material.emissiveIntensity = pulso;
        for (const led of this.leds) led.material.emissiveIntensity = Math.sin(agora / 90 + led.userData.fase * 7) > 0.2 ? 1.4 : 0.15;

        // Confete
        this.efeitos = this.efeitos.filter((ef) => {
            for (const m of ef.pedacos) {
                m.userData.v.y -= 3.5 * dt;
                m.position.addScaledVector(m.userData.v, dt);
                m.rotation.x += m.userData.giro.x * dt;
                m.rotation.y += m.userData.giro.y * dt;
            }
            if (agora > ef.ate) {
                this.scene.remove(ef.grupo);
                ef.pedacos.forEach((m) => m.geometry.dispose());
                return false;
            }
            return true;
        });

        const seg = Math.floor(agora / 1000);
        if (seg !== this.relogioSeg) {
            this.relogioSeg = seg;
            desenharRelogio(this.texRelogio);
            if (seg % 30 === 0 && this.dados) desenharPainel(this.texPainel, this.dados);
        }

        this.renderer.render(this.scene, this.camera);
    }

    redimensionar() {
        const w = this.container.clientWidth, h = this.container.clientHeight;
        if (!w || !h) return;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    destruir() {
        this.renderer.setAnimationLoop(null);
        this.observador.disconnect();
        const el = this.renderer.domElement;
        el.removeEventListener("pointerdown", this._down);
        el.removeEventListener("pointerup", this._up);
        el.removeEventListener("pointermove", this._move);
        this.controls.dispose();
        this.scene.traverse((o) => {
            o.geometry?.dispose();
            if (o.material?.map) o.material.map.dispose();
        });
        this.renderer.dispose();
        el.remove();
    }
}
