FROM amazonlinux:latest

RUN yum -y install zip
RUN yum -y install nodejs22

COPY . /tmp/working
ENTRYPOINT ["/bin/bash"]