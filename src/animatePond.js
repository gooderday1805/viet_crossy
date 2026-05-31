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

  // Flag: chỉ cho phép carry từ đúng 1 bệ mỗi frame.
  // Tránh double-carry khi 2 bệ cùng row đều nằm trong threshold (cộng delta 2 lần → bị đẩy gấp đôi).
  let carriedThisFrame = false;

  platformData.forEach((p) => {
    const prevX = p.ref.position.x;

    // Di chuyển bệ theo chiều hiện tại
    p.ref.position.x += p.speed * p.direction * delta;

    // ── BOUNCE ─────────────────────────────────────────────────────────────────
    // Khi chạm tường: kẹp vào biên rồi đảo chiều (không wrap-around).
    // Bệ sẽ đi qua đi lại vô tận trong khuôn viên chùa — mang theo nhân vật.
    if (p.ref.position.x >= POND_BOUNDS.RIGHT) {
      p.ref.position.x = POND_BOUNDS.RIGHT;
      p.direction = -1;
    } else if (p.ref.position.x <= POND_BOUNDS.LEFT) {
      p.ref.position.x = POND_BOUNDS.LEFT;
      p.direction = 1;
    }

    // ── CARRY ──────────────────────────────────────────────────────────────────
    // Kéo player theo bệ khi: trong hồ + cùng hàng + đứng yên + đủ gần + chưa carry frame này.
    if (!carriedThisFrame && inPond && movesQueue.length === 0 && p.rowIndex === position.currentRow) {
      if (Math.abs(player.position.x - prevX) < ON_PLATFORM_THRESHOLD) {
        const dx = p.ref.position.x - prevX;
        player.position.x = Math.max(
          POND_BOUNDS.LEFT,
          Math.min(POND_BOUNDS.RIGHT, player.position.x + dx)
        );
        carriedThisFrame = true;
      }
    }
  });
}
