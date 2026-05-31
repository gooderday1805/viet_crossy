import * as THREE from "three";
import { platformData, POND_BOUNDS, PLATFORM_HALF } from "./components/PondPlatforms";
import { player, position, movesQueue } from "./components/Player";

// Delta-time clock — giống animateVehicles.js.
const clock = new THREE.Clock();

// Ngưỡng "đứng trên bệ": bán kính bệ + buffer = 21 + 10 = 31 đơn vị.
// Dùng chung với hitTest.js để carry và check collision nhất quán.
const ON_PLATFORM_THRESHOLD = PLATFORM_HALF + 10;

// Row hồ sen: rows -9 đến -4.
const POND_ROW_MIN = -9;
const POND_ROW_MAX = -4;

export function animatePond() {
  const delta = clock.getDelta();

  const inPond =
    position.currentRow >= POND_ROW_MIN &&
    position.currentRow <= POND_ROW_MAX;

  // Pass 1: lưu prevX của từng bệ trước khi di chuyển.
  // Cần thiết để tính dx = current - prev cho carry, và để check khoảng cách
  // so với vị trí BỆ TRƯỚC KHI DỊCH (tương tự velocity-based carry).
  const prevPositions = platformData.map((p) => p.ref.position.x);

  // Pass 2: di chuyển tất cả bệ + bounce ở biên.
  platformData.forEach((p) => {
    p.ref.position.x += p.speed * p.direction * delta;

    // ── BOUNCE ─────────────────────────────────────────────────────────────────
    // Khi chạm tường: kẹp vào biên rồi đảo chiều.
    // Sau bounce, 2 bệ cùng hàng có thể đi ngược chiều nhau → chồng lên nhau.
    if (p.ref.position.x >= POND_BOUNDS.RIGHT) {
      p.ref.position.x = POND_BOUNDS.RIGHT;
      p.direction = -1;
    } else if (p.ref.position.x <= POND_BOUNDS.LEFT) {
      p.ref.position.x = POND_BOUNDS.LEFT;
      p.direction = 1;
    }
  });

  // ── CARRY: chọn bệ GẦN NHẤT cùng hàng ────────────────────────────────────
  // Bug cũ: dùng `carriedThisFrame` flag → pick bệ ĐẦU TIÊN trong threshold.
  // Khi 2 bệ chồng nhau (sau bounce), bệ đầu tiên trong mảng không phải lúc
  // nào cũng là bệ "đúng" → player bị chuyển sang bệ sai.
  // Fix: tìm bệ có |player.x - prevX| NHỎ NHẤT dưới threshold → carry từ đó.
  if (inPond && movesQueue.length === 0) {
    let carryPlatform = null;
    let carryPrevX    = null;
    let minDist       = ON_PLATFORM_THRESHOLD; // chỉ xét bệ < threshold

    platformData.forEach((p, i) => {
      if (p.rowIndex !== position.currentRow) return;
      const dist = Math.abs(player.position.x - prevPositions[i]);
      if (dist < minDist) {
        minDist       = dist;
        carryPlatform = p;
        carryPrevX    = prevPositions[i];
      }
    });

    if (carryPlatform) {
      const dx = carryPlatform.ref.position.x - carryPrevX;
      player.position.x = Math.max(
        POND_BOUNDS.LEFT,
        Math.min(POND_BOUNDS.RIGHT, player.position.x + dx)
      );
    }
  }
}
