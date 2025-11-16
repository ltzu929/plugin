import { useState } from 'react';
import SidebarLayout from './SidebarLayout';
import DanmakuAnalysis from './DanmakuAnalysis';
import UPVideos from './UPVideos';
import AudioText from './AudioText';
import VideoAnalysisPage from '@/pages/VideoAnalysisPage';
import SettingsPage from '@/pages/SettingsPage';

type ActiveTab = 'danmaku' | 'up-videos' | 'audio-text' | 'settings';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('danmaku');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
  };

  const handleVideoSelect = (video: any) => {
    setSelectedVideo(video);
    // 自动切换到弹幕分析页面，使用选中的视频URL
    setActiveTab('danmaku');
  };

  const handleTextGenerated = (text: string) => {
    console.log('生成的文字:', text);
  };

  const handleReturnHome = () => {
    setAnalysisData(null);
    setSelectedVideo(null);
    setActiveTab('up-videos');
  };

  const renderContent = () => {
    if (analysisData) {
      return <VideoAnalysisPage data={analysisData} onReturnHome={handleReturnHome} />;
    }

    switch (activeTab) {
      case 'danmaku':
        return <DanmakuAnalysis onAnalysisComplete={handleAnalysisComplete} initialUrl={selectedVideo?.url} />;
      case 'up-videos':
        return <UPVideos onVideoSelect={handleVideoSelect} />;
      case 'audio-text':
        return <AudioText onTextGenerated={handleTextGenerated} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DanmakuAnalysis onAnalysisComplete={handleAnalysisComplete} initialUrl={selectedVideo?.url} />;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
  };

  return (
    <SidebarLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </SidebarLayout>
  );
}