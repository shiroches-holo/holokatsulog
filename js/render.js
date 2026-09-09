let currentVideo = null;

// ✅ 統計
function updateStats(filtered) {
  let total = filtered.length;
  let watched = 0;
  let totalSec = 0;
  let watchedSec = 0;

  filtered.forEach(x => {
    totalSec += x.durationSec;

  const watchLog =
    getWatchLog(x.videoId);
  
  if (
      ["watched", "realtime", "releaseday"]
        .includes(watchLog.status)
    ) {
      watched++;
      watchedSec += x.durationSec;
    }
  });
 
  // ✅ 計算は最後 端数切り捨て
  const rate = total
    ? Math.floor((watched / total) * 1000) / 10
    : 0;

  let rateNum = rate;

  // ✅ 色
  let rateColor = "#333"; // ベース黒

  if (rateNum >= 30) rateColor = "#3b82f6"; // 青
  if (rateNum >= 60) rateColor = "#10b981"; // 緑
  if (rateNum >= 80) rateColor = "#f97316"; // オレンジ
  if (rateNum === 100) rateColor = "#c9a227"; // 金 👑

  // ✅ クラス
  let extraClass = rateNum === 100 ? "completed" : "";

  // ✅ 描画
  const isMobile = window.innerWidth <= 1000;

  document.getElementById("stats").innerHTML = `
  
    <!-- 動画本数 -->
    <div class="stat-box">
      ${isMobile
      ? `<div class="value">動画本数：${total}本</div>`
      : `
            <div class="label">動画本数</div>
            <div class="value">${total}本</div>
          `
    }
    </div>
  
    <!-- 動画時間 -->
    <div class="stat-box">
      ${isMobile
      ? `<div class="value">動画時間：${formatTotal(totalSec)}（${formatDays(totalSec)}）</div>`
      : `
            <div class="label">動画時間</div>
            <div class="value">${formatTotal(totalSec)}</div>
            <div class="sub">${formatDays(totalSec)}</div>
          `
    }
    </div>
  
    <!-- 視聴済 -->
    <div class="stat-box">
      ${isMobile
      ? `<div class="value">視聴済：${watched}本</div>`
      : `
            <div class="label">視聴済</div>
            <div class="value">${watched}本</div>
          `
    }
    </div>
  
    <!-- 視聴時間 -->
    <div class="stat-box">
      ${isMobile
      ? `<div class="value">視聴時間：${formatTotal(watchedSec)}（${formatDays(watchedSec)}）</div>`
      : `
            <div class="label">視聴時間</div>
            <div class="value">${formatTotal(watchedSec)}</div>
            <div class="sub">${formatDays(watchedSec)}</div>
          `
    }
    </div>
  
    <!-- 達成率 -->
    <div class="stat-box ${extraClass}">
      ${isMobile
      ? `
            <div class="value" style="color:${rateColor}">
              達成率：${rate}%
            </div>
            <div class="progress-bar small">
              <div class="progress" style="width:${rate}%; background:${rateColor}"></div>
            </div>
          `
      : `
            <div class="label">達成率</div>
            <div class="value" style="color:${rateColor}">
              ${rate}%
            </div>
            <div class="progress-bar">
              <div class="progress" style="width:${rate}%; background:${rateColor}"></div>
            </div>
          `
    }
    </div>  
  `;
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {

    // 状態更新
    currentType = btn.dataset.type;

    // active切替
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");

    // 再描画
    render();
  });
});

function filterByType(video) {

  if (!video) return false;

  if (currentType === "all") return true;

  if (currentType === "archive") {
    return video.videoType === "ARCHIVE";
  }

  if (currentType === "video") {
    return video.videoType === "VIDEO";
  }

  if (currentType === "short") {
    return video.videoType === "SHORT";
  }

  return true;
}

function changeWatchStatus(videoId, status) {

  const item =
    window.data.find(
      v => v.videoId === videoId
    );

  if (!item) return;

  let date = null;

  // 視聴済み
  if (status === "watched") {

    const oldLog =
      getWatchLog(videoId);

    date =
      oldLog.date ||
      new Date()
        .toISOString()
        .slice(0, 10);
  }

  // リアタイ・公開日視聴
  if (
    status === "realtime" ||
    status === "releaseday"
  ) {

    date =
      item.publishedAt
        .slice(0, 10);

  }

  saveWatchLog(
    videoId,
    {
      status,
      date
    }
  );

  document
    .querySelectorAll(".watch-menu")
    .forEach(menu => {
      menu.classList.add("hidden");
  });
  
  render();

}

function toggleWatchMenu(videoId) {

  const menu =
    document.getElementById(
      `watch-menu-${videoId}`
    );

  if (!menu) return;

  const isOpen =
    !menu.classList.contains("hidden");

  // 全部閉じる
  document
    .querySelectorAll(".watch-menu")
    .forEach(m => {
      m.classList.add("hidden");
    });

  // 元々閉じてたなら開く
  if (!isOpen) {
    menu.classList.remove("hidden");
  }

}

function openWatchModalById(videoId) {

  const item =
    window.data.find(v => v.videoId === videoId);

  if (!item) return;

  openWatchModal(item);

}

function render() {

  console.time("render");

  let filtered = window.data.filter(item => {
    return true;
  });

  console.log(filtered.length);

  console.timeEnd("render");
}
