// 신라면세점 위스키 전체 스크래핑 + 국가/지역/타입 분류
// robots.txt 허용 범위(Crawl-delay: 5) 준수. 인증/쿠키 불필요 — 공개 상품 API.
"use strict";
const https = require("https");

const CATEGORIES = { 1220: "싱글몰트", 1211: "블렌디드" };
const PAGE_SIZE = 160;
const CRAWL_DELAY_MS = 5000;

// 브랜드 -> [국가, 지역]. 스카치는 업계 통용 지역 구분 기준. 모르는 브랜드는 "미분류".
const BRAND_MAP = {
  "고든 앤 맥패일": ["스코틀랜드", "스페이사이드"], "골드바 위스키": ["한국", "-"],
  "교토 위스키": ["일본", "교토"], "글렌 스코시아": ["스코틀랜드", "캠벨타운"],
  "글렌고인": ["스코틀랜드", "하이랜드"], "글렌글라사": ["스코틀랜드", "하이랜드"],
  "글렌데브론": ["스코틀랜드", "하이랜드"], "글렌드로낙": ["스코틀랜드", "하이랜드"],
  "글렌리벳": ["스코틀랜드", "스페이사이드"], "글렌모레이": ["스코틀랜드", "스페이사이드"],
  "글렌모렌지": ["스코틀랜드", "하이랜드"], "글렌알라키": ["스코틀랜드", "스페이사이드"],
  "글렌카담": ["스코틀랜드", "하이랜드"], "글렌파클라스": ["스코틀랜드", "스페이사이드"],
  "글렌피딕": ["스코틀랜드", "스페이사이드"], "기원 위스키": ["한국", "-"],
  "뉴리프": ["한국", "-"], "니카": ["일본", "-"], "닛카 위스키": ["일본", "-"],
  "달모어": ["스코틀랜드", "하이랜드"], "달위니": ["스코틀랜드", "하이랜드"],
  "더 글렌그란트": ["스코틀랜드", "스페이사이드"], "더 레이크": ["일본", "-"],
  "더 아일라 보이즈": ["스코틀랜드", "아일라"], "더글라스랭": ["스코틀랜드", "기타(독립병입)"],
  "듀어스": ["스코틀랜드", "기타(블렌디드)"], "딘스톤": ["스코틀랜드", "하이랜드"],
  "딩글": ["아일랜드", "-"], "라가불린": ["스코틀랜드", "아일라"], "라프로익": ["스코틀랜드", "아일라"],
  "로얄브라클라": ["스코틀랜드", "하이랜드"], "로얄살루트": ["스코틀랜드", "기타(블렌디드)"],
  "로크 로몬드": ["스코틀랜드", "하이랜드"], "류카": ["일본", "-"], "마르스": ["일본", "신슈"],
  "마츠이": ["일본", "돗토리"], "맥네어스": ["스코틀랜드", "기타(블렌디드)"],
  "맥캘란": ["스코틀랜드", "스페이사이드"], "맥탈라": ["스코틀랜드", "아일라"],
  "메이커스마크": ["미국", "켄터키"], "몰트락": ["스코틀랜드", "스페이사이드"],
  "미클토어": ["스코틀랜드", "기타"], "밀크앤허니": ["이스라엘", "-"],
  "발렌타인": ["스코틀랜드", "기타(블렌디드)"], "발베니": ["스코틀랜드", "스페이사이드"],
  "발블레어": ["스코틀랜드", "하이랜드"], "버팔로 트레이스": ["미국", "켄터키"],
  "벤리악": ["스코틀랜드", "스페이사이드"], "보모어": ["스코틀랜드", "아일라"],
  "부나하벤": ["스코틀랜드", "아일라"], "부쉬밀": ["아일랜드", "-"],
  "브룩라디": ["스코틀랜드", "아일라"], "블라드녹": ["스코틀랜드", "로우랜드"],
  "사가모어": ["미국", "메릴랜드"], "산토리": ["일본", "-"], "섀클턴": ["스코틀랜드", "기타(블렌디드)"],
  "스카라버스": ["스코틀랜드", "아일라"], "스페이번": ["스코틀랜드", "스페이사이드"],
  "시그나토리 빈티지": ["스코틀랜드", "기타(독립병입)"], "시바스리갈": ["스코틀랜드", "기타(블렌디드)"],
  "신세계 L&B": ["한국", "-"], "싱글톤": ["스코틀랜드", "스페이사이드"], "씨앤씨": ["한국", "-"],
  "아녹": ["스코틀랜드", "하이랜드"], "아드모어": ["스코틀랜드", "하이랜드"],
  "아드벡": ["스코틀랜드", "아일라"], "아마하간": ["일본", "신슈"], "아케시": ["일본", "홋카이도"],
  "암룻": ["인도", "-"], "에드라두어": ["스코틀랜드", "하이랜드"], "에버펠디": ["스코틀랜드", "하이랜드"],
  "엘리먼츠 오브 아일라": ["스코틀랜드", "아일라"], "오켄토션": ["스코틀랜드", "로우랜드"],
  "올드풀트니": ["스코틀랜드", "하이랜드"], "올트모어": ["스코틀랜드", "스페이사이드"],
  "와인나라": ["기타", "수입사 자체브랜드"], "와일드무어": ["기타", "-"],
  "와일드터키": ["미국", "켄터키"], "우드포드 리저브": ["미국", "켄터키"], "우미키": ["일본", "-"],
  "위도우 제인": ["미국", "뉴욕"], "윌더니스 트레일": ["미국", "켄터키"], "인드리": ["인도", "-"],
  "잭다니엘": ["미국", "테네시"], "제임슨": ["아일랜드", "-"], "젠틀맨스 컷": ["기타", "-"],
  "조니워커": ["스코틀랜드", "기타(블렌디드)"], "주라": ["스코틀랜드", "아일랜즈"],
  "짐빔": ["미국", "켄터키"], "카노스케": ["일본", "가고시마"], "카미키": ["일본", "-"],
  "카발란": ["대만", "-"], "카이요 위스키": ["일본", "-"], "캐나디언클럽": ["캐나다", "-"],
  "컴파스 박스": ["스코틀랜드", "기타(블렌디드)"], "켄터키아울": ["미국", "켄터키"], "쿠라": ["일본", "-"],
  "쿨일라": ["스코틀랜드", "아일라"], "크라이겔라키": ["스코틀랜드", "스페이사이드"],
  "타운브랜치": ["미국", "켄터키"], "탈리스커": ["스코틀랜드", "아일랜즈"],
  "탐나불린": ["스코틀랜드", "스페이사이드"], "탐두": ["스코틀랜드", "스페이사이드"],
  "턴테이블": ["기타", "-"], "토마틴": ["스코틀랜드", "하이랜드"], "패터캐른": ["스코틀랜드", "하이랜드"],
  "퍼컬렌": ["기타", "-"], "펀다도르": ["스페인", "-"], "펄킨 위스키": ["기타", "-"],
  "페닐로페": ["미국", "켄터키"], "폴 존": ["인도", "-"], "하이랜드 파크": ["스코틀랜드", "아일랜즈(오크니)"],
  "헤븐스도어": ["미국", "테네시"], "화이트헤더": ["스코틀랜드", "기타(블렌디드)"], "히노토리": ["일본", "-"],
};

function postJson(categoryCode, page) {
  const payload = JSON.stringify({
    category: "", sort: "topSelling", size: String(PAGE_SIZE), page: page,
    text: "", within: "", query: "allCategories:" + categoryCode, pagination: "",
    condition: { brand: [], priceRange: [0, 99999999], discountRate: "0", giftYnOption: false,
      isNewProductOption: false, fastShopYnOption: false, fiveHourShopYnOption: false,
      parallelImportationOption: false, couponYnOption: false, flatPriceYnOption: false },
  });
  const body = "json=" + encodeURIComponent(payload);
  const options = {
    hostname: "www.shilladfs.com", path: "/estore/kr/ko/ajaxProducts", method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Length": Buffer.byteLength(body),
      "User-Agent": "Mozilla/5.0 (compatible; dutyfree-watch/1.0)",
    },
  };
  return new Promise(function (resolve, reject) {
    const req = https.request(options, function (res) {
      const chunks = [];
      res.on("data", function (c) { chunks.push(c); });
      res.on("end", function () {
        const data = Buffer.concat(chunks).toString("utf8");
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("파싱 실패: " + data.slice(0, 200))); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function fetchCategory(categoryCode) {
  let page = 0, all = [], total = Infinity;
  while (all.length < total) {
    const data = await postJson(categoryCode, page);
    total = data.pagination.totalNumberOfResults;
    (data.results || []).forEach(function (r) {
      all.push({
        name: r.name, brand: r.brandName, code: r.code,
        discountRate: r.discountRate, salePrice: r.userPrice ? r.userPrice.salePrice : null,
        discountPrice: r.discountPrice, stock: r.stockAvailable,
        type: CATEGORIES[categoryCode],
      });
    });
    page++;
    if (all.length < total) await sleep(CRAWL_DELAY_MS); // robots.txt Crawl-delay: 5
  }
  return all;
}

function classify(products) {
  return products.map(function (p) {
    const m = BRAND_MAP[p.brand] || ["미분류", "-"];
    return Object.assign({}, p, { country: m[0], region: m[1] });
  });
}

async function main() {
  const categoryCodes = Object.keys(CATEGORIES).map(Number);
  let all = [];
  for (const code of categoryCodes) {
    process.stderr.write("스크래핑 중: categoryCode=" + code + " (" + CATEGORIES[code] + ")\n");
    const items = await fetchCategory(code);
    all = all.concat(items);
    await sleep(CRAWL_DELAY_MS);
  }
  const classified = classify(all);
  const fs = require("fs");
  const path = require("path");
  const outDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.writeFileSync(path.join(outDir, "shilla-whisky.json"), JSON.stringify(classified, null, 2));
  process.stderr.write("완료: " + classified.length + "개 상품 -> data/shilla-whisky.json\n");
}

main().catch(function (e) { console.error(e); process.exit(1); });
