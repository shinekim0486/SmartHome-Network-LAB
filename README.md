# SmartHome Network LAB

48차시 자기주도형 스마트홈 네트워크 수업 플랫폼입니다. 학생은 **미션 확인 → VS Code 작성 → Python 통신 → Wireshark 관찰 → 증거 기록 → TShark 재현 → Gemini 힌트 → 스스로 판단 → 수정·재검증**의 순환을 반복합니다.

## MVP 구성

- `student-web/`: 설치 없이 브라우저에서 여는 학생용 학습 대시보드
- `server/`: 진행 기록과 스마트홈 장치 상태를 제공하는 FastAPI 서버
- `labs/01`~`labs/48`: 48차시 수업 공간(1~6차시는 즉시 수업 가능한 상세 콘텐츠)
- `python-examples/`: TCP, UDP, 센서, 조명, 도어, 서버 예제
- `tshark/`: Windows용 캡처·분석 명령과 필터 예시
- `docs/`: 48차시 로드맵, 증거 기록 양식, 안전 수칙
- `teacher/`: 교사용 운영·평가 가이드

## 학생별 SQLite 학습기억

학생은 학번/고유ID와 별명으로 로그인합니다. 차시 진행, Gemini 대화, Wireshark/TShark 증거, 최초 판단과 최종 판단은 `server/data/smarthome_lab.db`에 학생별로 저장됩니다. 교사용 화면에서는 48차시 진행률, 현재 차시, 증거 수, Gemini 질문 수, 판단 변화, 반복 오류와 어려운 개념을 확인할 수 있습니다.

중요한 수업 규칙은 **Gemini 사용 전에 최초 판단을 먼저 저장하는 것**입니다. 서버도 이 순서를 강제합니다. 다음 차시에는 저장된 `student_memory`를 요약 프롬프트로 생성하여 Gemini에 제공합니다. 자세한 설계는 `docs/student-memory.md`를 참고하세요.

SQLite는 Python에 포함되어 있어 별도 설치가 필요 없습니다. 데이터베이스를 초기화하려면 서버를 중지하고 `server/data/smarthome_lab.db`를 백업한 뒤 삭제합니다. 다음 실행 시 빈 DB가 다시 생성됩니다.

## 학생 GitHub 작품 제출

학생 사이트의 **GitHub 작품 제출** 영역에서 이름, 학번, 차시, 본인 공개 저장소 주소와 회고를 입력합니다. 서버는 GitHub에서 저장소 존재 여부, 최신 커밋, `README.md`, 해당 차시의 `labs/XX` 폴더를 확인합니다. 교사는 <http://127.0.0.1:5500/teacher.html>에서 제출 목록을 열고 수정 요청 또는 승인을 남길 수 있습니다.

학생 저장소 권장 구조:

```text
student-smarthome-lab/
├─ README.md
├─ labs/01/evidence.md
├─ src/
├─ screenshots/
└─ reflection.md
```

새 저장소를 만들 때 `student-template/`의 내용을 복사하면 1차시 제출 구조를 바로 시작할 수 있습니다. 이후 차시마다 `labs/02`, `labs/03`처럼 폴더를 추가합니다.

MVP는 인증 없이 교실 PC에서 사용하는 형태이며 공개 저장소만 자동 검사합니다. 실제 학교 서버에 배포할 때는 학생·교사 로그인, HTTPS, 데이터베이스, GitHub OAuth 또는 GitHub App 권한을 추가해야 합니다. API 키, 토큰, 개인정보, 원본 pcap 파일은 학생 저장소에 올리지 않습니다.

## Windows + VS Code 빠른 시작

### 1. 준비

1. Python 3.11 이상, VS Code, Wireshark를 설치합니다.
2. Wireshark 설치 중 **Npcap**과 **TShark**를 함께 설치합니다.
3. VS Code에서 이 폴더를 열고 `Ctrl+Shift+P` → `Python: Select Interpreter`로 Python을 선택합니다.
4. VS Code 터미널(PowerShell)을 열어 다음을 실행합니다.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r server\requirements.txt
```

실행 정책 오류가 나면 현재 터미널에서만 다음을 먼저 실행합니다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

### 2. API 서버 실행

```powershell
uvicorn server.main:app --reload --host 127.0.0.1 --port 8000
```

- 상태 확인: <http://127.0.0.1:8000/health>
- API 문서: <http://127.0.0.1:8000/docs>

### 3. 학생 사이트 실행

새 VS Code 터미널에서 다음을 실행합니다.

```powershell
python -m http.server 5500 --directory student-web
```

브라우저에서 <http://127.0.0.1:5500>을 엽니다. 파일을 직접 더블클릭해도 화면은 열리지만, API 연동을 위해 위 방법을 권장합니다.

### 4. Python 통신 실험

서버 터미널:

```powershell
python python-examples\server\tcp_server.py
```

클라이언트 터미널:

```powershell
python python-examples\tcp\tcp_client.py
```

UDP 실험은 `udp_receiver.py`를 먼저 실행하고 `udp_sender.py`를 실행합니다. 센서·조명·도어 예제는 FastAPI 서버가 실행 중일 때 사용합니다.

### 5. Wireshark 관찰

1. Wireshark를 관리자 권한으로 실행하고 **Adapter for loopback traffic capture**(또는 Npcap Loopback Adapter)를 선택합니다.
2. TCP 실험은 표시 필터 `tcp.port == 9000`, UDP 실험은 `udp.port == 9001`, API 실험은 `tcp.port == 8000`을 사용합니다.
3. 패킷 번호, 시각, 출발지/목적지, 프로토콜, 길이, 관찰 내용을 `docs/evidence-template.md`에 기록합니다.

### 6. TShark 재검증

Wireshark 설치 경로가 PATH에 없다면 전체 경로를 사용합니다.

```powershell
& 'C:\Program Files\Wireshark\tshark.exe' -D
& 'C:\Program Files\Wireshark\tshark.exe' -i 1 -f 'tcp port 9000' -a duration:15 -w evidence.pcapng
& 'C:\Program Files\Wireshark\tshark.exe' -r evidence.pcapng -Y 'tcp.port == 9000' -T fields -e frame.number -e ip.src -e tcp.srcport -e ip.dst -e tcp.dstport -e tcp.len
```

인터페이스 번호 `1`은 PC마다 다르므로 첫 명령의 결과에 맞게 바꿉니다. 본인 PC·교실 실습망처럼 허가된 네트워크만 캡처하세요.

## Gemini 사용 원칙

Gemini에는 정답 대신 힌트를 요청합니다. 예: “내 관찰은 TCP 연결 뒤 데이터가 전달됐다는 것이다. 아래 TShark 결과에서 판단을 검증할 질문 3개만 줘.” 개인정보, 토큰, 공인 IP, 전체 패킷 원문은 올리지 않습니다. AI 답변은 반드시 패킷 증거와 Python 실행 결과로 재검증합니다.

## 1~6차시

| 차시 | 주제 | 산출물 |
|---|---|---|
| 01 | 네트워크 관찰과 안전 | 인터페이스·필터 기록 |
| 02 | TCP 연결 | 3-way handshake 증거 |
| 03 | UDP 센서 방송 | 전달 특성 비교표 |
| 04 | HTTP 센서 API | 요청/응답 증거 |
| 05 | 조명·도어 상태 제어 | 상태 변경 검증 |
| 06 | TShark 자동 분석 | 재현 가능한 명령과 판단 |

각 차시의 상세 미션은 `labs/01`~`labs/06`에서 확인합니다. 전체 과정은 `docs/curriculum-map.md`를 참고하세요.

## 테스트

```powershell
python -m unittest discover -s server\tests -v
```

## 라이선스

교육용 예제입니다. 실제 가정용 장치나 외부 시스템에 연결하기 전에 교사의 승인과 네트워크 소유자의 허가를 받으세요.

