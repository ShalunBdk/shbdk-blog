---
title: Systemd сервис для Python приложения
category: Linux
tags: [🐧 Linux, ⚙️ Systemd, 🐍 Python]
language: ini
---

Шаблон unit-файла для запуска Python приложения как systemd сервиса

```ini
[Unit]
Description=My Python Application
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/myapp
Environment="PATH=/opt/myapp/venv/bin"
ExecStart=/opt/myapp/venv/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Использование:

```bash
# Скопировать в /etc/systemd/system/myapp.service
sudo systemctl daemon-reload
sudo systemctl enable myapp
sudo systemctl start myapp
sudo systemctl status myapp
```
