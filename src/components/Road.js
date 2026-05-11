import * as THREE from "three";
import { tilesPerRow, tileSize } from "../constants";

export function Road(rowIndex) {
  const road = new THREE.Group();
  road.position.y = rowIndex * tileSize;

  // ===== MẶT ĐƯỜNG =====
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(tilesPerRow * tileSize, tileSize, 3),
    new THREE.MeshLambertMaterial({ color: 0x454a59 })
  );
  foundation.position.z = 1.5; // mặt trên = z = 3
  foundation.receiveShadow = true;
  road.add(foundation);

  // ===== VẠCH KẺ GIỮA (NÉT ĐỨT) =====
  const dashLength = tileSize * 0.8; // độ dài mỗi đoạn
  const gap = tileSize * 0.7;       // khoảng cách giữa các đoạn

  const startX = - (tilesPerRow * tileSize) / 2;

  for (let x = startX; x < -startX; x += dashLength + gap) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(dashLength, tileSize * 0.1, 0.2),
      new THREE.MeshLambertMaterial({ color: "white" })
    );

    dash.position.x = x + dashLength / 2;
    dash.position.y = 0;
    dash.position.z = 3.01;

    road.add(dash);
  }

  return road;
}