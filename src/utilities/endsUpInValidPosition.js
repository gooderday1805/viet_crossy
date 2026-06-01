import { calculateFinalPosition } from "./calculateFinalPosition";
import { minTileIndex, maxTileIndex } from "../constants";
import { metadata as rows } from "../components/Map";

// ─────────────────────────────────────────────────────────────────────────────
// Hằng số khuôn viên chùa — tất cả tọa độ lấy từ PagodaArea.js:
//   Tường bao dọc: X = ±210 = ±5 × tileSize  → tileIndex ±5
//   Compound rows:  -2 (cổng) đến -12 (tường hậu)
//   Tile hợp lệ trong compound: -4 → +4  (tường ở ±5, player body ±7.5)
//
// Cổng Tam Quan (row -2):
//   Xác minh bằng AABB: chỉ 3 tile không bị cột/tường che:
//     -3 (cổng phụ trái, tâm mở x=-139→-97)
//      0 (cổng giữa,    tâm mở x= -30→+30)
//     +3 (cổng phụ phải, tâm mở x= +97→+139)
// ─────────────────────────────────────────────────────────────────────────────
const COMPOUND_ROW_ENTER = -2;  // hàng đầu tiên khuôn viên (cổng)
const COMPOUND_ROW_END   = -12; // tường hậu — không đi qua được
const COMPOUND_TILE_LIMIT = 4;  // tileIndex ±4 là hợp lệ trong khuôn viên

// Khái niệm CG — Set vs Array cho lookup O(1):
// Set.has() tra cứu hằng số thời gian O(1) nhờ hash table nội bộ,
// so với Array.includes() O(n). Quan trọng khi kiểm tra mỗi frame.
const GATE_ROW   = -2;
const GATE_TILES = new Set([-3, 0, 3]);

export function endsUpInValidPosition(currentPosition, moves) {
  // calculateFinalPosition: áp toàn bộ moves lên currentPosition → vị trí cuối.
  // Dùng reduce để tích lũy rowIndex / tileIndex qua từng bước một.
  const finalPosition = calculateFinalPosition(currentPosition, moves);

  // ── 1. Biên map tổng quát ─────────────────────────────────────────────────
  // Phía sau: không đi qua tường hậu chùa (row -12).
  // Trái/phải: giữ trong dải tile hợp lệ (minTileIndex = -8, maxTileIndex = +8).
  if (
    finalPosition.rowIndex < COMPOUND_ROW_END + 1 ||
    finalPosition.tileIndex < minTileIndex ||
    finalPosition.tileIndex > maxTileIndex
  ) {
    return false;
  }

  // ── 2. Tường bao khuôn viên chùa (rows -2 → -12) ─────────────────────────
  // Tường gạch trái/phải tại X = ±5 × tileSize.
  // Kiểm tra AABB: player body (±7.5) tại tileIndex ±5 (X = ±210) OVERLAP tường.
  // → Trong khuôn viên chỉ cho phép tile -4 → +4.
  if (
    finalPosition.rowIndex <= COMPOUND_ROW_ENTER &&
    finalPosition.rowIndex >= COMPOUND_ROW_END &&
    (
      finalPosition.tileIndex < -COMPOUND_TILE_LIMIT ||
      finalPosition.tileIndex >  COMPOUND_TILE_LIMIT
    )
  ) {
    return false;
  }

  // ── 3. Cổng Tam Quan (row -2) ─────────────────────────────────────────────
  // Tại hàng cổng, toàn bộ chiều ngang bị tường/cột chia thành 3 lối hở và
  // 8 vị trí bị chặn (cột trụ, tường nối, đầu hồi). Chỉ cho qua GATE_TILES.
  //
  // Áp dụng cho cả di chuyển tiến (vào compound), lùi (ra compound),
  // và ngang (khi đang đứng tại row -2).
  if (
    finalPosition.rowIndex === GATE_ROW &&
    !GATE_TILES.has(finalPosition.tileIndex)
  ) {
    return false;
  }

  // ── 4. Cây trong forest rows ──────────────────────────────────────────────
  // rows[] chỉ có metadata đường xe (row 1+). Optional chaining (?.) tránh crash
  // khi finalRow là undefined (row âm hoặc chưa sinh).
  const finalRow = rows[finalPosition.rowIndex - 1];
  if (
    finalRow?.type === "forest" &&
    finalRow.trees.some((tree) => tree.tileIndex === finalPosition.tileIndex)
  ) {
    return false;
  }

  // ── 5. Tòa nhà trong urban rows ───────────────────────────────────────────
  // Urban row dùng cùng cơ chế chặn như forest (tile-based, không cần AABB).
  // Buildings cao hơn cây nhiều nhưng kiểm tra collision vẫn đủ qua tileIndex.
  if (
    finalRow?.type === "urban" &&
    finalRow.buildings.some((b) => b.tileIndex === finalPosition.tileIndex)
  ) {
    return false;
  }

  return true;
}
