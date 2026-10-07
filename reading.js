/*
 * 사주 해석 모듈 (브라우저 전역 객체 SajuReading)
 * 계산 결과(Saju.calculate)를 받아 대표 속성과 부문별 운세 문장을 만듭니다.
 * 명리학의 일반적인 해석 규칙(일간 성향, 오행 분포, 십성 구성, 신강·신약)을 조합한 규칙 기반 해석입니다.
 */
(function (global) {
  'use strict';

  // 일간(태어난 날의 천간) = 나 자신을 상징하는 대표 속성
  var DAY_MASTERS = [
    { name: '큰 나무', icon: '🌳', element: '목', keyword: '곧게 뻗는 리더',
      desc: '하늘을 향해 곧게 자라는 큰 나무처럼 목표가 분명하고 추진력이 강합니다. 정의감과 자존심이 높아 한번 정한 길은 끝까지 밀고 나가는 편입니다.',
      love: '좋아하면 솔직하고 듬직하게 다가가는 스타일입니다. 상대를 이끌고 보호하려는 마음이 커서, 가끔은 고집을 내려놓는 여유가 관계를 더 깊게 만듭니다.',
      work: '새로운 일을 기획하고 앞장서는 자리에서 빛납니다.',
      study: '큰 목표를 세우고 꾸준히 쌓아 올리는 공부에 강합니다.' },
    { name: '꽃', icon: '🌷', element: '목', keyword: '유연하고 끈질긴 꽃',
      desc: '바람에 흔들려도 꺾이지 않는 꽃과 덩굴처럼 부드럽지만 생명력이 강합니다. 사람과 환경에 잘 적응하고 섬세한 감각으로 관계를 넓혀 갑니다.',
      love: '다정하고 섬세하게 마음을 표현합니다. 상대의 기분을 잘 읽는 만큼 서운함도 쌓이기 쉬우니, 마음을 말로 꺼내 놓는 연습이 행운을 부릅니다.',
      work: '사람을 잇고 분위기를 살리는 협업형 역할에서 능력을 발휘합니다.',
      study: '여러 분야를 연결해 이해하는 응용력이 뛰어납니다.' },
    { name: '태양', icon: '☀️', element: '화', keyword: '세상을 비추는 태양',
      desc: '모두를 고르게 비추는 태양처럼 밝고 열정적이며 숨김이 없습니다. 표현력이 좋아 어디서든 눈에 띄고 주변에 활기를 불어넣습니다.',
      love: '감정을 숨기지 못하고 화끈하게 표현하는 타입입니다. 열정이 빨리 타오르는 만큼, 상대의 속도에 맞춰 주는 배려가 오래가는 사랑의 비결입니다.',
      work: '발표·홍보·교육처럼 사람 앞에 서는 일에서 빛납니다.',
      study: '흥미가 생기면 폭발적인 집중력을 보입니다.' },
    { name: '불꽃', icon: '🕯️', element: '화', keyword: '어둠을 밝히는 촛불',
      desc: '어둠 속을 따뜻하게 밝히는 촛불처럼 섬세하고 다정합니다. 겉은 차분해 보여도 속에는 뜨거운 열정과 집중력을 품고 있습니다.',
      love: '한 사람에게 깊이 마음을 쏟는 순정파입니다. 작은 정성과 배려로 상대를 감동시키는 힘이 있습니다.',
      work: '한 분야를 깊이 파고드는 전문직, 연구·예술 분야와 잘 맞습니다.',
      study: '한 과목을 깊게 파고드는 몰입형 공부가 잘 맞습니다.' },
    { name: '큰 산', icon: '⛰️', element: '토', keyword: '흔들리지 않는 산',
      desc: '묵직하게 자리를 지키는 큰 산처럼 믿음직하고 포용력이 큽니다. 쉽게 흔들리지 않아 주변 사람들이 기대고 의지하는 존재입니다.',
      love: '말보다 행동으로 사랑을 보여 주는 든든한 연인입니다. 표현이 서툴 수 있으니 가끔은 마음을 말로 전해 보세요.',
      work: '조직의 중심을 잡는 관리·운영·중재 역할에 적합합니다.',
      study: '느리지만 확실하게, 기초부터 단단히 다지는 공부에 강합니다.' },
    { name: '흙', icon: '🌾', element: '토', keyword: '만물을 키우는 흙',
      desc: '씨앗을 품어 길러 내는 기름진 흙처럼 실속 있고 따뜻합니다. 현실 감각이 뛰어나고 사람을 챙기고 돌보는 데 능합니다.',
      love: '상대를 세심하게 챙기는 헌신형입니다. 나 자신을 돌보는 시간도 꼭 남겨 두어야 관계가 건강하게 유지됩니다.',
      work: '사람을 기르고 돕는 교육·상담·서비스, 꼼꼼한 실무에 강합니다.',
      study: '정리와 복습을 꾸준히 하는 성실형 공부가 잘 맞습니다.' },
    { name: '바위', icon: '🪨', element: '금', keyword: '단단한 바위와 무쇠',
      desc: '단단한 바위와 무쇠처럼 결단력이 있고 의리가 강합니다. 옳고 그름이 분명해 맺고 끊음이 확실하며, 위기에 강한 타입입니다.',
      love: '한번 마음을 주면 끝까지 지키는 의리파입니다. 직설적인 말투가 상처가 되지 않도록 부드럽게 다듬으면 매력이 배가됩니다.',
      work: '결단과 실행이 필요한 자리, 기술·엔지니어링·법·경영과 잘 맞습니다.',
      study: '목표가 분명할 때 집중력이 극대화됩니다.' },
    { name: '보석', icon: '💎', element: '금', keyword: '빛나는 보석',
      desc: '잘 다듬어진 보석처럼 섬세하고 감각이 예리합니다. 완성도를 중시하고 자기 관리가 철저하며, 남다른 미적 감각을 지녔습니다.',
      love: '이상형이 분명하고 연애에서도 품격을 중시합니다. 작은 말 한마디에 예민할 수 있으니 상대의 진심을 먼저 믿어 주세요.',
      work: '디자인·금융·분석처럼 정밀함과 감각이 필요한 일에서 빛납니다.',
      study: '꼼꼼한 정리와 완벽한 이해를 추구하는 공부 스타일입니다.' },
    { name: '바다', icon: '🌊', element: '수', keyword: '넓고 깊은 바다',
      desc: '모든 물을 받아들이는 바다처럼 포용력이 크고 지혜롭습니다. 자유로운 사고와 넓은 시야로 큰 흐름을 읽는 능력이 있습니다.',
      love: '상대를 넓게 이해하고 자유를 존중하는 연인입니다. 속마음을 잘 드러내지 않으니 가끔은 깊은 이야기를 나눠 보세요.',
      work: '기획·전략·무역·IT처럼 큰 그림을 그리는 일에 잘 맞습니다.',
      study: '넓게 보고 원리를 꿰뚫는 이해형 공부에 강합니다.' },
    { name: '비', icon: '🌧️', element: '수', keyword: '촉촉한 빗물',
      desc: '대지를 적시는 빗물처럼 감수성이 풍부하고 직관이 뛰어납니다. 조용히 스며들어 주변을 변화시키는 부드러운 영향력을 지녔습니다.',
      love: '상대의 마음을 섬세하게 알아차리는 공감형 연인입니다. 혼자 걱정을 키우지 말고 솔직하게 대화하는 것이 좋습니다.',
      work: '연구·상담·예술·기획처럼 직관과 아이디어가 필요한 일에 잘 맞습니다.',
      study: '조용한 환경에서 깊이 생각할 때 이해력이 높아집니다.' }
  ];

  // 오행별 상징
  var ELEMENT_INFO = [
    { key: '목', name: '나무', icon: '🌳', color: '#3fae6b', luckyColor: '초록색', numbers: '3, 8', direction: '동쪽', season: '봄', organ: '간·담·눈', food: '푸른 잎채소와 신맛 나는 과일' },
    { key: '화', name: '불', icon: '🔥', color: '#e5533d', luckyColor: '빨간색', numbers: '2, 7', direction: '남쪽', season: '여름', organ: '심장·혈액순환', food: '쓴맛 나는 차와 붉은 채소' },
    { key: '토', name: '흙', icon: '⛰️', color: '#c99a3b', luckyColor: '노란색·베이지', numbers: '5, 10', direction: '중앙', season: '환절기', organ: '위장·소화기', food: '단맛 나는 곡물과 뿌리채소' },
    { key: '금', name: '쇠·바위', icon: '🪨', color: '#9aa3b2', luckyColor: '흰색·금색', numbers: '4, 9', direction: '서쪽', season: '가을', organ: '폐·호흡기·피부', food: '매운맛 나는 양념과 흰 음식' },
    { key: '수', name: '물', icon: '💧', color: '#3a7bd5', luckyColor: '검정·남색', numbers: '1, 6', direction: '북쪽', season: '겨울', organ: '신장·방광', food: '짠맛 나는 해조류와 검은콩' }
  ];

  var GOD_NAMES = ['비겁(나와 같은 기운)', '식상(표현·재능)', '재성(재물)', '관성(직장·명예)', '인성(학문·도움)'];

  var CATEGORIES = [
    { id: 'love', label: '연애운', icon: '💘' },
    { id: 'money', label: '금전운', icon: '💰' },
    { id: 'career', label: '직장운', icon: '💼' },
    { id: 'study', label: '학업운', icon: '📚' },
    { id: 'health', label: '건강운', icon: '🍀' },
    { id: 'year', label: '2026 올해 운세', icon: '🐎' }
  ];

  function level(n) { return n === 0 ? 0 : (n <= 2 ? 1 : 2); }
  function clampScore(s) { return Math.max(35, Math.min(98, Math.round(s))); }

  // 용신(도움이 되는 오행)을 단순화해 고릅니다.
  function luckyElement(r) {
    var me = r.dayMasterElement;
    if (r.strength === 'strong') return (me + 1) % 5;      // 기운을 빼 주는 식상
    if (r.strength === 'weak') return (me + 4) % 5;        // 나를 생해 주는 인성
    return r.weakest;
  }

  function summary(r) {
    var dm = DAY_MASTERS[r.dayMaster];
    var dom = ELEMENT_INFO[r.dominant];
    var weak = ELEMENT_INFO[r.weakest];
    var strengthText = {
      strong: '나의 기운이 강한 신강(身强) 사주로, 스스로 길을 개척하는 힘이 있습니다.',
      weak: '주변 기운이 강한 신약(身弱) 사주로, 좋은 사람과 환경을 만나면 크게 성장합니다.',
      balanced: '기운이 비교적 고르게 균형 잡힌 사주로, 상황에 맞춰 유연하게 대처합니다.'
    }[r.strength];
    return {
      dayMaster: dm,
      dominant: dom,
      weakest: weak,
      lucky: ELEMENT_INFO[luckyElement(r)],
      strengthText: strengthText
    };
  }

  function luckyTips(r) {
    var e = ELEMENT_INFO[luckyElement(r)];
    return [
      '행운의 오행: ' + e.icon + ' ' + e.key + '(' + e.name + ')',
      '행운의 색: ' + e.luckyColor,
      '행운의 숫자: ' + e.numbers,
      '행운의 방향: ' + e.direction
    ];
  }

  function readLove(r, gender) {
    var g = r.gods;
    var dm = DAY_MASTERS[r.dayMaster];
    var partner, partnerName;
    if (gender === 'male') { partner = g[2]; partnerName = '재성'; }
    else if (gender === 'female') { partner = g[3]; partnerName = '관성'; }
    else { partner = Math.max(g[2], g[3]); partnerName = '재성·관성'; }
    var p = [dm.love];
    p.push([
      '사주에 인연을 뜻하는 ' + partnerName + '이 드러나지 않아, 억지로 찾기보다 취미·모임처럼 자연스러운 자리에서 인연이 다가오는 타입입니다. 서두르지 않을수록 좋은 사람을 만납니다.',
      '인연을 뜻하는 ' + partnerName + '이 알맞게 자리 잡아 연애 감각이 안정적입니다. 지금 곁의 인연이나 가까운 관계에서 좋은 흐름이 이어집니다.',
      '인연을 뜻하는 ' + partnerName + '이 많아 이성에게 인기가 많은 편입니다. 다만 선택지가 많을수록 고민도 커지니, 마음이 가는 한 사람에게 집중할 때 운이 열립니다.'
    ][level(partner)]);
    if (g[1] >= 2) p.push('표현력을 뜻하는 식상이 살아 있어 말과 센스로 상대의 마음을 사로잡는 매력이 있습니다.');
    if (g[0] >= 3) p.push('자기 주관이 뚜렷해 연애에서도 주도권을 쥐려는 경향이 있습니다. 상대의 의견을 한 번 더 들어 주면 다툼이 줄어듭니다.');
    var score = 60 + level(partner) * 10 + (g[1] >= 2 ? 8 : 0) - (g[0] >= 3 ? 6 : 0) + (r.dayMaster % 3) * 3;
    return { score: score, paragraphs: p };
  }

  function readMoney(r) {
    var g = r.gods;
    var wealth = g[2];
    var p = [];
    p.push([
      '사주에 재물을 뜻하는 재성이 드러나지 않습니다. 돈을 쫓기보다 실력과 이름값을 먼저 쌓으면 재물이 뒤따라오는 구조입니다. 무리한 투자보다 꾸준한 저축이 유리합니다.',
      '재물을 뜻하는 재성이 적당히 있어 벌고 쓰는 균형이 좋은 편입니다. 계획적인 소비 습관만 지키면 재산이 차곡차곡 쌓입니다.',
      '재물을 뜻하는 재성이 풍부해 돈의 흐름을 읽는 감각이 있습니다. 기회가 많은 만큼 지출도 커질 수 있으니 들어오는 돈의 일부를 반드시 묶어 두세요.'
    ][level(wealth)]);
    if (g[1] >= 2) p.push('재능을 뜻하는 식상이 재물을 낳는 구조(식상생재)라, 나만의 기술이나 아이디어로 돈을 버는 데 강합니다. 부업이나 콘텐츠 활동도 좋습니다.');
    if (r.strength === 'weak' && wealth >= 3) p.push('다만 나의 기운에 비해 재물이 커서 부담이 될 수 있습니다. 혼자보다 믿을 수 있는 동료와 함께할 때 재물을 지키기 쉽습니다.');
    else if (r.strength === 'strong') p.push('나의 기운이 강해 큰 재물도 감당할 힘이 있습니다. 적극적으로 기회를 잡아도 좋은 사주입니다.');
    if (g[0] >= 3) p.push('같은 기운(비겁)이 많아 경쟁이나 지인과의 금전 거래로 돈이 새기 쉽습니다. 돈 거래는 문서로 분명히 하세요.');
    var score = 58 + level(wealth) * 11 + (g[1] >= 2 ? 8 : 0) + (r.strength === 'strong' ? 5 : 0) - (g[0] >= 3 ? 8 : 0);
    return { score: score, paragraphs: p };
  }

  function readCareer(r) {
    var g = r.gods;
    var dm = DAY_MASTERS[r.dayMaster];
    var p = [dm.work];
    p.push([
      '조직과 규율을 뜻하는 관성이 약해, 정해진 틀보다 자율성이 보장되는 환경에서 더 잘 맞습니다. 전문 기술, 프리랜서, 창업도 좋은 선택지입니다.',
      '조직과 명예를 뜻하는 관성이 알맞게 있어 책임감 있게 맡은 일을 해내고 인정받는 흐름입니다. 조직 안에서 차근차근 승진하는 운입니다.',
      '관성이 많아 책임과 기대를 많이 받는 사주입니다. 리더 자리에 오르기 쉽지만 스트레스도 크니, 일과 휴식의 경계를 분명히 하세요.'
    ][level(g[3])]);
    if (g[4] >= 2) p.push('도움과 학문을 뜻하는 인성이 있어 자격증·학위가 커리어에 큰 힘이 되고, 윗사람의 도움을 받기 쉽습니다.');
    if (g[1] >= 3) p.push('표현과 재능을 뜻하는 식상이 강해 기획·창작·말하는 일에서 두각을 나타냅니다. 다만 윗사람과 의견 충돌이 생기지 않도록 말을 한 번 더 고르세요.');
    var score = 60 + level(g[3]) * 9 + (g[4] >= 2 ? 8 : 0) + (r.strength === 'balanced' ? 6 : 0);
    return { score: score, paragraphs: p };
  }

  function readStudy(r) {
    var g = r.gods;
    var dm = DAY_MASTERS[r.dayMaster];
    var p = [dm.study];
    p.push([
      '학문을 뜻하는 인성이 약해 이론을 오래 붙잡는 것보다 직접 해 보며 익히는 실습형 공부가 효과적입니다. 문제를 많이 풀어 보며 감을 잡으세요.',
      '학문을 뜻하는 인성이 알맞게 있어 배우는 것을 즐기고 이해력이 좋습니다. 좋은 선생님이나 멘토를 만나면 실력이 빠르게 오릅니다.',
      '인성이 풍부해 지식을 흡수하는 능력이 뛰어납니다. 다만 생각이 많아 실행이 늦어질 수 있으니, 계획보다 시작을 먼저 하는 습관을 들이세요.'
    ][level(g[4])]);
    if (g[1] >= 2) p.push('식상이 있어 배운 것을 말과 글로 풀어내는 힘이 좋습니다. 친구에게 설명해 주는 방식으로 공부하면 기억에 오래 남습니다.');
    if (g[3] >= 2) p.push('관성의 기운 덕분에 시험·평가에서 실력을 제대로 발휘하는 편입니다. 목표 시험을 정해 두면 동기 부여가 확실합니다.');
    if (g[2] >= 3) p.push('재성이 강해 공부보다 현실적인 일에 관심이 쏠리기 쉽습니다. 공부의 목적을 구체적인 목표(진로·자격)와 연결해 보세요.');
    var score = 60 + level(g[4]) * 10 + (g[1] >= 2 ? 6 : 0) + (g[3] >= 2 ? 6 : 0) - (g[2] >= 3 ? 6 : 0);
    return { score: score, paragraphs: p };
  }

  function readHealth(r) {
    var weak = ELEMENT_INFO[r.weakest];
    var strong = ELEMENT_INFO[r.dominant];
    var p = [];
    p.push('사주에서 가장 강한 기운은 ' + strong.icon + ' ' + strong.key + '(' + strong.name + ')입니다. 이 기운이 넘치면 ' + strong.organ + '에 무리가 가기 쉬우니 과로를 피하세요.');
    if (r.counts[r.weakest] === 0) {
      p.push(weak.icon + ' ' + weak.key + '(' + weak.name + ') 기운이 사주에 없어 ' + weak.organ + ' 쪽이 상대적으로 약할 수 있습니다. ' + weak.food + ' 같은 음식을 자주 챙겨 드세요.');
    } else {
      p.push('가장 약한 기운은 ' + weak.icon + ' ' + weak.key + '(' + weak.name + ')입니다. ' + weak.organ + ' 건강을 꾸준히 살피고, ' + weak.food + ' 같은 음식을 챙기면 균형에 도움이 됩니다.');
    }
    p.push({
      strong: '기운이 강해 체력이 좋은 편이지만, 무리해도 괜찮다고 여기기 쉽습니다. 땀을 내는 운동으로 넘치는 기운을 풀어 주세요.',
      weak: '기운을 아껴 써야 하는 사주입니다. 충분한 수면과 규칙적인 식사가 무엇보다 중요합니다.',
      balanced: '오행의 균형이 비교적 좋아 꾸준한 생활 습관만 유지해도 건강을 지키기 쉽습니다.'
    }[r.strength]);
    var spread = Math.max.apply(null, r.weighted) - Math.min.apply(null, r.weighted);
    var score = 88 - spread * 5 + (r.strength === 'balanced' ? 6 : 0);
    return { score: score, paragraphs: p };
  }

  function readYear(r, targetYear) {
    var inf = global.Saju.yearInfluence(r.dayMaster, targetYear);
    var p = [];
    var head = targetYear + '년은 ' + inf.pillar.text + '(' + inf.pillar.hanja + ')년, 붉은 말의 해입니다. ';
    var texts = [
      '나와 같은 기운이 들어오는 해라 자신감과 추진력이 커집니다. 새로운 도전을 시작하기 좋지만, 경쟁자도 함께 늘어나니 협력할 사람을 잘 고르세요.',
      '나의 재능과 표현력이 꽃피는 해입니다. 하고 싶은 말을 하고 만들고 싶은 것을 만들면 주목받습니다. 말실수만 조심하면 좋은 결과가 따릅니다.',
      '재물과 결실의 기운이 들어오는 해입니다. 노력한 만큼 보상이 따르고 금전 기회도 늘어납니다. 기회가 왔을 때 망설이지 마세요.',
      '책임과 명예의 기운이 들어오는 해입니다. 승진·합격·새 직책처럼 인정받을 일이 생기지만 부담도 커지니 건강 관리를 함께 하세요.',
      '도움과 배움의 기운이 들어오는 해입니다. 좋은 스승이나 귀인을 만나고 공부·자격증에 유리합니다. 계약과 문서 운도 좋습니다.'
    ];
    p.push(head + texts[inf.group]);
    var fire = 1; // 병오년은 화 기운이 매우 강함
    var me = r.dayMasterElement;
    if (me === 4) p.push('물(수)의 기운인 당신에게 강한 불의 해는 재물의 기회이자 긴장의 해입니다. 큰 결정은 상반기보다 가을 이후에 내리면 안정적입니다.');
    else if (me === 3) p.push('쇠(금)의 기운인 당신에게 불의 해는 단련의 시간입니다. 압박이 있어도 그만큼 단단해지고 이름을 알리게 됩니다.');
    else if (me === fire) p.push('불의 기운이 겹치는 해라 에너지가 넘칩니다. 열정이 지나쳐 성급해지지 않도록 속도를 조절하세요.');
    else if (me === 0) p.push('나무(목)의 기운인 당신이 불을 피워 내는 해라 재능이 세상에 드러납니다. 체력 소모가 크니 휴식도 계획에 넣으세요.');
    else p.push('흙(토)의 기운인 당신에게 불은 든든한 지원군입니다. 주변의 도움이 많고 일이 순조롭게 풀리는 해입니다.');
    var base = [72, 78, 80, 70, 82][inf.group];
    var score = base + (r.counts[1] === 0 ? 6 : 0) - (r.counts[1] >= 4 ? 8 : 0);
    return { score: score, paragraphs: p };
  }

  function read(r, categoryId, options) {
    options = options || {};
    var res;
    switch (categoryId) {
      case 'love': res = readLove(r, options.gender); break;
      case 'money': res = readMoney(r); break;
      case 'career': res = readCareer(r); break;
      case 'study': res = readStudy(r); break;
      case 'health': res = readHealth(r); break;
      case 'year': res = readYear(r, options.year || 2026); break;
      default: throw new Error('unknown category ' + categoryId);
    }
    var score = clampScore(res.score);
    var cat = CATEGORIES.filter(function (c) { return c.id === categoryId; })[0];
    return {
      category: cat,
      score: score,
      stars: Math.max(1, Math.min(5, Math.round(score / 20))),
      paragraphs: res.paragraphs,
      tips: luckyTips(r)
    };
  }

  global.SajuReading = {
    DAY_MASTERS: DAY_MASTERS,
    ELEMENT_INFO: ELEMENT_INFO,
    GOD_NAMES: GOD_NAMES,
    CATEGORIES: CATEGORIES,
    summary: summary,
    read: read
  };
})(typeof window !== 'undefined' ? window : globalThis);
