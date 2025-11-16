import React, { useState } from 'react';
import { Search, Video, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [roomId, setRoomId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 处理B站直播回放URL解析
  const parseBilibiliUrl = (url: string) => {
    // 支持多种B站URL格式
    // https://live.bilibili.com/12345
    // https://space.bilibili.com/123456/channel/seriesdetail?sid=1234567
    
    const roomIdMatch = url.match(/live\.bilibili\.com\/(\d+)/);
    if (roomIdMatch) {
      return roomIdMatch[1];
    }
    
    // 如果是空间页面，可能需要其他处理方式
    return null;
  };

  const handleInputChange = (value: string) => {
    // 检测是否是URL
    if (value.includes('bilibili.com')) {
      const parsedRoomId = parseBilibiliUrl(value);
      if (parsedRoomId) {
        setRoomId(parsedRoomId);
        setError('');
      } else {
        setError('无法解析B站直播回放URL，请直接输入直播间ID');
      }
    } else {
      setRoomId(value);
      setError('');
    }
  };

  const handleAnalyze = () => {
    if (!roomId.trim()) {
      setError('请输入直播间ID或B站直播回放URL');
      return;
    }
    
    if (!selectedDate) {
      setError('请选择直播日期');
      return;
    }

    setLoading(true);
    setError('');

    // 跳转到分析结果页面
    setTimeout(() => {
      setLoading(false);
      navigate(`/analysis?roomId=${roomId}&date=${selectedDate}`);
    }, 1000);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">冰屋自动路灯</h1>
                <p className="text-sm text-gray-600">B站直播回放弹幕分析工具</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>基于B站直播回放弹幕数据</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 介绍区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            发现直播回放中的
            <span className="text-blue-600"> 精彩时刻 </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            通过分析B站直播回放视频的弹幕数据，智能识别弹幕高峰时段，
            帮助UP主快速定位直播中的"高能时刻"，优化内容创作和精彩剪辑。
          </p>
        </div>

        {/* 功能特色 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">智能分析</h3>
            <p className="text-gray-600">自动识别弹幕高峰时段，发现直播精彩瞬间</p>
          </div>
          
          <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <div className="text-green-600 font-bold text-xl">📊</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">数据可视化</h3>
            <p className="text-gray-600">直观展示弹幕数量变化趋势和时间分布</p>
          </div>
          
          <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <div className="text-purple-600 font-bold text-xl">🏷️</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">热词提取</h3>
            <p className="text-gray-600">智能提取直播热门关键词和话题</p>
          </div>
        </div>

        {/* 输入区域 */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              开始分析直播回放
            </h3>
            
            <div className="space-y-6">
              {/* URL/ID 输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  直播间ID 或 B站直播回放URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="输入直播间ID（如：12345）或粘贴B站直播回放URL"
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  支持格式：https://live.bilibili.com/12345
                </p>
              </div>

              {/* 日期选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  直播日期
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={today}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Calendar className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  选择要分析的直播日期
                </p>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* 分析按钮 */}
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>分析中...</span>
                  </>
                ) : (
                  <>
                    <span>开始分析</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 使用提示</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 输入直播间ID或粘贴B站直播回放页面URL</li>
              <li>• 选择对应的直播日期</li>
              <li>• 系统会自动分析该直播回放的弹幕数据</li>
              <li>• 分析结果将展示弹幕高峰时段和热门关键词</li>
            </ul>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>基于B站公开API • 数据分析仅供参考 • 支持历史直播回放</p>
        </div>
      </main>
    </div>
  );
}