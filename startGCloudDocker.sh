#!/bin/bash

docker run -p 8888:8888 --name gccloud-datastore-emulator -v $(pwd)/docker-tmp:/root/.config google/cloud-sdk:159.0.0 gcloud beta emulators datastore start --no-legacy --project=fortune-datastore-unit-tests --host-port 127.0.0.1:8888 --consistency 1.0 --no-store-on-disk