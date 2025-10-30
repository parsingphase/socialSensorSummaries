# Build

Because `canvas` has to be installed on Linux, we need to build on a Docker image:

    docker build -t local-nodejs-linux -f Dockerfile-build-lambda-amazon-linux .
    docker run --mount type=bind,src=/Users/phase/.aws,dst=/root/.aws -w /tmp/working -it local-nodejs-linux
    
    # npm i -D
    # npm run lambda:deploy:dev