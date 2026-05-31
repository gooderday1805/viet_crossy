import * as THREE from "three";
import { metadata as rows } from "./components/Map";
import { player, position, movesQueue } from "./components/Player";
import { gameState } from "./gameState";
import { platformData, PLATFORM_HALF } from "./components/PondPlatforms";

// Hồ sen trải dài từ row -9 (gần chùa) đến row -4 (gần sân chùa).
const POND_ROW_MIN = -9;
const POND_ROW_MAX = -4;

// Ngưỡng "đứng trên bệ": bán kính bệ + buffer nhỏ cho dễ chơi.
// = 21 (PLATFORM_HALF) + 10 buffer → player tile center cách bệ center < 31 đơn vị.
const ON_PLATFORM_THRESHOLD = PLATFORM_HALF + 10;

const resultDOM = document.getElementById("result-container");
const finalScoreDOM = document.getElementById("final-score");

// Kết thúc game: set flag + hiện UI game over.
// Tách hàm riêng để cả va chạm xe lẫn rơi xuống hồ đều dùng chung.
// Score chỉ tính từ row 0 trở lên (khu đường xe), trong hồ = 0.
function triggerGameOver() {
  gameState.isOver = true;
  if (!resultDOM || !finalScoreDOM) return;
  resultDOM.style.visibility = "visible";
  finalScoreDOM.innerText = Math.max(0, position.currentRow).toString();
}

export function hitTest() {
  // ── 1. KIỂM TRA RƠI XUỐNG HỒ SEN (Frogger-style) ───────────────────────
  // Hồ sen: rows -9 đến -4. Mỗi row có 2 bệ đá di chuyển trái/phải.
  // Check MỌI FRAME (continuous) — nếu không có bệ nào đủ gần → rơi xuống nước.
  //
  // playerTileX: vị trí X logic của player (giữa tile hiện tại trong world space).
  // So sánh với p.ref.position.x (world X của bệ vì bệ là con trực tiếp của scene).
  // Dùng khoảng cách thay vì AABB vì bệ chỉ di chuyển theo trục X.
  const inPond =
    position.currentRow >= POND_ROW_MIN &&
    position.currentRow <= POND_ROW_MAX;

  if (inPond) {
    // Bỏ qua khi đang trong animation bước (movesQueue có phần tử).
    // Lý do: platform vẫn di chuyển trong 0.2s của animation → nếu check liên tục,
    // khoảng cách platform–player tăng dần rồi vượt ngưỡng → false game over.
    // Check sẽ tự động xảy ra ngay frame sau khi bước hoàn thành (movesQueue rỗng).
    if (movesQueue.length > 0) return;

    const onPlatform = platformData.some(
      (p) =>
        p.rowIndex === position.currentRow &&
        Math.abs(player.position.x - p.ref.position.x) < ON_PLATFORM_THRESHOLD
    );

    if (!onPlatform) {
      triggerGameOver();
      return;
    }
  }

  // ── 2. KIỂM TRA VA CHẠM XE (AABB) ────────────────────────────────────────
  // rows[] chỉ chứa metadata của phần đường xe (row 1 trở lên).
  // rows[currentRow - 1] → metadata của row hiện tại.
  const row = rows[position.currentRow - 1];
  if (!row) return;

  if (row.type === "car" || row.type === "truck") {
    // AABB (Axis-Aligned Bounding Box): hộp bao không xoay, tính trong
    // world space từ toàn bộ geometry + transform của object và các con.
    // setFromObject() duyệt cây con → bounding box bao phủ cả xe lẫn bánh.
    const playerBoundingBox = new THREE.Box3();
    playerBoundingBox.setFromObject(player);

    row.vehicles.forEach(({ ref }) => {
      if (!ref) throw new Error("Vehicle reference is missing");

      const vehicleBoundingBox = new THREE.Box3();
      vehicleBoundingBox.setFromObject(ref);

      // intersectsBox(): SAT (Separating Axis Theorem) trên 3 trục X/Y/Z.
      // Với AABB, chỉ cần 3 phép so sánh → O(1).
      if (playerBoundingBox.intersectsBox(vehicleBoundingBox)) {
        triggerGameOver();
      }
    });
  }
}

export { triggerGameOver };