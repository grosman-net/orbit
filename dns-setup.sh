#!/bin/bash

# Configure local DNS for orbit.local
sudo bash -c 'echo "127.0.0.1 orbit.local" >> /etc/hosts'

# Restart networking services
sudo systemctl restart networking
