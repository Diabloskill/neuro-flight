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
    };

    function resetState() {
      state = {
        currentPhase: 0,
        currentQuestion: 0,
        score: 0,
        lives: 3,
      };
    }

    // ═══════════════════════════════════════════════
    // AUDIO (IGUAL AO SEU)
    // ═══════════════════════════════════════════════
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function resumeAudio() {
      if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function playTone({ freq = 440, type = "sine", duration = 0.15, volume = 0.18 }) {
      resumeAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = type;
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }

    const SFX = {
      shoot: () => playTone({ freq: 880, type: "square", duration: 0.1 }),
      correct: () => playTone({ freq: 600, type: "triangle", duration: 0.2 }),
      wrong: () => playTone({ freq: 180, type: "sawtooth", duration: 0.25 }),
      lose: () => playTone({ freq: 100, type: "sawtooth", duration: 0.5 }),
    };

    function shuffleArr(arr) {
      return [...arr].sort(() => Math.random() - 0.5);
    }

    function getQuestions() {
      return phaseData[state.currentPhase].questions.map((q) => ({
        ...q,
        answers: shuffleArr(q.answers),
      }));
    }

    // ═══════════════════════════════════════════════
    // MENU
    // ═══════════════════════════════════════════════
    class MenuScene extends Phaser.Scene {
      constructor() {
        super("MenuScene");
      }

      create() {
        this.add.text(400, 200, "NEURO FLIGHT", {
          fontSize: "48px",
          color: "#00ffff",
        }).setOrigin(0.5);

        const btn = this.add.text(400, 350, "JOGAR", {
          fontSize: "32px",
          color: "#ffffff",
          backgroundColor: "#222",
          padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive();

        btn.on("pointerdown", () => {
          resetState();
          this.scene.start("PhaseIntroScene");
        });
      }
    }

    // ═══════════════════════════════════════════════
    // PHASE INTRO
    // ═══════════════════════════════════════════════
    class PhaseIntroScene extends Phaser.Scene {
      constructor() {
        super("PhaseIntroScene");
      }

      create() {
        this.time.delayedCall(1500, () => {
          this.scene.start("GameScene");
        });
      }
    }

    // ═══════════════════════════════════════════════
    // GAME
    // ═══════════════════════════════════════════════
    class GameScene extends Phaser.Scene {
      constructor() {
        super("GameScene");
      }

      create() {
        this.questions = getQuestions();
        this.currentQ = 0;

        this.questionText = this.add.text(400, 100, this.questions[0].question, {
          fontSize: "20px",
          color: "#fff",
        }).setOrigin(0.5);

        this.livesText = this.add.text(20, 20, "Vidas: ❤❤❤", {
          fontSize: "18px",
          color: "#ff4444",
        });

        this.createAnswers();
      }

      createAnswers() {
        this.answersGroup = [];

        const q = this.questions[this.currentQ];

        q.answers.forEach((a, i) => {
          const btn = this.add.text(200, 200 + i * 60, a, {
            fontSize: "18px",
            color: "#fff",
            backgroundColor: "#333",
            padding: { x: 10, y: 5 },
          }).setInteractive();

          btn.on("pointerdown", () => this.checkAnswer(a));
          this.answersGroup.push(btn);
        });
      }

      checkAnswer(answer) {
        const q = this.questions[this.currentQ];

        if (answer === q.correct) {
          SFX.correct();
          state.score += 100;
        } else {
          SFX.wrong();

          // 🔥 REGRA NOVA: 1 ERRO = -1 VIDA
          state.lives--;

          this.livesText.setText(
            "Vidas: " + "❤".repeat(Math.max(0, state.lives))
          );

          if (state.lives <= 0) {
            SFX.lose();
            this.scene.start("MenuScene");
            return;
          }
        }

        this.nextQuestion();
      }

      nextQuestion() {
        this.currentQ++;

        if (this.currentQ >= this.questions.length) {
          state.currentPhase++;

          if (state.currentPhase >= phaseData.length) {
            this.scene.start("MenuScene");
            return;
          }

          this.scene.restart();
        } else {
          this.scene.restart();
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      scene: [MenuScene, PhaseIntroScene, GameScene],
    };

    const game = new Phaser.Game(config);

    return () => game.destroy(true);

  }, []);

  return (
    <div ref={gameRef} style={{ width: "100%", height: "100vh" }} />
  );
}