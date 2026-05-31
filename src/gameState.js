// Shared game state — object (không phải primitive) để mọi module cùng
// tham chiếu vào 1 vùng nhớ. Nếu dùng `export let isOver = false` thì
// mỗi module nhận bản sao riêng của primitive → ghi từ hitTest không
// phản ánh sang main.js. Dùng object tránh vấn đề này (pass-by-reference).
export const gameState = {
  isOver: false,
};
