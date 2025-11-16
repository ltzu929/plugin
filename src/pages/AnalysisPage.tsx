import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Calendar, BarChart3, Filter, Eye, EyeOff } from 'lucide-react';
import DanmakuChart from '../components/DanmakuChart';
import ChartControls from '../components/ChartControls';
import KeywordSearch from '../components/KeywordSearch';

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

interface AnalysisPageProps {
  data?: DanmakuData;
}

export default function AnalysisPage({ data }: AnalysisPageProps) {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId') || '';
  const date = searchParams.get('date') || '';
  
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [danmakuData, setDanmakuData] = useState<DanmakuData | null>(data || null);
  const [loading, setLoading] = useState(!data);
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
    if (!roomId || !date) {
      setError('缺少必要的参数');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/danmaku/${roomId}/${date}`);
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

  // 页面加载时获取数据
  useEffect(() => {
    if (roomId && date) {
      fetchRoomInfo(roomId);
      fetchDanmakuData();
    }
  }, [roomId, date]);

  const handleExport = () => {
    if (!danmakuData) return;
    
    const dataStr = JSON.stringify(danmakuData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danmaku_${roomId}_${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/analysis?roomId=${roomId}&date=${date}`;
    if (navigator.share) {
      navigator.share({
        title: `B站直播回放弹幕分析 - ${roomInfo?.title || roomId}`,
        text: `直播间 ${roomId} 在 ${date} 的直播回放弹幕分析报告`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('分析链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">正在分析直播回放弹幕</h2>
          <p className="text-gray-600">请稍候，正在处理数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">分析失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (!danmakuData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">未找到数据</h2>
          <p className="text-gray-600 mb-4">无法获取直播回放弹幕数据</p>
          <Link 
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Link 
                to="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回首页
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">冰屋自动路灯</h1>
                <p className="text-xs text-gray-500">直播回放弹幕分析</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 mr-1.5" />
                导出
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                分享
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 直播信息卡片 */}
      {roomInfo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{roomInfo.title}</h2>
                  <p className="text-sm text-gray-600">
                    <span className="inline-flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      直播间ID: {roomInfo.room_id} • 分析日期: {date}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {danmakuData.totalDanmakus.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">总弹幕数</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* 快速统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40">
            <div className="text-xs text-gray-500 mb-1">数据点</div>
            <div className="text-lg font-bold text-blue-600">{danmakuData.stats.length}</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40">
            <div className="text-xs text-gray-500 mb-1">高峰时段</div>
            <div className="text-lg font-bold text-red-600">
              {danmakuData.stats.filter(s => s.peak).length}
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40">
            <div className="text-xs text-gray-500 mb-1">最大弹幕密度</div>
            <div className="text-lg font-bold text-green-600">
              {Math.max(...danmakuData.stats.map(s => s.count))}
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40">
            <div className="text-xs text-gray-500 mb-1">平均密度</div>
            <div className="text-lg font-bold text-purple-600">
              {Math.round(danmakuData.stats.reduce((sum, s) => sum + s.count, 0) / danmakuData.stats.length)}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDanmakuList(!showDanmakuList)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                showDanmakuList 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-white/40'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              弹幕列表
            </button>
            
            <button
              onClick={() => setShowKeywords(!showKeywords)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                showKeywords 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-white/40'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              热词表
            </button>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  弹幕数量与时间分布
                </h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  5分钟间隔
                </span>
              </div>
              <DanmakuChart 
                data={danmakuData.stats} 
                options={chartOptions}
              />
            </div>
          </div>
          
          <div className="xl:col-span-1">
            <ChartControls
              options={chartOptions}
              onOptionsChange={setChartOptions}
            />
          </div>
        </div>

        {/* 热词搜索 */}
        <div className="mt-4">
          <KeywordSearch 
            bvid={roomId}
            date={date}
            keywords={danmakuData.keywords}
          />
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <h3 className="font-medium text-blue-900">分析说明</h3>
          </div>
          <div className="text-sm text-blue-800 space-y-1 leading-relaxed">
            <p>• 本分析基于B站直播回放视频的弹幕数据</p>
            <p>• 高峰时段表示弹幕密度较高的精彩时刻</p>
            <p>• 可用于快速定位直播中的高能片段进行剪辑</p>
            <p>• 分析结果仅供参考，建议结合实际内容判断</p>
          </div>
        </div>
      </div>
    </div>
  );
}