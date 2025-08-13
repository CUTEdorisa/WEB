(function () {
  const form = document.getElementById("myForm");
  const messageEl = document.getElementById("message");
  const resetBtn = document.getElementById("resetButton");
  const iframe = document.getElementById("hidden_iframe");

  // 將表單序列化為物件
  function serializeForm(formEl) {
    const fd = new FormData(formEl);
    const obj = {};
    for (const [k, v] of fd.entries()) obj[k] = v;
    return obj;
  }

  // 下載文字檔（供 CSV 用）
  function downloadText(filename, content, mime = "text/csv;charset=utf-8") {
    // 加上 UTF-8 BOM，避免 Excel 亂碼
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // CSV 安全轉義（將 " 變成 ""，並用引號包覆）
  function csvEscape(val) {
    const s = (val ?? "").toString();
    const needQuote = /[",\n\r]/.test(s) || s.startsWith(" ") || s.endsWith(" ");
    const escaped = s.replace(/"/g, '""');
    return needQuote ? `"${escaped}"` : escaped;
  }

  // 依固定欄位輸出單列 CSV（含表頭）
  function toSingleRowCSV(record) {
    // 欄位順序與對應（請依您的 entry.* 對應調整）
    const columns = [
      { key: "entry.1956658542", label: "姓名" },
      { key: "entry.1017185803", label: "性別" },
      { key: "entry.112581059", label: "年齡" },
      { key: "entry.1904384187", label: "電話" },
      { key: "entry.1272817813", label: "喜歡顏色" },
      { key: "submittedAt",       label: "提交時間(ISO)" }
    ];

    const header = columns.map(c => csvEscape(c.label)).join(",");         // 表頭
    const row = columns.map(c => csvEscape(record[c.key] ?? "")).join(","); // 內容
    return header + "\r\n" + row + "\r\n";
  }

  // 儲存到 localStorage（累積陣列）
  function saveToLocalStorage(record) {
    const key = "formSubmissions";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(record);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  // 產生時間戳
  function ts() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  // 顯示成功 UI
  function showSuccessUI() {
    form.style.display = "none";
    messageEl.style.display = "block";
    resetBtn.style.display = "inline-block";
  }

  // onsubmit
  window.handleFormSubmit = function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // 1) 序列化 + 加上提交時間
    const data = serializeForm(form);
    const record = { ...data, submittedAt: new Date().toISOString() };

    // 2) 本機保存（如不需要可移除此呼叫）
    saveToLocalStorage(record);

    // 3) 下載 CSV（單列，含表頭）
    const csv = toSingleRowCSV(record);
    downloadText(`submission-${ts()}.csv`, csv);

    // 4) 以隱藏 iframe 送到 Google，不轉跳；完成後顯示成功訊息
    const handleLoaded = () => {
      iframe.removeEventListener("load", handleLoaded);
      showSuccessUI();
    };
    iframe.addEventListener("load", handleLoaded);
    form.submit();
  };

  // 重新填寫
  resetBtn.addEventListener("click", () => {
    form.reset();
    form.style.display = "block";
    messageEl.style.display = "none";
    resetBtn.style.display = "none";
  });
})();
