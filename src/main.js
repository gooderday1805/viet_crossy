import * as THREE from "three";
import { Renderer } from "./components/Renderer";
import { Camera } from "./components/Camera";
import { player, initializePlayer } from "./components/Player";
import { map, initializeMap } from "./components/Map";
import { tilesPerRow, tileSize } from "./constants";
import { DirectionalLight } from "./components/DirectionalLight";
import { animateVehicles } from "./animateVehicles";
import { animatePlayer } from "./animatePlayer";
import { hitTest } from "./hitTest";
import "./collectUserInput";
import "./style.css";

const scene = new THREE.Scene();
scene.add(player);
scene.add(map);

const ambientLight = new THREE.AmbientLight();
scene.add(ambientLight);

const dirLight = DirectionalLight();
dirLight.target = player;
player.add(dirLight);

const camera = Camera();
scene.add(camera);

const scoreDOM = document.getElementById("score");
const resultDOM = document.getElementById("result-container");

initializeGame();

document
  .querySelector("#retry")
  ?.addEventListener("click", initializeGame);

function initializeGame() {
  initializePlayer();
  initializeMap();

   // Initialize UI
  if (scoreDOM) scoreDOM.innerText = "0";
  if (resultDOM) resultDOM.style.visibility = "hidden";
}

// ============================================================
// DEBUG HELPERS — xóa khi không cần nữa
// ============================================================

// Trục tọa độ XYZ (dài 200 đơn vị):
//   đỏ   = trục X (ngang)
//   xanh lá = trục Y (tiến/lùi theo hàng map)
//   xanh dương = trục Z (lên/xuống, hướng camera.up)
const axesHelper = new THREE.AxesHelper(200);
// Nâng lên z=2 để thoát khỏi mesh cỏ (foundation dày 3, từ z=-1.5 đến z=1.5)
axesHelper.position.z = 2;
scene.add(axesHelper);

// Lưới kẻ ô vuông khớp với cấu trúc tile của map:
//   gridSize  = tilesPerRow * tileSize = 17 * 42 = 714 đơn vị
//   divisions = tilesPerRow = 17 → mỗi ô đúng 1 tile
const gridSize = tilesPerRow * tileSize;
const gridHelper = new THREE.GridHelper(
  gridSize,    // tổng kích thước lưới
  tilesPerRow, // số ô chia đều
  0xff0000,    // màu đường trục chính (đỏ)
  0x444444     // màu đường ô phụ (xám)
);
// GridHelper mặc định nằm trên mặt phẳng XZ.
// Xoay 90° quanh X để lưới nằm trên mặt phẳng XY — đúng với game nhìn từ góc isometric.
gridHelper.rotation.x = Math.PI / 2;
// Nâng lên z=2 cùng với axesHelper để lưới hiện trên mặt cỏ
gridHelper.position.z = 2;
scene.add(gridHelper);

// ============================================================
// END DEBUG HELPERS
// ============================================================
console.log(scene.children);

const renderer = Renderer();

renderer.setAnimationLoop(animate);

function animate() {
  animateVehicles();
  animatePlayer();
  hitTest();
  renderer.render(scene, camera);
}