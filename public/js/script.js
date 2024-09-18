let minDate = -10000; // 公元前10000年
let maxDate = 2023; // 公元2023年

const majorTickInterval = 10; // 大刻度間隔10年
const minorTickInterval = 5; // 中刻度間隔5年
const yearTickInterval = 1; // 每年都有刻度

let selectedBubble = null; // 用於跟踪當前選中的事件泡泡
let selectedConnector = null; // 用於跟踪當前選中的連接線
let events = []; // 用於存儲所有事件的陣列
let periods = []; // 用於存儲時期的數據
let periodHeights = {}; // 用於記錄每個年份的高度佔用情況


// 顏色列表，為每個泡泡分配不同的顏色
const bubbleColors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A1",
  "#FFD733",
  "#33FFF1",
  "#8E33FF",
];
const selectedColor = "#54C3F1"; // 你指定的顏色

function loadEventsAndPeriods() {
  // 顯示載入提示（保持頁面內容可見）
  const loadingOverlay = document.getElementById("loading-overlay");
  loadingOverlay.style.display = "flex"; // 顯示半透明的載入提示

  fetch(
    "https://script.google.com/macros/s/AKfycbxmj5zNndcLwrPUp9WgVmeDrFME16Gk0k_Q662F2-_dzQMNdkalqXbHMUrb9CI61eP7kw/exec"
  )
    .then((response) => response.json())
    .then((data) => {
      // 加載事件資料
      if (data.events && Array.isArray(data.events)) {
        data.events.forEach((event) => {
          addEventBubble(
            event.Year,
            event.Title,
            event.Description,
            event.Period
          );
        });
        sortAndRenderEventList(events);
      }

      if (data.periods && Array.isArray(data.periods)) {
        periods = data.periods;
        renderImportantPeriodsList();
      }

      resetToDefaultTimeline();

      const timelineElement = document.getElementById("timeline");
      const eventsContainer = document.getElementById("events");

      // 隱藏載入提示
      loadingOverlay.style.display = "none"; // 隱藏半透明的載入提示
    })
    .catch((error) => {
      loadingOverlay.innerHTML = "<p>資料加載失敗，請稍後再試。</p>"; // 顯示錯誤提示
    });
}

// 渲染重要時期列表
function renderImportantPeriodsList() {
  const importantPeriodsContainer =
    document.getElementById("important-periods");
  importantPeriodsContainer.innerHTML = ""; // 清空舊的列表

  if (periods && periods.length > 0) {
    periods.forEach((period) => {
      const periodItem = document.createElement("div");
      periodItem.className = "important-period-item";
      periodItem.textContent = `${period.Period} (${period.StartYear} - ${period.EndYear})`;

      periodItem.addEventListener("click", () => {
        scrollToPeriod(period.StartYear, period.EndYear); // 點擊時滾動到時間軸該時期的位置
      });

      importantPeriodsContainer.appendChild(periodItem);
    });
  } else {
    importantPeriodsContainer.textContent = "No important periods available.";
  }
}

// 滾動到時間軸上指定時期的位置
function scrollToPeriod(startYear, endYear) {
  const totalYears = maxDate - minDate;
  const periodCenterYear = (startYear + endYear) / 2;
  const position = ((periodCenterYear - minDate) / totalYears) * 100;

  const timelineContainer = document.querySelector(".timeline-container");
  const scrollPosition =
    (position / 100) * timelineContainer.scrollWidth -
    timelineContainer.clientWidth / 2;
  timelineContainer.scrollTo({
    left: scrollPosition,
    behavior: "smooth",
  });
}
function zoomTimeline(startYear, endYear, periodName) {
  
    // 手動設置年份範圍，確保不被錯誤覆蓋
    const zoomMinDate = startYear;
    const zoomMaxDate = endYear;
  
    // 計算年份範圍和時間軸寬度
    const totalYears = zoomMaxDate - zoomMinDate;
    const timelineElement = document.getElementById("timeline");
    const eventsContainer = document.getElementById("events");
  
    // 假設每年寬度為 3 像素
    const availableWidth = Math.max(1000, totalYears * 3);
    timelineElement.style.width = `${availableWidth}px`;
    eventsContainer.style.width = `${availableWidth}px`;
  
    // 清空舊的時間軸和事件
    clearTimeline();
    createRulerForZoom(zoomMinDate, zoomMaxDate); // 使用縮放後的年份範圍重新繪製時間刻度
  
    // 篩選出符合時期名稱的事件並添加事件泡泡
    const filteredEvents = events.filter(
      (event) =>
        event.year >= zoomMinDate &&
        event.year <= zoomMaxDate &&
        event.period === periodName // 只顯示符合該時期名稱的事件
    );
  
    filteredEvents.forEach((event) => {
      addEventBubble(event.year, event.title, event.content, event.period, zoomMinDate, zoomMaxDate);
    });
  
    adjustEventsContainerHeight(false);
    sortAndRenderEventList(filteredEvents); // 渲染並顯示篩選後的事件列表
  }
  
  
  function createRulerForZoom(zoomMinDate, zoomMaxDate) {
    const totalYears = zoomMaxDate - zoomMinDate;
    const timelineWidth = document.getElementById("timeline").offsetWidth;

    // 根據時間跨度計算每年的像素值
    const pixelsPerYear = timelineWidth / totalYears;

    // 調適訊息: 輸出時間軸寬度和每年像素
    console.log(`時間軸寬度: ${timelineWidth}px, 時間跨度: ${totalYears}年, 每年像素: ${pixelsPerYear}px`);

    let majorTickInterval, minorTickInterval, subTickInterval;

    // 動態設定間隔，根據時間跨度調整
    if (totalYears >= 800) {
        // 當跨度 >= 800 年，設置為每 200 年顯示一個大刻度，中刻度為 50 年，小刻度為 10 年
        majorTickInterval = 200;
        minorTickInterval = 50;
        subTickInterval = 10;
    } else if (totalYears >= 400) {
        // 跨度 400-799 年，設置為每 100 年一個大刻度，中刻度為 20 年，小刻度為 5 年
        majorTickInterval = 100;
        minorTickInterval = 20;
        subTickInterval = 5;
    } else if (totalYears >= 200) {
        // 跨度 200-399 年，設置為每 50 年一個大刻度，中刻度為 10 年，小刻度為 2 年
        majorTickInterval = 50;
        minorTickInterval = 10;
        subTickInterval = 2;
    } else {
        // 跨度 < 200 年，設置為每 10 年一個大刻度，中刻度為 5 年，小刻度為 1 年
        majorTickInterval = 5;
        minorTickInterval = 5;
        subTickInterval = 1;
    }

    // 計算大刻度數量並繪製
    const numberOfMajorTicks = Math.floor(totalYears / majorTickInterval);
    console.log(`總共會顯示大刻度數量: ${numberOfMajorTicks}`);

    for (let i = 0; i <= numberOfMajorTicks; i++) {
        const majorYear = zoomMinDate + i * majorTickInterval;
        if (majorYear > zoomMaxDate) break;

        const majorPosition = ((majorYear - zoomMinDate) / totalYears) * 100;
        console.log(`大刻度 - 年份: ${majorYear}, 位置: ${majorPosition}%`);
        createMark(majorPosition, "50px", "#000"); // 創建大刻度

        // 顯示年份標籤
        createYearLabel(majorPosition, majorYear);

        // 創建中刻度和小刻度
        for (let j = 1; j < majorTickInterval; j++) {
            const subYear = majorYear + j * subTickInterval;
            if (subYear > zoomMaxDate) break;

            const subPosition = ((subYear - zoomMinDate) / totalYears) * 100;

            // 根據 subTickInterval 判斷是否是中刻度還是小刻度
            if (j % (minorTickInterval / subTickInterval) === 0) {
                console.log(`中刻度 - 年份: ${subYear}, 位置: ${subPosition}%`);
                createMark(subPosition, "20px", "#666"); // 中刻度
            } else {
                console.log(`小刻度 - 年份: ${subYear}, 位置: ${subPosition}%`);
                createMark(subPosition, "15px", "#aaa"); // 小刻度
            }
        }
    }
}





function clearTimeline() {
  const ruler = document.getElementById("ruler");
  const eventsContainer = document.getElementById("events");
  ruler.innerHTML = ""; // 清空刻度
  eventsContainer.innerHTML = ""; // 清空事件標記
}

function createRuler() {
    const totalYears = maxDate - minDate;
    const timelineWidth = document.getElementById("timeline").offsetWidth;
    const pixelsPerYear = timelineWidth / totalYears;
  
    // 動態計算主刻度間隔，根據時間範圍調整
    let yearLabelInterval = 1; // 默認間隔
    let majorTickInterval = 10; // 默認主刻度間隔
  
    if (pixelsPerYear > 50) {
      majorTickInterval = 1;
      yearLabelInterval = 1;
    } else if (pixelsPerYear > 20) {
      majorTickInterval = 5;
      yearLabelInterval = 5;
    } else if (pixelsPerYear > 5) {
      majorTickInterval = 10;
      yearLabelInterval = 10;
    } else if (pixelsPerYear > 2) {
      majorTickInterval = 50;
      yearLabelInterval = 50;
    } else {
      majorTickInterval = 100;
      yearLabelInterval = 100;
    }
  
    // 計算刻度數量
    const numberOfMajorTicks = Math.floor(totalYears / majorTickInterval);
    
    // 創建主刻度和次刻度
    for (let i = 0; i <= numberOfMajorTicks; i++) {
      const majorYear = minDate + i * majorTickInterval;
      if (majorYear > maxDate) break;
  
      const majorPosition = ((majorYear - minDate) / totalYears) * 100;
      createMark(majorPosition, "50px", "#000"); // 創建主刻度
  
      // 根據 yearLabelInterval 創建年份標籤
      if (majorYear % yearLabelInterval === 0) {
        createYearLabel(majorPosition, majorYear);
      }
  
      // 創建次要刻度
      for (let j = 1; j < majorTickInterval / yearTickInterval; j++) {
        const subYear = majorYear + j * yearTickInterval;
        if (subYear > maxDate) break;
  
        const subPosition = ((subYear - minDate) / totalYears) * 100;
        if (j === minorTickInterval / yearTickInterval) {
          createMark(subPosition, "20px", "#666");
        } else {
          createMark(subPosition, "15px", "#aaa");
        }
      }
    }
  }
  

function createMark(position, height, color) {
  const mark = document.createElement("div");
  mark.style.position = "absolute";
  mark.style.left = `${position}%`;
  mark.style.top = "0";
  mark.style.width = "2px";
  mark.style.height = height;
  mark.style.backgroundColor = color;
  document.getElementById("ruler").appendChild(mark);
}

function createYearLabel(position, year) {
  const yearLabel = document.createElement("div");
  yearLabel.style.position = "absolute";
  yearLabel.style.left = `${position}%`;
  yearLabel.style.top = "60px";
  yearLabel.style.transform = "translateX(-50%)";
  yearLabel.style.fontSize = "18px";
  yearLabel.textContent = year;
  document.getElementById("ruler").appendChild(yearLabel);
}

// 添加事件泡泡到時間軸上
let lastBubblePosition = -Infinity;
let lastBubbleBottom = 10;

function addEventBubble(year, title, content, period, zoomMinDate, zoomMaxDate) {
    const eventsContainer = document.getElementById("events");
    const timelineElement = document.getElementById("timeline");

    const paddingLeft = parseInt(getComputedStyle(timelineElement).paddingLeft, 10);
    const paddingRight = parseInt(getComputedStyle(timelineElement).paddingRight, 10);
    const availableWidth = timelineElement.offsetWidth - paddingLeft - paddingRight;

    // 使用縮放後的年份範圍來計算事件的位置
    const totalYears = zoomMaxDate - zoomMinDate; // 確保使用縮放後的年份範圍
    let positionPercent = (year - zoomMinDate) / totalYears; // 計算年份相對於縮放範圍的百分比
    let position = positionPercent * availableWidth + paddingLeft; // 將百分比轉換為像素位置


    const bubble = document.createElement("div");
    bubble.className = "event-bubble";
    bubble.style.left = `${position}px`; // 將事件泡泡放置在計算後的位置
    bubble.innerHTML = `<strong>${title}</strong>`;
    bubble.setAttribute("data-content", content);
    bubble.setAttribute("data-year", year);

    // 正確綁定 period
    if (period) {
        bubble.setAttribute("data-period", period);
        bubble.dataset.period = period;
    } else {
        bubble.setAttribute("data-period", "未定義");
        bubble.dataset.period = "未定義";
    }

    const connector = document.createElement("div");
    connector.className = "event-connector";
    connector.style.left = `${position}px`; // 連接線的位置也需要更新

    // 點擊事件泡泡時，顯示詳細介紹和 Period
    bubble.addEventListener("click", function () {
        // 取消之前選中的泡泡和連接線的樣式
        if (selectedBubble && selectedConnector) {
            selectedBubble.style.backgroundColor = "";
            selectedConnector.style.backgroundColor = "";
            selectedBubble.style.zIndex = 1; // 重置 z-index
        }
        // 將當前選中的泡泡和連接線變色
        bubble.style.backgroundColor = selectedColor;
        connector.style.backgroundColor = selectedColor;
        selectedBubble = bubble;
        selectedConnector = connector;
        bubble.style.zIndex = 10; // 提升 z-index

        const eventDetails = document.getElementById("event-details");
        eventDetails.textContent = content;
        eventDetails.style.display = "block";
    });

    eventsContainer.appendChild(connector);
    eventsContainer.appendChild(bubble);

    // 確保事件加入到列表中
    addEventToList(year, title, content, period);
}


// 動態調整事件容器高度，根據是否是完整時間軸進行不同處理
function adjustEventsContainerHeight(isFullTimeline = false) {
  const eventsContainer = document.getElementById("events");
  let maxHeight = 0;

  // 判斷是時期泡泡還是事件泡泡
  if (isFullTimeline) {
    // 遍歷所有的時期泡泡，找到最高的時期泡泡
    const periodBubbles = document.querySelectorAll(".period-bubble");
    periodBubbles.forEach((bubble) => {
      const bubbleBottom = parseInt(bubble.style.bottom || "0px");
      const bubbleHeight = bubble.offsetHeight + bubbleBottom;
      if (bubbleHeight > maxHeight) {
        maxHeight = bubbleHeight;
      }
    });
  } else {
    // 遍歷所有的事件泡泡，找到最高的事件泡泡
    const bubbles = document.querySelectorAll(".event-bubble");
    bubbles.forEach((bubble) => {
      const bubbleBottom = parseInt(bubble.style.bottom || "0px");
      const bubbleHeight = bubble.offsetHeight + bubbleBottom;
      if (bubbleHeight > maxHeight) {
        maxHeight = bubbleHeight;
      }
    });
  }

  // 將容器的高度設置為最高的泡泡高度，加上一些額外空間
  eventsContainer.style.height = `${maxHeight + 20}px`; // 增加一點額外空間
}

function addPeriodBubble(startYear, endYear, periodTitle, index) {
  const eventsContainer = document.getElementById("events");
  const timelineElement = document.getElementById("timeline");

  if (!eventsContainer || !timelineElement) {
    return;
  }

  const timelineWidth = timelineElement.offsetWidth;
  const paddingLeft = parseInt(
    getComputedStyle(timelineElement).paddingLeft,
    10
  );
  const paddingRight = parseInt(
    getComputedStyle(timelineElement).paddingRight,
    10
  );
  const availableWidth = timelineWidth - paddingLeft - paddingRight;
  const totalYears = maxDate - minDate;

  const startPercent = (startYear - minDate) / totalYears;
  const endPercent = (endYear - minDate) / totalYears;

  const startPosition = Math.round(startPercent * availableWidth + paddingLeft);
  const endPosition = Math.round(endPercent * availableWidth + paddingLeft);
  const periodWidth = endPosition - startPosition;

  const periodHeight = getAvailableHeight(startYear, endYear);

  const periodBubble = document.createElement("div");
  periodBubble.className = "period-bubble";
  periodBubble.style.position = "absolute";
  periodBubble.style.left = `${startPosition}px`;
  periodBubble.style.width = `${periodWidth}px`;
  periodBubble.style.height = "30px";
  periodBubble.style.bottom = `${periodHeight}px`;

  const bubbleColor = bubbleColors[index % bubbleColors.length];
  periodBubble.style.backgroundColor = bubbleColor;
  periodBubble.textContent = `${periodTitle} (${startYear} - ${endYear})`;

  // 新增點擊事件處理器，縮放時間軸，傳遞 periodTitle
  periodBubble.addEventListener("click", function () {
    // 先重置之前選中的時期泡泡
    if (selectedBubble && selectedConnector) {
      selectedBubble.classList.remove("selected");
      selectedBubble.style.zIndex = 10;
      selectedConnector.classList.remove("selected");
      selectedConnector.style.zIndex = 5;
    }

    // 設置當前泡泡為選中狀態，改變顏色
    periodBubble.classList.add("selected");
    periodBubble.style.zIndex = 100;

    // 縮放時間軸到該時期範圍並傳遞 periodTitle
    zoomTimeline(startYear, endYear, periodTitle);

    // 更新選中的泡泡
    selectedBubble = periodBubble;
  });

  eventsContainer.appendChild(periodBubble);
  updatePeriodHeights(startYear, endYear, periodHeight);
  adjustEventsContainerHeight(false);
}

// 渲染時期泡泡，並為每個泡泡分配顏色
function renderPeriods() {
  periods.forEach((period, index) => {
    addPeriodBubble(period.StartYear, period.EndYear, period.Period, index);
  });
}

// 獲取當前年份範圍內可以使用的高度
function getAvailableHeight(startYear, endYear) {
  let maxHeight = 10;

  for (let year = startYear; year <= endYear; year++) {
    // 如果一個時期的結束年份和另一個時期的開始年份相同，不視為重疊
    if (periodHeights[year] && year !== startYear) {
      maxHeight = Math.max(maxHeight, periodHeights[year] + 40);
    }
  }

  return maxHeight;
}

// 更新指定年份範圍內的高度佔用狀態
function updatePeriodHeights(startYear, endYear, height) {
  for (let year = startYear; year < endYear; year++) {
    // 確保只更新範圍內的年份，避免重疊
    periodHeights[year] = height;
  }
}

// 添加事件到列表並實現排序和渲染
function addEventToList(year, title, content, period) {
  // 檢查是否已經存在該事件，避免重複添加
  const existingEvent = events.find(
    (event) =>
      event.year === year && event.title === title && event.content === content
  );
  if (existingEvent) {
    return;
  }

  // 將事件加入到 events 陣列
  events.push({ year, title, content, period });

  // 調用渲染函數
  sortAndRenderEventList(events);
}

// 渲染事件列表並綁定點擊事件處理
function sortAndRenderEventList(eventArray) {
  eventArray.sort((a, b) => a.year - b.year);

  const eventList = document.getElementById("event-list");
  eventList.innerHTML = "";

  eventArray.forEach((event) => {
    const listItem = document.createElement("div");
    listItem.className = "event-list-item";
    listItem.textContent = `${event.year} - ${event.title}`;

    listItem.dataset.year = event.year;
    listItem.dataset.period = event.period || "未定義";
    listItem.dataset.title = event.title;
    listItem.dataset.content = event.content;

    listItem.addEventListener("click", function () {
      const period = this.dataset.period;
      if (!period || period === "未定義") {
        return;
      }

      const periodData = periods.find((p) => p.Period === period);
      if (!periodData) {
        return;
      }

      // 縮放時間軸到對應的時期
      zoomTimeline(periodData.StartYear, periodData.EndYear);

      // 找到對應的事件泡泡和連接線，並變色
      const bubbles = document.querySelectorAll(".event-bubble");
      const connectors = document.querySelectorAll(".event-connector");
      bubbles.forEach((bubble, index) => {
        if (bubble.dataset.year === this.dataset.year) {
          // 取消之前選中的泡泡
          if (selectedBubble && selectedConnector) {
            selectedBubble.style.backgroundColor = "";
            selectedConnector.style.backgroundColor = "";
            selectedBubble.style.zIndex = 1; // 重置 z-index
          }

          // 將當前選中的泡泡和連接線變色
          bubble.style.backgroundColor = selectedColor;
          connectors[index].style.backgroundColor = selectedColor;
          bubble.style.zIndex = 10; // 提升 z-index

          // 更新選中的泡泡和連接線
          selectedBubble = bubble;
          selectedConnector = connectors[index];
        }
      });
    });

    eventList.appendChild(listItem);
  });
}

function scrollToEvent(position) {
  const timelineContainer = document.querySelector(".timeline-container");
  const scrollPosition =
    (position / 100) * timelineContainer.scrollWidth -
    timelineContainer.clientWidth / 2;
  timelineContainer.scrollTo({
    left: scrollPosition,
    behavior: "smooth",
  });
}

function resetToDefaultTimeline() {
  minDate = -10000;
  maxDate = 2023;

  const yearsRange = maxDate - minDate;
  const pixelsPerYear = Math.max(10, 1000 / yearsRange);
  const newWidth = Math.max(500, yearsRange * pixelsPerYear);

  const timelineElement = document.getElementById("timeline");
  const eventsContainer = document.getElementById("events");

  timelineElement.style.width = `${newWidth}px`;
  eventsContainer.style.width = `${newWidth}px`;

  clearTimeline(); // 清空舊的刻度和事件
  createRuler(); // 重新繪製時間刻度

  // 只渲染時期泡泡，不渲染事件泡泡
  if (periods && periods.length > 0) {
    renderPeriods(); // 渲染所有時期泡泡
  }

  adjustEventsContainerHeight(true); // 調整容器高度
}

// 頁面加載時初始化
window.onload = function () {
  loadEventsAndPeriods();
};
