/**
 * SpatialHash - 2D Grid spatial partitioning for O(1) broad-phase collision detection
 */
export class SpatialHash {
  constructor(cellSize = 300) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  _getKey(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx}:${cy}`;
  }

  insert(entity) {
    const minX = Math.floor((entity.pos.x - (entity.radius || 20)) / this.cellSize);
    const maxX = Math.floor((entity.pos.x + (entity.radius || 20)) / this.cellSize);
    const minY = Math.floor((entity.pos.y - (entity.radius || 20)) / this.cellSize);
    const maxY = Math.floor((entity.pos.y + (entity.radius || 20)) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = `${cx}:${cy}`;
        let cell = this.grid.get(key);
        if (!cell) {
          cell = [];
          this.grid.set(key, cell);
        }
        cell.push(entity);
      }
    }
  }

  query(x, y, radius) {
    const results = new Set();
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = `${cx}:${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            results.add(cell[i]);
          }
        }
      }
    }

    return Array.from(results);
  }
}

