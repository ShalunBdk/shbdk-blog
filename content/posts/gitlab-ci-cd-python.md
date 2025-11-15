---
title: GitLab CI/CD pipeline для Python
date: 2025-01-08
tags: [🦊 GitLab, 🔄 CI/CD, 🐍 Python]
excerpt: Пример рабочего CI/CD пайплайна с тестами, линтерами и автоматическим деплоем
---

## Введение

GitLab CI/CD — мощный инструмент для автоматизации сборки, тестирования и деплоя. Рассмотрим типичный пайплайн для Python приложения.

## Базовая структура .gitlab-ci.yml

```yaml
stages:
  - test
  - build
  - deploy

variables:
  PYTHON_VERSION: "3.11"
```

## Stage: Test

Запускаем линтеры и тесты:

```yaml
lint:
  stage: test
  image: python:${PYTHON_VERSION}
  script:
    - pip install flake8 black
    - flake8 .
    - black --check .

test:
  stage: test
  image: python:${PYTHON_VERSION}
  script:
    - pip install -r requirements.txt
    - pip install pytest pytest-cov
    - pytest --cov=app tests/
  coverage: '/TOTAL.*\s+(\d+%)$/'
```

## Stage: Build

Собираем Docker образ:

```yaml
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
```

## Stage: Deploy

Деплой в production:

```yaml
deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh
    - ssh deploy@server "docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - ssh deploy@server "docker-compose up -d"
  only:
    - main
  when: manual
```

## Кеширование зависимостей

Ускоряем сборку с помощью кеша:

```yaml
.python_cache:
  cache:
    paths:
      - .pip-cache/
    key: ${CI_COMMIT_REF_SLUG}
  before_script:
    - pip install --cache-dir .pip-cache -r requirements.txt
```

## Заключение

Автоматизация CI/CD процесса экономит время и снижает количество ошибок. Начните с простого пайплайна и постепенно добавляйте функциональность.
