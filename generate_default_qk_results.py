import struct

from main import run

def flatten(xs):
    def inner():
        for x in xs:
            if not isinstance(x, list):
                yield x
            else:
                yield from flatten(x)
    return list(inner())

s = 'A wealthy white-collar worker from Costa Rica working in our marketing agency has set up a marine conservation centre.'
qk_results, tokens = run(s)
qk_results = flatten(qk_results)
len_qk_results = len(qk_results)
b = struct.pack(f'<{len_qk_results}f', *qk_results)

with open('default_qk_results.dat', 'wb') as f:
    f.write(b)

print(len(tokens), tokens)
