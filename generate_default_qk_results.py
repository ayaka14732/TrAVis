import struct

from main import run

def flatten4d(xssss):
    return [x for xsss in xssss for xss in xsss for xs in xss for x in xs]

s = 'A wealthy white-collar worker from Costa Rica working in our marketing agency has set up a marine conservation centre.'
qk_results, tokens = run(s)
qk_results = flatten4d(qk_results)
b = struct.pack(f'<{len(qk_results)}f', *qk_results)

with open('default_qk_results.dat', 'wb') as f:
    f.write(b)

print(len(tokens), tokens)
