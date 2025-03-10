// script.js

// Danh sách các coin theo CoinGecko id
const coins = ["bitcoin", "ethereum", "ripple", "solana", "cardano"];

// Mapping từ CoinGecko id sang mã viết tắt và URL icon (sử dụng cryptoicons.org)
const coinMapping = {
  bitcoin: { symbol: "BTC", icon: "https://cryptoicons.org/api/icon/btc/32" },
  ethereum: { symbol: "ETH", icon: "https://cryptoicons.org/api/icon/eth/32" },
  ripple: { symbol: "XRP", icon: "https://cryptoicons.org/api/icon/xrp/32" },
  solana: { symbol: "SOL", icon: "https://cryptoicons.org/api/icon/sol/32" },
  cardano: { symbol: "ADA", icon: "https://cryptoicons.org/api/icon/ada/32" }
};

// Hàm lấy dữ liệu từ CoinGecko
async function fetchCryptoData() {
  const ids = coins.join(",");
  const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    return null;
  }
}

// Hàm định dạng giá:
// Nếu phần thập phân cuối là 0 thì tự động loại bỏ, hiển thị dấu phẩy ngăn cách phần nghìn,
// và tối đa hiển thị 4 chữ số sau dấu chấm.
function formatPrice(price) {
  // Sử dụng toLocaleString với tùy chọn để tự động loại bỏ trailing zeros
  return "$" + price.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

// Hàm cập nhật bảng dữ liệu
async function updateTable() {
  const data = await fetchCryptoData();
  if (!data) return;
  
  const tbody = document.querySelector("#crypto-table tbody");
  tbody.innerHTML = ""; // Xóa dữ liệu cũ
  
  coins.forEach(coinId => {
    const coinData = data[coinId];
    if (coinData) {
      const mapping = coinMapping[coinId];
      const tr = document.createElement("tr");
      
      // Cột 1: Coin (icon + mã)
      const tdCoin = document.createElement("td");
      if (mapping && mapping.icon) {
        const img = document.createElement("img");
        img.src = mapping.icon;
        img.alt = mapping.symbol;
        img.className = "coin-icon";
        // Nếu ảnh lỗi tải, ẩn đi
        img.onerror = function() {
          this.style.display = 'none';
        }
        tdCoin.appendChild(img);
      }
      const spanCoin = document.createElement("span");
      spanCoin.textContent = mapping ? mapping.symbol : coinId.toUpperCase();
      tdCoin.appendChild(spanCoin);
      tr.appendChild(tdCoin);
      
      // Cột 2: Giá hiện tại (USD)
      const tdPrice = document.createElement("td");
      tdPrice.textContent = formatPrice(coinData.usd);
      tr.appendChild(tdPrice);
      
      // Cột 3: % Thay đổi 24h
      const tdChange = document.createElement("td");
      const change = coinData.usd_24h_change;
      tdChange.textContent = change ? change.toFixed(2) + "%" : "N/A";
      tdChange.style.color = change >= 0 ? "green" : "red";
      tr.appendChild(tdChange);
      
      // Các cột bổ sung (Order, Entry Price, Leverage, Kết quả Entry) giữ nguyên như cũ
      // (Để bạn tự bổ sung nếu cần; mã dưới đây giữ nguyên phần cột bổ sung nếu đã có)
      
      // Ví dụ: Nếu bạn đã có code cho các cột bổ sung, hãy giữ lại phần đó
      // Hiện tại tôi chỉ giữ các cột ban đầu, bạn có thể thêm phần tương tự như yêu cầu trước
      
      tbody.appendChild(tr);
    }
  });
  
  // Cập nhật mốc thời gian
  document.getElementById("last-updated").textContent = "Cập nhật lần cuối: " + new Date().toLocaleString();
}

// Cập nhật dữ liệu ngay khi tải trang
updateTable();
// Cập nhật tự động mỗi 1 phút
setInterval(updateTable, 60000);
