import * as THREE from "three";
import {
  player,
  position,
  movesQueue,
  stepCompleted,
} from "./components/Player";
import { tileSize } from "./constants";

const moveClock = new THREE.Clock(false);

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
    stepCompleted();
    moveClock.stop();
    stepStartX = null;
    stepStartY = null;
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