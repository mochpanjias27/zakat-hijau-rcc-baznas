/* Peta Karbon Zakat Hijau — logika prototipe (vanilla JS + Leaflet + Chart.js) */
(function () {
  "use strict";

  const A = window.ASPEK, P = window.PROGRAMS;
  const aspekById = Object.fromEntries(A.map((a) => [a.id, a]));
  const GREEN = "#1E7B3C", GREEN_DARK = "#0B5B2E", RED = "#E30613", GOLD = "#F4C21B";

  // ---------- Format ----------
  const nf0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
  function rp(n) {
    if (Math.abs(n) >= 1e12) return "Rp" + nf2.format(n / 1e12) + " T";
    if (Math.abs(n) >= 1e9) return "Rp" + nf2.format(n / 1e9) + " M";
    if (Math.abs(n) >= 1e6) return "Rp" + nf1.format(n / 1e6) + " jt";
    return "Rp" + nf0.format(n);
  }
  const rpFull = (n) => "Rp" + nf0.format(Math.round(n));
  const pct = (n) => nf1.format(n * 100) + "%";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  Chart.defaults.font.family = "Poppins, system-ui, sans-serif";
  Chart.defaults.font.size = 11.5;
  Chart.defaults.color = "#5d6862";
  Chart.defaults.plugins.legend.labels.boxWidth = 12;

  // ---------- Agregasi ----------
  function aggregateByAspek(list) {
    const m = Object.fromEntries(A.map((a) => [a.id, { dana: 0, tco2e: 0, mustahik: 0, wel: 0, n: 0 }]));
    list.forEach((p) => {
      const g = m[p.aspek];
      g.dana += p.dana; g.tco2e += p.tco2e; g.mustahik += p.mustahik; g.wel += p.mustahik * p.ikb; g.n++;
    });
    return m;
  }
  function aggregateByProv(list) {
    const m = {};
    list.forEach((p) => {
      const g = (m[p.provinsi] ||= { provinsi: p.provinsi, dana: 0, tco2e: 0, mustahik: 0, n: 0 });
      g.dana += p.dana; g.tco2e += p.tco2e; g.mustahik += p.mustahik; g.n++;
    });
    return Object.values(m);
  }
  const sum = (arr, k) => arr.reduce((s, x) => s + x[k], 0);

  // ---------- Tabs ----------
  const tabs = document.querySelectorAll(".tab");
  const initialized = {};
  function showTab(id, scroll = true) {
    if (!document.getElementById("panel-" + id)) id = "ringkasan";
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === id));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + id));
    document.getElementById("tabs").classList.remove("open");
    if (!initialized[id]) { initialized[id] = true; INIT[id] && INIT[id](); }
    if (id === "peta" && map) setTimeout(() => map.invalidateSize(), 50);
    if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }
  tabs.forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
  document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.goto)));
  document.querySelector(".brand").addEventListener("click", (e) => { e.preventDefault(); showTab("ringkasan"); });
  document.getElementById("menuBtn").addEventListener("click", () => document.getElementById("tabs").classList.toggle("open"));

  // ---------- Ringkasan ----------
  function kpiCard(label, value, sub, cls = "") {
    return `<div class="kpi ${cls}"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>`;
  }
  // animasi angka naik (count-up)
  function countUp(el, target, fmt, dur = 1400) {
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = fmt(target); return; }
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(target * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function startRotator() {
    const el = document.getElementById("rotator");
    if (!el) return;
    const words = ["bumi yang lebih hijau", "udara yang lebih bersih", "mustahik yang mandiri", "masa depan rendah karbon"];
    let i = 0;
    setInterval(() => {
      el.classList.add("out");
      setTimeout(() => { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove("out"); }, 350);
    }, 3200);
  }
  function initRingkasan() {
    const totDana = sum(P, "dana"), totCo2 = sum(P, "tco2e"), totM = sum(P, "mustahik");
    const nProv = new Set(P.map((p) => p.provinsi)).size;
    document.getElementById("kpis").innerHTML =
      kpiCard("Total dana Zakat Hijau", `<span data-cu="dana">${rp(0)}</span>`, "2022–2026") +
      kpiCard("Emisi dicegah", `<span data-cu="co2">0</span> tCO₂e`, "per tahun", "gold") +
      kpiCard("Program", `<span data-cu="prog">0</span>`, `di ${nProv} provinsi`) +
      kpiCard("Penerima manfaat", `<span data-cu="m">0</span> jiwa`, "mustahik") +
      kpiCard("Biaya karbon rata-rata", `<span data-cu="eff">${rp(0)}</span>`, "per tCO₂e", "red");
    const q = (k) => document.querySelector(`[data-cu="${k}"]`);
    countUp(q("dana"), totDana, rp);
    countUp(q("co2"), totCo2, (v) => nf0.format(v));
    countUp(q("prog"), P.length, (v) => nf0.format(v));
    countUp(q("m"), totM, (v) => nf0.format(v));
    countUp(q("eff"), totDana / totCo2, rp);
    countUp(document.getElementById("chipProg"), P.length, (v) => nf0.format(v), 1800);
    countUp(document.getElementById("chipCo2"), totCo2, (v) => nf0.format(v), 1800);
    startRotator();

    const agg = aggregateByAspek(P);
    const labels = A.map((a) => a.nama), colors = A.map((a) => a.warna);

    new Chart(document.getElementById("chartEmisiAspek"), {
      type: "bar",
      data: { labels, datasets: [{ data: A.map((a) => +agg[a.id].tco2e.toFixed(0)), backgroundColor: colors, borderRadius: 5 }] },
      options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => nf0.format(c.raw) + " tCO₂e" } } },
        scales: { x: { ticks: { callback: (v) => nf0.format(v) } } } },
    });
    new Chart(document.getElementById("chartDanaAspek"), {
      type: "doughnut",
      data: { labels, datasets: [{ data: A.map((a) => agg[a.id].dana), backgroundColor: colors, borderColor: "#fff", borderWidth: 2 }] },
      options: { maintainAspectRatio: false, cutout: "58%", plugins: { legend: { position: "right" },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${rp(c.raw)} (${pct(c.raw / totDana)})` } } } },
    });
    const prov = aggregateByProv(P).sort((a, b) => b.tco2e - a.tco2e).slice(0, 10);
    new Chart(document.getElementById("chartProvinsi"), {
      type: "bar",
      data: { labels: prov.map((p) => p.provinsi), datasets: [{ data: prov.map((p) => +p.tco2e.toFixed(0)), backgroundColor: GREEN, borderRadius: 5 }] },
      options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => nf0.format(c.raw) + " tCO₂e" } } },
        scales: { x: { ticks: { callback: (v) => nf0.format(v) } } } },
    });
    const eff = A.map((a) => ({ a, v: agg[a.id].tco2e > 0 ? agg[a.id].dana / agg[a.id].tco2e : 0 })).filter((x) => x.v > 0).sort((x, y) => x.v - y.v);
    new Chart(document.getElementById("chartEfisiensi"), {
      type: "bar",
      data: { labels: eff.map((x) => x.a.nama), datasets: [{ data: eff.map((x) => Math.round(x.v)), backgroundColor: eff.map((x) => x.a.warna), borderRadius: 5 }] },
      options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => rp(c.raw) + " per tCO₂e" } } },
        scales: { x: { type: "logarithmic", ticks: { maxRotation: 0, callback: (v) => { const l = Math.log10(v); return Number.isInteger(l) ? rp(v) : ""; } } } } },
    });
  }

  // ---------- Peta ----------
  let map, layer, legendCtl;
  const fState = { tahun: "", pelaksana: "", ukuran: "tco2e", aspek: new Set(A.map((a) => a.id)) };
  function filtered() {
    return P.filter((p) => fState.aspek.has(p.aspek) && (!fState.tahun || p.tahun == fState.tahun) && (!fState.pelaksana || p.pelaksana === fState.pelaksana));
  }
  function initPeta() {
    const years = [...new Set(P.map((p) => p.tahun))].sort();
    const fT = document.getElementById("fTahun"), fP = document.getElementById("fPelaksana"), fU = document.getElementById("fUkuran");
    years.forEach((y) => fT.insertAdjacentHTML("beforeend", `<option>${y}</option>`));
    window.PELAKSANA.forEach((x) => fP.insertAdjacentHTML("beforeend", `<option>${esc(x)}</option>`));
    document.getElementById("fAspek").innerHTML = A.map((a) =>
      `<label class="aspek-item"><input type="checkbox" value="${a.id}" checked /><span class="dot" style="background:${a.warna}"></span>${esc(a.nama)}</label>`).join("");
    fT.onchange = () => { fState.tahun = fT.value; renderMap(); };
    fP.onchange = () => { fState.pelaksana = fP.value; renderMap(); };
    fU.onchange = () => { fState.ukuran = fU.value; renderMap(); };
    document.querySelectorAll("#fAspek input").forEach((cb) => cb.onchange = () => {
      cb.checked ? fState.aspek.add(cb.value) : fState.aspek.delete(cb.value); renderMap();
    });

    map = L.map("map", { zoomControl: true, scrollWheelZoom: true }).setView([-2.3, 118], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
    legendCtl = L.control({ position: "bottomleft" });
    legendCtl.onAdd = () => {
      const d = L.DomUtil.create("div", "legend");
      d.innerHTML = "<b>Aspek</b><br>" + A.map((a) => `<i style="background:${a.warna}"></i>${esc(a.nama)}`).join("<br>");
      return d;
    };
    legendCtl.addTo(map);
    renderMap();
  }
  function renderMap() {
    const list = filtered();
    layer.clearLayers();
    const key = fState.ukuran;
    const max = Math.max(1, ...list.map((p) => p[key]));
    list.forEach((p) => {
      const a = aspekById[p.aspek];
      const r = 4 + 20 * Math.sqrt(p[key] / max);
      L.circleMarker([p.lat, p.lng], { radius: r, color: "#fff", weight: 1, fillColor: a.warna, fillOpacity: 0.78 })
        .bindPopup(`<div class="popup"><span class="tag" style="background:${a.warna}">${esc(a.nama)}</span>
          <h4>${esc(p.nama)}</h4>
          <table>
            <tr><td>ID</td><td><b>${p.id}</b></td></tr>
            <tr><td>Pelaksana</td><td>${esc(p.pelaksana)}</td></tr>
            <tr><td>Tahun</td><td>${p.tahun} · ${p.status}</td></tr>
            <tr><td>Dana</td><td><b>${rp(p.dana)}</b></td></tr>
            <tr><td>Aktivitas</td><td>${nf0.format(p.qty)} ${esc(p.unit)}</td></tr>
            <tr><td>Emisi dicegah</td><td><b>${nf1.format(p.tco2e)} tCO₂e/thn</b></td></tr>
            <tr><td>Biaya karbon</td><td>${rp(p.dana / Math.max(p.tco2e, 0.1))}/tCO₂e</td></tr>
            <tr><td>Mustahik</td><td>${nf0.format(p.mustahik)} jiwa · IKB ${nf2.format(p.ikb)}</td></tr>
          </table></div>`)
        .addTo(layer);
    });
    const d = sum(list, "dana"), c = sum(list, "tco2e"), m = sum(list, "mustahik");
    document.getElementById("mapSum").innerHTML =
      `<div><b>${nf0.format(list.length)}</b> program</div><div>Dana <b>${rp(d)}</b></div>
       <div>Emisi dicegah <b>${nf0.format(c)} tCO₂e/thn</b></div><div>Mustahik <b>${nf0.format(m)}</b> jiwa</div>`;
    const prov = aggregateByProv(list).sort((a, b) => b.tco2e - a.tco2e);
    document.getElementById("tblProv").innerHTML =
      `<thead><tr><th>Provinsi</th><th class="num">Program</th><th class="num">Dana</th><th class="num">tCO₂e/thn</th><th class="num">Rp per tCO₂e</th><th class="num">Mustahik</th></tr></thead><tbody>` +
      prov.map((g) => `<tr><td>${esc(g.provinsi)}</td><td class="num">${g.n}</td><td class="num">${rp(g.dana)}</td><td class="num">${nf0.format(g.tco2e)}</td><td class="num">${rp(g.dana / Math.max(g.tco2e, 0.1))}</td><td class="num">${nf0.format(g.mustahik)}</td></tr>`).join("") +
      `</tbody><tfoot><tr><td>Total</td><td class="num">${list.length}</td><td class="num">${rp(d)}</td><td class="num">${nf0.format(c)}</td><td class="num">${c ? rp(d / c) : "-"}</td><td class="num">${nf0.format(m)}</td></tr></tfoot>`;
  }

  // ---------- Portofolio (optimasi) ----------
  const AGG = aggregateByAspek(P);
  const TOT_DANA = sum(P, "dana");
  const coef = A.map((a) => {
    const g = AGG[a.id];
    return { a, c: g.tco2e / g.dana, w: g.wel / g.dana, mPer: g.mustahik / g.dana, share: g.dana / TOT_DANA, r: a.risk };
  });
  const maxC = Math.max(...coef.map((x) => x.c)), maxW = Math.max(...coef.map((x) => x.w));

  function optimize(B, lambda, gamma, minPct, maxPct) {
    const L0 = minPct * B, U = maxPct * B;
    const items = coef.map((x) => {
      const s = (lambda * (x.c / maxC) + (1 - lambda) * (x.w / maxW)) * (1 - gamma * x.r);
      const K = Math.max(x.share * B, 0.06 * B);
      // kalibrasi: pada komposisi saat ini, manfaat model = manfaat teramati
      const cur = x.share * B, phi = cur / (K * (1 - Math.exp(-cur / K)));
      return { ...x, s: Math.max(s * phi, 1e-9), K, phi };
    });
    const alloc = (mu) => items.map((it) => Math.min(U, Math.max(L0, it.s > mu ? it.K * Math.log(it.s / mu) : 0)));
    let lo = 1e-12, hi = Math.max(...items.map((it) => it.s));
    for (let k = 0; k < 200; k++) {
      const mid = Math.sqrt(lo * hi);
      const tot = alloc(mid).reduce((s, v) => s + v, 0);
      if (tot > B) lo = mid; else hi = mid;
    }
    let x = alloc(hi);
    // koreksi kecil agar total tepat B (sisa disebar ke aspek yang belum mentok batas atas)
    let gap = B - x.reduce((s, v) => s + v, 0);
    const free = x.map((v, i) => (v < U - 1 ? i : -1)).filter((i) => i >= 0);
    if (Math.abs(gap) > 1 && free.length) free.forEach((i) => (x[i] += gap / free.length));
    return { items, x };
  }
  function evaluate(items, x) {
    let E = 0, W = 0, M = 0;
    items.forEach((it, i) => {
      const f = it.phi * it.K * (1 - Math.exp(-x[i] / it.K));
      E += it.c * f; W += it.w * f; M += it.mPer * f;
    });
    return { E, W, M };
  }

  let chAlok, chPareto;
  function readParams() {
    const budget = Math.max(1, +document.getElementById("pBudget").value || 1) * 1e9;
    const amil = Math.min(12.5, Math.max(0, +document.getElementById("pAmil").value || 0)) / 100;
    const lambda = +document.getElementById("pLambda").value / 100;
    const gamma = +document.getElementById("pGamma").value / 100;
    let minPct = Math.max(0, +document.getElementById("pMin").value || 0) / 100;
    const maxPct = Math.min(1, Math.max(0.12, (+document.getElementById("pMax").value || 30) / 100));
    if (minPct * A.length > 1) minPct = 1 / A.length;
    return { B: budget * (1 - amil), budget, amil, lambda, gamma, minPct, maxPct };
  }
  function runOpt() {
    const pr = readParams();
    document.getElementById("pLambdaVal").textContent = Math.round(pr.lambda * 100) + "% emisi";
    document.getElementById("pGammaVal").textContent = Math.round(pr.gamma * 100) + "%";
    const { items, x } = optimize(pr.B, pr.lambda, pr.gamma, pr.minPct, pr.maxPct);
    const cur = items.map((it) => it.share * pr.B);
    const eOpt = evaluate(items, x), eCur = evaluate(items, cur);
    const dE = eOpt.E / eCur.E - 1, dM = eOpt.M / eCur.M - 1;

    document.getElementById("optKpis").innerHTML =
      kpiCard("Dana tersalurkan (setelah hak amil)", rp(pr.B), `dari ${rp(pr.budget)}`) +
      kpiCard("Proyeksi emisi dicegah", nf0.format(eOpt.E) + " tCO₂e",
        `<span class="${dE >= 0 ? "up" : "down"}">${dE >= 0 ? "▲" : "▼"} ${pct(Math.abs(dE))}</span> vs komposisi saat ini`, "gold") +
      kpiCard("Proyeksi penerima manfaat", nf0.format(eOpt.M) + " jiwa",
        `<span class="${dM >= 0 ? "up" : "down"}">${dM >= 0 ? "▲" : "▼"} ${pct(Math.abs(dM))}</span> vs komposisi saat ini`);

    const labels = A.map((a) => a.nama);
    const dsCur = cur.map((v) => +(v / 1e9).toFixed(3)), dsOpt = x.map((v) => +(v / 1e9).toFixed(3));
    if (!chAlok) {
      chAlok = new Chart(document.getElementById("chartAlok"), {
        type: "bar",
        data: { labels, datasets: [
          { label: "Saat ini", data: dsCur, backgroundColor: "#B9C6BD", borderRadius: 4 },
          { label: "Rekomendasi", data: dsOpt, backgroundColor: GREEN, borderRadius: 4 } ] },
        options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { position: "top" },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: Rp${nf2.format(c.raw)} M` } } },
          scales: { x: { ticks: { callback: (v) => "Rp" + nf1.format(v) + " M" } } } },
      });
    } else {
      chAlok.data.datasets[0].data = dsCur; chAlok.data.datasets[1].data = dsOpt; chAlok.update();
    }

    // Pareto front
    const front = [];
    for (let l = 0; l <= 20; l++) {
      const r = optimize(pr.B, l / 20, pr.gamma, pr.minPct, pr.maxPct);
      const e = evaluate(r.items, r.x);
      front.push({ x: +e.E.toFixed(1), y: Math.round(e.M), l: l / 20 });
    }
    const curPt = [{ x: +eCur.E.toFixed(1), y: Math.round(eCur.M) }];
    const selPt = [{ x: +eOpt.E.toFixed(1), y: Math.round(eOpt.M) }];
    const pData = [
      { label: "Pareto front", data: front, showLine: true, borderColor: GREEN, backgroundColor: GREEN, pointRadius: 3, tension: 0.2 },
      { label: "Rekomendasi terpilih", data: selPt, backgroundColor: RED, borderColor: RED, pointRadius: 8, pointStyle: "rectRot" },
      { label: "Komposisi saat ini", data: curPt, backgroundColor: GOLD, borderColor: "#b38a00", pointRadius: 7 },
    ];
    if (!chPareto) {
      chPareto = new Chart(document.getElementById("chartPareto"), {
        type: "scatter", data: { datasets: pData },
        options: { maintainAspectRatio: false, plugins: { legend: { position: "top" },
          tooltip: { callbacks: { label: (c) => {
            const lam = c.raw.l !== undefined ? ` (bobot emisi ${Math.round(c.raw.l * 100)}%)` : "";
            return `${c.dataset.label}${lam}: ${nf0.format(c.raw.x)} tCO₂e · ${nf0.format(c.raw.y)} jiwa`; } } } },
          scales: { x: { title: { display: true, text: "Emisi dicegah (tCO₂e/thn)" }, ticks: { callback: (v) => nf0.format(v) } },
                    y: { title: { display: true, text: "Penerima manfaat (jiwa)" }, ticks: { callback: (v) => nf0.format(v) } } } },
      });
    } else { chPareto.data.datasets = pData; chPareto.update(); }

    // Tabel
    let rows = "", tC = 0, tO = 0, tE = 0;
    items.forEach((it, i) => {
      const f = it.phi * it.K * (1 - Math.exp(-x[i] / it.K)), e = it.c * f;
      const delta = x[i] - cur[i];
      tC += cur[i]; tO += x[i]; tE += e;
      rows += `<tr><td><span class="chip"><span class="dot" style="background:${it.a.warna}"></span>${esc(it.a.nama)}</span></td>
        <td class="num">${rp(cur[i])}</td><td class="num">${pct(cur[i] / pr.B)}</td>
        <td class="num"><b>${rp(x[i])}</b></td><td class="num"><b>${pct(x[i] / pr.B)}</b></td>
        <td class="num ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "+" : "−"}${rp(Math.abs(delta))}</td>
        <td class="num">${nf0.format(e)}</td><td class="num">${rp(1 / it.c)}</td><td class="num">${nf2.format(it.r)}</td></tr>`;
    });
    document.getElementById("tblPort").innerHTML =
      `<thead><tr><th>Aspek</th><th class="num">Saat ini</th><th class="num">%</th><th class="num">Rekomendasi</th><th class="num">%</th><th class="num">Perubahan</th><th class="num">tCO₂e/thn</th><th class="num">Rp per tCO₂e</th><th class="num">Risiko</th></tr></thead>
       <tbody>${rows}</tbody><tfoot><tr><td>Total</td><td class="num">${rp(tC)}</td><td class="num">100%</td><td class="num">${rp(tO)}</td><td class="num">100%</td><td></td><td class="num">${nf0.format(tE)}</td><td></td><td></td></tr></tfoot>`;
  }
  function initPortofolio() {
    document.getElementById("pBudget").value = Math.round(TOT_DANA / 1e9);
    ["pBudget", "pAmil", "pMin", "pMax"].forEach((id) => document.getElementById(id).addEventListener("change", runOpt));
    ["pLambda", "pGamma"].forEach((id) => document.getElementById(id).addEventListener("input", runOpt));
    document.getElementById("btnOpt").addEventListener("click", runOpt);
    runOpt();
  }

  // ---------- Data ----------
  let sortKey = "id", sortDir = 1;
  const COLS = [
    ["id", "ID"], ["nama", "Nama program"], ["aspek", "Aspek"], ["provinsi", "Provinsi"], ["tahun", "Tahun", 1],
    ["pelaksana", "Pelaksana"], ["dana", "Dana", 1], ["qty", "Aktivitas", 1], ["tco2e", "tCO₂e/thn", 1],
    ["mustahik", "Mustahik", 1], ["ikb", "IKB", 1], ["status", "Status"],
  ];
  function dataRows() {
    const q = document.getElementById("qSearch").value.trim().toLowerCase();
    const as = document.getElementById("qAspek").value;
    return P.filter((p) => (!as || p.aspek === as) && (!q || (p.nama + " " + p.provinsi + " " + p.id).toLowerCase().includes(q)))
      .sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : a[sortKey] < b[sortKey] ? -1 : 0) * sortDir);
  }
  function renderData() {
    const rows = dataRows();
    document.getElementById("qCount").textContent = `${rows.length} dari ${P.length} program`;
    document.getElementById("tblData").innerHTML =
      `<thead><tr>${COLS.map(([k, t, n]) => `<th data-k="${k}" class="${n ? "num" : ""}">${t}</th>`).join("")}</tr></thead><tbody>` +
      rows.map((p) => { const a = aspekById[p.aspek]; return `<tr><td>${p.id}</td><td>${esc(p.nama)}</td>
        <td><span class="chip"><span class="dot" style="background:${a.warna}"></span>${esc(a.nama)}</span></td>
        <td>${esc(p.provinsi)}</td><td class="num">${p.tahun}</td><td>${esc(p.pelaksana)}</td><td class="num">${rp(p.dana)}</td>
        <td class="num">${nf0.format(p.qty)} <span class="muted small">${esc(p.unit)}</span></td><td class="num">${nf1.format(p.tco2e)}</td>
        <td class="num">${nf0.format(p.mustahik)}</td><td class="num">${nf2.format(p.ikb)}</td><td>${p.status}</td></tr>`; }).join("") + "</tbody>";
    document.querySelectorAll("#tblData th").forEach((th) => th.onclick = () => {
      const k = th.dataset.k; sortDir = sortKey === k ? -sortDir : 1; sortKey = k; renderData();
    });
  }
  function initData() {
    const sel = document.getElementById("qAspek");
    A.forEach((a) => sel.insertAdjacentHTML("beforeend", `<option value="${a.id}">${esc(a.nama)}</option>`));
    document.getElementById("qSearch").addEventListener("input", renderData);
    sel.addEventListener("change", renderData);
    document.getElementById("btnCsv").addEventListener("click", () => {
      const head = ["id", "nama", "aspek", "provinsi", "lat", "lng", "tahun", "pelaksana", "dana_rp", "aktivitas", "unit", "tco2e_per_tahun", "mustahik", "ikb", "status"];
      const lines = [head.join(",")].concat(dataRows().map((p) =>
        [p.id, p.nama, aspekById[p.aspek].nama, p.provinsi, p.lat, p.lng, p.tahun, p.pelaksana, p.dana, p.qty, p.unit, p.tco2e, p.mustahik, p.ikb, p.status]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")));
      const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const aEl = Object.assign(document.createElement("a"), { href: url, download: "data_program_zakat_hijau_ilustrasi.csv" });
      document.body.appendChild(aEl); aEl.click(); aEl.remove(); URL.revokeObjectURL(url);
    });
    renderData();
  }

  // ---------- Metodologi ----------
  function initMetodologi() {
    document.getElementById("tblEf").innerHTML =
      `<thead><tr><th>Aspek</th><th>Unit aktivitas</th><th class="num">Faktor emisi (tCO₂e/unit/thn)</th><th class="num">Biaya per unit</th><th>Keterangan</th></tr></thead><tbody>` +
      A.map((a) => `<tr><td><span class="chip"><span class="dot" style="background:${a.warna}"></span>${esc(a.nama)}</span></td><td>${esc(a.unit)}</td>
        <td class="num">${a.ef}</td><td class="num">${rpFull(a.rpPerUnit)}</td><td>${esc(a.catatanEf)}</td></tr>`).join("") + "</tbody>";
  }

  const INIT = { ringkasan: initRingkasan, peta: initPeta, portofolio: initPortofolio, data: initData, metodologi: initMetodologi };
  window.addEventListener("hashchange", () => { showTab(location.hash.slice(1), false); window.scrollTo(0, 0); });
  // tunggu font Poppins termuat agar label grafik diukur dengan benar
  const start = () => { showTab(location.hash.slice(1) || "ringkasan", false); window.scrollTo(0, 0); };
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve()).then(start);
})();
