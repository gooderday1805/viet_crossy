// ─────────────────────────────────────────────────────────────────────────────
// calculateFinalPosition.js — tính vị trí cuối sau khi áp dụng chuỗi moves.
//
// Khái niệm CG — Accumulative Transform (tích lũy biến đổi):
//   Mỗi move là một phép dịch chuyển (translation) rời rạc trên lưới tile.
//   reduce() áp lần lượt từng bước: state mới = f(state cũ, move).
//   Đây là dạng đơn giản của kinematics (tính học): chuỗi dịch chuyển rời rạc
//   thay vì dịch chuyển liên tục trong không gian 3D.
//
// Hàm này là PURE FUNCTION (không có side-effect):
//   Input: currentPosition + moves → Output: finalPosition mới.
//   Dùng để kiểm tra hợp lệ (endsUpInValidPosition) TRƯỚC khi thực sự di chuyển.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tính vị trí tile cuối cùng sau khi áp toàn bộ danh sách moves.
 * @param {{ rowIndex: number, tileIndex: number }} currentPosition - Vị trí hiện tại.
 * @param {string[]} moves - Mảng hướng di chuyển ("forward"|"backward"|"left"|"right").
 * @returns {{ rowIndex: number, tileIndex: number }} Vị trí sau khi đi hết moves.
 */
export function calculateFinalPosition(currentPosition, moves) {
  return moves.reduce((position, direction) => {
    if (direction === "forward")
      return { rowIndex: position.rowIndex + 1, tileIndex: position.tileIndex };
    if (direction === "backward")
      return { rowIndex: position.rowIndex - 1, tileIndex: position.tileIndex };
    if (direction === "left")
      return { rowIndex: position.rowIndex, tileIndex: position.tileIndex - 1 };
    if (direction === "right")
      return { rowIndex: position.rowIndex, tileIndex: position.tileIndex + 1 };
    return position; // direction không hợp lệ → giữ nguyên
  }, currentPosition);
}
