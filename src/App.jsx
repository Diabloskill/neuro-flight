import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    // ═══════════════════════════════════════════════
    //  QUESTÕES POR FASE
    // ═══════════════════════════════════════════════
    const phaseData = [
      {
        phase: 1,
        title: "ZONA NEURAL",
        subtitle: "Conceitos Básicos",
        topics: "Neurônio • Partes • SNC • SNP",
        questions: [
          {
            question: "Qual é a unidade funcional do Sistema Nervoso?",
            answers: ["Axônio", "Medula", "Neurônio", "Cérebro"],
            correct: "Neurônio",
          },
          {
            question: "Qual estrutura recebe os estímulos nervosos?",
            answers: ["Axônio", "Dendritos", "Bainha de mielina", "Sinapse"],
            correct: "Dendritos",
          },
          {
            question: "O Sistema Nervoso Central é formado por:",
            answers: ["Nervos e músculos", "Encéfalo e coração", "Encéfalo e medula espinal", "Nervos periféricos"],
            correct: "Encéfalo e medula espinal",
          },
        ],
      },
      {
        phase: 2,
        title: "TEMPESTADE ELÉTRICA",
        subtitle: "Impulso e Sinapse",
        topics: "Impulso • Sinapse • Neurotransmissores • Substâncias",
        questions: [
          {
            question: "Como ocorre a comunicação entre os neurônios?",
            answers: ["Digestão", "Sinapse", "Respiração", "Circulação"],
            correct: "Sinapse",
          },
          {
            question: "A substância branca é rica em:",
            answers: ["Sangue", "Osso", "Mielina", "Plasma"],
            correct: "Mielina",
          },
          {
            question: "A substância cinzenta contém principalmente:",
            answers: ["Gordura", "Corpos celulares dos neurônios", "Cartilagem", "Veias"],
            correct: "Corpos celulares dos neurônios",
          },
        ],
      },
      {
        phase: 3,
        title: "ESPAÇO NEURAL",
        subtitle: "Funções Nervosas",
        topics: "Exteroceptção • Propriocepção • Reflexos",
        questions: [
          {
            question: "Funções exteroceptivas captam estímulos:",
            answers: ["Internos", "Do ambiente externo", "Apenas musculares", "Cardíacos"],
            correct: "Do ambiente externo",
          },
          {
            question: "A propriocepção é responsável por detectar:",
            answers: ["Sons externos", "A posição e movimento do corpo", "Temperatura da pele", "Estímulos visuais"],
            correct: "A posição e movimento do corpo",
          },
          {
            question: "Um arco reflexo envolve obrigatoriamente:",
            answers: ["Apenas o cérebro", "Apenas músculos", "Receptor, neurônio e efetor", "Somente hormônios"],
            correct: "Receptor, neurônio e efetor",
          },
          {
            question: "O reflexo patelar (joelho) é um exemplo de:",
            answers: ["Reflexo condicionado", "Reflexo inato e medular", "Reflexo cerebral", "Resposta voluntária"],
            correct: "Reflexo inato e medular",
          },
        ],
      },
    ];

    // ═══════════════════════════════════════════════
    //  ESTADO GLOBAL
    // ═══════════════════════════════════════════════
    let state = {
      currentPhase: 0,
      currentQuestion: 0,
      score: 0,
      lives: 3,
      consecutiveErrors: 0,
      totalErrors: 0,
    };

    function resetState() {
      state = { currentPhase: 0, currentQuestion: 0, score: 0, lives: 3, consecutiveErrors: 0, totalErrors: 0 };
    }

    // ═══════════════════════════════════════════════
    //  WEB AUDIO ENGINE (sem bibliotecas externas)
    // ═══════════════════════════════════════════════
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function resumeAudio() {
      if (audioCtx.state === "suspended") audioCtx.resume();
    }

    // Tom simples com envelope
    function playTone({ freq = 440, type = "sine", duration = 0.15, volume = 0.18, attack = 0.01, decay = 0.05, freqEnd = null }) {
      resumeAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + attack);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + attack + decay);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    }

    // Ruído branco para efeitos
    function playNoise({ duration = 0.1, volume = 0.1, highpass = 800 }) {
      resumeAudio();
      const bufSize = audioCtx.sampleRate * duration;
      const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = highpass;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      src.start();
      src.stop(audioCtx.currentTime + duration);
    }

    const SFX = {
      // Menu: jingle leve ao abrir
      menuJingle() {
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => playTone({ freq: f, type: "triangle", duration: 0.25, volume: 0.12, attack: 0.02, decay: 0.2 }), i * 100);
        });
      },
      // Tiro
      shoot() {
        playTone({ freq: 880, freqEnd: 220, type: "sawtooth", duration: 0.12, volume: 0.1, attack: 0.005, decay: 0.1 });
      },
      // Acerto — som positivo ascendente
      correct() {
        playTone({ freq: 523, type: "triangle", duration: 0.1, volume: 0.15, attack: 0.01, decay: 0.08 });
        setTimeout(() => playTone({ freq: 784, type: "triangle", duration: 0.1, volume: 0.15, attack: 0.01, decay: 0.08 }), 80);
        setTimeout(() => playTone({ freq: 1046, type: "triangle", duration: 0.2, volume: 0.18, attack: 0.01, decay: 0.18 }), 160);
      },
      // Erro — som descendente dissonante
      wrong() {
        playTone({ freq: 300, freqEnd: 150, type: "sawtooth", duration: 0.25, volume: 0.15, attack: 0.01, decay: 0.22 });
        setTimeout(() => playNoise({ duration: 0.15, volume: 0.08, highpass: 400 }), 50);
      },
      // Turbulência — ruído de motor falhando
      turbulence() {
        playNoise({ duration: 0.4, volume: 0.12, highpass: 200 });
        playTone({ freq: 80, freqEnd: 55, type: "sawtooth", duration: 0.4, volume: 0.12, attack: 0.02, decay: 0.35 });
        setTimeout(() => playNoise({ duration: 0.3, volume: 0.1, highpass: 150 }), 250);
      },
      // Perda de altitude — motor engasgando
      altitudeDrop() {
        [90, 70, 55, 70].forEach((f, i) => {
          setTimeout(() => playTone({ freq: f, type: "sawtooth", duration: 0.12, volume: 0.14, attack: 0.01, decay: 0.1 }), i * 90);
        });
        playNoise({ duration: 0.5, volume: 0.1, highpass: 100 });
      },
      // Perde vida — impacto grave
      loseLife() {
        playTone({ freq: 200, freqEnd: 60, type: "sawtooth", duration: 0.5, volume: 0.2, attack: 0.01, decay: 0.45 });
        playNoise({ duration: 0.5, volume: 0.15, highpass: 50 });
      },
      // Transição de fase — tempestade elétrica
      phaseTransition() {
        playNoise({ duration: 0.6, volume: 0.13, highpass: 600 });
        setTimeout(() => playTone({ freq: 110, freqEnd: 440, type: "sawtooth", duration: 0.4, volume: 0.12, attack: 0.05, decay: 0.35 }), 200);
      },
      // Game over
      gameOver() {
        [440, 370, 311, 220].forEach((f, i) => {
          setTimeout(() => playTone({ freq: f, type: "sawtooth", duration: 0.3, volume: 0.14, attack: 0.01, decay: 0.28 }), i * 180);
        });
      },
      // Vitória
      victory() {
        [523, 659, 784, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => playTone({ freq: f, type: "triangle", duration: 0.22, volume: 0.15, attack: 0.01, decay: 0.2 }), i * 130);
        });
      },
    };

    function shuffleArr(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function getQuestions() {
      return phaseData[state.currentPhase].questions.map((q) => ({
        ...q,
        answers: shuffleArr(q.answers),
      }));
    }

    // ═══════════════════════════════════════════════
    //  MENU SCENE
    // ═══════════════════════════════════════════════
    class MenuScene extends Phaser.Scene {
      constructor() { super("MenuScene"); }

      create() {
        const W = this.scale.width, H = this.scale.height;
        this.cameras.main.setBackgroundColor("#050816");
        this.spawnStars(W, H);

        // Glow circle
        const gfx = this.add.graphics();
        gfx.fillStyle(0x0033ff, 0.08);
        gfx.fillCircle(W / 2, H / 2, 320);

        this.add.text(W / 2, 110, "NEURO", {
          fontSize: "90px", color: "#00ffff", fontStyle: "bold", fontFamily: "monospace",
          stroke: "#003355", strokeThickness: 6,
        }).setOrigin(0.5);
        this.add.text(W / 2, 198, "FLIGHT", {
          fontSize: "58px", color: "#ff00ff", fontStyle: "bold", fontFamily: "monospace",
          stroke: "#330033", strokeThickness: 4,
        }).setOrigin(0.5);
        this.add.text(W / 2, 256, "A R C A D E", {
          fontSize: "22px", color: "#aaaaff", fontFamily: "monospace",
        }).setOrigin(0.5);

        this.drawShip(W / 2, 330, 1.8);

        // Fase badges
        const phaseColors = [0x00aaff, 0xffaa00, 0xaa00ff];
        const phaseLabels = ["FASE 1\nZona Neural", "FASE 2\nTempestade Elétrica", "FASE 3\nEspaço Neural"];
        phaseLabels.forEach((label, i) => {
          const bx = W / 2 - 220 + i * 220;
          const bg = this.add.graphics();
          bg.fillStyle(phaseColors[i], 0.1);
          bg.fillRoundedRect(bx - 80, 400, 160, 60, 8);
          bg.lineStyle(1, phaseColors[i], 0.5);
          bg.strokeRoundedRect(bx - 80, 400, 160, 60, 8);
          this.add.text(bx, 430, label, {
            fontSize: "13px", color: "#" + phaseColors[i].toString(16).padStart(6, "0"),
            fontFamily: "monospace", align: "center",
          }).setOrigin(0.5);
        });

        this.createButton(W / 2, 515, "▶  INICIAR MISSÃO", 0x00ffff, 0x003344, () => {
          resetState();
          this.cameras.main.fade(400, 0, 0, 0);
          this.time.delayedCall(420, () => this.scene.start("PhaseIntroScene"));
        });

        // Som de menu ao abrir
        this.time.delayedCall(300, () => SFX.menuJingle());

        this.add.text(W / 2, 585, "← → Mover    ESPAÇO Atirar", {
          fontSize: "16px", color: "#555599", fontFamily: "monospace",
        }).setOrigin(0.5);

        this.cameras.main.fadeIn(600, 0, 0, 0);
      }

      createButton(x, y, label, textColor, bgColor, callback) {
        const btn = this.add.rectangle(x, y, 300, 54, bgColor, 1)
          .setInteractive({ useHandCursor: true })
          .setStrokeStyle(2, textColor);
        const txt = this.add.text(x, y, label, {
          fontSize: "24px", color: "#" + textColor.toString(16).padStart(6, "0"),
          fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5);
        btn.on("pointerover", () => { btn.setFillStyle(textColor, 0.18); txt.setScale(1.06); });
        btn.on("pointerout", () => { btn.setFillStyle(bgColor, 1); txt.setScale(1); });
        btn.on("pointerdown", callback);
      }

      drawShip(x, y, scale = 1) {
        const g = this.add.graphics();
        g.fillStyle(0xff6600, 0.85);
        g.fillTriangle(x - 8 * scale, y + 20 * scale, x + 8 * scale, y + 20 * scale, x, y + 36 * scale);
        g.fillStyle(0x005599, 1);
        g.fillTriangle(x - 18 * scale, y + 8 * scale, x - 42 * scale, y + 22 * scale, x - 8 * scale, y + 18 * scale);
        g.fillTriangle(x + 18 * scale, y + 8 * scale, x + 42 * scale, y + 22 * scale, x + 8 * scale, y + 18 * scale);
        g.fillStyle(0x00ccff, 1);
        g.fillTriangle(x, y - 28 * scale, x - 18 * scale, y + 16 * scale, x + 18 * scale, y + 16 * scale);
        g.fillStyle(0xaaffff, 0.7);
        g.fillEllipse(x, y - 4 * scale, 14 * scale, 18 * scale);
        this.tweens.add({ targets: g, alpha: 0.75, duration: 500, yoyo: true, repeat: -1 });
      }

      spawnStars(W, H) {
        for (let i = 0; i < 120; i++) {
          const star = this.add.circle(
            Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
            Phaser.Math.Between(1, 2), 0xffffff, Math.random()
          );
          this.tweens.add({
            targets: star, alpha: 0.1,
            duration: Phaser.Math.Between(600, 2000), yoyo: true, repeat: -1,
            delay: Phaser.Math.Between(0, 1000),
          });
        }
      }
    }

    // ═══════════════════════════════════════════════
    //  PHASE INTRO SCENE (Tempestade Neural)
    // ═══════════════════════════════════════════════
    class PhaseIntroScene extends Phaser.Scene {
      constructor() { super("PhaseIntroScene"); }

      create() {
        const W = this.scale.width, H = this.scale.height;
        const phase = phaseData[state.currentPhase];
        const phaseColors = [
          { bg: "#050e1a", primary: 0x00aaff, secondary: 0x0055cc, text: "#00eeff" },
          { bg: "#0a0500", primary: 0xffaa00, secondary: 0xff5500, text: "#ffdd00" },
          { bg: "#0a0014", primary: 0xaa00ff, secondary: 0x5500cc, text: "#dd88ff" },
        ];
        const col = phaseColors[state.currentPhase];

        this.cameras.main.setBackgroundColor(col.bg);

        // Lightning bolts animation
        this.lightnings = [];
        for (let i = 0; i < 6; i++) {
          const lg = this.add.graphics();
          this.lightnings.push(lg);
        }
        this.lightningTimer = this.time.addEvent({
          delay: 180, callback: this.drawLightning, callbackScope: this, loop: true,
        });

        // Particles
        for (let i = 0; i < 80; i++) {
          const p = this.add.circle(
            Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
            Phaser.Math.Between(1, 3), col.primary, Math.random() * 0.6
          );
          this.tweens.add({
            targets: p, alpha: 0,
            duration: Phaser.Math.Between(400, 1500), yoyo: true, repeat: -1,
            delay: Phaser.Math.Between(0, 1200),
          });
        }

        // Warning banner
        const banner = this.add.graphics();
        banner.fillStyle(col.primary, 0.15);
        banner.fillRect(0, H / 2 - 160, W, 320);
        banner.lineStyle(3, col.primary, 0.8);
        banner.lineBetween(0, H / 2 - 160, W, H / 2 - 160);
        banner.lineBetween(0, H / 2 + 160, W, H / 2 + 160);

        // Warning text
        const warnTxt = this.add.text(W / 2, H / 2 - 120, "⚡ TEMPESTADE NEURAL ⚡", {
          fontSize: "28px", color: "#" + col.primary.toString(16).padStart(6, "0"),
          fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5).setAlpha(0);

        const phaseNum = this.add.text(W / 2, H / 2 - 70, `FASE ${phase.phase}`, {
          fontSize: "72px", color: col.text, fontFamily: "monospace", fontStyle: "bold",
          stroke: "#000000", strokeThickness: 8,
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);

        const phaseTitle = this.add.text(W / 2, H / 2 + 10, phase.title, {
          fontSize: "36px", color: col.text, fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5).setAlpha(0);

        const phaseSub = this.add.text(W / 2, H / 2 + 58, phase.subtitle, {
          fontSize: "20px", color: "#aaaaaa", fontFamily: "monospace",
        }).setOrigin(0.5).setAlpha(0);

        const topicsBox = this.add.graphics();
        topicsBox.fillStyle(col.secondary, 0.12);
        topicsBox.fillRoundedRect(W / 2 - 220, H / 2 + 85, 440, 40, 6);
        const topicsTxt = this.add.text(W / 2, H / 2 + 105, phase.topics, {
          fontSize: "15px", color: "#cccccc", fontFamily: "monospace",
        }).setOrigin(0.5).setAlpha(0);

        const readyTxt = this.add.text(W / 2, H / 2 + 145, "PREPARE-SE...", {
          fontSize: "22px", color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5).setAlpha(0);

        // Staggered animation
        this.tweens.add({ targets: warnTxt, alpha: 1, duration: 300, delay: 200 });
        this.tweens.add({ targets: phaseNum, alpha: 1, scale: 1, duration: 500, delay: 500, ease: "Back.Out" });
        this.tweens.add({ targets: phaseTitle, alpha: 1, duration: 400, delay: 900 });
        this.tweens.add({ targets: phaseSub, alpha: 1, duration: 400, delay: 1100 });
        this.tweens.add({ targets: topicsTxt, alpha: 1, duration: 400, delay: 1300 });
        this.tweens.add({
          targets: readyTxt, alpha: 1, duration: 300, delay: 1600,
          onComplete: () => {
            this.tweens.add({ targets: readyTxt, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });
          },
        });

        // Countdown + auto advance
        this.time.delayedCall(3200, () => {
          this.lightningTimer.remove();
          this.cameras.main.fade(500, 0, 0, 0);
          this.time.delayedCall(520, () => this.scene.start("GameScene"));
        });

        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.time.delayedCall(100, () => SFX.phaseTransition());
      }

      drawLightning() {
        const W = this.scale.width, H = this.scale.height;
        const col = [0x00aaff, 0xffaa00, 0xaa00ff][state.currentPhase];
        this.lightnings.forEach((lg) => {
          lg.clear();
          if (Math.random() > 0.5) {
            lg.lineStyle(Phaser.Math.Between(1, 3), col, Math.random() * 0.7);
            const sx = Phaser.Math.Between(0, W);
            let cy = 0;
            let cx = sx;
            while (cy < H) {
              const nx = cx + Phaser.Math.Between(-60, 60);
              const ny = cy + Phaser.Math.Between(30, 80);
              lg.lineBetween(cx, cy, nx, ny);
              cx = nx;
              cy = ny;
            }
          }
        });
      }
    }

    // ═══════════════════════════════════════════════
    //  GAME SCENE
    // ═══════════════════════════════════════════════
    class GameScene extends Phaser.Scene {
      constructor() { super("GameScene"); }

      create() {
        const W = this.scale.width, H = this.scale.height;
        this.W = W; this.H = H;

        // Phase config
        this.phaseConfig = [
          { bgColor: "#051220", cloudColor: 0x88bbff, cloudAlpha: 0.13, starColor: 0xaaddff, accentColor: 0x00aaff, bulletColor: 0x00ffff, enemyBorder: 0x0066ff },
          { bgColor: "#0a0500", cloudColor: 0xffaa00, cloudAlpha: 0.10, starColor: 0xffddaa, accentColor: 0xffaa00, bulletColor: 0xffff00, enemyBorder: 0xff6600 },
          { bgColor: "#080014", cloudColor: 0xaa55ff, cloudAlpha: 0.10, starColor: 0xddaaff, accentColor: 0xaa00ff, bulletColor: 0xff88ff, enemyBorder: 0x8800ff },
        ];
        this.cfg = this.phaseConfig[state.currentPhase];
        this.cameras.main.setBackgroundColor(this.cfg.bgColor);

        this.buildBackground();

        // HUD
        const hudGfx = this.add.graphics();
        hudGfx.fillStyle(0x000011, 0.7);
        hudGfx.fillRect(0, 0, W, 108);
        hudGfx.lineStyle(1, this.cfg.accentColor, 0.4);
        hudGfx.lineBetween(0, 108, W, 108);

        const phaseName = ["ZONA NEURAL", "TEMPESTADE ELÉTRICA", "ESPAÇO NEURAL"][state.currentPhase];
        this.add.text(20, 14, phaseName, { fontSize: "17px", color: "#" + this.cfg.accentColor.toString(16).padStart(6, "0"), fontFamily: "monospace", fontStyle: "bold" });
        this.scoreText = this.add.text(20, 40, "Pontos: 0", { fontSize: "20px", color: "#ffffff", fontFamily: "monospace" });
        this.lifeText = this.add.text(20, 68, "Vidas: ❤❤❤", { fontSize: "20px", color: "#ff5555", fontFamily: "monospace" });
        this.questNumText = this.add.text(W - 20, 14, "Q 1/3", { fontSize: "17px", color: "#aaaaff", fontFamily: "monospace" }).setOrigin(1, 0);
        const phaseLabel = ["FASE 1", "FASE 2", "FASE 3"][state.currentPhase];
        this.add.text(W - 20, 40, phaseLabel, { fontSize: "17px", color: "#" + this.cfg.accentColor.toString(16).padStart(6, "0"), fontFamily: "monospace", fontStyle: "bold" }).setOrigin(1, 0);
        this.errorIndicator = this.add.text(W - 20, 68, "", { fontSize: "16px", color: "#ff4444", fontFamily: "monospace" }).setOrigin(1, 0);

        // Question box
        const qBox = this.add.graphics();
        qBox.fillStyle(0x050520, 0.92);
        qBox.fillRoundedRect(50, 118, W - 100, 84, 10);
        qBox.lineStyle(1.5, this.cfg.accentColor, 0.5);
        qBox.strokeRoundedRect(50, 118, W - 100, 84, 10);

        this.questions = getQuestions();
        this.questionText = this.add.text(W / 2, 160, this.questions[state.currentQuestion].question, {
          fontSize: "20px", color: "#ffff88", fontFamily: "monospace",
          wordWrap: { width: W - 160 }, align: "center",
        }).setOrigin(0.5);

        // Ship
        this.playerX = W / 2;
        this.playerY = H - 70;
        this.shipGfx = this.add.graphics();
        this.drawPlayerShip();

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.bullets = this.add.group();
        this.answers = this.add.group();
        this.answerTexts = [];
        this.answerBoxGfx = [];
        this.turbulence = false;
        this.altitudeDrop = 0;

        this.createAnswers();
        this.input.keyboard.on("keydown-SPACE", () => this.shoot());
        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.updateLivesDisplay();
        this.updateErrorDisplay();
      }

      buildBackground() {
        const W = this.W, H = this.H;
        const cfg = this.cfg;

        if (state.currentPhase === 0) {
          // Phase 1: Blue sky with light clouds
          this.spawnStars(W, H, cfg.starColor, 80);
          for (let i = 0; i < 8; i++) {
            const g = this.add.graphics();
            const cx = Phaser.Math.Between(50, W - 50);
            const cy = Phaser.Math.Between(130, H - 100);
            const cw = Phaser.Math.Between(80, 200);
            g.fillStyle(cfg.cloudColor, cfg.cloudAlpha);
            g.fillEllipse(cx, cy, cw, cw * 0.45);
            g.fillEllipse(cx - cw * 0.25, cy + 8, cw * 0.6, cw * 0.35);
            g.fillEllipse(cx + cw * 0.25, cy + 8, cw * 0.55, cw * 0.3);
            this.tweens.add({ targets: g, x: `+=${Phaser.Math.Between(15, 35)}`, duration: Phaser.Math.Between(4000, 8000), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }
        } else if (state.currentPhase === 1) {
          // Phase 2: Electric storm
          this.spawnStars(W, H, cfg.starColor, 60);
          this.stormGfx = this.add.graphics();
          this.stormTimer = this.time.addEvent({ delay: 220, callback: this.drawStormLightning, callbackScope: this, loop: true });
        } else {
          // Phase 3: Neural space with cosmic rays
          this.spawnStars(W, H, cfg.starColor, 140);
          // Nebula blobs
          for (let i = 0; i < 5; i++) {
            const g = this.add.graphics();
            g.fillStyle(Phaser.Math.Between(0x220044, 0x440088), 0.08);
            g.fillEllipse(Phaser.Math.Between(0, W), Phaser.Math.Between(130, H), Phaser.Math.Between(150, 350), Phaser.Math.Between(80, 200));
          }
          // Cosmic rays
          this.rayTimer = this.time.addEvent({ delay: 1000, callback: this.spawnCosmicRay, callbackScope: this, loop: true });
        }
      }

      drawStormLightning() {
        if (!this.stormGfx) return;
        this.stormGfx.clear();
        for (let i = 0; i < 3; i++) {
          if (Math.random() > 0.6) {
            this.stormGfx.lineStyle(Phaser.Math.Between(1, 2), 0xffaa00, Math.random() * 0.35);
            const sx = Phaser.Math.Between(0, this.W);
            let cx = sx, cy = 109;
            while (cy < this.H) {
              const nx = cx + Phaser.Math.Between(-50, 50);
              const ny = cy + Phaser.Math.Between(25, 65);
              this.stormGfx.lineBetween(cx, cy, nx, ny);
              cx = nx; cy = ny;
            }
          }
        }
      }

      spawnCosmicRay() {
        if (!this.scene.isActive()) return;
        const g = this.add.graphics();
        const sx = Phaser.Math.Between(0, this.W);
        g.lineStyle(1, 0xaa55ff, 0.4);
        g.lineBetween(sx, 109, sx + Phaser.Math.Between(-100, 100), this.H);
        this.tweens.add({ targets: g, alpha: 0, duration: 800, onComplete: () => g.destroy() });
      }

      spawnStars(W, H, color, count) {
        for (let i = 0; i < count; i++) {
          const star = this.add.circle(
            Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
            Phaser.Math.Between(1, 2), color, Math.random() * 0.8
          );
          this.tweens.add({
            targets: star, alpha: 0.05,
            duration: Phaser.Math.Between(500, 2000), yoyo: true, repeat: -1,
            delay: Phaser.Math.Between(0, 1500),
          });
        }
      }

      drawPlayerShip() {
        const g = this.shipGfx; g.clear();
        const x = this.playerX, y = this.playerY;
        // Exhaust flame
        g.fillStyle(0xff6600, 0.85);
        g.fillTriangle(x - 8, y + 18, x + 8, y + 18, x, y + 34);
        g.fillStyle(0xffaa00, 0.4);
        g.fillTriangle(x - 4, y + 18, x + 4, y + 18, x, y + 28);
        // Wings
        g.fillStyle(0x005599, 1);
        g.fillTriangle(x - 18, y + 8, x - 42, y + 22, x - 8, y + 18);
        g.fillTriangle(x + 18, y + 8, x + 42, y + 22, x + 8, y + 18);
        g.lineStyle(1, this.cfg.accentColor, 0.6);
        g.strokeTriangle(x - 18, y + 8, x - 42, y + 22, x - 8, y + 18);
        g.strokeTriangle(x + 18, y + 8, x + 42, y + 22, x + 8, y + 18);
        // Body
        g.fillStyle(0x00ccff, 1);
        g.fillTriangle(x, y - 28, x - 18, y + 16, x + 18, y + 16);
        g.lineStyle(1, 0xaaffff, 0.5);
        g.strokeTriangle(x, y - 28, x - 18, y + 16, x + 18, y + 16);
        // Cockpit
        g.fillStyle(0xaaffff, 0.7);
        g.fillEllipse(x, y - 4, 14, 18);
        // Engine pods
        g.fillStyle(0x003366, 1);
        g.fillRect(x - 14, y + 4, 4, 10);
        g.fillRect(x + 10, y + 4, 4, 10);

        // Turbulence shake visual
        if (this.turbulence) {
          const shake = Phaser.Math.Between(-3, 3);
          g.x = shake;
        } else {
          g.x = 0;
        }
      }

      createAnswers() {
        this.answers.getChildren().forEach((e) => e.destroy());
        this.answers.clear();
        this.answerTexts.forEach((t) => t.destroy());
        this.answerTexts = [];
        this.answerBoxGfx.forEach((b) => b.destroy());
        this.answerBoxGfx = [];

        const data = this.questions[state.currentQuestion];
        const W = this.W;
        const spacing = W / data.answers.length;
        const baseY = 260 + this.altitudeDrop;

        this.questNumText.setText(`Q ${state.currentQuestion + 1}/${this.questions.length}`);

        data.answers.forEach((answer, index) => {
          const ex = spacing * index + spacing / 2;
          const ey = baseY;

          const box = this.add.graphics();
          box.fillStyle(0x001133, 0.92);
          box.fillRoundedRect(ex - 80, ey - 30, 160, 60, 8);
          box.lineStyle(2, this.cfg.enemyBorder, 0.75);
          box.strokeRoundedRect(ex - 80, ey - 30, 160, 60, 8);
          box.answer = answer;
          box.bx = ex;
          box.by = ey;

          const txt = this.add.text(ex, ey, answer, {
            fontSize: "16px", color: "#ffffff", fontFamily: "monospace",
            wordWrap: { width: 148 }, align: "center",
          }).setOrigin(0.5);

          this.answers.add(box);
          this.answerTexts.push(txt);
          this.answerBoxGfx.push(box);

          this.tweens.add({
            targets: [box, txt],
            y: `+=${14}`, duration: 1300 + index * 120,
            yoyo: true, repeat: -1, ease: "Sine.easeInOut",
          });
        });
      }

      updateLivesDisplay() {
        this.lifeText.setText("Vidas: " + "❤".repeat(Math.max(0, state.lives)));
      }

      updateErrorDisplay() {
        const errSymbols = state.consecutiveErrors > 0
          ? "Erros: " + "✕".repeat(state.consecutiveErrors)
          : "";
        this.errorIndicator.setText(errSymbols);
      }

      shoot() {
        SFX.shoot();
        const bullet = this.add.rectangle(this.playerX, this.playerY - 32, 5, 20, this.cfg.bulletColor);
        // Bullet glow
        bullet.setStrokeStyle(2, this.cfg.bulletColor);
        this.bullets.add(bullet);
      }

      applyPenalty(level) {
        if (level === 1) {
          // Turbulência
          this.turbulence = true;
          SFX.turbulence();
          this.cameras.main.shake(600, 0.015);
          this.cameras.main.flash(200, 255, 100, 0);
          this.showFloatingText("⚡ TURBULÊNCIA!", 0xffaa00);
          this.time.delayedCall(2000, () => { this.turbulence = false; });
        } else if (level === 2) {
          // Perde altitude
          this.altitudeDrop = Math.min(this.altitudeDrop + 60, 180);
          SFX.altitudeDrop();
          this.cameras.main.shake(800, 0.022);
          this.cameras.main.flash(300, 255, 50, 0);
          this.showFloatingText("📉 PERDENDO ALTITUDE!", 0xff6600);
        } else if (level >= 3) {
          // Perde vida
          state.lives--;
          state.consecutiveErrors = 0;
          this.altitudeDrop = 0;
          this.turbulence = false;
          SFX.loseLife();
          this.updateLivesDisplay();
          this.cameras.main.shake(1000, 0.03);
          this.cameras.main.flash(400, 255, 0, 0);
          this.showFloatingText("💥 SISTEMA COLAPSANDO!", 0xff0000);

          if (state.lives <= 0) {
            this.time.delayedCall(800, () => {
              this.cameras.main.fade(600, 0, 0, 0);
              this.time.delayedCall(620, () =>
                this.scene.start("GameOverScene", { win: false, score: state.score })
              );
            });
            return true; // game over
          }
        }
        return false;
      }

      showFloatingText(msg, color) {
        const txt = this.add.text(this.W / 2, this.H / 2 - 60, msg, {
          fontSize: "22px", fontFamily: "monospace", fontStyle: "bold",
          color: "#" + color.toString(16).padStart(6, "0"),
          stroke: "#000000", strokeThickness: 4,
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({
          targets: txt, y: txt.y - 60, alpha: 0,
          duration: 1400, ease: "Power2",
          onComplete: () => txt.destroy(),
        });
      }

      update() {
        const W = this.W, H = this.H;

        if (this.cursors.left.isDown) this.playerX = Math.max(30, this.playerX - 6);
        if (this.cursors.right.isDown) this.playerX = Math.min(W - 30, this.playerX + 6);
        this.drawPlayerShip();

        this.bullets.getChildren().forEach((b) => {
          b.y -= 12;
          if (b.y < 0) b.destroy();
        });

        const bulletsArr = [...this.bullets.getChildren()];
        const enemiesArr = [...this.answers.getChildren()];

        for (const bullet of bulletsArr) {
          for (const enemy of enemiesArr) {
            const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.bx, enemy.by);
            if (dist < 75) {
              bullet.destroy();
              this.bullets.remove(bullet);
              const idx = this.answers.getChildren().indexOf(enemy);

              if (enemy.answer === this.questions[state.currentQuestion].correct) {
                // ✅ CORRECT
                SFX.correct();
                state.score += 100 + state.currentPhase * 50;
                state.consecutiveErrors = 0;
                this.altitudeDrop = 0;
                this.turbulence = false;
                this.scoreText.setText("Pontos: " + state.score);
                this.spawnExplosion(enemy.bx, enemy.by, this.cfg.accentColor, true);
                this.showFloatingText("+100 pts ✓", 0x00ff88);
                if (this.answerTexts[idx]) { this.answerTexts[idx].destroy(); this.answerTexts.splice(idx, 1); this.answerBoxGfx.splice(idx, 1); }
                enemy.destroy(); this.answers.remove(enemy);

                state.currentQuestion++;
                if (state.currentQuestion >= this.questions.length) {
                  // Phase complete
                  state.currentPhase++;
                  this.cameras.main.fade(500, 0, 0, 0);
                  if (state.currentPhase >= phaseData.length) {
                    this.time.delayedCall(520, () =>
                      this.scene.start("GameOverScene", { win: true, score: state.score })
                    );
                  } else {
                    state.currentQuestion = 0;
                    this.time.delayedCall(520, () => this.scene.start("PhaseIntroScene"));
                  }
                  return;
                }
                this.questionText.setText(this.questions[state.currentQuestion].question);
                this.updateErrorDisplay();
                this.time.delayedCall(200, () => this.createAnswers());

              } else {
                // ❌ WRONG
                SFX.wrong();
                state.consecutiveErrors++;
                state.totalErrors++;
                this.spawnExplosion(enemy.bx, enemy.by, 0xff3300, false);
                if (this.answerTexts[idx]) { this.answerTexts[idx].destroy(); this.answerTexts.splice(idx, 1); this.answerBoxGfx.splice(idx, 1); }
                enemy.destroy(); this.answers.remove(enemy);
                this.updateErrorDisplay();

                const gameOver = this.applyPenalty(state.consecutiveErrors);
                if (!gameOver) {
                  this.time.delayedCall(300, () => this.createAnswers());
                }
              }
              break;
            }
          }
        }
      }

      spawnExplosion(x, y, color, big) {
        const count = big ? 14 : 8;
        for (let i = 0; i < count; i++) {
          const size = big ? Phaser.Math.Between(5, 14) : Phaser.Math.Between(3, 10);
          const p = this.add.circle(x, y, size, color, 1);
          const angle = (i / count) * Math.PI * 2;
          const dist = big ? Phaser.Math.Between(40, 90) : Phaser.Math.Between(25, 60);
          this.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            alpha: 0, scale: 0.2,
            duration: Phaser.Math.Between(350, 600),
            onComplete: () => p.destroy(),
          });
        }
      }
    }

    // ═══════════════════════════════════════════════
    //  GAME OVER SCENE
    // ═══════════════════════════════════════════════
    class GameOverScene extends Phaser.Scene {
      constructor() { super("GameOverScene"); }
      init(data) { this.win = data.win; this.finalScore = data.score || 0; }

      create() {
        const W = this.scale.width, H = this.scale.height;
        this.cameras.main.setBackgroundColor("#050816");
        this.spawnStars(W, H);

        const gfx = this.add.graphics();
        gfx.fillStyle(this.win ? 0x00ffcc : 0xff0000, 0.07);
        gfx.fillCircle(W / 2, H / 2, 320);

        // Title
        this.add.text(W / 2, this.win ? 80 : 75, this.win ? "MISSÃO\nCONCLUÍDA!" : "GAME\nOVER", {
          fontSize: "70px", color: this.win ? "#00ffcc" : "#ff3333",
          fontStyle: "bold", fontFamily: "monospace",
          stroke: "#000000", strokeThickness: 6, align: "center",
        }).setOrigin(0.5);

        // Som de vitória ou derrota
        this.time.delayedCall(200, () => this.win ? SFX.victory() : SFX.gameOver());

        // Collapse message for lose
        if (!this.win) {
          this.add.text(W / 2, 210, "Seu sistema Neural entrou em colapso!", {
            fontSize: "18px", color: "#ff8888", fontFamily: "monospace",
            fontStyle: "bold", align: "center",
          }).setOrigin(0.5);
        } else {
          this.add.text(W / 2, 210, "Seu sistema neural está em pleno funcionamento!", {
            fontSize: "17px", color: "#88ffcc", fontFamily: "monospace", align: "center",
          }).setOrigin(0.5);
        }

        // Score box
        const scoreBox = this.add.graphics();
        scoreBox.fillStyle(0x0a0a33, 0.92);
        scoreBox.fillRoundedRect(W / 2 - 180, 240, 360, 90, 12);
        scoreBox.lineStyle(2, this.win ? 0x00ffcc : 0xff3333, 0.7);
        scoreBox.strokeRoundedRect(W / 2 - 180, 240, 360, 90, 12);

        this.add.text(W / 2, 262, "PONTUAÇÃO FINAL", {
          fontSize: "15px", color: "#8888cc", fontFamily: "monospace",
        }).setOrigin(0.5);
        this.add.text(W / 2, 293, `${this.finalScore} pts`, {
          fontSize: "38px", color: this.win ? "#00ffcc" : "#ff5555",
          fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5);
        this.add.text(W / 2, 320, `Fase ${Math.min(state.currentPhase + 1, 3)} de 3 completada`, {
          fontSize: "13px", color: "#666699", fontFamily: "monospace",
        }).setOrigin(0.5);

        // Boardscore rank
        let rank, rankColor;
        if (this.finalScore >= 2000) { rank = "🏆 MESTRE DO SISTEMA NERVOSO"; rankColor = "#ffdd00"; }
        else if (this.finalScore >= 1000) { rank = "🔬 EXPLORADOR NEURAL"; rankColor = "#00ffcc"; }
        else { rank = "🧠 NEURÔNIO INICIANTE"; rankColor = "#aaaaff"; }

        const rankBox = this.add.graphics();
        rankBox.fillStyle(0x0a0a20, 0.9);
        rankBox.fillRoundedRect(W / 2 - 210, 348, 420, 62, 10);
        rankBox.lineStyle(2, 0x333366, 0.8);
        rankBox.strokeRoundedRect(W / 2 - 210, 348, 420, 62, 10);
        this.add.text(W / 2, 362, "CLASSIFICAÇÃO", { fontSize: "12px", color: "#555588", fontFamily: "monospace" }).setOrigin(0.5);
        this.add.text(W / 2, 385, rank, {
          fontSize: "18px", color: rankColor, fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5);

        // Score legend
        const legendY = 425;
        const legends = [
          { range: "0 – 999", label: "🧠 Neurônio Iniciante", color: "#aaaaff" },
          { range: "1000 – 1999", label: "🔬 Explorador Neural", color: "#00ffcc" },
          { range: "2000+", label: "🏆 Mestre do Sistema Nervoso", color: "#ffdd00" },
        ];
        const lgBox = this.add.graphics();
        lgBox.fillStyle(0x050515, 0.8);
        lgBox.fillRoundedRect(W / 2 - 200, legendY, 400, 88, 8);
        lgBox.lineStyle(1, 0x222244, 0.6);
        lgBox.strokeRoundedRect(W / 2 - 200, legendY, 400, 88, 8);
        legends.forEach((l, i) => {
          const isActive = (
            (i === 0 && this.finalScore < 1000) ||
            (i === 1 && this.finalScore >= 1000 && this.finalScore < 2000) ||
            (i === 2 && this.finalScore >= 2000)
          );
          this.add.text(W / 2 - 180, legendY + 12 + i * 24, l.range, {
            fontSize: "13px", color: isActive ? "#ffffff" : "#444466", fontFamily: "monospace",
          });
          this.add.text(W / 2 - 60, legendY + 12 + i * 24, l.label, {
            fontSize: "13px", color: isActive ? l.color : "#333355", fontFamily: "monospace",
            fontStyle: isActive ? "bold" : "normal",
          });
        });

        // Buttons
        this.createButton(W / 2, 545, "↺  JOGAR NOVAMENTE", 0x00ffff, 0x002233, () => {
          resetState();
          this.cameras.main.fade(400, 0, 0, 0);
          this.time.delayedCall(420, () => this.scene.start("PhaseIntroScene"));
        });
        this.createButton(W / 2, 610, "⌂  MENU PRINCIPAL", 0xaaaaff, 0x111133, () => {
          this.cameras.main.fade(400, 0, 0, 0);
          this.time.delayedCall(420, () => this.scene.start("MenuScene"));
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);
      }

      createButton(x, y, label, textColor, bgColor, callback) {
        const btn = this.add.rectangle(x, y, 310, 50, bgColor, 1)
          .setInteractive({ useHandCursor: true })
          .setStrokeStyle(2, textColor);
        const txt = this.add.text(x, y, label, {
          fontSize: "21px", color: "#" + textColor.toString(16).padStart(6, "0"),
          fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5);
        btn.on("pointerover", () => { btn.setFillStyle(textColor, 0.18); txt.setScale(1.06); });
        btn.on("pointerout", () => { btn.setFillStyle(bgColor, 1); txt.setScale(1); });
        btn.on("pointerdown", callback);
      }

      spawnStars(W, H) {
        for (let i = 0; i < 100; i++) {
          const star = this.add.circle(
            Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
            1, 0xffffff, Math.random()
          );
          this.tweens.add({
            targets: star, alpha: 0.1,
            duration: Phaser.Math.Between(600, 2000), yoyo: true, repeat: -1,
            delay: Phaser.Math.Between(0, 1000),
          });
        }
      }
    }

    // ═══════════════════════════════════════════════
    //  PHASER CONFIG
    // ═══════════════════════════════════════════════
    const config = {
      type: Phaser.AUTO,
      width: 900,
      height: 680,
      parent: gameRef.current,
      backgroundColor: "#050816",
      scene: [MenuScene, PhaseIntroScene, GameScene, GameOverScene],
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#000",
      display: "flex", justifyContent: "center", alignItems: "center",
    }}>
      <div ref={gameRef} />
    </div>
  );
}