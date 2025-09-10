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
        this.updateStatistics();
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
        } else if (tabName === 'statistics') {
            this.updateStatistics();
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
        this.updateStatistics();
        
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
            this.updateStatistics();
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
            this.updateStatistics();
            
            this.showToast('资产删除成功！');
        }
    }

    // 关闭模态框
    closeModal() {
        document.getElementById('editModal').classList.remove('active');
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

    // 更新统计页面
    updateStatistics() {
        this.updateTypeChart();
        this.updateTrendChart();
        this.updateStatsGrid();
    }

    // 更新资产类型分布图表
    updateTypeChart() {
        const ctx = document.getElementById('typeChart');
        if (!ctx) return;

        const totals = this.calculateTotals();
        const data = [
            { label: '现金', value: totals.cash },
            { label: '银行', value: totals.bank },
            { label: '投资', value: totals.investment },
            { label: '房产', value: totals.property },
            { label: '车辆', value: totals.vehicle },
            { label: '珠宝', value: totals.jewelry },
            { label: '古董', value: totals.antique },
            { label: '其他', value: totals.other }
        ].filter(item => item.value > 0);

        if (this.charts.typeChart) {
            this.charts.typeChart.destroy();
        }

        this.charts.typeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.label),
                datasets: [{
                    label: '资产金额',
                    data: data.map(item => item.value),
                    backgroundColor: '#CAF4F7',
                    borderColor: '#A8E6E8',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `¥${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // 更新趋势图表
    updateTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        // 生成最近6个月的数据
        const months = [];
        const data = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(date.toLocaleDateString('zh-CN', { month: 'short' }));
            
            // 计算该月之前的资产总额（模拟数据）
            const monthAssets = this.assets.filter(asset => {
                const assetDate = new Date(asset.date);
                return assetDate <= date;
            });
            
            const monthTotal = monthAssets.reduce((sum, asset) => sum + asset.amount, 0);
            data.push(monthTotal);
        }

        if (this.charts.trendChart) {
            this.charts.trendChart.destroy();
        }

        this.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '资产总额',
                    data: data,
                    borderColor: '#CAF4F7',
                    backgroundColor: 'rgba(202, 244, 247, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#CAF4F7',
                    pointBorderColor: '#A8E6E8',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `¥${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // 更新统计网格
    updateStatsGrid() {
        const totals = this.calculateTotals();
        
        document.getElementById('totalCount').textContent = this.assets.length;
        document.getElementById('avgValue').textContent = `¥${this.formatNumber(totals.total / Math.max(this.assets.length, 1))}`;
        
        if (this.assets.length > 0) {
            const amounts = this.assets.map(asset => asset.amount);
            document.getElementById('maxValue').textContent = `¥${this.formatNumber(Math.max(...amounts))}`;
            document.getElementById('minValue').textContent = `¥${this.formatNumber(Math.min(...amounts))}`;
        } else {
            document.getElementById('maxValue').textContent = '¥0';
            document.getElementById('minValue').textContent = '¥0';
        }
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
        {
            id: '1',
            name: '现金',
            type: 'cash',
            amount: 5000,
            description: '家庭备用现金',
            date: '2024-01-01',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: '2',
            name: '工商银行储蓄卡',
            type: 'bank',
            amount: 50000,
            description: '主要储蓄账户',
            date: '2024-01-01',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: '3',
            name: '基金投资',
            type: 'investment',
            amount: 30000,
            description: '股票型基金',
            date: '2024-01-15',
            createdAt: '2024-01-15T00:00:00.000Z'
        }
    ];
    localStorage.setItem('familyAssets', JSON.stringify(sampleAssets));
}
