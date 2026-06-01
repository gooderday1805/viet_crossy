// Quản lý ví xu vĩnh viễn và danh sách nhân vật đã mở khóa.
// Dùng localStorage để persist qua các phiên chơi (session persistence):
//   localStorage.getItem / setItem lưu chuỗi key-value trong bộ nhớ trình duyệt,
//   không bị xóa khi đóng tab (khác sessionStorage).
const COINS_KEY    = "vietcrossy_coins";
const UNLOCKED_KEY = "vietcrossy_unlocked";

// Hai nhân vật mặc định — luôn có thể chọn, không cần mua
const FREE_CHARS = ["cat", "dog"];

export function getCoins() {
  return parseInt(localStorage.getItem(COINS_KEY) ?? "0", 10);
}

// Cộng xu vào ví — gọi khi game over để lưu xu kiếm được trong run đó.
export function addCoins(amount) {
  if (amount <= 0) return;
  localStorage.setItem(COINS_KEY, String(getCoins() + amount));
}

export function isUnlocked(key) {
  if (FREE_CHARS.includes(key)) return true;
  try {
    const arr = JSON.parse(localStorage.getItem(UNLOCKED_KEY) ?? "[]");
    return Array.isArray(arr) && arr.includes(key);
  } catch {
    return false;
  }
}

// Mua nhân vật: trừ xu và thêm vào danh sách mở khóa.
// Trả về true nếu đủ xu và mua thành công.
export function purchaseCharacter(key, price) {
  const coins = getCoins();
  if (coins < price) return false;
  localStorage.setItem(COINS_KEY, String(coins - price));
  try {
    const arr = JSON.parse(localStorage.getItem(UNLOCKED_KEY) ?? "[]");
    if (!arr.includes(key)) arr.push(key);
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(arr));
  } catch {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify([key]));
  }
  return true;
}
