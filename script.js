// script.js

// Danh sách các coin theo CoinGecko id
const coins = ["bitcoin", "ethereum", "ripple", "solana", "cardano"];

// Mapping để chuyển từ CoinGecko id sang mã viết tắt và URL icon
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

// Hàm định dạng giá: nếu phần thập phân là .00 thì bỏ, nếu không hiển thị 4 chữ số sau dấu .
function formatPrice(price) {
  let fixedTwo = price.toFixed(2);
  if (fixedTwo.endsWith(".00")) {
    return "$" + price.toFixed(0);
  } else {
    return "$" + price.toFixed(4);
  }
}

// Hàm cập nhật bảng
async function updateTable() {
  const data = await fetchCryptoData();
  if (!data) return;
  
  const tbody = document.querySelector("#crypto-table tbody");
  tbody.innerHTML = ""; // Xóa dữ liệu cũ
  
  coins.forEach(coinId => {
    const coinData = data[coinId];
    if (coinData) {
      const tr = document.createElement("tr");
      
      // Cột Coin: hiển thị icon và mã coin
      const tdCoin = document.createElement("td");
      
      // Tạo thẻ img cho icon
      let mapping = coinMapping[coinId];
      if (mapping && mapping.icon) {
        const img = document.createElement("img");
        img.src = mapping.icon;
        img.alt = mapping.symbol;
        img.className = "coin-icon";
        tdCoin.appendChild(img);
      }
      
      // Thêm mã coin
      const spanCoin = document.createElement("span");
      spanCoin.textContent = mapping ? mapping.symbol : coinId.toUpperCase();
      tdCoin.appendChild(spanCoin);
      tr.appendChild(tdCoin);
      
      // Cột Giá
      const tdPrice = document.createElement("td");
      tdPrice.textContent = formatPrice(coinData.usd);
      tr.appendChild(tdPrice);
      
      // Cột % thay đổi 24h
      const tdChange = document.createElement("td");
      const change = coinData.usd_24h_change;
      tdChange.textContent = change ? change.toFixed(2) + "%" : "N/A";
      tdChange.style.color = change >= 0 ? "green" : "red";
      tr.appendChild(tdChange);
      
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
