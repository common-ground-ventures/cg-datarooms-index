#!/usr/bin/env python3
"""Compare two hosts path by path: status, redirect target (host-stripped),
content sha1, and the headers that matter. No redirects are followed.
Usage: http_parity.py <base_a> <base_b> <paths_file>
A line may start with a method ("HEAD /x"). Exits 1 if any path differs."""
import hashlib, http.client, sys, urllib.parse

KEYS = ('content-type', 'x-robots-tag', 'cache-control', 'x-frame-options')

def fetch(base, path, method='GET'):
    u = urllib.parse.urlsplit(base)
    C = http.client.HTTPSConnection if u.scheme == 'https' else http.client.HTTPConnection
    c = C(u.netloc, timeout=20)
    c.request(method, path, headers={'User-Agent': 'cg-migration-parity/1'})
    r = c.getresponse()
    body = r.read()
    h = {k.lower(): v for k, v in r.getheaders()}
    loc = h.get('location', '')
    if loc.startswith('http'):
        loc = urllib.parse.urlsplit(loc)._replace(scheme='', netloc='').geturl()
    return {'status': r.status, 'location': loc,
            'sha1': hashlib.sha1(body).hexdigest()[:12] if r.status == 200 else '-',
            **{k: h.get(k, '').split(';')[0].strip() if k == 'content-type' else h.get(k, '') for k in KEYS}}

a, b, pf = sys.argv[1:4]
paths = [p.strip() for p in open(pf) if p.strip() and not p.startswith('#')]
bad = 0
for p in paths:
    method, _, rest = p.partition(' ')
    m, path = (method, rest) if rest else ('GET', p)
    ra, rb = fetch(a, path, m), fetch(b, path, m)
    diffs = [k for k in ra if ra[k] != rb[k]]
    if diffs:
        bad += 1
        print('DIFF', p, {k: (ra[k], rb[k]) for k in diffs})
    else:
        print('ok  ', p, ra['status'], ra['location'] or ra['sha1'])
print(f'{len(paths) - bad} of {len(paths)} paths identical')
sys.exit(1 if bad else 0)
