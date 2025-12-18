// 模擬的後端資料庫
const MOCK_FOOD_DB = {
    // 便當/主食類
    "雞腿便當": { calories: 850, protein: 35, carbs: 100, fat: 30, sodium: 1200, ingredients: ["雞腿", "白飯", "高麗菜", "滷蛋"] },
    "排骨便當": { calories: 900, protein: 30, carbs: 105, fat: 35, sodium: 1300, ingredients: ["豬排", "白飯", "青江菜", "豆干"] },
    "牛肉麵": { calories: 700, protein: 40, carbs: 80, fat: 25, sodium: 2500, ingredients: ["麵條", "牛肉", "青江菜", "高湯"] },
    "魯肉飯": { calories: 450, protein: 12, carbs: 60, fat: 18, sodium: 800, ingredients: ["白飯", "豬肉燥", "醃蘿蔔"] },
    "水餃(10顆)": { calories: 550, protein: 20, carbs: 65, fat: 22, sodium: 900, ingredients: ["麵皮", "豬肉", "高麗菜", "醬油"] },
    "蛋炒飯": { calories: 650, protein: 15, carbs: 85, fat: 25, sodium: 950, ingredients: ["白飯", "雞蛋", "蔥花", "油"] },
    
    // 速食/西式
    "漢堡套餐": { calories: 900, protein: 25, carbs: 95, fat: 45, sodium: 1100, ingredients: ["漢堡麵包", "牛肉排", "薯條", "可樂"] },
    "生菜沙拉": { calories: 150, protein: 5, carbs: 10, fat: 8, sodium: 150, ingredients: ["美生菜", "番茄", "小黃瓜", "和風醬"] },
    "義大利麵": { calories: 600, protein: 20, carbs: 80, fat: 22, sodium: 800, ingredients: ["義大利麵", "番茄醬", "絞肉"] },
    "總匯三明治": { calories: 400, protein: 15, carbs: 45, fat: 18, sodium: 700, ingredients: ["吐司", "火腿", "煎蛋", "小黃瓜", "美乃滋"] },

    // 早餐/點心
    "燕麥粥": { calories: 300, protein: 10, carbs: 50, fat: 5, sodium: 50, ingredients: ["燕麥", "牛奶", "堅果"] },
    "茶葉蛋": { calories: 75, protein: 7, carbs: 1, fat: 5, sodium: 200, ingredients: ["雞蛋", "茶葉滷汁"] },
    "地瓜": { calories: 130, protein: 2, carbs: 30, fat: 0.5, sodium: 20, ingredients: ["地瓜"] },
    "香蕉": { calories: 90, protein: 1, carbs: 23, fat: 0, sodium: 1, ingredients: ["香蕉"] },
    "蘋果": { calories: 50, protein: 0, carbs: 14, fat: 0, sodium: 1, ingredients: ["蘋果"] },
    "無糖豆漿": { calories: 100, protein: 10, carbs: 5, fat: 4, sodium: 10, ingredients: ["黃豆", "水"] },
    "全麥麵包": { calories: 250, protein: 8, carbs: 45, fat: 4, sodium: 300, ingredients: ["全麥麵粉", "酵母"] },
    
    // 飲料
    "珍珠奶茶": { calories: 650, protein: 2, carbs: 80, fat: 25, sodium: 20, ingredients: ["珍珠", "奶精", "糖漿", "紅茶"] },
    "拿鐵咖啡": { calories: 180, protein: 8, carbs: 12, fat: 9, sodium: 100, ingredients: ["濃縮咖啡", "牛奶"] },
    "可樂": { calories: 140, protein: 0, carbs: 35, fat: 0, sodium: 15, ingredients: ["碳酸水", "高果糖漿"] },

    // 其他常見
    "雞胸肉(100g)": { calories: 165, protein: 31, carbs: 0, fat: 3.6, sodium: 74, ingredients: ["雞胸肉"] },
    "燙青菜": { calories: 40, protein: 2, carbs: 8, fat: 0, sodium: 300, ingredients: ["地瓜葉", "醬油膏"] },
    "皮蛋瘦肉粥": { calories: 350, protein: 18, carbs: 50, fat: 8, sodium: 1100, ingredients: ["白米", "皮蛋", "瘦肉", "蔥"] },
    "臭豆腐": { calories: 500, protein: 20, carbs: 35, fat: 30, sodium: 800, ingredients: ["豆腐", "泡菜", "醬料"] },
    "蔥油餅": { calories: 400, protein: 8, carbs: 50, fat: 18, sodium: 600, ingredients: ["麵粉", "蔥", "油"] },
    "肉圓": { calories: 450, protein: 8, carbs: 65, fat: 15, sodium: 900, ingredients: ["地瓜粉", "豬肉", "筍乾"] },
    "鹹酥雞": { calories: 550, protein: 30, carbs: 30, fat: 35, sodium: 1000, ingredients: ["雞肉", "胡椒鹽", "九層塔"] },
    "鳳梨酥": { calories: 200, protein: 2, carbs: 30, fat: 8, sodium: 50, ingredients: ["麵粉", "鳳梨餡", "奶油"] },
    "味噌湯": { calories: 60, protein: 4, carbs: 8, fat: 2, sodium: 600, ingredients: ["味噌", "豆腐", "海帶芽"] },

    "未知食物": { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, ingredients: ["未知"] }
};

// 藥物交互作用 Mock Data
const DRUG_INTERACTIONS = {
    "Warfarin": {
        "food_tags": { "高麗菜": "high", "菠菜": "high", "花椰菜": "medium", "地瓜葉": "high" }, // 維生素K衝突
        "drugs": { "Aspirin": "high" }
    },
    "Metformin": {
        "food_tags": { "酒": "high" }, // 乳酸中毒風險
        "drugs": {}
    },
    "Grapefruit": { 
         "drugs": { "Statin": "high", "Calcium Channel Blocker": "high" }
    }
};

// Demo Profiles
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

// 模擬 VLM 回應
const VLM_MOCK_RESPONSES = [
    { name: "雞腿便當", confidence: 98 },
    { name: "生菜沙拉", confidence: 92 },
    { name: "牛肉麵", confidence: 88 },
    { name: "漢堡套餐", confidence: 95 },
    { name: "燕麥粥", confidence: 85 },
    { name: "義大利麵", confidence: 90 },
    { name: "水餃(10顆)", confidence: 80 }
];
