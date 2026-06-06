FROM buanet/iobroker:latest

# Copy the adapter source code into a temporary folder in the container
COPY . /opt/iobroker.ecovacs-deebot

# Copy the initialization script to /opt/userscripts/ so it runs on first start
COPY .docker/userscripts/userscript_firststart.sh /opt/userscripts/userscript_firststart.sh
RUN chmod +x /opt/userscripts/userscript_firststart.sh
