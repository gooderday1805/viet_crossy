import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Renderer } from "./components/Renderer";
import { Camera } from "./components/Camera";
import { player, initializePlayer, setPlayerModel, position, START_ROW } from "./components/Player";
import { map, initializeMap } from "./components/Map";
import { tilesPerRow, tileSize } from "./constants";
import { DirectionalLight } from "./components/DirectionalLight";
import { animateVehicles } from "./animateVehicles";
import { animatePlayer } from "./animatePlayer";
import { animatePond } from "./animatePond";
import { hitTest } from "./hitTest";
import { gameState } from "./gameState";
import { createPondPlatforms, initializePondPlatforms, platformData } from "./components/PondPlatforms";
import { playBgm, pauseBgm, resumeBgm, stopBgm, toggleMute } from "./audio";
import { coinsGroup, initializeCoins, spawnPondCoins, animateCoins, collectCoins } from "./coins";
import "./collectUserInput";
import "./style.css";

// Vite xử lý import ?url — trả về đường dẫn public đúng khi build
import catModelUrl from "./models/animal-cat.glb?url";
import dogModelUrl from "./models/animal-dog.glb?url";
// Texture dùng chung cho cả 2 model (palette màu dạng atlas)
import colormapUrl from "./Textures/colormap.png?url";

const scene = new THREE.Scene();
// scene.background là màu fill toàn màn hình khi không có geometry nào che
// Đặt màu trời (light sky blue) để tránh khoảng trắng ở rìa canvas
scene.background = new THREE.Color(0xbfd7ea);
scene.add(player);
scene.add(map);

// Bệ nhảy hồ sen — thêm vào scene độc lập với map để không bị xóa khi initializeMap().
const pondPlatforms = createPondPlatforms();
scene.add(pondPlatforms);

// Nhóm đồng xu — thêm vào scene để coinsGroup.clear() không ảnh hưởng map/platforms.
scene.add(coinsGroup);

const ambientLight = new THREE.AmbientLight();
scene.add(ambientLight);

const dirLight = DirectionalLight();
dirLight.target = player;
player.add(dirLight);

const camera = Camera();
scene.add(camera);

const scoreDOM = document.getElementById("score");
const resultDOM = document.getElementById("result-container");
const pauseBtn     = document.getElementById("pause-btn");
const pauseOverlay = document.getElementById("pause-overlay");
const muteBtn      = document.getElementById("mute-btn");

const renderer = Renderer();
// Animation loop chưa start — sẽ được bật sau khi chọn nhân vật

// Game chưa start ngay — chờ người dùng chọn nhân vật
// top-level await: module chờ load xong 2 GLB mới chạy tiếp
await setupCharacterSelect();

document.querySelector("#retry")?.addEventListener("click", initializeGame);
document.getElementById("resume-btn")?.addEventListener("click", resumeGame);
document.getElementById("pause-btn")?.addEventListener("click", pauseGame);
document.getElementById("home-btn")?.addEventListener("click", goHome);

// Nút tắt/bật âm thanh trong pause menu.
// toggleMute() đổi trạng thái, trả về true nếu đang tắt.
muteBtn?.addEventListener("click", () => {
  const muted = toggleMute();
  if (muteBtn) {
    muteBtn.textContent = muted ? "✕ ÂM THANH: TẮT" : "♪ ÂM THANH: BẬT";
    muteBtn.classList.toggle("muted", muted);
  }
});

// Escape toggle pause — chỉ hoạt động khi game đang chạy (không phải game over)
globalThis.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (gameState.isOver) return;
  gameState.isPaused ? resumeGame() : pauseGame();
});

// ── Pause / Resume ────────────────────────────────────────────────────────────
// pauseGame: đóng băng logic game, hiện overlay, dừng BGM.
function pauseGame() {
  gameState.isPaused = true;
  pauseOverlay?.classList.remove("hidden");
  pauseBtn?.classList.add("hidden");
  pauseBgm();
}

// resumeGame: xoá overlay, tiếp tục BGM và game loop.
function resumeGame() {
  gameState.isPaused = false;
  pauseOverlay?.classList.add("hidden");
  pauseBtn?.classList.remove("hidden");
  resumeBgm();
}

// goHome: dừng animation loop, tắt âm thanh, quay về màn hình chọn nhân vật.
// setAnimationLoop(null): Three.js huỷ requestAnimationFrame nội bộ.
function goHome() {
  gameState.isPaused = false;
  gameState.isOver   = false;
  renderer.setAnimationLoop(null);
  stopBgm();
  pauseOverlay?.classList.add("hidden");
  pauseBtn?.classList.add("hidden");
  if (resultDOM) resultDOM.style.visibility = "hidden";
  // Hiện lại màn hình chọn nhân vật — card listener đã được gán, click sẽ restart game
  document.getElementById("character-select").style.display = "flex";
}

function initializeGame() {
  gameState.isOver   = false;
  gameState.isPaused = false;
  gameState.coinBonus = 0; // reset điểm xu về 0 mỗi lần chơi mới
  initializePlayer();
  // initializeCoins() phải gọi TRƯỚC initializeMap() vì addRows() bên trong
  // sẽ gọi spawnCoinsForRow() ngay lập tức — nếu clear sau sẽ xóa hết xu vừa tạo.
  initializeCoins();
  initializeMap();
  initializePondPlatforms(); // reset bệ về vị trí ban đầu khi Retry
  spawnPondCoins(platformData); // spawn xu trên ~50% bệ hồ sen
  playBgm(); // phát BGM từ đầu mỗi lần bắt đầu/retry
  pauseBtn?.classList.remove("hidden"); // hiện nút pause khi game bắt đầu

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

// Khoảng cách cố định từ camera đến player theo trục Y.
// Camera luôn ở phía sau player 380 đơn vị (≈ 9 tile) để nhìn thấy đủ cảnh phía trước.
const CAMERA_Y_OFFSET = -380;

// ============================================================
// CHARACTER SELECT
// ============================================================

/**
 * Load cả 2 GLB trước, render preview xoay 3D trong thẻ chọn nhân vật.
 * Khi người dùng click, gán model vào player rồi khởi động game loop.
 */
async function setupCharacterSelect() {
  const loader = new GLTFLoader();

  // Load texture và 2 model song song
  const [colormap, catGltf, dogGltf] = await Promise.all([
    new THREE.TextureLoader().loadAsync(colormapUrl),
    loader.loadAsync(catModelUrl),
    loader.loadAsync(dogModelUrl),
  ]);

  // GLTF dùng Y-up, Three.js mặc định cũng Y-up nhưng game này Z-up
  // → xoay -90° quanh X để trục Y (cao) của model chuyển thành Z (cao) của game
  colormap.flipY = false;         // GLTF UV gốc tọa độ ở góc dưới-trái → không lật
  colormap.colorSpace = THREE.SRGBColorSpace; // đảm bảo màu sắc đúng gamma

  // Áp texture và sửa trục cho cả 2 model
  [catGltf.scene, dogGltf.scene].forEach((root) => {
    root.rotation.x = -Math.PI / 2;  // GLTF Y-up → game Z-up
    root.rotation.z = Math.PI;      // mặt model quay về +Y (hướng forward của game)

    // Gán colormap vào từng mesh — GLB này dùng texture ngoài nên phải gán thủ công
    root.traverse((child) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshLambertMaterial({
        map: colormap,
        flatShading: true,
      });
    });
  });

  // Dùng clone() cho preview để scene gốc còn nguyên khi gán vào game
  createPreview("preview-cat", catGltf.scene.clone());
  createPreview("preview-dog", dogGltf.scene.clone());

  const modelMap = { cat: catGltf.scene, dog: dogGltf.scene };

  document.querySelectorAll(".cs-card").forEach((card) => {
    card.addEventListener("click", () => {
      setPlayerModel(modelMap[card.dataset.model]);
      document.getElementById("character-select").style.display = "none";
      initializeGame();
      renderer.setAnimationLoop(animate); // bắt đầu game loop
    });
  });
}

/**
 * Tạo mini Three.js scene render GLB model xoay trong ô preview.
 * Auto-fit: tính BoundingBox để scale & center model vừa khung.
 *
 * Khái niệm CG:
 *  - BoundingBox (AABB): hộp bao nhỏ nhất chứa toàn bộ geometry theo trục XYZ
 *  - setScalar(s): đặt scale.x = scale.y = scale.z = s (uniform scale)
 */
function createPreview(containerId, model) {
  const container = document.getElementById(containerId);
  const W = 200, H = 200;

  const previewScene = new THREE.Scene();
  // Nền tối khớp với màu #character-select để preview trông liền mạch với card
  previewScene.background = new THREE.Color(0x0a0e14);

  // Camera vuông (aspect = 1) nhìn chéo từ góc trên-trái kiểu isometric
  const previewCam = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  previewCam.up.set(0, 0, 1); // Z-up giống game chính

  // --- Auto-fit model vào khung preview ---
  // Box3.setFromObject duyệt toàn bộ children, tính AABB bao quanh model
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fitScale = 2 / maxDim; // chuẩn hóa về ~2 units

  // Uniform scale + dịch về gốc (0,0,0), đặt đáy mô hình tại z=0
  model.scale.setScalar(fitScale);
  model.position.set(
    -center.x * fitScale,
    -center.y * fitScale,
    -box.min.z * fitScale
  );
  model.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  previewScene.add(model);

  // Camera nhìn vào mặt trước model (+Y là forward sau khi fix rotation)
  // Đặt camera ở phía +Y, hơi cao và lệch phải — góc nhìn isometric nhẹ
  previewCam.position.set(1, 3.5, 2);
  previewCam.lookAt(0, 0, 0.8);

  // Ambient + Directional Light tạo chiều sâu cho model
  previewScene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 2.5);
  dir.position.set(2, -3, 5);
  previewScene.add(dir);

  const previewRenderer = new THREE.WebGLRenderer({ antialias: true });
  previewRenderer.setPixelRatio(window.devicePixelRatio);
  previewRenderer.setSize(W, H);
  container.appendChild(previewRenderer.domElement);

  // Render tĩnh — chỉ cần vẽ 1 lần, không cần animation loop
  previewRenderer.render(previewScene, previewCam);
}

// ============================================================
// GAME LOOP
// ============================================================

function animate() {
  // Dừng logic khi game over hoặc đang pause — vẫn render để giữ ảnh tĩnh.
  if (!gameState.isOver && !gameState.isPaused) {
    animateVehicles();
    animatePond();   // di chuyển bệ hồ sen trái/phải mỗi frame
    animatePlayer();
    hitTest();
    animateCoins();  // xoay + bob đồng xu

    // Thu thập xu: so sánh vị trí player với từng xu mỗi frame.
    // collectCoins trả về số xu thu được → nhân 5 cộng vào coinBonus.
    const collected = collectCoins(player.position.x, player.position.y);
    if (collected > 0) {
      gameState.coinBonus += collected * 5;
      // Cập nhật HUD score ngay lập tức (không chờ stepCompleted).
      if (scoreDOM)
        scoreDOM.innerText = (Math.max(0, position.currentRow - START_ROW) + gameState.coinBonus).toString();
    }
  }

  // Camera follow luôn chạy (kể cả game over) để không bị giật khi Retry.
  camera.position.y = player.position.y + CAMERA_Y_OFFSET;

  renderer.render(scene, camera);
}