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

// Global timer countdown cho toàn trang
let countdown = 10;
let globalTimer;

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

// Hàm lấy giá riêng cho một coin (chỉ USD)
async function fetchPriceForCoin(coinId) {
  const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data[coinId];
  } catch (error) {
    console.error(`Error fetching price for ${coinId}:`, error);
    return null;
  }
}

// Hàm định dạng giá:
// Nếu giá là số nguyên (phần thập phân bằng 0) thì hiển thị với dấu phẩy,
// nếu không, hiển thị giá với 4 chữ số sau dấu chấm.
function formatPrice(price) {
  // Làm tròn đến 4 chữ số sau dấu chấm, sau đó loại bỏ trailing zeros
  let str = price.toFixed(4);
  // Loại bỏ phần ".0000" hoặc ".00" nếu không cần thiết
  if (str.indexOf('.') !== -1) {
    str = str.replace(/\.?0+$/, '');
  }
  return "$" + Number(str).toLocaleString('en-US');
}


// Hàm lưu dữ liệu cho một coin từ localStorage
function loadStoredData(coinId) {
  const stored = localStorage.getItem(`coin_${coinId}`);
  return stored ? JSON.parse(stored) : { order: "", entry: "", leverage: "", tracking: false };
}

function saveStoredData(coinId, data) {
  localStorage.setItem(`coin_${coinId}`, JSON.stringify(data));
}

// Hàm cập nhật ô "Results": chỉ hiển thị % thay đổi so với entry (nhân với đòn bẩy)
function updateEntryResult(td, currentPrice, entry, leverage) {
  if (entry && leverage && parseFloat(entry) > 0) {
    entry = parseFloat(entry);
    leverage = parseInt(leverage);
    let percentChange = ((currentPrice - entry) / entry) * 100;
    let leveragedChange = percentChange * leverage;
    td.textContent = leveragedChange.toFixed(2) + "%";
    td.style.color = leveragedChange >= 0 ? "green" : "red";
  } else {
    td.textContent = "N/A";
    td.style.color = "#fff";
  }
}

// Hàm cập nhật bảng dữ liệu toàn cục
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
    tr.dataset.coin = coinId; // Đánh dấu cho tiện xử lý
    
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
    
    // Cột 2: ATM Price (giá hiện tại)
    const tdPrice = document.createElement("td");
    tdPrice.id = "price_" + coinId;
    tdPrice.textContent = formatPrice(coinData.usd);
    tr.appendChild(tdPrice);
    
    // Cột 3: % Thay đổi 24h
    const tdChange = document.createElement("td");
    tdChange.textContent = coinData.usd_24h_change ? coinData.usd_24h_change.toFixed(2) + "%" : "N/A";
    tdChange.style.color = coinData.usd_24h_change >= 0 ? "green" : "red";
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
      // Nếu chọn Buy/Sell và ô entry trống, tự điền entry bằng giá hiện tại
      if ((this.value === "buy" || this.value === "sell") && !stored.entry) {
        stored.entry = coinData.usd;
        inputEntry.value = coinData.usd;
      }
      saveStoredData(coinId, stored);
      updateEntryResult(tdResult, coinData.usd, stored.entry, stored.leverage);
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
    
    // Cột 7: Results (chỉ hiển thị % thay đổi so với entry, nhân với đòn bẩy)
    const tdResult = document.createElement("td");
    tdResult.id = "result_" + coinId;
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
    btnToggle.style.backgroundColor = stored.tracking ? "#FF3B30" : "#34C759";
    btnToggle.style.color = "#fff";
    btnToggle.addEventListener("click", function() {
      stored.tracking = !stored.tracking;
      saveStoredData(coinId, stored);
      btnToggle.textContent = stored.tracking ? "Stop" : "Start";
      btnToggle.style.backgroundColor = stored.tracking ? "#FF3B30" : "#34C759";
      if (stored.tracking) {
        if (trackingTimers[coinId]) clearInterval(trackingTimers[coinId]);
        // Khởi chạy timer riêng cho coin này với chu kỳ 10 giây
        trackingTimers[coinId] = setInterval(async () => {
          const coinUpdate = await fetchPriceForCoin(coinId);
          if (coinUpdate) {
            document.getElementById("price_" + coinId).textContent = formatPrice(coinUpdate.usd);
            updateEntryResult(document.getElementById("result_" + coinId), coinUpdate.usd, stored.entry, stored.leverage);
          }
        }, 10000);
      } else {
        if (trackingTimers[coinId]) {
          clearInterval(trackingTimers[coinId]);
          delete trackingTimers[coinId];
        }
      }
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

// Hàm cập nhật giá và kết quả cho các coin đang tracking (global refresh theo timer countdown)
async function updateTrackingPrices() {
  const data = await fetchCryptoData();
  if (!data) return;
  coins.forEach(coinId => {
    const coinData = data[coinId];
    if (!coinData) return;
    const stored = loadStoredData(coinId);
    if (stored.tracking) {
      const tdPrice = document.getElementById("price_" + coinId);
      const tdResult = document.getElementById("result_" + coinId);
      if (tdPrice) tdPrice.textContent = formatPrice(coinData.usd);
      if (tdResult) updateEntryResult(tdResult, coinData.usd, stored.entry, stored.leverage);
    }
  });
}

// Global countdown timer cho toàn trang (đếm ngược 10s)
function startGlobalCountdown() {
  const timerEl = document.getElementById("refresh-timer");
  if (!timerEl) return;
  timerEl.textContent = "Next refresh in: " + countdown + "s";
  globalTimer = setInterval(async () => {
    countdown--;
    timerEl.textContent = "Next refresh in: " + countdown + "s";
    if (countdown <= 0) {
      await updateTrackingPrices();
      countdown = 10;
      timerEl.textContent = "Next refresh in: " + countdown + "s";
    }
  }, 1000);
}
// Cột 7: Results (chỉ hiển thị % thay đổi)
const tdResult = document.createElement("td");
tdResult.id = "result_" + coinId;
tdResult.className = "results-cell";
updateEntryResult(tdResult, coinData.usd, stored.entry, stored.leverage);
tr.appendChild(tdResult);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Cập nhật toàn bộ bảng ngay khi tải trang
updateTable();
// Khởi chạy global countdown timer
startGlobalCountdown();
// Cập nhật toàn bộ bảng tự động mỗi 1 phút (để cập nhật các thông tin khác)
setInterval(updateTable, 60000);
