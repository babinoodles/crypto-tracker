// script.js

// Danh sách các coin (CoinGecko ids)
const coins = ["bitcoin", "ethereum", "ripple", "solana", "cardano"];

// Mapping: chuyển từ CoinGecko id sang mã viết tắt và URL icon từ CoinGecko
const coinMapping = {
  bitcoin: { symbol: "BTC", icon: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
  ethereum: { symbol: "ETH", icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  ripple: { symbol: "XRP", icon: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
  solana: { symbol: "SOL", icon: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
  cardano: { symbol: "ADA", icon: "https://assets.coingecko.com/coins/images/975/small/cardano.png" }
};

// Hàm lấy dữ liệu từ CoinGecko (USD và 24h change)
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
// Nếu giá là số nguyên (không có phần thập phân) thì hiển thị giá nguyên (có dấu phẩy),
// nếu không thì hiển thị giá với 4 chữ số sau dấu chấm.
function formatPrice(price) {
  if (price % 1 === 0) {
    return "$" + Number(price).toLocaleString();
  } else {
    return "$" + Number(price.toFixed(4)).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
}

// Hàm lưu dữ liệu cho một coin từ localStorage
function loadStoredData(coinId) {
  const stored = localStorage.getItem(`coin_${coinId}`);
  // Mặc định tracking là false nếu chưa có
  return stored ? JSON.parse(stored) : { order: "", entry: "", leverage: "", tracking: false };
}

function saveStoredData(coinId, data) {
  localStorage.setItem(`coin_${coinId}`, JSON.stringify(data));
}

// Hàm cập nhật kết quả entry: nếu tracking bật và có entry, leverage hợp lệ
function updateEntryResult(td, currentPrice, entry, leverage) {
  if (entry && leverage && parseFloat(entry) > 0) {
    entry = parseFloat(entry);
    leverage = parseInt(leverage);
    let percentChange = ((currentPrice - entry) / entry) * 100;
    let leveragedChange = percentChange * leverage;
    td.textContent = formatPrice(currentPrice) + " / " + leveragedChange.toFixed(2) + "%";
    td.style.color = leveragedChange >= 0 ? "green" : "red";
  } else {
    td.textContent = "N/A";
    td.style.color = "#fff";
  }
}

// Hàm cập nhật bảng dữ liệu
async function updateTable() {
  const data = await fetchCryptoData();
  if (!data) return;
  
  const tbody = document.querySelector("#crypto-table tbody");
  tbody.innerHTML = ""; // Xóa dữ liệu cũ
  
  coins.forEach(coinId => {
    const coinData = data[coinId];
    if (!coinData) return;
    
    const mapping = coinMapping[coinId];
    const stored = loadStoredData(coinId);
    
    const tr = document.createElement("tr");
    
    // Cột 1: Coin (icon + mã)
    const tdCoin = document.createElement("td");
    if (mapping && mapping.icon) {
      const img = document.createElement("img");
      img.src = mapping.icon;
      img.alt = mapping.symbol;
      img.className = "coin-icon";
      img.onerror = function() {
        this.style.display = 'none';
      };
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
    
    // Cột 4: Order (dropdown)
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
    selectOrder.value = stored.order || "";
    selectOrder.addEventListener("change", function() {
      stored.order = this.value;
      saveStoredData(coinId, stored);
    });
    tdOrder.appendChild(selectOrder);
    tr.appendChild(tdOrder);
    
    // Cột 5: Entry Price (input)
    const tdEntry = document.createElement("td");
    const inputEntry = document.createElement("input");
    inputEntry.type = "number";
    inputEntry.step = "any";
    inputEntry.value = stored.entry || "";
    inputEntry.addEventListener("input", function() {
      stored.entry = this.value;
      saveStoredData(coinId, stored);
      updateEntryResult(tdResult, coinData.usd, stored.entry, stored.leverage);
    });
    tdEntry.appendChild(inputEntry);
    tr.appendChild(tdEntry);
    
    // Cột 6: Leverage (input)
    const tdLeverage = document.createElement("td");
    const inputLeverage = document.createElement("input");
    inputLeverage.type = "number";
    inputLeverage.min = "1";
    inputLeverage.max = "99";
    inputLeverage.value = stored.leverage || "";
    inputLeverage.addEventListener("input", function() {
      stored.leverage = this.value;
      saveStoredData(coinId, stored);
      updateEntryResult(tdResult, coinData.usd, stored.entry, stored.leverage);
    });
    tdLeverage.appendChild(inputLeverage);
    tr.appendChild(tdLeverage);
    
    // Cột 7: Kết quả Entry (computed)
    const tdResult = document.createElement("td");
    updateEntryResult(tdResult, coinData.usd, stored.entry, stored.leverage);
    tr.appendChild(tdResult);
    
    // Cột 8: Toggle Tracking (nút Start/Stop)
    const tdToggle = document.createElement("td");
    const btnToggle = document.createElement("button");
    btnToggle.textContent = stored.tracking ? "Stop" : "Start";
    btnToggle.style.padding = "6px 12px";
    btnToggle.style.borderRadius = "8px";
    btnToggle.style.border = "none";
    btnToggle.style.cursor = "pointer";
    // Đổi màu: nếu đang tracking -> màu đỏ; nếu không -> màu xanh lá
    btnToggle.style.backgroundColor = stored.tracking ? "#FF3B30" : "#34C759";
    btnToggle.style.color = "#fff";
    btnToggle.addEventListener("click", function() {
      stored.tracking = !stored.tracking;
      saveStoredData(coinId, stored);
      btnToggle.textContent = stored.tracking ? "Stop" : "Start";
      btnToggle.style.backgroundColor = stored.tracking ? "#FF3B30" : "#34C759";
      // Cập nhật kết quả entry
      updateEntryResult(tdResult, coinData.usd, stored.entry, stored.leverage);
      // Cập nhật cột Status theo sau
      tdStatus.textContent = stored.tracking ? "Tracking" : "Stopped";
    });
    tdToggle.appendChild(btnToggle);
    tr.appendChild(tdToggle);
    
    // Cột 9: Status (hiển thị trạng thái tracking)
    const tdStatus = document.createElement("td");
    tdStatus.textContent = stored.tracking ? "Tracking" : "Stopped";
    tr.appendChild(tdStatus);
    
    tbody.appendChild(tr);
  });
  
  // Cập nhật mốc thời gian (đặt ngay dưới tiêu đề)
  document.getElementById("last-updated").textContent = "Cập nhật lần cuối: " + new Date().toLocaleString();
}

// Cập nhật ngay khi tải trang
updateTable();
// Cập nhật tự động mỗi 1 phút
setInterval(updateTable, 60000);
