# 💡 Đề Xuất Cơ Chế Kẹo Đặc Biệt & Bùa Chú (Candy Balatro)

Để tăng tính chiều sâu chiến thuật và sự phấn khích của cơ chế Roguelike Deckbuilder, chúng ta có thể kết hợp các loại kẹo kỹ năng của **Candy Crush** và các dạng bổ trợ thẻ bài (Enhancements, Editions, Seals) của **Balatro**. 

Dưới đây là thiết kế chi tiết các cơ chế đề xuất có thể nâng cấp cho kẹo:

---

## 1. Kẹo Bùa Chú (Candy Enhancements)
Khi người chơi mua **Thẻ Phép (Tarot)** trong Shop, họ có thể chọn biến đổi các viên kẹo bình thường trên bảng thành kẹo bùa chú. Khi viên kẹo bùa chú này phát nổ (được match), nó sẽ mang lại hiệu ứng đặc biệt:

| Loại Kẹo Bùa Chú | Hình ảnh minh họa | Hiệu ứng khi phát nổ | Ý tưởng gameplay |
| :--- | :---: | :--- | :--- |
| **Kẹo Vàng** (Gold Candy) | 🪙 | Cộng trực tiếp **+$2 Vàng** vào túi tiền. | Giúp tích lũy tài chính để đầu tư sắm Joker ở màn sau. |
| **Kẹo Thủy Tinh** (Glass Candy) | 💎 | Nhân **$\times 2.0$ Mult** cho toàn bộ lượt đi chứa nó. Tuy nhiên, có **1/4 tỷ lệ** viên kẹo này sẽ "vỡ vụn" biến thành ô đá cản trở (Block) không thể dịch chuyển trong 2 lượt tiếp theo. | Lợi ích cực lớn đi kèm rủi ro cao đặc trưng Roguelike. |
| **Kẹo May Mắn** (Lucky Candy) | 🍀 | Có **1/5 cơ hội** được $+40$ Chips và **1/15 cơ hội** được $+10$ Vàng. | Phù hợp với các Joker tăng tỉ lệ may mắn. |
| **Kẹo Thép** (Steel Candy) | 🛡️ | Nếu lượt đi kết thúc mà viên kẹo này **vẫn nằm trên bảng** (không bị nổ), nhân **$\times 1.5$ Mult** cho tổng điểm của lượt đi đó. | Thúc đẩy lối chơi tính toán: giữ kẹo Thép lại ở dưới bảng đấu để nhân điểm. |
| **Kẹo Bạc** (Bonus Candy) | 💿 | Cộng thêm **+30 Chips** cố định khi nổ. | Tăng lượng điểm cơ bản cực nhanh. |

---

## 2. Kẹo Kỹ Năng Xếp Chuỗi (Candy Crush Special Candies)
Được tạo ra khi người chơi xếp được các chuỗi kẹo đặc biệt trong trận đấu:

### 🍬 Kẹo Sọc (Striped Candy) - Tạo ra khi xếp Match-4
- **Kích hoạt:** Khi nổ, nó sẽ bắn ra tia năng lượng dọn sạch toàn bộ 1 hàng ngang hoặc 1 cột dọc.
- **Tính điểm:** Toàn bộ các viên kẹo bị tia năng lượng quét qua đều được kích hoạt tính điểm cơ bản (Chips & Mult của màu đó) và chạy qua hiệu ứng của các Joker. Điều này tạo ra một lượng điểm bùng nổ dây chuyền!

### 💣 Kẹo Gói (Wrapped Candy) - Tạo ra khi xếp hình chữ T hoặc chữ L (Match-5 dạng góc)
- **Kích hoạt:** Khi nổ, nó sẽ gây ra một vụ nổ diện rộng 3x3 quanh nó. Sau khi kẹo rơi xuống, nó lại nổ thêm một lần nữa.
- **Tính điểm:** Giúp dọn bảng nhanh và đẩy số nhân **Combo Cascade** lên rất cao, kích hoạt mạnh các Joker ăn theo cascade như *Cơn Sốt Đường*.

### 🌈 Kẹo Ngũ Sắc (Color Bomb) - Tạo ra khi xếp thẳng hàng Match-5
- **Kích hoạt:** Khi tráo đổi viên kẹo này với một viên kẹo thường bên cạnh, nó sẽ kích nổ **toàn bộ** các viên kẹo cùng màu với viên kẹo thường đó trên bảng.
- **Tính điểm:** Đây là công cụ dọn bảng mạnh nhất. Nếu bạn có Joker chuyên biệt cho màu đỏ (như *Dâu Tây Bùng Nổ*), việc kích nổ toàn bộ kẹo Đỏ trên bảng sẽ mang lại lượng Mult không thể tin nổi!

---

## 3. Viền Kẹo Lấp Lánh (Candy Editions)
Tương tự hiệu ứng viền thẻ của Balatro (Foil, Holographic, Polychrome). Các viên kẹo khi sinh ra có tỉ lệ nhỏ mang các viền lấp lánh này, hoặc có thể nâng cấp trong Shop:

*   **Viền Ánh Kim (Foil Candy):** Cộng thêm **+50 Chips** khi nổ.
*   **Viền Hologram (Holographic Candy):** Cộng thêm **+10 Mult** khi nổ.
*   **Viền Đa Sắc (Polychrome Candy):** Nhân **$\times 1.5$ Mult** trực tiếp vào điểm số. Đây là loại viền mạnh nhất.

---

## 4. Cách Tích Hợp Vào Cửa Hàng (Shop)
Để người chơi sở hữu các cơ chế trên, chúng ta có thể thêm các vật phẩm mới vào Shop:

1.  **Gói Bùa Chú (Booster Packs):** Người chơi mua gói và mở ra ngẫu nhiên 3 lá bài phép (Tarot).
2.  **Lá Bài Phép (Tarot Cards):** Sử dụng trực tiếp để "phù phép" biến đổi các viên kẹo thường trên bảng lưới thành Kẹo Vàng, Kẹo Thủy Tinh, Kẹo Thép... trước khi bắt đầu trận tiếp theo.
3.  **Voucher Vĩnh Viễn:**
    *   *Sọc Ngọt Ngào:* Tăng tỉ lệ xuất hiện kẹo Sọc khi Match-4.
    *   *Khai Thác Mỏ:* Tăng tỉ lệ xuất hiện Kẹo Vàng trên bảng lưới thêm 5%.
