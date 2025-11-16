import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileAudio, Download } from 'lucide-react';

interface AudioTextProps {
  onTextGenerated: (text: string) => void;
}

export default function AudioText({ onTextGenerated }: AudioTextProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('请选择音频文件');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('请先选择音频文件');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('audio', selectedFile);

      // 调用后端API进行语音转文字
      const response = await fetch('/api/audio-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('转换失败，请检查音频文件格式');
      }

      const data = await response.json();
      setResult(data.text);
      onTextGenerated(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换过程中出现错误');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'audio'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-800 dark:text-white">
            语音转文字
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 文件选择 */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              选择音频文件
            </Button>
            
            {selectedFile && (
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FileAudio className="w-5 h-5 mr-2 text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedFile.name}
                </span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleConvert}
            disabled={loading || !selectedFile}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                转换中...
              </>
            ) : (
              '开始转换'
            )}
          </Button>

          {/* 转换结果 */}
          {result && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">
                  转换结果
                </Label>
                <Textarea
                  value={result}
                  readOnly
                  rows={8}
                  className="mt-2 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                下载文本文件
              </Button>
            </div>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>• 支持MP3、WAV、M4A等常见音频格式</p>
            <p>• 自动识别中文语音并转换为文字</p>
            <p>• 支持下载转换后的文本文件</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}