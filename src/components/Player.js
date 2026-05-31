import * as THREE from "three";
import { metadata as rows, addRows } from "./Map";
import { endsUpInValidPosition } from "../utilities/endsUpInValidPosition";
import { gameState } from "../gameState";

export const player = Player();

function Player() {
  const player = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(15, 15, 20),
    new THREE.MeshLambertMaterial({
      color: "white",
      flatShading: true,
    })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.z = 10;
  player.add(body);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(2, 4, 2),
    new THREE.MeshLambertMaterial({
      color: 0xf0619a,
      flatShading: true,
    })
  );
  cap.position.z = 21;
  cap.castShadow = true;
  cap.receiveShadow = true;
  player.add(cap);

  const playerContainer = new THREE.Group();
  playerContainer.add(player);

  return playerContainer;
}

export const position = {
  currentRow: 0,
  currentTile: 0,
  lastMove: null, // hướng của bước vừa hoàn thành — hitTest dùng để check pond
};

export const movesQueue = [];

// Row xuất phát = cạnh Chùa Một Cột (row -10), ngay trước lối vào hồ.
// Player tiến "forward" (+Y) băng qua hồ sen rồi đến đường xe cộ.
export const START_ROW = -10;

export function initializePlayer() {
  player.position.x = 0;
  player.position.y = START_ROW * 42;
  // Z gốc = mặt đất tại row -10 (sân đón tiếp chùa, top = 5).
  // animatePlayer.js sẽ lerp giá trị này sang terrain kế tiếp khi nhảy.
  player.position.z = 5;
  player.children[0].position.z = 0;

  position.currentRow = START_ROW;
  position.currentTile = 0;
  position.lastMove = null;

  movesQueue.length = 0;
}

export function queueMove(direction) {
  if (gameState.isOver) return;

  const isValidMove = endsUpInValidPosition(
    {
      rowIndex: position.currentRow,
      tileIndex: position.currentTile,
    },
    [...movesQueue, direction]
  );

  if (!isValidMove) return;

  movesQueue.push(direction);
}

/**
 * Thay thế mesh nhân vật bằng GLB model đã load.
 * Cấu trúc player: playerContainer → innerGroup (children[0]) → meshes
 * animatePlayer.js dùng children[0].position.z (nhảy) và children[0].rotation.z (xoay)
 * nên ta đặt gltfScene vào đúng vị trí children[0].
 */
/**
 * Thay thế mesh nhân vật bằng GLB model đã load + xử lý texture.
 *
 * Khái niệm CG:
 *  - AABB (Axis-Aligned Bounding Box): hộp bao tối thiểu theo trục thế giới,
 *    dùng để đo kích thước thực của object sau khi áp transform.
 *  - Uniform scale: nhân đều 3 trục (scale.setScalar) để giữ tỉ lệ model.
 */
export function setPlayerModel(gltfScene) {
  const innerGroup = player.children[0];
  innerGroup.clear(); // xóa box body + cap cũ

  // Tính AABB trước khi đặt scale — lấy kích thước gốc (đã có rotation từ prepareModel)
  const box = new THREE.Box3().setFromObject(gltfScene);
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray());

  // Uniform scale để model cao ~20 units (xấp xỉ box player cũ)
  const gameScale = 20 / maxDim;
  gltfScene.scale.setScalar(gameScale);

  // Center X/Y về gốc; đặt đáy model tại z=0 (mặt tile)
  // box.min.z * gameScale = offset từ gốc xuống đáy sau khi scale
  gltfScene.position.set(
    -center.x * gameScale,
    -center.y * gameScale,
    -box.min.z * gameScale
  );

  gltfScene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  innerGroup.add(gltfScene);
}

export function stepCompleted() {
  const direction = movesQueue.shift();
  position.lastMove = direction; // hitTest đọc để biết có check pond hay không

  if (direction === "forward") position.currentRow += 1;
  if (direction === "backward") position.currentRow -= 1;
  if (direction === "left") position.currentTile -= 1;
  if (direction === "right") position.currentTile += 1;

   // Add new rows if the player is running out of them
  if (position.currentRow > rows.length - 10) addRows();

  // Score chỉ đếm khi player đã thoát khỏi khu chùa (currentRow > 0).
  // Trong hồ / khu chùa: score = 0 (chưa "kiếm" được điểm).
  const scoreDOM = document.getElementById("score");
  if (scoreDOM) scoreDOM.innerText = Math.max(0, position.currentRow).toString();
}