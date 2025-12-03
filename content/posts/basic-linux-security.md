---
title: Базовая настройка безопасности Linux Server
date: 2025-06-03
tags: [Linux, Security, UFW, SSH, Fail2Ban]
excerpt: Пошаговое руководство по базовой настройке безопасности Linux сервера — UFW, SSH-ключи, защита от брутфорса
---

## Предварительная проверка

Перед началом проверь версию OpenSSH:

```bash
ssh -V
```

**OpenSSH 9.8+** — встроенная защита от брутфорса `PerSourcePenalties` (Fail2Ban для SSH не нужен)  
**OpenSSH < 9.8** — потребуется Fail2Ban

---

## ШАГ 1: Обновление системы и базовые утилиты

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install ufw curl wget git -y
```

---

## ШАГ 2: Настройка UFW (фаервол)

```bash
# Политика по умолчанию
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Базовые порты
sudo ufw allow OpenSSH
sudo ufw allow http
sudo ufw allow https

# Дополнительные порты (по необходимости)
# sudo ufw allow 8000/tcp

# Включение
sudo ufw enable
sudo ufw status
```

---

## ШАГ 3: Создание пользователя

> ⚠️ Не работай под root! Создай пользователя с правами sudo.

```bash
adduser your_username
usermod -aG sudo your_username
su - your_username
```

---

## ШАГ 4: Настройка SSH-ключей

### На локальной машине

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### На сервере

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Вставь публичный ключ (~/.ssh/id_ed25519.pub)
chmod 600 ~/.ssh/authorized_keys
```

---

## ШАГ 5: Настройка SSH-сервера

```bash
sudo nano /etc/ssh/sshd_config
```

### Для OpenSSH 9.8+ (современный вариант)

```conf
# Аутентификация
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 60

# Отключение устаревших методов
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no

# Встроенная защита от брутфорса (включена по умолчанию)
# Можно явно задать параметры:
# PerSourcePenalties authfail:5s crash:90s grace-exceeded:20s max:10m min:15s

# Исключения для доверенных сетей (NAT, офис, VPN)
PerSourcePenaltyExemptList 192.168.0.0/16 10.0.0.0/8
```

### Для OpenSSH < 9.8 (legacy)

```conf
# Аутентификация
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 60

# Отключение устаревших методов
ChallengeResponseAuthentication no
UsePAM no
```

### Применение настроек

```bash
# Проверка синтаксиса
sudo sshd -t

# Перезапуск (только после проверки!)
sudo systemctl restart sshd
```

> ⚠️ **Критично:** Проверь вход по SSH-ключу в **новом терминале** до закрытия текущей сессии!

---

## ШАГ 6: Защита от брутфорса

### Вариант A: OpenSSH 9.8+ (ничего делать не нужно)

Защита `PerSourcePenalties` работает по умолчанию:
- 5 сек штраф за неудачную аутентификацию
- Штрафы накапливаются до 10 минут максимум
- Блокировка начинается после 15 сек накопленных штрафов

Проверить текущие настройки:

```bash
sudo sshd -T | grep -i persource
```

### Вариант B: OpenSSH < 9.8 (Fail2Ban)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

Создай `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
bantime = 86400
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8 192.168.0.0/16 10.0.0.0/8

[sshd]
enabled = true
port = ssh
backend = systemd
```

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

---

## Проверка безопасности

```bash
# UFW
sudo ufw status numbered

# SSH конфигурация
sudo sshd -T | grep -E "(passwordauth|permitroot|maxauth|persource)"

# Fail2Ban (если используется)
sudo fail2ban-client status sshd

# Логи SSH
sudo journalctl -u ssh --since "1 hour ago"
```

---

## Дополнительно

**Автоматические обновления безопасности:**

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

**Мониторинг попыток входа:**

```bash
# Неудачные попытки
sudo journalctl -u ssh | grep -i "failed\|invalid"

# Заблокированные IP (PerSourcePenalties)
sudo journalctl -u ssh | grep -i "penalty\|refused"

# Заблокированные IP (Fail2Ban)
sudo fail2ban-client status sshd
```

**Смена порта SSH (опционально):**

```conf
# /etc/ssh/sshd_config
Port 2222
```

```bash
sudo ufw allow 2222/tcp
sudo ufw delete allow OpenSSH
sudo systemctl restart sshd
```