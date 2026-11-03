# Display Viewer

Meta Ray-Ban Display용 600×600 PNG 패턴 뷰어. 앱에 npm 의존성이나 백엔드가 없으며, GitHub Pages의 기본 Jekyll 빌드가 이미지 폴더 목록을 생성합니다.

## 배포 위치

- 목표 URL: https://ykykyk112.github.io/display-viewer/
- GitHub 저장소 루트에 이 `display-viewer` 폴더 전체를 올립니다.
- 기존 루트 README와 홈페이지는 그대로 둡니다. 루트에 `.nojekyll`을 새로 추가하면 기존 Jekyll 홈페이지 동작이 바뀔 수 있으므로 이 프로젝트는 추가하지 않습니다.
- 저장소의 기존 Pages 게시 설정을 유지합니다. Pages가 기본 브랜치 루트에서 게시되는 경우 그 브랜치에 폴더를 올리면 됩니다. 설정이 다르면 실제 게시 소스에 넣어야 합니다.
- 배포 완료 후 위 URL을 Meta AI 앱에 `Display Viewer`라는 이름으로 등록합니다.
- 이미지/스타일/스크립트는 모두 상대 경로이며 외부 CDN을 사용하지 않습니다.
- 아직 로컬 구현 단계에서는 이 URL에 앱이 올라간 것이 아닙니다. 공개 배포는 별도 단계입니다.

### GitHub 웹사이트에서 업로드

1. 업로드용 ZIP을 PC에서 압축 해제합니다. ZIP 파일 자체를 저장소에 올리지 않습니다.
2. `ykykyk112/ykykyk112.github.io` 저장소의 루트 화면에서 **Add file → Upload files**를 엽니다.
3. 압축 해제된 **display-viewer 폴더 자체**를 끌어다 놓습니다. 업로드 목록의 경로가 `display-viewer/index.html`, `display-viewer/patterns/lut_W.png`처럼 시작하는지 확인합니다.
4. 이미 이전 버전을 올렸다면 같은 경로의 파일을 새 버전으로 업데이트합니다. `patterns.json`을 포함한 새 파일도 모두 올려야 합니다.
5. 현재 Pages 게시 브랜치에 commit합니다. **Settings → Pages**에서 `Deploy from a branch`, `main`, `/(root)`인지 확인합니다. 다른 게시 소스를 사용 중이라면 그 설정에 맞는 위치로 올려야 합니다.
6. **Actions**에서 `pages build and deployment` 성공을 확인합니다.
7. `https://ykykyk112.github.io/display-viewer/patterns.json`을 열어 YAML/Liquid 소스가 아닌 `{"files":[...]}` JSON이 나오는지 확인합니다.
8. 앱 URL을 Meta AI에 등록하거나, 기존 앱을 Restart하여 새 버전을 읽습니다.

정상 저장소 구조:

```text
ykykyk112.github.io/
├─ README.md                       # 기존 홈페이지
└─ display-viewer/
   ├─ index.html
   ├─ app.js
   ├─ styles.css
   ├─ icon.svg
   ├─ patterns.json                # Jekyll이 배포 시 실제 목록으로 변환
   ├─ patterns.local.json          # PC 미리보기용 목록
   ├─ update-local-index.py        # PC 미리보기 목록 갱신 도구
   ├─ README.md
   ├─ VALIDATION.md
   └─ patterns/
      ├─ lut_B.png
      ├─ lut_G.png
      ├─ lut_R.png
      └─ lut_W.png
```

`display-viewer/display-viewer/index.html`처럼 중첩하면 목표 URL과 달라집니다. 로컬 저장소의 `.git`, `tests`, `artifacts`, 임시 검증 라이브러리는 업로드할 필요가 없습니다. ZIP에는 위 `display-viewer` 폴더만 들어 있습니다.

## 사용법

1. 처음에는 `lut_W.png`를 Viewer에 표시합니다. 그 파일이 없으면 목록의 첫 PNG를 표시합니다.
2. Viewer에서 **우: 다음 파일 / 좌: 이전 파일**. 마지막↔처음에서 순환합니다.
3. **확인(검지 탭)**으로 파일 목록을 엽니다. 현재 표시한 파일에 포커스가 있습니다.
4. 목록의 **상/하**로 가리키는 파일을 바꿉니다. 처음에서 상은 마지막, 마지막에서 하는 처음입니다. 이 단계에서는 이미지를 바꾸지 않습니다.
5. **확인**으로 선택 파일을 표시하고 Viewer로 돌아갑니다.
6. 목록에서 **취소(중지 탭)**는 선택을 적용하지 않고 Viewer로 돌아갑니다.
7. 목록의 **우** 또는 ‘설정’ 버튼으로 기존 화면 유지/자동 키 설정을 엽니다. 설정의 상/하는 설정 버튼을 이동하고 확인은 변경합니다. 취소는 파일 목록으로 돌아옵니다.

파일 순서는 파일명 정렬입니다. 현재는 **B → G → R → W → B**입니다. Viewer의 상/하는 이미지에 영향을 주지 않습니다. 목록에서는 왼쪽에 별도 기능이 없습니다.

실제 중지 탭은 `Escape` 키가 아니라 시스템 Back입니다. 목록을 열 때 방문 기록을 한 단계 추가하고, `popstate`에서 Viewer를 복원합니다. 확인도 같은 기록을 돌아간 뒤 선택을 적용하므로 오래된 목록이 Back 경로에 쌓이지 않습니다. 설정은 목록 아래에 한 단계만 추가됩니다.

Viewer에서는 Back을 가로채지 않습니다. Meta의 기본 시스템 메뉴·종료 동작이 유지됩니다. PC의 Escape는 열린 목록/설정에서 `history.back()`을 호출하는 테스트용 단축키입니다. 실제 Neural Band 동작은 업로드 후 안경에서 확인해야 합니다.

### 이미지 추가·삭제

GitHub의 `display-viewer/patterns/` 바로 아래에 600×600 PNG를 올리고 commit하면, 다음 Jekyll 빌드가 `patterns.json`을 자동 생성합니다. 하위 폴더와 PNG 외 파일은 목록에서 제외합니다. 페이지를 Restart해야 새 목록을 읽습니다. 파일 이름을 JavaScript에 추가할 필요는 없습니다.

`patterns.json`의 YAML front matter와 Liquid 코드는 **원본 그대로 업로드**합니다. 파일을 수동 JSON 목록으로 덮어쓰거나 `.nojekyll`로 Jekyll을 끄면 자동 생성이 동작하지 않습니다. GitHub Actions로 정적 파일만 복사하는 별도 배포 방식 역시 Jekyll 빌드가 필요합니다. 현재 홈페이지에서 확인된 기본 Jekyll 게시 방식을 대상으로 합니다.

PC의 단순 HTTP 서버에서는 Jekyll을 실행하지 않으므로 `patterns.local.json`을 읽습니다. 로컬에서 PNG를 추가·삭제했다면 아래 명령을 한 번 실행합니다.

```powershell
python display-viewer/update-local-index.py
```

## URL 옵션

| 옵션 | 기본값 | 예시 |
|---|---|---|
| `file` | `lut_W.png` 또는 첫 파일 | `?file=lut_R.png` |
| `pattern` | 이전 버전 호환용 | `?pattern=R`도 인식 |
| `wake` | 요청 켜짐 | `?wake=0`으로 화면 유지 요청 중지 |
| `autoKey` | 실험 꺼짐 | `?autoKey=1`로 합성 키 실험 활성화 |

화면 유지/자동 키 옵션 변경은 영구 저장하지 않습니다. 새로고침 시 URL 기준으로 돌아갑니다. 선택한 파일은 URL에 갱신됩니다. `menu` 옵션은 더 이상 사용하지 않으며 기본 진입 화면은 Viewer입니다. 목록에서 새로고침하면 기존 목록 방문 기록을 복원합니다.

## 원본 이미지와 표시 범위

원본 위치: `C:/display-calibration-internal/assets/image/600x600/`.

| 파일 | 크기 / 모드 | SHA-256 |
|---|---|---|
| lut_W.png | 600×600 / RGB | 96488a11d572ed77787896e7e3afb6bd1aef3be5a78d76aaf55fec4efaa4b5e1 |
| lut_R.png | 600×600 / RGB | 01587c0c770eae2052d71c001de27056e595377e7f355f051817aecaeba6003d |
| lut_G.png | 600×600 / RGB | a3e5bc77183c74d9f6bc9501dcc81b7573e032555890b7d77efc1f09d5e03319 |
| lut_B.png | 600×600 / RGB | 3ead284f46103a9e721cf8ab9a6ca4d2b3caa8fdb9cc77077d5b977e4521d043 |

PNG를 변환하지 않고 복사합니다. 로드 시 600×600인지 검사하고 다른 크기는 오류로 처리합니다. 메뉴를 닫으면 이미지 외의 앱 UI는 없습니다. 밝기 필터, 투명도, 전환 애니메이션을 적용하지 않습니다.

표시 영역은 viewport 안의 최대 정사각형입니다. 600×600 CSS viewport에서는 600×600 CSS px로 표시합니다. 다른 화면에서는 종횡비를 유지하여 맞추고 남는 영역은 검정입니다. `image-rendering: pixelated`는 브라우저 스케일링 힌트이며, 하드웨어 보간이나 색상 변환을 제거하는 기능은 아닙니다. 메뉴에 표시 크기, viewport, DPR을 보여 줍니다.

웹 렌더링은 존재합니다. 원본 파일 보존·데스크톱 스크린샷 비교·안경 패널의 물리적 1:1 매핑은 서로 다른 검증입니다. 1:1 매핑과 색상 정확도, 광학적 안정화는 실기 촬영으로 검증해야 합니다.

새 패턴 로딩 중에는 이전 패턴을 제거해 잘못된 이미지를 촬영하는 일을 줄입니다. 로딩 중 확인 입력은 완료될 때까지 무시하지만 좌우 전환은 가능합니다. 실패하면 빈 검정 화면과 오류 안내를 표시하고 목록을 엽니다. 빠르게 여러 번 전환해도 마지막 요청만 표시합니다. 표시 완료 후 인접한 이전/다음 PNG만 미리 읽습니다. 현재 네 파일의 합계는 약 41 KB입니다. 메모리에 로드한 패턴은 해당 페이지 세션에서 재사용하지만, 오프라인 재실행은 보장하지 않습니다.

## 화면 유지: 지원 여부와 실험 구분

### Screen Wake Lock

- `navigator.wakeLock.request('screen')`가 있을 때 요청합니다.
- 미지원, 요청 실패, API 승인, 해제를 구분해 표시합니다.
- 백그라운드/페이지 이탈 시 해제하고 돌아오면 다시 요청합니다.
- OS가 임의로 해제한 경우 무한 재요청하지 않습니다. 설정에서 껐다 켜거나 파일 목록을 다시 열어 재요청할 수 있습니다.
- API 승인 메시지는 브라우저의 승인을 뜻하며 Meta 안경의 실제 sleep 방지 성공을 뜻하지 않습니다.

### 자동 키 실험

- 기본 꺼짐. 설정에서 켜거나 `?autoKey=1`로 시작합니다.
- 10초마다 `ArrowUp` keydown/keyup 이벤트를 페이지 내부에 발생시킵니다.
- 합성 이벤트는 `isTrusted=false`이며 OS/Neural Band의 실제 입력이 아닙니다.
- 앱이 만든 이벤트는 패턴과 메뉴 포커스를 변경하지 않도록 구분합니다. 실제 사용자 입력은 정상 처리합니다.
- 숨겨진 페이지에서는 타이머를 중지합니다. sleep 이후 타이머 실행도 보장되지 않습니다.
- 이 기능은 사용자 요청에 따른 비교 실험입니다. 화면 꺼짐 방지 기능으로 보증할 수 없습니다.

실기 비교: 동일 밝기·패턴에서 (1) `?wake=0&autoKey=0`, (2) `?wake=0&autoKey=1`, (3) `?wake=1&autoKey=0`를 각각 실행하고 실제 입력 없이 dim/sleep 시간을 촬영해 비교합니다. 조작 후부터 시간을 측정하세요.

## 하드웨어 밝기

2026-11-02 Meta 공개 Web Apps 문서/MCP 조회에서 패널 밝기를 설정하는 API를 확인하지 못했습니다. 문서에 나오는 simulator brightness는 PC 시뮬레이터 기능이며 안경 제어 API의 근거가 아닙니다.

따라서 앱에 가짜 하드웨어 밝기 슬라이더를 넣지 않습니다. 안경 시스템 설정에서 조절합니다. CSS 밝기/픽셀 값 변경은 측정 패턴 자체를 바꾸므로 대체 기능으로 사용하지 않습니다.

## 로컬 실행과 검증

저장소 루트에서:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

PC에서 `http://127.0.0.1:8000/display-viewer/`를 엽니다. 이것은 PC 미리보기 주소이며 안경에 등록할 배포 URL이 아닙니다.

자동 브라우저 검증 스크립트는 `tests/display-viewer.cjs`입니다. Playwright와 pngjs를 사용할 수 있는 Node 환경에서 실행합니다. 설치 위치를 지정하려면 `VIEWER_NODE_MODULES`, 브라우저 실행 파일을 지정하려면 `VIEWER_BROWSER` 환경변수를 사용합니다. 먼저 `python-liquid`가 있는 Python 환경에서 목록 템플릿 검사로 테스트용 렌더링 JSON을 생성합니다. 별도 설치 위치는 `VIEWER_LIQUID_MODULES`로 지정합니다. 이 도구들은 개발 검증용이며 실제 웹앱의 의존성이 아닙니다.

```powershell
python tests/pattern-index.py
node tests/display-viewer.cjs
```

검증 결과와 미확인 실기 항목은 `VALIDATION.md`에 기록합니다.

## 참고 근거

- [Meta Web Apps](https://developers.meta.com/wearables/web-apps/)
- [Meta Web Apps build](https://wearables.developer.meta.com/docs/develop/webapps/build/)
- [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Event.isTrusted](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted)
- [GitHub Pages 배포 소스](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Jekyll static_files](https://jekyllrb.com/docs/static-files/)
