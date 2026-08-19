import socket

HOST, PORT = "127.0.0.1", 9000
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen()
    print(f"TCP server listening on {HOST}:{PORT}")
    connection, address = server.accept()
    with connection:
        data = connection.recv(1024)
        print(f"received from {address}: {data.decode('utf-8')}")
        connection.sendall(b"ACK:light=on")
