import fileinput
import json
import time
import sys

from speechly import Speechly

def align(s1, s2):
    D = {}
    T = {}
    x = s1.lower().split(' ')
    y = s2.lower().split(' ')
    for i in range(len(x)):
        D[i,0] = i
        T[i,0] = (i-1,0)
    for j in range(len(y)):
        D[0,j] = j
        T[0,j] = (0, j-1)
    T[0,0] = (0,0)
    for i in range(1, len(x)):
        for j in range(1, len(y)):
            cost = 2 if x[i] != y[j] else 0
            value, op = min((D[i-1,j] + 1, (i-1,j)), (D[i, j-1] + 1, (i,j-1)), (D[i-1, j-1] + cost, (i-1, j-1)))
            D[i,j] = value
            T[i,j] = op
    alignment = {}
    i, j = len(x)-1, len(y)-1
    while i > 0 or j > 0:
        inext, jnext = T[i,j]
        if inext == i-1 and jnext == j-1:
            alignment[y[j]] = i
        elif inext == i and jnext == j-1:
            alignment[y[j]] = i+1
        i = inext
        j = jnext
    alignment[y[j]] = i
    return alignment

def get_span(alignment, text):
    i = [alignment[w] for w in text.lower().split(' ')]
    return [min(i), max(i)+1]

if __name__ == '__main__':

    if len(sys.argv) == 1:
        print('Give app_id as parameter')
        sys.exit(1)
    speechly = Speechly(sys.argv[1])

    for line in fileinput.input(files=['-']):
        text = line.strip()
        started = time.time()
        nlu = speechly.wlu(text)
        ended = time.time()
        for segment in nlu.segments:
            alignment = align(text, segment.text)
            entities = [
                {
                    "entity": entity.entity,
                    "value": entity.value,
                    "start_position": entity.start_position,
                    "end_position": entity.end_position,
                    "span": get_span(alignment, entity.value)
                }
                for entity in segment.entities]
            print(json.dumps({
                "phrase": text,
                "transcript": segment.text,
                "intent":segment.intent.intent,
                "entities":entities,
                "response_time_ms": (ended - started)*1000
            }))
