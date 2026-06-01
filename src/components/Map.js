import * as THREE from "three";
import { Grass } from "./Grass";
import { Road } from "./Road";
import { Tree } from "./Tree";
import { Car } from "./Car";
import { Truck } from "./Truck";
import { SUV } from "./SUV";
import { Taxi } from "./Taxi";
import { Building } from "./Building";
import { createPagodaArea } from "./PagodaArea";
import { Xichlo } from "./Xichlo";
import { BanhMiCart } from "./BanhMiCart";
import { HuTieuCart } from "./HuTieuCart";
import { SugarcaneCart } from "./SugarcaneCart";
import { generateRows } from "../utilities/generateRows";
import { spawnCoinsForRow } from "../coins";

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
    speed: 220,
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
  // startIndex phải lấy TRƯỚC khi push để biết số hàng đã có.
  // Sau đó truyền vào generateRows để các hàng mới biết mình ở "độ sâu" bao nhiêu
  // → quyết định xem có sinh nội dung đô thị (urban) hay không.
  const startIndex = metadata.length;
  const newMetadata = generateRows(20, startIndex);

  metadata.push(...newMetadata);
  // Chỉ lặp qua newMetadata (20 row mới) — KHÔNG phải toàn bộ metadata.
  // Nếu dùng metadata.forEach: mỗi lần addRows() lần 2+ sẽ tạo mesh trùng
  // cho toàn bộ row cũ ở vị trí sai → memory leak + visual glitch.
  // startIndex + index + 1: tính rowIndex tuyệt đối trong scene (bắt đầu từ 1).
  newMetadata.forEach((rowData, index) => {
    const rowIndex = startIndex + index + 1;

    // ── Hàng rừng/cỏ: cây xanh ─────────────────────────────────────────────
    if (rowData.type === "forest") {
      const row = Grass(rowIndex);
      rowData.trees.forEach(({ tileIndex, height }) => {
        const tree = Tree(tileIndex, height);
        row.add(tree);
      });
      map.add(row);
    }

    // ── Hàng đô thị (urban): tòa nhà + cây vỉa hè ─────────────────────────
    // Khái niệm CG — Environment Progression:
    //   Sau khoảng 15 hàng (giảm từ 30), forest row được thay bởi urban row
    //   để tạo cảm giác game ngày càng khó và môi trường thay đổi (rừng → phố).
    //   Cây vỉa hè (trees) được render xen kẽ tòa nhà để mềm mại hơn đô thị bê tông.
    if (rowData.type === "urban") {
      const row = Grass(rowIndex); // nền cỏ làm vỉa hè
      rowData.buildings.forEach(({ tileIndex, height }) => {
        const building = Building(tileIndex, height);
        row.add(building);
      });
      // Cây vỉa hè xen kẽ tòa nhà — tạo đô thị VN thực tế hơn
      rowData.trees?.forEach(({ tileIndex, height }) => {
        const tree = Tree(tileIndex, height);
        row.add(tree);
      });
      map.add(row);
    }

    // ── Hàng xe hàng rong (vendor): bánh mì / hủ tiếu / nước mía ──────────
    // Khái niệm CG — Static Obstacle vs Dynamic Obstacle:
    //   Vendor carts là static obstacle (không di chuyển), như cây/tòa nhà.
    //   Player không thể đi qua (endsUpInValidPosition kiểm tra tileIndex).
    //   Khác với xe cộ (dynamic): hitTest.js dùng AABB liên tục để phát hiện va chạm.
    if (rowData.type === "vendor") {
      const row = Grass(rowIndex);
      rowData.carts.forEach(({ tileIndex, cartType, direction }) => {
        let cart;
        if (cartType === "banhmi")       cart = BanhMiCart(tileIndex, direction);
        else if (cartType === "hutieu")  cart = HuTieuCart(tileIndex, direction);
        else                             cart = SugarcaneCart(tileIndex, direction);
        row.add(cart);
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
      // Spawn xu ngẫu nhiên trên lane ô tô (25% xác suất)
      spawnCoinsForRow(rowData, rowIndex);
    }

    // ── Lane SUV ──────────────────────────────────────────────────────────
    if (rowData.type === "suv") {
      const row = Road(rowIndex);
      rowData.vehicles.forEach((vehicle) => {
        const suv = SUV(
          vehicle.initialTileIndex,
          rowData.direction,
          vehicle.color
        );
        vehicle.ref = suv;
        row.add(suv);
      });
      map.add(row);
      spawnCoinsForRow(rowData, rowIndex);
    }

    // ── Lane Taxi ─────────────────────────────────────────────────────────
    if (rowData.type === "taxi") {
      const row = Road(rowIndex);
      rowData.vehicles.forEach((vehicle) => {
        const taxi = Taxi(
          vehicle.initialTileIndex,
          rowData.direction,
          vehicle.color
        );
        vehicle.ref = taxi;
        row.add(taxi);
      });
      map.add(row);
      spawnCoinsForRow(rowData, rowIndex);
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
      // Spawn xu ngẫu nhiên trên lane xe tải (25% xác suất)
      spawnCoinsForRow(rowData, rowIndex);
    }

    // ── Lane Xích lô ──────────────────────────────────────────────────────
    // Khái niệm CG — Vehicle Lane:
    //   Xích lô chạy trên Road (nền đường), cùng cơ chế wrap-around X với car/truck.
    //   Tốc độ thấp hơn (60–100) → tạo "làn xe chậm" đặc trưng đô thị cũ VN.
    //   ref được gán để animateVehicles.js cập nhật position.x mỗi frame.
    if (rowData.type === "xichlo") {
      const row = Road(rowIndex);
      rowData.vehicles.forEach((vehicle) => {
        const xichlo = Xichlo(vehicle.initialTileIndex, rowData.direction);
        vehicle.ref = xichlo;
        row.add(xichlo);
      });
      map.add(row);
      spawnCoinsForRow(rowData, rowIndex);
    }
  });
}
