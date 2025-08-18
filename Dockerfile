FROM python:3.13-bullseye

WORKDIR /app

# Copy dependencies file first
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir --no-deps -r requirements.txt

# Copy all your code
COPY . .

# Expose port
EXPOSE 5000

# Command to run
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]

COPY db.sqlite .

ENV PIP_NO_BUILD_ISOLATION=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_DEFAULT_TIMEOUT=100
RUN pip install --no-cache-dir -r requirements.txt
