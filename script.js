// 家庭资产管理应用
class AssetManager {
    constructor() {
        this.assets = this.loadAssets();
        this.currentFilter = 'all';
        this.charts = {};
        
        this.init();
    }

    // 初始化应用
    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderAssets();
        this.setDefaultDate();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航标签切换
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-tab').dataset.tab);
            });
        });

        // 资产表单提交
        document.getElementById('assetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAsset();
        });

        // 编辑表单提交
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateAsset();
        });

        // 过滤器按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 模态框关闭
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeModal();
        });

        // 点击模态框背景关闭
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeModal();
            }
        });

        // 返回按钮事件
        document.getElementById('backBtn').addEventListener('click', () => {
            this.goBack();
        });
    }

    // 切换标签页
    switchTab(tabName) {
        // 更新导航标签状态
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // 根据标签页更新内容
        if (tabName === 'dashboard') {
            this.updateDashboard();
        } else if (tabName === 'assets') {
            this.renderAssets();
        }
    }

    // 设置过滤器
    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新过滤器按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.renderAssets();
    }

    // 添加资产
    addAsset() {
        const form = document.getElementById('assetForm');
        const formData = new FormData(form);
        
        const asset = {
            id: Date.now().toString(),
            name: formData.get('name'),
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            date: formData.get('date'),
            createdAt: new Date().toISOString()
        };

        this.assets.push(asset);
        this.saveAssets();
        this.updateDashboard();
        this.renderAssets();
        
        form.reset();
        this.setDefaultDate();
        
        this.showToast('资产添加成功！');
        
        // 切换到资产列表页面
        this.switchTab('assets');
    }

    // 编辑资产
    editAsset(id) {
        const asset = this.assets.find(a => a.id === id);
        if (!asset) return;

        // 填充编辑表单
        document.getElementById('editId').value = asset.id;
        document.getElementById('editName').value = asset.name;
        document.getElementById('editType').value = asset.type;
        document.getElementById('editAmount').value = asset.amount;
        document.getElementById('editDescription').value = asset.description;
        document.getElementById('editDate').value = asset.date;

        // 显示模态框
        document.getElementById('editModal').classList.add('active');
    }

    // 更新资产
    updateAsset() {
        const form = document.getElementById('editForm');
        const formData = new FormData(form);
        
        const id = formData.get('id');
        const assetIndex = this.assets.findIndex(a => a.id === id);
        
        if (assetIndex !== -1) {
            this.assets[assetIndex] = {
                ...this.assets[assetIndex],
                name: formData.get('name'),
                type: formData.get('type'),
                amount: parseFloat(formData.get('amount')),
                description: formData.get('description'),
                date: formData.get('date'),
                updatedAt: new Date().toISOString()
            };

            this.saveAssets();
            this.updateDashboard();
            this.renderAssets();
            this.closeModal();
            
            this.showToast('资产更新成功！');
        }
    }

    // 删除资产
    deleteAsset(id) {
        if (confirm('确定要删除这个资产吗？')) {
            this.assets = this.assets.filter(a => a.id !== id);
            this.saveAssets();
            this.updateDashboard();
            this.renderAssets();
            
            this.showToast('资产删除成功！');
        }
    }

    // 关闭模态框
    closeModal() {
        document.getElementById('editModal').classList.remove('active');
    }

    // 返回上一页（浏览器级别）
    goBack() {
        // 检查是否有历史记录可以返回
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // 如果没有历史记录，可以跳转到首页或其他页面
            // 这里可以根据需要修改跳转地址
            window.location.href = '/';
        }
    }

    // 渲染资产列表
    renderAssets() {
        const assetsList = document.getElementById('assetsList');
        const filteredAssets = this.getFilteredAssets();

        if (filteredAssets.length === 0) {
            assetsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wallet"></i>
                    <h3>暂无资产</h3>
                    <p>点击"添加"标签页来添加您的第一个资产</p>
                </div>
            `;
            return;
        }

        assetsList.innerHTML = filteredAssets.map(asset => `
            <div class="asset-item" data-type="${asset.type}">
                <div class="asset-header">
                    <div class="asset-info">
                        <h3>${asset.name}</h3>
                        <span class="asset-type">${this.getTypeLabel(asset.type)}</span>
                    </div>
                    <div class="asset-amount">¥${this.formatNumber(asset.amount)}</div>
                </div>
                <div class="asset-details">
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(asset.date)}</p>
                    ${asset.description ? `<p><i class="fas fa-comment"></i> ${asset.description}</p>` : ''}
                </div>
                <div class="asset-actions">
                    <button class="btn btn-edit" onclick="assetManager.editAsset('${asset.id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn btn-delete" onclick="assetManager.deleteAsset('${asset.id}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 获取过滤后的资产
    getFilteredAssets() {
        if (this.currentFilter === 'all') {
            return this.assets;
        }
        return this.assets.filter(asset => asset.type === this.currentFilter);
    }

    // 更新仪表板
    updateDashboard() {
        const totals = this.calculateTotals();
        
        // 更新总资产
        document.getElementById('totalAmount').textContent = `¥${this.formatNumber(totals.total)}`;
        
        // 更新各类资产总额
        document.getElementById('cashTotal').textContent = `¥${this.formatNumber(totals.cash)}`;
        document.getElementById('bankTotal').textContent = `¥${this.formatNumber(totals.bank)}`;
        document.getElementById('investmentTotal').textContent = `¥${this.formatNumber(totals.investment)}`;
        document.getElementById('propertyTotal').textContent = `¥${this.formatNumber(totals.property)}`;

        // 更新资产分布图表
        this.updateAssetChart();
    }

    // 计算各类资产总额
    calculateTotals() {
        const totals = {
            total: 0,
            cash: 0,
            bank: 0,
            investment: 0,
            property: 0,
            vehicle: 0,
            jewelry: 0,
            antique: 0,
            other: 0
        };

        this.assets.forEach(asset => {
            totals.total += asset.amount;
            totals[asset.type] += asset.amount;
        });

        return totals;
    }

    // 更新资产分布图表
    updateAssetChart() {
        const ctx = document.getElementById('assetChart');
        if (!ctx) return;

        const totals = this.calculateTotals();
        const data = [
            { label: '现金', value: totals.cash, color: '#CAF4F7' },
            { label: '银行', value: totals.bank, color: '#A8E6E8' },
            { label: '投资', value: totals.investment, color: '#7DD3DB' },
            { label: '房产', value: totals.property, color: '#5BC0C7' },
            { label: '车辆', value: totals.vehicle, color: '#4A9BA3' },
            { label: '珠宝', value: totals.jewelry, color: '#3A7B80' },
            { label: '古董', value: totals.antique, color: '#2A5B5E' },
            { label: '其他', value: totals.other, color: '#1A3B3D' }
        ].filter(item => item.value > 0);

        if (this.charts.assetChart) {
            this.charts.assetChart.destroy();
        }

        this.charts.assetChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.label),
                datasets: [{
                    data: data.map(item => item.value),
                    backgroundColor: data.map(item => item.color),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ¥${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }


    // 获取类型标签
    getTypeLabel(type) {
        const labels = {
            cash: '现金',
            bank: '银行存款',
            investment: '投资理财',
            property: '房产',
            vehicle: '车辆',
            jewelry: '珠宝首饰',
            antique: '古董收藏',
            other: '其他'
        };
        return labels[type] || type;
    }

    // 格式化数字
    formatNumber(num) {
        return num.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    // 设置默认日期
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('assetDate').value = today;
    }

    // 显示提示消息
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // 保存资产数据到本地存储
    saveAssets() {
        localStorage.setItem('familyAssets', JSON.stringify(this.assets));
    }

    // 从本地存储加载资产数据
    loadAssets() {
        const saved = localStorage.getItem('familyAssets');
        return saved ? JSON.parse(saved) : [];
    }
}

// 初始化应用
let assetManager;
document.addEventListener('DOMContentLoaded', () => {
    assetManager = new AssetManager();
});

// 添加一些示例数据（仅在首次使用时）
if (!localStorage.getItem('familyAssets')) {
    const sampleAssets = [
        // 现金资产
        {
            id: '1',
            name: '家庭备用现金',
            type: 'cash',
            amount: 8000,
            description: '日常开销备用金',
            date: '2024-01-01',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: '2',
            name: '零花钱',
            type: 'cash',
            amount: 2000,
            description: '个人零用钱',
            date: '2024-01-15',
            createdAt: '2024-01-15T00:00:00.000Z'
        },
        
        // 银行资产
        {
            id: '3',
            name: '工商银行储蓄卡',
            type: 'bank',
            amount: 120000,
            description: '主要储蓄账户',
            date: '2024-01-01',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: '4',
            name: '建设银行定期存款',
            type: 'bank',
            amount: 50000,
            description: '一年期定期存款',
            date: '2024-02-01',
            createdAt: '2024-02-01T00:00:00.000Z'
        },
        {
            id: '5',
            name: '招商银行信用卡',
            type: 'bank',
            amount: -5000,
            description: '信用卡欠款',
            date: '2024-03-01',
            createdAt: '2024-03-01T00:00:00.000Z'
        },
        
        // 投资资产
        {
            id: '6',
            name: '股票投资',
            type: 'investment',
            amount: 80000,
            description: 'A股市场投资',
            date: '2024-01-10',
            createdAt: '2024-01-10T00:00:00.000Z'
        },
        {
            id: '7',
            name: '基金投资',
            type: 'investment',
            amount: 45000,
            description: '混合型基金',
            date: '2024-01-15',
            createdAt: '2024-01-15T00:00:00.000Z'
        },
        {
            id: '8',
            name: '理财产品',
            type: 'investment',
            amount: 30000,
            description: '银行理财产品',
            date: '2024-02-10',
            createdAt: '2024-02-10T00:00:00.000Z'
        },
        
        // 房产
        {
            id: '9',
            name: '自住房产',
            type: 'property',
            amount: 2800000,
            description: '三室两厅，120平米',
            date: '2020-05-01',
            createdAt: '2020-05-01T00:00:00.000Z'
        },
        {
            id: '10',
            name: '投资房产',
            type: 'property',
            amount: 1500000,
            description: '两室一厅，用于出租',
            date: '2022-08-15',
            createdAt: '2022-08-15T00:00:00.000Z'
        },
        
        // 车辆
        {
            id: '11',
            name: '家用轿车',
            type: 'vehicle',
            amount: 180000,
            description: '2021年购买，行驶3万公里',
            date: '2021-03-20',
            createdAt: '2021-03-20T00:00:00.000Z'
        },
        {
            id: '12',
            name: '电动车',
            type: 'vehicle',
            amount: 8000,
            description: '日常代步工具',
            date: '2023-06-01',
            createdAt: '2023-06-01T00:00:00.000Z'
        },
        
        // 珠宝首饰
        {
            id: '13',
            name: '黄金项链',
            type: 'jewelry',
            amount: 15000,
            description: '18K金项链，30克',
            date: '2023-12-25',
            createdAt: '2023-12-25T00:00:00.000Z'
        },
        {
            id: '14',
            name: '钻石戒指',
            type: 'jewelry',
            amount: 25000,
            description: '1克拉钻石戒指',
            date: '2022-02-14',
            createdAt: '2022-02-14T00:00:00.000Z'
        },
        
        // 古董收藏
        {
            id: '15',
            name: '清代花瓶',
            type: 'antique',
            amount: 120000,
            description: '清代青花瓷花瓶',
            date: '2021-10-01',
            createdAt: '2021-10-01T00:00:00.000Z'
        },
        {
            id: '16',
            name: '字画收藏',
            type: 'antique',
            amount: 80000,
            description: '现代名家字画',
            date: '2023-05-01',
            createdAt: '2023-05-01T00:00:00.000Z'
        },
        
        // 其他资产
        {
            id: '17',
            name: '保险现金价值',
            type: 'other',
            amount: 35000,
            description: '人寿保险现金价值',
            date: '2024-01-01',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: '18',
            name: '公积金账户',
            type: 'other',
            amount: 85000,
            description: '住房公积金余额',
            date: '2024-01-01',
            createdAt: '2024-01-01T00:00:00.000Z'
        }
    ];
    localStorage.setItem('familyAssets', JSON.stringify(sampleAssets));
}
