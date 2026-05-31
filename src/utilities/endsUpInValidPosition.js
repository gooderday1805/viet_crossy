import { calculateFinalPosition } from "./calculateFinalPosition";
import { minTileIndex, maxTileIndex } from "../constants";
import { metadata as rows } from "../components/Map";

export function endsUpInValidPosition(currentPosition, moves) {
  // Calculate where the player would end up after the move
  const finalPosition = calculateFinalPosition(
    currentPosition,
    moves
  );

  // Chặn player ra ngoài biên map:
  //   Trái/phải: tile ngoài [-8, 8]
  //   Phía sau (âm Y): row < -11 = qua tường hậu chùa (wallEndY = -12 * tileSize)
  //   Phía trước: không giới hạn (map procedural vô hạn)
  if (
    finalPosition.rowIndex < -11 ||
    finalPosition.tileIndex === minTileIndex - 1 ||
    finalPosition.tileIndex === maxTileIndex + 1
  ) {
    return false;
  }

  // Detect if we hit a tree
  // Optional chaining (?.) — trả về undefined (falsy) thay vì throw nếu finalRow là undefined.
  const finalRow = rows[finalPosition.rowIndex - 1];
  if (
    finalRow?.type === "forest" &&
    finalRow.trees.some(
      (tree) => tree.tileIndex === finalPosition.tileIndex
    )
  ) {
    return false;
  }

  return true;
}