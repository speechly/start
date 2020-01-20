import fileinput
import json
import time
import sys

from speechly import Speechly

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

        transcript = ' '.join([event.transcript.word for event in nlu.responses if event.HasField('transcript')])
        intent = ' '.join([event.intent.intent for event in nlu.responses if event.HasField('intent')])
        entities = [
            {
                "entity": event.entity.entity,
                "value": event.entity.value,
                "start_position":event.entity.start_position,
                "end_position":event.entity.end_position
            }
            for event in nlu.responses if event.HasField('entity')]
        print(json.dumps({
            "phrase": text,
            "transcript": transcript,
            "intent":intent,
            "entities":entities,
            "response_time_ms": (ended - started)*1000
        }))

