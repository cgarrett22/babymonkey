    class Actor {
      constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.radius = 22;
        this.dir = { x: 0, y: 0 };
        this.nextDir = { x: 0, y: 0 };
        this.facing = 'right';
        this.frame = 0;
        this.animTime = 0;
        this.frameCount = 4;
        this.frameTime = 0;
        this.bufferedDir = { x: 0, y: 0 };
      }

      get tile() { return pointToTile(this.x, this.y); }

      centerOfTile() {
        const { c, r } = this.tile;
        return tileCenter(c, r);
      }

      atCenter() {
        const center = this.centerOfTile();
        return Math.abs(this.x - center.x) < 0.5 && Math.abs(this.y - center.y) < 0.5;
      }

      snapToCenter() {
        const center = this.centerOfTile();
        this.x = center.x;
        this.y = center.y;
      }

      canMove(dir) {
        if (dir.x === 0 && dir.y === 0) return true;
        const { c, r } = this.tile;
        return walkable(c + dir.x, r + dir.y);
      }

      move(dt) {
        if (this.atCenter()) {
          this.snapToCenter();
          if (this.canMove(this.nextDir)) this.dir = { ...this.nextDir };
          if (!this.canMove(this.dir)) this.dir = { x: 0, y: 0 };
          this.handleCave();
        }

        this.x += this.dir.x * this.speed * dt;
        this.y += this.dir.y * this.speed * dt;

        if (Math.abs(this.dir.x) > 0 || Math.abs(this.dir.y) > 0) {
          if (this.dir.x > 0) this.facing = 'right';
          if (this.dir.x < 0) this.facing = 'left';
          if (this.dir.y > 0) this.facing = 'down';
          if (this.dir.y < 0) this.facing = 'up';
        }

        this.frameTime += dt;
        if (this.frameTime > 0.12) {
          this.frameTime = 0;
          this.frame = (this.frame + 1) % 4;
        }
      }
        
      handleCave() {
        const { c, r } = this.tile;
        const cave = CAVES.find(v => v.c === c && v.r === r);
        if (cave) {
          const exit = tileCenter(cave.to.c, cave.to.r);
          this.x = exit.x;
          this.y = exit.y;
        }
      }
    }

    class Player extends Actor {
      constructor(x, y) {
        super(x, y, 175);
        this.hasBanana = false;
        this.panicking = false;
        this.movedThisRound = false;
      }

    update(dt) {
      const movingInput = keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight;
      if (movingInput) this.movedThisRound = true;
      this.panicking = state.troops.some(t => distance(this, t) < 105);
      this.speed = this.panicking ? 195 : 175;
      this.move(dt);
      updateAnim(this, dt, this.panicking ? 12 : 8);
    }
        
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (spriteStore.lilJabRun) {
          drawSheetFrame(spriteStore.lilJabRun, this.frame, this.facing, 64, 64, 72, 72);
        } else {
          ctx.scale(this.facing === 'left' ? -1 : 1, 1);
          ctx.fillStyle = '#b98b57';
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f6d6b6';
          ctx.beginPath();
          ctx.arc(4, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2d221a';
          ctx.fillRect(6, -2, 3, 3);
          ctx.fillRect(13, -2, 3, 3);
          if (this.hasBanana) drawBanana(12, -18, 0.9);
          if (this.panicking) {
            ctx.fillStyle = '#7dd3fc';
            ctx.beginPath();
            ctx.arc(-12, -18, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    class Troop extends Actor {
      constructor(x, y, color) {
        super(x, y, 132);
        this.color = color;
        this.state = 'wander';
        this.decisionDelay = rand(0.05, 0.18);
        this.decisionTimer = 0;
      }

        update(dt) {
          this.state = state.roundState === 'chase' ? 'chase' : 'wander';
          this.speed = this.state === 'chase' ? 146 + state.score * 1.2 : 120;
        
          if (this.atCenter()) {
            this.snapToCenter();
            this.decisionTimer += dt;
            if (this.decisionTimer >= this.decisionDelay) {
              this.pickDirection();
              this.decisionTimer = 0;
              this.decisionDelay = rand(0.08, 0.16);
            } else {
              this.dir = { x: 0, y: 0 };
            }
          }
        
          this.move(dt);
          updateAnim(this, dt, this.state === 'chase' ? 10 : 7);
        }
        
      pickDirection() {
        const dirs = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 }
        ].filter(d => this.canMove(d));

        const reverse = { x: -this.dir.x, y: -this.dir.y };
        const options = dirs.filter(d => !(d.x === reverse.x && d.y === reverse.y));
        const usable = options.length ? options : dirs;
        if (!usable.length) {
          this.nextDir = { x: 0, y: 0 };
          return;
        }

        if (this.state === 'wander') {
          this.nextDir = choose(usable);
          return;
        }

        const target = state.player;
        usable.sort((a, b) => {
          const da = pathBias(this, a, target);
          const db = pathBias(this, b, target);
          return da - db;
        });

        const best = usable[0];
        const second = usable[1] || best;
        this.nextDir = Math.random() < 0.82 ? best : second;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (spriteStore.troopRun) {
          drawSheetFrame(spriteStore.troopRun, this.frame, this.facing, 64, 64, 74, 74);
        } else {
          ctx.scale(this.facing === 'left' ? -1 : 1, 1);
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(0, 0, 23, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f6dfc9';
          ctx.beginPath();
          ctx.arc(4, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(6, -5, 5, 0, Math.PI * 2);
          ctx.arc(16, -5, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(8, -5, 2, 0, Math.PI * 2);
          ctx.arc(17, -5, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }


