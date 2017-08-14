#!/bin/bash

gcloud beta emulators datastore start --no-legacy --project=fortune-datastore-unit-tests --host-port 127.0.0.1:8888 --consistency 1.0 --no-store-on-disk & \
  node test &>/dev/null && \
  npm run test