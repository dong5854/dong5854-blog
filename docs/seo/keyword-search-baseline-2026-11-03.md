# 일반 검색어 SEO 테스트 — 2026-11-03

## 검사 방법과 한계

- 실제 Google 웹 검색을 Chrome에서 수행했다. `site:`와 따옴표, 블로그명, 도메인은 검색어에 넣지 않았다.
- 각 검색어의 첫 페이지 일반 웹 결과만 기록했다. AI 개요·광고·추천 검색어는 순위에서 제외했다.
- 번역 결과에서 같은 URL의 원문 링크가 중복될 때는 한 건으로 계산했다. 위치는 이 세션의 관찰값이며 Search Console 평균 순위가 아니다.
- 기존 Google 로그인 환경에서 검사했으므로 기기·지역·개인화·검색 시각에 따라 다른 결과가 나올 수 있다. 계정명과 위치 정보는 이 기록에 포함하지 않았다.
- 검색량이나 경쟁도, 전체 색인 수를 측정한 테스트는 아니다. 첫 페이지 미확인은 미색인이나 전체 검색결과 부재를 뜻하지 않는다.

## 수정 전 기준선

| 검색어                                 | 블로그 관찰 결과                                     | 검색된 글                                     |
| -------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| YARN 스케줄러 차이                     | 첫 페이지, 약 5번째 일반 결과                        | `/blog/spark/yarn-fair-vs-capacity-scheduler` |
| Capacity Scheduler Fair Scheduler 비교 | 첫 페이지, 약 2번째 일반 결과                        | `/blog/spark/yarn-fair-vs-capacity-scheduler` |
| EMR Livy 세션 생성 실패                | 첫 페이지, 약 8번째 일반 결과. Livy 글 자체는 미확인 | `/blog/spark/emr-yarn-application-master`     |
| YARN 큐 메모리 부족                    | 첫 페이지에서 블로그 미확인                          | —                                             |
| EMR 큐 설정                            | 첫 페이지에서 블로그 미확인                          | —                                             |
| Spark ACCEPTED 대기                    | 첫 일반 결과                                         | `/blog/spark/emr-yarn-application-master`     |

## 검색 결과에서 확인한 의도

- 스케줄러 비교: 종류별 차이와 선택 기준을 빠르게 확인하려는 검색이다. 비교 글의 제목은 유지하고 첫 문단에 FIFO·Capacity·Fair의 차이를 요약했다.
- EMR 큐 설정: 검색 결과에 AWS의 애플리케이션 구성 문서와 큐 설정 가이드가 나왔다. 설정 가이드에 EMR을 제목으로 명시하고 Classification과 설정 파일의 관계를 설명했다.
- Livy 생성 실패: 세션 생성 오류와 준비 대기를 해결하려는 결과가 많았다. Livy 글의 제목·요약에 생성·starting·타임아웃 진단 범위를 명시하고 상단에 조사 순서를 배치했다.
- 큐 메모리 부족: 메모리 설정 및 컨테이너 메모리 초과 종료 글이 나왔다. 자원 할당 대기와 실행 중 OOM을 같은 원인으로 취급하지 않도록 구분을 추가했다. 이 글을 완전한 OOM 해결 가이드로 표현하지 않는다.

## 이번 변경

1. 비교 글: 제목과 URL 유지, 도입부에 배분 기준과 3종 비교표 추가.
2. 큐 설정 글: 제목·요약을 EMR 큐 설정과 ACCEPTED 진단에 맞추고, 증상별 확인 표 및 메모리 부족 구분 추가.
3. Livy 글: 제목·요약과 시작 부분에 실패·starting 대기·종료 원인 조사 순서 추가.
4. 관련 내부 링크 문구를 새 글 제목에 맞춤. 글 파일명과 URL은 유지.

## 후속 검증

- 전체 프로덕션 빌드에서 MDX 컴파일과 메타데이터를 확인한다.
- 배포 후 제목·description·canonical·수정일과 본문 추가 내용을 확인한다.
- 재수집 이전의 즉시 재검색을 개선 효과로 보고하지 않는다. 같은 검색어와 조건을 유지해 후속 관찰한다.
- Search Console 실적이 누적되면 페이지와 검색어별 노출·클릭·평균 순위를 함께 비교한다. 수동 검색 위치와 Search Console 지표를 혼용하지 않는다.

## 확인한 공식 자료

- [Google의 사용자 중심 콘텐츠 안내](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Hadoop 3.3.5 Capacity Scheduler](https://hadoop.apache.org/docs/r3.3.5/hadoop-yarn/hadoop-yarn-site/CapacityScheduler.html)
- [Spark 3.5.6 on YARN](https://spark.apache.org/docs/3.5.6/running-on-yarn.html)
- [Livy REST API](https://livy.apache.org/docs/latest/rest-api.html)
- [Amazon EMR 애플리케이션 구성](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-configure-apps.html)
