#!/bin/bash

npm run jenkins-start-process-engine &

node node_modules/webdriver-manager update
node node_modules/webdriver-manager start &

npm start -- --port=9000 &

npm run jenkins-run-end-to-end-tests
