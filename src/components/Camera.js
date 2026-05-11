import * as THREE from "three";

export function Camera() {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(
    32,
    aspect,
    1, 
    3000
  );
  camera.up.set(0, 0, 1);
  camera.position.set(180, -250, 230);
  camera.lookAt(0, 25, 0);

  return camera;
}