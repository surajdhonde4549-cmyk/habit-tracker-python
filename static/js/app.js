// ================================================================
// DATA
// ================================================================
var habits    = [];
var sleepData = {};   // { "YYYY-MM-DD": hours }
var notes     = [];
var curYear   = 0;
var curMonth  = 0;
var deleteId  = null;
var deleteType= 'habit';
var pendingImg= null;
var saveTO    = null;
var sbTO      = null;

var MONTHS    = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
var MONS_S    = ['Jan','Feb','Mar','Apr','May','Jun',
                 'Jul','Aug','Sep','Oct','Nov','Dec'];
var WD        = ['Su','M','T','W','Th','F','Sa'];
var DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday',
                 'Thursday','Friday','Saturday'];

// ================================================================
// API — talk to Flask backend
// ================================================================
function apiSave() {
  var payload = { habits: habits, sleep: sleepData, notes: notes };
  fetch('/api/all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function() {
    showSavedBar();
  }).catch(function(e) {
    console.error('Save failed:', e);
  });
}

function apiLoad(callback) {
  fetch('/api/all')
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.habits) habits    = d.habits;
      if (d.sleep)  sleepData = d.sleep;
      if (d.notes)  notes     = d.notes;
      if (callback) callback();
    })
    .catch(function(e){
      console.error('Load failed:', e);
      if (callback) callback();
    });
}

function scheduleSave() {
  clearTimeout(saveTO);
  saveTO = setTimeout(apiSave, 400);
}

function showSavedBar() {
  var b = document.getElementById('savebar');
  b.style.display = 'block';
  clearTimeout(sbTO);
  sbTO = setTimeout(function(){ b.style.display='none'; }, 1400);
}

// Save before page unload
window.addEventListener('beforeunload', function(){ apiSave(); });
document.addEventListener('visibilitychange', function(){
  if (document.visibilityState === 'hidden') apiSave();
});

// ================================================================
// HELPERS
// ================================================================
function pad2(n){ return n < 10 ? '0'+n : ''+n; }
function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function dayOfWeek(y,m,d){ return new Date(y,m,d).getDay(); }
function makeKey(y,m,d){ return y+'-'+pad2(m+1)+'-'+pad2(d); }
function todayKey(){
  var t = new Date();
  return makeKey(t.getFullYear(), t.getMonth(), t.getDate());
}
function escH(s){
  return (''+s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function getNowDate(){
  var t = new Date();
  return DAYS_FULL[t.getDay()]+', '+t.getDate()+' '+
         MONS_S[t.getMonth()]+' '+t.getFullYear();
}
function getNowTime(){
  var t = new Date(), h = t.getHours(), m = t.getMinutes();
  var ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if(h===0) h = 12;
  return pad2(h)+':'+pad2(m)+' '+ap;
}
function sleepColor(hrs){
  if (hrs <= 0) return 'empty';
  if (hrs <  4) return 'low';
  if (hrs <  7) return 'normal';
  if (hrs <= 9) return 'good';
  return 'great';
}

// ================================================================
// SCREEN SWITCH
// ================================================================
function switchScreen(name) {
  document.getElementById('screen-habits').className = 'screen'+(name==='habits'?' active':'');
  document.getElementById('screen-notes').className  = 'screen'+(name==='notes'?' active':'');
  document.getElementById('nav-habits').className    = 'nav-btn'+(name==='habits'?' active':'');
  document.getElementById('nav-notes').className     = 'nav-btn'+(name==='notes'?' active':'');
  if (name === 'notes') renderNotes();
}

// ================================================================
// DATE DROPDOWNS (sleep log)
// ================================================================
function buildDropdowns() {
  var now = new Date();
  var dd  = document.getElementById('sl-day');
  var dm  = document.getElementById('sl-mon');
  var dy  = document.getElementById('sl-yr');

  // Days 1–31
  for (var d = 1; d <= 31; d++) {
    var o = document.createElement('option');
    o.value = d; o.textContent = d;
    if (d === now.getDate()) o.selected = true;
    dd.appendChild(o);
  }
  // Months
  for (var m = 0; m < 12; m++) {
    var o = document.createElement('option');
    o.value = m; o.textContent = MONS_S[m];
    if (m === now.getMonth()) o.selected = true;
    dm.appendChild(o);
  }
  // Years 2027–2050
  for (var y = 2027; y <= 2050; y++) {
    var o = document.createElement('option');
    o.value = y; o.textContent = y;
    if (y === now.getFullYear()) o.selected = true;
    dy.appendChild(o);
  }
}

// ================================================================
// RENDER ALL
// ================================================================
function renderAll() {
  renderMonthLabel();
  renderGrid();
  renderSleepTable();   // ← FIXED sleep hours column
  renderSleepChart();
  renderStats();
}

function renderMonthLabel() {
  document.getElementById('month-label').textContent =
    MONTHS[curMonth] + ' ' + curYear;
}

// ================================================================
// HABIT GRID
// ================================================================
function renderGrid() {
  var days  = daysInMonth(curYear, curMonth);
  var today = todayKey();
  var noH   = document.getElementById('no-habit');
  var gs    = document.getElementById('grid-scroll');
  var th    = document.getElementById('table-head');
  var tb    = document.getElementById('table-body');

  if (!habits.length) {
    noH.style.display = 'block';
    gs.style.display  = 'none';
    return;
  }
  noH.style.display = 'none';
  gs.style.display  = 'block';

  // Row 1: weekday names
  var r1 = '<tr><th class="sticky-col" style="font-size:9px;color:rgba(255,255,255,0.3);font-weight:700;padding-bottom:4px;">HABIT</th>';
  // Row 2: day numbers
  var r2 = '<tr><th class="sticky-col"></th>';

  for (var d = 1; d <= days; d++) {
    var dw = dayOfWeek(curYear, curMonth, d);
    var we = (dw===0||dw===6) ? ' we-col' : '';
    var k  = makeKey(curYear, curMonth, d);
    var isT = (k === today);
    r1 += '<th class="day-th'+we+'">'+WD[dw]+'</th>';
    r2 += '<th class="num-th'+(isT?' today':'')+we+'">'+d+'</th>';
  }
  r1 += '</tr>'; r2 += '</tr>';
  th.innerHTML = r1 + r2;

  var html = '';
  for (var i = 0; i < habits.length; i++) {
    var h  = habits[i];
    var rb = (i%2===1) ? 'background:rgba(255,255,255,0.015);' : '';
    html += '<tr style="'+rb+'">';
    html += '<td class="sticky-col" style="'+rb+'">';
    html += '<div class="habit-name-cell">';
    html += '<span class="h-num">'+(i+1)+'.</span>';
    html += '<span class="h-name">'+escH(h.name)+'</span>';
    html += '<div class="move-btns">';
    html += (i>0 ?
      '<div class="mv-btn" onclick="moveUp('+i+')">▲</div>' :
      '<div style="width:22px;height:15px"></div>');
    html += (i<habits.length-1 ?
      '<div class="mv-btn" onclick="moveDown('+i+')">▼</div>' :
      '<div style="width:22px;height:15px"></div>');
    html += '</div>';
    html += '<div class="del-btn-h" onclick="openDelHabit(\''+h.id+'\')">✕</div>';
    html += '</div></td>';

    for (var d = 1; d <= days; d++) {
      var k    = makeKey(curYear, curMonth, d);
      var done = h.done && h.done[k];
      var isT  = (k === today);
      var dw   = dayOfWeek(curYear, curMonth, d);
      var we   = (dw===0||dw===6) ? ' we-col' : '';
      var bc   = 'chk-box'+(done?' done':'')+(isT&&!done?' today-cell':'');
      html += '<td class="chk-td'+we+'">';
      html += '<div class="'+bc+'" onclick="toggleDay(\''+h.id+'\',\''+k+'\')">'+(done?'✓':'')+'</div>';
      html += '</td>';
    }
    html += '</tr>';
  }
  tb.innerHTML = html;
}

// ================================================================
// SLEEP HOURS TABLE  ← FIXED: proper column for every day
// ================================================================
function renderSleepTable() {
  var days  = daysInMonth(curYear, curMonth);
  var today = todayKey();
  var th    = document.getElementById('sleep-table-head');
  var tb    = document.getElementById('sleep-table-body');

  // ── Header Row 1: Weekday names ──
  var r1 = '<tr><th class="sticky-sl">Sleep ↓ Day →</th>';
  for (var d = 1; d <= days; d++) {
    var dw = dayOfWeek(curYear, curMonth, d);
    var k  = makeKey(curYear, curMonth, d);
    var isT = (k === today);
    r1 += '<th'+(isT?' class="sl-today-col"':'')+'>'+WD[dw]+'</th>';
  }
  r1 += '</tr>';

  // ── Header Row 2: Day numbers ──
  var r2 = '<tr><th class="sticky-sl" style="color:#7b5cff;">Hours</th>';
  for (var d = 1; d <= days; d++) {
    var k  = makeKey(curYear, curMonth, d);
    var isT = (k === today);
    r2 += '<th'+(isT?' class="sl-today-col"':'')+' style="color:'+(isT?'#a78bfa':'rgba(255,255,255,0.6)')+'">'+d+'</th>';
  }
  r2 += '</tr>';

  th.innerHTML = r1 + r2;

  // ── Data Row: hours for each day ──
  var dataRow = '<tr>';
  dataRow += '<td class="sticky-sl-td" style="color:#a78bfa;font-weight:700;">🌙 Hrs</td>';
  for (var d = 1; d <= days; d++) {
    var k   = makeKey(curYear, curMonth, d);
    var hrs = sleepData[k] || 0;
    var cls = sleepColor(hrs);
    var isT = (k === today);
    var txt = hrs > 0 ? hrs : '—';
    dataRow += '<td class="sl-hrs-cell '+cls+(isT?' sl-today-col':'')+'">'+txt+'</td>';
  }
  dataRow += '</tr>';
  tb.innerHTML = dataRow;
}

// ================================================================
// SLEEP BAR CHART
// ================================================================
function renderSleepChart() {
  var days = daysInMonth(curYear, curMonth);
  var bEl  = document.getElementById('sleep-bars');
  var xEl  = document.getElementById('sleep-x');
  var bH   = '', xH = '';

  for (var d = 1; d <= days; d++) {
    var k   = makeKey(curYear, curMonth, d);
    var hrs = sleepData[k] || 0;
    var bh  = hrs > 0 ? Math.max((hrs/12)*82, 4) : 0;
    var c   = hrs===0 ? 'rgba(255,255,255,0.08)' :
              hrs < 4 ? '#f97316' :
              hrs < 7 ? '#60a5fa' :
              hrs <= 9? '#34d399' : '#a78bfa';

    bH += '<div class="bar-col">';
    bH += '<div class="bar-val">'+(hrs>0?hrs:'')+'</div>';
    bH += '<div class="bar-rect" style="height:'+bh+'px;background:'+c+'"></div>';
    bH += '</div>';

    var dw = dayOfWeek(curYear, curMonth, d);
    xH += '<div class="x-col">';
    xH += '<div class="x-num">'+d+'</div>';
    xH += '<div class="x-day">'+WD[dw]+'</div>';
    xH += '</div>';
  }

  bEl.innerHTML = bH;
  xEl.innerHTML = xH;
}

// ================================================================
// STATS
// ================================================================
function renderStats() {
  var now   = new Date();
  var isNow = (now.getFullYear()===curYear && now.getMonth()===curMonth);
  var days  = daysInMonth(curYear, curMonth);
  var el    = isNow ? now.getDate() : days;
  var tot   = 0, dn = 0;

  for (var i = 0; i < habits.length; i++) {
    tot += el;
    if (habits[i].done) {
      var ks = Object.keys(habits[i].done);
      for (var j = 0; j < ks.length; j++)
        if (habits[i].done[ks[j]]) dn++;
    }
  }
  var rt = tot > 0 ? Math.round(dn/tot*100) : 0;

  document.getElementById('s-total').textContent = habits.length;
  document.getElementById('s-done').textContent  = dn;
  document.getElementById('s-rate').textContent  = rt+'%';

  // Streak
  var sk = 0;
  if (habits.length) {
    for (var i = 0; i < 90; i++) {
      var d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
      var k  = makeKey(d2.getFullYear(), d2.getMonth(), d2.getDate());
      var al = true;
      for (var j = 0; j < habits.length; j++) {
        if (!habits[j].done || !habits[j].done[k]) { al=false; break; }
      }
      if (al) sk++;
      else if (i > 0) break;
    }
  }
  document.getElementById('s-streak').textContent = sk+'🔥';
}

// ================================================================
// NOTES
// ================================================================
function renderNotes() {
  var cnt  = document.getElementById('notes-count');
  var emEl = document.getElementById('notes-empty');
  var list = document.getElementById('notes-list');

  cnt.textContent = notes.length + (notes.length===1 ? ' note' : ' notes');

  if (!notes.length) { emEl.style.display='block'; list.innerHTML=''; return; }
  emEl.style.display = 'none';

  var sorted = notes.slice().sort(function(a,b){ return b.ts - a.ts; });
  var colors = ['#7b5cff','#34d399','#f97316','#60a5fa','#f472b6','#fbbf24'];
  var html   = '';

  for (var i = 0; i < sorted.length; i++) {
    var n  = sorted[i];
    var bc = colors[i % colors.length];
    html += '<div class="note-card" style="border-left-color:'+bc+'">';
    html += '<div class="note-card-header">';
    html += '<div class="note-datetime">';
    html += '<div class="note-date">📅 '+escH(n.date)+'</div>';
    html += '<div class="note-time">🕐 '+escH(n.time)+'</div>';
    html += '</div>';
    html += '<div class="note-del-btn" onclick="openDelNote(\''+n.id+'\')">✕</div>';
    html += '</div>';
    if (n.text) html += '<div class="note-text">'+escH(n.text)+'</div>';
    if (n.imgData) html += '<img class="note-img" src="'+n.imgData+'" alt="note img" onclick="openImgViewer(\''+n.id+'\')">';
    html += '</div>';
  }
  list.innerHTML = html;
}

// ── Image picker (works in browser + WebView) ──────────────────
function handleImagePick(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    pendingImg = ev.target.result;
    document.getElementById('img-preview').src = pendingImg;
    document.getElementById('img-preview-wrap').style.display = 'block';
    showToast('📷 Image ready!');
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function removeImg() {
  pendingImg = null;
  document.getElementById('img-preview').src = '';
  document.getElementById('img-preview-wrap').style.display = 'none';
}

function saveNote() {
  var text = document.getElementById('note-text').value.trim();
  if (!text && !pendingImg) { showToast('Note likhein ya image add karein!'); return; }
  notes.push({
    id:      ''+Date.now()+Math.floor(Math.random()*1000),
    text:    text,
    imgData: pendingImg || null,
    date:    getNowDate(),
    time:    getNowTime(),
    ts:      Date.now()
  });
  document.getElementById('note-text').value = '';
  removeImg();
  scheduleSave();
  renderNotes();
  showToast('📝 Note save ho gaya!');
}

function openImgViewer(nid) {
  var n = null;
  for (var i = 0; i < notes.length; i++) if(notes[i].id===nid){n=notes[i];break;}
  if (!n || !n.imgData) return;
  document.getElementById('img-viewer-img').src = n.imgData;
  document.getElementById('img-viewer').className = 'show';
}
function closeImgViewer() {
  document.getElementById('img-viewer').className = '';
  document.getElementById('img-viewer-img').src = '';
}

// ================================================================
// HABIT ACTIONS
// ================================================================
function addHabit() {
  var inp  = document.getElementById('habit-input');
  var name = inp.value.trim();
  if (!name) { showToast('Habit ka naam likhein!'); return; }
  for (var i=0;i<habits.length;i++) {
    if (habits[i].name.toLowerCase()===name.toLowerCase()) {
      showToast('Yeh habit pehle se hai!'); return;
    }
  }
  habits.push({
    id:   ''+Date.now()+Math.floor(Math.random()*999),
    name: name,
    done: {}
  });
  inp.value = '';
  scheduleSave();
  renderAll();
  showToast('✅ Habit add ho gayi: '+name);
}

function toggleDay(hid, key) {
  for (var i=0;i<habits.length;i++) {
    if (habits[i].id === hid) {
      if (!habits[i].done) habits[i].done = {};
      habits[i].done[key] = !habits[i].done[key];
      scheduleSave(); renderAll(); return;
    }
  }
}

function moveUp(i) {
  if (i<=0) return;
  var t=habits[i]; habits[i]=habits[i-1]; habits[i-1]=t;
  scheduleSave(); renderAll();
}
function moveDown(i) {
  if (i>=habits.length-1) return;
  var t=habits[i]; habits[i]=habits[i+1]; habits[i+1]=t;
  scheduleSave(); renderAll();
}

function logSleep() {
  var d = parseInt(document.getElementById('sl-day').value);
  var m = parseInt(document.getElementById('sl-mon').value);
  var y = parseInt(document.getElementById('sl-yr').value);
  var h = parseFloat(document.getElementById('sl-hrs').value);
  if (isNaN(d)||isNaN(m)||isNaN(y)) { showToast('Date select karein!'); return; }
  if (isNaN(h)||h<0||h>24) { showToast('0 se 24 ke beech hours daalein!'); return; }
  sleepData[makeKey(y,m,d)] = h;
  document.getElementById('sl-hrs').value = '';
  scheduleSave(); renderAll();
  showToast('🌙 Sleep log ho gayi: '+h+'h');
}

function prevMonth() {
  curMonth--;
  if (curMonth < 0) { curMonth=11; curYear--; }
  renderAll();
}
function nextMonth() {
  curMonth++;
  if (curMonth > 11) { curMonth=0; curYear++; }
  renderAll();
}

// ================================================================
// MODAL
// ================================================================
function openDelHabit(id) {
  deleteId=id; deleteType='habit';
  document.getElementById('modal-desc').textContent='Yeh habit permanently delete hogi?';
  document.getElementById('del-modal').className='show';
}
function openDelNote(id) {
  deleteId=id; deleteType='note';
  document.getElementById('modal-desc').textContent='Yeh note permanently delete hoga?';
  document.getElementById('del-modal').className='show';
}
function closeModal() {
  deleteId=null;
  document.getElementById('del-modal').className='';
}
function confirmDelete() {
  if (!deleteId) return;
  if (deleteType==='habit') {
    habits = habits.filter(function(h){ return h.id!==deleteId; });
    scheduleSave(); renderAll(); showToast('Habit delete ho gayi!');
  } else {
    notes = notes.filter(function(n){ return n.id!==deleteId; });
    scheduleSave(); renderNotes(); showToast('Note delete ho gaya!');
  }
  closeModal();
}

// ================================================================
// TOAST
// ================================================================
function showToast(msg) {
  var a  = document.getElementById('toast-area');
  var el = document.createElement('div');
  el.className   = 'toast';
  el.textContent = msg;
  a.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 2500);
}

// Enter key on habit input
document.getElementById('habit-input').onkeyup = function(e) {
  if (e.keyCode===13) addHabit();
};

// ================================================================
// INIT — load from Flask API then render
// ================================================================
function init() {
  var now = new Date();
  curYear  = now.getFullYear();
  curMonth = now.getMonth();
  buildDropdowns();
  apiLoad(function() {
    renderAll();
  });
}

// Start after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  setTimeout(init, 50);
}
