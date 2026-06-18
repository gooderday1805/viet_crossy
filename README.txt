================================================================
  VIET_CROSSY — Game Chạy Vô Tận 3D Chủ Đề Việt Nam
  Đồ án môn Đồ họa Máy tính — UIT
================================================================

THÔNG TIN NHÓM
--------------
  Sinh viên  : 22521269


CÔNG NGHỆ SỬ DỤNG
------------------
  - Three.js  v0.184.0  (thư viện đồ họa 3D WebGL)
  - Vite      v8.0.10   (build tool / dev server)
  - JavaScript ES Modules (Vanilla JS, không dùng framework)

================================================================
  YÊU CẦU HỆ THỐNG
================================================================

  1. Node.js  phiên bản >= 18
     Tải tại: https://nodejs.org/

  2. npm      phiên bản >= 9
     (npm được cài kèm khi cài Node.js)

  3. Trình duyệt web hiện đại hỗ trợ WebGL:
     Google Chrome, Microsoft Edge, Firefox, Safari (phiên bản mới nhất)

  Kiểm tra phiên bản đã cài:
     node --version
     npm  --version

================================================================
  CÀI ĐẶT VÀ CHẠY (CHẾ ĐỘ PHÁT TRIỂN)
================================================================

  Bước 1 — Giải nén source code / git clone về máy
  ------------------------------
  Giải nén file .zip vào một thư mục bất kỳ.
  Ví dụ: C:\DoAn\viet_crossy\  hoặc  ~/DoAn/viet_crossy/

  Bước 2 — Mở Terminal / Command Prompt
  --------------------------------------
  Trên Windows : nhấn Win + R → gõ "cmd" → Enter
  Trên macOS   : mở Terminal (Spotlight → gõ "Terminal")
  Trên Linux   : mở Terminal

  Bước 3 — Di chuyển vào thư mục project
  ----------------------------------------
  cd đường_dẫn_đến_thư_mục_viet_crossy

  Ví dụ Windows:
    cd C:\DoAn\viet_crossy

  Ví dụ macOS/Linux:
    cd ~/DoAn/viet_crossy

  Bước 4 — Cài đặt thư viện (chạy 1 lần duy nhất)
  --------------------------------------------------
  npm install


  Bước 5 — Khởi động game
  ------------------------
  npm run dev

  Sau khi chạy, Terminal sẽ hiển thị:
    VITE v8.x.x  ready in xxx ms
    ➜  Local:   http://localhost:5173/

  Bước 6 — Mở trình duyệt
  ------------------------
  Mở trình duyệt và truy cập địa chỉ:

    http://localhost:5173

  Game sẽ hiển thị ngay lập tức. Không cần cài thêm bất kỳ
  phần mềm nào khác.

================================================================
  BUILD BẢN PHÁT HÀNH (TÙY CHỌN)
================================================================

  Nếu muốn tạo bản build tĩnh (không cần Node.js để chạy):

  Bước 1 — Build
  ---------------
  npm run build

  Kết quả được tạo trong thư mục dist/

  Bước 2 — Xem trước bản build
  -----------------------------
  npm run preview

  Sau đó mở trình duyệt tại: http://localhost:4173

  LƯU Ý: Thư mục dist/ đã có sẵn trong source code nếu cần
  triển khai ngay mà không cần build lại.

================================================================
  ĐIỀU KHIỂN TRONG GAME
================================================================

  Phím mũi tên ↑        Tiến lên
  Phím mũi tên ↓        Lùi lại
  Phím mũi tên ←        Sang trái
  Phím mũi tên →        Sang phải
  Phím ESC              Tạm dừng / Tiếp tục

  Hoặc sử dụng các nút điều hướng trên màn hình game
  (hỗ trợ cả chuột và màn hình cảm ứng).

================================================================
  CẤU TRÚC THƯ MỤC QUAN TRỌNG
================================================================

  viet_crossy/
  ├── index.html              Trang HTML chính
  ├── package.json            Cấu hình project và thư viện
  ├── src/
  │   ├── main.js             Điểm vào chính của game
  │   ├── components/         Các thành phần 3D (nhân vật, xe, map...)
  │   ├── utilities/          Các hàm tiện ích (sinh map, va chạm...)
  │   ├── models/             File GLB nhân vật và xe (suv, taxi)
  │   ├── sounds/             File âm thanh (bgm, jump, game_over)
  │   └── Textures/           Texture colormap atlas (colormap.png)
  ├── public/                 File tĩnh (favicon, icons)
  └── dist/                   Bản build sẵn (nếu có)
