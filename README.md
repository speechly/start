# Getting Started with Speechly

This repository features a simple node command line client for calling the [Speechly](https://www.speechly.com/) API. 

## Prerequisites

To run the client you'll need an application id. To get an application id apply to our beta program by sending an email to [appid@speechly.com](mailto:appid@speechly.com). There are limited seats!

You will also need to have Node (version >= 12) and sox installed. 

For Mac OS

    brew install sox node

For most linux disto's

    sudo apt-get install nodejs sox libsox-fmt-all

Now you can install the client with: 
    
    git clone https://github.com/speechly/start.git
    cd client
    npm install 

## Running the client

For written language understanding run:

    node text.js

For spoken language understanding run:

    node audio.js

By using the `--raw` flag you'll see the output in raw format. When you run the clients for the first time you will be prompted for your application id.   

## Next steps

The Speechly API is defined using protocol buffers (see [speechly.proto](speechly.proto)). If you want to write your own client (using your favourite programming language) you can check out this [link](https://developers.google.com/protocol-buffers/) for more information on protocol buffers.

You can read more about Speechly at [our website](https://www.speechly.com/).

Happy hacking!
