# Simple Speechgrinder Client in Python

This is a simple python client that
 
 1. reads the `../audio.wav` (provided in this repo),
 2. streams the audio file to the Speechgrinder API,
 3. prints the API response to the console.   

## Requirements 
    
* Python >= 3.5 with [grpcio-tools](https://pypi.org/project/grpcio-tools/) installed. 
    
## Running

    APP_ID=<your appid> python simple.py 