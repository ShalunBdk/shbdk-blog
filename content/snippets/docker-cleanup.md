---
title: Docker cleanup команды
category: Docker
tags: [🐳 Docker, 🧹 Cleanup]
language: bash
---

Удаление неиспользуемых контейнеров, образов и volumes

```bash
# Удалить все остановленные контейнеры
docker container prune -f

# Удалить неиспользуемые образы
docker image prune -a -f

# Удалить неиспользуемые volumes
docker volume prune -f

# Удалить неиспользуемые сети
docker network prune -f

# Полная очистка (все вместе)
docker system prune -a --volumes -f
```
