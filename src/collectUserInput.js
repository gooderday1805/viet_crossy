// ─────────────────────────────────────────────────────────────────────────────
// collectUserInput.js — ánh xạ input người dùng (bàn phím + nút UI) → queueMove().
//
// Thiết kế: module này chỉ "thu thập" input, không chứa game logic.
// queueMove() trong Player.js là điểm duy nhất kiểm tra isOver + isPaused
// → dù input đến từ bàn phím, nút UI, hay bất kỳ nguồn nào, đều được lọc nhất quán.
//
// preventDefault() trên Arrow keys: ngăn trình duyệt scroll trang khi game đang chạy.
// ─────────────────────────────────────────────────────────────────────────────

import { queueMove } from "./components/Player";

// ── Nút di chuyển trên UI (mobile-friendly) ──────────────────────────────────
document.getElementById("forward") ?.addEventListener("click", () => queueMove("forward"));
document.getElementById("backward")?.addEventListener("click", () => queueMove("backward"));
document.getElementById("left")    ?.addEventListener("click", () => queueMove("left"));
document.getElementById("right")   ?.addEventListener("click", () => queueMove("right"));

// ── Bàn phím (desktop) ────────────────────────────────────────────────────────
globalThis.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault(); // ngăn trang cuộn lên
    queueMove("forward");
  } else if (event.key === "ArrowDown") {
    event.preventDefault(); // ngăn trang cuộn xuống
    queueMove("backward");
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    queueMove("left");
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    queueMove("right");
  }
});
