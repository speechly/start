import os
import wave

import grpc

from sg_pb2 import SluRequest, SluConfig, SluEvent, LoginRequest
from sg_pb2_grpc import IdentityStub as IdentityService
from sg_pb2_grpc import SluStub as SLUService

chunk_size = 8000

if 'APP_ID' not in os.environ:
    raise RuntimeError('APP_ID environment variable needs to be set')

def audio_iterator():
    with wave.open('../audio.wav', mode='r') as audio_file:
        if audio_file.getnchannels() > 1:
            raise RuntimeError('Only mono channel audio is supported')
        yield SluRequest(config=SluConfig(channels=1, sample_rate_hertz=audio_file.getframerate()))
        yield SluRequest(event=SluEvent(event='START'))
        audio_bytes = audio_file.readframes(chunk_size)
        while audio_bytes:
            yield SluRequest(audio=audio_bytes)
            audio_bytes = audio_file.readframes(chunk_size)
    yield SluRequest(event=SluEvent(event='STOP'))


with grpc.secure_channel('api.speechgrinder.com', grpc.ssl_channel_credentials()) as channel:
    token = IdentityService(channel)\
        .Login(LoginRequest(device_id='python-simple-test', app_id=os.environ['APP_ID']))\
        .token

with grpc.secure_channel('api.speechgrinder.com', grpc.ssl_channel_credentials()) as channel:
    slu = SLUService(channel)
    responses = slu.Stream(
        audio_iterator(),
        None,
        [('authorization', 'Bearer {}'.format(token))])
    for response in responses:
        print(response)
