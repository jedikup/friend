(() => {
  const dataUrl = new URL('./market-analysis.json', location.href);
  dataUrl.searchParams.set('v', Date.now());
  const $ = (id) => document.getElementById(id);
  const CACHE_KEY='friend-market-analysis-v2';
  async function readSnapshot(){
    const urls=[dataUrl.href,'https://raw.githubusercontent.com/jedikup/friend/main/market-analysis.json?v='+Date.now(),'https://cdn.jsdelivr.net/gh/jedikup/friend@main/market-analysis.json?x='+Date.now()];
    for(const url of urls){try{const response=await fetch(url,{cache:'no-store'});if(!response.ok)continue;const data=await response.json();if(data&&(data.live_quote||data.technical||data.news)){try{localStorage.setItem(CACHE_KEY,JSON.stringify(data))}catch(_){}return {data,fallback:false}}}catch(_){}}
    try{const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(cached)return {data:cached,fallback:true}}catch(_){}
    try{const embedded=JSON.parse($('marketAnalysisData')?.textContent||'null');if(embedded&&(embedded.live_quote||embedded.technical||embedded.news))return {data:embedded,fallback:true}}catch(_){}
    throw new Error('Market data unavailable');
  }
  const fmt = (n, digits = 2) => Number(n).toLocaleString('th-TH', { maximumFractionDigits: digits });
  const stamp = (value) => {
    if (!value) return 'ไม่พบเวลาข้อมูล';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }).format(date) + ' น. (เวลาไทย)';
  };
  function renderPrices(data, fallback = false) {
    const q = data.live_quote || {};
    const spot = Number(q.spot), fx = Number(q.fx_usd_thb), thai = Number(q.estimated_thb_per_baht);
    if (Number.isFinite(spot) && spot > 0 && $('spotValue')) $('spotValue').textContent = '$' + fmt(spot);
    if (Number.isFinite(fx) && fx > 0 && $('fxValue')) $('fxValue').textContent = fmt(fx, 3);
    if (Number.isFinite(thai) && thai > 0 && $('thaiValue')) $('thaiValue').textContent = '฿' + fmt(thai, 0);
    const quoteTime = q.quote_updated || data.technical?.quote_updated;
    if ($('updatedAt')) $('updatedAt').textContent = 'ราคา Spot: ' + stamp(quoteTime) + ' · USD/THB อ้างอิง ' + (q.fx_reference_date || 'ไม่ระบุวันที่');
    if ($('checkedAt')) $('checkedAt').textContent = 'ตรวจข้อมูลล่าสุด: ' + stamp(data.generated_at);
    const dt = quoteTime ? new Date(quoteTime) : null;
    const stale = !dt || Number.isNaN(dt.getTime()) || Date.now() - dt.getTime() > 45 * 60 * 1000;
    const status = $('feedStatus');
    if (status) status.textContent = fallback
      ? 'ใช้ข้อมูลสำรอง · โปรดตรวจเวลาราคาต้นทางก่อนตัดสินใจ'
      : q.market_status === 'closed'
        ? (q.market_note || 'ตลาด Spot ปิด · แสดงราคาล่าสุดที่มี ไม่ใช่ราคาเทรดสด')
        : stale
          ? 'ราคา Spot เก่ากว่า 45 นาที · แสดงราคาล่าสุดที่ตรวจได้'
          : 'ตรวจฟีดทุก 10 นาที · USD/THB เป็นอัตราอ้างอิงรายวัน';
    const dot = $('feedDot');
    if (dot) dot.classList.toggle('off', fallback || stale || q.market_status === 'closed');
  }

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
    if (item.hot_reason) card.append(node('p', 'hot-reason', `เหตุที่ควรจับตา: ${item.hot_reason}`));
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

  function horizonLabel(data, key, fallback) {
    if (data.scenario_dates && data.scenario_dates[key]) return `${fallback} · ${data.scenario_dates[key]}`;
    const source = data.ai_updated_at || data.generated_at;
    if (!source) return fallback;
    const sourceDate = new Date(source);
    if (Number.isNaN(sourceDate.getTime())) return fallback;
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(sourceDate).reduce((o, p) => (o[p.type] = p.value, o), {});
    const start = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
    const end = new Date(start);
    const originalDay = end.getUTCDate();
    if (key === 'one_week') end.setUTCDate(end.getUTCDate() + 7);
    else {
      const monthStep = key === 'one_month' ? 1 : 3;
      end.setUTCDate(1);
      end.setUTCMonth(end.getUTCMonth() + monthStep);
      const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
      end.setUTCDate(Math.min(originalDay, lastDay));
    }
    const fmtDate = (date) => date.toLocaleDateString('th-TH', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
    return `${fallback} · ${fmtDate(start)} – ${fmtDate(end)}`;
  }

  function analysisStamp(data) {
    return `อัปเดตบทวิเคราะห์ ${stamp(data.ai_updated_at)} · ราคาอ้างอิง ${stamp(data.technical?.quote_updated)} · อัปเดตรอบ 08:00/22:00 น.`;
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
    if ($('thaiSupportNear')) $('thaiSupportNear').textContent = convert(currentTech.support?.[0]);
    if ($('thaiSupportNext')) $('thaiSupportNext').textContent = convert(currentTech.support?.[1]);
    if ($('thaiResistanceNear')) $('thaiResistanceNear').textContent = convert(currentTech.resistance?.[0]);
    if ($('thaiResistanceNext')) $('thaiResistanceNext').textContent = convert(currentTech.resistance?.[1]);
  }

  function renderLevels(technical, data) {
    currentTech = technical;
    const supports = technical.support || [];
    const resistances = technical.resistance || [];
    if ($('spotSupportNear')) $('spotSupportNear').textContent = rangeText(supports[0]);
    if ($('spotSupportNext')) $('spotSupportNext').textContent = rangeText(supports[1]);
    if ($('spotResistanceNear')) $('spotResistanceNear').textContent = rangeText(resistances[0]);
    if ($('spotResistanceNext')) $('spotResistanceNext').textContent = rangeText(resistances[1]);
    updateThaiLevelLabels(technical.fx_usd_thb);
    if ($('levelsUpdatedAt')) $('levelsUpdatedAt').textContent = `ประมวลผล ${stamp(technical.levels_updated_at || data.generated_at)} · แท่ง OHLC ล่าสุด ${stamp(technical.last_closed_bar?.time)} · ราคา Spot ${stamp(technical.quote_updated || data.live_quote?.quote_updated)} · แหล่งข้อมูล: ${technical.source || 'OHLC/Spot'}`;
    if ($('levelsMethod')) $('levelsMethod').textContent = `${technical.method || 'คำนวณจาก swing high/low และ ATR'} · ภาพแนวโน้ม ${technical.trend || '—'} · ATR(${technical.atr_period || 14}) $${fmt(technical.atr14 || 0)}`;
  }

  function renderIndicators(data) {
    const t = data.technical || {};
    const v = t.indicators || {};
    const indicatorAt = v.updated_at || t.last_closed_bar?.time;
    const stampText = stamp(indicatorAt);
    const set = (id, text) => {
      const el = $(id);
      if (!el) return false;
      el.textContent = text || '';
      el.hidden = !text;
      return Boolean(text);
    };
    const emaParts = [];
    if (v.ema20 != null) emaParts.push(`EMA20 $${fmt(v.ema20)}`);
    if (v.ema50 != null || t.ema50 != null) emaParts.push(`EMA50 $${fmt(v.ema50 ?? t.ema50)}`);
    if (v.ema200 != null) emaParts.push(`EMA200 $${fmt(v.ema200)}`);
    if (v.ema_reading) emaParts.push(v.ema_reading);
    const hasEma = set('indicatorEmaNow', emaParts.length ? `Spot $${fmt(t.spot)} · ${emaParts.join(' · ')}` : '');
    const hasRsi = set('indicatorRsiNow', v.rsi14 != null ? `RSI(14) ${fmt(v.rsi14, 1)}/100 · ${v.rsi_reading || ''}` : '');
    const hasMacd = set('indicatorMacdNow', v.macd != null ? `MACD $${fmt(v.macd)} · Signal $${fmt(v.macd_signal)} · Histogram $${fmt(v.macd_hist)} · ${v.macd_reading || ''}` : '');
    const hasBands = set('indicatorBbNow', v.bb_mid != null ? `บน $${fmt(v.bb_upper)} · กลาง $${fmt(v.bb_mid)} · ล่าง $${fmt(v.bb_lower)} · ${v.bb_reading || ''}` : '');
    const atr = v.atr14 ?? t.atr14;
    const hasAtr = set('indicatorAtrNow', atr != null ? `ATR(14) $${fmt(atr)}/oz · ${v.atr_reading || 'บอกขนาดการแกว่ง ไม่ได้บอกทิศทาง'}` : '');
    const note = $('indicatorSnapshotAt');
    if (note) {
      const indicatorStale = indicatorAt && Date.now() - new Date(indicatorAt).getTime() > 48 * 60 * 60 * 1000;
      note.textContent = `ค่า Indicator คำนวณจากแท่งปิด ${stampText} · Gold Spot 1D${indicatorStale ? ' · ยังไม่มีแท่งใหม่จากแหล่งข้อมูล จึงไม่ถือว่าเป็นค่าปัจจุบัน' : ''}`;
      const anyReading = hasEma || hasRsi || hasMacd || hasBands || hasAtr;
      note.hidden = !anyReading;
      if (note.parentElement) note.parentElement.hidden = !anyReading;
    }
  }

  function renderScenario(data) {
    const scenario = data.scenario;
    const host = $('scenarioGrid');
    if (!host) return;
    host.replaceChildren();
    const entries = [[horizonLabel(data, 'one_week', '1 สัปดาห์'), scenario?.one_week], [horizonLabel(data, 'one_month', '1 เดือน'), scenario?.one_month], [horizonLabel(data, 'three_months', '3 เดือน'), scenario?.three_months]];
    for (const [label, text] of entries) {
      const card = node('div', 'forecast');
      card.append(node('b', '', label), node('p', '', text || 'รอผลวิเคราะห์จากรอบ 08:00'));
      host.append(card);
    }
    $('scenarioSummary').textContent = data.market_summary || 'รอผลวิเคราะห์ตลาดจากรอบ 08:00';
    $('scenarioUpdatedAt').textContent = analysisStamp(data);
    const badge = document.querySelector('.ai-label');
    if (badge && data.analysis_type === 'rules_based') badge.textContent = 'ประเมินตามกฎจากข้อมูลตลาด · ไม่ใช่ AI/ข่าวจริง';
  }

  function renderPlan(data) {
    const list = $('marketPlanList');
    if (!list) return;
    list.replaceChildren();
    (data.plan || []).forEach((line) => list.append(node('li', '', line)));
    if (!list.children.length) list.append(node('li', '', 'รอผลวิเคราะห์จากรอบ 08:00'));
    $('planUpdatedAt').textContent = `${analysisStamp(data)} · แผนนี้เป็นแนวทางแบบมีเงื่อนไข ไม่ใช่คำสั่งซื้อขาย`;
  }

  function fallbackChart(id,bars,field,fx,latestPrice){
    const host=$(id); if(!host||!Array.isArray(bars)||bars.length<2)return;
    host.querySelector('.chart-fallback')?.remove();
    const data=bars.slice(-60).map(b=>({o:Number(b.open),h:Number(b.high),l:Number(b.low),c:Number(b.close),time:b.time}))
      .filter(b=>[b.o,b.h,b.l,b.c].every(Number.isFinite));
    if(data.length<2)return;
    const factor=field==='thai'?Number(fx)*0.47296:1;
    if(!Number.isFinite(factor)||factor<=0)return;
    const n=data.length,ma=[],up=[],dn=[];
    for(let i=0;i<n;i++){
      const w=data.slice(Math.max(0,i-19),i+1).map(b=>b.c*factor),avg=w.reduce((a,v)=>a+v,0)/w.length;
      const sd=Math.sqrt(w.reduce((a,v)=>a+(v-avg)**2,0)/w.length);
      ma.push(avg);up.push(avg+2*sd);dn.push(avg-2*sd);
    }
    const live=Number(latestPrice)*factor;const all=data.flatMap((b,i)=>[b.h*factor,b.l*factor,up[i],dn[i]]);if(Number.isFinite(live)&&live>0)all.push(live);
    const lo=Math.min(...all),hi=Math.max(...all),span=(hi-lo)||1;
    const X=i=>38+i*(924/(n-1)),Y=v=>300-(v-lo)/span*250;
    const wrap=node('div','chart-fallback');wrap.style.cssText='position:absolute;inset:0;z-index:20;background:#f5f1df;padding:10px 12px;border:1px solid #c8bb80;border-radius:8px;overflow:hidden';
    wrap.append(node('b','',`${field==='thai'?'กราฟสำรอง · ทองไทยประมาณการ (แท่ง OHLC + Bollinger 20,2)':'กราฟสำรอง · Gold Spot (แท่ง OHLC)'} · แท่งล่าสุด ${stamp(data[data.length-1]?.time)}`));
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1000 340');svg.setAttribute('preserveAspectRatio','none');svg.style.cssText='width:100%;height:calc(100% - 34px);display:block';
    for(let g=0;g<5;g++){const y=35+g*62;const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1','34');line.setAttribute('x2','975');line.setAttribute('y1',String(y));line.setAttribute('y2',String(y));line.setAttribute('stroke','#d8d0b5');line.setAttribute('stroke-width','1');svg.append(line)}
    const poly=(values,color,width,dash='')=>{const p=document.createElementNS(svg.namespaceURI,'polyline');p.setAttribute('points',values.map((v,i)=>X(i)+','+Y(v)).join(' '));p.setAttribute('fill','none');p.setAttribute('stroke',color);p.setAttribute('stroke-width',String(width));if(dash)p.setAttribute('stroke-dasharray',dash);svg.append(p)};
    if(field==='thai'){poly(up,'#d49b18',2,'6 4');poly(ma,'#5267c8',2);poly(dn,'#d49b18',2,'6 4')}
    const step=924/Math.max(1,n-1),body=Math.max(2,Math.min(12,step*.55));
    data.forEach((b,i)=>{const x=X(i),o=b.o*factor,c=b.c*factor,h=b.h*factor,l=b.l*factor,color=c>=o?'#13835d':'#c43d48';
      const wick=document.createElementNS(svg.namespaceURI,'line');wick.setAttribute('x1',x);wick.setAttribute('x2',x);wick.setAttribute('y1',Y(h));wick.setAttribute('y2',Y(l));wick.setAttribute('stroke',color);wick.setAttribute('stroke-width','2');svg.append(wick);
      const rect=document.createElementNS(svg.namespaceURI,'rect');rect.setAttribute('x',x-body/2);rect.setAttribute('y',Math.min(Y(o),Y(c)));rect.setAttribute('width',body);rect.setAttribute('height',Math.max(2,Math.abs(Y(o)-Y(c))));rect.setAttribute('fill',color);svg.append(rect);
    });
    if(Number.isFinite(live)&&live>0){const y=Y(live),line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1','34');line.setAttribute('x2','975');line.setAttribute('y1',y);line.setAttribute('y2',y);line.setAttribute('stroke','#7b3fb4');line.setAttribute('stroke-width','2');line.setAttribute('stroke-dasharray','8 5');svg.append(line);const label=document.createElementNS(svg.namespaceURI,'text');label.setAttribute('x','960');label.setAttribute('y',Math.max(20,y-6));label.setAttribute('text-anchor','end');label.setAttribute('font-size','13');label.setAttribute('font-weight','700');label.setAttribute('fill','#63378d');label.textContent='ราคาล่าสุด '+(field==='thai'?'฿':'$')+fmt(Number(latestPrice),field==='thai'?0:2);svg.append(label)}wrap.append(svg);host.style.position='relative';host.append(wrap);
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
      if (!news.length) mainList.append(node('p', 'news-snapshot-note', 'รอบนี้ดึงข่าว RSS ไม่ได้ · คงข่าวเดิมไว้จนกว่าจะมีข้อมูลใหม่'));
      $('newsToggle').hidden = news.length <= 3;
      $('newsToggle').textContent = `More · ดูเพิ่มอีก ${Math.min(3, Math.max(news.length - 3, 0))} ข่าว`;
      $('newsSourceUpdatedAt').textContent = `คัดข่าวล่าสุด ${stamp(data.news_updated_at)} · แสดง ${news.length} ข่าวจาก RSS · ข่าว/บทวิเคราะห์รอบ 08:00 และ 22:00; ราคา Spot ตรวจทุก 10 นาที`;
    }
    const hotHost = $('hotNewsList');
    if (hotHost) {
      const hot = data.hot_news || [];
      hotHost.replaceChildren(...hot.slice(0, 3).map((item) => renderNewsItem(item)));
      $('hotModeNote').textContent = hot.length ? (data.status?.ai === 'rules_based_no_api_key' ? `คัดเบื้องต้นจากคำในพาดหัวและประเภทแหล่งข่าว · ${stamp(data.news_updated_at)} · ไม่ยืนยันว่าข่าวทำให้ราคาขยับ` : `คัดข่าวเด่นจากการวิเคราะห์ · ${stamp(data.news_updated_at)} · ตรวจสอบบทความต้นทาง`) : 'รอบนี้ไม่พบข่าวที่ผ่านเกณฑ์คัดเบื้องต้นจากฟีดที่ดึงได้ · ไม่ได้แปลว่าไม่มีข่าวสำคัญในตลาด';
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
      const {data,fallback}=await readSnapshot();
      renderPrices(data, fallback);
      const safeRender = (label, fn) => { try { fn(); } catch (error) { console.error('Gold board ' + label, error); } };
      if (data.technical && Object.keys(data.technical).length) { safeRender('levels', () => renderLevels(data.technical, data)); safeRender('indicators', () => renderIndicators(data)); }
      safeRender('scenario', () => renderScenario(data));
      safeRender('plan', () => renderPlan(data));
      safeRender('news', () => renderNews(data));
      const q=data.live_quote||{};
      safeRender('chart', () => fallbackChart('thaiOverviewChart',data.daily_bars,'thai',q.fx_usd_thb,q.spot));
      if(fallback){const status=$('feedStatus');if(status)status.textContent='ใช้ข้อมูลสำรองจากแคช/หน้าเว็บ · ราคาและข่าวอาจเก่า กรุณาดูเวลาต้นทาง';const dot=$('feedDot');if(dot)dot.classList.add('off');const note=$('newsSourceUpdatedAt');if(note)note.textContent+=' · แสดง snapshot สำรองเพราะเชื่อมต่อฟีดไม่สำเร็จ'}
      const status = data.status || {};
      const rulesBased = status.ai === 'rules_based_no_api_key';
      if ($('analysisStatus')) {
        $('analysisStatus').textContent = rulesBased
          ? 'ราคา Spot ตรวจทุก 10 นาที · ข่าวและแนวรับ/แนวต้านรอบ 08:00/22:00 · Scenario/Checklist รอบ 08:00 · ไม่มี API key จึงใช้กฎคัดพาดหัว ไม่ใช่ AI'
          : `สถานะ AI: ${status.ai || 'ไม่ทราบ'} · ข่าว: ${status.news || 'ไม่ทราบ'} · แนวรับ/ต้าน: ${status.technical || 'ไม่ทราบ'} · Indicator: ${status.indicators || 'ไม่ระบุ'}`;
        $('analysisStatus').classList.toggle('status-warning', (!rulesBased && status.ai === 'needs_api_key') || status.technical !== 'ok' || (status.indicators && status.indicators !== 'ok') || status.ai?.includes('error'));
      }
      if (status.technical !== 'ok' && $('levelsUpdatedAt')) $('levelsUpdatedAt').textContent = `เตือน: ข้อมูลเทคนิคล่าสุดไม่สำเร็จ · แสดงข้อมูลเดิม ${stamp(data.generated_at)}`;
    } catch (error) {
      console.error('Gold board data load failed', error);
      const status = $('analysisStatus');
      if (status) { status.textContent = 'โหลดข้อมูลจากไฟล์/แหล่งสำรองไม่สำเร็จ · ลองกด “อัปเดตตอนนี้” หรือเปิดใหม่ภายหลัง'; status.classList.add('status-warning'); }
      const news = $('latestNewsItems');
      if (news && news.children.length === 0) news.append(node('p', 'news-snapshot-note', 'โหลดข่าวไม่สำเร็จ · ลองโหลดหน้าใหม่'));
      const chart = $('thaiOverviewChart');
      if (chart && !chart.querySelector('.chart-fallback')) chart.append(node('p', 'news-snapshot-note', 'โหลดข้อมูลกราฟไม่สำเร็จ · ตรวจสอบการเชื่อมต่อ'));
    }
  }

  const liveRefresh = $('refreshBtn');
  if (liveRefresh) {
    liveRefresh.addEventListener('click', () => { if (currentTech) setTimeout(() => updateThaiLevelLabels(Number(($('fxValue').textContent || '').replace(/[^0-9.]/g, ''))), 800); });
    setInterval(() => { if (currentTech) updateThaiLevelLabels(Number(($('fxValue').textContent || '').replace(/[^0-9.]/g, ''))); }, 60000);
  }
  load();
  setInterval(() => { if (!document.hidden) load(); }, 10 * 60 * 1000);
  window.addEventListener('focus', () => load());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
  // Refresh the complete board (prices, chart, indicators, news and analysis) from the latest published snapshot.
  setInterval(() => { if (!document.hidden) load(); }, 10 * 60 * 1000);
})();

