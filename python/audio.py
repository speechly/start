import os
import wave
import uuid

import grpc

from speechly_pb2 import SLURequest, SLUConfig, SLUEvent, LoginRequest
from speechly_pb2_grpc import IdentityStub as IdentityService
from speechly_pb2_grpc import SLUStub as SLUService

chunk_size = 8000

if 'APP_ID' not in os.environ:
    raise RuntimeError('APP_ID environment variable needs to be set')


def audio_iterator():
    yield SLURequest(config=SLUConfig(channels=1, sample_rate_hertz=16000))
    yield SLURequest(event=SLUEvent(event='START'))
    with wave.open('output.wav', mode='r') as audio_file:
        audio_bytes = audio_file.readframes(chunk_size)
        while audio_bytes:
            yield SLURequest(audio=audio_bytes)
            audio_bytes = audio_file.readframes(chunk_size)
    yield SLURequest(event=SLUEvent(event='STOP'))

print(os.environ['APP_ID'])
with grpc.secure_channel('api.speechly.com', grpc.ssl_channel_credentials()) as channel:
    token = IdentityService(channel) \
        .Login(LoginRequest(device_id=str(uuid.uuid4()), app_id=os.environ['APP_ID'])) \
        .token

with grpc.secure_channel('api.speechly.com', grpc.ssl_channel_credentials()) as channel:
    slu = SLUService(channel)
    responses = slu.Stream(
        audio_iterator(),
        None,
        [('authorization', 'Bearer {}'.format(token))])
    for response in responses:
        print(response)
