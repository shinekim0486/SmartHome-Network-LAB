// GitHub Pages는 정적 호스팅이므로 /health·/api를 JSON 서버로 호출할 수 없습니다.
// 로컬 개발 서버에서만 API를 사용하고, 공개 페이지에서는 브라우저 저장 기능으로 동작합니다.
const isStaticPages = window.location.hostname.endsWith("github.io");
const API = !isStaticPages && (["5500", "5501"].includes(window.location.port) || window.location.protocol === "file:")
  ? "http://127.0.0.1:8001"
  : (isStaticPages ? "" : window.location.origin);

const steps = [
  ["mission", "오늘의 미션", "목표와 성공 조건을 내 말로 다시 적는다."],
  ["code", "VS Code", "예제 코드를 읽고 실행 전 결과를 먼저 예측한다."],
  ["observe", "Python 통신 -> Wireshark", "실제 패킷이 어떻게 보이는지 직접 관찰한다."],
  ["evidence", "증거 기록", "프레임 번호, 필터, 눈에 띄는 필드를 남긴다."],
  ["tshark", "Wireshark 필터", "필터와 프레임 번호로 같은 관찰을 다시 검증한다."],
  ["hint", "알라딘 사용하기", "관찰한 증거를 바탕으로 질문하고 답변을 비교하며 배운다."],
  ["judge", "학생 판단", "내 최초 판단과 증거를 비교해 결론을 정리한다."],
  ["retest", "수정·재검증", "코드나 필터를 바꿔 결과가 달라지는지 다시 본다."]
];
const stepIcons = { mission: "🎯", code: "💻", observe: "📡", evidence: "🔎", tshark: "🧪", hint: "🤖", judge: "✅", retest: "🔁" };

const lessonCatalog = [
  { no: 1, zone: "주행 데이터 입구", title: "온라인 주행 데이터 읽기", arrival: "주행 로그에서 시간·속도·조향 관련 값을 찾아 근거로 설명한다.", item: "데이터 나침반", mission: "온라인 주행 표에서 지정된 행을 찾고 차량의 기록된 움직임을 한 문장으로 설명한다." },
  { no: 2, zone: "패킷 관찰소", title: "Wireshark 캡처 시작하기", arrival: "내 실습 장치의 캡처 대상과 시작·중지 시점을 정한다.", item: "캡처 렌즈", mission: "웹 요청을 실행하면서 Wireshark 캡처를 저장하고 최초 관찰을 기록한다." },
  { no: 3, zone: "패킷 관찰소", title: "Wireshark Display Filter", arrival: "필터로 필요한 패킷만 남기고 프레임 번호를 찾는다.", item: "필터 카드", mission: "tcp, ip.addr, tcp.port 필터를 적용해 출발지·목적지·프로토콜을 기록한다." },
  { no: 4, zone: "패킷 관찰소", title: "Wireshark TCP 흐름 판단", arrival: "TCP 패킷의 순서와 플래그를 근거로 판단한다.", item: "패킷 현미경", mission: "SYN·SYN/ACK·ACK 또는 데이터 패킷을 찾아 최초 판단을 수정·재검증한다." },
  { no: 5, zone: "Block2", title: "클라이언트 접속하기", arrival: "connect로 서버에 찾아간다.", item: "연결 열쇠", mission: "클라이언트를 만들고 서버와 연결 성공을 확인한다." },
  { no: 6, zone: "Block2", title: "send/recv와 encode/decode", arrival: "문자열과 바이트의 차이를 설명한다.", item: "메시지 다리", mission: "send/recv로 메시지를 주고받고 encode/decode를 익힌다." },
  { no: 7, zone: "Block3", title: "TCP 3-way handshake", arrival: "SYN, SYN-ACK, ACK를 구분한다.", item: "악수 열쇠", mission: "TCP 연결의 세 단계를 설명하고 흐름을 그린다." },
  { no: 8, zone: "Block3", title: "Wireshark SYN/ACK/FIN 캡처", arrival: "패킷 번호와 흐름을 읽는다.", item: "패킷 현미경", mission: "Wireshark로 TCP 패킷을 캡처하고 흐름을 분석한다." },
  { no: 9, zone: "Block4", title: "TCP vs UDP 비교", arrival: "두 프로토콜의 차이를 비교한다.", item: "프로토콜 비교표", mission: "TCP와 UDP의 특징을 관찰하고 차이를 설명한다." },
  { no: 10, zone: "Block4", title: "UDP 센서 송수신", arrival: "연결 없는 전송을 실습한다.", item: "센서 파형", mission: "UDP 센서 메시지를 보내고 수신 결과를 확인한다." },
  { no: 11, zone: "Block5", title: "threading 다중 접속 서버", arrival: "동시 접속 처리를 이해한다.", item: "스레드 부품", mission: "threading으로 여러 클라이언트를 동시에 처리한다." },
  { no: 12, zone: "Block5", title: "1:1 채팅", arrival: "양쪽 채팅 흐름을 연결한다.", item: "채팅 연결선", mission: "1:1 채팅 프로그램을 만들고 송수신을 확인한다." },
  { no: 13, zone: "Block6", title: "실시간 양방향 채팅", arrival: "동시에 보내고 받는 구조를 이해한다.", item: "실시간 송수신기", mission: "실시간 채팅에서 수신 스레드를 분리해 구현한다." },
  { no: 14, zone: "Block6", title: "단톡방 broadcast", arrival: "여러 사람에게 메시지를 뿌린다.", item: "방송 도구", mission: "broadcast 방식으로 단톡방 채팅을 완성한다." },
  { no: 15, zone: "Block7", title: "수행평가 1 구조 분석", arrival: "평가 요구사항을 분해한다.", item: "평가 설계도", mission: "채팅 프로그램 수행평가의 요구사항과 채점 기준을 읽는다." },
  { no: 16, zone: "Block7", title: "수행평가 1 구현 및 분석", arrival: "완성본을 점검한다.", item: "평가 인장", mission: "채팅 프로그램을 구현하고 자원 분석 보고서를 작성한다." },
  { no: 17, zone: "Block8", title: "JSON 데이터 포맷", arrival: "구조화된 메시지를 이해한다.", item: "JSON 렌즈", mission: "JSON 구조를 만들고 채팅 메시지에 적용한다." },
  { no: 18, zone: "Block8", title: "CSV 데이터 포맷", arrival: "표 형식 데이터를 다룬다.", item: "CSV 카드", mission: "CSV 데이터를 생성하고 비교 가능한 형식으로 저장한다." },
  { no: 19, zone: "Block9", title: "파일 전송의 원리", arrival: "파일을 조각으로 나눠 보낸다.", item: "전송 상자", mission: "파일 전송의 기본 원리를 설명하고 크기 정보를 먼저 보낸다." },
  { no: 20, zone: "Block9", title: "파일 업로드/다운로드", arrival: "파일을 주고받는 코드를 만든다.", item: "업로드 줄", mission: "파일 전송을 구현하고 전송 진행 상황을 확인한다." },
  { no: 21, zone: "Block10", title: "SQLite 기초", arrival: "데이터베이스 테이블을 이해한다.", item: "DB 열쇠", mission: "SQLite를 만들고 기본 CRUD 개념을 익힌다." },
  { no: 22, zone: "Block10", title: "채팅 기록 저장과 조회", arrival: "기록을 다시 꺼내 본다.", item: "기억 서랍", mission: "채팅 기록을 저장하고 조회하는 기능을 구현한다." },
  { no: 23, zone: "Block11", title: "해시와 XOR 암호화", arrival: "보안의 기본 원리를 설명한다.", item: "암호 방패", mission: "해시와 XOR 예제를 실습하고 암호화의 차이를 이해한다." },
  { no: 24, zone: "Block11", title: "TLS와 인증서", arrival: "암호화 연결의 증거를 찾는다.", item: "인증서 스탬프", mission: "TLS 연결과 인증서 정보를 확인한다." },
  { no: 25, zone: "Block12", title: "REST API 기초", arrival: "GET, POST, PUT, DELETE를 구분한다.", item: "API 규칙서", mission: "REST API 기초를 실습하고 요청 방식을 이해한다." },
  { no: 26, zone: "Block12", title: "웹에서 API 호출하기", arrival: "브라우저와 API를 연결한다.", item: "호출 버튼", mission: "웹에서 API를 호출하고 응답을 화면에 표시한다." },
  { no: 27, zone: "Block13", title: "IoT 센서 시뮬레이션", arrival: "가상 센서를 만들어 본다.", item: "센서 모듈", mission: "온습도와 상태 센서를 시뮬레이션한다." },
  { no: 28, zone: "Block13", title: "센서 데이터 수집과 분석", arrival: "센서 흐름을 읽고 분석한다.", item: "센서 로그", mission: "수집된 센서 데이터를 정리하고 패턴을 찾는다." },
  { no: 29, zone: "Block14", title: "로깅 구조와 모니터링", arrival: "기록을 구조화한다.", item: "로그 노트", mission: "구조화 로그와 모니터링의 의미를 익힌다." },
  { no: 30, zone: "Block14", title: "디버깅과 장애 기록", arrival: "문제 상황을 문장으로 남긴다.", item: "장애 메모", mission: "오류와 장애를 기록하고 재현 절차를 정리한다." },
  { no: 31, zone: "Block15", title: "클라우드 연동 개념", arrival: "배포의 의미를 이해한다.", item: "클라우드 지도", mission: "클라우드 연동의 기본 개념을 익힌다." },
  { no: 32, zone: "Block15", title: "배포 준비와 환경설정", arrival: "실행 환경을 준비한다.", item: "배포 준비물", mission: "클라우드 배포 전 환경변수와 설정을 점검한다." },
  { no: 33, zone: "Block16", title: "asyncio와 성능 최적화", arrival: "비동기 실행의 차이를 본다.", item: "성능 렌치", mission: "asyncio와 성능 최적화 개념을 실습한다." },
  { no: 34, zone: "Block16", title: "통신 성능 비교 실험", arrival: "성능 차이를 측정한다.", item: "성능 그래프", mission: "동기/비동기 성능을 비교하고 결과를 기록한다." },
  { no: 35, zone: "심화", title: "실전 코드 예제 1", arrival: "즉시 실행 가능한 예제를 복습한다.", item: "예제 카드", mission: "실전 코드 예제를 따라 하며 개념을 복습한다." },
  { no: 36, zone: "심화", title: "실전 코드 예제 2", arrival: "다른 예제로 응용력을 높인다.", item: "응용 카드", mission: "실전 코드 예제를 변형해 새로운 결과를 얻는다." },
  { no: 37, zone: "심화", title: "프로젝트 심화 과제 1", arrival: "스마트홈 기능을 묶어본다.", item: "과제 1 배지", mission: "심화 프로젝트 과제를 선택해 구현 방향을 잡는다." },
  { no: 38, zone: "심화", title: "프로젝트 심화 과제 2", arrival: "분석과 진단 중심 과제를 풀어본다.", item: "과제 2 배지", mission: "분석형 심화 과제를 수행하며 증거 기반 설명을 연습한다." },
  { no: 39, zone: "심화", title: "프로젝트 심화 과제 3", arrival: "채팅과 확장 기능을 더한다.", item: "과제 3 배지", mission: "P2P/채팅 확장 과제를 통해 구조를 확장한다." },
  { no: 40, zone: "심화", title: "문제 해결 집중", arrival: "막힌 부분을 해결한다.", item: "해결 배지", mission: "트러블슈팅 가이드를 따라 문제 해결을 집중 연습한다." },
  { no: 41, zone: "배포", title: "클라우드 배포 1", arrival: "외부에서 접속 가능한 형태로 올린다.", item: "배포 키", mission: "클라우드 배포 실습 1을 진행한다." },
  { no: 42, zone: "배포", title: "클라우드 배포 2", arrival: "배포 후 동작을 검증한다.", item: "배포 확인서", mission: "클라우드 배포 실습 2로 서비스 상태를 점검한다." },
  { no: 43, zone: "정리", title: "학교 Drive 학습 기록 제출", arrival: "작품과 학습 이력을 남긴다.", item: "학습 로그", mission: "학교 Drive 기록 시트에 작품 링크와 회고를 제출한다." },
  { no: 44, zone: "정리", title: "교사 피드백과 학생 기억 보정", arrival: "기록을 다음 차시로 넘긴다.", item: "기억 수정펜", mission: "교사 피드백과 학생 기억을 보정해 다음 학습으로 연결한다." },
  { no: 45, zone: "평가", title: "수행평가 2 준비", arrival: "장애 시나리오를 읽는다.", item: "평가 지도", mission: "장애 진단 수행평가의 시나리오와 증거 수집법을 익힌다." },
  { no: 46, zone: "평가", title: "수행평가 2 진단 1", arrival: "원인 후보를 좁힌다.", item: "진단 표식", mission: "장애 현상을 관찰하고 1차 원인 가설을 세운다." },
  { no: 47, zone: "평가", title: "수행평가 2 진단 2", arrival: "증거로 정상화를 마무리한다.", item: "복구 표식", mission: "장애를 해결하고 정상화 증거를 남긴다." },
  { no: 48, zone: "마무리", title: "최종 발표와 회고", arrival: "배운 내용을 정리해 발표한다.", item: "졸업 배지", mission: "최종 발표와 회고를 작성하고 48차시를 마무리한다." }
];
let active = "mission";
const lesson = document.querySelector("#lesson");
const submissionLesson = document.querySelector("#submission-lesson");
const lessonMap = document.querySelector("#lesson-map");
const raceGrid = document.querySelector("#race-grid");
let raceTimer = null;
let completedLessons = new Set();
let unlockedLessonMax = 1;
let lastUnlockedSelection = 1;

const mapNodes = [
  { no: 1, x: 12, y: 86, lane: "base", mini: "Blue" },
  { no: 2, x: 18, y: 80, lane: "base", mini: "Gate" },
  { no: 3, x: 23, y: 74, lane: "top", mini: "Top" },
  { no: 4, x: 29, y: 68, lane: "top", mini: "Top" },
  { no: 5, x: 35, y: 62, lane: "top", mini: "Top" },
  { no: 6, x: 41, y: 56, lane: "top", mini: "Top" },
  { no: 7, x: 47, y: 50, lane: "mid", mini: "Mid" },
  { no: 8, x: 53, y: 44, lane: "top", mini: "Top" },
  { no: 9, x: 59, y: 38, lane: "top", mini: "Top" },
  { no: 10, x: 65, y: 32, lane: "top", mini: "Top" },
  { no: 11, x: 28, y: 48, lane: "jungle", mini: "JG" },
  { no: 12, x: 34, y: 42, lane: "jungle", mini: "JG" },
  { no: 13, x: 40, y: 36, lane: "jungle", mini: "JG" },
  { no: 14, x: 46, y: 30, lane: "mid", mini: "Mid" },
  { no: 15, x: 52, y: 24, lane: "mid", mini: "Mid" },
  { no: 16, x: 58, y: 18, lane: "mid", mini: "Mid" },
  { no: 17, x: 18, y: 18, lane: "top", mini: "Herald" },
  { no: 18, x: 26, y: 24, lane: "top", mini: "Top" },
  { no: 19, x: 34, y: 30, lane: "mid", mini: "Mid" },
  { no: 20, x: 42, y: 38, lane: "mid", mini: "Mid" },
  { no: 21, x: 50, y: 50, lane: "mid", mini: "Mid" },
  { no: 22, x: 58, y: 58, lane: "mid", mini: "Mid" },
  { no: 23, x: 66, y: 66, lane: "bot", mini: "Bot" },
  { no: 24, x: 74, y: 74, lane: "bot", mini: "Bot" },
  { no: 25, x: 22, y: 60, lane: "jungle", mini: "Wolf" },
  { no: 26, x: 28, y: 66, lane: "jungle", mini: "Blue" },
  { no: 27, x: 34, y: 72, lane: "jungle", mini: "Gromp" },
  { no: 28, x: 40, y: 78, lane: "bot", mini: "Bot" },
  { no: 29, x: 46, y: 84, lane: "bot", mini: "Bot" },
  { no: 30, x: 52, y: 90, lane: "bot", mini: "Bot" },
  { no: 31, x: 16, y: 66, lane: "bot", mini: "Bot" },
  { no: 32, x: 22, y: 72, lane: "bot", mini: "Bot" },
  { no: 33, x: 28, y: 78, lane: "bot", mini: "Bot" },
  { no: 34, x: 34, y: 84, lane: "bot", mini: "Bot" },
  { no: 35, x: 40, y: 90, lane: "bot", mini: "Bot" },
  { no: 36, x: 58, y: 72, lane: "jungle", mini: "Raptor" },
  { no: 37, x: 64, y: 66, lane: "jungle", mini: "Red" },
  { no: 38, x: 70, y: 60, lane: "jungle", mini: "Krug" },
  { no: 39, x: 76, y: 54, lane: "mid", mini: "Mid" },
  { no: 40, x: 82, y: 48, lane: "mid", mini: "Mid" },
  { no: 41, x: 90, y: 82, lane: "bot", mini: "Dragon" },
  { no: 42, x: 84, y: 76, lane: "bot", mini: "Bot" },
  { no: 43, x: 78, y: 70, lane: "bot", mini: "Bot" },
  { no: 44, x: 72, y: 64, lane: "bot", mini: "Bot" },
  { no: 45, x: 72, y: 28, lane: "top", mini: "Top" },
  { no: 46, x: 78, y: 22, lane: "top", mini: "Top" },
  { no: 47, x: 84, y: 16, lane: "base", mini: "Gate" },
  { no: 48, x: 90, y: 10, lane: "base", mini: "Red" }
];
const subjectStages = [
  { stage: 1, start: 1, title: "인공지능 모델링", lane: "base", mini: "AI", x: 12, y: 84 },
  { stage: 2, start: 7, title: "게임프로그래밍", lane: "top", mini: "GAME", x: 28, y: 68 },
  { stage: 3, start: 13, title: "응용프로그래밍", lane: "mid", mini: "APP", x: 44, y: 52 },
  { stage: 4, start: 19, title: "시스템자원·운영관리", lane: "jungle", mini: "SYS", x: 62, y: 38 },
  { stage: 1, start: 1, title: "네트워크프로그래밍 · 1차시", lane: "mid", mini: "NET 1", x: 38, y: 50 },
  { stage: 2, start: 2, title: "네트워크프로그래밍 · 2차시", lane: "mid", mini: "NET 2", x: 62, y: 50 },
  { stage: 6, start: 31, title: "스마트문화앱 제작", lane: "bot", mini: "APP", x: 72, y: 62 },
  { stage: 7, start: 37, title: "3D프린터 프로그래밍", lane: "jungle", mini: "3D", x: 48, y: 78 },
  { stage: 8, start: 43, title: "자율주행 통합 프로젝트", lane: "base", mini: "BOSS", x: 88, y: 86 }
];

const mapThemes = [
  {
    id: "foundation",
    range: [1, 2],
    name: "준비 맵",
    title: "학습 환경 세팅",
    text: "Python, VS Code, Wireshark, GitHub 제출 흐름을 준비하는 구간입니다.",
    lanes: { top: "Setup Lane", mid: "Tools Lane", bot: "Login Lane", jungle: "Prep Jungle" }
  },
  {
    id: "transport",
    range: [3, 16],
    name: "기초 맵",
    title: "통신의 시작과 흐름 관찰",
    text: "네트워크 자원, 첫 서버, 클라이언트, TCP, UDP, 채팅 구조를 익히는 구간입니다.",
    lanes: { top: "Basic Lane", mid: "Flow Lane", bot: "Chat Lane", jungle: "Packet Jungle" }
  },
  {
    id: "security",
    range: [17, 34],
    name: "심화 맵",
    title: "데이터, 보안, API, IoT 확장",
    text: "JSON, 파일, SQLite, 보안, REST API, IoT, 로깅, 클라우드, 성능을 다루는 구간입니다.",
    lanes: { top: "Data Lane", mid: "API Lane", bot: "Cloud Lane", jungle: "Audit Jungle" }
  },
  {
    id: "project",
    range: [35, 48],
    name: "완성 맵",
    title: "배포, 평가, 발표로 마무리",
    text: "실전 예제, 심화 과제, 클라우드 배포, 수행평가, 최종 발표까지 이어지는 마무리 구간입니다.",
    lanes: { top: "Deploy Lane", mid: "Review Lane", bot: "Demo Lane", jungle: "Maker Jungle" }
  }
];
const visibleSubjectStages = subjectStages.filter(stage => stage.title.startsWith("네트워크프로그래밍"));

// 학생 수준에 맞춘 10행 수업용 발췌표입니다. 실제 수업에서는 출처와 이용 조건을
// 확인한 뒤 교사가 공개 데이터에서 필요한 열만 발췌해 교체합니다.
const drivingRows = [
  [1, "10:00:01", "0", "0"],
  [2, "10:00:02", "5", "0"],
  [3, "10:00:03", "12", "2"],
  [4, "10:00:04", "18", "4"],
  [5, "10:00:05", "20", "1"],
  [6, "10:00:06", "17", "-2"],
  [7, "10:00:07", "13", "-4"],
  [8, "10:00:08", "10", "-1"],
  [9, "10:00:09", "8", "0"],
  [10, "10:00:10", "0", "0"]
];

const simulationDatasets = {
  comma: {
    label: "comma2k19 기반 연습 데이터",
    rows: drivingRows.map(row => ({ row: row[0], time: row[1], speed: Number(row[2]), steering: Number(row[3]) }))
  },
  aihub: {
    label: "AI-Hub 교통물류 기반 연습 데이터",
    rows: [
      { row: 1, time: "09:12:01", speed: 0, steering: 0 },
      { row: 2, time: "09:12:02", speed: 8, steering: 0 },
      { row: 3, time: "09:12:03", speed: 16, steering: 1 },
      { row: 4, time: "09:12:04", speed: 22, steering: 3 },
      { row: 5, time: "09:12:05", speed: 21, steering: 5 },
      { row: 6, time: "09:12:06", speed: 19, steering: 2 },
      { row: 7, time: "09:12:07", speed: 15, steering: -3 },
      { row: 8, time: "09:12:08", speed: 11, steering: -5 },
      { row: 9, time: "09:12:09", speed: 7, steering: -1 },
      { row: 10, time: "09:12:10", speed: 0, steering: 0 }
    ]
  }
};
let simulationRows = simulationDatasets.comma.rows;
let simulationIndex = 0;
let simulationTimer = null;

function renderDrivingDataPanel(no) {
  const panel = document.querySelector("#driving-data-panel");
  if (!panel) return;
  panel.hidden = no !== 1;
  const simulator = document.querySelector("#vscode-simulation");
  // 1차시는 표에서 주행 데이터를 읽는 단계로 고정하고,
  // 온라인 시뮬레이션은 학생이 VS Code 단계(코드)를 직접 선택했을 때만 표시합니다.
  if (simulator) simulator.hidden = active !== "code";
  const title = document.querySelector("#sim-title");
  if (title) title.textContent = active === "code" ? "2번 VS Code 연동: 온라인 통신 시뮬레이션" : "주행 데이터 온라인 시뮬레이션";
}

function paintSimulation() {
  const item = simulationRows[simulationIndex] || simulationRows[0];
  if (!item) return;
  document.querySelector("#sim-row").textContent = item.row;
  document.querySelector("#sim-time").textContent = item.time;
  document.querySelector("#sim-speed-value").textContent = `${item.speed} km/h`;
  document.querySelector("#sim-steering-value").textContent = item.steering;
  const car = document.querySelector("#sim-car");
  const speedRatio = Math.max(0, Math.min(1, item.speed / 25));
  const steeringOffset = Math.max(-34, Math.min(34, item.steering * 5));
  car.style.left = `${12 + speedRatio * 76}%`;
  car.style.transform = `translate(-50%, -50%) rotate(${steeringOffset / 2}deg)`;
}

function stopSimulation() {
  if (simulationTimer) window.clearInterval(simulationTimer);
  simulationTimer = null;
  document.querySelector("#sim-play").textContent = "▶ 재생";
}

function startSimulation() {
  if (simulationTimer) {
    stopSimulation();
    return;
  }
  document.querySelector("#sim-play").textContent = "Ⅱ 일시정지";
  const speed = Number(document.querySelector("#sim-speed").value || 2);
  simulationTimer = window.setInterval(() => {
    simulationIndex = (simulationIndex + 1) % simulationRows.length;
    paintSimulation();
  }, Math.max(220, 1100 / speed));
}

function parseDrivingCsv(text) {
  const rows = text.trim().split(/\r?\n/).map(line => line.split(",").map(value => value.trim()));
  if (rows.length < 2) throw new Error("CSV에 헤더와 데이터 행이 필요합니다.");
  const headers = rows[0].map(value => value.toLowerCase());
  const findIndex = names => headers.findIndex(header => names.some(name => header.includes(name)));
  const timeIndex = findIndex(["time", "timestamp", "시각"]);
  const speedIndex = findIndex(["speed", "vego", "속도"]);
  const steeringIndex = findIndex(["steer", "steering", "조향"]);
  if (speedIndex < 0 || steeringIndex < 0) throw new Error("CSV에 speed/속도와 steering/조향 열이 필요합니다.");
  return rows.slice(1).map((values, index) => ({
    row: index + 1,
    time: timeIndex >= 0 ? values[timeIndex] : String(index + 1),
    speed: Number(values[speedIndex]) || 0,
    steering: Number(values[steeringIndex]) || 0
  })).filter(item => item.time || item.speed || item.steering);
}

function lessonMeta(no) {
  return lessonCatalog[no - 1] || {
    no,
    zone: "재구성 구역",
    title: `스테이지 ${no}`,
    arrival: "학습 목표를 확인하고 증거를 남긴다.",
    item: "탐험 배지",
    mission: "교육과정 지도의 목표를 확인하세요."
  };
}

function lessonLabel(no) {
  const meta = lessonMeta(no);
  return `${meta.zone} - ${meta.title}`;
}

function lessonTheme(no) {
  return mapThemes.find(theme => no >= theme.range[0] && no <= theme.range[1]) || mapThemes[0];
}

function escHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function raceStageLabel(item) {
  return lessonLabel(item.current_lesson || 1);
}

function recomputeUnlocks() {
  let next = 1;
  while (completedLessons.has(next)) next += 1;
  unlockedLessonMax = Math.min(48, next);
}

function isLessonUnlocked(no) {
  // 네트워크프로그래밍 수업의 1·2차시는 교사가 두 화면을 오가며
  // 연결해서 진행할 수 있도록 항상 활성화합니다.
  if (no === 1 || no === 2) return true;
  return no <= unlockedLessonMax || completedLessons.has(no);
}

function lockMessage(no) {
  return `${lessonLabel(no - 1)} 완료 후 ${lessonLabel(no)} 해금`;
}

function applyLessonLocks() {
  for (let i = 0; i < lesson.options.length; i += 1) {
    const no = Number(lesson.options[i].value);
    const unlocked = isLessonUnlocked(no);
    lesson.options[i].disabled = !unlocked;
    submissionLesson.options[i].disabled = !unlocked;
  }
  if (!isLessonUnlocked(Number(lesson.value || 1))) {
    lesson.value = String(lastUnlockedSelection);
  }
}

async function loadStudentProgress() {
  if (!currentStudent) {
    completedLessons = new Set();
    unlockedLessonMax = 1;
    lastUnlockedSelection = 1;
    applyLessonLocks();
    render();
    return;
  }
  try {
    const progress = await api(`/api/students/${currentStudent.id}/progress`);
    completedLessons = new Set(progress.filter(item => item.status === "completed").map(item => item.lesson_no));
  } catch {
    completedLessons = new Set();
  }
  recomputeUnlocks();
  lastUnlockedSelection = Math.min(Math.max(1, Number(lesson.value || 1)), unlockedLessonMax);
  applyLessonLocks();
}

async function loadRaceBoard() {
  if (!raceGrid) return;
  const status = document.querySelector("#race-status");
  const updated = document.querySelector("#race-updated");
  try {
    let data = await api("/api/teacher/dashboard");
    if (new URLSearchParams(window.location.search).get("demoRace") === "1") {
      const existingCodes = new Set(data.map(item => item.student.student_code));
      const template = data[0] || { completed_count: 0, current_lesson: 1, progress_percent: 0, chat_count: 0, wireshark_count: 0, tshark_count: 0, strengths: [], difficulties: [], recent_errors: [] };
      for (let code = 30101; code <= 30111; code += 1) {
        if (existingCodes.has(String(code))) continue;
        const completed = (code - 30100) % 5;
        data.push({ ...template, student: { id: 9000 + code, student_code: String(code), nickname: "비공개" }, completed_count: completed, current_lesson: Math.max(1, completed + 1), progress_percent: Math.round(completed / 48 * 100), chat_count: completed % 3, wireshark_count: Math.floor(completed / 2), tshark_count: Math.floor(completed / 3) });
      }
    }
    const surpriseMissions = ["패킷 필터를 10초 안에 찾아 기록하기", "속도 최고 행과 조향 변화를 비교하기", "TCP 연결 순서를 팀원에게 설명하기", "증거 프레임 번호를 찾아 팀 채팅에 공유하기"];
    const missionKey = "network-lab-surprise-missions";
    let surprise = {};
    try { surprise = JSON.parse(sessionStorage.getItem(missionKey) || "{}"); } catch { surprise = {}; }
    ["a", "b"].forEach(team => {
      const members = data.filter(item => (Number(String(item.student.student_code).slice(-2)) <= 6 ? "a" : "b") === team);
      if (members.length && !surprise[team]) {
        const selected = members[Math.floor(Math.random() * members.length)];
        surprise[team] = { student: selected.student.student_code, mission: surpriseMissions[Math.floor(Math.random() * surpriseMissions.length)] };
      }
    });
    try { sessionStorage.setItem(missionKey, JSON.stringify(surprise)); } catch {}
    const points = item => {
      const teamKey = Number(String(item.student.student_code).slice(-2)) <= 6 ? "a" : "b";
      const bonus = surprise[teamKey]?.student === item.student.student_code ? 50 : 0;
      return (item.completed_count * 100) + (item.wireshark_count * 20) + (item.tshark_count * 15) + (item.chat_count * 5) + bonus;
    };
    const ranked = data.map(item => ({ ...item, race_points: points(item) })).sort((a, b) => {
      if (b.race_points !== a.race_points) return b.race_points - a.race_points;
      if (b.completed_count !== a.completed_count) return b.completed_count - a.completed_count;
      if (b.current_lesson !== a.current_lesson) return b.current_lesson - a.current_lesson;
      return a.student.nickname.localeCompare(b.student.nickname, "ko");
    });
    status.textContent = `참가 ${ranked.length}명`;
    updated.textContent = `${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 기준 갱신`;
    const teamFor = code => Number(String(code).slice(-2)) <= 6 ? { name: "번개 패킷팀", cls: "team-a" } : { name: "라즈베리 질주팀", cls: "team-b" };
    updateCarEnergy(ranked);
    raceGrid.innerHTML = ranked.length ? ranked.map((item, index) => { const team = teamFor(item.student.student_code); const surpriseMission = surprise[team.cls === "team-a" ? "a" : "b"]; return `
      <article class="race-card ${team.cls} ${currentStudent && currentStudent.id === item.student.id ? "me" : ""}">
        <span class="race-rank">#${index + 1}</span>
        <b>학번 ${escHtml(item.student.student_code)}</b>
        <span class="team-label">${team.name}</span>
        <span class="race-stage">${escHtml(raceStageLabel(item))}</span>
        ${surpriseMission?.student === item.student.student_code ? `<span class="surprise-mission">⚡ 돌발 미션 · ${escHtml(surpriseMission.mission)} · 성공 시 보너스 +50점</span>` : ""}
        <small>${item.completed_count}/48 스테이지 완료 · 현재 ${item.current_lesson}번 진행 중</small>
        <div class="race-stats">
          <span>포인트<b>${item.race_points}점</b></span>
          <span>완료율<b>${item.progress_percent}%</b></span>
          <span>알라딘 질문<b>${item.chat_count}</b></span>
          <span>Wireshark 증거<b>${item.wireshark_count}</b></span>
          <span>TShark 결과<b>${item.tshark_count}</b></span>
        </div>
      </article>`; }).join("") : `<article class="race-card"><b>아직 참가 학생이 없습니다.</b><p>로그인 후 학습을 시작하면 여기에 자동으로 나타납니다.</p></article>`;
  } catch (error) {
    status.textContent = "API 필요";
    updated.textContent = "대시보드를 불러오지 못했습니다.";
    raceGrid.innerHTML = `<article class="race-card"><b>레이스 보드를 불러오지 못했습니다.</b><p>${escHtml(error.message)}</p></article>`;
  }
}

function updateCarEnergy(items = []) {
  const teams = { a: [], b: [] };
  items.forEach(item => {
    const key = Number(String(item.student?.student_code || "0").slice(-2)) <= 6 ? "a" : "b";
    teams[key].push(item);
  });
  const energyFor = list => {
    if (!list.length) return 0;
    let missions = {};
    try { missions = JSON.parse(sessionStorage.getItem("network-lab-surprise-missions") || "{}"); } catch {}
    const teamKey = Number(String(list[0].student?.student_code || "0").slice(-2)) <= 6 ? "a" : "b";
    const total = list.reduce((sum, item) => sum + (item.completed_count || 0) * 100 + (item.wireshark_count || 0) * 20 + (item.tshark_count || 0) * 15 + (item.chat_count || 0) * 5 + (missions[teamKey]?.student === item.student.student_code ? 50 : 0), 0);
    return Math.min(100, Math.round(total / list.length / 5));
  };
  ["a", "b"].forEach(key => {
    const value = energyFor(teams[key]);
    const valueEl = document.querySelector(`#energy-value-${key}`);
    const barEl = document.querySelector(`#energy-bar-${key}`);
    const stageEl = document.querySelector(`#energy-stage-${key}`);
    if (valueEl) valueEl.textContent = `${value}%`;
    if (barEl) barEl.style.width = `${value}%`;
    if (stageEl) stageEl.textContent = value >= 100 ? "🏁 결승점 도착" : value >= 50 ? "2차시 질주 중" : "1차시 출발";
    const car = document.querySelector(`.map-race-car.car-${key}`);
    if (car) {
      car.style.setProperty("--car-progress", `${Math.max(8, value)}%`);
      car.style.left = `${18 + Math.min(78, value * 0.62)}%`;
      car.classList.toggle("finished", value >= 100);
    }
  });
}

function startRaceBoard() {
  loadRaceBoard();
  if (raceTimer) clearInterval(raceTimer);
  raceTimer = setInterval(loadRaceBoard, 10000);
}

function renderMap() {
  if (!lessonMap) return;
  const theme = lessonTheme(Number(lesson.value || 1));
  lessonMap.className = `map-board theme-${theme.id}`;
  lessonMap.innerHTML = `
    <span class="map-lane-tag tag-top">${theme.lanes.top}</span>
    <span class="map-lane-tag tag-mid">${theme.lanes.mid}</span>
    <span class="map-lane-tag tag-bot">${theme.lanes.bot}</span>
    <span class="map-lane-tag tag-jungle">${theme.lanes.jungle}</span>
    <span class="map-finish-line" aria-label="결승점">🏁 결승점</span>
    <div class="map-race-car car-a" aria-label="번개 패킷카 경주 위치"><span>🏎️</span><b>번개 패킷카 · 1→2차시</b></div>
    <div class="map-race-car car-b" aria-label="라즈베리 질주카 경주 위치"><span>🚗</span><b>라즈베리 질주카 · 1→2차시</b></div>
    ${visibleSubjectStages.map(node => `
      <button
        type="button"
        class="map-node ${node.lane} ${Number(lesson.value || 1) === node.start ? "active" : ""} ${isLessonUnlocked(node.start) ? "" : "locked"} ${unlockedLessonMax >= node.start + 5 ? "done" : ""}"
        data-lesson-node="${node.start}"
        style="left:${node.x}%; top:${node.y}%;"
        title="${isLessonUnlocked(node.start) ? node.title : `${node.title} (이전 교과를 먼저 완료하세요)`}"
        aria-label="${isLessonUnlocked(node.start) ? `${node.stage}단계 ${node.title}` : `${node.title} 잠김` }"
        ${isLessonUnlocked(node.start) ? "" : "disabled"}>
        <span class="node-no">${String(node.stage).padStart(2, "0")}</span>
        <span class="node-mini">${unlockedLessonMax >= node.start + 5 ? "Clear" : node.mini}</span>
      </button>
    `).join("")}
  `;
  lessonMap.querySelectorAll("[data-lesson-node]").forEach(button => {
    button.onclick = () => {
      if (button.disabled) {
        memoryResult.textContent = button.title;
        return;
      }
      if (Number(button.dataset.lessonNode) === 2) {
        window.location.href = "lesson-02.html";
        return;
      }
      lesson.value = button.dataset.lessonNode;
      lastUnlockedSelection = Number(button.dataset.lessonNode);
      render();
      lesson.dispatchEvent(new Event("change"));
    };
  });
}

// 학생 화면에는 교과별 8개 관문만 공개합니다. 48개 세부 차시는 교사용
// 지도·기록 체계로 유지하고 학생에게는 현재 교과의 핵심 관문만 보여줍니다.
visibleSubjectStages.forEach(stage => {
  lesson.add(new Option(`${stage.stage}. ${stage.title}`, stage.start));
  submissionLesson.add(new Option(`${stage.stage}. ${stage.title}`, stage.start));
});

function render() {
  const n = Number(lesson.value || 1);
  const meta = lessonMeta(n);
  const theme = lessonTheme(n);
  submissionLesson.value = n;
  document.querySelector("#map-theme-name").textContent = theme.name;
  document.querySelector("#map-theme-text").textContent = `${theme.title} · ${theme.text}`;
  document.querySelector("#map-stage-title").textContent = `${lessonLabel(n)} 선택됨`;
  document.querySelector("#map-stage-text").textContent = `도착 목표: ${meta.arrival} / 획득 아이템: ${meta.item} / 현재 해금: ${String(unlockedLessonMax).padStart(2, "0")}번까지`;
  document.querySelector("#mission").innerHTML = `
    <p class="stage-zone">${meta.zone}</p>
    <h2>${meta.title}</h2>
    <p class="stage-mission">${meta.mission}</p>
    <div class="stage-grid">
      <article>
        <span>도착 목표</span>
        <b>${meta.arrival}</b>
      </article>
      <article>
        <span>중간 아이템</span>
        <b>${meta.item}</b>
      </article>
      <article>
        <span>기록 번호</span>
        <b>스테이지 ${String(meta.no).padStart(2, "0")}</b>
      </article>
    </div>
  `;
  renderDrivingDataPanel(n);
  const renderStep = ([id, title, text], index) => `<article class="step ${id === active ? "active" : ""}" data-step="${id}"><b><span class="step-icon" aria-hidden="true">${stepIcons[id] || "📘"}</span>${index + 1}. ${title}</b>${text}${id === "code" ? '<span class="step-launch">시뮬레이션 열기 →</span>' : ""}${id === "hint" ? '<span class="step-launch">챗봇 열기 →</span>' : ""}</article>`;
  const beforeChat = steps.slice(0, 5).map(renderStep).join("");
  const afterChat = steps.slice(5).map((step, index) => renderStep(step, index + 5)).join("");
  document.querySelector("#flow").innerHTML = `
    <div class="flow-phase flow-before-chat">
      <div class="flow-phase-title"><span><span class="phase-icon" aria-hidden="true">🧠</span> 내가 얼만큼 알까</span><small>먼저 직접 관찰하고 최초 판단을 저장합니다.</small></div>
      <div class="flow-phase-grid">${beforeChat}</div>
    </div>
    <div class="flow-phase flow-after-chat">
      <div class="flow-phase-title"><span><span class="phase-icon" aria-hidden="true">🧞</span> 나만의 학습 챗봇</span><small>내 증거를 바탕으로 챗봇과 대화하며 판단을 수정하고 다시 검증합니다.</small></div>
      <div class="flow-phase-grid">${afterChat}</div>
    </div>`;
  document.querySelectorAll(".step").forEach(element => {
    element.onclick = () => {
      active = element.dataset.step;
      render();
      document.querySelector(".chat-card")?.classList.toggle("chat-open", active === "hint");
      if (active === "code") {
        window.location.hash = "vscode-simulation";
        window.requestAnimationFrame(() => document.querySelector("#vscode-simulation")?.scrollIntoView({ behavior: "auto", block: "start" }));
      }
      if (active === "hint") {
        window.location.hash = "memory-workflow";
        window.requestAnimationFrame(() => document.querySelector(".chat-card")?.scrollIntoView({ behavior: "auto", block: "start" }));
        document.querySelector("#gemini-question")?.focus();
      }
      if (active === "observe") {
        window.location.hash = "observe-flow";
        window.requestAnimationFrame(() => document.querySelector("#observe-flow")?.scrollIntoView({ behavior: "auto", block: "start" }));
      }
      if (active === "evidence") {
        window.location.hash = "memory-workflow";
        window.requestAnimationFrame(() => { document.querySelector("#memory-workflow")?.scrollIntoView({ behavior: "auto", block: "start" }); document.querySelector("#memory-evidence")?.focus(); });
      }
      if (active === "tshark") {
        window.location.hash = "memory-workflow";
        window.requestAnimationFrame(() => { document.querySelector("#memory-workflow")?.scrollIntoView({ behavior: "auto", block: "start" }); document.querySelector("#filter-used")?.focus(); });
      }
    };
  });
  renderMap();
}

lesson.onchange = render;

document.querySelector("#save").onclick = async () => {
  const note = `${document.querySelector("#evidence").value}\n판단: ${document.querySelector("#judgement").value}`.trim();
  try {
    const response = await fetch(`${API}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson: Number(lesson.value), step: active, note })
    });
    if (!response.ok) throw new Error();
    document.querySelector("#save-result").textContent = "서버에 저장했습니다.";
  } catch {
    localStorage.setItem("smarthome-lab-progress", JSON.stringify({ lesson: lesson.value, step: active, note }));
    document.querySelector("#save-result").textContent = "API가 오프라인이라 브라우저에 임시 저장했습니다.";
  }
};

async function loadMySubmissions() {
  const id = document.querySelector("#student-id").value.trim();
  if (!id) return;
  if (!API) {
    document.querySelector("#my-submissions").textContent = "공개 페이지에서는 제출 기록 API가 연결되지 않았습니다.";
    return;
  }
  try {
    const items = await fetch(`${API}/api/submissions?student_id=${encodeURIComponent(id)}`).then(response => response.json());
    document.querySelector("#my-submissions").innerHTML = items.length
      ? items.slice().reverse().map(item => {
          const submittedAt = item.submitted_at ? new Date(item.submitted_at).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "시간 정보 없음";
          return `<article class="submission-card"><b>${lessonLabel(item.lesson)} · ${item.status}</b><a href="${item.repository_url}" target="_blank" rel="noopener">${item.repository}</a><small>업로드 ${submittedAt} · 커밋 ${item.latest_commit.slice(0, 7)} · 필수 파일 ${item.requirements_passed ? "통과" : "확인 필요"}</small>${item.feedback ? `<p>교사 피드백: ${item.feedback}</p>` : ""}</article>`;
        }).join("")
      : "<p>아직 제출 기록이 없습니다.</p>";
  } catch {
    document.querySelector("#my-submissions").textContent = "제출 기록을 불러올 수 없습니다.";
  }
}

document.querySelector("#student-id").addEventListener("change", loadMySubmissions);

document.querySelector("#submission-form").onsubmit = async event => {
  event.preventDefault();
  const target = document.querySelector("#submission-result");
  if (!requireLogin()) return;
  target.textContent = "학습기록을 자동 저장하는 중입니다…";
  const payload = { lesson: Number(submissionLesson.value), step: active, note: document.querySelector("#reflection").value.trim() };
  try {
    const response = await fetch(`${API}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "제출 실패");
    target.textContent = "학습기록을 자동 저장했습니다.";
  } catch (error) {
    target.textContent = error.message;
  }
};

if (API) {
  fetch(`${API}/health`)
    .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
    .then(() => { document.querySelector("#api-status").textContent = "● API 연결됨"; })
    .catch(() => { document.querySelector("#api-status").textContent = "○ API 오프라인"; });
} else {
  document.querySelector("#api-status").textContent = "● 브라우저 학습 모드";
}

let currentStudent = JSON.parse(localStorage.getItem("smarthome-student") || "null");
const memoryResult = document.querySelector("#memory-result");

async function api(path, options = {}) {
  if (!API) throw new Error("공개 웹페이지에서는 브라우저 저장 모드로 작동합니다. 서버 API가 필요하면 로컬 서버를 실행하세요.");
  const response = await fetch(`${API}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : { detail: `JSON이 아닌 응답을 받았습니다 (HTTP ${response.status})` };
  if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
  return data;
}

function showStudent() {
  if (currentStudent) {
    document.querySelector("#login-code").value = currentStudent.student_code;
    document.querySelector("#student-name").value = "비공개";
    document.querySelector("#student-id").value = currentStudent.student_code;
    document.querySelector("#login-result").textContent = `학번 ${currentStudent.student_code}의 학습기억을 불러왔습니다.`;
  } else {
    document.querySelector("#login-result").textContent = "로그인이 필요합니다.";
  }
}

function requireLogin() {
  if (!currentStudent) {
    memoryResult.textContent = "먼저 학생 로그인을 해주세요.";
    return false;
  }
  return true;
}

function escChat(value) {
  return escHtml(value);
}

async function loadChat() {
  const box = document.querySelector("#chat-history");
  if (!currentStudent) {
    box.innerHTML = '<p class="empty-chat">저장된 대화를 불러오려면 로그인하세요.</p>';
    return;
  }
  try {
    const logs = await api(`/api/students/${currentStudent.id}/chat-logs?lesson_no=${Number(lesson.value)}`);
    box.innerHTML = logs.length
      ? logs.map(item => `<div class="chat-message user"><b>나</b><p>${escChat(item.user_message)}</p></div><div class="chat-message bot"><b>나만의 학습 챗봇</b><p>${escChat(item.gemini_response)}</p></div>`).join("")
      : "<p class=\"empty-chat\">이 스테이지에는 아직 대화가 없습니다.</p>";
    box.scrollTop = box.scrollHeight;
  } catch (error) {
    const key = `network-chat-${currentStudent.student_code}-${Number(lesson.value)}`;
    const logs = JSON.parse(localStorage.getItem(key) || "[]");
    box.innerHTML = logs.length
      ? logs.map(item => `<div class="chat-message user"><b>학생 ${escChat(currentStudent.student_code)}</b><p>${escChat(item.question)}</p></div><div class="chat-message bot"><b>알라딘 학습 챗봇</b><p>${escChat(item.answer)}</p></div>`).join("")
      : "<p class=\"empty-chat\">질문을 보내면 학생과 챗봇의 대화가 여기에 쌓입니다.</p>";
    box.scrollTop = box.scrollHeight;
  }
}

function offlineChatAnswer(message) {
  const text = message.toLowerCase();
  if (text.includes("필터")) return "필터를 바꾸면 보이는 패킷의 범위가 달라져요. 지금 필터가 찾는 조건을 한 문장으로 먼저 말해 볼까요?";
  if (text.includes("tcp") || text.includes("syn")) return "TCP 연결 기록이라면 SYN과 SYN/ACK의 시간 순서를 비교해 보세요. 두 패킷의 출발지와 목적지는 어떻게 다른가요?";
  if (text.includes("속도") || text.includes("조향") || text.includes("브레이크")) return "주행 값은 시간과 함께 봐야 해요. 속도·조향·브레이크 중 하나를 골라 앞뒤 행의 값이 어떻게 달라졌는지 찾아볼까요?";
  if (text.includes("주소") || text.includes("출발지") || text.includes("목적지")) return "출발지와 목적지를 먼저 구분해 보세요. 어느 주소가 명령을 보내고 어느 주소가 차량 응답을 받는지 패킷 한 줄을 근거로 말해 볼까요?";
  if (text.includes("왜") || text.includes("이유")) return "좋은 관찰이에요. 추측하기 전에 화면에서 확인할 수 있는 숫자나 시간 하나를 골라 근거로 삼아 볼까요?";
  return "좋은 질문이에요. 먼저 화면에서 보이는 패킷 번호나 값을 하나 고르고, 그 값이 무엇을 뜻하는지 함께 확인해 볼까요?";
}

document.querySelector("#login-form").onsubmit = async event => {
  event.preventDefault();
  if (document.querySelector("#login-password").value !== "1234") {
    document.querySelector("#login-result").textContent = "현재 테스트 비밀번호는 1234입니다.";
    return;
  }
  try {
    currentStudent = await api("/api/students/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_code: document.querySelector("#login-code").value.trim(),
        nickname: "비공개"
      })
    });
    localStorage.setItem("smarthome-student", JSON.stringify(currentStudent));
    showStudent();
    await loadStudentProgress();
    await api(`/api/students/${currentStudent.id}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_no: Number(lesson.value), status: "in_progress" })
    });
    await loadChat();
  } catch (error) {
    document.querySelector("#login-result").textContent = error.message;
  }
};

document.querySelector("#logout").onclick = () => {
  currentStudent = null;
  localStorage.removeItem("smarthome-student");
  showStudent();
  loadStudentProgress();
  loadChat();
};

lesson.addEventListener("change", async () => {
  if (!isLessonUnlocked(Number(lesson.value))) {
    memoryResult.textContent = lockMessage(Number(lesson.value));
    lesson.value = String(lastUnlockedSelection);
    render();
    return;
  }
  lastUnlockedSelection = Number(lesson.value);
  // 차시 선택 상자에서 2차시를 고르면 전용 수업 페이지로 이동합니다.
  if (Number(lesson.value) === 2) {
    window.location.href = "lesson-02.html";
    return;
  }
  if (currentStudent) {
    try {
      await api(`/api/students/${currentStudent.id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_no: Number(lesson.value), status: "in_progress" })
      });
      await loadChat();
    } catch {}
  }
});

document.querySelector("#save-initial").onclick = async () => {
  if (!requireLogin()) return;
  try {
    await api(`/api/students/${currentStudent.id}/judgements/initial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_no: Number(lesson.value),
        initial_judgement: document.querySelector("#initial-judgement").value.trim()
      })
    });
    memoryResult.textContent = "최초 판단을 저장했습니다. 이제 알라딘 힌트를 사용할 수 있습니다.";
  } catch (error) {
    memoryResult.textContent = error.message;
  }
};

document.querySelector("#save-evidence").onclick = async () => {
  if (!requireLogin()) return;
  try {
    await api(`/api/students/${currentStudent.id}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_no: Number(lesson.value),
        source: document.querySelector("#evidence-source").value,
        evidence_text: document.querySelector("#memory-evidence").value.trim(),
        packet_no: document.querySelector("#packet-no").value.trim(),
        filter_used: document.querySelector("#filter-used").value.trim()
      })
    });
    memoryResult.textContent = "패킷 증거를 저장했습니다.";
  } catch (error) {
    memoryResult.textContent = error.message;
  }
};

document.querySelector("#send-chat").onclick = async () => {
  if (!requireLogin()) return;
  const input = document.querySelector("#gemini-question");
  const status = document.querySelector("#chat-status");
  const message = input.value.trim();
  if (!message) {
    status.textContent = "질문을 입력하세요.";
    return;
  }
  status.textContent = "나만의 학습 챗봇이 패킷 증거를 살펴보는 중…";
  document.querySelector("#send-chat").disabled = true;
  try {
    // 로컬 파일로 열었을 때는 서버의 고정 응답 대신 질문 유형별 답변을 사용합니다.
    if (window.location.protocol === "file:") throw new Error("local-mode");
    await api(`/api/students/${currentStudent.id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_no: Number(lesson.value),
        message,
        current_mission: document.querySelector("#mission").textContent.trim()
      })
    });
    await api(`/api/students/${currentStudent.id}/chatbot/experience`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10, reason: "학생 질문과 증거 기반 대화" })
    }).catch(() => null);
    input.value = "";
    status.textContent = "답변·대화를 저장했습니다. 챗봇 경험치 +10 — 다음 질문에서 이어서 학습합니다.";
    await loadChat();
  } catch (error) {
    const key = `network-chat-${currentStudent.student_code}-${Number(lesson.value)}`;
    const logs = JSON.parse(localStorage.getItem(key) || "[]");
    let answer = offlineChatAnswer(message);
    if (!/[필터tcp속도조향브레이크주소출발지목적지왜이유]/i.test(message)) {
      const followUps = [
        "화면에서 눈에 띄는 숫자를 하나 골라 볼까요? 그 숫자가 어느 행에 있는지도 함께 적어 보세요.",
        "먼저 사실과 추측을 나누어 봐요. 화면에서 직접 확인한 값은 무엇인가요?",
        "패킷 번호와 시간을 같이 찾아보면 좋아요. 두 값이 같은 기록을 가리키는지 확인해 볼까요?"
      ];
      answer = followUps[logs.length % followUps.length];
    }
    logs.push({ question: message, answer, created_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(logs));
    input.value = "";
    status.textContent = "학생 질문과 챗봇 답변을 임시 저장했습니다. 다음 질문으로 이어가세요.";
    await loadChat();
  } finally {
    document.querySelector("#send-chat").disabled = false;
  }
};

document.querySelector("#gemini-question").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.querySelector("#send-chat").click();
  }
});

document.querySelectorAll(".question-chip").forEach(button => {
  button.onclick = () => {
    const input = document.querySelector("#gemini-question");
    input.value = button.dataset.question || "";
    input.focus();
    document.querySelector("#chat-status").textContent = "추천 질문을 불러왔습니다. 내 증거에 맞게 고쳐서 보내세요.";
  };
});

// 플로팅 챗봇을 마우스로 원하는 위치에 이동합니다.
const floatingChat = document.querySelector(".floating-chat");
const floatingChatHead = document.querySelector(".floating-chat-head");
if (floatingChat && floatingChatHead) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  floatingChatHead.addEventListener("pointerdown", event => {
    dragging = true;
    const rect = floatingChat.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    floatingChat.style.right = "auto";
    floatingChat.style.bottom = "auto";
    floatingChatHead.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  floatingChatHead.addEventListener("pointermove", event => {
    if (!dragging) return;
    const maxX = Math.max(0, window.innerWidth - floatingChat.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - floatingChat.offsetHeight);
    floatingChat.style.left = `${Math.max(0, Math.min(maxX, event.clientX - offsetX))}px`;
    floatingChat.style.top = `${Math.max(0, Math.min(maxY, event.clientY - offsetY))}px`;
  });
  const stopDragging = () => { dragging = false; };
  floatingChatHead.addEventListener("pointerup", stopDragging);
  floatingChatHead.addEventListener("pointercancel", stopDragging);
}

document.querySelector("#auto-question")?.addEventListener("click", async () => {
  const input = document.querySelector("#gemini-question");
  const status = document.querySelector("#chat-status");
  const code = document.querySelector("#login-code")?.value.trim() || currentStudent?.student_code || "30101";
  try {
    const response = await fetch("docs/chatbot-question-bank-30101-30111.json");
    const payload = await response.json();
    const questions = payload.questions.filter(item => item.student_code === code);
    if (!questions.length) throw new Error("해당 학번의 질문을 찾지 못했습니다.");
    const key = `question-index-${code}`;
    const index = Number(localStorage.getItem(key) || 0) % questions.length;
    input.value = questions[index].question;
    localStorage.setItem(key, String(index + 1));
    status.textContent = `${code} 학생 질문 ${index + 1}/100을 불러왔습니다. 확인 후 보내기를 눌러 주세요.`;
    input.focus();
  } catch (error) {
    status.textContent = `질문을 불러오지 못했습니다: ${error.message}`;
  }
});

document.querySelector("#save-final").onclick = async () => {
  if (!requireLogin()) return;
  try {
    if (Number(lesson.value) === 1) {
      const required = [
        ["#initial-judgement", "최초 판단"],
        ["#memory-evidence", "데이터 근거"],
        ["#final-judgement", "최종 판단"]
      ];
      const missing = required.find(([selector]) => !document.querySelector(selector).value.trim());
      if (missing) {
        memoryResult.textContent = `${missing[1]}을(를) 먼저 작성해 주세요.`;
        return;
      }
    }
    await api(`/api/students/${currentStudent.id}/judgements/${Number(lesson.value)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gemini_hypotheses: document.querySelector("#gemini-hypotheses").value.trim(),
        final_judgement: document.querySelector("#final-judgement").value.trim(),
        adopted_hypothesis: document.querySelector("#adopted-hypothesis").value.trim()
      })
    });
    await api(`/api/students/${currentStudent.id}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_no: Number(lesson.value), status: "completed" })
    });
    completedLessons.add(Number(lesson.value));
    recomputeUnlocks();
    applyLessonLocks();
    memoryResult.textContent = "최종 판단과 스테이지 완료를 저장했습니다.";
    render();
  } catch (error) {
    memoryResult.textContent = error.message;
  }
};

document.querySelector("#build-prompt").onclick = async () => {
  if (!requireLogin()) return;
  try {
    const data = await api(`/api/students/${currentStudent.id}/gemini-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_no: Number(lesson.value),
        current_mission: document.querySelector("#mission").textContent.trim()
      })
    });
    document.querySelector("#prompt-preview").textContent = data.prompt;
  } catch (error) {
    memoryResult.textContent = error.message;
  }
};

document.querySelector("#check-driving-data").onclick = () => {
  const row = Number(document.querySelector("#driving-row").value);
  const time = document.querySelector("#driving-time").value.trim();
  const speed = document.querySelector("#driving-speed").value.trim();
  const steering = document.querySelector("#driving-steering").value.trim();
  const judgement = document.querySelector("#driving-judgement").value.trim();
  const result = document.querySelector("#driving-check-result");
  const expected = drivingRows.find(item => item[0] === row);
  if (!expected) {
    result.textContent = "표에 있는 행 번호를 입력해 주세요.";
    return;
  }
  const errors = [];
  if (time !== expected[1]) errors.push("시간");
  if (speed !== expected[2]) errors.push("속도");
  if (steering !== expected[3]) errors.push("조향 관련 값");
  if (!judgement) errors.push("한 문장 판단");
  if (errors.length) {
    result.textContent = `${errors.join(", ")}을(를) 표에서 다시 확인해 보세요.`;
    return;
  }
  const evidence = `${row}행 확인: 시간 ${time}, 속도 ${speed}, 조향 관련 값 ${steering}`;
  document.querySelector("#memory-evidence").value = evidence;
  document.querySelector("#evidence").value = evidence;
  document.querySelector("#judgement").value = judgement;
  result.textContent = "기록이 맞습니다. 이제 최초 판단을 저장하고, 증거 저장 후 최종 판단을 작성하세요.";
};

document.querySelector("#sim-play").onclick = startSimulation;
document.querySelector("#sim-reset").onclick = () => {
  stopSimulation();
  simulationIndex = 0;
  paintSimulation();
};
document.querySelector("#simulation-source").onchange = event => {
  stopSimulation();
  const selected = simulationDatasets[event.target.value] || simulationDatasets.comma;
  simulationRows = selected.rows;
  simulationIndex = 0;
  document.querySelector("#sim-source-badge").textContent = selected.label;
  paintSimulation();
};
document.querySelector("#sim-speed").oninput = event => {
  document.querySelector("#sim-speed-label").textContent = `${event.target.value}배`;
  if (simulationTimer) {
    stopSimulation();
    startSimulation();
  }
};
document.querySelector("#sim-csv").onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    simulationRows = parseDrivingCsv(await file.text());
    simulationIndex = 0;
    stopSimulation();
    document.querySelector("#sim-source-badge").textContent = `교사 CSV · ${file.name}`;
    paintSimulation();
  } catch (error) {
    document.querySelector("#sim-source-badge").textContent = error.message;
  }
};

document.querySelectorAll(".copy-command").forEach(button => {
  button.onclick = async () => {
    const command = button.dataset.command || "";
    try {
      await navigator.clipboard.writeText(command);
      document.querySelector("#tool-copy-status").textContent = "Wireshark 필터를 클립보드에 복사했습니다. 캡처 대상은 본인 실습 장치로 제한하세요.";
    } catch {
      document.querySelector("#tool-copy-status").textContent = `복사할 필터: ${command}`;
    }
  };
});

const demoPackets = [
  { no: 1, time: "10:00:05.101", src: "192.168.4.21", dst: "192.168.4.10", protocol: "TCP", info: "8001 → SYN" },
  { no: 2, time: "10:00:05.104", src: "192.168.4.10", dst: "192.168.4.21", protocol: "TCP", info: "8001 → SYN, ACK" },
  { no: 3, time: "10:00:05.106", src: "192.168.4.21", dst: "192.168.4.10", protocol: "TCP", info: "8001 → ACK" },
  { no: 4, time: "10:00:05.118", src: "192.168.4.21", dst: "192.168.4.10", protocol: "JSON", info: "speed=20, steering=1" },
  { no: 5, time: "10:00:06.122", src: "192.168.4.21", dst: "192.168.4.10", protocol: "JSON", info: "speed=17, steering=-2" }
];
const raspberryPackets = [
  { no: 1, time: "10:00:05.101", src: "192.168.4.21", dst: "192.168.4.10", protocol: "TCP", info: "8001 → SYN (차량 연결 요청)" },
  { no: 2, time: "10:00:05.104", src: "192.168.4.10", dst: "192.168.4.21", protocol: "TCP", info: "8001 → SYN, ACK (라즈베리 파이 응답)" },
  { no: 3, time: "10:00:05.118", src: "192.168.4.21", dst: "192.168.4.10", protocol: "JSON", info: '{"speed":20,"steering":1,"distance":82}' },
  { no: 4, time: "10:00:05.420", src: "192.168.4.10", dst: "192.168.4.21", protocol: "JSON", info: '{"command":"slow","reason":"obstacle"}' },
  { no: 5, time: "10:00:06.122", src: "192.168.4.21", dst: "192.168.4.10", protocol: "JSON", info: '{"speed":17,"steering":-2,"distance":74}' }
];
let capturedPackets = [];
function updatePacketEvidenceSummary(packet) {
  const summary = document.querySelector("#packet-evidence-summary");
  if (!summary || !packet) return;
  const filter = document.querySelector("#packet-filter").value.trim() || "tcp.port == 8001";
  summary.innerHTML = `<b>증거 기록 묶음</b><span>필터: <code>${filter}</code></span><span>프레임: ${packet.no}</span><span>관찰: ${packet.protocol} · ${packet.info}</span>`;
}
function renderPackets() {
  const list = document.querySelector("#packet-list");
  if (!list) return;
  const filter = document.querySelector("#packet-filter").value.trim().toLowerCase();
  const rows = capturedPackets.filter(packet => !filter || (filter.includes("8001") && packet.info.includes("8001")) || filter.includes("tcp") && packet.protocol === "TCP" || filter.includes("json") && packet.protocol === "JSON");
  list.innerHTML = rows.length ? rows.map(packet => `<tr data-packet="${packet.no}"><td>${packet.no}</td><td>${packet.time}</td><td>${packet.src}</td><td>${packet.dst}</td><td>${packet.protocol}</td><td>${packet.info}</td></tr>`).join("") : `<tr><td colspan="6">필터에 맞는 패킷이 없습니다. 다른 필터를 사용해 보세요.</td></tr>`;
  list.querySelectorAll("tr[data-packet]").forEach(row => row.onclick = () => {
    list.querySelectorAll("tr").forEach(item => item.classList.remove("selected"));
    row.classList.add("selected");
    const packet = capturedPackets.find(item => item.no === Number(row.dataset.packet));
    document.querySelector("#packet-no").value = packet.no;
    document.querySelector("#filter-used").value = document.querySelector("#packet-filter").value.trim() || "tcp.port == 8001";
    document.querySelector("#memory-evidence").value = `프레임 ${packet.no}: ${packet.time}, ${packet.src} → ${packet.dst}, ${packet.protocol}, ${packet.info}`;
    updatePacketEvidenceSummary(packet);
    document.querySelector("#packet-selection").textContent = `프레임 ${packet.no}를 선택했습니다. 증거 기록 칸에 내용이 채워졌습니다.`;
  });
}
function beginPacketCapture() {
  const scenario = document.querySelector("#packet-scenario")?.value;
  capturedPackets = scenario === "web" ? demoPackets : raspberryPackets;
  document.querySelector("#capture-status").textContent = "캡처 중 · 5개";
  document.querySelector("#capture-start").disabled = true;
  document.querySelector("#capture-stop").disabled = false;
  renderPackets();
}
function finishPacketCapture() {
  document.querySelector("#capture-status").textContent = `캡처 완료 · ${capturedPackets.length}개`;
  document.querySelector("#capture-start").disabled = false;
  document.querySelector("#capture-stop").disabled = true;
}
const captureStart = document.querySelector("#capture-start");
const captureStop = document.querySelector("#capture-stop");
const filterApply = document.querySelector("#packet-filter-apply");
if (captureStart) captureStart.onclick = beginPacketCapture;
if (captureStop) captureStop.onclick = finishPacketCapture;
if (filterApply) filterApply.onclick = renderPackets;
const packetFilter = document.querySelector("#packet-filter");
if (packetFilter) packetFilter.addEventListener("keydown", event => { if (event.key === "Enter") renderPackets(); });
document.querySelector("#packet-scenario")?.addEventListener("change", () => {
  capturedPackets = [];
  document.querySelector("#capture-status").textContent = "대기 중";
  document.querySelector("#packet-list").innerHTML = '<tr><td colspan="6">캡처 시작을 눌러 패킷을 확인하세요.</td></tr>';
});

const flowMessages = {
  1: "1단계: 브라우저가 서버 URL 요청을 만들었습니다. 다음으로 TCP 연결을 확인해 보세요.",
  2: "2단계: TCP 연결을 관찰합니다. SYN·SYN/ACK·ACK 패킷을 찾도록 필터를 준비했습니다.",
  3: "3단계: 데이터 전송을 관찰합니다. HTTP/JSON 데이터 패킷을 찾아보세요.",
  4: "4단계: Wireshark 관찰 단계입니다. 아래 캡처를 시작하고 프레임을 선택하세요."
};
document.querySelectorAll(".flow-action").forEach(card => {
  const activateFlowStep = () => {
    const step = Number(card.dataset.flowStep);
    document.querySelectorAll(".flow-action").forEach(item => item.classList.remove("flow-active"));
    card.classList.add("flow-active");
    const status = document.querySelector("#tool-copy-status");
    if (status) status.textContent = flowMessages[step];
    const filter = document.querySelector("#packet-filter");
    if (filter && step === 2) filter.value = "tcp.port == 8001";
    if (filter && step === 3) filter.value = "json";
    if (step === 4) {
      const simulator = document.querySelector("#packet-simulator");
      if (simulator) simulator.scrollIntoView({ behavior: "smooth", block: "center" });
      beginPacketCapture();
    }
  };
  card.addEventListener("click", activateFlowStep);
  card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activateFlowStep(); } });
});

// 동적 페이지/브라우저 캐시 상황에서도 버튼이 동작하도록 위임 이벤트를 함께 둡니다.
document.addEventListener("click", event => {
  const target = event.target.closest?.("#capture-start, #capture-stop, #packet-filter-apply");
  if (target?.id === "capture-start") beginPacketCapture();
  if (target?.id === "capture-stop") finishPacketCapture();
  if (target?.id === "packet-filter-apply") renderPackets();
});

async function initStudentWeb() {
  showStudent();
  await loadStudentProgress();
  await loadChat();
  render();
  paintSimulation();
  startRaceBoard();
}

initStudentWeb();

