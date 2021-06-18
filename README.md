# dippr
Dippr is an open-source livestreaming service.

The entire site spans across 3 repositories: **Backend** - [Streaming](https://github.com/dippr/dippr_streaming) - [Client](https://github.com/dippr/dippr_client)

# dippr_backend
The backend server handles basic user operations and the creation of stream instances (the actual video streaming happens on the streaming server).

## Running
Create an `.env` file in the root directory based off of the `.env.example` file.

```bash
$ git clone https://github.com/dippr/dippr_backend
$ cd dippr_backend
$ npm i
$ npm test
```