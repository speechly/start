<h1 align="center">
<a href="https://www.speechly.com/?utm_source=github&utm_medium=start&utm_campaign=header"><img src="https://www.speechly.com/images/logo.png" height="100" alt="Speechly"></a>
</h1>
<h2 align="center">
Complete your touch user interface with voice
</h2>

[Speechly website](https://www.speechly.com/?utm_source=github&utm_medium=start&utm_campaign=header)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[Docs](https://www.speechly.com/docs/?utm_source=github&utm_medium=start&utm_campaign=header)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[Blog](https://www.speechly.com/blog/?utm_source=github&utm_medium=start&utm_campaign=header)

# Getting Started with Speechly

This repository features a simple node command line client for calling the [Speechly](https://www.speechly.com/?utm_source=github&utm_medium=start&utm_campaign=text) API. You can follow our [Quick Start](https://www.speechly.com/docs/quick-start/?utm_source=github&utm_medium=start&utm_campaign=text) guide to get started with Speechly.

## About Speechly

Speechly is a developer tool for building real-time multimodal voice user interfaces. It enables developers and designers to enhance their current touch user interface with voice functionalities for better user experience. Speechly key features:

#### Speechly key features

- Fully streaming API
- Multi modal from the ground up
- Easy to configure for any use case
- Fast to integrate to any touch screen application
- Supports natural corrections such as "Show me red – i mean blue t-shirts"
- Real time visual feedback encourages users to go on with their voice

| Example application | Description |
| :---: | --- |
| <img src="https://i.imgur.com/v9o1JHf.gif" width=50%> | Instead of using buttons, input fields and dropdowns, Speechly enables users to interact with the application by using voice. <br />User gets real-time visual feedback on the form as they speak and are encouraged to go on. If there's an error, the user can either correct it by using traditional touch user interface or by voice. |

## Prerequisites

To run the client you'll need an application id. To get an application id apply to our beta program by sending an email to [appid@speechly.com](mailto:appid@speechly.com). There are limited seats!

You will also need to have Node (version >= 12) and sox installed. 

For Mac OS

    brew install sox node

For most linux disto's

    sudo apt-get install nodejs sox libsox-fmt-all

Now you can install the client with: 
    
    git clone https://github.com/speechly/start.git
    cd start/client
    npm install 

## Running the client

For written language understanding run:

    node text.js

For spoken language understanding run:

    node audio.js

By using the `--raw` flag you'll see the output in raw format. When you run the clients for the first time you will be prompted for your application id.   

## Next steps

The Speechly API is defined using protocol buffers (see [speechly.proto](speechly.proto)). If you want to write your own client (using your favourite programming language) you can check out this [link](https://developers.google.com/protocol-buffers/) for more information on protocol buffers.

You can read more about Speechly at [our website](https://www.speechly.com/?utm_source=github&utm_medium=start&utm_campaign=text).

Happy hacking!
