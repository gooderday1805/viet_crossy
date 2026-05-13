// import * as THREE from "three";

// export function Camera() {
//   const aspect = window.innerWidth / window.innerHeight;
//   const camera = new THREE.PerspectiveCamera(
//     32,
//     aspect,
//     1, 
//     3000
//   );
//   camera.up.set(0, 0, 1);
//   camera.position.set(180, -250, 230);
//   camera.lookAt(0, 25, 0);

//   return camera;
// }


// Test
import * as THREE from "three";

export function Camera() {
  const size = 750;
  const aspect = window.innerWidth / window.innerHeight;

  const halfW = (size * aspect) / 2;
  const halfH = size / 2;

  const camera = new THREE.OrthographicCamera(
    -halfW, halfW, 
    halfH, -halfH, 
    1, 3000 
  );

  camera.up.set(0, 0, 1);

  // Dịch vị trí camera lùi về phía sau thêm 80 units theo trục Y
  // (Lấy mốc cũ -300 trừ đi 80 = -380)
  camera.position.set(300, -380, 300);

  // Hướng camera nhìn vào điểm giữa của Nhân vật (Y=0) và Chùa (Y=-168)
  // để cả 2 cùng xuất hiện trọn vẹn giữa màn hình
  camera.lookAt(0, -80, 0);

  return camera;
}