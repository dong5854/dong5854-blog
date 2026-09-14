---
name: spark-emr-post
description: >-
  Use this skill when the user wants to write a blog post about Spark or AWS EMR.
  This skill drafts a Korean technical blog post based on the given topic,
  following the blog's conventions (format, tags, file path, placeholder style).
  Activate when the user says things like "Spark 글 써줘", "EMR 포스트 작성해줘",
  "X에 대해 블로그 써줘 (Spark/EMR 관련)", or similar requests.
---

# Spark/EMR 블로그 포스트 작성 스킬

이 스킬은 사용자가 Spark 또는 AWS EMR 관련 기술 경험을 블로그 포스트로 정리할 때 AI 초안을 자동 생성하는 워크플로우입니다.

---

## 📋 워크플로우

### Step 1: 주제 확인

사용자가 주제를 명시하면 바로 Step 2로 진행한다.
주제가 불분명하면 아래를 질문한다:

- 어떤 주제인가? (예: OOM 트러블슈팅, 파티셔닝 전략, EMR 비용 최적화 등)
- 중점적으로 다루고 싶은 내용이 있는가? (없으면 AI가 판단)

### Step 2: 파일명(슬러그) 결정

- `data/blog/spark/` 디렉토리의 기존 파일 목록을 확인한다
- 주제를 영문 소문자 + 하이픈 슬러그로 변환한다
- 중복되지 않는 파일명을 결정한다
- **번호 없이** 주제 슬러그만 사용한다

```
data/blog/spark/{topic-slug}.mdx
예시: data/blog/spark/emr-oom-troubleshooting.mdx
     data/blog/spark/spark-partition-skew.mdx
     data/blog/spark/emr-cost-optimization.mdx
```

### Step 3: 초안 작성 및 파일 생성

아래 규칙에 따라 MDX 파일을 생성한다.

---

## 📝 MDX 파일 구조

```mdx
---
title: '{제목 (한국어, 기술적으로 명확하게)}'
date: '{YYYY-MM-DD}'
tags: {태그 배열 — 아래 태그 규칙 참고}
draft: false
summary: {한 문장 요약}
---

---
이하 AI 작성 초안

# 들어가며

{배경 설명 — 어떤 상황에서 이 문제/주제를 만나게 되는지}

> [!NOTE]
> (실제 겪었던 상황이나 배경을 여기에 추가해 주세요.)

---

# {섹션 1 제목}

{개념 설명, 동작 원리 등}

---

# {섹션 2 제목}

{심화 내용, 비교, 코드/설정 예시 등}

> [!NOTE]
> (실제 경험, 에러 메시지, 설정값 등을 여기에 추가해 주세요.)

---

# 결론

{핵심 요약 — 어떤 상황에서 어떤 선택을 해야 하는지}

---

## 관련 글

- {같은 spark/ 카테고리의 관련 포스트 링크}
```

---

## 🏷️ 태그 규칙

### 기본 태그 (항상 포함)

```
'spark', 'ai generated'
```

### 주제별 추가 태그

| 주제 성격 | 추가 태그 |
|---|---|
| AWS EMR 관련 | `'aws'`, `'emr'` |
| YARN 관련 | `'yarn'` |
| 성능 최적화 | `'performance'` |
| 비용 관련 | `'cost'` |
| 메모리/OOM | `'memory'` |
| 데이터 처리 | `'data-engineering'` |
| Python/PySpark | `'python'`, `'pyspark'` |
| Delta Lake | `'delta-lake'` |
| S3 관련 | `'aws'`, `'s3'` |

### 태그 컨벤션

- 영문 소문자, 하이픈 허용
- 한국어 태그는 사용하지 않음 (spark 카테고리 기준)
- 기존 태그와 일관성 유지 (`'spark'`, `'aws'`, `'emr'` 등)

---

## 🖊️ 작성 스타일 가이드

- **언어**: 한국어 (ko-KR)
- **말투**: 간결하고 기술적인 설명체 (`~다`, `~한다` 형식)
- **플레이스홀더**: 사용자가 실경험을 채워 넣을 자리는 반드시 `> [!NOTE]` 블록으로 표시
- **구분선**: 섹션 간 `---` 구분선 사용
- **AI 초안 표시**: 본문 시작 전 반드시 아래 구분선 삽입

```
---
이하 AI 작성 초안
```

- **코드/설정 예시**: 실제 사용 가능한 코드 블록 포함 (언어 명시)
- **비교가 필요한 경우**: 마크다운 테이블 사용
- **중요 경고/팁**: `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!NOTE]` 활용
- **관련 글 섹션**: 포스트 마지막에 `data/blog/spark/` 내 관련 포스트 링크

---

## ⚠️ 주의사항

- `data/blog/spark/` 경로 아래에 파일을 생성한다
- `.velite/` 디렉토리의 파일은 절대 직접 수정하지 않는다 (Velite 자동 생성)
- `public/search.json`은 직접 수정하지 않는다 (빌드 시 자동 생성)
- 파일명은 영문 소문자와 하이픈만 사용한다
- 파일명에 **번호를 붙이지 않는다** (독립 포스트 느낌 유지)
- frontmatter의 `date` 필드는 반드시 ISO 형식 (`YYYY-MM-DD`)으로 작성한다
- 블로그 패키지 매니저는 yarn을 사용한다
- 초안 생성 후 사용자에게 **플레이스홀더 위치**와 **수정 포인트**를 안내한다
