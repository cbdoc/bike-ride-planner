#!/usr/bin/env python3
import os
import subprocess
import sys

# Get port from environment, default to 8080
port = os.environ.get('PORT', '8080')

# Run gunicorn with the port
cmd = ['gunicorn', 'run:app', '--bind', f'0.0.0.0:{port}', '--workers', '1']
print(f"Starting: {' '.join(cmd)}")
subprocess.run(cmd)