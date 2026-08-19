import socket

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as receiver:
    receiver.bind(("127.0.0.1", 9001))
    print("UDP receiver listening on 127.0.0.1:9001")
    data, address = receiver.recvfrom(1024)
    print(f"{address}: {data.decode('utf-8')}")
