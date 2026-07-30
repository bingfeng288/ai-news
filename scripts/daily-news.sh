#!/bin/bash
cd /Users/binghanliu/ai-news
qoderclicn --print "搜索过去24小时最重要的10条AI新闻，更新 data/news.json（双语，符合现有schema），归档旧版到 data/archive/，更新 data/archive/index.json，然后 git commit 并 push 到 GitHub。"
