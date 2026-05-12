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
    //  WEB AUDIO ENGINE
    // ═══════════════════════════════════════════════
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function resumeAudio() {
      if (audioCtx.state === "suspended") audioCtx.resume();
    }

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
      menuJingle() {
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => playTone({ freq: f, type: "triangle", duration: 0.25, volume: 0.12, attack: 0.02, decay: 0.2 }), i * 100);
        });
      },
      shoot() {
        playTone({ freq: 880, freqEnd: 220, type: "sawtooth", duration: 0.12, volume: 0.1, attack: 0.005, decay: 0.1 });
      },
      correct() {
        playTone({ freq: 523, type: "triangle", duration: 0.1, volume: 0.15, attack: 0.01, decay: 0.08 });
        setTimeout(() => playTone({ freq: 784, type: "triangle", duration: 0.1, volume: 0.15, attack: 0.01, decay: 0.08 }), 80);
        setTimeout(() => playTone({ freq: 1046, type: "triangle", duration: 0.2, volume: 0.18, attack: 0.01, decay: 0.18 }), 160);
      },
      wrong() {
        playTone({ freq: 300, freqEnd: 150, type: "sawtooth", duration: 0.25, volume: 0.15, attack: 0.01, decay: 0.22 });
        setTimeout(() => playNoise({ duration: 0.15, volume: 0.08, highpass: 400 }), 50);
      },
      turbulence() {
        playNoise({ duration: 0.4, volume: 0.12, highpass: 200 });
        playTone({ freq: 80, freqEnd: 55, type: "sawtooth", duration: 0.4, volume: 0.12, attack: 0.02, decay: 0.35 });
        setTimeout(() => playNoise({ duration: 0.3, volume: 0.1, highpass: 150 }), 250);
      },
      altitudeDrop() {
        [90, 70, 55, 70].forEach((f, i) => {
          setTimeout(() => playTone({ freq: f, type: "sawtooth", duration: 0.12, volume: 0.14, attack: 0.01, decay: 0.1 }), i * 90);
        });
        playNoise({ duration: 0.5, volume: 0.1, highpass: 100 });
      },
      loseLife() {
        playTone({ freq: 200, freqEnd: 60, type: "sawtooth", duration: 0.5, volume: 0.2, attack: 0.01, decay: 0.45 });
        playNoise({ duration: 0.5, volume: 0.15, highpass: 50 });
      },
      phaseTransition() {
        playNoise({ duration: 0.6, volume: 0.13, highpass: 600 });
        setTimeout(() => playTone({ freq: 110, freqEnd: 440, type: "sawtooth", duration: 0.4, volume: 0.12, attack: 0.05, decay: 0.35 }), 200);
      },
      gameOver() {
        [440, 370, 311, 220].forEach((f, i) => {
          setTimeout(() => playTone({ freq: f, type: "sawtooth", duration: 0.3, volume: 0.14, attack: 0.01, decay: 0.28 }), i * 180);
        });
      },
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

        const gfx = this.add.graphics();
        gfx.fillStyle(0x0033ff, 0.08);
        gfx.fillCircle(W / 2, H / 2, Math.min(W, H) * 0.45);

        const titleSize = Math.max(48, Math.min(90, W * 0.1));
        const subtitleSize = Math.max(28, Math.min(58, W * 0.065));

        this.add.text(W / 2, H * 0.14, "NEURO", {
          fontSize: `${titleSize}px`, color: "#00ffff", fontStyle: "bold", fontFamily: "monospace",
          stroke: "#003355", strokeThickness: 6,
        }).setOrigin(0.5);
        this.add.text(W / 2, H * 0.14 + titleSize * 1.0, "FLIGHT", {
          fontSize: `${subtitleSize}px`, color: "#ff00ff", fontStyle: "bold", fontFamily: "monospace",
          stroke: "#330033", strokeThickness: 4,
        }).setOrigin(0.5);
        this.add.text(W / 2, H * 0.14 + titleSize * 1.0 + subtitleSize * 1.1, "A R C A D E", {
          fontSize: `${Math.max(14, W * 0.025)}px`, color: "#aaaaff", fontFamily: "monospace",
        }).setOrigin(0.5);

        this.drawShip(W / 2, H * 0.48, Math.min(2.2, W / 450));

        const phaseColors = [0x00aaff, 0xffaa00, 0xaa00ff];
        const phaseLabels = ["FASE 1\nZona Neural", "FASE 2\nTempestade Elétrica", "FASE 3\nEspaço Neural"];
        const badgeW = Math.floor(Math.min(180, (W - 80) / 3));
        const gap = Math.floor((W - badgeW * 3) / 4);
        const badgeH = 60;
        const badgeY = H * 0.62;
        const badgeFontSize = Math.max(11, Math.min(14, badgeW * 0.085));

        phaseLabels.forEach((label, i) => {
          const bx = gap + i * (badgeW + gap);
          const bg = this.add.graphics();
          bg.fillStyle(phaseColors[i], 0.1);
          bg.fillRoundedRect(bx, badgeY, badgeW, badgeH, 8);
          bg.lineStyle(1, phaseColors[i], 0.5);
          bg.strokeRoundedRect(bx, badgeY, badgeW, badgeH, 8);
          this.add.text(bx + badgeW / 2, badgeY + badgeH / 2, label, {
            fontSize: `${badgeFontSize}px`,
            color: "#" + phaseColors[i].toString(16).padStart(6, "0"),
            fontFamily: "monospace", align: "center",
          }).setOrigin(0.5);
        });

        this.createButton(W / 2, badgeY + badgeH + 50, "▶  INICIAR MISSÃO", 0x00ffff, 0x003344, () => {
          resetState();
          this.cameras.main.fade(400, 0, 0, 0);
          this.time.delayedCall(420, () => this.scene.start("PhaseIntroScene"));
        });

        this.time.delayedCall(300, () => SFX.menuJingle());

        this.add.text(W / 2, H - 30, "← → Mover    ESPAÇO Atirar", {
          fontSize: `${Math.max(13, W * 0.018)}px`, color: "#555599", fontFamily: "monospace",
        }).setOrigin(0.5);

        this.cameras.main.fadeIn(600, 0, 0, 0);
      }

      createButton(x, y, label, textColor, bgColor, callback) {
        const W = this.scale.width;
        const btnW = Math.min(340, W * 0.45);
        const btn = this.add.rectangle(x, y, btnW, 54, bgColor, 1)
          .setInteractive({ useHandCursor: true })
          .setStrokeStyle(2, textColor);
        const txt = this.add.text(x, y, label, {
          fontSize: `${Math.max(16, W * 0.026)}px`, color: "#" + textColor.toString(16).padStart(6, "0"),
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
    //  PHASE INTRO SCENE
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

        this.lightnings = [];
        for (let i = 0; i < 6; i++) {
          this.lightnings.push(this.add.graphics());
        }
        this.lightningTimer = this.time.addEvent({
          delay: 180, callback: this.drawLightning, callbackScope: this, loop: true,
        });

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

        const banner = this.add.graphics();
        banner.fillStyle(col.primary, 0.15);
        banner.fillRect(0, H / 2 - 160, W, 320);
        banner.lineStyle(3, col.primary, 0.8);
        banner.lineBetween(0, H / 2 - 160, W, H / 2 - 160);
        banner.lineBetween(0, H / 2 + 160, W, H / 2 + 160);

        const fs = (base) => `${Math.max(base * 0.7, Math.min(base, W * 0.04))}px`;

        const warnTxt = this.add.text(W / 2, H / 2 - 120, "⚡ TEMPESTADE NEURAL ⚡", {
          fontSize: fs(28), color: "#" + col.primary.toString(16).padStart(6, "0"),
          fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5).setAlpha(0);

        const phaseNum = this.add.text(W / 2, H / 2 - 65, `FASE ${phase.phase}`, {
          fontSize: `${Math.max(48, Math.min(72, W * 0.09))}px`, color: col.text,
          fontFamily: "monospace", fontStyle: "bold", stroke: "#000000", strokeThickness: 8,
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);

        const phaseTitle = this.add.text(W / 2, H / 2 + 10, phase.title, {
          fontSize: fs(36), color: col.text, fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5).setAlpha(0);

        const phaseSub = this.add.text(W / 2, H / 2 + 58, phase.subtitle, {
          fontSize: fs(20), color: "#aaaaaa", fontFamily: "monospace",
        }).setOrigin(0.5).setAlpha(0);

        const topicsTxt = this.add.text(W / 2, H / 2 + 100, phase.topics, {
          fontSize: fs(15), color: "#cccccc", fontFamily: "monospace",
        }).setOrigin(0.5).setAlpha(0);

        const readyTxt = this.add.text(W / 2, H / 2 + 140, "PREPARE-SE...", {
          fontSize: fs(22), color: "#ffffff", fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5).setAlpha(0);

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
            let cy = 0, cx = sx;
            while (cy < H) {
              const nx = cx + Phaser.Math.Between(-60, 60);
              const ny = cy + Phaser.Math.Between(30, 80);
              lg.lineBetween(cx, cy, nx, ny);
              cx = nx; cy = ny;
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

        this.phaseConfig = [
          { bgColor: "#051220", cloudColor: 0x88bbff, cloudAlpha: 0.13, starColor: 0xaaddff, accentColor: 0x00aaff, bulletColor: 0x00ffff, enemyBorder: 0x0066ff },
          { bgColor: "#0a0500", cloudColor: 0xffaa00, cloudAlpha: 0.10, starColor: 0xffddaa, accentColor: 0xffaa00, bulletColor: 0xffff00, enemyBorder: 0xff6600 },
          { bgColor: "#080014", cloudColor: 0xaa55ff, cloudAlpha: 0.10, starColor: 0xddaaff, accentColor: 0xaa00ff, bulletColor: 0xff88ff, enemyBorder: 0x8800ff },
        ];
        this.cfg = this.phaseConfig[state.currentPhase];
        this.cameras.main.setBackgroundColor(this.cfg.bgColor);

        this.buildBackground();

        // HUD
        const hudH = Math.max(80, H * 0.13);
        const hudGfx = this.add.graphics();
        hudGfx.fillStyle(0x000011, 0.7);
        hudGfx.fillRect(0, 0, W, hudH);
        hudGfx.lineStyle(1, this.cfg.accentColor, 0.4);
        hudGfx.lineBetween(0, hudH, W, hudH);
        this.hudH = hudH;

        const fs = Math.max(13, H * 0.025);
        const phaseName = ["ZONA NEURAL", "TEMPESTADE ELÉTRICA", "ESPAÇO NEURAL"][state.currentPhase];
        this.add.text(20, hudH * 0.1, phaseName, { fontSize: `${fs * 0.85}px`, color: "#" + this.cfg.accentColor.toString(16).padStart(6, "0"), fontFamily: "monospace", fontStyle: "bold" });
        this.scoreText = this.add.text(20, hudH * 0.38, "Pontos: 0", { fontSize: `${fs}px`, color: "#ffffff", fontFamily: "monospace" });
        this.lifeText = this.add.text(20, hudH * 0.66, "Vidas: ❤❤❤", { fontSize: `${fs}px`, color: "#ff5555", fontFamily: "monospace" });
        this.questNumText = this.add.text(W - 20, hudH * 0.1, "Q 1/3", { fontSize: `${fs * 0.85}px`, color: "#aaaaff", fontFamily: "monospace" }).setOrigin(1, 0);
        this.add.text(W - 20, hudH * 0.38, ["FASE 1", "FASE 2", "FASE 3"][state.currentPhase], { fontSize: `${fs * 0.85}px`, color: "#" + this.cfg.accentColor.toString(16).padStart(6, "0"), fontFamily: "monospace", fontStyle: "bold" }).setOrigin(1, 0);
        this.errorIndicator = this.add.text(W - 20, hudH * 0.66, "", { fontSize: `${fs * 0.8}px`, color: "#ff4444", fontFamily: "monospace" }).setOrigin(1, 0);

        // Question box
        const qBoxY = hudH + 8;
        const qBoxH = Math.max(70, H * 0.11);
        const qBox = this.add.graphics();
        qBox.fillStyle(0x050520, 0.92);
        qBox.fillRoundedRect(40, qBoxY, W - 80, qBoxH, 10);
        qBox.lineStyle(1.5, this.cfg.accentColor, 0.5);
        qBox.strokeRoundedRect(40, qBoxY, W - 80, qBoxH, 10);
        this.qBoxMidY = qBoxY + qBoxH / 2;
        this.qBoxH = qBoxH;

        this.questions = getQuestions();
        this.questionText = this.add.text(W / 2, this.qBoxMidY, this.questions[state.currentQuestion].question, {
          fontSize: `${Math.max(14, H * 0.022)}px`, color: "#ffff88", fontFamily: "monospace",
          wordWrap: { width: W - 160 }, align: "center",
        }).setOrigin(0.5);

        // Ship
        this.playerX = W / 2;
        this.playerY = H - Math.max(60, H * 0.09);
        this.shipGfx = this.add.graphics();
        this.drawPlayerShip();

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
          this.spawnStars(W, H, cfg.starColor, 80);
          for (let i = 0; i < 8; i++) {
            const g = this.add.graphics();
            const cx = Phaser.Math.Between(50, W - 50);
            const cy = Phaser.Math.Between(this.hudH + 30, H - 100);
            const cw = Phaser.Math.Between(80, 200);
            g.fillStyle(cfg.cloudColor, cfg.cloudAlpha);
            g.fillEllipse(cx, cy, cw, cw * 0.45);
            g.fillEllipse(cx - cw * 0.25, cy + 8, cw * 0.6, cw * 0.35);
            g.fillEllipse(cx + cw * 0.25, cy + 8, cw * 0.55, cw * 0.3);
            this.tweens.add({ targets: g, x: `+=${Phaser.Math.Between(15, 35)}`, duration: Phaser.Math.Between(4000, 8000), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }
        } else if (state.currentPhase === 1) {
          this.spawnStars(W, H, cfg.starColor, 60);
          this.stormGfx = this.add.graphics();
          this.stormTimer = this.time.addEvent({ delay: 220, callback: this.drawStormLightning, callbackScope: this, loop: true });
        } else {
          this.spawnStars(W, H, cfg.starColor, 140);
          for (let i = 0; i < 5; i++) {
            const g = this.add.graphics();
            g.fillStyle(Phaser.Math.Between(0x220044, 0x440088), 0.08);
            g.fillEllipse(Phaser.Math.Between(0, W), Phaser.Math.Between(this.hudH + 30, H), Phaser.Math.Between(150, 350), Phaser.Math.Between(80, 200));
          }
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
            let cx = sx, cy = this.hudH;
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
        g.lineBetween(sx, this.hudH, sx + Phaser.Math.Between(-100, 100), this.H);
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
        const s = Math.max(0.8, Math.min(1.4, this.H / 600));
        g.fillStyle(0xff6600, 0.85);
        g.fillTriangle(x - 8 * s, y + 18 * s, x + 8 * s, y + 18 * s, x, y + 34 * s);
        g.fillStyle(0xffaa00, 0.4);
        g.fillTriangle(x - 4 * s, y + 18 * s, x + 4 * s, y + 18 * s, x, y + 28 * s);
        g.fillStyle(0x005599, 1);
        g.fillTriangle(x - 18 * s, y + 8 * s, x - 42 * s, y + 22 * s, x - 8 * s, y + 18 * s);
        g.fillTriangle(x + 18 * s, y + 8 * s, x + 42 * s, y + 22 * s, x + 8 * s, y + 18 * s);
        g.lineStyle(1, this.cfg.accentColor, 0.6);
        g.strokeTriangle(x - 18 * s, y + 8 * s, x - 42 * s, y + 22 * s, x - 8 * s, y + 18 * s);
        g.strokeTriangle(x + 18 * s, y + 8 * s, x + 42 * s, y + 22 * s, x + 8 * s, y + 18 * s);
        g.fillStyle(0x00ccff, 1);
        g.fillTriangle(x, y - 28 * s, x - 18 * s, y + 16 * s, x + 18 * s, y + 16 * s);
        g.lineStyle(1, 0xaaffff, 0.5);
        g.strokeTriangle(x, y - 28 * s, x - 18 * s, y + 16 * s, x + 18 * s, y + 16 * s);
        g.fillStyle(0xaaffff, 0.7);
        g.fillEllipse(x, y - 4 * s, 14 * s, 18 * s);
        g.fillStyle(0x003366, 1);
        g.fillRect(x - 14 * s, y + 4 * s, 4 * s, 10 * s);
        g.fillRect(x + 10 * s, y + 4 * s, 4 * s, 10 * s);
        if (this.turbulence) {
          g.x = Phaser.Math.Between(-3, 3);
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
        const W = this.W, H = this.H;
        const spacing = W / data.answers.length;
        const answerAreaStart = this.hudH + this.qBoxH + 30;
        const answerAreaEnd = this.playerY - 80;
        const baseY = answerAreaStart + (answerAreaEnd - answerAreaStart) * 0.35 + this.altitudeDrop;
        const boxW = Math.min(160, spacing * 0.85);
        const boxH = Math.max(50, H * 0.08);
        const fontSize = Math.max(13, H * 0.02);

        this.questNumText.setText(`Q ${state.currentQuestion + 1}/${this.questions.length}`);

        data.answers.forEach((answer, index) => {
          const ex = spacing * index + spacing / 2;
          const ey = baseY;

          const box = this.add.graphics();
          box.fillStyle(0x001133, 0.92);
          box.fillRoundedRect(ex - boxW / 2, ey - boxH / 2, boxW, boxH, 8);
          box.lineStyle(2, this.cfg.enemyBorder, 0.75);
          box.strokeRoundedRect(ex - boxW / 2, ey - boxH / 2, boxW, boxH, 8);
          box.answer = answer;
          box.bx = ex;
          box.by = ey;

          const txt = this.add.text(ex, ey, answer, {
            fontSize: `${fontSize}px`, color: "#ffffff", fontFamily: "monospace",
            wordWrap: { width: boxW - 12 }, align: "center",
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
        bullet.setStrokeStyle(2, this.cfg.bulletColor);
        this.bullets.add(bullet);
      }

      applyPenalty(level) {
        if (level === 1) {
          this.turbulence = true;
          SFX.turbulence();
          this.cameras.main.shake(600, 0.015);
          this.cameras.main.flash(200, 255, 100, 0);
          this.showFloatingText("⚡ TURBULÊNCIA!", 0xffaa00);
          this.time.delayedCall(2000, () => { this.turbulence = false; });
        } else if (level === 2) {
          this.altitudeDrop = Math.min(this.altitudeDrop + 60, 180);
          SFX.altitudeDrop();
          this.cameras.main.shake(800, 0.022);
          this.cameras.main.flash(300, 255, 50, 0);
          this.showFloatingText("📉 PERDENDO ALTITUDE!", 0xff6600);
        } else if (level >= 3) {
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
            return true;
          }
        }
        return false;
      }

      showFloatingText(msg, color) {
        const txt = this.add.text(this.W / 2, this.H / 2 - 60, msg, {
          fontSize: `${Math.max(16, this.H * 0.03)}px`, fontFamily: "monospace", fontStyle: "bold",
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
        const speed = Math.max(5, W * 0.007);
        if (this.cursors.left.isDown) this.playerX = Math.max(30, this.playerX - speed);
        if (this.cursors.right.isDown) this.playerX = Math.min(W - 30, this.playerX + speed);
        this.drawPlayerShip();

        this.bullets.getChildren().forEach((b) => {
          b.y -= Math.max(10, H * 0.018);
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
        gfx.fillCircle(W / 2, H / 2, Math.min(W, H) * 0.4);

        const titleSize = Math.max(40, Math.min(70, H * 0.1));
        this.add.text(W / 2, H * 0.1, this.win ? "MISSÃO\nCONCLUÍDA!" : "GAME\nOVER", {
          fontSize: `${titleSize}px`, color: this.win ? "#00ffcc" : "#ff3333",
          fontStyle: "bold", fontFamily: "monospace",
          stroke: "#000000", strokeThickness: 6, align: "center",
        }).setOrigin(0.5);

        this.time.delayedCall(200, () => this.win ? SFX.victory() : SFX.gameOver());

        const fs = Math.max(13, H * 0.022);

        this.add.text(W / 2, H * 0.32, this.win
          ? "Seu sistema neural está em pleno funcionamento!"
          : "Seu sistema Neural entrou em colapso!", {
          fontSize: `${fs * 0.85}px`, color: this.win ? "#88ffcc" : "#ff8888",
          fontFamily: "monospace", align: "center",
        }).setOrigin(0.5);

        // Score box
        const scoreBoxY = H * 0.37;
        const scoreBoxH = H * 0.13;
        const scoreBox = this.add.graphics();
        scoreBox.fillStyle(0x0a0a33, 0.92);
        scoreBox.fillRoundedRect(W / 2 - W * 0.25, scoreBoxY, W * 0.5, scoreBoxH, 12);
        scoreBox.lineStyle(2, this.win ? 0x00ffcc : 0xff3333, 0.7);
        scoreBox.strokeRoundedRect(W / 2 - W * 0.25, scoreBoxY, W * 0.5, scoreBoxH, 12);

        this.add.text(W / 2, scoreBoxY + scoreBoxH * 0.22, "PONTUAÇÃO FINAL", {
          fontSize: `${fs * 0.7}px`, color: "#8888cc", fontFamily: "monospace",
        }).setOrigin(0.5);
        this.add.text(W / 2, scoreBoxY + scoreBoxH * 0.58, `${this.finalScore} pts`, {
          fontSize: `${Math.max(28, H * 0.055)}px`, color: this.win ? "#00ffcc" : "#ff5555",
          fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5);
        this.add.text(W / 2, scoreBoxY + scoreBoxH * 0.88, `Fase ${Math.min(state.currentPhase + 1, 3)} de 3 completada`, {
          fontSize: `${fs * 0.65}px`, color: "#666699", fontFamily: "monospace",
        }).setOrigin(0.5);

        // Rank
        let rank, rankColor;
        if (this.finalScore >= 2000) { rank = "🏆 MESTRE DO SISTEMA NERVOSO"; rankColor = "#ffdd00"; }
        else if (this.finalScore >= 1000) { rank = "🔬 EXPLORADOR NEURAL"; rankColor = "#00ffcc"; }
        else { rank = "🧠 NEURÔNIO INICIANTE"; rankColor = "#aaaaff"; }

        const rankBoxY = H * 0.52;
        const rankBox = this.add.graphics();
        rankBox.fillStyle(0x0a0a20, 0.9);
        rankBox.fillRoundedRect(W / 2 - W * 0.29, rankBoxY, W * 0.58, H * 0.09, 10);
        rankBox.lineStyle(2, 0x333366, 0.8);
        rankBox.strokeRoundedRect(W / 2 - W * 0.29, rankBoxY, W * 0.58, H * 0.09, 10);
        this.add.text(W / 2, rankBoxY + H * 0.018, "CLASSIFICAÇÃO", { fontSize: `${fs * 0.6}px`, color: "#555588", fontFamily: "monospace" }).setOrigin(0.5);
        this.add.text(W / 2, rankBoxY + H * 0.055, rank, {
          fontSize: `${fs * 0.9}px`, color: rankColor, fontFamily: "monospace", fontStyle: "bold",
        }).setOrigin(0.5);

        // Legend
        const legendY = H * 0.63;
        const legends = [
          { range: "0 – 999", label: "🧠 Neurônio Iniciante", color: "#aaaaff" },
          { range: "1000 – 1999", label: "🔬 Explorador Neural", color: "#00ffcc" },
          { range: "2000+", label: "🏆 Mestre do Sistema Nervoso", color: "#ffdd00" },
        ];
        const lgBox = this.add.graphics();
        lgBox.fillStyle(0x050515, 0.8);
        lgBox.fillRoundedRect(W / 2 - W * 0.27, legendY, W * 0.54, H * 0.13, 8);
        lgBox.lineStyle(1, 0x222244, 0.6);
        lgBox.strokeRoundedRect(W / 2 - W * 0.27, legendY, W * 0.54, H * 0.13, 8);
        legends.forEach((l, i) => {
          const isActive = (
            (i === 0 && this.finalScore < 1000) ||
            (i === 1 && this.finalScore >= 1000 && this.finalScore < 2000) ||
            (i === 2 && this.finalScore >= 2000)
          );
          const ly = legendY + H * 0.018 + i * H * 0.036;
          this.add.text(W / 2 - W * 0.24, ly, l.range, {
            fontSize: `${fs * 0.65}px`, color: isActive ? "#ffffff" : "#444466", fontFamily: "monospace",
          });
          this.add.text(W / 2 - W * 0.1, ly, l.label, {
            fontSize: `${fs * 0.65}px`, color: isActive ? l.color : "#333355",
            fontFamily: "monospace", fontStyle: isActive ? "bold" : "normal",
          });
        });

        // Buttons
        this.createButton(W / 2, H * 0.8, "↺  JOGAR NOVAMENTE", 0x00ffff, 0x002233, () => {
          resetState();
          this.cameras.main.fade(400, 0, 0, 0);
          this.time.delayedCall(420, () => this.scene.start("PhaseIntroScene"));
        });
        this.createButton(W / 2, H * 0.9, "⌂  MENU PRINCIPAL", 0xaaaaff, 0x111133, () => {
          this.cameras.main.fade(400, 0, 0, 0);
          this.time.delayedCall(420, () => this.scene.start("MenuScene"));
        });

        this.cameras.main.fadeIn(500, 0, 0, 0);
      }

      createButton(x, y, label, textColor, bgColor, callback) {
        const W = this.scale.width, H = this.scale.height;
        const btnW = Math.min(340, W * 0.45);
        const btn = this.add.rectangle(x, y, btnW, Math.max(44, H * 0.065), bgColor, 1)
          .setInteractive({ useHandCursor: true })
          .setStrokeStyle(2, textColor);
        const txt = this.add.text(x, y, label, {
          fontSize: `${Math.max(15, H * 0.028)}px`, color: "#" + textColor.toString(16).padStart(6, "0"),
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
    //  PHASER CONFIG — FULLSCREEN RESPONSIVO
    // ═══════════════════════════════════════════════
    const container = gameRef.current;
    const W = window.screen.width > window.innerWidth ? window.innerWidth : window.screen.width;
    const H = window.innerHeight;

    const config = {
      type: Phaser.AUTO,
      width: W,
      height: H,
      parent: gameRef.current,
      backgroundColor: "#050816",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [MenuScene, PhaseIntroScene, GameScene, GameOverScene],
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, []);

  return (
    <div
      ref={gameRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}