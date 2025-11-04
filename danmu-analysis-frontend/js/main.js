// Main JavaScript for Bilibili Danmu Analysis
class DanmuAnalyzer {
    constructor() {
        this.apiUrl = 'http://localhost:5001/api/danmu';
        this.chart = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupChart();
    }

    bindEvents() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const videoUrlInput = document.getElementById('videoUrl');
        const retryBtn = document.getElementById('retryBtn');

        analyzeBtn.addEventListener('click', () => this.analyzeVideo());
        retryBtn.addEventListener('click', () => this.analyzeVideo());
        
        // Allow Enter key to trigger analysis
        videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeVideo();
            }
        });
    }

    async analyzeVideo() {
        const videoUrl = document.getElementById('videoUrl').value.trim();
        
        if (!videoUrl) {
            this.showError('请输入有效的B站视频链接');
            return;
        }

        // Validate Bilibili URL format
        if (!this.isValidBilibiliUrl(videoUrl)) {
            this.showError('请输入有效的B站视频链接（例如：https://www.bilibili.com/video/BV...）');
            return;
        }

        this.showLoading();
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: videoUrl })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayResults(data);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('分析视频失败。请检查网络连接后重试。');
        }
    }

    isValidBilibiliUrl(url) {
        const bilibiliPattern = /^https:\/\/(www\.)?bilibili\.com\/video\/[A-Za-z0-9]+/;
        return bilibiliPattern.test(url);
    }

    showLoading() {
        this.hideAllStates();
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('analyzeBtn').disabled = true;
    }

    showError(message) {
        this.hideAllStates();
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorState').classList.remove('hidden');
        document.getElementById('analyzeBtn').disabled = false;
    }

    hideAllStates() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('errorState').classList.add('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
    }

    displayResults(data) {
        this.hideAllStates();
        
        // Update video info
        this.updateVideoInfo(data);
        
        // Update time distribution chart
        this.updateTimeChart(data.time_distribution);
        
        // Update highlights
        this.updateHighlights(data.highlights || []);
        
        // Update hot words
        this.updateHotWords(data.hot_words || []);
        
        // Show results
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('analyzeBtn').disabled = false;
    }

    updateVideoInfo(data) {
        document.getElementById('totalDanmu').textContent = this.formatNumber(data.total_danmu || 0);
        document.getElementById('analysisTime').textContent = this.formatTime(data.analysis_time || 0);
        document.getElementById('videoDuration').textContent = this.formatDuration(data.video_duration || 0);
    }

    updateTimeChart(timeDistribution) {
        const ctx = document.getElementById('timeChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Prepare data
        const labels = timeDistribution.map(item => this.formatTime(item.time));
        const values = timeDistribution.map(item => item.count);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Danmu Count',
                    data: values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
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
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return `时间：${context[0].label}`;
                            },
                            label: function(context) {
                                return `弹幕数量：${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '时间（分钟）',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '弹幕数量',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    updateHighlights(highlights) {
        const highlightsList = document.getElementById('highlightsList');
        
        if (highlights.length === 0) {
            highlightsList.innerHTML = '<p class="no-data">未检测到高能时刻。</p>';
            return;
        }

        highlightsList.innerHTML = highlights.map(highlight => `
            <div class="highlight-item">
                <div class="highlight-time">${this.formatTime(highlight.time)}</div>
                <div class="highlight-description">${highlight.description || '高活跃时段'}</div>
                <div class="highlight-stats">
                    <span>峰值：${this.formatNumber(highlight.peak_count || 0)} 条弹幕</span>
                    <span>持续：${this.formatDuration(highlight.duration || 0)}</span>
                </div>
            </div>
        `).join('');
    }

    updateHotWords(hotWords) {
        // Update word cloud
        const wordCloud = document.getElementById('wordCloud');
        if (hotWords.length === 0) {
            wordCloud.innerHTML = '<p class="no-data">未检测到热词。</p>';
        } else {
            const maxCount = Math.max(...hotWords.map(word => word.count));
            wordCloud.innerHTML = hotWords.slice(0, 20).map(word => {
                const size = Math.max(12, (word.count / maxCount) * 24 + 12);
                const opacity = Math.max(0.6, word.count / maxCount);
                return `
                    <span class="word-item" style="font-size: ${size}px; opacity: ${opacity}">
                        ${word.word}
                    </span>
                `;
            }).join('');
        }

        // Update top words list
        const topWordsList = document.getElementById('topWordsList');
        if (hotWords.length === 0) {
            topWordsList.innerHTML = '<p class="no-data">未检测到热词。</p>';
        } else {
            topWordsList.innerHTML = hotWords.slice(0, 10).map((word, index) => `
                <div class="word-rank">
                    <span class="word-text">${index + 1}. ${word.word}</span>
                    <span class="word-count">${this.formatNumber(word.count)}</span>
                </div>
            `).join('');
        }
    }

    setupChart() {
        // Chart will be initialized when data is available
        const ctx = document.getElementById('timeChart').getContext('2d');
        
        // Create empty chart for initial state
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Danmu Count',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '时间（分钟）',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '弹幕数量',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DanmuAnalyzer();
});

// Add some additional interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for better UX
    const style = document.createElement('style');
    style.textContent = `
        .highlight-stats {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .no-data {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
        }
        
        /* Enhanced hover effects */
        .word-item {
            cursor: pointer;
        }
        
        .highlight-item {
            cursor: pointer;
        }
        
        /* Loading animation enhancement */
        .loading-state p {
            font-size: 1.1rem;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);
});