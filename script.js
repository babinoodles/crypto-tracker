// script.js

// Danh sách các coin (CoinGecko id)
const coins = ["bitcoin", "ethereum", "ripple", "solana", "cardano"];

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

async function updateTable() {
  const data = await fetchCryptoData();
  if (!data) return;
  
  const tbody = document.querySelector("#crypto-table tbody");
  tbody.innerHTML = ""; // Xóa dữ liệu cũ
  
  coins.forEach(coinId => {
    const coinData = data[coinId];
    if (coinData) {
      const tr = document.createElement("tr");
      
      // Tên coin
      const tdCoin = document.createElement("td");
      tdCoin.textContent = coinId.charAt(0).toUpperCase() + coinId.slice(1);
      tr.appendChild(tdCoin);
      
      // Giá USD
      const tdPrice = document.createElement("td");
      tdPrice.textContent = "$" + coinData.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      tr.appendChild(tdPrice);
      
      // % thay đổi 24h
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
// Cập nhật tự động mỗi 1 phút (60,000 ms)
setInterval(updateTable, 60000);
