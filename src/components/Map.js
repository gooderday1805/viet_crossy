import * as THREE from "three";
import { Grass } from "./Grass";
import { Road } from "./Road";
import { Tree } from "./Tree";
import { Car } from "./Car";
import { Truck } from "./Truck";
import { createPagodaArea } from "./PagodaArea";
import { generateRows } from "../utilities/generateRows";

export const metadata = [
  {
    type: "forest",
    trees: [
      { tileIndex: -8, height: 30 },
      { tileIndex: -3, height: 50 },
      { tileIndex: 2, height: 30 },
      { tileIndex: 5, height: 30 },
    ],
  },
  {
    type: "car",
    direction: false,
    speed: 188,
    vehicles: [
      { initialTileIndex: -4, color: 0xbdb638 },
      { initialTileIndex: -1, color: 0x78b14b },
      { initialTileIndex: 4, color: 0xa52523 },
    ],
  },
  {
    type: "forest",
    trees: [
      { tileIndex: -5, height: 30 },
      { tileIndex: -1, height: 50 },
      { tileIndex: 3, height: 30 },
      { tileIndex: 6, height: 30 },
    ],
  },
  {
    type: "truck",
    direction: true,
    speed: 125,
    vehicles: [
      { initialTileIndex: -4, color: 0x78b14b },
      { initialTileIndex: 0, color: 0xbdb638 },
    ],
  },
  {
    type: "car",
    direction: false,
    speed: 165,
    vehicles: [
      { initialTileIndex: -4, color: 0xbdb638 },
      { initialTileIndex: -1, color: 0x78b14b },
      { initialTileIndex: 4, color: 0xa52523 },
    ],
  },
  {
    type: "forest",
    trees: [
      { tileIndex: -8, height: 30 },
      { tileIndex: -3, height: 50 },
      { tileIndex: 2, height: 30 },
      { tileIndex: 5, height: 30 },
    ],
  },
  {
    type: "car",
    direction: false,
    speed:220,
    vehicles: [
      { initialTileIndex: -4, color: 0xbdb638 },
      { initialTileIndex: -1, color: 0x78b14b },
      { initialTileIndex: 4, color: 0xa52523 },
    ],
  },
  {
    type: "forest",
    trees: [
      { tileIndex: -7, height: 30 },
      { tileIndex: -4, height: 50 },
      { tileIndex: 1, height: 30 },
      { tileIndex: 3, height: 30 },
      { tileIndex: 8, height: 30 },
    ],
  },
];

export const map = new THREE.Group();

export function initializeMap() {
  metadata.length = 0;
  map.remove(...map.children);
  
  // Mở rộng grass đến row -13 để phủ toàn bộ khu vực chùa mở rộng
  for (let rowIndex = 0; rowIndex >= -13; rowIndex--) {
    const grass = Grass(rowIndex);
    map.add(grass);
  }

  // Define Pagoda
  const pagoda = createPagodaArea();
  pagoda.position.y = 0;
  map.add(pagoda);

  addRows();
}

export function addRows() {
  const newMetadata = generateRows(20);

  const startIndex = metadata.length;
  metadata.push(...newMetadata);
  // Chỉ lặp qua newMetadata (20 row mới) — KHÔNG phải toàn bộ metadata.
  // Nếu dùng metadata.forEach: mỗi lần addRows() lần 2+ sẽ tạo mesh trùng
  // cho toàn bộ row cũ ở vị trí sai → memory leak + visual glitch.
  // startIndex + index + 1: tính rowIndex tuyệt đối trong scene (bắt đầu từ 1).
  newMetadata.forEach((rowData, index) => {
    const rowIndex = startIndex + index + 1;

    if (rowData.type === "forest") {
      const row = Grass(rowIndex);

      rowData.trees.forEach(({ tileIndex, height }) => {
        const tree = Tree(tileIndex, height);
        row.add(tree);
      });

      map.add(row);
    }

    if (rowData.type === "car") {
      const row = Road(rowIndex);

      rowData.vehicles.forEach((vehicle) => {
        const car = Car(
          vehicle.initialTileIndex,
          rowData.direction,
          vehicle.color
        );
        vehicle.ref = car;
        row.add(car);
      });

      map.add(row);
    }

    if (rowData.type === "truck") {
      const row = Road(rowIndex);

      rowData.vehicles.forEach((vehicle) => {
        const truck = Truck(
          vehicle.initialTileIndex,
          rowData.direction,
          vehicle.color
        );
        vehicle.ref = truck;
        row.add(truck);
      });

      map.add(row);
    }
  });
}
