#!/bin/bash

npm run jenkins-start-process-engine &

node node_modules/webdriver-manager update
node node_modules/webdriver-manager start &

npm start -- --port=9000 &

# Wait for required resources to be up and running.
while ! curl --silent localhost:8000 > /dev/null; do sleep 1; done
while ! curl --silent localhost:4444 > /dev/null; do sleep 1; done
while ! curl --silent localhost:9000 > /dev/null; do sleep 1; done

npm run jenkins-run-end-to-end-tests
