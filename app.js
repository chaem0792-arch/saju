/* 화면 전환과 렌더링 */
(function () {
  'use strict';

  var Saju = window.Saju;
  var R = window.SajuReading;
  var $ = function (id) { return document.getElementById(id); };

  var state = { result: null, gender: '' };

  function show(screenId) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.toggle('active', s.id === screenId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ── 입력 ────────────────────────────────────────────
  $('time-unknown').addEventListener('change', function (e) {
    $('birth-time').disabled = e.target.checked;
  });

  $('saju-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('form-error');
    err.hidden = true;

    var dateVal = $('birth-date').value;
    var timeUnknown = $('time-unknown').checked;
    var timeVal = $('birth-time').value;

    if (!dateVal) return fail('생년월일을 입력해 주세요.');
    if (!timeUnknown && !timeVal) return fail('태어난 시각을 입력하거나 "시각을 몰라요"를 선택해 주세요.');

    var d = dateVal.split('-').map(Number);
    if (d[0] < 1900 || d[0] > 2100) return fail('1900년부터 2100년 사이의 날짜를 입력해 주세요.');
    var t = timeUnknown ? [12, 0] : timeVal.split(':').map(Number);

    var gender = document.querySelector('input[name="gender"]:checked');
    state.gender = gender ? gender.value : '';
    state.result = Saju.calculate({
      year: d[0], month: d[1], day: d[2],
      hour: t[0], minute: t[1],
      timeKnown: !timeUnknown,
      correctLongitude: $('correct-longitude').checked
    });

    runLoading(function () {
      renderResult(state.result);
      show('screen-result');
    });

    function fail(msg) {
      err.textContent = msg;
      err.hidden = false;
    }
  });

  // ── 분석 중 연출 ─────────────────────────────────────
  function runLoading(done) {
    show('screen-loading');
    var items = $('loading-steps').querySelectorAll('li');
    items.forEach(function (li) { li.className = ''; });
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var delay = reduce ? 60 : 380;
    var i = 0;
    (function next() {
      if (i > 0) items[i - 1].className = 'done';
      if (i < items.length) {
        items[i].className = 'doing';
        i++;
        setTimeout(next, delay);
      } else {
        setTimeout(done, reduce ? 0 : 250);
      }
    })();
  }

  // ── 결과 ────────────────────────────────────────────
  function renderResult(r) {
    var s = R.summary(r);
    var dm = s.dayMaster;
    var elInfo = R.ELEMENT_INFO[r.dayMasterElement];

    var identity = $('identity');
    identity.style.setProperty('--accent', elInfo.color);
    $('dm-icon').textContent = dm.icon;
    $('result-title').textContent = dm.name + '의 기운';
    $('dm-sub').textContent = Saju.STEMS[r.dayMaster] + elInfo.key + ' 일간 · ' + elInfo.name + '의 속성 · ' + dm.keyword;
    $('dm-desc').textContent = dm.desc;
    $('dm-strength').textContent = s.strengthText;

    renderPillars(r);
    renderElements(r, s);
    renderCategories();
    $('reading').hidden = true;
    $('reading').innerHTML = '';
  }

  function renderPillars(r) {
    var box = $('pillars');
    box.innerHTML = '';
    var order = [['hour', '시주'], ['day', '일주'], ['month', '월주'], ['year', '년주']];
    order.forEach(function (o) {
      var p = r.pillars[o[0]];
      var col = el('div', 'pillar' + (o[0] === 'day' ? ' me' : ''));
      col.appendChild(el('div', 'pillar-label', o[1]));
      if (!p) {
        col.appendChild(el('div', 'char unknown', '?'));
        col.appendChild(el('div', 'char unknown', '?'));
        col.appendChild(el('div', 'pillar-text', '시각 모름'));
      } else {
        col.appendChild(charCell(p.hanja[0], Saju.STEMS[p.stem], p.stemElement));
        col.appendChild(charCell(p.hanja[1], Saju.BRANCHES[p.branch], p.branchElement));
        col.appendChild(el('div', 'pillar-text', p.text));
      }
      box.appendChild(col);
    });
  }

  function charCell(hanja, hangul, element) {
    var info = R.ELEMENT_INFO[element];
    var c = el('div', 'char');
    c.style.setProperty('--el', info.color);
    c.title = hangul + ' · ' + info.key + '(' + info.name + ')';
    c.appendChild(el('span', 'hanja', hanja));
    c.appendChild(el('span', 'hangul', hangul + ' · ' + info.key));
    return c;
  }

  function renderElements(r, s) {
    var box = $('elements');
    box.innerHTML = '';
    var max = Math.max.apply(null, r.counts) || 1;
    R.ELEMENT_INFO.forEach(function (info, i) {
      var row = el('div', 'el-row');
      row.appendChild(el('span', 'el-name', info.icon + ' ' + info.key + ' ' + info.name));
      var bar = el('div', 'el-bar');
      var fill = el('div', 'el-fill');
      fill.style.background = info.color;
      fill.style.width = (r.counts[i] / max * 100) + '%';
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(el('span', 'el-count', r.counts[i] + '개'));
      box.appendChild(row);
    });
    $('element-note').textContent =
      '가장 강한 기운은 ' + s.dominant.icon + ' ' + s.dominant.key + '(' + s.dominant.name + '), ' +
      '보완하면 좋은 기운은 ' + s.lucky.icon + ' ' + s.lucky.key + '(' + s.lucky.name + ')입니다.';
  }

  function renderCategories() {
    var box = $('categories');
    box.innerHTML = '';
    R.CATEGORIES.forEach(function (cat) {
      var b = el('button', 'cat-btn');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.dataset.id = cat.id;
      b.appendChild(el('span', 'cat-icon', cat.icon));
      b.appendChild(el('span', 'cat-label', cat.label));
      b.addEventListener('click', function () { selectCategory(cat.id); });
      box.appendChild(b);
    });
  }

  function selectCategory(id) {
    document.querySelectorAll('.cat-btn').forEach(function (b) {
      var on = b.dataset.id === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    var res = R.read(state.result, id, { gender: state.gender, year: 2026 });
    var box = $('reading');
    box.innerHTML = '';
    box.hidden = false;

    var head = el('div', 'reading-head');
    head.appendChild(el('h4', null, res.category.icon + ' ' + res.category.label));
    var stars = el('div', 'stars');
    stars.setAttribute('aria-label', '5점 만점에 ' + res.stars + '점');
    stars.textContent = '★★★★★'.slice(0, res.stars) + '☆☆☆☆☆'.slice(0, 5 - res.stars);
    head.appendChild(stars);
    box.appendChild(head);

    var meter = el('div', 'score');
    meter.appendChild(el('span', 'score-num', res.score + '점'));
    var bar = el('div', 'score-bar');
    var fill = el('div', 'score-fill');
    bar.appendChild(fill);
    meter.appendChild(bar);
    box.appendChild(meter);
    requestAnimationFrame(function () { fill.style.width = res.score + '%'; });

    res.paragraphs.forEach(function (t) { box.appendChild(el('p', null, t)); });

    var tips = el('ul', 'tips');
    res.tips.forEach(function (t) { tips.appendChild(el('li', null, t)); });
    box.appendChild(tips);

    box.classList.remove('pop');
    void box.offsetWidth;
    box.classList.add('pop');
    if (window.innerWidth < 860) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('btn-restart').addEventListener('click', function () { show('screen-input'); });
})();
