# Bilibili 弹幕获取与音频转字幕工具

这是一个集成了两项主要功能的 Python 项目：
1.  **Bilibili 弹幕获取与分析**: 从指定的 Bilibili 视频链接中提取弹幕数据，并进行高能时刻分析。
2.  **自动音频转字幕**: 监控指定文件夹，当有新的音频文件出现时，自动调用腾讯云的语音识别（ASR）服务，将其转换为 SRT 字幕文件。

## 主要功能

### 音频转字幕
- **实时文件夹监控**: 自动检测指定目录下的新音频文件。
- **云端上传**: 将本地音频文件上传到腾讯云对象存储（COS），以便进行处理。
- **自动语音识别**: 调用腾讯云语音识别极速版服务，将音频转换为文字。
- **SRT 字幕生成**: 将识别出的文字和时间戳格式化为标准的 `.srt` 字幕文件。
- **自动清理**: 字幕生成后，自动删除上传到 COS 的临时音频文件，节省存储空间。
- **灵活配置**: 所有关键参数（如云服务密钥、监控路径等）都通过 `config.ini` 文件进行配置，方便修改。

### Bilibili 弹幕获取与分析
- **链接解析**: 自动从 Bilibili 视频链接中提取 BV 号。
- **弹幕抓取**: 调用 Bilibili 官方 API 获取视频的实时弹幕数据。
- **数据分析**: 对弹幕进行时间分布分析，识别视频中的高能时刻。
- **热词统计**: 统计每个时间段的热门弹幕词汇，了解观众关注点。
- **可视化展示**: 通过前端界面直观展示弹幕分布和高能时刻。

## 系统架构

本项目为纯后端服务，提供以下核心功能：
- **弹幕分析API**: 一个Flask Web服务器，提供用于Bilibili弹幕分析的API接口。
- **音频监控服务**: 一个在后台运行的独立服务，用于监控文件夹并自动将音频转换为字幕。

## 文件结构

```
.
├── main.py         # 主程序入口，同时启动Web服务器和音频监控服务
├── danmu.py        # Bilibili 弹幕获取与分析模块
├── audio_text.py   # 音频转字幕模块
├── config.ini      # 配置文件，需要您手动创建和填写
├── requirements.txt# 项目依赖文件
└── readme.md       # 本说明文件
```

## 使用步骤

### 1. 配置 `config.ini` 文件

在项目根目录下手动创建一个名为 `config.ini` 的文件，并填入以下内容。请将 `YOUR_...` 部分替换为您自己的信息。

```ini
[TencentCloud]
# 访问 https://console.cloud.tencent.com/cam/capi 获取
SecretId = YOUR_SECRET_ID
SecretKey = YOUR_SECRET_KEY
# 对象存储（COS）和语音识别（ASR）服务所在的地域，例如：ap-guangzhou
Region = ap-guangzhou
# 您的腾讯云对象存储桶名称，例如：myaudiofiles-1250000000
Bucket = YOUR_BUCKET_NAME

[Watch]
# 需要监控的本地文件夹路径，请使用绝对路径，例如：D:\audios
WatchPath = C:\path\to\your\audio\folder
# 支持的音频文件格式，用逗号分隔
AudioFormats = .mp3,.wav,.m4a,.flac,.aac
```

**如何获取配置信息？**

-   `SecretId` 和 `SecretKey`: 前往腾讯云 [API密钥管理](https://console.cloud.tencent.com/cam/capi) 页面创建和获取。
-   `Region`: 登录腾讯云控制台，在对象存储或语音识别服务页面查看您选择的地域，例如 `ap-beijing`, `ap-shanghai`。
-   `Bucket`: 前往腾讯云 [对象存储控制台](https://console.cloud.tencent.com/cos/bucket) 创建一个存储桶，并将其名称填入此处。

### 2. 安装依赖库

在您的终端或命令行中，进入项目目录，并运行以下命令来安装所有必需的 Python 库：

```shell
pip install -r requirements.txt
```

*建议在虚拟环境中安装，以避免与系统库冲突。*

### 3. 运行脚本

确保您的 `config.ini` 文件已正确配置，然后在终端中运行主脚本：

```shell
python main.py
```

脚本启动后，会同时启动Flask服务器和音频监控服务。

### 4. 开始使用

**对于音频转字幕功能：**

将一个或多个支持的音频文件（例如 `my_audio.mp3`）复制或移动到您在 `config.ini` 中设置的 `WatchPath` 文件夹中。

脚本会自动执行以下操作：
1.  检测到新文件。
2.  将其上传到您的腾讯云 COS 存储桶。
3.  创建一个语音识别任务。
4.  等待任务完成。
5.  在 `WatchPath` 文件夹中生成一个同名的 `.srt` 字幕文件（例如 `my_audio.srt`）。
6.  从 COS 中删除该音频文件。

整个过程全自动，您只需关注最终生成的字幕文件即可。

**对于 Bilibili 弹幕获取与分析功能：**

您可以通过API客户端（如 Postman、curl 或您自己的脚本）向 `http://localhost:5000/api/danmu` 发送POST请求来使用此功能。

请求体应为JSON格式，包含Bilibili视频的URL，例如：
```json
{
    "url": "https://www.bilibili.com/video/BV1fx411j7a4"
}
```

服务器将返回一个包含弹幕分析结果的JSON响应，包括高能时刻、热词统计等。

## 注意事项

-   请确保您的腾讯云账户有足够的余额或免费额度来使用对象存储和语音识别服务。
-   `config.ini` 文件中的路径 `WatchPath` 最好使用绝对路径，以避免因运行位置不同而导致的问题。
-   脚本默认不会监控子文件夹。
-   生成的SRT字幕文件中，默认会去除识别结果中的逗号和句号。
