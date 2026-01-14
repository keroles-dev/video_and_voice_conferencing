# Simple Node JS video conferencing App

> [Live demo](https://ec2-16-16-58-75.eu-north-1.compute.amazonaws.com/)

## Techs:

- Websockets
- Native WebRTC
- Typescript
- Quasar
- Docker

## Features:

- Dynamic Multi-WebRTC Connections

## Usage:

> On Linux, you can install `v4l2loopback` to create multiple virtual devices, enabling testing of multiple Simultaneous connections.<br/>
> For Arch Linux, see [v4l2loopback](https://wiki.archlinux.org/title/V4l2loopback)

### Backend setup

#### With docker

1- build image
```console
docker build -t $(image_name) .
```
2- run container
```console
docker run --name $(container_name) -d -p 3000:3000 $(image_name)
```

#### Without docker

1- install dependencies
```console
npm i
```
2- build
```console
npm run build
```
3- run server
```console
npm run up
```

### Frontend setup

1- go to `client` folder
```console
cd client
```
2- install dependencies
```console
npm i
```
3- run quasar dev server
```console
npm run dev
```