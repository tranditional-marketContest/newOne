export type Mood = "데이트" | "구경" | "맛집" | "산책";
export type Budget = "알뜰" | "보통" | "푸짐";

export type Shop = {
  id: string;
  name: string;
  category: string;
  stars: 0 | 1 | 2 | 3;
  x: number;
  y: number;
  note: string;
  moods: Mood[];
  budget: Budget[];
  indoor: boolean;
  crowd: "한산" | "보통" | "혼잡";
  kind?: "place";
};

export type Entrance = {
  id: string;
  name: string;
  x: number;
  y: number;
  faceX: number;
  faceY: number;
};

export type Step = {
  text: string;
};

export type CourseResult = {
  modeLabel: string;
  title: string;
  entrance: Entrance;
  shops: Shop[];
  steps: Step[];
};

export type Answers = {
  age: "20대" | "30-40대" | "50대 이상";
  budget: Budget;
  company: "혼자" | "둘" | "여럿";
  weather: "맑음" | "흐림" | "비" | "추움";
  mood: Mood;
};

function spot(t: number, lane: -1 | 0 | 1 = 0) {
  return {
    x: Math.round((32 + t * 18 - lane * 1.8) * 10) / 10,
    y: Math.round((38 + t * 34 + lane * 1.2) * 10) / 10,
  };
}

function shop(
  id: string,
  name: string,
  category: string,
  stars: Shop["stars"],
  t: number,
  lane: -1 | 0 | 1,
  note: string,
  moods: Mood[],
  budget: Budget[],
  indoor: boolean,
  crowd: Shop["crowd"],
): Shop {
  return { id, name, category, stars, ...spot(t, lane), note, moods, budget, indoor, crowd };
}

export const entrances: Entrance[] = [
  { id: "n1", name: "1번 입구", ...spot(-0.02), faceX: 0.5, faceY: 0.86 },
  { id: "n2", name: "2번 입구", ...spot(0.08, -1), faceX: 0.7, faceY: 0.7 },
  { id: "n3", name: "3번 입구", ...spot(0.32, -1), faceX: 0.85, faceY: 0.4 },
  { id: "n4", name: "4번 입구", ...spot(0.62, -1), faceX: 0.8, faceY: 0.5 },
  { id: "n5", name: "5번 입구", ...spot(0.98), faceX: -0.5, faceY: -0.86 },
  { id: "n6", name: "6번 입구", ...spot(0.9, 1), faceX: -0.7, faceY: -0.6 },
  { id: "n7", name: "7번 입구", ...spot(0.5, 1), faceX: -0.9, faceY: 0.2 },
  { id: "n8", name: "8번 입구", ...spot(0.16, 1), faceX: -0.4, faceY: 0.9 },
];

export const shops: Shop[] = [
  shop("sillim-tteok", "신림당떡집", "떡", 3, 0.08, 0, "당일 소진형", ["구경", "데이트"], ["알뜰", "보통"], true, "보통"),
  shop("dongnimmun", "독립문떡집", "떡", 3, 0.28, 1, "당일 소진형", ["구경", "산책"], ["알뜰"], true, "한산"),
  shop("bethlehem", "베들레헴떡집", "떡", 3, 0.22, 0, "당일 소진형", ["데이트", "산책"], ["알뜰", "보통"], true, "한산"),
  shop("tteok-cart", "떡수레", "떡", 3, 0.45, 0, "당일 소진형", ["산책", "데이트"], ["알뜰", "보통"], false, "보통"),
  shop("mom", "엄마손반찬", "반찬", 3, 0.3, 0, "당일 소진형", ["구경", "맛집"], ["알뜰", "보통"], true, "보통"),
  shop("jinmi", "진미웰빙반찬", "반찬", 3, 0.12, -1, "당일 소진형", ["구경"], ["알뜰", "보통"], true, "한산"),
  shop("jindo", "진도반찬", "반찬", 3, 0.24, 1, "당일 소진형", ["구경"], ["알뜰"], true, "한산"),
  shop("sunok", "순옥이네연변반찬가게", "반찬", 3, 0.33, -1, "당일 소진형", ["맛집", "데이트"], ["보통"], true, "보통"),
  shop("fruit", "과일나라", "청과·채소", 3, 0.15, 0, "당일 소진형", ["산책", "데이트"], ["알뜰", "보통"], false, "한산"),
  shop("younggwang", "영광과일", "청과·채소", 3, 0.64, 0, "당일 소진형", ["구경", "산책"], ["알뜰", "보통"], false, "보통"),
  shop("goeun", "고은이네", "청과·채소", 3, 0.18, 1, "당일 소진형", ["산책", "구경"], ["알뜰"], false, "한산"),
  shop("veggie", "소문난야채", "청과·채소", 3, 0.42, -1, "당일 소진형", ["구경"], ["알뜰", "보통"], false, "보통"),
  shop("geonwoo", "건우축산", "정육·수산", 2, 0.82, 0, "정육", ["구경", "맛집"], ["보통", "푸짐"], true, "보통"),
  shop("seongam", "성암축산정육점식당", "정육·수산", 2, 0.6, 1, "정육과 식사", ["맛집"], ["푸짐"], true, "한산"),
  shop("mokpo", "목포수산", "정육·수산", 2, 0.74, -1, "수산", ["구경", "맛집"], ["보통", "푸짐"], true, "보통"),
  shop("hotteok", "신원 호떡", "분식·간식", 2, 0.38, 0, "따뜻한 호떡", ["데이트", "산책"], ["알뜰", "보통"], false, "혼잡"),
  shop("oddeok", "오떡순", "분식·간식", 2, 0.7, 0, "떡볶이와 순대", ["산책", "맛집"], ["알뜰", "보통"], true, "한산"),
  shop("tangsuyuk", "시장 탕수육", "분식·간식", 2, 0.72, 1, "탕수육", ["맛집", "데이트"], ["보통", "푸짐"], true, "보통"),
  shop("flame", "불꽃닭강정", "닭강정", 1, 0.52, 0, "주문하면 바로 조리", ["데이트", "맛집"], ["보통", "푸짐"], true, "혼잡"),
  shop("song", "송이네닭집", "닭강정", 1, 0.48, 1, "주문하면 바로 조리", ["맛집", "데이트"], ["보통", "푸짐"], true, "보통"),
  shop("ajeossi", "아저씨강정", "닭강정", 1, 0.66, 1, "주문하면 바로 조리", ["맛집"], ["보통"], true, "한산"),
  shop("jokbal", "명성왕족발", "순대·족발·전", 2, 0.76, 0, "족발 위주", ["맛집"], ["푸짐"], true, "혼잡"),
  shop("sundae-shop", "소문난순대집", "순대·족발·전", 2, 0.8, 1, "포장 순대", ["맛집", "구경"], ["알뜰", "보통"], true, "보통"),
  shop("sundae-guk", "소문난순대국", "순대·족발·전", 2, 0.88, 0, "순대국", ["맛집"], ["보통", "푸짐"], true, "보통"),
  shop("jangteo", "장터순대국", "순대·족발·전", 2, 0.86, -1, "순대국", ["맛집"], ["보통"], true, "한산"),
  shop("jeon", "두명전집", "순대·족발·전", 2, 0.58, 0, "전", ["맛집", "데이트"], ["보통", "푸짐"], true, "한산"),
  shop("china", "중국식품", "식료품", 0, 0.36, 1, "유통기한이 길어 코스에 넣지 않습니다.", ["구경"], ["알뜰", "보통"], true, "한산"),
  shop("jeongjong", "정종중국식품", "식료품", 0, 0.55, -1, "유통기한이 길어 코스에 넣지 않습니다.", ["구경"], ["알뜰"], true, "한산"),
  shop("oil", "신림기름집", "식료품", 0, 0.92, 1, "유통기한이 길어 코스에 넣지 않습니다.", ["구경"], ["알뜰", "보통"], true, "한산"),
  {
    id: "stream-fountain",
    name: "별빛내린천 분수",
    category: "수변",
    stars: 3,
    x: 44.5,
    y: 48.5,
    note: "천변 분수",
    moods: ["데이트", "구경", "산책"],
    budget: ["알뜰", "보통", "푸짐"],
    indoor: false,
    crowd: "한산",
    kind: "place",
  },
  {
    id: "music-fountain",
    name: "음악분수",
    category: "수변",
    stars: 3,
    x: 56.5,
    y: 61.5,
    note: "정오, 오후 7시, 오후 8시",
    moods: ["데이트", "구경", "산책"],
    budget: ["알뜰", "보통", "푸짐"],
    indoor: false,
    crowd: "보통",
    kind: "place",
  },
  {
    id: "footbridge",
    name: "육교",
    category: "수변",
    stars: 3,
    x: 63.5,
    y: 70.5,
    note: "별빛내린천을 건너는 다리",
    moods: ["데이트", "구경", "산책"],
    budget: ["알뜰", "보통", "푸짐"],
    indoor: false,
    crowd: "한산",
    kind: "place",
  },
];

const quickCourseDefs = [
  {
    id: "date",
    title: "연인과의 데이트",
    options: [
      { entranceId: "n1", shopIds: ["bethlehem", "fruit", "tangsuyuk", "jeon"], placeIds: ["music-fountain"] },
      { entranceId: "n2", shopIds: ["tteok-cart", "sunok", "hotteok", "song"], placeIds: ["music-fountain", "stream-fountain"] },
      { entranceId: "n8", shopIds: ["sillim-tteok", "goeun", "oddeok", "flame"], placeIds: [] },
      { entranceId: "n3", shopIds: ["bethlehem", "mom", "tangsuyuk", "ajeossi"], placeIds: ["footbridge", "music-fountain"] },
      { entranceId: "n4", shopIds: ["dongnimmun", "younggwang", "jeon", "song"], placeIds: ["stream-fountain"] },
    ],
  },
  {
    id: "tour",
    title: "관광필수코스",
    options: [
      { entranceId: "n1", shopIds: ["sillim-tteok", "mom", "younggwang", "geonwoo"], placeIds: ["stream-fountain", "music-fountain", "footbridge"] },
      { entranceId: "n2", shopIds: ["dongnimmun", "jinmi", "fruit", "mokpo"], placeIds: ["footbridge", "stream-fountain"] },
      { entranceId: "n5", shopIds: ["bethlehem", "jindo", "goeun", "geonwoo"], placeIds: [] },
      { entranceId: "n6", shopIds: ["tteok-cart", "mom", "veggie", "sundae-shop"], placeIds: ["music-fountain"] },
      { entranceId: "n8", shopIds: ["sillim-tteok", "sunok", "younggwang", "mokpo"], placeIds: ["footbridge"] },
    ],
  },
  {
    id: "food",
    title: "맛집탐방코스",
    options: [
      { entranceId: "n5", shopIds: ["sundae-guk", "seongam", "tangsuyuk", "song"], placeIds: [] },
      { entranceId: "n6", shopIds: ["jokbal", "geonwoo", "oddeok", "ajeossi"], placeIds: [] },
      { entranceId: "n4", shopIds: ["jangteo", "mokpo", "hotteok", "song"], placeIds: ["music-fountain"] },
      { entranceId: "n7", shopIds: ["jeon", "seongam", "tangsuyuk", "mom"], placeIds: [] },
      { entranceId: "n3", shopIds: ["sundae-shop", "geonwoo", "oddeok", "sunok"], placeIds: ["stream-fountain"] },
    ],
  },
  {
    id: "stroll",
    title: "마실코스",
    options: [
      { entranceId: "n1", shopIds: ["fruit", "tteok-cart", "oddeok", "jeon"], placeIds: ["stream-fountain", "footbridge"] },
      { entranceId: "n8", shopIds: ["goeun", "bethlehem", "hotteok"], placeIds: ["music-fountain"] },
      { entranceId: "n2", shopIds: ["younggwang", "dongnimmun", "oddeok", "jeon"], placeIds: ["stream-fountain", "music-fountain", "footbridge"] },
      { entranceId: "n3", shopIds: ["veggie", "sillim-tteok", "tangsuyuk"], placeIds: [] },
      { entranceId: "n6", shopIds: ["fruit", "bethlehem", "oddeok", "ajeossi"], placeIds: ["footbridge", "music-fountain"] },
    ],
  },
];

export const quickCourses = quickCourseDefs.map(({ id, title }) => ({ id, title }));

function withPlaces(entrance: Entrance, picked: Shop[], placeIds: string[]) {
  const seen = new Set(picked.map((item) => item.id));
  const places = placeIds
    .map((id) => shops.find((item) => item.id === id && item.kind === "place"))
    .filter((item): item is Shop => Boolean(item) && !seen.has(item.id));
  return orderFromEntrance(entrance, [...picked, ...places]);
}

function shopById(id: string) {
  const found = shops.find((item) => item.id === id);
  if (!found) throw new Error(`없는 상점입니다: ${id}`);
  return found;
}

function entranceById(id: string) {
  const found = entrances.find((item) => item.id === id);
  if (!found) throw new Error(`없는 출입구입니다: ${id}`);
  return found;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function turnOf(dx1: number, dy1: number, dx2: number, dy2: number) {
  const scale = Math.hypot(dx1, dy1) * Math.hypot(dx2, dy2);
  if (scale < 0.001) return "직진";
  const sin = (dx1 * dy2 - dy1 * dx2) / scale;
  if (sin > 0.35) return "우회전";
  if (sin < -0.35) return "좌회전";
  return "직진";
}

export function buildSteps(entrance: Entrance, ordered: Shop[]): Step[] {
  const steps: Step[] = [];
  let prevX = entrance.x - entrance.faceX;
  let prevY = entrance.y - entrance.faceY;
  let cursor = { x: entrance.x, y: entrance.y };

  ordered.forEach((shop, index) => {
    const turn = turnOf(cursor.x - prevX, cursor.y - prevY, shop.x - cursor.x, shop.y - cursor.y);
    if (index === 0) {
      steps.push({ text: `${entrance.name}로 입장 후 ${turn}` });
    }
    steps.push({ text: turn === "직진" ? `직진하여 ${shop.name}` : `${turn} 후 ${shop.name}` });
    prevX = cursor.x;
    prevY = cursor.y;
    cursor = shop;
  });

  return steps;
}

export function buildQuickCourse(id: string): CourseResult {
  const course = quickCourseDefs.find((item) => item.id === id);
  if (!course) throw new Error(`없는 코스입니다: ${id}`);
  const option = course.options[Math.floor(Math.random() * course.options.length)];
  const entrance = entranceById(option.entranceId);
  const ordered = withPlaces(entrance, option.shopIds.map(shopById), option.placeIds);
  return {
    modeLabel: "빠른 코스 추천",
    title: course.title,
    entrance,
    shops: ordered,
    steps: buildSteps(entrance, ordered),
  };
}

function scoreShop(shopItem: Shop, answers: Answers) {
  let score = shopItem.stars * 4;
  if (shopItem.moods.includes(answers.mood)) score += 4;
  if (shopItem.budget.includes(answers.budget)) score += 2;
  if (shopItem.crowd === "한산") score += 3;
  if (shopItem.crowd === "보통") score += 1;
  if (answers.weather === "비" || answers.weather === "추움") score += shopItem.indoor ? 3 : -2;
  if (answers.weather === "맑음" && answers.mood === "산책" && !shopItem.indoor) score += 1;
  if (answers.age === "50대 이상" && shopItem.crowd === "한산") score += 2;
  if (answers.company === "혼자" && shopItem.budget.includes("알뜰")) score += 1;
  if (answers.company === "여럿" && shopItem.budget.includes("푸짐")) score += 1;
  if (answers.company === "둘" && shopItem.moods.includes("데이트")) score += 1;
  return score;
}

function chooseEntrance(picked: Shop[], answers: Answers) {
  if ((answers.mood === "산책" || answers.mood === "데이트") && answers.weather !== "비") {
    return entranceById("n1");
  }
  const center = {
    x: picked.reduce((sum, item) => sum + item.x, 0) / picked.length,
    y: picked.reduce((sum, item) => sum + item.y, 0) / picked.length,
  };
  return entrances.reduce((closest, entrance) =>
    distance(entrance, center) < distance(closest, center) ? entrance : closest,
  );
}

function orderFromEntrance(entrance: Entrance, picked: Shop[]) {
  const remaining = [...picked];
  const ordered: Shop[] = [];
  let cursor: { x: number; y: number } = entrance;
  while (remaining.length > 0) {
    let nearest = 0;
    for (let index = 1; index < remaining.length; index += 1) {
      if (distance(cursor, remaining[index]) < distance(cursor, remaining[nearest])) nearest = index;
    }
    const [next] = remaining.splice(nearest, 1);
    ordered.push(next);
    cursor = next;
  }
  return ordered;
}

export function buildGeneratedCourse(title: string, entranceId: string, shopIds: string[]): CourseResult {
  const entrance = entrances.find((item) => item.id === entranceId) ?? entrances[0];
  const picked: Shop[] = [];
  const pickedPlaces: Shop[] = [];
  const seenCategories = new Set<string>();

  for (const id of shopIds) {
    const shopItem = shops.find((item) => item.id === id);
    if (!shopItem || shopItem.stars === 0) continue;
    if (shopItem.kind === "place") {
      if (!pickedPlaces.some((item) => item.id === shopItem.id) && pickedPlaces.length < 2) pickedPlaces.push(shopItem);
      continue;
    }
    if (picked.length >= 4 || seenCategories.has(shopItem.category)) continue;
    picked.push(shopItem);
    seenCategories.add(shopItem.category);
  }

  if (picked.length < 3) {
    const fillers = shops
      .filter((item) => item.kind !== "place" && item.stars > 0 && !seenCategories.has(item.category))
      .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name, "ko"));
    for (const shopItem of fillers) {
      picked.push(shopItem);
      seenCategories.add(shopItem.category);
      if (picked.length === 3) break;
    }
  }

  const ordered = withPlaces(entrance, picked, pickedPlaces.map((item) => item.id));
  return {
    modeLabel: "AI 맞춤 코스",
    title: title.trim() || "대화로 맞춘 코스",
    entrance,
    shops: ordered,
    steps: buildSteps(entrance, ordered),
  };
}

export function buildCustomCourse(answers: Answers): CourseResult {
  const limit = answers.weather === "비" || answers.age === "50대 이상" ? 3 : 4;
  const ranked = shops
    .filter((item) => item.kind !== "place" && item.stars > 0)
    .sort((a, b) => scoreShop(b, answers) - scoreShop(a, answers) || a.name.localeCompare(b.name, "ko"));
  const picked: Shop[] = [];
  const usedCategories = new Set<string>();
  let crowded = 0;

  for (const item of ranked) {
    if (usedCategories.has(item.category)) continue;
    if (item.crowd === "혼잡" && crowded >= 1) continue;
    picked.push(item);
    usedCategories.add(item.category);
    if (item.crowd === "혼잡") crowded += 1;
    if (picked.length === limit) break;
  }

  const placeIds =
    answers.weather === "비"
      ? []
      : answers.mood === "산책"
        ? ["stream-fountain", "footbridge"]
        : answers.mood === "데이트"
          ? ["music-fountain"]
          : answers.mood === "구경"
            ? ["stream-fountain"]
            : [];
  const entrance = chooseEntrance(picked, answers);
  const ordered = withPlaces(entrance, picked, placeIds);
  return {
    modeLabel: "맞춤 코스 추천",
    title: `${answers.age}, ${answers.company}, ${answers.weather}, ${answers.mood}에 맞춘 코스`,
    entrance,
    shops: ordered,
    steps: buildSteps(entrance, ordered),
  };
}
