# 导入必要的库
import re  # 正则表达式库，用于从URL中提取BV号
import requests  # 用于发送HTTP请求
import xmltodict  # 用于将XML数据转换为Python字典
import math  # 数学库，用于计算时间间隔和阈值
import sys  # 用于处理命令行参数和程序退出
import json  # 用于将结果格式化为JSON输出

# --- Bilibili API 相关逻辑 ---

def extract_bv_id(url):
    """
    从Bilibili视频链接或BV号字符串中提取BV ID。
    支持多种格式，如 "https://www.bilibili.com/video/BV..." 或直接就是 "BV..."。

    :param url: 包含BV ID的字符串（URL或纯ID）
    :return: 提取到的BV ID字符串，如果未找到则返回None
    """
    # 定义两种正则表达式模式来匹配BV ID
    patterns = [
        r'bilibili\.com/video/(BV[a-zA-Z0-9]+)',  # 匹配完整的URL
        r'^(BV[a-zA-Z0-9]+)$'  # 匹配独立的BV ID字符串
    ]
    # 遍历模式进行匹配
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            # 如果找到匹配，返回第一个捕获组（即BV ID）
            return match.group(1)
    # 如果没有找到匹配，返回None
    return None

def get_video_info(bv_id):
    """
    使用Bilibili API获取视频的基本信息。

    :param bv_id: 视频的BV ID
    :return: 包含视频信息（cid, duration, title, uploader）的字典
    :raises Exception: 如果API返回错误或无法获取信息
    """
    # 构建获取视频信息的API URL
    url = f'https://api.bilibili.com/x/web-interface/view?bvid={bv_id}'
    # 设置请求头，模拟浏览器访问
    headers = {'User-Agent': 'Mozilla/5.0'}
    # 发送GET请求
    response = requests.get(url, headers=headers)
    # 如果请求失败（状态码不是2xx），则抛出异常
    response.raise_for_status()
    # 解析返回的JSON数据
    data = response.json()
    # 检查API返回的业务码，如果不为0，则表示有错误
    if data['code'] != 0:
        raise Exception('无法获取视频信息，请检查BV号是否正确。')

    # 提取需要的数据
    video_data = data['data']
    return {
        'cid': video_data['cid'],  # 视频的CID，用于获取弹幕
        'duration': video_data['duration'],  # 视频总时长（秒）
        'title': video_data['title'],  # 视频标题
        'uploader': {  # UP主信息
            'name': video_data['owner']['name'],  # UP主昵称
            'avatar': video_data['owner']['face'],  # UP主头像URL
            'mid': video_data['owner']['mid']  # UP主的用户ID
        }
    }

def get_danmaku_data(cid):
    """
    使用Bilibili API获取视频的弹幕数据。

    :param cid: 视频的CID
    :return: 包含所有弹幕信息的列表，每个弹幕是一个字典（timestamp, content）
    """
    # 构建获取弹幕的API URL
    url = f'https://api.bilibili.com/x/v1/dm/list.so?oid={cid}'
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    # 将返回的XML数据解码为UTF-8字符串
    xml_data = response.content.decode('utf-8')
    # 使用xmltodict将XML转换为Python字典
    json_data = xmltodict.parse(xml_data)

    # 检查解析后的数据结构是否包含弹幕信息
    if 'i' not in json_data or 'd' not in json_data['i']:
        return []

    # 提取原始弹幕列表
    danmakus_raw = json_data['i']['d']
    # 如果只有一个弹幕，xmltodict会将其解析为单个对象而不是列表，这里做兼容处理
    if not isinstance(danmakus_raw, list):
        danmakus_raw = [danmakus_raw]

    danmakus = []
    # 遍历原始弹幕数据
    for d in danmakus_raw:
        # 弹幕的属性（如发送时间）在'@p'属性中，以逗号分隔
        p_attr = d.get('@p', '').split(',')
        # 确保属性存在且包含时间戳
        if p_attr and p_attr[0]:
            danmakus.append({
                'timestamp': float(p_attr[0]),  # 弹幕出现的时间（秒）
                'content': d.get('#text', '')  # 弹幕内容
            })
    return danmakus

def normalize_word(word):
    """
    对弹幕中的词语进行归一化处理，以便更好地进行统计和分析。
    将常见的表达方式（如各种形式的"哈哈"和"草"）统一为标准形式，
    便于后续热词统计和展示。

    :param word: 原始弹幕词语
    :return: 归一化后的词语
    """
    if not word:
        return ''
    word = word.strip()  # 去除首尾空格
    # 使用正则表达式将 "h...a..." 或 "哈..." 统一为 "哈哈"
    if re.match(r'^h+a+$', word, re.IGNORECASE) or re.match(r'^哈+$', word):
        return '哈哈'
    # 使用正则表达式将 "c...a...o..." 或 "草..." 统一为 "草"
    if re.match(r'^c+a+o+$', word, re.IGNORECASE) or re.match(r'^草+$', word):
        return '草'
    # 去除词语中的所有空格
    return word.replace(' ', '')

def analyze_danmaku_data(danmaku_data, duration_seconds, interval_seconds=60, threshold_multiplier=2.5):
    """
    分析弹幕数据，生成图表数据和高能时刻。
    该函数将视频时长分成多个时间段，统计每个时间段的弹幕数量和热词，
    并通过与周围时间段的对比识别出高能时刻（弹幕密度突然增高的时间点）。

    :param danmaku_data: 弹幕数据列表，每个元素包含timestamp和content
    :param duration_seconds: 视频总时长（秒）
    :param interval_seconds: 时间间隔（桶的大小），默认为60秒，即每分钟统计一次
    :param threshold_multiplier: 用于判断高能时刻的阈值乘数，默认为2.5倍于平均值
    :return: 包含图表数据和高能时刻的字典，用于前端展示
    """
    # 计算需要多少个时间桶
    num_intervals = math.ceil(duration_seconds / interval_seconds)
    # 初始化时间桶，每个桶包含一个弹幕列表
    buckets = [{'danmaku': []} for _ in range(num_intervals)]

    # 将弹幕分配到对应的时间桶中
    for d in danmaku_data:
        index = math.floor(d['timestamp'] / interval_seconds)
        if index < num_intervals:
            buckets[index]['danmaku'].append(d)

    chart_data = []
    # 遍历每个时间桶，进行统计分析
    for i, bucket in enumerate(buckets):
        time = i * interval_seconds  # 当前桶的起始时间
        # 将时间格式化为 HH:MM:SS
        h = str(math.floor(time / 3600)).zfill(2)
        m = str(math.floor((time % 3600) / 60)).zfill(2)
        s = str(math.floor(time % 60)).zfill(2)

        # 统计当前桶内的热词
        hot_word_counts = {}
        for d in bucket['danmaku']:
            normalized = normalize_word(d.get('content'))
            if normalized:
                hot_word_counts[normalized] = hot_word_counts.get(normalized, 0) + 1

        # 对热词按频率排序，并提取前5个
        sorted_hot_words = sorted(hot_word_counts.items(), key=lambda item: item[1], reverse=True)
        top_hot_words = [word for word, count in sorted_hot_words[:5]]

        # 构建当前时间点（桶）的图表数据
        chart_data.append({
            'time': time,  # 时间戳（秒）
            'displayTime': f'{h}:{m}:{s}',  # 格式化后的时间字符串
            'count': len(bucket['danmaku']),  # 弹幕数量
            'hotWords': top_hot_words,  # 热词列表
        })

    highlights = []
    moving_average_window = 5  # 移动平均窗口大小
    # 遍历图表数据，寻找高能时刻
    for i, current_point in enumerate(chart_data):
        if current_point['count'] == 0:
            continue

        # 定义计算移动平均的窗口范围
        start = max(0, i - moving_average_window)
        end = min(len(chart_data) - 1, i + moving_average_window)

        # 计算窗口内（不包括当前点）的弹幕总数和平均值
        sum_val = 0
        count = 0
        for j in range(start, end + 1):
            if i != j:
                sum_val += chart_data[j]['count']
                count += 1

        avg = sum_val / count if count > 0 else 0

        # 如果当前点的弹幕数远高于周围的平均值，则认为是高能时刻
        if current_point['count'] > max(10, avg * threshold_multiplier):
            last_highlight = highlights[-1] if highlights else None
            # 为了避免高能时刻过于密集，增加一个时间间隔限制
            if not last_highlight or abs(current_point['time'] - last_highlight['timestamp']) > interval_seconds * 2:
                highlights.append({'timestamp': current_point['time'], 'count': current_point['count']})

    # 返回分析结果
    return {'chartData': chart_data, 'highlights': highlights}

# --- 主分析逻辑 ---

def main_analysis(video_url):
    """
    执行完整的B站视频弹幕分析流程。
    该函数是整个弹幕分析模块的主入口，按顺序执行提取BV号、获取视频信息、
    获取弹幕数据、分析弹幕并生成最终结果的完整流程。

    :param video_url: B站视频链接或BV号
    :return: 包含分析结果的字典，包括图表数据、高能时刻、视频信息等
    """
    try:
        # 使用 sys.stderr 打印日志，以避免污染标准输出的JSON结果
        print(f'[Analysis] Received request for URL: {video_url}', file=sys.stderr)

        # 1. 提取BV ID
        bv_id = extract_bv_id(video_url)
        if not bv_id:
            raise Exception('无效的B站链接或BV号。')
        print(f'[Analysis] Extracted BV ID: {bv_id}', file=sys.stderr)

        # 2. 获取视频信息
        print('[Analysis] Fetching video info...', file=sys.stderr)
        video_info = get_video_info(bv_id)
        cid = video_info['cid']
        duration = video_info['duration']
        title = video_info['title']
        uploader = video_info['uploader']
        print(f'[Analysis] Got CID: {cid}, Duration: {duration}s, Uploader: {uploader["name"]}', file=sys.stderr)

        # 3. 获取弹幕数据
        print('[Analysis] Fetching danmaku data...', file=sys.stderr)
        danmaku_data = get_danmaku_data(cid)
        print(f'[Analysis] Fetched {len(danmaku_data)} danmakus.', file=sys.stderr)

        # 4. 分析弹幕数据
        print('[Analysis] Analyzing data...', file=sys.stderr)
        analysis_result = analyze_danmaku_data(danmaku_data, duration)
        print(f'[Analysis] Analysis complete. Found {len(analysis_result["highlights"])} highlights.', file=sys.stderr)

        # 5. 组装最终返回结果
        result = {
            'chartData': analysis_result['chartData'],
            'highlights': analysis_result['highlights'],
            'bvId': bv_id,
            'videoDuration': duration,
            'title': title,
            'uploader': uploader
        }

        return result

    except Exception as e:
        # 统一的异常处理
        print(f'[Analysis] An error occurred: {e}', file=sys.stderr)
        # 返回一个包含错误信息的字典
        return {'message': str(e) or '分析过程中发生未知错误。'}

# 当该脚本作为主程序运行时，从命令行接收参数并执行分析
# if __name__ == '__main__':
#     # 检查是否提供了命令行参数（视频URL）
#     if len(sys.argv) < 2:
#         # 如果没有提供URL，打印错误信息到stderr并退出
#         print("用法: python danmu.py <bilibili_video_url>", file=sys.stderr)
#         # 打印一个JSON错误信息到stdout
#         print(json.dumps({'message': 'URL is required'}, ensure_ascii=False))
#         sys.exit(1)

#     # 从命令行参数中获取视频URL
#     video_url_arg = sys.argv[1]
#     # 调用主分析函数
#     final_result = main_analysis(video_url_arg)
#     # 将最终结果以JSON格式打印到标准输出
#     # ensure_ascii=False 确保中文字符能正确显示
#     print(json.dumps(final_result, ensure_ascii=False, indent=4))
