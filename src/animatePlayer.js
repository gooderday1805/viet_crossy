import * as THREE from "three";
import {
  player,
  position,
  movesQueue,
  stepCompleted,
} from "./components/Player";
import { tileSize } from "./constants";
import { platformData, PLATFORM_HALF } from "./components/PondPlatforms";

// Hằng dùng chung với hitTest/animatePond để nhất quán
const ON_PLATFORM_THRESHOLD = PLATFORM_HALF + 10;
const POND_ROW_MIN = -9;
const POND_ROW_MAX = -4;

const moveClock = new THREE.Clock(false);

// ─────────────────────────────────────────────────────────────────────────────
// getGroundZ: trả về chiều cao mặt đất (world Z) tại một hàng bản đồ cụ thể.
//
// Khái niệm CG: "ground plane" — mặt phẳng tham chiếu mà nhân vật đứng trên.
// Khi có nhiều loại địa hình khác nhau độ cao (cỏ, đường đá, bệ hồ),
// ta cần biết Z gốc của từng terrain để:
//   • player.position.z  = mặt đất (ground plane)
//   • innerGroup.position.z = arc nhảy (offset tạm thời phía trên ground)
//   Tổng world Z chân = player.position.z + arc — luôn đúng với bề mặt.
//
// Nguồn số liệu (đo từ geometry của mỗi component):
//   Grass/Road foundation : BoxGeometry(h=3), center z=1.5 → top = 3
//   Đường đá tiếp cận (row −1→−3) : BoxGeometry(h=3), center z=4.5 → top = 6
//   Khu đón tiếp chùa (row −10)   : BoxGeometry(h=3), center z=3.5 → top = 5
//   Bệ nhảy hồ sen (rows −9→−4)   : base center z=9, top slab z=12.5 → đỉnh = 13.5
// ─────────────────────────────────────────────────────────────────────────────
function getGroundZ(rowIndex) {
  if (rowIndex >= -9 && rowIndex <= -4) return 13.5; // đỉnh bệ hồ sen (moving platform)
  if (rowIndex >= -3 && rowIndex <= -1) return 6;    // đường đá dẫn vào chùa
  if (rowIndex === -10)                 return 5;     // sân đón tiếp (row xuất phát)
  return 3;                                           // cỏ / đường xe (row 0 trở lên)
}

// Capture vị trí player tại thời điểm bắt đầu mỗi bước nhảy.
// Cần thiết vì carry mechanism (animatePond) có thể đã dịch player.position.x
// khỏi position.currentTile * tileSize trước khi bước xảy ra.
// Nếu dùng tileX tĩnh làm startX, player sẽ snap về tile center ngay khi bắt đầu animation.
let stepStartX = null;
let stepStartY = null;

export function animatePlayer() {
  if (!movesQueue.length) return;

  if (!moveClock.running) {
    moveClock.start();
    // Chụp lại vị trí thực tế (đã bao gồm carry offset) làm điểm xuất phát animation.
    stepStartX = player.position.x;
    stepStartY = player.position.y;
  }

  const stepTime = 0.2; // Seconds it takes to take a step
  const progress = Math.min(1, moveClock.getElapsedTime() / stepTime);

  setPosition(progress);
  setRotation(progress);

  // Once a step has ended
  if (progress >= 1) {
    stepCompleted(); // cập nhật position.currentRow trước
    snapToPlatformCenter(); // sau đó snap về tâm bệ (dùng currentRow mới)
    moveClock.stop();
    stepStartX = null;
    stepStartY = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// snapToPlatformCenter: sau mỗi bước nhảy trong hồ sen, căn player về tâm bệ
// gần nhất trong cùng hàng nếu đủ gần (< ON_PLATFORM_THRESHOLD).
//
// Khái niệm CG: Position Snapping — đưa object về điểm tham chiếu ngay cuối
// animation để loại bỏ lệch tích lũy do carry (continuous offset).
// Snap xảy ra 1 frame (0.016s) → không thấy nhấp nháy.
// ─────────────────────────────────────────────────────────────────────────────
function snapToPlatformCenter() {
  if (position.currentRow < POND_ROW_MIN || position.currentRow > POND_ROW_MAX) return;

  let closest = null;
  let minDist = Infinity;
  platformData.forEach((p) => {
    if (p.rowIndex !== position.currentRow) return;
    const dist = Math.abs(player.position.x - p.ref.position.x);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  });

  // Chỉ snap khi thực sự đang đứng trên bệ (không snap khi sắp chết)
  if (closest && minDist < ON_PLATFORM_THRESHOLD) {
    player.position.x = closest.ref.position.x;
  }
}

function setPosition(progress) {
  const startX = stepStartX ?? position.currentTile * tileSize;
  const startY = stepStartY ?? position.currentRow * tileSize;

  // forward/backward: X KHÔNG thay đổi — giữ nguyên carry offset.
  // Nếu dùng tile center làm endX (= 0 khi tile=0) nhưng startX=100 (carry),
  // player sẽ lerp từ 100→0 trong khi bục tiếp tục di chuyển → khoảng cách tăng → game over.
  // left/right: snap về tile center đích (di chuyển ngang chủ ý, carry bị reset).
  let endX = startX;   // mặc định: X không đổi
  let endY = startY;

  if (movesQueue[0] === "left")     endX = (position.currentTile - 1) * tileSize;
  if (movesQueue[0] === "right")    endX = (position.currentTile + 1) * tileSize;
  if (movesQueue[0] === "forward")  endY += tileSize;
  if (movesQueue[0] === "backward") endY -= tileSize;

  player.position.x = THREE.MathUtils.lerp(startX, endX, progress);
  player.position.y = THREE.MathUtils.lerp(startY, endY, progress);

  // Tính hàng đích để lấy ground height tương ứng.
  // position.currentRow chưa được cập nhật trong lúc animation còn chạy
  // (stepCompleted() chỉ gọi khi progress >= 1), nên đây là hàng HIỆN TẠI.
  const dir = movesQueue[0];
  let rowDelta = 0;
  if (dir === "forward")  rowDelta =  1;
  if (dir === "backward") rowDelta = -1;
  const nextRow = position.currentRow + rowDelta;

  // Lerp ground height từ terrain hiện tại → terrain đích trong suốt bước nhảy.
  // Kết hợp với arc (sin) bên dưới: player glide lên/xuống độ cao đúng khi hạ cánh.
  const startZ = getGroundZ(position.currentRow);
  const endZ   = getGroundZ(nextRow);
  player.position.z = THREE.MathUtils.lerp(startZ, endZ, progress);

  // Arc nhảy parabolic: sin(0→π) tạo đỉnh ở giữa bước, về 0 khi hạ cánh.
  // Đây là offset tạm thời phía trên ground plane — không ảnh hưởng đến Z cuối cùng.
  player.children[0].position.z = Math.sin(progress * Math.PI) * 8;
}

function setRotation(progress) {
  let endRotation = 0;
  if (movesQueue[0] == "left") endRotation = Math.PI / 2;
  if (movesQueue[0] == "right") endRotation = -Math.PI / 2;
  if (movesQueue[0] == "backward") endRotation = Math.PI;

  player.children[0].rotation.z = THREE.MathUtils.lerp(
    player.children[0].rotation.z,
    endRotation,
    progress
  );
}