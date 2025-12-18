/**
 * NutriAI System Core Logic
 * 純前端 SPA 實作
 */

const app = {
    // 狀態管理
    state: {
        currentUser: null,
        foodLogs: [], // { id, timestamp, foodName, portion, mealType, nutrients, image }
        medications: [], // { id, name, dose }
        today: new Date().toISOString().split('T')[0],
        draftAnalysis: null
    },

    // 初始化
    init: () => {
        app.loadFromStorage();
        app.setupRouter();
        app.setupEventListeners();
        app.updateUI();
        app.renderDate();
        console.log("NutriAI System Initialized");
    },

    // --- Data Persistence (Requirement 2) ---
    loadFromStorage: () => {
        const savedState = localStorage.getItem('nutriAI_state');
        if (savedState) {
            app.state = JSON.parse(savedState);
            // 重置今日日期，避免跨日問題
            const currentDay = new Date().toISOString().split('T')[0];
            if(app.state.today !== currentDay) app.state.today = currentDay;
        } else {
            // 預設載入第一個 Demo Profile
            app.state.currentUser = DEMO_PROFILES[0];
        }
    },

    saveToStorage: () => {
        try {
            localStorage.setItem('nutriAI_state', JSON.stringify(app.state));
        } catch (e) {
            app.showToast("儲存失敗：localStorage 空間不足", "error");
        }
    },

    // --- Router & UI ---
    setupRouter: () => {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class
                navBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                const target = e.currentTarget; // 確保抓到 button
                target.classList.add('active');
                
                const viewId = target.dataset.target;
                app.switchView(viewId);
            });
        });
    },

    switchView: (viewId) => {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');
        
        // Dynamic View Updates
        if (viewId === 'dashboard') app.renderDashboard();
        if (viewId === 'analysis') app.renderReport();
        if (viewId === 'advice') app.generateAdvice(); // Use Case 4 Trigger
        if (viewId === 'trends') app.renderTrends(); // Use Case 5 Trigger
        if (viewId === 'medication') app.renderMedicationList();
        if (viewId === 'profile') app.renderProfile();
        
        document.getElementById('pageTitle').innerText = 
            viewId === 'dashboard' ? '今日概覽' : 
            viewId === 'food-log' ? '飲食紀錄' :
            viewId === 'analysis' ? '每日報告' :
            viewId === 'advice' ? 'AI 建議' :
            viewId === 'medication' ? '用藥管理' :
            viewId === 'trends' ? '趨勢分析' : '個人檔案';
    },

    renderDate: () => {
        const d = new Date();
        document.getElementById('currentDate').innerText = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
    },

    showToast: (msg) => {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.classList.remove('hidden');
        toast.style.opacity = 1;
        setTimeout(() => {
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

    // --- Use Case 1: Food Log & VLM ---
    setupEventListeners: () => {
        // Image Upload
        document.getElementById('foodImageInput').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (evt) => {
                    document.getElementById('imagePreview').src = evt.target.result;
                    document.getElementById('previewContainer').classList.remove('hidden');
                    document.getElementById('startAnalysisBtn').disabled = false;
                };
                reader.readAsDataURL(file);
            }
        });

        // Re-upload
        document.getElementById('reUploadBtn').addEventListener('click', () => {
            document.getElementById('foodImageInput').value = '';
            document.getElementById('previewContainer').classList.add('hidden');
            document.getElementById('vlmResultArea').classList.add('hidden');
            document.getElementById('startAnalysisBtn').disabled = true;
        });

        // Start VLM Analysis
        document.getElementById('startAnalysisBtn').addEventListener('click', app.runMockVLM);

        // Save Log
        document.getElementById('saveFoodLogBtn').addEventListener('click', app.saveFoodLog);

        // Profile Form
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            app.saveProfile();
        });
        
        // Reset
        document.getElementById('resetAllBtn').addEventListener('click', () => {
            if(confirm("確定要清除所有資料嗎？此操作無法復原。")) {
                localStorage.removeItem('nutriAI_state');
                location.reload();
            }
        });
    },

    // Use Case 6: VLM Internal Simulation
    runMockVLM: () => {
        app.setLoading(true, "上傳影像中...");
        
        // 模擬 Console 輸出
        const consoleEl = document.getElementById('vlmConsole');
        consoleEl.innerHTML = "> Image uploaded.\n> Preprocessing: Resize 512x512, Norm.\n";
        
        setTimeout(() => {
            app.setLoading(true, "VLM 模型分析中...");
            consoleEl.innerHTML += "> Model: NutriViT-L/14\n> Running Inference...\n";
            
            setTimeout(() => {
                consoleEl.innerHTML += "> Detected: Food Object (0.98)\n> Segmenting ingredients...\n> Success.";
                app.setLoading(false);
                
                // 隨機選一個模擬結果，或者根據上傳檔名 hash 決定 (這裡簡化為隨機)
                const mockResult = VLM_MOCK_RESPONSES[Math.floor(Math.random() * VLM_MOCK_RESPONSES.length)];
                
                // 填充表單
                document.getElementById('vlmResultArea').classList.remove('hidden');
                document.getElementById('foodNameInput').value = mockResult.name;
                document.getElementById('portionInput').value = 100; // default 100g
                document.getElementById('confidenceBadge').innerText = `信心度: ${mockResult.confidence}%`;
                
                if (mockResult.confidence < 90) {
                    document.getElementById('confidenceBadge').classList.add('text-danger');
                    app.showToast("信心度較低，請檢查結果");
                } else {
                    document.getElementById('confidenceBadge').classList.remove('text-danger');
                }

                app.updateNutritionPreview(mockResult.name, 100);
                
                // 監聽輸入改變以即時更新營養
                document.getElementById('foodNameInput').onchange = (e) => app.updateNutritionPreview(e.target.value, document.getElementById('portionInput').value);
                document.getElementById('portionInput').oninput = (e) => app.updateNutritionPreview(document.getElementById('foodNameInput').value, e.target.value);
                
            }, 1500); // 模擬分析耗時
        }, 1000); // 模擬上傳耗時
    },

    // Use Case 7: Nutrition Estimation Internal
    updateNutritionPreview: (foodName, portion) => {
        const dbItem = MOCK_FOOD_DB[foodName] || MOCK_FOOD_DB["未知食物"];
        const ratio = portion / 100;
        
        // 顯示食材 Tags
        const tagsContainer = document.getElementById('ingredientsTags');
        tagsContainer.innerHTML = dbItem.ingredients.map(ing => `<span class="tag">${ing}</span>`).join('');

        // 計算數值
        const cal = Math.round(dbItem.calories * ratio);
        const prot = Math.round(dbItem.protein * ratio);
        const carb = Math.round(dbItem.carbs * ratio);
        const fat = Math.round(dbItem.fat * ratio);

        document.getElementById('estCal').innerText = cal;
        document.getElementById('estProt').innerText = prot;
        document.getElementById('estCarb').innerText = carb;
        document.getElementById('estFat').innerText = fat;

        // 暫存此狀態供儲存使用
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
            timestamp: new Date().toLocaleTimeString(),
            mealType: document.getElementById('mealTypeInput').value,
            ...app.state.draftAnalysis
        };

        // Check for Medication Interactions (Use Case 8 integrated)
        const warnings = app.checkInteraction(log);
        if (warnings.length > 0) {
            if(!confirm(`⚠️ 安全警告：此食物可能與您的藥物產生交互作用：\n${warnings.join('\n')}\n確定要繼續記錄嗎？`)) {
                return;
            }
        }

        app.state.foodLogs.push(log);
        app.saveToStorage();
        app.showToast("飲食紀錄已儲存 ✅");
        
        // Reset UI
        document.getElementById('vlmResultArea').classList.add('hidden');
        document.getElementById('previewContainer').classList.add('hidden');
        document.getElementById('foodImageInput').value = '';
        app.switchView('dashboard');
    },

    // --- Use Case 2: Profile ---
    renderProfile: () => {
        const u = app.state.currentUser;
        document.getElementById('currentUserDisplay').innerText = u.name;
        document.getElementById('pName').value = u.name;
        document.getElementById('pAge').value = u.age;
        document.getElementById('pHeight').value = u.height;
        document.getElementById('pWeight').value = u.weight;
        
        // 勾選疾病
        document.querySelectorAll('input[name="disease"]').forEach(cb => {
            cb.checked = u.diseases.includes(cb.value);
        });
        // 勾選飲食限制
        document.querySelectorAll('input[name="diet"]').forEach(cb => {
            cb.checked = u.dietary_restrictions.includes(cb.value);
        });

        // 計算 BMI
        const hMeter = u.height / 100;
        const bmi = (u.weight / (hMeter * hMeter)).toFixed(1);
        document.getElementById('displayBMI').innerText = bmi;
        document.getElementById('displayTDEE').innerText = u.tdee;
    },

    saveProfile: () => {
        const u = app.state.currentUser;
        u.name = document.getElementById('pName').value;
        u.age = parseInt(document.getElementById('pAge').value);
        u.height = parseInt(document.getElementById('pHeight').value);
        u.weight = parseInt(document.getElementById('pWeight').value);
        
        u.diseases = Array.from(document.querySelectorAll('input[name="disease"]:checked')).map(cb => cb.value);
        u.dietary_restrictions = Array.from(document.querySelectorAll('input[name="diet"]:checked')).map(cb => cb.value);

        // Simple TDEE Update (Mifflin-St Jeor approx)
        u.tdee = Math.round(10 * u.weight + 6.25 * u.height - 5 * u.age + 5); // assuming male for demo simplicity

        // Use Case 2 Conflict Check
        if (u.dietary_restrictions.includes('low_protein') && u.dietary_restrictions.includes('high_protein')) {
            alert("⚠️ 設定衝突：同時選擇了「低蛋白」與「高蛋白」。請調整設定。");
            return;
        }

        app.saveToStorage();
        app.showToast("個人資料已更新");
        app.renderProfile();
    },

    loadDemoProfile: (index) => {
        app.state.currentUser = JSON.parse(JSON.stringify(DEMO_PROFILES[index]));
        app.saveToStorage();
        app.renderProfile();
        app.showToast(`已切換為：${app.state.currentUser.name}`);
    },

    // --- Use Case 3 & Dashboard: Report ---
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
        
        // Calorie Circle
        document.getElementById('dashCalorieVal').innerText = stats.calories;
        document.getElementById('dashCalorieTarget').innerText = `${target} kcal`;
        
        // Recent Logs
        const list = document.getElementById('dashRecentLogs');
        list.innerHTML = stats.logs.slice(-5).reverse().map(l => `
            <div class="list-item">
                <span>${l.timestamp} <b>${l.name}</b></span>
                <span>${l.nutrients.calories} kcal</span>
            </div>
        `).join('') || '<div class="text-muted" style="padding:10px">今日尚無紀錄</div>';

        // Risks Check
        const risks = [];
        if (stats.sodium > 2300) risks.push("今日鈉攝取過高");
        if (stats.calories > target * 1.1) risks.push("熱量超標");
        const riskList = document.getElementById('dashRiskList');
        riskList.innerHTML = risks.length ? risks.map(r => `<li>⚠️ ${r}</li>`).join('') : '<li>✅ 狀況良好</li>';
    },

    renderReport: () => {
        const stats = app.getDailyStats();
        const target = app.state.currentUser.tdee;

        // Bars
        const updateBar = (id, val, max, unit) => {
            const pct = Math.min((val / max) * 100, 100);
            document.getElementById(id).style.width = `${pct}%`;
            document.getElementById(id.replace('bar','val')).innerText = `${val}/${max}${unit}`;
            // Red warning if over
            if (val > max) document.getElementById(id).style.backgroundColor = 'var(--danger)';
        };

        updateBar('barCal', stats.calories, target, 'kcal');
        updateBar('barCarb', stats.carbs, 300, 'g'); // Mock targets
        updateBar('barProt', stats.protein, 100, 'g');
        updateBar('barFat', stats.fat, 70, 'g');
        updateBar('barSodium', stats.sodium, 2300, 'mg');

        // Detail List
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
        `).join('');
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

    // --- Use Case 4: Personalized Advice ---
    generateAdvice: () => {
        const stats = app.getDailyStats();
        const user = app.state.currentUser;
        const adviceBox = document.getElementById('adviceContent');
        
        let adviceHTML = "";
        let confidence = 95;

        // Rule Engine
        if (user.diseases.includes('hypertension')) {
            if (stats.sodium > 2000) {
                adviceHTML += `<div class="card border-red" style="padding:10px; margin-bottom:10px;">⚠️ <strong>高血壓警示：</strong> 今日鈉攝取 (${stats.sodium}mg) 已接近危險邊緣。建議下一餐避免加工食品與湯品。</div>`;
            } else {
                adviceHTML += `<div class="text-success" style="margin-bottom:10px;">✅ 控制良好：對於高血壓患者，今日鈉攝取控制得宜。</div>`;
            }
        }

        if (stats.calories < user.tdee * 0.5) {
            adviceHTML += `<p>📉 <strong>熱量不足：</strong> 目前僅攝取 TDEE 的 50%，建議晚餐補充優質蛋白質（如雞胸肉、魚）與複合碳水。</p>`;
        } else if (stats.calories > user.tdee) {
            adviceHTML += `<p>📈 <strong>熱量超標：</strong> 今日已超過目標。建議晚餐改為清淡蔬菜湯或沙拉，並增加飲水。</p>`;
        } else {
            adviceHTML += `<p>🌟 <strong>營養均衡：</strong> 繼續保持！</p>`;
        }

        // 隨機建議
        const randomTips = [
            "💡 飯後散步 15 分鐘有助於血糖穩定。",
            "💡 建議將部分精緻澱粉替換為糙米或地瓜。",
            "💡 喝水足夠嗎？每日建議攝取 2000cc 水分。"
        ];
        adviceHTML += `<hr style="margin:10px 0"><p class="text-muted">${randomTips[Math.floor(Math.random()*3)]}</p>`;

        adviceBox.innerHTML = adviceHTML + `<small style="display:block; margin-top:10px; color:#999">AI 推論信心度: ${confidence}%</small>`;
    },

    // --- Use Case 5: Trends (Simple SVG) ---
    renderTrends: () => {
        // Mocking last 7 days data if empty
        const dataPoints = [2100, 1950, 2300, 1800, 2500, 2000, app.getDailyStats().calories || 2000];
        const maxVal = 3000;
        const width = 300;
        const height = 150;
        
        // Build Polyline points
        let points = "";
        const step = width / (dataPoints.length - 1);
        dataPoints.forEach((val, idx) => {
            const x = idx * step;
            const y = height - (val / maxVal * height);
            points += `${x},${y} `;
        });

        // Draw SVG
        const svg = document.getElementById('trendChartSvg');
        svg.innerHTML = `
            <polyline fill="none" stroke="#007bff" stroke-width="3" points="${points}" />
            <line x1="0" y1="${height - (app.state.currentUser.tdee/maxVal*height)}" x2="${width}" y2="${height - (app.state.currentUser.tdee/maxVal*height)}" stroke="#dc3545" stroke-dasharray="5,5" />
        `;

        // Stats
        const overCount = dataPoints.filter(v => v > app.state.currentUser.tdee).length;
        document.getElementById('trendStats').innerHTML = `
            <li>過去 7 天超標天數：<strong class="text-danger">${overCount} 天</strong></li>
            <li>平均每日熱量：${Math.round(dataPoints.reduce((a,b)=>a+b,0)/7)} kcal</li>
        `;
    },

    // --- Use Case 8: Medication Manager ---
    addMedication: () => {
        const name = document.getElementById('medNameInput').value.trim();
        const dose = document.getElementById('medDoseInput').value;
        if (!name) return;

        app.state.medications.push({ id: Date.now(), name, dose });
        app.saveToStorage();
        app.renderMedicationList();
        
        // Clear input
        document.getElementById('medNameInput').value = '';
        document.getElementById('medDoseInput').value = '';
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

        app.checkAllInteractions();
    },

    removeMedication: (id) => {
        app.state.medications = app.state.medications.filter(m => m.id !== id);
        app.saveToStorage();
        app.renderMedicationList();
    },

    checkInteraction: (foodLog) => {
        // Check Food vs Drugs
        const warnings = [];
        app.state.medications.forEach(med => {
            // Check if drug exists in DB
            const drugInfo = DRUG_INTERACTIONS[med.name]; // e.g., Warfarin
            if (drugInfo && drugInfo.food_tags) {
                // Check against food ingredients
                foodLog.ingredients.forEach(ing => {
                    if (drugInfo.food_tags[ing] === 'high') {
                        warnings.push(`💊 藥物 [${med.name}] 與 食材 [${ing}] 存在高風險交互作用！`);
                    }
                });
            }
        });
        return warnings;
    },

    checkAllInteractions: () => {
        const container = document.getElementById('interactionResults');
        const warnings = [];
        
        // Drug vs Drug Check
        const meds = app.state.medications;
        for (let i = 0; i < meds.length; i++) {
            for (let j = i + 1; j < meds.length; j++) {
                const d1 = meds[i].name;
                const d2 = meds[j].name;
                // Mock logic: if DB has interaction
                if (DRUG_INTERACTIONS[d1] && DRUG_INTERACTIONS[d1].drugs[d2] === 'high') {
                    warnings.push(`⚠️ 藥物衝突：${d1} 與 ${d2} 不建議同時服用`);
                }
            }
        }

        if (warnings.length > 0) {
            container.innerHTML = warnings.map(w => `<p class="text-danger">${w}</p>`).join('');
            container.parentElement.classList.add('border-red');
        } else {
            container.innerHTML = `<p class="text-success">目前藥物間無顯著交互作用。</p>`;
            container.parentElement.classList.remove('border-red');
        }
    },
    
    updateUI: () => {
        // Initial call to render current View
        const activeBtn = document.querySelector('.nav-btn.active');
        if(activeBtn) app.switchView(activeBtn.dataset.target);
        else app.switchView('dashboard');
    }
};

// Start App
window.addEventListener('DOMContentLoaded', app.init);