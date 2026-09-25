"""On-screen words: dialogue (shared by the voice synthesis and the subtitles),
captions and title cards. Times are (shot, start, end) in seconds within the shot."""

# who, shot, t0, t1, text
LINES = [
    ('妈妈', 's11c', 0.2, 1.5, '吃饭了没？'),
    ('小满', 's11c', 1.6, 2.0, '嗯。'),
    ('妈妈', 's11c', 2.2, 3.6, '工作找得怎么样啦？'),
    ('妈妈', 's11c', 3.9, 5.7, '隔壁李阿姨家闺女都签了……'),
    ('小满', 's11c', 6.0, 7.6, '……挺好的，在等消息。'),
    ('妈妈', 's11c', 7.8, 9.8, '不急啊，实在不行就回家考公。'),
    ('小满', 's11d', 0.1, 1.3, '嗯。你们别担心。'),
]

# captions (not dialogue): shot, t0, t1, text, style
CAPTIONS = [
    ('s09b', 1.2, 7.8, '您的简历已进入我司人才库。\n如有合适岗位，我们会第一时间联系您。', 'letter'),
]

TITLE = ('s01', 2.6, 7.6, '感谢您的投递')
END_CARDS = [
    (0.8, 5.6, '感谢你的投递。', 'big'),
    (6.2, 10.4, '献给每一个，在这个秋天等待回音的人。', 'small'),
    (10.4, 13.0, '本片的剧本、角色、布景、动画、配乐、音效与文字\n均由 Claude 以代码从零创作', 'credit'),
]
