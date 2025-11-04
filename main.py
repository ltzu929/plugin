from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from danmu import main_analysis
import logging
from multiprocessing import Process
from audio_text import main as audio_main

# 配置日志系统，设置日志级别为INFO，并定义日志格式
# 格式包含：时间戳、日志级别和日志消息
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 初始化 Flask 应用实例，并指定静态文件目录
app = Flask(__name__, static_folder='danmu-analysis-frontend')
# 启用CORS（跨域资源共享），允许前端（Vue.js）从不同域名/端口访问后端API
# 这对于前后端分离的开发模式是必要的
CORS(app)

@app.route('/')
def serve_index():
    """
    提供前端主页 (index.html)。
    """
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    """
    提供前端静态文件（如 CSS, JS, images）。
    """
    return send_from_directory(app.static_folder, path)

@app.route('/api/danmu', methods=['POST'])
def analyze_danmu():
    """
    弹幕分析API接口。
    接收POST请求，请求体中应包含一个JSON，格式为: {"url": "视频链接"}
    返回：包含视频信息、热词和高能时刻的JSON数据
    """
    # 从请求中获取JSON数据
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'message': '请求参为什么我启动MAIN.PY后访问.5000端口还是显示404数错误，需要包含 "url"'}), 400

    video_url = data['url']
    logging.info(f"收到弹幕分析请求: {video_url}")

    # 调用 danmu.py 中的主分析函数处理B站视频弹幕
    result = main_analysis(video_url)

    # 如果分析出错，返回错误信息
    if 'message' in result and '无效' in result['message']:
        return jsonify(result), 400  # 400表示客户端错误（如无效URL）
    if 'message' in result:
        return jsonify(result), 500  # 500表示服务器内部错误

    # 返回分析结果
    logging.info(f"视频 {video_url} 分析完成")
    return jsonify(result)

def main():
    """
    主函数，用于启动Flask Web服务器和音频文件监控服务。
    """
    # 创建一个新进程来运行音频文件监控服务
    # 这样可以确保它与Flask服务器并行运行，互不干扰
    audio_process = Process(target=audio_main)
    audio_process.start()
    
    print("启动Web服务器，请通过 http://127.0.0.1:5000 访问")
    # 在 0.0.0.0 上运行，允许局域网访问
    # 注意：在生产环境中，应禁用debug模式
    app.run(host='0.0.0.0', port=5001, debug=True)

if __name__ == '__main__':
    main()