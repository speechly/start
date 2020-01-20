# Python client example

## Prepare requirements

If using `pipenv`:

	PIPENV_VENV_IN_PROJECT=1 pipenv install

with pip:

	pip install -r requirements.txt

## Generate protobuf stubs

    python -m grpc_tools.protoc --python_out=. --grpc_python_out=. --proto_path=.. speechly.proto

### Run batch of utterances through API

    cat phrases.txt|python text_batch.py [YOUR_APP_ID_HERE] > out.jsonl