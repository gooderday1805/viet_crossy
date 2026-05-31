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