const MOTHER_LEDGE = { x: canvas.width - 120, y: 112 };
const SPAWN_POS = tileCenter(SPAWN_TILE.c, SPAWN_TILE.r);

    function loadSprites() {
      spriteStore.lilJabRun = new Image();
      spriteStore.lilJabRun.src = 'sprites/jab-sprite.png';
    
      spriteStore.troopRun = new Image();
      spriteStore.troopRun.src = 'sprites/troop-sprite.png';
    
      //spriteStore.motherOrang = new Image();
      //spriteStore.motherOrang.src = 'sprites/mother-orang.jpg';
    }

    loadSprites();
    setTimeout(() => {
      console.log('jab src:', spriteStore.lilJabRun?.src);
      console.log('jab loaded:', spriteStore.lilJabRun?.complete);
      console.log('troop loaded:', spriteStore.troopRun?.complete);
      console.log('mother loaded:', spriteStore.motherOrang?.complete);
    }, 1000);

    function drawPathGuide() {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 245, 200, 0.28)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!walkable(c, r)) continue;

          const p = tileCenter(c, r);

          if (walkable(c + 1, r)) {
            const right = tileCenter(c + 1, r);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
          }

          if (walkable(c, r + 1)) {
            const down = tileCenter(c, r + 1);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(down.x, down.y);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    } 

    function resetActors() {
      state.player = new Player(SPAWN_POS.x, SPAWN_POS.y);
      state.player.snapToCenter();

      const spawns = TROOP_SPAWN_TILES.map(t => tileCenter(t.c, t.r));
      state.troops = spawns.map((p, i) =>
        new Troop(p.x, p.y, ['#7c5c46', '#6c4d39', '#8d6b52', '#5f4331'][i])
      );
    }

    function startGame() {
      state.mode = 'playing';
      state.score = 0;
      state.lives = 3;
      state.hearts = [];
      state.particles = [];
      state.catchAnim = null;
      resetActors();
      newRound();
      updateHud('Lil\' Jab is waiting for the toss.');
    }

    function newRound() {
      state.player.frame = 0;
      state.player.animTime = 0;
      state.roundState = 'waiting';
      state.player.x = SPAWN_POS.x;
      state.player.y = SPAWN_POS.y;
      state.player.dir = { x: 0, y: 0 };
      state.player.nextDir = { x: 0, y: 0 };
      state.player.bufferedDir = { x: 0, y: 0 };
      state.player.hasBanana = false;
      state.player.panicking = false;
      state.player.movedThisRound = false;
      state.catchAnim = null;
      state.troops.forEach((t, i) => {
        const p = tileCenter(TROOP_SPAWN_TILES[i].c, TROOP_SPAWN_TILES[i].r);
        t.frame = 0;
        t.animTime = 0;  
        t.x = p.x;
        t.y = p.y;
        t.dir = { x: 0, y: 0 };
        t.nextDir = { x: 0, y: 0 };
        t.bufferedDir = { x: 0, y: 0 };
      });
      tossBanana();
    }

    function tossBanana() {
      const targetTile = choose(BANANA_SPAWNS);
      const to = tileCenter(targetTile.c, targetTile.r);
      state.banana = {
        x: to.x,
        y: to.y,
        targetX: to.x,
        targetY: to.y,
        landed: false,
        age: 0,
        size: 1,
        tile: targetTile
      };
      state.hand = {
        active: true,
        t: 0,
        duration: 0.9,
        from: { x: HAND_ORIGIN.x, y: HAND_ORIGIN.y + rand(-20, 20) },
        to: { x: to.x, y: to.y }
      };
    }

    function updateHud(msg) {
      scoreEl.textContent = state.score;
      livesEl.textContent = state.lives;

      if (!state.banana || !state.banana.landed) {
        ripenessEl.textContent = 'airborne';
      } else if (state.player?.hasBanana) {
        ripenessEl.textContent = 'secured';
      } else {
        ripenessEl.textContent = ripenessLabel(state.banana.age).label;
      }

      if (msg) {
        statusEl.textContent = msg;
        statusEl.className = 'pill status';
      }

      if (state.mode === 'gameOver') {
        statusEl.textContent = 'Lil\' Jab got tossed off the board. Press Space.';
        statusEl.className = 'pill status danger';
      }
    }

    function ripenessLabel(age) {
      if (age >= 9) return { label: 'golden', points: 3, color: '#f59e0b' };
      if (age >= 5) return { label: 'yellow', points: 2, color: '#fde047' };
      return { label: 'green', points: 1, color: '#84cc16' };
    }

    function handleInput() {
      if (!state.player) return;

      if (keys.ArrowUp) state.player.bufferedDir = { x: 0, y: -1 };
      else if (keys.ArrowDown) state.player.bufferedDir = { x: 0, y: 1 };
      else if (keys.ArrowLeft) state.player.bufferedDir = { x: -1, y: 0 };
      else if (keys.ArrowRight) state.player.bufferedDir = { x: 1, y: 0 };
    }

    function isIntersection(c, r) {
      if (!walkable(c, r)) return false;

      let exits = 0;
      if (walkable(c + 1, r)) exits++;
      if (walkable(c - 1, r)) exits++;
      if (walkable(c, r + 1)) exits++;
      if (walkable(c, r - 1)) exits++;

      return exits >= 3;
    }

    function drawTurnHints() {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 245, 200, 0.18)';

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!isIntersection(c, r)) continue;
          const p = tileCenter(c, r);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    function updateHand(dt) {
      if (!state.hand.active || !state.banana) return;
      state.hand.t += dt / state.hand.duration;
      const t = clamp(state.hand.t, 0, 1);
      const p0 = state.hand.from;
      const p2 = state.hand.to;
      const peak = { x: (p0.x + p2.x) / 2 - 40, y: Math.min(p0.y, p2.y) - 140 - rand(0, 20) };
      const inv = 1 - t;
      state.banana.x = inv * inv * p0.x + 2 * inv * t * peak.x + t * t * p2.x;
      state.banana.y = inv * inv * p0.y + 2 * inv * t * peak.y + t * t * p2.y;
      if (t >= 1) {
        state.hand.active = false;
        state.banana.landed = true;
        state.banana.x = state.banana.targetX;
        state.banana.y = state.banana.targetY;
        state.particles.push({ kind: 'bounce', x: state.banana.x, y: state.banana.y + 12, t: 0 });
        updateHud('Banana landed. Grab it and get home.');
      }
    }

    function updateBanana(dt) {
      if (!state.banana || !state.banana.landed || state.player?.hasBanana) return;
      state.banana.age += dt;
      state.banana.size = 1 + Math.sin(state.banana.age * 4) * 0.04;
      const d = distance(state.player, state.banana);
      if (d < 26) {
        state.player.hasBanana = true;
        state.roundState = 'chase';
        updateHud('The troop saw that. Run back to Mother Orang.');
      }
    }

//    function updateAnim(actor, dt, fps = 8) {
//      if (!actor || !actor.dir) return;
    
//      const moving = actor.dir.x !== 0 || actor.dir.y !== 0;
    
//      if (!moving) {
//        actor.frame = 0;
        //actor.animTime = 0;
//        return;
//      }
    
//      actor.animTime += dt;
//      actor.frame = Math.floor(actor.animTime * fps) % (actor.frameCount || 4);
//    }  


    function updateAnim(actor, dt, fps = 4) {
      if (!actor || !actor.dir) return;
    
      const moving = actor.dir.x !== 0 || actor.dir.y !== 0;
    
      if (!moving) {
        actor.frame = 0;
        actor.animTime = 0;
        return;
      }
    
      actor.animTime += dt;
      actor.frame = Math.floor(actor.animTime * fps) % (actor.frameCount || 4);
    }

    function updatePlayer(dt) {
      if (!state.player) return;
    
      handleInput();

      const dir = state.player.dir;
      const buf = state.player.bufferedDir;
        
      const isReverse =
        (dir.x !== 0 && buf.x === -dir.x) ||
        (dir.y !== 0 && buf.y === -dir.y);
    
      if (isReverse) {
        state.player.dir = { ...buf };
        state.player.nextDir = { ...buf };
      } else if (state.player.canMove(buf)) {
        state.player.nextDir = { ...buf };
      }
        
      //if (state.player.atCenter() && state.player.canMove(state.player.bufferedDir)) {
        //state.player.nextDir = { ...state.player.bufferedDir };
      //}

      if (state.player.canMove(state.player.bufferedDir)) {
        state.player.nextDir = { ...state.player.bufferedDir };
      }
        
      state.player.update(dt);
      //updateAnim(state.player, dt, 8);
    
      if (state.player.movedThisRound && state.roundState === 'waiting' && state.banana?.landed) {
        state.roundState = 'chase';
      }
    
      if (state.player.hasBanana) {
        const dx = state.player.x - SPAWN_POS.x;
        const dy = state.player.y - SPAWN_POS.y;
        if (Math.hypot(dx, dy) < 50) {
          const ripeness = ripenessLabel(state.banana.age);
          state.score += ripeness.points;
          state.hearts.push({ x: MOTHER_LEDGE.x - 10, y: MOTHER_LEDGE.y - 20, t: 0 });
          state.particles.push({ kind: 'bananaDrop', x: MOTHER_LEDGE.x - 40 + state.score * 6, y: MOTHER_LEDGE.y + 52, t: 0 });
          updateHud(`Mother Orang approves. +${ripeness.points}`);
          newRound();
        }
      }
    }

    function updateTroops(dt) {
      state.troops.forEach(t => {
        t.update(dt);
        //updateAnim(t, dt, 9);
      });
    
      if (state.catchAnim) return;
    
      for (const troop of state.troops) {
        if (distance(state.player, troop) < 34) {
          startCatch(troop);
          break;
        }
      }
    }

    function startCatch(troop) {
      state.catchAnim = {
        troop,
        startX: state.player.x,
        startY: state.player.y,
        endX: SPAWN_POS.x,
        endY: SPAWN_POS.y,
        t: 0,
        duration: 0.8
      };
      state.player.dir = { x: 0, y: 0 };
      state.player.nextDir = { x: 0, y: 0 };
      updateHud('Monkey scream! Lil\' Jab got launched.');
    }

    function updateCatch(dt) {
      if (!state.catchAnim) return;
      const a = state.catchAnim;
      a.t += dt / a.duration;
      const t = clamp(a.t, 0, 1);
      const inv = 1 - t;
      const peakY = Math.min(a.startY, a.endY) - 150;
      state.player.x = inv * inv * a.startX + 2 * inv * t * ((a.startX + a.endX) / 2) + t * t * a.endX;
      state.player.y = inv * inv * a.startY + 2 * inv * t * peakY + t * t * a.endY;
      state.player.facing = t < 0.5 ? 'left' : 'right';
      if (t >= 1) {
        state.lives -= 1;
        if (state.lives <= 0) {
          state.mode = 'gameOver';
          updateHud();
        } else {
          newRound();
          updateHud('Back with Mother Orang. Try again.');
        }
      }
    }

    function updateParticles(dt) {
      state.hearts.forEach(h => h.t += dt);
      state.hearts = state.hearts.filter(h => h.t < 1.1);
      state.particles.forEach(p => p.t += dt);
      state.particles = state.particles.filter(p => p.t < 1);
    }

    function update(dt) {
      if (state.mode !== 'playing') return;
    
      updateHand(dt);
      updateBanana(dt);
    
      if (!state.catchAnim) {
        updatePlayer(dt);
      }
    
      if (state.player) {
        updateTroops(dt);
      }
    
      updateCatch(dt);
      updateParticles(dt);
      updateHud();
    }

    function drawBackground() {
      ctx.drawImage(mountainImage, 0, 0, canvas.width, canvas.height);
    }
    
    function drawRockTile(x, y) {
      ctx.fillStyle = '#8d745c';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#6c5847';
      ctx.fillRect(x, y + TILE - 12, TILE, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(x + 18, y + 16, 10, 0, Math.PI * 2);
      ctx.arc(x + 44, y + 28, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawPathTile(x, y) {
      ctx.fillStyle = '#7ba35a';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#d8c29e';
      ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(x + 10, y + TILE - 18, TILE - 20, 8);
      ctx.fillStyle = '#6b8d4f';
      ctx.fillRect(x + 2, y + 2, 8, 8);
      ctx.fillRect(x + TILE - 10, y + 12, 6, 6);
    }

    function drawMotherLedge() {
      ctx.save();
      const lx = canvas.width - BOARD_X - 260;
      const ly = 96;
      ctx.fillStyle = '#8d745c';
      ctx.beginPath();
      ctx.moveTo(lx, ly + 40);
      ctx.lineTo(lx + 240, ly + 40);
      ctx.lineTo(lx + 220, ly + 88);
      ctx.lineTo(lx + 16, ly + 88);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6c5847';
      ctx.fillRect(lx + 12, ly + 76, 204, 12);

      ctx.translate(MOTHER_LEDGE.x - BOARD_X, MOTHER_LEDGE.y - BOARD_Y);
      if (spriteStore.motherOrang?.complete) {
        ctx.drawImage(spriteStore.motherOrang, -42, -42, 84, 84);
      } else {
        ctx.fillStyle = '#d19d53';
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f6dfc9';
        ctx.beginPath();
        ctx.arc(4, 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(-24, 20, 48, 12);
      }
      ctx.restore();
    }

    function drawHand() {
      const hand = state.hand;
      const x = HAND_ORIGIN.x;
      const y = HAND_ORIGIN.y;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#f3c7a4';
      ctx.fillRect(-12, -8, 40, 18);
      ctx.fillRect(18, -16, 12, 10);
      ctx.fillRect(18, -2, 12, 10);
      ctx.fillRect(8, -16, 10, 10);
      ctx.fillRect(-2, -14, 10, 10);
      ctx.fillRect(-8, -10, 10, 10);
      ctx.restore();
    }

    function drawBanana(x, y, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = state.banana ? ripenessLabel(state.banana.age).color : '#fde047';
      ctx.beginPath();
      ctx.moveTo(-12, 5);
      ctx.quadraticCurveTo(2, -18, 18, -4);
      ctx.quadraticCurveTo(0, 8, -12, 5);
      ctx.fill();
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    function drawBananaState() {
      if (!state.banana) return;
      drawBanana(state.banana.x, state.banana.y, state.banana.size || 1);
    }

    function drawPathsOverlay() {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      NODES.forEach(n => {
        const p = tileCenter(n.c, n.r);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawHearts() {
      state.hearts.forEach(h => {
        const t = h.t;
        const y = h.y - t * 34;
        const a = 1 - t;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(h.x, y);
        ctx.fillStyle = '#ff5c8a';
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.bezierCurveTo(-18, -12, -28, 10, 0, 30);
        ctx.bezierCurveTo(28, 10, 18, -12, 0, 8);
        ctx.fill();
        ctx.restore();
      });
    }

    function drawParticles() {
      state.particles.forEach(p => {
        if (p.kind === 'bounce') {
          ctx.save();
          ctx.globalAlpha = 1 - p.t;
          ctx.strokeStyle = '#fff7cc';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 12 + p.t * 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        if (p.kind === 'bananaDrop') {
          ctx.save();
          ctx.globalAlpha = 1 - p.t * 0.7;
          ctx.globalAlpha = 1 - p.t * 0.7;
          drawBanana(p.x, p.y, 0.7);
          ctx.restore();
        }
      });
    }

    function drawActors() {
      ctx.globalAlpha = 1;
      state.player?.draw();
      state.troops.forEach(t => t.draw());
      drawHearts();
      drawParticles();
    }

    function drawOverlay() {
      if (state.mode === 'playing') return;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff8dc';
      ctx.textAlign = 'center';
      ctx.font = 'bold 44px Arial';
      ctx.fillText('Baby Monkey Feeding Time', canvas.width / 2, canvas.height / 2 - 40);
      ctx.font = '20px Arial';
      const line = state.mode === 'start'
        ? 'Press Space to start the banana incident.'
        : 'Lil\' Jab was tossed too many times. Press Space.';
      ctx.fillText(line, canvas.width / 2, canvas.height / 2 + 8);
      ctx.font = '16px Arial';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('Human detected. Banana etiquette unacceptable.', canvas.width / 2, canvas.height / 2 + 42);
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();
      // drawCaveDebug();
      // drawPathGuide();
      // drawPathsOverlay();
      drawCaveHints();
      drawTurnHints();
      drawBananaState();
      drawActors();
      drawHand();
      //drawMotherLedge();
      drawOverlay();
    }

    function drawCaveHints() {
      ctx.save();
      CAVES.forEach(cave => {
        const p = tileCenter(cave.c, cave.r);
        const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 26);
        grad.addColorStop(0, 'rgba(255, 180, 80, 0.20)');
        grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function drawCaveDebug() {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      CAVES.forEach(cave => {
        const p = tileCenter(cave.c, cave.r);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function getDirRow(facing) {
      if (facing === 'down') return 0;
      if (facing === 'left') return 1;
      if (facing === 'right') return 1;
      if (facing === 'up') return 2;
      return 0;
    }
    
    function drawSheetFrame(img, frame, facing, frameWidth, frameHeight, drawWidth, drawHeight) {
      if (!img || !img.complete) return;
    
      const row = getDirRow(facing);
      const sx = frame * frameWidth;
      const sy = row * frameHeight;
    
      ctx.save();
    
      if (facing === 'right') {
        ctx.scale(-1, 1);
      }
    
      ctx.drawImage(
        img,
        sx,
        sy,
        frameWidth,
        frameHeight,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
    
      ctx.restore();
    } 

    function loop(ts) {
      const dt = Math.min((ts - state.lastTime) / 1000, 0.05);
      state.lastTime = ts;
      update(dt || 0);
      draw();
      loadSprites();
      requestAnimationFrame(loop);
    }

    document.addEventListener('keydown', e => {
      if (e.key in keys) {
        keys[e.key] = true;
        e.preventDefault();
      }
      if (e.code === 'Space') {
        if (state.mode === 'start' || state.mode === 'gameOver') startGame();
      }
    });

    document.addEventListener('keyup', e => {
      if (e.key in keys) {
        keys[e.key] = false;
        e.preventDefault();
      }
    });

    updateHud();

    requestAnimationFrame(loop);







