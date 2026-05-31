import bgmUrl      from "./sounds/bgm.mp3?url";
import jumpUrl     from "./sounds/jump.mp3?url";
import gameOverUrl from "./sounds/game_over.mp3?url";

// ── BGM (Background Music) ────────────────────────────────────────────────────
// loop = true: phát lặp vô tận — trình duyệt tự nối đầu–cuối file.
const bgm = new Audio(bgmUrl);
bgm.loop   = true;
bgm.volume = 0.4; // nhạc nền nhỏ hơn SFX để không lấn át tiếng động

// ── SFX: Jump ────────────────────────────────────────────────────────────────
const jumpSfx = new Audio(jumpUrl);
jumpSfx.volume = 0.7;

// ── SFX: Game Over ───────────────────────────────────────────────────────────
const gameOverSfx = new Audio(gameOverUrl);
gameOverSfx.volume = 0.8;

// Phát BGM từ đầu (dùng khi bắt đầu game mới hoặc Retry).
export function playBgm() {
  bgm.currentTime = 0;
  bgm.play().catch(() => {});
}

// Dừng BGM (pause giữ currentTime — dùng khi game over).
export function stopBgm() {
  bgm.pause();
}

// Phát tiếng nhảy mỗi lần nhân vật bắt đầu một bước.
// currentTime = 0: reset về đầu để tiếng luôn phát đủ dù bấm liên tục.
export function playJump() {
  jumpSfx.currentTime = 0;
  jumpSfx.play().catch(() => {});
}

// Phát tiếng game over (1 lần, không loop).
export function playGameOver() {
  gameOverSfx.currentTime = 0;
  gameOverSfx.play().catch(() => {});
}
