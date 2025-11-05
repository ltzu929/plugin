# -*- coding: utf-8 -*-
# 音频转文字模块 - 使用腾讯云ASR服务将音频文件转换为文本
# 本模块实现了音频文件的自动监控、上传、语音识别和字幕生成功能
import configparser  # 用于读取配置文件
import json  # 用于处理JSON数据
import logging  # 用于日志记录
import os  # 用于文件和路径操作
import time  # 用于时间相关操作和延迟
from tencentcloud.common import credential  # 腾讯云API认证
from tencentcloud.common.profile.client_profile import ClientProfile  # 腾讯云客户端配置
from tencentcloud.common.profile.http_profile import HttpProfile  # 腾讯云HTTP配置
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException  # 腾讯云SDK异常
from tencentcloud.asr.v20190614 import asr_client, models as asr_models  # 腾讯云语音识别服务
from qcloud_cos import CosConfig, CosS3Client  # 腾讯云对象存储服务

# --- 日志配置 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- 加载配置 ---
# 读取 config.ini 配置文件
config = configparser.ConfigParser()
config.read('config.ini', encoding='utf-8') # 指定utf-8编码以支持中文

# --- 腾讯云凭证 ---
# 从 config.ini 文件中读取您的腾讯云API密钥和配置
SECRET_ID = config.get('TencentCloud', 'SecretId')
SECRET_KEY = config.get('TencentCloud', 'SecretKey')
REGION = config.get('TencentCloud', 'Region')
BUCKET = config.get('TencentCloud', 'Bucket')

# --- 监控配置 ---
# 从 config.ini 文件中读取要监控的文件夹路径和支持的音频格式
WATCH_PATH = config.get('Watch', 'WatchPath')
AUDIO_FORMATS = tuple(config.get('Watch', 'AudioFormats').split(','))

def upload_to_cos(file_path):
    """
    将音频文件上传到腾讯云对象存储(COS)并返回可访问的URL。
    
    :param file_path: 本地音频文件的完整路径
    :return: 上传成功后的文件URL，上传失败则返回None
    """
    try:
        logging.info(f"开始上传文件 {file_path} 到COS...")
        cos_config = CosConfig(Region=REGION, SecretId=SECRET_ID, SecretKey=SECRET_KEY)
        cos_client = CosS3Client(cos_config)

        file_name = os.path.basename(file_path)

        with open(file_path, 'rb') as f:
            cos_client.put_object(
                Bucket=BUCKET,
                Body=f,
                Key=file_name,
                EnableMD5=False
            )

        url = cos_client.get_presigned_url(
            Method='GET',
            Bucket=BUCKET,
            Key=file_name,
            Expired=3600
        )
        logging.info(f"文件 {file_name} 成功上传到COS。URL: {url}")
        return url
    except Exception as e:
        logging.error(f"上传 {file_path} 到COS失败: {e}")
        return None

def create_asr_task(file_url):
    """
    创建一个腾讯云语音识别（ASR）任务。
    
    :param file_url: 音频文件的COS URL
    :return: 创建成功返回任务ID，失败返回None
    """
    try:
        logging.info("正在创建ASR任务...")
        cred = credential.Credential(SECRET_ID, SECRET_KEY)
        http_profile = HttpProfile(endpoint="asr.tencentcloudapi.com")
        client_profile = ClientProfile(httpProfile=http_profile)
        client = asr_client.AsrClient(cred, REGION, client_profile)

        req = asr_models.CreateRecTaskRequest()
        params = {
            "EngineModelType": "16k_zh",
            "ChannelNum": 1,
            "ResTextFormat": 3,
            "SourceType": 0,
            "Url": file_url
        }
        req.from_json_string(json.dumps(params))

        resp = client.CreateRecTask(req)
        task_id = resp.Data.TaskId
        logging.info(f"ASR任务创建成功。任务ID: {task_id}")
        return task_id
    except TencentCloudSDKException as e:
        logging.error(f"创建ASR任务失败: {e}")
        return None

def poll_asr_task(task_id):
    """
    轮询ASR任务状态，直到任务完成或失败。
    
    :param task_id: 腾讯云ASR任务ID
    :return: 任务成功时返回识别结果，失败返回None
    """
    try:
        cred = credential.Credential(SECRET_ID, SECRET_KEY)
        http_profile = HttpProfile(endpoint="asr.tencentcloudapi.com")
        client_profile = ClientProfile(httpProfile=http_profile)
        client = asr_client.AsrClient(cred, REGION, client_profile)

        req = asr_models.DescribeTaskStatusRequest()
        params = {"TaskId": task_id}
        req.from_json_string(json.dumps(params))

        while True:
            resp = client.DescribeTaskStatus(req)
            status = resp.Data.StatusStr
            logging.info(f"正在查询ASR任务 {task_id}。当前状态: {status}")
            if status == 'success':
                logging.info(f"ASR任务 {task_id} 已完成。")
                return resp.Data.ResultDetail
            elif status == 'failed':
                logging.error(f"ASR任务 {task_id} 失败。")
                return None
            time.sleep(3)
    except TencentCloudSDKException as e:
        logging.error(f"查询ASR任务状态失败: {e}")
        return None

def format_time(ms):
    """
    将毫秒转换为SRT字幕时间格式 (HH:MM:SS,ms)。
    
    :param ms: 毫秒时间戳
    :return: 格式化的SRT时间字符串，格式为 HH:MM:SS,ms
    """
    seconds, milliseconds = divmod(ms, 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

def generate_srt(result_detail, srt_path):
    """根据ASR结果生成SRT字幕文件。"""
    try:
        logging.info(f"正在生成SRT文件: {srt_path}")
        with open(srt_path, 'w', encoding='utf-8') as f:
            for i, sentence in enumerate(result_detail):
                start_time = format_time(sentence.StartMs)
                end_time = format_time(sentence.EndMs)
                text = sentence.FinalSentence
                text = text.replace('，', '').replace('。', '').replace(',', '').replace('.', '')

                f.write(f"{i + 1}\n")
                f.write(f"{start_time} --> {end_time}\n")
                f.write(f"{text}\n\n")
        logging.info(f"SRT文件 {srt_path} 生成成功。")
    except Exception as e:
        logging.error(f"生成SRT文件失败: {e}")

def delete_from_cos(file_name):
    """从腾讯云COS中删除一个文件。"""
    try:
        logging.info(f"准备从COS删除文件: {file_name}...")
        cos_config = CosConfig(Region=REGION, SecretId=SECRET_ID, SecretKey=SECRET_KEY)
        cos_client = CosS3Client(cos_config)

        cos_client.delete_object(
            Bucket=BUCKET,
            Key=file_name
        )
        logging.info(f"文件 {file_name} 已从COS成功删除。")
    except Exception as e:
        logging.error(f"从COS删除文件 {file_name} 失败: {e}")

def process_audio_file(file_path):
    """处理单个音频文件的完整流程。"""
    logging.info(f"检测到新的音频文件: {file_path}")
    time.sleep(2)  # 等待文件写入完成

    file_name = os.path.basename(file_path)
    file_url = None

    try:
        file_url = upload_to_cos(file_path)
        if not file_url:
            return

        task_id = create_asr_task(file_url)
        if not task_id:
            return

        result_detail = poll_asr_task(task_id)
        if not result_detail:
            return

        srt_path = os.path.splitext(file_path)[0] + '.srt'
        generate_srt(result_detail, srt_path)

    finally:
        if file_url:
            delete_from_cos(file_name)

def main():
    """主函数，用于启动文件监控。"""
    if not os.path.exists(WATCH_PATH):
        os.makedirs(WATCH_PATH)
        logging.info(f"已创建监控目录: {WATCH_PATH}")

    logging.info(f"开始监控文件夹: {WATCH_PATH}")
    
    processed_files = set(os.listdir(WATCH_PATH))

    try:
        while True:
            current_files = set(os.listdir(WATCH_PATH))
            new_files = current_files - processed_files

            for file_name in new_files:
                if file_name.endswith(AUDIO_FORMATS):
                    file_path = os.path.join(WATCH_PATH, file_name)
                    process_audio_file(file_path)
            
            processed_files = current_files
            time.sleep(5)  # 每5秒扫描一次
    except KeyboardInterrupt:
        logging.info("监控已停止。")

if __name__ == "__main__":
    main()
