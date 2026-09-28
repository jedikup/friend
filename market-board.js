(() => {
  const dataUrl = new URL('./market-analysis.json', location.href);
  dataUrl.searchParams.set('v', Date.now());
  const $ = (id) => document.getElementById(id);
  const fmt = (n, digits = 2) => Number(n).toLocaleString('th-TH', { maximumFractionDigits: digits });
  const stamp = (value) => {
    if (!value) return 'ไม่พบเวลาข้อมูล';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }).format(date) + ' น. (เวลาไทย)';
  };
  const safeUrl = (value) => {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  };
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const direction = (value) => ({ down: ['news-bad', 'impact-down', 'ลบต่อทอง'], up: ['news-good', 'impact-up', 'บวกต่อทอง'], mixed: ['news-watch', 'impact-watch', 'ผลผสม'], watch: ['news-watch', 'impact-watch', 'เฝ้าระวัง'] })[value] || ['news-watch', 'impact-watch', 'รอตรวจสอบ'];

  function renderNewsItem(item, compact = false) {
    const [cardClass, badgeClass, label] = direction(item.direction);
    const card = node('div', `news-item ${cardClass}`);
    const heading = node('div');
    const badge = node('span', `impact ${badgeClass}`, label);
    const title = node('b', '', item.title || 'หัวข้อข่าวไม่ระบุ');
    heading.append(badge, document.createTextNode(' '), title);
    const when = node('time', 'news-meta', `${stamp(item.published)} · ${item.publisher || 'แหล่งข่าวไม่ระบุ'}`);
    if (item.published) when.dateTime = item.published;
    heading.append(when);
    const summary = node('p');
    summary.append(node('b', '', 'ข่าวรายงาน: '), document.createTextNode(item.summary || item.snippet || 'ไม่มีข้อความสรุปจากต้นทาง'));
    card.append(heading, summary);
    if (!compact) {
      const impact = node('p');
      impact.append(node('b', '', 'ตลาดอาจตอบสนอง: '), document.createTextNode(item.response || 'ยังไม่พอสรุปผลตอบสนอง'));
      card.append(impact);
      const reaction = node('p');
      reaction.append(node('b', '', 'การเคลื่อนไหวราคาที่ตรวจได้: '), document.createTextNode(item.market_reaction || 'ข้อมูลชุดนี้ยังไม่ยืนยันการเปลี่ยนแปลงที่เกิดจากข่าวนี้โดยตรง'));
      card.append(reaction);
    }
    const url = safeUrl(item.url);
    if (url) {
      const source = node('a', 'news-source', `อ่าน ${item.publisher || 'ต้นทาง'} ↗`);
      source.href = url;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      const p = node('p'); p.append(source); card.append(p);
    }
    return card;
  }

  function rangeText(range, currency = '$') {
    if (!range || !Number.isFinite(Number(range.low)) || !Number.isFinite(Number(range.high))) return '—';
    return `${currency}${fmt(range.low)}–${currency}${fmt(range.high)}`;
  }

  let currentTech = null;
  function updateThaiLevelLabels(fx) {
    if (!currentTech || !Number.isFinite(Number(fx))) return;
    const convert = (r) => {
      if (!r) return '—';
      const factor = Number(fx) * 0.47296;
      const low = Math.round((r.low * factor) / 50) * 50;
      const high = Math.round((r.high * factor) / 50) * 50;
      return `฿${fmt(low, 0)}–${fmt(high, 0)}`;
    };
    $('thaiSupportNear').textContent = convert(currentTech.support?.[0]);
    $('thaiSupportNext').textContent = convert(currentTech.support?.[1]);
    $('thaiResistanceNear').textContent = convert(currentTech.resistance?.[0]);
    $('thaiResistanceNext').textContent = convert(currentTech.resistance?.[1]);
  }

  function renderLevels(technical, data) {
    currentTech = technical;
    const supports = technical.support || [];
    const resistances = technical.resistance || [];
    $('spotSupportNear').textContent = rangeText(supports[0]);
    $('spotSupportNext').textContent = rangeText(supports[1]);
    $('spotResistanceNear').textContent = rangeText(resistances[0]);
    $('spotResistanceNext').textContent = rangeText(resistances[1]);
    updateThaiLevelLabels(technical.fx_usd_thb);
    $('levelsUpdatedAt').textContent = `คำนวณล่าสุด ${stamp(data.generated_at)} · แหล่งข้อมูล: ${technical.source || 'OHLC/Spot'}`;
    $('levelsMethod').textContent = `${technical.method || 'คำนวณจาก swing high/low และ ATR'} · ภาพแนวโน้ม ${technical.trend || '—'} · ATR(${technical.atr_period || 14}) $${fmt(technical.atr14 || 0)}`;
  }

  function renderScenario(data) {
    const scenario = data.scenario;
    const host = $('scenarioGrid');
    if (!host) return;
    host.replaceChildren();
    const entries = [['1 สัปดาห์', scenario?.one_week], ['1 เดือน', scenario?.one_month], ['3 เดือน', scenario?.three_months]];
    for (const [label, text] of entries) {
      const card = node('div', 'forecast');
      card.append(node('b', '', label), node('p', '', text || 'รอผลวิเคราะห์จากรอบ 08:00'));
      host.append(card);
    }
    $('scenarioSummary').textContent = data.market_summary || 'รอผลวิเคราะห์ตลาดจากรอบ 08:00';
    $('scenarioUpdatedAt').textContent = `วิเคราะห์ล่าสุด ${stamp(data.ai_updated_at)} · ระบบคำนวณตามรอบวันละ 1 ครั้ง`;
    const badge = document.querySelector('.ai-label');
    if (badge && data.analysis_type === 'rules_based') badge.textContent = 'ประเมินตามกฎจากข้อมูลตลาด · ไม่ใช่ AI/ข่าวจริง';
  }

  function renderPlan(data) {
    const list = $('marketPlanList');
    if (!list) return;
    list.replaceChildren();
    (data.plan || []).forEach((line) => list.append(node('li', '', line)));
    if (!list.children.length) list.append(node('li', '', 'รอผลวิเคราะห์จากรอบ 08:00'));
    $('planUpdatedAt').textContent = `อัปเดตล่าสุด ${stamp(data.ai_updated_at)} · checklist เป็นการวิเคราะห์ตามข้อมูลตลาด ไม่ใช่คำสั่งซื้อขาย`;
  }

  function renderNews(data) {
    const news = data.news || [];
    const host = $('latestNews');
    if (host) {
      const first = news.slice(0, 3);
      const more = news.slice(3, 6);
      const mainList = $('latestNewsItems');
      const moreList = $('newsMoreItems');
      mainList.replaceChildren(...first.map((item) => renderNewsItem(item)));
      moreList.replaceChildren(...more.map((item) => renderNewsItem(item)));
      if (!news.length) mainList.append(node('p', 'news-snapshot-note', 'รอบนี้ไม่พบข่าวจากฟีด RSS ที่ดึงมาได้'));
      $('newsToggle').hidden = news.length <= 3;
      $('newsToggle').textContent = `More · ดูเพิ่มอีก ${Math.min(3, Math.max(news.length - 3, 0))} ข่าว`;
      $('newsSourceUpdatedAt').textContent = `คัดข่าวล่าสุด ${stamp(data.news_updated_at)} · แสดง ${news.length} ข่าวที่ตรวจจากฟีดข่าว`;
    }
    const hotHost = $('hotNewsList');
    if (hotHost) {
      const hot = data.hot_news || [];
      hotHost.replaceChildren(...hot.slice(0, 3).map((item) => renderNewsItem(item)));
      $('hotModeNote').textContent = hot.length ? `ข่าวที่ระบบคัดเป็นผลกระทบสูง · ประเมินล่าสุด ${stamp(data.news_updated_at)}` : 'ยังไม่มีข่าวที่มีหลักฐานพอให้จัดเป็นข่าวผลกระทบสูง';
    }
    const allHost = $('allNewsList');
    if (allHost) {
      allHost.replaceChildren(...news.map((item) => renderNewsItem(item)));
      $('allNewsCount').textContent = `${news.length} ข่าว · เรียงใหม่ไปเก่า · อัปเดต ${stamp(data.news_updated_at)}`;
    }
    const allLink = document.querySelector('.all-news-btn[href*="news.html"]');
    if (allLink) allLink.textContent = `ALL · ข่าวทั้งหมด ${news.length} ข่าว ↗`;
  }

  async function load() {
    try {
      const embedded = $('marketAnalysisData');
      let data;
      if (embedded) data = JSON.parse(embedded.textContent);
      else {
        const response = await fetch(dataUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
      }
      if (data.technical && Object.keys(data.technical).length) renderLevels(data.technical, data);
      renderScenario(data);
      renderPlan(data);
      renderNews(data);
      const status = data.status || {};
      const rulesBased = status.ai === 'rules_based_no_api_key';
      $('analysisStatus').textContent = rulesBased
        ? 'แนวรับ–แนวต้านและ Scenario/Checklist อัปเดตจากข้อมูลตลาดด้วยกฎทางเทคนิค · ข่าวเป็นหัวข้อ RSS ที่ยังไม่จัดทิศทาง · ตั้ง OPENAI_API_KEY หากต้องการการวิเคราะห์จาก AI'
        : `สถานะ AI: ${status.ai || 'ไม่ทราบ'} · ข่าว: ${status.news || 'ไม่ทราบ'} · ข้อมูลเทคนิค: ${status.technical || 'ไม่ทราบ'}`;
      $('analysisStatus').classList.toggle('status-warning', (!rulesBased && status.ai === 'needs_api_key') || status.technical !== 'ok' || status.ai?.includes('error'));
      if (status.technical !== 'ok') $('levelsUpdatedAt').textContent = `เตือน: ข้อมูลเทคนิคล่าสุดไม่สำเร็จ · แสดงข้อมูลเดิม ${stamp(data.generated_at)}`;
    } catch (error) {
      const status = $('analysisStatus');
      if (status) { status.textContent = 'ยังโหลดชุดวิเคราะห์อัตโนมัติไม่สำเร็จ · ตรวจสอบอีกครั้งในรอบ 08:00/22:00'; status.classList.add('status-warning'); }
    }
  }

  const liveRefresh = $('refreshBtn');
  if (liveRefresh) {
    liveRefresh.addEventListener('click', () => { if (currentTech) setTimeout(() => updateThaiLevelLabels(Number(($('fxValue').textContent || '').replace(/[^0-9.]/g, ''))), 800); });
    setInterval(() => { if (currentTech) updateThaiLevelLabels(Number(($('fxValue').textContent || '').replace(/[^0-9.]/g, ''))); }, 60000);
  }
  load();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
})();

