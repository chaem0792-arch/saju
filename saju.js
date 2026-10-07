/*
 * 사주 계산 모듈 (브라우저 전역 객체 Saju)
 *
 * - 입력 시각은 한국 표준시(KST, UTC+9)로 간주합니다.
 * - 년주·월주는 태양 황경으로 절기(입춘 등)를 계산해 나눕니다.
 *   (Meeus 저정밀 공식, 실제 절입 시각과 수 분 이내 오차)
 * - 일주는 율리우스 적일(JDN)로 60갑자를 셉니다.
 * - 시주는 한국 경도(약 127.5°E) 보정 30분을 선택 적용합니다.
 *   보정 시 자시는 23:30~01:29, 23:30 이후 출생은 다음 날 일주를 씁니다.
 */
(function (global) {
  'use strict';

  var STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  var BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

  // 오행: 0 목, 1 화, 2 토, 3 금, 4 수
  var ELEMENTS = ['목', '화', '토', '금', '수'];
  var STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  var BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  // 지지의 본기(정기) 천간 — 음양 판단과 십성 계산에 사용
  var BRANCH_MAIN_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];

  function mod(n, m) { return ((n % m) + m) % m; }

  // 그레고리력 날짜 → 율리우스 적일(정오 기준 정수)
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
      - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  // 태양의 겉보기 황경(도)
  function sunLongitude(jd) {
    var T = (jd - 2451545.0) / 36525;
    var rad = Math.PI / 180;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * rad;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
      + 0.000289 * Math.sin(3 * M);
    var omega = (125.04 - 1934.136 * T) * rad;
    return mod(L0 + C - 0.00569 - 0.00478 * Math.sin(omega), 360);
  }

  function addDays(y, m, d, n) {
    var t = new Date(Date.UTC(y, m - 1, d + n));
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }

  function pillar(stem, branch) {
    return {
      stem: stem,
      branch: branch,
      text: STEMS[stem] + BRANCHES[branch],
      hanja: STEMS_HANJA[stem] + BRANCHES_HANJA[branch],
      stemElement: STEM_ELEMENT[stem],
      branchElement: BRANCH_ELEMENT[branch]
    };
  }

  // 일간 기준 십성 그룹: 0 비겁, 1 식상, 2 재성, 3 관성, 4 인성
  function tenGodGroup(dayStem, otherStem) {
    var me = STEM_ELEMENT[dayStem];
    var other = STEM_ELEMENT[otherStem];
    return mod(other - me, 5);
  }

  /**
   * @param {object} input { year, month, day, hour, minute, timeKnown, correctLongitude }
   */
  function calculate(input) {
    var y = input.year, m = input.month, d = input.day;
    var hour = input.timeKnown ? input.hour : 12;
    var minute = input.timeKnown ? input.minute : 0;

    // KST → UTC 율리우스일
    var jd = jdn(y, m, d) - 0.5 + (hour - 9) / 24 + minute / 1440;
    var lon = sunLongitude(jd);

    // 년주: 입춘(황경 315°) 기준
    var sajuYear = y;
    if (m <= 2 && lon < 315 && lon > 240) sajuYear = y - 1;
    var yearStem = mod(sajuYear - 4, 10);
    var yearBranch = mod(sajuYear - 4, 12);

    // 월주: 입춘부터 30°마다 한 달 (0 = 인월)
    var monthIdx = Math.floor(mod(lon - 315, 360) / 30);
    var monthBranch = mod(monthIdx + 2, 12);
    var monthStem = mod((yearStem % 5) * 2 + 2 + monthIdx, 10);

    // 시주(경도 보정 포함)와 일주
    var dayDate = { y: y, m: m, d: d };
    var hourPillar = null;
    if (input.timeKnown) {
      var total = hour * 60 + minute - (input.correctLongitude ? 30 : 0);
      if (total < 0) {
        total += 1440;
        dayDate = addDays(y, m, d, -1);
      }
      var hourBranch = Math.floor((total + 60) / 120) % 12;
      // 23시(보정 후) 이후는 다음 날 자시로 보고 일주를 넘깁니다.
      if (total >= 23 * 60) dayDate = addDays(dayDate.y, dayDate.m, dayDate.d, 1);
      var dayIdxForHour = mod(jdn(dayDate.y, dayDate.m, dayDate.d) + 49, 60);
      var hourStem = mod((dayIdxForHour % 10 % 5) * 2 + hourBranch, 10);
      hourPillar = pillar(hourStem, hourBranch);
    }

    var dayIdx = mod(jdn(dayDate.y, dayDate.m, dayDate.d) + 49, 60);
    var dayPillar = pillar(dayIdx % 10, dayIdx % 12);
    var yearPillar = pillar(yearStem, yearBranch);
    var monthPillar = pillar(monthStem, monthBranch);

    var pillars = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };

    // 오행 분포 (월지는 계절의 힘이 커서 가중치 2)
    var counts = [0, 0, 0, 0, 0];
    var weighted = [0, 0, 0, 0, 0];
    var gods = [0, 0, 0, 0, 0];
    var dayStem = dayPillar.stem;
    ['year', 'month', 'day', 'hour'].forEach(function (key) {
      var p = pillars[key];
      if (!p) return;
      counts[p.stemElement]++;
      counts[p.branchElement]++;
      weighted[p.stemElement] += 1;
      weighted[p.branchElement] += key === 'month' ? 2 : 1;
      if (key !== 'day') gods[tenGodGroup(dayStem, p.stem)]++;
      gods[tenGodGroup(dayStem, BRANCH_MAIN_STEM[p.branch])] += key === 'month' ? 2 : 1;
    });

    var dominant = 0, weakest = 0;
    for (var i = 1; i < 5; i++) {
      if (weighted[i] > weighted[dominant]) dominant = i;
      if (weighted[i] < weighted[weakest]) weakest = i;
    }

    // 신강·신약: 나를 돕는 비겁+인성 대 나머지
    var support = gods[0] + gods[4];
    var drain = gods[1] + gods[2] + gods[3];
    var strength = support > drain + 1 ? 'strong' : (drain > support + 1 ? 'weak' : 'balanced');

    return {
      input: input,
      sajuYear: sajuYear,
      animal: ANIMALS[yearBranch],
      sunLongitude: lon,
      pillars: pillars,
      dayMaster: dayStem,
      dayMasterElement: STEM_ELEMENT[dayStem],
      dayMasterYang: dayStem % 2 === 0,
      counts: counts,
      weighted: weighted,
      dominant: dominant,
      weakest: weakest,
      gods: gods,
      strength: strength
    };
  }

  // 특정 해(예: 2026 병오년)의 천간이 일간에게 어떤 십성인지
  function yearInfluence(dayStem, targetYear) {
    var stem = mod(targetYear - 4, 10);
    var branch = mod(targetYear - 4, 12);
    return {
      pillar: pillar(stem, branch),
      group: tenGodGroup(dayStem, stem),
      branchGroup: tenGodGroup(dayStem, BRANCH_MAIN_STEM[branch])
    };
  }

  global.Saju = {
    STEMS: STEMS,
    BRANCHES: BRANCHES,
    ELEMENTS: ELEMENTS,
    STEM_ELEMENT: STEM_ELEMENT,
    calculate: calculate,
    yearInfluence: yearInfluence,
    jdn: jdn,
    sunLongitude: sunLongitude
  };
})(typeof window !== 'undefined' ? window : globalThis);
