# TShark 실습

`tshark -D`로 인터페이스 번호를 먼저 확인합니다. 캡처 필터(`-f`)는 저장할 패킷을 좁히고, 표시 필터(`-Y`)는 이미 캡처한 패킷을 분석합니다.

```powershell
tshark -i 1 -f "tcp port 9000" -a duration:15 -w evidence.pcapng
tshark -r evidence.pcapng -Y "tcp.flags.syn == 1" -T fields -e frame.number -e ip.src -e tcp.srcport -e ip.dst -e tcp.dstport -e tcp.flags
tshark -r evidence.pcapng -Y "udp.port == 9001" -T fields -e frame.time_relative -e ip.src -e udp.srcport -e ip.dst -e udp.dstport -e data.data
```

개인정보가 포함된 pcap 파일은 저장소에 커밋하지 않습니다.
