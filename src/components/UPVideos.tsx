import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Eye, Trash2 } from 'lucide-react';

interface Video {
  title: string;
  cover: string;
  duration: string;
  viewCount: string | number;
  date: string;
  url: string;
  bvid?: string;
}

interface UPVideosProps {
  onVideoSelect: (video: Video) => void;
}

export default function UPVideos({ onVideoSelect }: UPVideosProps) {
  const [seriesUrl, setSeriesUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [history, setHistory] = useState<Array<{ time: number; upName: string; upFace?: string; url: string }>>([]);
  const cache = useMemo(() => new Map<string, any>(), []);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      apiFetch('/api/history').then(r => r.json()).then(arr => {
        if (Array.isArray(arr)) {
          setHistory(arr as Array<{ time: number; upName: string; upFace?: string; url: string }>);
        }
      }).catch(() => {});
      const raw = localStorage.getItem('up_series_history');
      if (raw) {
        const arr: Array<{ time: number; upName: string; upFace?: string; url: string }> = JSON.parse(raw);
        const map = new Map<string, { time: number; upName: string; upFace?: string; url: string }>();
        for (const item of arr || []) {
          const prev = map.get(item.url);
          if (!prev || item.time > prev.time) map.set(item.url, item);
        }
        setHistory(Array.from(map.values()).sort((a,b) => b.time - a.time));
      }
    } catch {}
  }, []);

  const saveHistory = (upName: string, upFace: string, url: string) => {
    const item = { time: Date.now(), upName, upFace, url };
    const map = new Map<string, { time: number; upName: string; upFace?: string; url: string }>();
    map.set(item.url, item);
    for (const h of history) {
      if (!map.has(h.url)) map.set(h.url, h);
    }
    const next = Array.from(map.values()).sort((a,b) => b.time - a.time).slice(0, 50);
    setHistory(next);
    try { localStorage.setItem('up_series_history', JSON.stringify(next)); } catch {}
    apiFetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).catch(() => {});
  };

  const handleRefresh = async () => {
    if (!seriesUrl.trim()) return;
    await handleSearch(seriesUrl, true);
  };

  const deleteHistory = (url: string) => {
    const next = history.filter(h => h.url !== url);
    setHistory(next);
    try { localStorage.setItem('up_series_history', JSON.stringify(next)); } catch {}
    apiFetch(`/api/history?url=${encodeURIComponent(url)}`, { method: 'DELETE' }).catch(() => {});
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('up_series_history'); } catch {}
    apiFetch('/api/history', { method: 'DELETE' }).catch(() => {});
  };

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const arr = [...history];
    const [item] = arr.splice(dragIndex, 1);
    arr.splice(targetIndex, 0, item);
    setHistory(arr);
    try { localStorage.setItem('up_series_history', JSON.stringify(arr)); } catch {}
    setDragIndex(null);
  };

  const handleSearch = async (incomingUrl?: string, force?: boolean) => {
    const url = (incomingUrl ?? seriesUrl).trim();
    if (!url) {
      setError('请输入合集链接');
      return;
    }
    const ok = /https?:\/\/space\.bilibili\.com\/(\d+)\/lists\/(\d+).*type=series/i.test(url);
    if (!ok) {
      setError('链接格式不正确，请输入B站合集链接');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!force && cache.has(url)) {
        const data = cache.get(url);
        setVideos(data.list.map((v: any) => ({
          title: v.title,
          cover: v.cover,
          duration: v.duration ? `${Math.floor(v.duration/60)}:${(v.duration%60).toString().padStart(2,'0')}` : '',
          viewCount: v.viewCount,
          date: v.date,
          url: v.url,
          bvid: v.bvid,
        })));
        saveHistory(data.upName || '', data.upFace || '', url);
        return;
      }

      const resp = await apiFetch('/api/up-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '获取合集失败');

      cache.set(url, data);
      saveHistory(data.upName || '', data.upFace || '', url);
      setVideos((data.list || []).map((v: any) => ({
        title: v.title,
        cover: v.cover,
        duration: v.duration ? `${Math.floor(v.duration/60)}:${(v.duration%60).toString().padStart(2,'0')}` : '',
        viewCount: v.viewCount,
        date: v.date,
        url: v.url,
        bvid: v.bvid,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取视频列表失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800 dark:text-white">
            UP主直播回放合集
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="seriesUrl" className="text-gray-700 dark:text-gray-300">
              合集链接
            </Label>
            <Input
              id="seriesUrl"
              type="url"
              placeholder="请输入B站UP主直播回放合集链接"
              value={seriesUrl}
              onChange={(e) => {
                const v = e.target.value;
                setSeriesUrl(v);
                const ok = /https?:\/\/space\.bilibili\.com\/(\d+)\/lists\/(\d+).*type=series/i.test(v.trim());
                if (ok) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(seriesUrl);
                }
              }}
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              disabled={loading}
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={() => handleSearch()}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                搜索中...
              </>
            ) : (
              '加载合集内容'
            )}
          </Button>

          <div className="flex items-center justify-between">
            <Button onClick={handleRefresh} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
              刷新页面
            </Button>
            <Button onClick={clearHistory} className="text-sm bg-red-50 hover:bg-red-100 text-red-600">
              清空历史
            </Button>
          </div>

          {videos.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => onVideoSelect(video)}>
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                    <img 
                      src={video.cover ? apiUrl(`/api/cover?url=${encodeURIComponent(video.cover)}`) : ''} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {video.viewCount}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {video.date}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">历史记录</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {history.slice().sort((a,b) => b.time - a.time).map((h, idx) => (
                  <Card key={idx} className="p-3 relative cursor-pointer overflow-hidden" onClick={() => { setSeriesUrl(h.url); handleSearch(h.url); }} draggable onDragStart={() => setDragIndex(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(idx)}>
                    <div className="flex items-center justify-between pr-8">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                          {h.upFace ? (
                            <img src={apiUrl(`/api/cover?url=${encodeURIComponent(h.upFace)}`)} alt={h.upName} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{h.upName || '未知UP'}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[220px]">{h.url}</span>
                        </div>
                      </div>
                      <button
                        className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md h-7 w-7 bg-red-50 text-red-600 hover:bg-red-100"
                        onClick={(e) => { e.stopPropagation(); deleteHistory(h.url); }}
                        aria-label="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}