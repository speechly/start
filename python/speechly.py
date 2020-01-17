import datetime
import json
import os
import uuid

import grpc

from speechly_pb2 import LoginRequest, WLURequest
from speechly_pb2_grpc import IdentityStub, WLUStub


KEY_FILE = '.speechly_token'

class Speechly:
    def __init__(self, app_id: str):
        channel = grpc.secure_channel("api.speechly.com", grpc.ssl_channel_credentials())
        self.identity_stub = IdentityStub(channel)
        self.wlu_stub = WLUStub(channel)
        self.metadata = []
        self._login(app_id)

    def _login(self, app_id:str):
        keys = {}
        if os.path.exists(KEY_FILE):
            with open(KEY_FILE, 'r') as fp:
                keys = json.load(fp)
        if keys.get('issued') is None:
            keys['appId'] = app_id
            if keys.get('deviceId') is None:
                keys['deviceId'] = str(uuid.uuid4())
            login_request = LoginRequest(device_id=keys['deviceId'], app_id=keys['appId'])
            response = self.identity_stub.Login(login_request)
            if not response.token:
                raise Exception('No token in response')
            keys['token'] = response.token
            keys['issued'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            with open(KEY_FILE, 'w') as fp:
                json.dump(keys, fp)
        self.metadata = [('authorization', 'Bearer ' + keys['token'])]

    def wlu(self, text: str, language_code: str = 'en-US'):
        request = WLURequest(language_code=language_code, text=text)
        return self.wlu_stub.Text(request, metadata=self.metadata)
