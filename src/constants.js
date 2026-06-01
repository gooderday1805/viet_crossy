// ─────────────────────────────────────────────────────────────────────────────
// constants.js — hằng số toàn cục xác định kích thước lưới map.
//
// Hệ tọa độ game (Z-up):
//   X: ngang (trái/phải), đơn vị = tileSize
//   Y: tiến/lùi (theo hàng map), đơn vị = tileSize
//   Z: cao/thấp (chiều cao địa hình)
//
// Lưới tile:
//   Hàng ngang gồm 17 tile từ index -8 → +8 (tâm = tile 0).
//   Chiều rộng thực = 17 × 42 = 714 đơn vị — dùng làm width cho Grass, Road, GridHelper.
// ─────────────────────────────────────────────────────────────────────────────

/** Tile index nhỏ nhất (biên trái map). */
export const minTileIndex = -8;

/** Tile index lớn nhất (biên phải map). */
export const maxTileIndex = 8;

/** Tổng số tile mỗi hàng = maxTileIndex - minTileIndex + 1 = 17. */
export const tilesPerRow = maxTileIndex - minTileIndex + 1;

/** Kích thước một tile tính bằng world units (42 đơn vị). */
export const tileSize = 42;
