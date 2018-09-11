# This docker image is used as part of our ci pipeline. It is used to run
# end-to-end tests inside a docker container on our jenkins instance.
#
# The docker image will contain the following components:
#   1. Node 8
#   2. Java Runtime Environment 8
#   3. Google Chrome
#   4. Seleniums Driver for Google Chrome
#


# Define NodeJS docker image.
# Here we use alpine as distribution
ARG NODE_IMAGE_VERSION=8-stretch


# Create base image
FROM node:${NODE_IMAGE_VERSION} as base
RUN set -ex && \
    echo 'deb http://deb.debian.org/debian jessie-backports main' \
    > /etc/apt/sources.list.d/stretch-backports.list && \
    apt-get update -y && \
    apt-get install -y unzip zip apt-utils

FROM base as java
RUN set -ex && \
    apt-get install --target-release jessie-backports \
    openjdk-8-jre-headless \
    ca-certificates-java \
    --assume-yes

FROM java as chrome
ARG CHROME_VERSION="google-chrome-stable"
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update -qqy \
  && apt-get -qqy install \
    ${CHROME_VERSION:-google-chrome-stable} \
  && rm /etc/apt/sources.list.d/google-chrome.list \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

ARG CHROME_DRIVER_VERSION="latest"
RUN CD_VERSION=$(if [ ${CHROME_DRIVER_VERSION:-latest} = "latest" ]; then echo $(wget -qO- https://chromedriver.storage.googleapis.com/LATEST_RELEASE); else echo $CHROME_DRIVER_VERSION; fi) \
  && echo "Using chromedriver version: "$CD_VERSION \
  && wget --no-verbose -O /tmp/chromedriver_linux64.zip https://chromedriver.storage.googleapis.com/$CD_VERSION/chromedriver_linux64.zip \
  && rm -rf /opt/selenium/chromedriver \
  && unzip /tmp/chromedriver_linux64.zip -d /opt/selenium \
  && rm /tmp/chromedriver_linux64.zip \
  && mv /opt/selenium/chromedriver /opt/selenium/chromedriver-$CD_VERSION \
  && chmod 755 /opt/selenium/chromedriver-$CD_VERSION \
  && ln -fs /opt/selenium/chromedriver-$CD_VERSION /usr/bin/chromedriver

# Copy files
FROM chrome as app

COPY test/jenkins_e2e.sh /jenkins_e2e.sh 
RUN chmod 777 /jenkins_e2e.sh 

ENTRYPOINT [ "/bin/bash" ]

CMD [ "/jenkins_e2e.sh"]
