function initNavigation() {

  document.querySelectorAll(".nav-btn").forEach(btn => {

    btn.addEventListener("click", () => {

      const pageName = btn.dataset.page;

      // ナビボタン切替
      document.querySelectorAll(".nav-btn")
        .forEach(nav => nav.classList.remove("active"));

      btn.classList.add("active");

      // ページ切替
      document.querySelectorAll(".page")
        .forEach(page => page.classList.remove("active"));

      document
        .getElementById(`page-${pageName}`)
        .classList.add("active");

      // ページ先頭へ
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    });

  });

}
``
