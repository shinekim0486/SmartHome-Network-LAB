import socket

with socket.create_connection(("127.0.0.1", 9000), timeout=5) as client:
    client.sendall(b"CMD:light=on")
    print(client.recv(1024).decode("utf-8"))
