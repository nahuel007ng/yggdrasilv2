import socket


def build_magic_packet(mac_address: str) -> bytes:
    mac = mac_address.replace(":", "").replace("-", "")
    if len(mac) != 12:
        raise ValueError(f"MAC address invalida: {mac_address}")
    try:
        mac_bytes = bytes.fromhex(mac)
    except ValueError as e:
        raise ValueError(f"MAC address invalida: {mac_address}") from e
    return b"\xff" * 6 + mac_bytes * 16


def send_magic_packet(mac_address: str, broadcast_ip: str = "255.255.255.255", port: int = 9) -> None:
    packet = build_magic_packet(mac_address)
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.sendto(packet, (broadcast_ip, port))
