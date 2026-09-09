console.log("app.js TEST 20260909-1524");

window.data = [];

const API_URL = config.api;

let currentMember = null;
let members = [];
let groupsMaster = [];
let currentType = "all"

async function loadGroups() {
  const res = await fetch(`${API_URL}?type=groups`);
  groupsMaster = await res.json();
}

async function loadMembers() {

  try {

    console.time("fetch members");
    
    const response = await fetch(`${API_URL}?type=members`);
    members = await response.json();

    console.timeEnd("fetch members");

    // ✅ groups読み込み後に呼べるようにする
    console.time("loadGroups");
    await loadGroups();
    console.timeEnd("loadGroups");
    
    console.time("buildMemberList");
    buildMemberList();
    console.timeEnd("buildMemberList");

    const lastMember = localStorage.getItem("selectedMember");
    const memberId = lastMember || members[0].memberId;

    console.time("loadMember");
    await loadMember(memberId);
    console.timeEnd("loadMember");

  } catch (err) {
    console.error(err);
  }
}

// -------------------- 共通関数 --------------------

// 再生リスト件数表示
function updatePlaylistCount() {
  const total = document.querySelectorAll("#playlistFilterArea input").length;
  const checked = document.querySelectorAll("#playlistFilterArea input:checked").length;

  document.querySelector("#playlistBox summary").textContent =
    `再生リスト選択 (${checked}/${total})`;
}

// -------------------- 描画(render) --------------------

// メーセージボックス
function showMessage(text, type = "success") {
  const el = document.getElementById("message");

  el.textContent = text;

  if (type === "error") {
    el.style.border = "2px solid #ef4444";
    el.style.color = "#ef4444";
  } else {
    el.style.border = "2px solid #10b981";
    el.style.color = "#10b981";
  }

  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2000);
}

// -------------------- 初期読み込み --------------------
document.addEventListener("DOMContentLoaded", async () => {

  document.getElementById("loading").style.display = "flex";
  
  await loadMembers();

  document.getElementById("versionText").textContent =
    `v${APP_VERSION}`;
  
  initNavigation();
  
});

// ✅ イベント
document.querySelectorAll('input[name="view"]').forEach(el => {
  el.addEventListener("change", render);
});
document.getElementById("search").addEventListener("input", render);
document.getElementById("filterStatus").addEventListener("change", render);
document.getElementById("sort").addEventListener("change", render);
document.getElementById("durationLimit").addEventListener("change", render);
document.getElementById("dateFrom").addEventListener("change", render);
document.getElementById("dateTo").addEventListener("change", render);

// 表示を全て☑
document.getElementById("checkAll").addEventListener("click", () => {
  if (!confirm("表示されている動画を全て視聴済みにします。よろしいですか？")) {
    return;
  }

  document.querySelectorAll("#list tbody tr").forEach(tr => {
    const id = tr.dataset.id;
    if (id) {
      localStorage.setItem(
        `${currentMember.memberId}_${id}`,
        true
      );
    }
  });
  render();
});

// 表示の☑を全て外す
document.getElementById("uncheckAll").addEventListener("click", () => {
  if (!confirm("表示されている動画の視聴チェックをすべて解除します。よろしいですか？")) {
    return;
  }
  document.querySelectorAll("#list tbody tr").forEach(tr => {
    const id = tr.dataset.id;
    if (id) {
      localStorage.setItem(
        `${currentMember.memberId}_${id}`,
        false
      );
    }
  });
  render();
});

// 再生リスト検索（※チェック状態は変えない）
document.getElementById("playlistSearch").addEventListener("input", () => {
  const keyword = document.getElementById("playlistSearch").value.toLowerCase();

  document.querySelectorAll("#playlistFilterArea label").forEach(label => {
    const text = label.textContent.toLowerCase();
    label.style.display = (!keyword || text.includes(keyword)) ? "block" : "none";
  });
});

// 再生リストを全てON（表示中のみ）
document.getElementById("playlistAll").onclick = () => {
  document.querySelectorAll("#playlistFilterArea label").forEach(label => {
    if (label.style.display === "none") return;
    label.querySelector("input").checked = true;
  });
  render();
};

// 再生リストを全てOFF
document.getElementById("playlistClear").onclick = () => {
  document.querySelectorAll("#playlistFilterArea label").forEach(label => {
    if (label.style.display === "none") return;
    label.querySelector("input").checked = false;
  });
  render();
};

// 条件リセット
document.getElementById("resetAll").addEventListener("click", () => {

  // 検索
  document.getElementById("search").value = "";
  document.getElementById("playlistSearch").value = "";

  // 状態
  document.getElementById("filterStatus").value = "all";

  // ソート
  document.getElementById("sort").value = "new";

  // 日付
  const dateFrom = document.getElementById("dateFrom");
  const dateTo = document.getElementById("dateTo");

  dateFrom.value = "";
  dateTo.value = "";

  dateFrom.type = "text";
  dateTo.type = "text";

  // 時間
  document.getElementById("durationLimit").value = "";

  // ✅ 再生リスト表示を全部復活
  document.querySelectorAll("#playlistFilterArea label").forEach(label => {
    label.style.display = "block";
  });

  // ✅ 再生リスト全部チェックON
  document.querySelectorAll("#playlistFilterArea input").forEach(cb => {
    cb.checked = true;
  });

  /*
  document.querySelector("#playlistBox summary").textContent =
    `再生リスト選択 (${set.size})`;
  */

  updatePlaylistCount();

  render();
});

// スクロール
document.getElementById("toTop").onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
document.getElementById("toBottom").onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

render();

/* --- データ移行 --- */
document.getElementById("exportBtn").onclick = () => {
  const obj = {};
  Object.keys(localStorage).forEach(k => obj[k] = localStorage.getItem(k));

  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.json";
  a.click();

  showMessage("✅ エクスポート完了");
};

document.getElementById("importBtn").onclick = () => {
  document.getElementById("importFile").click();
};

// インポート
document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = ev => {
    try {
      const obj = JSON.parse(ev.target.result);

      Object.keys(obj).forEach(k => {
        localStorage.setItem(k, String(obj[k]));
      });

      showMessage(`✅ インポート成功！（${Object.keys(obj).length}件）`);

      render();

    } catch (err) {
      showMessage("❌ インポート失敗（形式エラー）", "red");
    }
  };

  reader.readAsText(file);
});

// ヘルプ
const modal = document.getElementById("helpModal");
// const helpBtn = document.getElementById("helpBtn");
const closeHelp = document.getElementById("closeHelp");

const memberModal =
  document.getElementById(
    "memberModal"
  );

document
  .getElementById(
    "memberSelectBtn"
  )
  .addEventListener(
    "click",
    () => {

      memberModal.style.display =
        "block";

    }
  );

document
  .getElementById(
    "closeMemberModal"
  )
  .addEventListener(
    "click",
    () => {

      memberModal.style.display =
        "none";

    }
  );

// 開く
/*
helpBtn.addEventListener("click", () => {
  modal.style.display = "block";
});
*/

// 閉じる
closeHelp.addEventListener("click", () => {
  modal.style.display = "none";
});

// 背景クリック
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// タブ
document.querySelectorAll(".tab-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".tab-buttons button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    document.querySelectorAll(".tab-panel").forEach(p => {
      p.style.display = "none";
    });

    document.getElementById(btn.dataset.tab).style.display = "block";
  });
});


function createPlaylists() {

  const area =
    document.getElementById(
      "playlistFilterArea"
    );

  const playlistCount = {};

  window.data.forEach(item => {

    playlistCount[item.playlistName] =
      (playlistCount[item.playlistName] || 0) + 1;

  });

  const set =
    new Set(
      window.data.map(
        x => x.playlistName
      )
    );

  area.innerHTML = "";

  set.forEach(p => {

    const label =
      document.createElement("label");

    label.innerHTML = `
      <input
        type="checkbox"
        value="${p}"
        checked
      >
      ${p} (${playlistCount[p]})
    `;

    label
      .querySelector("input")
      .addEventListener(
        "change",
        render
      );

    area.appendChild(label);

  });

  updatePlaylistCount();
}

function applyMemberTheme() {

  if (!currentMember) return;

  const header =
    document.getElementById(
      "appHeader"
    );

  header.style.background =
    `linear-gradient(
      135deg,
      ${currentMember.color1},
      ${currentMember.color2},
      ${currentMember.color3}
    )`;


  // ✅ ホロメンの名前
  document.getElementById("memberName").innerHTML =
    `${member.name} 
     <span class="fanmark">${member.fanMark}</span>
     ${getStatusLabel(member.memberStatus)}`;


  // ✅ ファンネーム
  /*
  document.getElementById("memberFanName").textContent =
    currentMember.fanName || "";
  */

  // ✅ youtubeアイコン
  document.getElementById("memberIcon").src =
    currentMember.channelIconUrl;

}

async function loadMember(memberId) {

  try {

    // ✅ 仮で色先に変える（重要）
    const member = members.find(m => String(m.memberId) === memberId);
    
    // ✅ 契約解除は非表示
    if (!member || member.memberStatus === "terminated") {
      return;
    }

    const dataId = member.dataId;

    if (member) {
      const root = document.documentElement;
      root.style.setProperty("--member-color1", member.color1);
      root.style.setProperty("--member-color2", member.color2);
      root.style.setProperty("--member-color3", member.color3);

      applyMemberPreview(member); // ✅ ここ追加（神ポイント）

    }

    console.time("fetch member");
    
    const response = await fetch(`${API_URL}?member=${memberId}`);
    const json = await response.json();

    console.timeEnd("fetch member");
    
    // console.log(json);
    
    currentMember = json.member;
    window.data = json.videos;

    applyMemberTheme();
    createPlaylists();
    render();

  }
  catch (err) {

    console.error(err);

    showMessage(
      "読込失敗",
      "error"
    );

  }
  finally {

    document.getElementById(
      "loading"
    ).style.display = "none";

  }
}

function buildMemberList() {

  const favArea = document.getElementById("favoriteMembers");
  const allArea = document.getElementById("allMembers");

  favArea.innerHTML = "";
  allArea.innerHTML = "";

  // ✅ グループ分け
  const groups = {};

  members.forEach(member => {

    if (member.memberStatus === "terminated") return;

    const groupList = (member.group || "その他").split("|");

    groupList.forEach(g => {

      const groupName = g.trim();

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(member);

    });
  });

  // ✅ お気に入り
  members.forEach(member => {

    const isFav = localStorage.getItem("fav_" + member.memberId) === "true";
    if (!isFav) return;

    const div = createMemberCard(member);
    favArea.appendChild(div);

  });

  // ✅ orderマップ
  const groupOrderMap = Object.fromEntries(
    groupsMaster.map(g => [g.group, Number(g.groupSortOrder)])
  );

  // ✅ ソートして描画（ここが唯一）
  Object.keys(groups)
    .sort((a, b) =>
      (groupOrderMap[a] ?? 999) - (groupOrderMap[b] ?? 999)
    )
    .forEach(groupName => {

      const section = document.createElement("div");
      section.className = "group-section";

      section.innerHTML = `
        <h3>${groupName}</h3>
        <div class="group-row"></div>
      `;

      const row = section.querySelector(".group-row");

      groups[groupName].forEach(member => {

        const div = createMemberCard(member);
        row.appendChild(div);

      });

      allArea.appendChild(section);

      // console.log(groupOrderMap);
      // console.log(Object.keys(groups));
      // console.log(Object.keys(groupOrderMap));

    });

  // ✅ お気に入り表示
  const favTitle = document.getElementById("favTitle");
  favTitle.style.display = favArea.children.length === 0 ? "none" : "block";
}

function createMemberCard(member) {

  const div = document.createElement("div");
  div.className = "member-card";

  div.dataset.id = member.memberId;

  const isFav =
    localStorage.getItem("fav_" + member.memberId) === "true";

  if (member.memberId === currentMember?.memberId) {
    div.classList.add("selected");
  }

  div.innerHTML = `
    <button class="favorite-btn">
      ${isFav ? "⭐" : "☆"}
    </button>

    <img src="${member.channelIconUrl}">

    <div class="member-name">
      ${member.name}${getStatusLabel(member.memberStatus)}
    </div>
  `;

  // ✅ クリック
  div.onclick = () => {
    localStorage.setItem("selectedMember", member.memberId);
    loadMember(member.memberId);
    document.getElementById("memberModal").style.display = "none";
  };

  // ✅ ⭐
  const btn = div.querySelector(".favorite-btn");
  if (btn) {
    btn.onclick = (e) => {
      e.stopPropagation();

      const key = "fav_" + member.memberId;
      const current = localStorage.getItem(key) === "true";

      localStorage.setItem(key, !current);
      buildMemberList();
    };
  }

  return div;
}

document.getElementById("memberSearch").addEventListener("input", e => {

  const keyword = normalize(e.target.value.trim());

  // ✅ 空なら元に戻す
  if (!keyword) {
    buildMemberList();
    return;
  }

  // ✅ 表示制御だけ

  document.querySelectorAll(".member-card").forEach(card => {

    const memberId = card.dataset.id;

    const member = members.find(m => String(m.memberId) === memberId);
    if (!member) return;

    // ✅ 検索対象まとめる
    const targets = [
      member.name,
      member.reading,
      member.romanizedName,
      ...(member.aliases ? member.aliases.split("|") : [])
    ]
      .filter(Boolean)
      .map(v => normalize(v));

    const isMatch = targets.some(t => t.includes(keyword));

    card.style.display = isMatch ? "block" : "none";
  });

  // ✅ グループ制御
  document.querySelectorAll(".group-section").forEach(section => {

    const anyVisible = Array.from(
      section.querySelectorAll(".member-card")
    ).some(card => card.style.display !== "none");

    section.style.display = anyVisible ? "block" : "none";
  });

});

function applyMemberPreview(member) {

  // 背景
  const root = document.documentElement;
  root.style.setProperty("--member-color1", member.color1);
  root.style.setProperty("--member-color2", member.color2);
  root.style.setProperty("--member-color3", member.color3);

  // 名前先出し
  document.getElementById("memberName").innerHTML =
    `${member.name} 
     <span class="fanmark">${member.fanMark}</span>
     ${getStatusLabel(member.memberStatus)}`;

  /*
  // ファンネーム
  document.getElementById("memberFanName").textContent =
    member.fanName || "";
  */

  // youtubeアイコン
  document.getElementById("memberIcon").src =
    member.channelIconUrl;
}

function applyMemberTheme() {

  if (!currentMember) return;

  const header = document.getElementById("appHeader");

  header.style.background = `
    linear-gradient(
      135deg,
      ${currentMember.color1},
      ${currentMember.color2},
      ${currentMember.color3}
    )
  `;

  // ✅ ここ追加（超重要）
  const root = document.documentElement;
  root.style.setProperty("--member-color1", currentMember.color1);
  root.style.setProperty("--member-color2", currentMember.color2);
  root.style.setProperty("--member-color3", currentMember.color3);

  // ホロメン名前
  document.getElementById("memberName").innerHTML =
    `${currentMember.name}
   <span class="fanmark">${currentMember.fanMark}</span>
   ${getStatusLabel(currentMember.memberStatus)}`;

  /*
  // ファンネーム
  document.getElementById("memberFanName").textContent =
    currentMember.fanName || "";
  */

  // youtubeアイコン
  document.getElementById("memberIcon").src =
    currentMember.channelIconUrl;
}

// 文字列正規化（検索用）
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFKC") // 全角→半角など統一
    .replace(/[ァ-ン]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 0x60)
    ); // カタカナ→ひらがな
}

// 開く
document.getElementById("filterOpenBtn").onclick = () => {
  document.getElementById("filterModal").style.display = "block";
};

// 閉じる
document.getElementById("closeFilterModal").onclick = () => {
  document.getElementById("filterModal").style.display = "none";
};

// 背景クリックで閉じる
document.getElementById("filterModal").addEventListener("click", e => {
  if (e.target.id === "filterModal") {
    e.currentTarget.style.display = "none";
  }
});

// 動画の視聴状況モーダル
document

  .addEventListener(

    "click",

    e => {

      if (

        e.target.classList

          .contains(

            "watch-status-btn"

          )

      ) {

        const videoId =

          e.target.dataset.videoid;


        openWatchLogModal(

          videoId

        );

      }

    }
  );

