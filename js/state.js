    const state = {
      mode: 'start',
      roundState: 'waiting',
      score: 0,
      lives: 3,
      player: null,
      troops: [],
      banana: null,
      hand: { active: false, t: 0, duration: 1.2, from: { ...HAND_ORIGIN }, to: { ...HAND_ORIGIN } },
      hearts: [],
      particles: [],
      catchAnim: null,
      lastTime: 0,
      acceptance: 0,
      nextAcceptanceUnlock: 10,
      journalPages: []
    };

    const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

    const spriteStore = {
      lilJabRun: null,
      troopRun: null,
      motherOrang: null
    };
