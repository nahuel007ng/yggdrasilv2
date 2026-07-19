from app.services.wol import build_magic_packet


def test_build_magic_packet():
    packet = build_magic_packet("AA:BB:CC:DD:EE:FF")
    assert packet[:6] == b"\xff" * 6
    assert packet[6:12] == bytes.fromhex("AABBCCDDEEFF")
    assert len(packet) == 102


def test_build_magic_packet_acepta_guiones():
    packet_dos_puntos = build_magic_packet("AA:BB:CC:DD:EE:FF")
    packet_guiones = build_magic_packet("AA-BB-CC-DD-EE-FF")
    assert packet_dos_puntos == packet_guiones


def test_build_magic_packet_mac_invalida():
    import pytest
    with pytest.raises(ValueError):
        build_magic_packet("no-es-una-mac")
