import React, { useState, useEffect } from 'react';
import { Search, Calendar, BarChart3, Filter, Download, Share2, User, Home, Eye } from 'lucide-react';
import DanmakuChart from '../components/DanmakuChart';
import ChartControls from '../components/ChartControls';
import KeywordSearch from '../components/KeywordSearch';
import { format } from 'date-fns';

interface RoomInfo {
  room_id: number;
  title: string;
  uid: number;
  online: number;
}

interface DanmakuData {
  roomId: string;
  date: string;
  totalDanmakus: number;
  stats: any[];
  keywords: any[];
  danmakus: any[];
}

const API_BASE = 'http://localhost:3001/api';

export default function HomePage() {
  const [roomId, setRoomId] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [danmakuData, setDanmakuData] = useState<DanmakuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDanmakuList, setShowDanmakuList] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);
  const [chartOptions, setChartOptions] = useState({
    showAll: true,
    showPeakOnly: false,
    showChineseOnly: false,
    showEnglishOnly: false,
    showWithEmoji: false,
    highPrecision: false,
    smoothLine: true
  });

  // 获取直播间信息
  const fetchRoomInfo = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/room/${id}`);
      const data = await response.json();
      if (data.code === 0) {
        setRoomInfo(data.data);
      }
    } catch (error) {
      console.error('获取直播间信息失败:', error);
    }
  };

  // 获取弹幕数据
  const fetchDanmakuData = async () => {
    if (!roomId || !selectedDate) {
      setError('请输入直播间ID和选择直播日期');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/danmaku/${roomId}/${selectedDate}`);
      const data = await response.json();
      
      if (response.ok) {
        setDanmakuData(data);
      } else {
        setError(data.error || '获取直播回放弹幕数据失败');
      }
    } catch (error) {
      setError('网络请求失败，请检查服务器是否运行');
      console.error('获取直播回放弹幕数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当roomId改变时获取直播间信息
  useEffect(() => {
    if (roomId) {
      fetchRoomInfo(roomId);
    }
  }, [roomId]);

  const handleSearch = () => {
    fetchDanmakuData();
  };

  const handleExport = () => {
    if (!danmakuData) return;
    
    const dataStr = JSON.stringify(danmakuData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danmaku_${roomId}_${selectedDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `B站直播回放弹幕分析 - ${roomInfo?.title || roomId}`,
        text: `直播间 ${roomId} 在 ${selectedDate} 的直播回放弹幕分析报告`,
        url: window.location.href
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">冰屋自动路灯</h1>
              <p className="text-sm text-gray-600">本项目基于B站直播回放视频的弹幕数据分析</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">雪狐</p>
                  <p className="text-xs text-gray-500">01-1</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50 flex items-center space-x-1">
                  <Home className="w-3 h-3" />
                  <span>主页</span>
                </button>
                <button className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50 flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>详细图</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 搜索控制区域 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                直播间ID（用于定位直播回放）
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="请输入直播间ID（如：12345）"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                直播日期
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? '搜索中...' : '搜索'}</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 直播间信息 */}
          {roomInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-blue-900">{roomInfo.title}</h3>
              <p className="text-sm text-blue-700">在线人数: {roomInfo.online}</p>
            </div>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      {danmakuData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 操作按钮 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDanmakuList(!showDanmakuList)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{showDanmakuList ? '隐藏' : '显示'}弹幕列表</span>
              </button>
              
              <button
                onClick={() => setShowKeywords(!showKeywords)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>{showKeywords ? '隐藏' : '显示'}热词表</span>
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>导出数据</span>
              </button>
              
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>分享</span>
              </button>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  直播回放弹幕数量与时间(5min) - 总计: {danmakuData.totalDanmakus} 条
                </h2>
                <DanmakuChart 
                  data={danmakuData.stats} 
                  options={chartOptions}
                />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <ChartControls
                options={chartOptions}
                onOptionsChange={setChartOptions}
              />
            </div>
          </div>

          {/* 热词搜索 */}
          <div className="mt-6">
            <KeywordSearch 
              bvid={roomId}
              date={selectedDate}
              keywords={danmakuData.keywords}
            />
          </div>

          {/* 使用说明 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">使用说明</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• 本工具基于B站直播回放视频弹幕数据进行分析，数据来源于B站公开API</p>
              <p>• 分析结果仅供参考，可能存在数据遗漏或不准确的情况</p>
              <p>• 高峰时段识别基于弹幕数量统计，超过平均值1.5倍视为精彩时刻</p>
              <p>• 热词提取使用智能分词算法，支持中文关键词识别</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}