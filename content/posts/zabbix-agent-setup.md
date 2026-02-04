---
title: Установка и настройка Zabbix Agent
date: 2025-06-03
tags: [Linux, Monitoring, Zabbix]
excerpt: Пошаговое руководство по установке и базовой настройке Zabbix Agent на Linux сервере
---

## ШАГ 1: Установка агента

```bash
sudo apt-get install zabbix-agent -y
```

---

## ШАГ 2: Настройка конфигурации

```bash
sudo nano /etc/zabbix/zabbix_agentd.conf
```

Найди и измени следующие параметры:

```conf
# IP-адрес или DNS Zabbix сервера (для пассивных проверок)
Server=192.168.1.100

# IP-адрес или DNS Zabbix сервера (для активных проверок)
ServerActive=192.168.1.100

# Уникальное имя хоста (должно совпадать с именем в веб-интерфейсе Zabbix)
Hostname=my-server
```

> ⚠️ `Hostname` должен точно совпадать с именем хоста, указанным при добавлении в Zabbix Server!

---

## ШАГ 3: Применение настроек

```bash
sudo systemctl restart zabbix-agent
```

---

## ШАГ 4: Проверка работы

```bash
sudo systemctl status zabbix-agent
```

Успешный вывод:

```
● zabbix-agent.service - Zabbix Agent
     Loaded: loaded
     Active: active (running)
```

---

## Дополнительно

**Автозапуск при загрузке:**

```bash
sudo systemctl enable zabbix-agent
```

**Открытие порта в фаерволе (если используется UFW):**

```bash
sudo ufw allow 10050/tcp
```

**Проверка логов при проблемах:**

```bash
sudo tail -f /var/log/zabbix/zabbix_agentd.log
```
