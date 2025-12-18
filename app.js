/**
 * NutriAI System Core Logic
 * Pure Frontend SPA
 */

const app = {
    state: {
        currentUser: null,
        foodLogs: [], 
        medications: [], 
        today: new Date().toISOString().split('T')[0],
        draftAnalysis: null
    },

    init: () => {
        try {
            app.loadFromStorage();
            app.setupRouter();
            app.setupEventListeners();
            app.setupDragAndDrop(); // 新增拖拉功能
            app.updateUI();
            app.renderDate();
            console.log("NutriAI System Initialized");
        } catch (e) {
            console.error("Init Error:", e);
            alert("系統初始化失敗，請重新整理頁面。");
        }
    },

    // --- Data & Seeding (Req 4) ---
    seedDemoData: () => {
        console.log("Seeding Demo Data...");
        const today = new Date();
        const logs = [];
        
        // 產生過去 7 天的資料 (for Trends)
        for(let i=6; i>=0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            // 每天塞 1-3 筆
            const meals = ["早餐", "午餐", "晚餐"];
            const foods = Object.keys(MOCK_FOOD_DB).slice(0, 10);
            
            for(let j=0; j<3; j++) {
                // 隨機跳過一些餐
                if(Math.random() > 0.8) continue;
                
                const foodName = foods[Math.floor(Math.random() * foods.length)];
                const item = MOCK_FOOD_DB[foodName];
                
                logs.push({
                    id: Date.now() - (i * 86400000) - (j * 3600000),
                    date: dateStr,
                    timestamp: `${12 + j * 4}:00`,
                    mealType: ["breakfast", "lunch", "dinner"][j],
                    name: foodName,
                    portion: 100,
                    nutrients: { ...item }, // Copy values
                    ingredients: item.ingredients
                });
            }
        }

        app.state = {
            currentUser: DEMO_PROFILES[0],
            foodLogs: logs,
            medications: [
                { id: 1, name: "Warfarin", dose: "5mg, 每日一次" },
                { id: 2, name: "Vitamin C", dose: "500mg, 每日一次" }
            ],
            today: today.toISOString().split('T')[0],
            draftAnalysis: null
        };
        app.saveToStorage();
    },

    loadFromStorage: () => {
        const savedState = localStorage.getItem('nutriAI_state');
        if (savedState) {
            app.state = JSON.parse(savedState);
            const currentDay = new Date().toISOString().split('T')[0];
            if(app.state.today !== currentDay) app.state.today = currentDay;
        } else {
            // Req 4: 首次開啟自動載入 Demo 資料
            app.seedDemoData();
        }
    },

    saveToStorage: () => {
        try {
            localStorage.setItem('nutriAI_state', JSON.stringify(app.state));
        } catch (e) {
            app.showToast("儲存失敗：localStorage 空間不足", "error");
        }
    },

    // --- Router & UI (Req 1 & 5) ---
    setupRouter: () => {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                navBtns.forEach(b => b.classList.remove('active'));
                
                // Add active to clicked button (handle child clicks)
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('active');
                
                const viewId = targetBtn.dataset.target;
                app.switchView(viewId);
            });
        });
    },

    switchView: (viewId) => {
        // Hide all views first
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none'; // Ensure strictly hidden via inline style for safety
        });
        
        const targetView = document.getElementById(`view-${viewId}`);
        if (!targetView) {
            app.showToast(`頁面 ${viewId} 不存在`, "error");
            app.switchView('dashboard'); // Fallback
            return;
        }

        // Show target view
        targetView.style.display = 'block';
        // Small delay to allow display:block to apply before adding opacity class (for transition)
        setTimeout(() => targetView.classList.add('active'), 10);

        // Update Page Title
        const titles = {
            'dashboard': '今日概覽',
            'food-log': '飲食紀錄',
            'analysis': '每日報告',
            'advice': '智能建議',
            'medication': '用藥管理',
            'trends': '趨勢分析',
            'profile': '個人檔案'
        };
        document.getElementById('pageTitle').innerText = titles[viewId] || 'NutriAI';

        // Trigger Render Logic
        try {
            if (viewId === 'dashboard') app.renderDashboard();
            if (viewId === 'analysis') app.renderReport();
            if (viewId === 'advice') app.generateAdvice();
            if (viewId === 'trends') app.renderTrends();
            if (viewId === 'medication') app.renderMedicationList();
            if (viewId === 'profile') app.renderProfile();
        } catch (e) {
            console.error("Render Error:", e);
            app.showToast("頁面渲染發生錯誤", "error");
        }
    },

    renderDate: () => {
        const d = new Date();
        const dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
        document.getElementById('currentDate').innerText = dateStr;
    },

    showToast: (msg, type = "normal") => {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.className = `toast ${type}`; // reset classes
        toast.classList.remove('hidden');
        toast.style.opacity = 1;
        
        // Clear previous timeout if exists
        if(app.toastTimeout) clearTimeout(app.toastTimeout);
        
        app.toastTimeout = setTimeout(() => {
            toast.style.opacity = 0;
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    },

    setLoading: (isLoading, text = "處理中...") => {
        const el = document.getElementById('loadingOverlay');
        document.getElementById('loadingText').innerText = text;
        if (isLoading) el.classList.remove('hidden');
        else el.classList.add('hidden');
    },

    // --- Use Case 1: Food Log & Search ---
    setupEventListeners: () => {
        // Image Upload (Click)
        const fileInput = document.getElementById('foodImageInput');
        if(fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) app.handleImageFile(e.target.files[0]);
            });
        }
        
        // Upload Area Click
        const dropZone = document.getElementById('dropZone');
        if(dropZone) {
             dropZone.addEventListener('click', () => document.getElementById('foodImageInput').click());
        }

        document.getElementById('reUploadBtn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling to dropZone
            app.resetUpload();
        });

        document.getElementById('startAnalysisBtn').addEventListener('click', app.runMockVLM);
        document.getElementById('saveFoodLogBtn').addEventListener('click', app.saveFoodLog);
        document.getElementById('manualSearchBtn').addEventListener('click', app.openSearchModal); // Fix Req 2
        document.getElementById('profileForm').addEventListener('submit', (e) => { e.preventDefault(); app.saveProfile(); });
        
        document.getElementById('resetAllBtn').addEventListener('click', () => {
            if(confirm("確定要重置為預設 Demo 資料嗎？目前的所有紀錄將被清除。")) {
                localStorage.removeItem('nutriAI_state');
                app.seedDemoData(); // Re-seed immediately
                location.reload();
            }
        });

        // Search Input in Modal
        const searchInput = document.getElementById('modalSearchInput');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => app.renderSearchList(e.target.value));
        }
    },

    // Fix Req 3: Drag and Drop
    setupDragAndDrop: () => {
        const dropZone = document.getElementById('dropZone');
        if(!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if(files && files[0] && files[0].type.startsWith('image/')) {
                app.handleImageFile(files[0]);
            } else {
                app.showToast("請上傳圖片檔案", "warning");
            }
        }, false);
    },

    handleImageFile: (file) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            document.getElementById('imagePreview').src = evt.target.result;
            document.getElementById('previewContainer').classList.remove('hidden');
            document.querySelector('.upload-placeholder').classList.add('hidden');
            document.getElementById('startAnalysisBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    },

    resetUpload: () => {
        document.getElementById('foodImageInput').value = '';
        document.getElementById('previewContainer').classList.add('hidden');
        document.querySelector('.upload-placeholder').classList.remove('hidden');
        document.getElementById('vlmResultArea').classList.add('hidden');
        document.getElementById('startAnalysisBtn').disabled = true;
    },

    // --- Search Modal Logic (Req 2) ---
    openSearchModal: () => {
        document.getElementById('searchModal').classList.remove('hidden');
        app.renderSearchList('');
    },

    closeSearchModal: () => {
        document.getElementById('searchModal').classList.add('hidden');
    },

    renderSearchList: (query) => {
        const list = document.getElementById('modalSearchResults');
        const foods = Object.keys(MOCK_FOOD_DB).filter(name => name.includes(query));
        
        list.innerHTML = foods.length ? foods.map(name => `
            <div class="list-item" onclick="app.selectFoodFromSearch('${name}')">
                <span>${name}</span>
                <small>${MOCK_FOOD_DB[name].calories} kcal</small>
            </div>
        `).join('') : '<div class="text-muted" style="padding:10px">查無符合食物</div>';
    },

    selectFoodFromSearch: (name) => {
        document.getElementById('foodNameInput').value = name;
        document.getElementById('portionInput').value = 100;
        document.getElementById('confidenceBadge').innerText = "手動選擇";
        document.getElementById('confidenceBadge').classList.remove('text-danger');
        
        app.updateNutritionPreview(name, 100);
        
        // Re-bind listeners for manual adjustments
        document.getElementById('foodNameInput').onchange = (e) => app.updateNutritionPreview(e.target.value, document.getElementById('portionInput').value);
        document.getElementById('portionInput').oninput = (e) => app.updateNutritionPreview(document.getElementById('foodNameInput').value, e.target.value);
        
        app.closeSearchModal();
        app.showToast(`已選取：${name}`, "success");
    },

    // --- VLM & Nutrition Logic ---
    runMockVLM: () => {
        app.setLoading(true, "上傳影像中...");
        const consoleEl = document.getElementById('vlmConsole');
        consoleEl.innerHTML = "> Image uploaded.\n> Preprocessing: Resize 512x512, Norm.\n";
        
        setTimeout(() => {
            app.setLoading(true, "VLM 模型分析中...");
            consoleEl.innerHTML += "> Model: NutriViT-L/14\n> Running Inference...\n";
            
            setTimeout(() => {
                consoleEl.innerHTML += "> Detected: Food Object\n> Segmenting ingredients...\n> Success.";
                app.setLoading(false);
                
                // Random mock result
                const mockResult = VLM_MOCK_RESPONSES[Math.floor(Math.random() * VLM_MOCK_RESPONSES.length)];
                
                document.getElementById('vlmResultArea').classList.remove('hidden');
                document.getElementById('foodNameInput').value = mockResult.name;
                document.getElementById('portionInput').value = 100;
                document.getElementById('confidenceBadge').innerText = `信心度: ${mockResult.confidence}%`;
                
                if (mockResult.confidence < 90) {
                    document.getElementById('confidenceBadge').classList.add('text-danger');
                    app.showToast("信心度較低，請檢查結果", "warning");
                } else {
                    document.getElementById('confidenceBadge').classList.remove('text-danger');
                }

                app.updateNutritionPreview(mockResult.name, 100);
                
                // Listeners for manual change
                document.getElementById('foodNameInput').onchange = (e) => app.updateNutritionPreview(e.target.value, document.getElementById('portionInput').value);
                document.getElementById('portionInput').oninput = (e) => app.updateNutritionPreview(document.getElementById('foodNameInput').value, e.target.value);
                
            }, 1000);
        }, 800);
    },

    updateNutritionPreview: (foodName, portion) => {
        const dbItem = MOCK_FOOD_DB[foodName] || MOCK_FOOD_DB["未知食物"];
        const ratio = portion / 100;
        
        const tagsContainer = document.getElementById('ingredientsTags');
        tagsContainer.innerHTML = dbItem.ingredients.map(ing => `<span class="tag">${ing}</span>`).join('');

        const cal = Math.round(dbItem.calories * ratio);
        const prot = Math.round(dbItem.protein * ratio);
        const carb = Math.round(dbItem.carbs * ratio);
        const fat = Math.round(dbItem.fat * ratio);

        document.getElementById('estCal').innerText = `${cal} kcal`;
        document.getElementById('estProt').innerText = `${prot} P`;
        document.getElementById('estCarb').innerText = `${carb} C`;
        document.getElementById('estFat').innerText = `${fat} F`;

        app.state.draftAnalysis = {
            name: foodName,
            portion: parseFloat(portion),
            nutrients: { calories: cal, protein: prot, carbs: carb, fat: fat, sodium: Math.round(dbItem.sodium * ratio) },
            ingredients: dbItem.ingredients
        };
    },

    saveFoodLog: () => {
        if (!app.state.draftAnalysis) return;
        
        const log = {
            id: Date.now(),
            date: app.state.today,
            timestamp: new Date().toLocaleTimeString('zh-TW', {hour: '2-digit', minute:'2-digit'}),
            mealType: document.getElementById('mealTypeInput').value,
            ...app.state.draftAnalysis
        };

        const warnings = app.checkInteraction(log);
        if (warnings.length > 0) {
            if(!confirm(`⚠️ 安全警告：此食物可能與您的藥物產生交互作用：\n${warnings.join('\n')}\n確定要繼續記錄嗎？`)) {
                return;
            }
        }

        app.state.foodLogs.push(log);
        app.saveToStorage();
        app.showToast("飲食紀錄已儲存 ✅", "success");
        
        app.resetUpload();
        app.switchView('dashboard');
    },

    // --- Profile ---
    renderProfile: () => {
        const u = app.state.currentUser;
        if(!u) return;
        document.getElementById('currentUserDisplay').innerText = u.name;
        document.getElementById('pName').value = u.name;
        document.getElementById('pAge').value = u.age;
        document.getElementById('pHeight').value = u.height;
        document.getElementById('pWeight').value = u.weight;
        
        document.querySelectorAll('input[name="disease"]').forEach(cb => {
            cb.checked = u.diseases.includes(cb.value);
        });
        document.querySelectorAll('input[name="diet"]').forEach(cb => {
            cb.checked = u.dietary_restrictions.includes(cb.value);
        });

        const hMeter = u.height / 100;
        const bmi = (u.weight / (hMeter * hMeter)).toFixed(1);
        document.getElementById('displayBMI').innerText = bmi;
        document.getElementById('displayTDEE').innerText = u.tdee;
    },

    saveProfile: () => {
        const u = app.state.currentUser;
        u.name = document.getElementById('pName').value;
        u.age = parseInt(document.getElementById('pAge').value) || 25;
        u.height = parseInt(document.getElementById('pHeight').value) || 170;
        u.weight = parseInt(document.getElementById('pWeight').value) || 65;
        
        u.diseases = Array.from(document.querySelectorAll('input[name="disease"]:checked')).map(cb => cb.value);
        u.dietary_restrictions = Array.from(document.querySelectorAll('input[name="diet"]:checked')).map(cb => cb.value);

        // Simple TDEE Update
        u.tdee = Math.round(10 * u.weight + 6.25 * u.height - 5 * u.age + 5); 

        app.saveToStorage();
        app.showToast("個人資料已更新", "success");
        app.renderProfile();
    },

    loadDemoProfile: (index) => {
        app.state.currentUser = JSON.parse(JSON.stringify(DEMO_PROFILES[index]));
        app.saveToStorage();
        app.renderProfile();
        app.showToast(`已切換為：${app.state.currentUser.name}`, "success");
    },

    // --- Dashboard & Reports ---
    getDailyStats: (date = app.state.today) => {
        const logs = app.state.foodLogs.filter(l => l.date === date);
        const stats = { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, logs: logs };
        logs.forEach(l => {
            stats.calories += l.nutrients.calories;
            stats.protein += l.nutrients.protein;
            stats.carbs += l.nutrients.carbs;
            stats.fat += l.nutrients.fat;
            stats.sodium += l.nutrients.sodium;
        });
        return stats;
    },

    renderDashboard: () => {
        const stats = app.getDailyStats();
        const target = app.state.currentUser.tdee;
        
        document.getElementById('dashCalorieVal').innerText = stats.calories;
        document.getElementById('dashCalorieTarget').innerText = `${target} kcal`;
        
        // Recent 5 Logs (Global, sorted by date/time desc)
        const recentLogs = [...app.state.foodLogs].sort((a,b) => b.id - a.id).slice(0, 5);
        
        const list = document.getElementById('dashRecentLogs');
        list.innerHTML = recentLogs.map(l => `
            <div class="list-item">
                <span>${l.date === app.state.today ? l.timestamp : l.date} <b>${l.name}</b></span>
                <span>${l.nutrients.calories} kcal</span>
            </div>
        `).join('') || '<div class="text-muted" style="padding:10px">尚無紀錄</div>';

        const risks = [];
        if (stats.sodium > 2300) risks.push("今日鈉攝取過高");
        if (stats.calories > target * 1.1) risks.push("熱量超標警告");
        
        // Meds Risk Check
        const medRisks = app.checkAllInteractionsInternal();
        if(medRisks.length > 0) risks.push("偵測到潛在藥物風險");

        const riskList = document.getElementById('dashRiskList');
        riskList.innerHTML = risks.length ? risks.map(r => `<li>⚠️ ${r}</li>`).join('') : '<li class="text-success">✅ 狀況良好</li>';
    },

    renderReport: () => {
        const stats = app.getDailyStats();
        const target = app.state.currentUser.tdee;

        const updateBar = (id, val, max, unit) => {
            const pct = Math.min((val / max) * 100, 100);
            const bar = document.getElementById(id);
            bar.style.width = `${pct}%`;
            document.getElementById(id.replace('bar','val')).innerText = `${val}/${max}${unit}`;
            bar.style.backgroundColor = val > max ? 'var(--danger)' : '';
        };

        updateBar('barCal', stats.calories, target, 'kcal');
        updateBar('barCarb', stats.carbs, 300, 'g');
        updateBar('barProt', stats.protein, 100, 'g');
        updateBar('barFat', stats.fat, 70, 'g');
        updateBar('barSodium', stats.sodium, 2300, 'mg');

        document.getElementById('reportLogList').innerHTML = stats.logs.map(l => `
            <div class="list-item">
                <div>
                    <strong>${l.name}</strong> <small class="text-muted">(${l.mealType})</small><br>
                    <small>C:${l.nutrients.carbs} P:${l.nutrients.protein} F:${l.nutrients.fat}</small>
                </div>
                <div style="text-align:right">
                    <div>${l.nutrients.calories} kcal</div>
                    <small>${l.nutrients.sodium}mg 鈉</small>
                </div>
            </div>
        `).join('') || '<div class="text-muted text-center" style="padding:10px">今日尚無紀錄</div>';
    },

    exportReport: () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(app.getDailyStats()));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `report_${app.state.today}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    // --- Advice ---
    generateAdvice: (forceRefresh = false) => {
        const stats = app.getDailyStats();
        const user = app.state.currentUser;
        const adviceBox = document.getElementById('adviceContent');
        
        // Req 4: If no data, give default advice instead of "no data"
        if (stats.calories === 0 && !forceRefresh) {
             adviceBox.innerHTML = `
                <p>👋 歡迎回來，${user.name}！今天還沒有飲食紀錄。</p>
                <p>💡 <strong>今日小提醒：</strong> 根據您的 BMI，建議攝取足夠的水分（約 2000cc）。</p>
                <div class="text-success" style="margin-top:10px;">✅ 您的用藥紀錄已同步，系統將持續監控交互作用。</div>
             `;
             return;
        }

        let adviceHTML = "";
        
        if (user.diseases.includes('hypertension')) {
            if (stats.sodium > 2000) {
                adviceHTML += `<div class="card border-red" style="padding:10px; margin-bottom:10px;">⚠️ <strong>高血壓警示：</strong> 今日鈉攝取 (${stats.sodium}mg) 偏高。建議晚餐清淡。</div>`;
            }
        }

        if (stats.calories < user.tdee * 0.5) {
            adviceHTML += `<p>📉 <strong>熱量不足：</strong> 目前僅攝取 TDEE 的 50%，建議補充優質蛋白質。</p>`;
        } else if (stats.calories > user.tdee) {
            adviceHTML += `<p>📈 <strong>熱量超標：</strong> 建議增加活動量或減少下一餐份量。</p>`;
        } else {
            adviceHTML += `<p>🌟 <strong>營養均衡：</strong> 繼續保持！</p>`;
        }

        const tips = [
            "💡 飯後散步 15 分鐘有助於血糖穩定。",
            "💡 建議將部分精緻澱粉替換為糙米或地瓜。",
            "💡 蔬菜富含纖維，能增加飽足感。"
        ];
        adviceHTML += `<hr style="margin:10px 0"><p class="text-muted">${tips[Math.floor(Math.random()*tips.length)]}</p>`;
        adviceBox.innerHTML = adviceHTML;
    },

    // --- Trends ---
    renderTrends: () => {
        const days = 7;
        const dataPoints = [];
        const labels = [];
        const today = new Date();

        for(let i=days-1; i>=0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const logSum = app.state.foodLogs.filter(l => l.date === dateStr)
                              .reduce((acc, curr) => acc + curr.nutrients.calories, 0);
            dataPoints.push(logSum);
            labels.push(i === 0 ? 'Today' : `${d.getMonth()+1}/${d.getDate()}`);
        }

        const maxVal = Math.max(...dataPoints, 3000);
        const width = 300;
        const height = 150;
        
        let points = "";
        const step = width / (days - 1);
        dataPoints.forEach((val, idx) => {
            const x = idx * step;
            const y = height - (val / maxVal * height);
            points += `${x},${y} `;
        });

        const targetY = height - (app.state.currentUser.tdee / maxVal * height);
        
        const svg = document.getElementById('trendChartSvg');
        svg.innerHTML = `
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:var(--primary);stop-opacity:0.2" />
                    <stop offset="100%" style="stop-color:var(--primary);stop-opacity:0" />
                </linearGradient>
            </defs>
            <polygon points="${points} ${width},${height} 0,${height}" fill="url(#grad1)" />
            <polyline fill="none" stroke="#007bff" stroke-width="3" points="${points}" />
            <line x1="0" y1="${targetY}" x2="${width}" y2="${targetY}" stroke="#dc3545" stroke-dasharray="5,5" stroke-width="2" />
            <text x="5" y="${targetY - 5}" fill="#dc3545" font-size="10">Target</text>
        `;

        const overCount = dataPoints.filter(v => v > app.state.currentUser.tdee).length;
        const avg = Math.round(dataPoints.reduce((a,b)=>a+b,0)/days);
        
        document.getElementById('trendStats').innerHTML = `
            <li>過去 7 天超標天數：<strong class="text-danger">${overCount} 天</strong></li>
            <li>平均每日熱量：<strong>${avg} kcal</strong></li>
            <li>熱量波動：${Math.min(...dataPoints)} ~ ${Math.max(...dataPoints)} kcal</li>
        `;
    },

    // --- Medication ---
    addMedication: () => {
        const name = document.getElementById('medNameInput').value.trim();
        const dose = document.getElementById('medDoseInput').value;
        if (!name) {
            app.showToast("請輸入藥品名稱", "warning");
            return;
        }

        app.state.medications.push({ id: Date.now(), name, dose });
        app.saveToStorage();
        app.renderMedicationList();
        
        document.getElementById('medNameInput').value = '';
        document.getElementById('medDoseInput').value = '';
        app.showToast("藥品已新增", "success");
    },

    renderMedicationList: () => {
        const list = document.getElementById('medList');
        list.innerHTML = app.state.medications.map(m => `
            <div class="list-item">
                <div>
                    <strong>${m.name}</strong>
                    <small class="text-muted">${m.dose}</small>
                </div>
                <button class="btn btn-danger-outline btn-sm" onclick="app.removeMedication(${m.id})">刪除</button>
            </div>
        `).join('') || '<div class="text-muted">目前無用藥紀錄</div>';

        app.renderInteractionResults();
    },

    removeMedication: (id) => {
        app.state.medications = app.state.medications.filter(m => m.id !== id);
        app.saveToStorage();
        app.renderMedicationList();
    },

    checkInteraction: (foodLog) => {
        const warnings = [];
        app.state.medications.forEach(med => {
            const drugInfo = DRUG_INTERACTIONS[med.name];
            if (drugInfo && drugInfo.food_tags) {
                foodLog.ingredients.forEach(ing => {
                    if (drugInfo.food_tags[ing] === 'high') {
                        warnings.push(`💊 藥物 [${med.name}] 與 食材 [${ing}] 存在高風險交互作用！`);
                    }
                });
            }
        });
        return warnings;
    },

    checkAllInteractionsInternal: () => {
        const warnings = [];
        const meds = app.state.medications;
        
        // Drug vs Drug
        for (let i = 0; i < meds.length; i++) {
            for (let j = i + 1; j < meds.length; j++) {
                const d1 = meds[i].name;
                const d2 = meds[j].name;
                if (DRUG_INTERACTIONS[d1] && DRUG_INTERACTIONS[d1].drugs && DRUG_INTERACTIONS[d1].drugs[d2] === 'high') {
                    warnings.push(`⚠️ 藥物衝突：${d1} 與 ${d2}`);
                }
            }
        }
        return warnings;
    },

    renderInteractionResults: () => {
        const container = document.getElementById('interactionResults');
        const warnings = app.checkAllInteractionsInternal();

        if (warnings.length > 0) {
            container.innerHTML = warnings.map(w => `<p class="text-danger">${w}</p>`).join('');
            document.getElementById('interactionCard').classList.add('border-red');
        } else {
            container.innerHTML = `<p class="text-success">目前藥物間無顯著交互作用。</p>`;
            document.getElementById('interactionCard').classList.remove('border-red');
        }
    },
    
    updateUI: () => {
        const activeBtn = document.querySelector('.nav-btn.active');
        if(activeBtn) app.switchView(activeBtn.dataset.target);
        else app.switchView('dashboard');
    }
};

// Start App
window.addEventListener('DOMContentLoaded', app.init);
