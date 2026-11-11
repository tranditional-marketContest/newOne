import { addDays, seoulToday } from "./price";
import type { MenuItem, PriceSource, Review, Store, WikiCategory } from "./types";

function prices(amounts: number[], days: number[], sources?: PriceSource[]): MenuItem["prices"] {
  const today = seoulToday();
  return amounts.map((amount, index) => ({
    amount,
    date: addDays(today, -days[index]),
    ...(sources?.[index] ? { source: sources[index] } : {}),
  }));
}

function menu(id: string, name: string, amounts: number[], days: number[], sources?: PriceSource[]): MenuItem {
  return { id, name, unit: "per_100g", prices: prices(amounts, days, sources) };
}

/** 리뷰가 없는 가게는 이름·카테고리만 둔다. */
function stall(input: { id: string; name: string; category: WikiCategory }): Store {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    hours: "",
    items: "",
    character: "",
    discount: "",
    note: "",
    photos: [],
    reviews: [],
    menus: [],
    updatedAt: "",
  };
}

function stallWithReviews(input: {
  id: string;
  name: string;
  category: WikiCategory;
  character?: string;
  menus: MenuItem[];
  reviews: Review[];
}): Store {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    hours: "",
    items: "",
    character: input.character ?? "",
    discount: "",
    note: "",
    photos: [],
    reviews: input.reviews,
    menus: input.menus,
    updatedAt: input.reviews.map((review) => review.date).sort().at(-1) ?? seoulToday(),
  };
}

export const seedStores: Store[] = [
  stall({ id: "mom-banchan", name: "엄마손반찬", category: "식자재" }),
  stall({ id: "jinmi", name: "진미웰빙반찬", category: "식자재" }),
  stall({ id: "jindo", name: "진도반찬", category: "식자재" }),
  stall({ id: "sunok", name: "순옥이네연변반찬가게", category: "식자재" }),
  stall({ id: "younggwang", name: "영광과일", category: "식자재" }),
  stall({ id: "fruit-nara", name: "과일나라", category: "식자재" }),
  stall({ id: "goeun", name: "고은이네", category: "식자재" }),
  stall({ id: "veggie", name: "소문난야채", category: "식자재" }),
  stallWithReviews({
    id: "gunwoo",
    name: "건우축산",
    category: "식자재",
    character:
      "양이 넉넉하고 담백한 고기를 소분·포장해 가는 정육점이다. 카드 결제가 되고 오전 10시부터 저녁 8시까지 연다.",
    menus: [
      menu(
        "gun-1",
        "삼겹살",
        [2800, 2900, 3000, 2850, 25000, 2750, 2800, 2950, 3000, 22000],
        [1, 3, 5, 7, 9, 2, 4, 6, 8, 10],
        ["prose", "prose", "prose", "prose", "prose", "fields", "fields", "fields", "fields", "fields"],
      ),
      menu(
        "gun-2",
        "목살",
        [2600, 2700, 2650, 2800, 18000, 2550, 2700, 2600, 2750, 19000],
        [1, 4, 6, 8, 11, 2, 5, 7, 9, 12],
        ["prose", "prose", "prose", "prose", "prose", "fields", "fields", "fields", "fields", "fields"],
      ),
      menu(
        "gun-3",
        "불고기용",
        [2400, 2500, 2360, 2600, 19800, 2440, 2560, 2400, 2520, 17600],
        [2, 5, 8, 11, 13, 3, 6, 9, 12, 14],
        ["prose", "prose", "prose", "prose", "prose", "fields", "fields", "fields", "fields", "fields"],
      ),
    ],
    reviews: [
      {
        id: "gun-r1",
        text: "건우축산에 들렀다. 삼겹살 100g이 2,800원이었다. 양이 넉넉하고 혼자 사 가기 좋다.",
        date: addDays(seoulToday(), -1),
      },
      {
        id: "gun-r2",
        text: "목살 100g 2,700원. 삼겹보다 담백하고 구워 먹기 좋다. 포장도 된다. 영업은 오전 10시부터 저녁 8시까지.",
        date: addDays(seoulToday(), -4),
      },
      {
        id: "gun-r3",
        text: "불고기용 100g 2,500원. 양념 없이 그냥 썰어 주신다. 카드 결제도 됐다.",
        date: addDays(seoulToday(), -5),
      },
      {
        id: "gun-r4",
        text: "삼겹살 100g 2,850원, 목살도 같이 샀다. 저녁에 남은 고기를 소분해 둔다.",
        date: addDays(seoulToday(), -7),
      },
      {
        id: "gun-r5",
        text: "삼겹살 100g이 25,000원이었다. 사장님이 특별한 부위라고 하셨다.",
        date: addDays(seoulToday(), -9),
      },
      {
        id: "gun-r6",
        text: "목살 100g이 18,000원이라는데 비싸 보였다. 그래도 고기는 괜찮았다.",
        date: addDays(seoulToday(), -11),
      },
      {
        id: "gun-r7",
        text: "불고기용 100g이 19,800원이라고 적혀 있어서 놀랐다. 아마 잘못 쓰신 것 같다.",
        date: addDays(seoulToday(), -13),
      },
      {
        id: "gun-r8",
        text: "",
        date: addDays(seoulToday(), -2),
        purchaseHour: "11",
        purchasedItems: "삼겹살",
      },
      {
        id: "gun-r9",
        text: "",
        date: addDays(seoulToday(), -3),
        purchaseHour: "14",
        purchasedItems: "불고기용",
      },
      {
        id: "gun-r10",
        text: "",
        date: addDays(seoulToday(), -5),
        purchaseHour: "16",
        purchasedItems: "목살",
      },
      {
        id: "gun-r11",
        text: "",
        date: addDays(seoulToday(), -6),
        purchaseHour: "10",
        purchasedItems: "삼겹살, 목살",
      },
      {
        id: "gun-r12",
        text: "",
        date: addDays(seoulToday(), -9),
        purchaseHour: "18",
        purchasedItems: "목살",
      },
      {
        id: "gun-r13",
        text: "",
        date: addDays(seoulToday(), -12),
        purchaseHour: "15",
        purchasedItems: "불고기용",
      },
      {
        id: "gun-r14",
        text: "",
        date: addDays(seoulToday(), -14),
        purchaseHour: "12",
        purchasedItems: "불고기용",
      },
    ],
  }),
  stall({ id: "seongam", name: "성암축산정육점식당", category: "식당" }),
  stall({ id: "mokpo", name: "목포수산", category: "식자재" }),
  stall({ id: "sillim-tteok", name: "신림당떡집", category: "간식" }),
  stall({ id: "bethlehem", name: "베들레헴떡집", category: "간식" }),
  stall({ id: "dongnimmun", name: "독립문떡집", category: "간식" }),
  stall({ id: "tteok-sure", name: "떡수레", category: "간식" }),
  stall({ id: "otteok", name: "오떡순", category: "간식" }),
  stall({ id: "hotteok", name: "신원 호떡", category: "간식" }),
  stall({ id: "tangsuyuk", name: "시장 탕수육", category: "간식" }),
  stall({ id: "bulkkoch", name: "불꽃닭강정", category: "간식" }),
  stall({ id: "ajeossi", name: "아저씨강정", category: "간식" }),
  stall({ id: "songi", name: "송이네닭집", category: "간식" }),
  stall({ id: "myeongseong", name: "명성왕족발", category: "식당" }),
  stall({ id: "sundae-jip", name: "소문난순대집", category: "식당" }),
  stall({ id: "sundae-guk", name: "소문난순대국", category: "식당" }),
  stall({ id: "jangteo", name: "장터순대국", category: "식당" }),
  stall({ id: "dumyeong", name: "두명전집", category: "식당" }),
  stall({ id: "china-food", name: "중국식품", category: "식자재" }),
  stall({ id: "jeongjong", name: "정종중국식품", category: "식자재" }),
  stall({ id: "oil", name: "신림기름집", category: "식자재" }),
];

export const STORE_STORAGE_KEY = "shinwon-wiki-stores-v5";
