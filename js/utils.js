    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function rand(min, max) { return Math.random() * (max - min) + min; }
    function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function tileCenter(c, r) {
      return {
        x: BOARD_X + c * TILE + TILE / 2,
        y: BOARD_Y + r * TILE + TILE / 2
      };
    }

    function pointToTile(x, y) {
      return {
        c: Math.floor((x - BOARD_X) / TILE),
        r: Math.floor((y - BOARD_Y) / TILE)
      };
    }

    function getCell(c, r) {
      const row = LEVEL[r];
      return row ? row[c] : '#';
    }

    function walkable(c, r) {
      return ['.', 'C'].includes(getCell(c, r));
    }

    function pathBias(enemy, dir, target) {
      const nx = enemy.tile.c + dir.x;
      const ny = enemy.tile.r + dir.y;
      const targetTile = pointToTile(target.x, target.y);
      return Math.abs(nx - targetTile.c) + Math.abs(ny - targetTile.r);
    }
