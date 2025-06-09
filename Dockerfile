FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Collect static files (optional if using whitenoise or deploying to cloud)
# RUN python manage.py collectstatic --noinput

RUN python manage.py migrate

# Command to run
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
