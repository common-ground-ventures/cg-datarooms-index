"""Run another script with one hostname pinned to an IP, so a check hits the new edge even while local DNS caches the old record.
Usage: pinned_parity.py <host> <ip> <script> [args...]"""
import socket, sys, runpy
host, ip = sys.argv[1], sys.argv[2]
_orig = socket.getaddrinfo
def gai(h, *a, **k):
    return _orig(ip if h == host else h, *a, **k)
socket.getaddrinfo = gai
sys.argv = [sys.argv[3]] + sys.argv[4:]
runpy.run_path(sys.argv[0], run_name='__main__')
