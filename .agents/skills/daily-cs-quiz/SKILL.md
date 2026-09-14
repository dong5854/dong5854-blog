---
name: daily-cs-quiz
description: >-
  Use this skill when the user wants to run a daily CS interview quiz session.
  This skill conducts an interactive mock interview, collects the user's answer,
  provides detailed feedback, and then generates a complete MDX blog post for
  the dong5854-blog. Activate when the user says things like "오늘 퀴즈", "daily quiz
  시작", "문제 내줘", "Day N 시작", or similar requests to begin a quiz session.
---

# Daily CS Quiz Skill

이 스킬은 하루 하나의 CS 면접 질문을 출제하고, 사용자의 답변에 대해 면접관처럼 피드백을 제공한 후, 블로그 포스팅용 MDX 파일을 자동으로 생성하는 인터랙티브 워크플로우입니다.

---

## 📋 주제 로테이션 (6개 카테고리 순환)

| 순서 | 카테고리 | 주요 토픽 예시 |
|---|---|---|
| 1 | 운영체제 | 프로세스/스레드, 스케줄링, 동기화, 가상 메모리, 데드락 |
| 2 | 네트워크 | TCP/UDP, HTTP/HTTPS, DNS, 3-Way Handshake, 로드밸런싱 |
| 3 | 데이터베이스 | 인덱스(B-Tree), 트랜잭션/격리수준, 정규화, RDBMS vs NoSQL |
| 4 | 자료구조 & 알고리즘 | Hash Table, Tree 순회, 정렬 알고리즘, 시간복잡도 분석 |
| 5 | 시스템 설계 & 웹 | 캐싱 전략, RESTful API, 마이크로서비스, 확장성 설계 |
| 6 | 디자인 패턴 | GoF 클래식 패턴, SOLID 원칙, 모던 패턴 (CQRS, Event Sourcing, Saga 등) |

---

## 🔄 진행 워크플로우 (4단계)

### Step 1: 문제 출제

1. `data/blog/cs/` 디렉토리의 `daily-quiz-*.mdx` 파일 목록을 확인하여 오늘의 Day 번호를 결정한다
   - 가장 큰 번호 + 1이 오늘의 Day 번호 (파일이 없으면 Day 1)
2. `(Day번호 - 1) % 6` 으로 로테이션 카테고리를 선정한다 (0=운영체제, 1=네트워크, 2=DB, 3=자료구조, 4=시스템설계, 5=디자인패턴)
3. 해당 카테고리에서 실전 면접에 자주 나오는 메인 질문 1개와 꼬리질문 2개를 출제한다
4. 아래 형식으로 출제한다:

```
## 🎙️ [Day N] 면접 질문 — {카테고리}

> **Q. {메인 질문}**

**꼬리 질문 (Follow-up):**
- {꼬리질문 1}
- {꼬리질문 2}

---
편하게 답변해 주세요! 키워드나 생각나는 것 위주로 적어주셔도 좋습니다.
```

### Step 2: 사용자 답변 수집

- 사용자가 답변을 채팅에 입력할 때까지 기다린다
- 답변이 오면 Step 3로 진행한다

### Step 3: 면접관 피드백 제공

답변을 분석하여 아래 형식으로 피드백한다:

```
## 📝 면접관 피드백

### ✅ 잘 설명하신 부분
- {강점 1}
- {강점 2}

### 💡 보완하면 좋을 부분
- {보완점 1}: {간단한 설명}
- {보완점 2}: {간단한 설명}

### 🌟 모범 답안 핵심 포인트
1. {핵심 포인트 1}
2. {핵심 포인트 2}
3. {핵심 포인트 3}

---
블로그 포스트를 생성할까요? (아니면 추가로 물어보고 싶은 것이 있으시면 말씀해 주세요!)
```

### Step 4: 블로그 MDX 파일 생성

사용자가 블로그 생성을 원하면 아래 규칙에 따라 MDX 파일을 생성한다.

#### 파일 저장 경로
```
data/blog/cs/daily-quiz-{N:03d}-{영문-슬러그}.mdx
```
예시: `data/blog/cs/daily-quiz-001-process-vs-thread.mdx`

#### MDX 파일 구조

```mdx
---
title: '[Daily Quiz #{N}] {질문 제목 (한국어, 간결하게)}'
date: '{YYYY-MM-DD}'
tags: ['daily quiz', 'ai generated', '{카테고리 태그}', '{세부 주제 태그}']
draft: false
summary: '{질문을 한 문장으로 요약한 설명}'
---

## 📌 오늘의 면접 질문

> **Q. {메인 질문 전문}**

**꼬리 질문 (Follow-up):**
- {꼬리질문 1}
- {꼬리질문 2}

---

## 🗣️ 나의 답변

{사용자 답변을 정리하여 자연스러운 문단으로 재구성. 핵심 키워드는 **볼드** 처리}

---

## 📚 심화 학습 (Deep Dive)

{면접관 피드백의 보완점과 핵심 포인트를 바탕으로 2~4개의 소제목으로 상세 설명 작성}

### {소제목 1}

{설명. 필요 시 코드 블록, 표, 다이어그램 포함}

### {소제목 2}

{설명}

---

## 💡 면접 포인트 체크리스트

- [ ] {핵심 개념 1} 설명 여부
- [ ] {핵심 개념 2} 언급 여부
- [ ] {핵심 개념 3} 연결하여 답변 여부

---

## 📖 참고 자료

- {관련 공식 문서나 유명 레퍼런스 링크 또는 명칭}
```

#### 카테고리별 태그 매핑

| 카테고리 | tags 추가 항목 |
|---|---|
| 운영체제 | `'운영체제'`, `'os'` |
| 네트워크 | `'네트워크'`, `'network'` |
| 데이터베이스 | `'데이터베이스'`, `'database'` |
| 자료구조 & 알고리즘 | `'자료구조'`, `'algorithm'` |
| 시스템 설계 & 웹 | `'시스템설계'`, `'web'` |
| 디자인 패턴 | `'디자인패턴'`, `'design-pattern'` |

---

## ⚠️ 주의사항

- `data/blog/cs/` 경로 아래에 파일을 생성한다
- `.velite/` 디렉토리의 파일은 절대 직접 수정하지 않는다 (Velite 자동 생성)
- `public/search.json`은 직접 수정하지 않는다 (빌드 시 자동 생성)
- 파일명은 영문 소문자와 하이픈만 사용한다
- frontmatter의 `date` 필드는 반드시 ISO 형식 (`YYYY-MM-DD`)으로 작성한다
- 블로그는 한국어(`ko-KR`) 기반이므로 포스트 본문은 한국어로 작성한다
- 블로그의 패키지 매니저는 yarn을 사용한다
