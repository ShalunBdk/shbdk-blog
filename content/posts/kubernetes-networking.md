---
title: Kubernetes networking основы
date: 2025-01-12
tags: [☸️ Kubernetes, 🌐 Networking, 📚 Guide]
excerpt: Разбираем как работает сеть в Kubernetes - Services, Ingress, Network Policies и практические примеры
---

## Введение

Сеть в Kubernetes — одна из самых сложных тем для новичков. В этой статье разберём основные концепции и компоненты сети K8s.

## Services

Services в Kubernetes обеспечивают стабильный сетевой доступ к группе подов.

### ClusterIP

Дефолтный тип сервиса, доступен только внутри кластера:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
```

### NodePort

Открывает порт на каждой ноде кластера:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30007
```

## Ingress

Ingress управляет внешним доступом к сервисам в кластере, обычно HTTP/HTTPS.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
```

## Network Policies

Network Policies контролируют трафик между подами:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
spec:
  podSelector:
    matchLabels:
      role: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
```

## Заключение

Понимание сети в Kubernetes критично для построения надёжных приложений. Начните с Services, затем изучите Ingress и Network Policies.
