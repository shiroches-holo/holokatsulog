// ✅ 統計
function updateStats(filtered) {
  let total = filtered.length;
  let watched = 0;
  let totalSec = 0;
  let watchedSec = 0;

  filtered.forEach(x => {
    totalSec += x.durationSec;

    if (
      localStorage.getItem(
        `${currentMember.id}_${x.videoId}`
      ) === "true"
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

function render() {
  const tbody = document.querySelector("#list tbody");
  tbody.innerHTML = ""; // ←これも必要！

  const playlistCheckboxes = document.querySelectorAll("#playlistFilterArea input");

  if (playlistCheckboxes.length === 0) {
    return; // まだロード中なので描画しない
  }

  const keyword = document.getElementById("search").value.toLowerCase();
  const status = document.getElementById("filterStatus").value;
  const sort = document.getElementById("sort").value;

  let filtered = window.data.filter(item => {


    // ✅ タイプフィルタ
    if (!filterByType(item)) return false;


    // タイトル
    if (keyword && !item.title.toLowerCase().includes(keyword)) return false;

    // 再生リスト
    const checkedPlaylists = Array.from(
      document.querySelectorAll("#playlistFilterArea input:checked")
    ).map(cb => cb.value);

    if (checkedPlaylists.length === 0) return false

    if (!checkedPlaylists.includes(item.playlistName)) return false;


    // 視聴状態
    const watched = localStorage.getItem(
      `${currentMember.id}_${item.videoId}`
    ) === "true";
    if (status === "watched" && !watched) return false;
    if (status === "unwatched" && watched) return false;

    // 日付
    const from = document.getElementById("dateFrom").value;
    const to = document.getElementById("dateTo").value;
    const itemDate = new Date(item.publishedAt);

    if (from && itemDate < new Date(from)) return false;
    if (to && itemDate > new Date(to)) return false;

    // 時間フィルタ(ドロップダウン)
    const limit = document.getElementById("durationLimit").value;
    if (limit) {
      const minutes = item.durationSec / 60;
      if (minutes > Number(limit)) return false;
    }

    return true;
  });

  // ソート
  if (sort === "new") filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  if (sort === "old") filtered.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  if (sort === "title_asc") filtered.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "title_desc") filtered.sort((a, b) => b.title.localeCompare(a.title));
  if (sort === "long") filtered.sort((a, b) => b.durationSec - a.durationSec);
  if (sort === "short") filtered.sort((a, b) => a.durationSec - b.durationSec);

  // 描画
  const viewMode = getViewMode();

  const thead = document.querySelector("#list thead");
  thead.style.display = (viewMode === "card") ? "none" : "";

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.videoId;

    const checked = localStorage.getItem(
      `${currentMember.id}_${item.videoId}`
    ) === "true";

    if (viewMode === "card") {

      tr.innerHTML = `
        <td colspan="5">
          <div class="card">

            <!-- サムネ -->
            <div class="thumb">
                <img src="https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg" loading="lazy">
            </div>
            
            <div class="card-content">

            <div class="title">
              <a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank">
                ${item.title}
              </a>
            </div>
  
            <div>📅 ${formatDate(item.publishedAt)}</div>
            <div>⏱ ${formatDuration(item.durationSec)}</div>
           
            <div class="playlist-row">

              <!-- 再生リスト -->
              <div class="playlist-text">
                🎵 ${item.playlistUrl
          ? `<a href="${item.playlistUrl}" target="_blank">${item.playlistName}</a>`
          : item.playlistName
        }
              </div>
              
              <!-- 視聴済み✅ -->
              <div class="check-area">
                視聴済み <input type="checkbox" ${checked ? "checked" : ""}>
              </div>

            </div>

          </div>
        </td>
      `;

    } else {

      tr.innerHTML = `
        <td>${formatDate(item.publishedAt)}</td>
        <td>
          <a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank">
            ${item.title}
          </a>
        </td>
        <td class="time-cell">${formatDuration(item.durationSec)}</td>
        <td class="check-cell">
          <input type="checkbox" ${checked ? "checked" : ""}>
        </td>
        <td>
          ${item.playlistUrl
          ? `<a href="${item.playlistUrl}" target="_blank">${item.playlistName}</a>`
          : item.playlistName
        }
        </td>
      `;
    }

    if (checked) tr.style.background = "#e6ffe6";

    const cb = tr.querySelector("input");
    cb.addEventListener("change", () => {
      localStorage.setItem(
        `${currentMember.id}_${item.videoId}`,
        cb.checked
      );
      render();
    });

    tbody.appendChild(tr);
  });

  updateStats(filtered);
  updatePlaylistCount();

}
