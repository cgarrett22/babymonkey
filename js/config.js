    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const mountainImage = new Image();
    mountainImage.src = 'assets/mountain.png';

    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const ripenessEl = document.getElementById('ripeness');
    const statusEl = document.getElementById('status');

    const TILE = 64;
    const COLS = 17;
    const ROWS = 11;
    const BOARD_X = 16;
    const BOARD_Y = 8;
    const BOARD_W = COLS * TILE;
    const BOARD_H = ROWS * TILE;


    const LEVEL = [
      '#################',
      '#....#.....#....#',
      '#.##.#.###.#.##.#',
      '#....#..C..#....#',
      '#.######.######.#',
      '#...............#',
      '#.######.######.#',
      '#....#..C..#....#',
      '#.##.#.###.#.##.#',
      '#....#.....#....#',
      '#################'
    ];

    const NODES = [
      { c:1, r:1 }, { c:4, r:1 }, { c:5, r:1 }, { c:10, r:1 }, { c:11, r:1 }, { c:15, r:1 },
      { c:1, r:3 }, { c:4, r:3 }, { c:7, r:3 }, { c:8, r:3 }, { c:9, r:3 }, { c:12, r:3 }, { c:15, r:3 },
      { c:1, r:5 }, { c:8, r:5 }, { c:15, r:5 },
      { c:1, r:7 }, { c:4, r:7 }, { c:7, r:7 }, { c:8, r:7 }, { c:9, r:7 }, { c:12, r:7 }, { c:15, r:7 },
      { c:1, r:9 }, { c:4, r:9 }, { c:5, r:9 }, { c:10, r:9 }, { c:11, r:9 }, { c:15, r:9 }
    ];

    const BANANA_SPAWNS = [
      { c:1, r:1 }, { c:1, r:3 }, { c:1, r:5 }, { c:4, r:5 }, { c:1, r:7 }, { c:1, r:9 }, { c:4, r:3 }, { c:4, r:7 }
    ];

    const CAVES = [
      { c:3, r:3, to: { c:13, r:9 } },
      { c:13, r:9, to: { c:3, r:3 } }
    ];

    const SPAWN_TILE = { c: 15, r: 1 };
    const HAND_ORIGIN = { x: 26, y: 124 };

    const TROOP_SPAWN_TILES = [
    { c: 8, r: 5 },
    { c: 10, r: 5 },
    { c: 8, r: 7 },
    { c: 10, r: 3 }
    ];
