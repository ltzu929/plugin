<template>
  <div class="audio-to-text">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h2>音频转文字</h2>
        </div>
      </template>
      
      <el-alert
        title="使用说明"
        type="info"
        description="将音频文件放入监控文件夹，系统会自动处理并生成字幕文件。"
        show-icon
        :closable="false"
      />
      
      <div class="status-container">
        <h3>系统状态</h3>
        <el-descriptions border>
          <el-descriptions-item label="监控状态">
            <el-tag type="success">运行中</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="监控文件夹">
            {{ watchPath }}
          </el-descriptions-item>
          <el-descriptions-item label="支持格式">
            {{ supportedFormats.join(', ') }}
          </el-descriptions-item>
          <el-descriptions-item label="SecretId">
            {{ secretId }}
          </el-descriptions-item>
          <el-descriptions-item label="SecretKey">
            {{ secretKey }}
          </el-descriptions-item>
          <el-descriptions-item label="地区">
            {{ region }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'AudioToText',
  data() {
    return {
      watchPath: 'C:\\监控文件夹路径', // 这里应该从后端获取
      supportedFormats: ['.mp3', '.wav', '.m4a', '.flac'],
      secretId: 'AKIDlQuCHAuRlwwjW7Vmup14yfBWlspbCalk', // 这里应该从后端获取
      secretKey: 'sY2JNFuxrgYMyW8cv3yhEYgdXO9qaEk8', // 这里应该从后端获取
      region: 'ap-guangzhou', // 这里应该从后端获取
    }
  },
}
</script>

<style scoped>
.audio-to-text {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.status-container {
  margin-top: 20px;
}

.recent-files {
  margin-top: 30px;
}
</style>