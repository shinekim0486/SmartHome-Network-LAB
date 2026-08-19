import socket

message = b"sensor:temperature=23.5"
with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sender:
    sender.sendto(message, ("127.0.0.1", 9001))
print(f"sent: {message.decode('utf-8')}")
