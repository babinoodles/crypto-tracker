// script.js

// Danh sách các coin theo CoinGecko id
const coins = ["bitcoin", "ethereum", "ripple", "solana", "cardano"];

// Mapping từ CoinGecko id sang mã viết tắt và URL icon (dựa trên ví dụ từ OKX)
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
// Nếu phần thập phân là ".00" thì bỏ đi, nếu không hiển thị 4 số sau dấu chấm.
function formatPrice(price) {
  const fixedTwo = price.toFixed(2);
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
      
      // Cột 1: Coin (icon + mã viết tắt)
      const tdCoin = document.createElement("td");
      const mapping = coinMapping[coinId];
      if (mapping && mapping.icon) {
        const img = document.createElement("img");
        img.src = mapping.icon;
        img.alt = mapping.symbol;
        img.className = "coin-icon";
        tdCoin.appendChild(img);
      }
      const spanCoin = document.createElement("span");
      spanCoin.textContent = mapping ? mapping.symbol : coinId.toUpperCase();
      tdCoin.appendChild(spanCoin);
      tr.appendChild(tdCoin);
      
      // Cột 2: Giá hiện tại (USD) - dùng hàm formatPrice
      const tdPrice = document.createElement("td");
      tdPrice.textContent = formatPrice(coinData.usd);
      tr.appendChild(tdPrice);
      
      // Cột 3: % Thay đổi 24h
      const tdChange = document.createElement("td");
      const change = coinData.usd_24h_change;
      tdChange.textContent = change ? change.toFixed(2) + "%" : "N/A";
      tdChange.style.color = change >= 0 ? "green" : "red";
      tr.appendChild(tdChange);
      
      // Cột 4: Order (Dropdown: Buy/Sell)
      const tdOrder = document.createElement("td");
      const selectOrder = document.createElement("select");
      const optionEmpty = document.createElement("option");
      optionEmpty.value = "";
      optionEmpty.textContent = "--";
      selectOrder.appendChild(optionEmpty);
      const optionBuy = document.createElement("option");
      optionBuy.value = "buy";
      optionBuy.textContent = "Buy";
      selectOrder.appendChild(optionBuy);
      const optionSell = document.createElement("option");
      optionSell.value = "sell";
      optionSell.textContent = "Sell";
      selectOrder.appendChild(optionSell);
      tdOrder.appendChild(selectOrder);
      tr.appendChild(tdOrder);
      
      // Cột 5: Entry Price (input)
      const tdEntry = document.createElement("td");
      const inputEntry = document.createElement("input");
      inputEntry.type = "number";
      inputEntry.step = "any";
      inputEntry.placeholder = "Nhập giá";
      tdEntry.appendChild(inputEntry);
      tr.appendChild(tdEntry);
      
      // Cột 6: Leverage (input)
      const tdLeverage = document.createElement("td");
      const inputLeverage = document.createElement("input");
      inputLeverage.type = "number";
      inputLeverage.min = "1";
      inputLeverage.max = "99";
      inputLeverage.placeholder = "1-99";
      tdLeverage.appendChild(inputLeverage);
      tr.appendChild(tdLeverage);
      
      // Cột 7: Kết quả Entry: Hiện giá hiện tại và % thay đổi so với entry, nhân với đòn bẩy
      const tdResult = document.createElement("td");
      // Hàm cập nhật kết quả sẽ được gọi bên dưới (tùy thuộc vào input)
      tdResult.textContent = "N/A";
      tr.appendChild(tdResult);
      
      // Khi có thay đổi ở Entry Price hoặc Leverage, cập nhật cột kết quả
      function updateResult() {
        const entry = parseFloat(inputEntry.value);
        const leverage = parseInt(inputLeverage.value);
        if (!isNaN(entry) && !isNaN(leverage) && entry > 0) {
          let percentChange = ((coinData.usd - entry) / entry) * 100;
          let leveragedChange = percentChange * leverage;
          tdResult.textContent = formatPrice(coinData.usd) + " / " + leveragedChange.toFixed(2) + "%";
          tdResult.style.color = leveragedChange >= 0 ? "green" : "red";
        } else {
          tdResult.textContent = "N/A";
          tdResult.style.color = "#fff";
        }
      }
      inputEntry.addEventListener("input", updateResult);
      inputLeverage.addEventListener("input", updateResult);
      
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
