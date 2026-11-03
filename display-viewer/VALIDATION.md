# 검증 기록

검증일: 2026-11-02. 실제 안경 원격 연결 없이 Windows의 headless Microsoft Edge/Playwright에서 확인했습니다.

## 통과한 자동 브라우저 검사

v2 입력 방식으로 수정한 `tests/display-viewer.cjs` 실행 결과: 15개 통과, 실패 0개.

| 검사 | 결과 |
|---|---|
| 600×600, DPR 1에서 W/R/G/B 각각의 브라우저 캡처와 원본 PNG를 디코딩한 RGBA 전체 비교 | 네 장 모두 정확히 일치 |
| Viewer 좌우 순환, 현재 파일에서 목록 열기, 목록 상하 순환, 확인 전 이미지 유지, 확인/취소 | 통과 |
| 확인/취소 12회 반복 시 방문 기록 제한 유지, Viewer에서 Back으로 앱 이전 페이지 복귀 | 통과 |
| 열린 목록 새로고침 후 Back, 브라우저 Forward 복원 시 현재 파일 선택 | 통과 |
| 설정에서 Back 시 목록의 선택 대상 복원 | 통과 |
| 390×844, DPR 2에서 종횡비 유지와 배율 안내 | 통과 |
| 이미지 HTTP 오류 시 이전 패턴 제거·오류 표시·다른 패턴으로 복구 | 통과 |
| 600×600이 아닌 이미지 거부 | 통과 |
| 느린 이전 이미지 로딩이 최신 선택을 덮어쓰지 않음 | 통과 |
| 합성 키 isTrusted=false·포커스/패턴 유지·pagehide 중지·복귀 및 옵션 해제 | 통과, 가상 시계 사용 |
| Wake Lock API 미지원·거부 상태 표시 | 통과, 모의 API 사용 |
| Wake Lock 승인·해제·복귀·요청 중 취소 경합 처리 | 통과, 모의 API 사용 |
| 목록에 추가된 새 PNG가 앱 코드 수정 없이 선택·표시됨 | 통과, 목록/이미지 HTTP 응답 fixture 사용 |
| 빈 목록 및 경로 탈출 파일명에 명확한 오류 표시 | 통과 |
| 공개 HTTPS 주소에서 렌더링된 patterns.json 및 상대 이미지 경로 사용 | 통과, HTTPS route mock 사용 |

JavaScript 문법 검사도 통과했습니다. 복사한 PNG 네 장의 SHA-256이 원본 파일과 일치함을 별도로 확인했습니다. 600×600 파일 목록·설정 화면을 직접 확인했습니다.

상세 결과: 저장소의 `artifacts/results.json`. 스크린샷: `artifacts/file-list.png`, `artifacts/settings.png`, `artifacts/pattern-W.png` 외. `artifacts`는 Git에서 제외합니다.

## 이미지 목록 템플릿 검사

`tests/pattern-index.py`에서 python-liquid 렌더러와 문서에 정의된 Jekyll `site.static_files` 데이터 구조를 사용했습니다. 실제 GitHub Jekyll 빌드를 실행한 것은 아닙니다.

- 현재 원본 PNG 4장과 `patterns.local.json`이 일치함.
- 폴더에 추가된 새 PNG 및 대문자 PNG 확장자를 포함함.
- 한글·따옴표가 있는 파일명을 올바른 JSON으로 인코딩함.
- PNG 외 파일, 하위 폴더 파일, 다른 폴더의 파일을 제외함.
- 빈 폴더의 JSON 배열도 유효함.

## 아직 확인하지 않은 항목

- GitHub Pages 실제 Jekyll 빌드 및 공개 배포: 수행하지 않음. 원격 push 없음. 업로드 후 `/display-viewer/patterns.json`이 JSON으로 렌더링되는지 확인해야 함.
- 사용자 안경에서 이 앱 자체의 로딩, Neural Band 입력, 한글 UI 가독성.
- Meta 안경 WebView의 Screen Wake Lock 제공 여부와 OS의 실제 dim/sleep 동작.
- 합성 키 입력의 실제 dim/sleep 영향. DOM 이벤트 생성 성공은 실제 입력이나 화면 유지 성공의 증거가 아님.
- 패널 하드웨어 밝기 제어: 공개 Web Apps API 미확인, 구현하지 않음.
- 실제 패널의 1:1 매핑, 색상 변환, 광학적 안정화, 카메라 동기화.

## 배포 후 실기 확인 순서

1. `/display-viewer/`에서 W 이미지가 바로 표시되는지 확인합니다.
2. 좌우 전환과 끝↔처음 순환, 검지 탭으로 목록 열기, 현재 파일 포커스를 확인합니다.
3. 상하 순환 후 중지 탭으로 취소하면 기존 이미지가 유지되는지, 검지 탭으로 확인하면 새 이미지로 바뀌는지 확인합니다. 반복 후 Viewer의 중지 탭이 기본 시스템 메뉴를 여는지도 확인합니다.
4. 목록에서 우로 설정을 열고 viewport, 이미지 표시 크기, DPR, Wake Lock 상태를 기록합니다. 중지 탭으로 목록, 다시 중지 탭으로 Viewer에 돌아오는지 확인합니다.
5. 동일 밝기·패턴에서 아래 3개 URL을 각각 등록하거나 URL을 수정하여 비교합니다. 조작을 마친 시점부터 손을 대지 않고 dim/sleep까지의 시간을 기록합니다.

| 조건 | URL query |
|---|---|
| 기준 | `?wake=0&autoKey=0` |
| 자동 키만 | `?wake=0&autoKey=1` |
| Wake Lock만 | `?wake=1&autoKey=0` |

가능하면 각 조건을 여러 번 반복하고 밝기·펌웨어·앱 버전을 함께 기록합니다. 기기에서 측정한 결과가 있어야 sleep 방지 여부를 판정할 수 있습니다.
