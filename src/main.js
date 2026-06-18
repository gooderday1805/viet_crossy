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
import catModelUrl     from "./models/animal-cat.glb?url";
import dogModelUrl     from "./models/animal-dog.glb?url";
import cowModelUrl     from "./models/animal-cow.glb?url";
import monkeyModelUrl  from "./models/animal-monkey.glb?url";
import pandaModelUrl   from "./models/animal-panda.glb?url";
import penguinModelUrl from "./models/animal-penguin.glb?url";
import pigModelUrl     from "./models/animal-pig.glb?url";
import tigerModelUrl   from "./models/animal-tiger.glb?url";
// GLB xe cộ — SUV và Taxi
import suvUrl  from "./models/suv.glb?url";
import taxiUrl from "./models/taxi.glb?url";
// Texture dùng chung cho tất cả model (palette màu dạng atlas)
import colormapUrl from "./Textures/colormap.png?url";
import { vehicleModelCache } from "./utilities/vehicleModels";
import { getCoins, isUnlocked, purchaseCharacter } from "./shopState";
import { createRain, animateRain } from "./components/Rain";

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

// ── Weather / Night-Rain System ───────────────────────────────────────────────
// Khái niệm CG — Atmosphere Effect:
//   Thay đổi màu nền (scene.background) + cường độ ánh sáng tạo cảm giác ngày/đêm.
//   Particle system (Rain) mô phỏng mưa — kích hoạt sau khi đạt ngưỡng điểm.
//   NIGHT_RAIN_SCORE: ngưỡng score để chuyển sang đêm mưa (score = row + coinBonus).
const NIGHT_RAIN_SCORE = 30;
const SKY_DAY   = new THREE.Color(0xbfd7ea); // xanh trời ban ngày
const SKY_NIGHT = new THREE.Color(0x0d1b2a); // xanh đen đêm mưa

let rainSystem    = null;  // { group, clock } trả về từ createRain()
let isNightMode   = false; // đã kích hoạt đêm mưa chưa

/**
 * Kích hoạt chế độ đêm mưa: đổi bầu trời, giảm ánh sáng, spawn hạt mưa.
 * Chỉ chạy một lần mỗi game session (guard isNightMode).
 */
function activateNightRain() {
  if (isNightMode) return;
  isNightMode = true;
  scene.background = SKY_NIGHT;
  // Giảm ambient xuống còn 20% — tạo không khí đêm tối
  ambientLight.color.set(0x4466aa);
  ambientLight.intensity = 0.2;
  rainSystem = createRain();
  scene.add(rainSystem.group);
}

/**
 * Tắt đêm mưa, khôi phục trạng thái ngày — gọi khi Retry hoặc về Home.
 */
function deactivateNightRain() {
  if (!isNightMode) return;
  isNightMode = false;
  scene.background = SKY_DAY;
  ambientLight.color.set(0xffffff);
  ambientLight.intensity = 1;
  if (rainSystem) {
    scene.remove(rainSystem.group);
    rainSystem = null;
  }
}

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
const CHARACTERS = [
  { key: "cat",     name: "Mèo",      desc: "Linh hoạt · Nhanh nhẹn",  price: 0   },
  { key: "dog",     name: "Chó",      desc: "Trung thành · Dũng cảm",  price: 0   },
  { key: "pig",     name: "Heo",      desc: "Đáng yêu · Vui vẻ",       price: 50  },
  { key: "penguin", name: "Cánh Cụt", desc: "Bình thản · Bền bỉ",      price: 75  },
  { key: "cow",     name: "Bò",       desc: "Mạnh mẽ · Chắc chắn",     price: 75  },
  { key: "monkey",  name: "Khỉ",      desc: "Tinh nghịch · Lanh lợi",  price: 100 },
  { key: "panda",   name: "Gấu Trúc", desc: "Điềm tĩnh · Dễ thương",   price: 100 },
  { key: "tiger",   name: "Hổ",       desc: "Dũng mãnh · Uy lực",      price: 150 },
];
let modelSceneMap  = {}; // key → THREE.Group (scene gốc của từng GLB)
let pendingPurchase = null; // nhân vật đang chờ xác nhận mua

// Game chưa start ngay — chờ người dùng chọn nhân vật
// top-level await: module chờ load xong GLB mới chạy tiếp
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
  // Hiện lại màn hình chọn nhân vật, cập nhật ví + trạng thái khóa mới nhất
  document.getElementById("character-select").style.display = "flex";
  refreshCharacterSelect();
}

function initializeGame() {
  gameState.isOver   = false;
  gameState.isPaused = false;
  gameState.coinBonus = 0; // reset điểm xu về 0 mỗi lần chơi mới
  deactivateNightRain(); // reset thời tiết về ngày khi chơi lại
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
// const axesHelper = new THREE.AxesHelper(200);
// // Nâng lên z=2 để thoát khỏi mesh cỏ (foundation dày 3, từ z=-1.5 đến z=1.5)
// axesHelper.position.z = 2;
// scene.add(axesHelper);

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

// Khoảng cách cố định từ camera đến player theo trục Y.
// Camera luôn ở phía sau player 380 đơn vị (≈ 9 tile) để nhìn thấy đủ cảnh phía trước.
const CAMERA_Y_OFFSET = -380;

// ============================================================
// VEHICLE MODEL LOADING
// ============================================================

// ─────────────────────────────────────────────────────────────────────────────
// loadVehicleModels — tải GLB xe cộ, xử lý transform, lưu vào vehicleModelCache.
//
// Khái niệm CG — Coordinate Conversion (Y-up → Z-up):
//   GLTF dùng hệ tọa độ Y-up (tiêu chuẩn OpenGL). Game dùng Z-up.
//   rotation.x = -π/2 chuyển đổi: Y_gltf → -Z_game, Z_gltf → Y_game.
//
// Khái niệm CG — AABB (Axis-Aligned Bounding Box) để auto-scale:
//   Box3.setFromObject() duyệt toàn bộ cây mesh → tính hộp bao nhỏ nhất.
//   size = getSize() → chiều dài lớn nhất → scale = targetLength / maxDim.
//   Kết quả: mọi xe GLB đều có kích thước đồng nhất với block car (≈60 units).
//
// Rotation mũi xe:
//   rotation.z = π/2 → mũi xe quay về +X (hướng chạy mặc định khi direction=true).
//   Nếu xe chạy ngược (mũi về -X), đổi rotation.z = -π/2.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load song song SUV + Taxi GLB, xử lý rotation/scale/position, lưu vào cache.
 * @param {GLTFLoader} loader - Instance GLTFLoader dùng chung với nhân vật.
 */
async function loadVehicleModels(loader) {
  const configs = [
    { key: "suv",  url: suvUrl,  targetLength: 65 },
    { key: "taxi", url: taxiUrl, targetLength: 60 },
  ];

  // Load colormap atlas — cùng texture dùng cho nhân vật, áp khi model không có texture riêng
  // colormap.flipY=false: GLTF UV gốc tọa độ từ trên-trái, Three.js mặc định lật Y → tắt để khớp
  const colormap = await new THREE.TextureLoader().loadAsync(colormapUrl);
  colormap.flipY = false;
  colormap.colorSpace = THREE.SRGBColorSpace;

  await Promise.allSettled(
    configs.map(async ({ key, url, targetLength }) => {
      try {
        const gltf = await loader.loadAsync(url);
        const root = gltf.scene;

        // Bước 1 — Chuyển hệ tọa độ GLTF Y-up → game Z-up
        // +π/2 (không phải -π/2): GLTF +Y (trên) → game +Z (trên) — xe nằm đúng chiều.
        // -π/2 sẽ map GLTF +Y → game -Z (dưới) → xe lộn ngược / đứng thẳng.
        root.rotation.x = Math.PI / 2;
        // Bước 2 — Quay mũi xe về +X (hướng di chuyển mặc định, direction=true)
        // Sau rotation.x=+π/2: GLTF+Z → game -Y. Cần -Y → +X: rotation.z = +π/2
        // Nếu xe vẫn quay ngược chiều (mũi về -X): đổi rotation.z = -Math.PI / 2
        root.rotation.y = Math.PI / 2;

        // Bước 3 — Cập nhật matrix để Box3.setFromObject đo đúng sau khi xoay
        root.updateMatrixWorld(true);

        // Bước 4 — Scale để chiều dài lớn nhất ≈ targetLength (giống block car)
        const box  = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const scale = targetLength / Math.max(size.x, size.y, size.z);
        root.scale.setScalar(scale);

        // Bước 5 — Tính lại AABB sau scale, đặt đáy model ngay trên mặt đường (z=3)
        root.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(root);
        root.position.z = 3 - scaledBox.min.z;

        // Bước 6 — Áp MeshLambertMaterial + colormap atlas + shadow
        // existingMap: texture đã nhúng trong GLB (ưu tiên dùng) → ngược lại fallback colormap
        root.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow    = true;
          child.receiveShadow = true;
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          const existingMap = (mat?.map instanceof THREE.Texture) ? mat.map : null;
          child.material = new THREE.MeshLambertMaterial({
            map: existingMap ?? colormap,
            flatShading: true,
          });
        });

        vehicleModelCache[key] = root;
        console.log(`[VehicleModels] Đã load: ${key}`);
      } catch (e) {
        console.warn(`[VehicleModels] Không load được ${key} — dùng fallback block:`, e);
      }
    })
  );
}

// ============================================================
// CHARACTER SELECT
// ============================================================

async function setupCharacterSelect() {
  const loader = new GLTFLoader();

  const MODEL_URLS = {
    cat:     catModelUrl,
    dog:     dogModelUrl,
    cow:     cowModelUrl,
    monkey:  monkeyModelUrl,
    panda:   pandaModelUrl,
    penguin: penguinModelUrl,
    pig:     pigModelUrl,
    tiger:   tigerModelUrl,
  };

  // Load texture trước — cần thiết để áp vào model
  const colormap = await new THREE.TextureLoader().loadAsync(colormapUrl);
  colormap.flipY = false;
  colormap.colorSpace = THREE.SRGBColorSpace;

  // Load song song: nhân vật + xe cộ (GLB vehicle models)
  // Promise.allSettled không throw dù có model fail → game vẫn chạy với fallback
  const entries   = Object.entries(MODEL_URLS);
  const [charResults] = await Promise.all([
    Promise.allSettled(entries.map(([, url]) => loader.loadAsync(url))),
    loadVehicleModels(loader),
  ]);

  charResults.forEach((result, i) => {
    const key = entries[i][0];
    if (result.status === "rejected") {
      console.warn(`[CharSelect] Không load được model: ${key}`, result.reason);
      return;
    }
    const root = result.value.scene;
    root.rotation.x = -Math.PI / 2; // GLTF Y-up → game Z-up
    root.rotation.z = Math.PI;      // mặt model quay về +Y (hướng forward)
    root.traverse((child) => {
      if (!child.isMesh) return;
      // material có thể là array (multi-material mesh) → lấy phần tử đầu tiên
      const mat = Array.isArray(child.material) ? child.material[0] : child.material;
      // Nếu mesh đã có texture riêng (embedded) → giữ, ngược lại dùng colormap atlas
      const existingMap = (mat?.map instanceof THREE.Texture) ? mat.map : null;
      // MeshLambertMaterial: Lambertian diffuse — phù hợp low-poly flat-shaded
      child.material = new THREE.MeshLambertMaterial({
        map: existingMap ?? colormap,
        flatShading: true,
      });
    });
    modelSceneMap[key] = root;
  });

  // Tạo card chỉ cho các model load thành công
  const cardsContainer = document.querySelector(".cs-cards");
  CHARACTERS.forEach((char) => {
    if (!modelSceneMap[char.key]) return; // model này load lỗi → bỏ qua
    const card = buildCharacterCard(char);
    cardsContainer.appendChild(card);
    // clone() để preview dùng bản sao — scene gốc không bị auto-fit modify
    createPreview(`preview-${char.key}`, modelSceneMap[char.key].clone());
  });

  setupBuyModal();
  refreshCharacterSelect();
}

/**
 * Tạo DOM element <button> cho một nhân vật.
 * Nếu bị khóa: thêm overlay 🔒; click sẽ mở modal mua thay vì start game.
 */
function buildCharacterCard(char) {
  const card = document.createElement("button");
  card.className = "cs-card";
  card.dataset.model = char.key;

  // Khung preview — canvas Three.js sẽ được append vào đây bởi createPreview()
  const previewEl = document.createElement("div");
  previewEl.className = "cs-preview";
  previewEl.id = `preview-${char.key}`;
  card.appendChild(previewEl);

  // Phần thông tin phía dưới
  const info = document.createElement("div");
  info.className = "cs-card-info";
  info.innerHTML = `
    <span class="cs-name">${char.name}</span>
    <span class="cs-desc">${char.desc}</span>
    ${char.price > 0
      ? `<span class="cs-price" id="cs-price-${char.key}">🪙 ${char.price}</span>`
      : `<span class="cs-free">MIỄN PHÍ</span>`}
  `;
  card.appendChild(info);

  // Overlay khóa — ẩn/hiện dựa theo isUnlocked() mỗi lần refreshCharacterSelect()
  if (char.price > 0) {
    const lockOverlay = document.createElement("div");
    lockOverlay.className = "cs-lock-overlay";
    lockOverlay.id = `lock-${char.key}`;
    lockOverlay.innerHTML = `<span class="cs-lock-icon">🔒</span>`;
    card.appendChild(lockOverlay);
  }

  card.addEventListener("click", () => {
    if (char.price > 0 && !isUnlocked(char.key)) {
      openBuyModal(char);
    } else {
      selectCharacter(char.key);
    }
  });

  return card;
}

/** Gán model vào player, ẩn character select, khởi động game. */
function selectCharacter(key) {
  setPlayerModel(modelSceneMap[key]);
  document.getElementById("character-select").style.display = "none";
  initializeGame();
  renderer.setAnimationLoop(animate);
}

/** Cập nhật wallet display và trạng thái khóa của các card. */
function refreshCharacterSelect() {
  const walletEl = document.getElementById("cs-wallet-amount");
  if (walletEl) walletEl.textContent = String(getCoins());

  CHARACTERS.forEach((char) => {
    if (char.price === 0) return;
    const lockEl = document.getElementById(`lock-${char.key}`);
    if (lockEl) lockEl.style.display = isUnlocked(char.key) ? "none" : "flex";
  });
}

// ── Buy Modal ────────────────────────────────────────────────

/** Gán listener cho các nút trong buy modal (gọi 1 lần khi setup). */
function setupBuyModal() {
  document.getElementById("buy-modal-confirm")?.addEventListener("click", () => {
    if (!pendingPurchase) return;
    const { key, price } = pendingPurchase;
    const ok = purchaseCharacter(key, price);
    if (!ok) {
      document.getElementById("buy-modal-error")?.classList.remove("hidden");
      document.getElementById("buy-modal-wallet").textContent = String(getCoins());
      return;
    }
    closeBuyModal();
    refreshCharacterSelect();
    selectCharacter(key);
  });

  document.getElementById("buy-modal-cancel")?.addEventListener("click", closeBuyModal);
}

function openBuyModal(char) {
  pendingPurchase = char;
  document.getElementById("buy-modal-name").textContent  = char.name;
  document.getElementById("buy-modal-price").textContent = String(char.price);
  document.getElementById("buy-modal-wallet").textContent = String(getCoins());
  document.getElementById("buy-modal-error")?.classList.add("hidden");
  document.getElementById("buy-modal")?.classList.remove("hidden");
}

function closeBuyModal() {
  pendingPurchase = null;
  document.getElementById("buy-modal")?.classList.add("hidden");
}

/**
 * Tạo mini Three.js scene render GLB model trong ô preview.
 * Auto-fit dùng AABB (Axis-Aligned Bounding Box): hộp bao nhỏ nhất theo trục XYZ
 * để tính scale đồng đều (uniform scale) và căn giữa model trong khung.
 */
function createPreview(containerId, model) {
  const container = document.getElementById(containerId);
  const W = 150, H = 150;

  const previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0x0a0e14);

  // Camera vuông (aspect = 1), góc nhìn isometric nhẹ
  const previewCam = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  previewCam.up.set(0, 0, 1); // Z-up giống game chính

  // Auto-fit: tính AABB → uniform scale + dịch về gốc tọa độ
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fitScale = 2 / maxDim; // chuẩn hóa về ~2 units

  model.scale.setScalar(fitScale);
  model.position.set(
    -center.x * fitScale,
    -center.y * fitScale,
    -box.min.z * fitScale
  );
  model.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  previewScene.add(model);

  previewCam.position.set(1, 3.5, 2);
  previewCam.lookAt(0, 0, 0.8);

  previewScene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 2.5);
  dir.position.set(2, -3, 5);
  previewScene.add(dir);

  const previewRenderer = new THREE.WebGLRenderer({ antialias: true });
  previewRenderer.setPixelRatio(window.devicePixelRatio);
  previewRenderer.setSize(W, H);
  container.appendChild(previewRenderer.domElement);

  // Render tĩnh — 1 lần duy nhất, không cần animation loop
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

  // ── Night-Rain: kích hoạt khi đạt ngưỡng điểm, tắt khi game over ────────
  // Khái niệm CG — Real-time Environment Change:
  //   Thay đổi scene.background + ánh sáng + particle system tại runtime
  //   mà không cần reload scene — Three.js cập nhật trực tiếp trên GPU frame tiếp theo.
  if (!gameState.isOver && !gameState.isPaused) {
    const score = Math.max(0, position.currentRow - START_ROW) + gameState.coinBonus;
    if (!isNightMode && score >= NIGHT_RAIN_SCORE) activateNightRain();
  }

  // Cập nhật hạt mưa mỗi frame — rainGroup.position.y theo player để mưa luôn hiển thị
  if (rainSystem && isNightMode) {
    rainSystem.group.position.y = player.position.y;
    animateRain(rainSystem);
  }

  // Camera follow luôn chạy (kể cả game over) để không bị giật khi Retry.
  camera.position.y = player.position.y + CAMERA_Y_OFFSET;

  renderer.render(scene, camera);
}