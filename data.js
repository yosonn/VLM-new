// 模擬的後端資料庫與常數設定

// Use Case 7: 內建 mock 營養資料庫
const MOCK_FOOD_DB = {
    "雞腿便當": { calories: 850, protein: 35, carbs: 100, fat: 30, sodium: 1200, ingredients: ["雞腿", "米飯", "高麗菜", "滷蛋"] },
    "生菜沙拉": { calories: 150, protein: 5, carbs: 10, fat: 8, sodium: 150, ingredients: ["美生菜", "番茄", "小黃瓜", "和風醬"] },
    "牛肉麵": { calories: 700, protein: 40, carbs: 80, fat: 25, sodium: 2500, ingredients: ["麵條", "牛肉", "青江菜", "高湯"] },
    "漢堡套餐": { calories: 900, protein: 25, carbs: 95, fat: 45, sodium: 1100, ingredients: ["漢堡麵包", "牛肉排", "薯條", "可樂"] },
    "燕麥粥": { calories: 300, protein: 10, carbs: 50, fat: 5, sodium: 50, ingredients: ["燕麥", "牛奶", "堅果"] },
    "珍珠奶茶": { calories: 650, protein: 2, carbs: 80, fat: 25, sodium: 20, ingredients: ["珍珠", "奶精", "糖漿", "紅茶"] },
    "未知食物": { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, ingredients: ["未知"] }
};

// Use Case 8: 藥物交互作用 Mock Data
// high: 紅色警示, medium: 黃色, low: 綠色/無
const DRUG_INTERACTIONS = {
    "Warfarin": {
        "food_tags": { "高麗菜": "high", "菠菜": "high", "花椰菜": "medium" }, // 維生素K衝突
        "drugs": { "Aspirin": "high" }
    },
    "Metformin": {
        "food_tags": { "酒": "high" }, // 乳酸中毒風險
        "drugs": {}
    },
    "Grapefruit": { // 特殊：食物本身作為 key
         "drugs": { "Statin": "high", "Calcium Channel Blocker": "high" }
    }
};

// Use Case 2: Demo 使用者檔案 (快速切換用)
const DEMO_PROFILES = [
    {
        id: "user_healthy",
        name: "王小明 (健康)",
        age: 25,
        height: 175,
        weight: 70,
        diseases: [],
        dietary_restrictions: [],
        tdee: 2200
    },
    {
        id: "user_chronic",
        name: "李伯伯 (慢性病)",
        age: 65,
        height: 165,
        weight: 80,
        diseases: ["diabetes", "hypertension"],
        dietary_restrictions: ["low_sugar", "low_sodium"],
        tdee: 1800
    },
    {
        id: "user_gym",
        name: "陳健人 (增肌)",
        age: 28,
        height: 180,
        weight: 85,
        diseases: [],
        dietary_restrictions: ["high_protein"],
        tdee: 3000
    }
];

// 用來模擬 VLM 的回應
const VLM_MOCK_RESPONSES = [
    { name: "雞腿便當", confidence: 98 },
    { name: "生菜沙拉", confidence: 92 },
    { name: "牛肉麵", confidence: 88 },
    { name: "漢堡套餐", confidence: 95 },
    { name: "燕麥粥", confidence: 85 }
];