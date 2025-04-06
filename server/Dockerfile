FROM python:3.12-slim

# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /server

# Install the application dependencies.
COPY pyproject.toml uv.lock* ./

RUN uv sync --frozen --no-cache --no-dev

# Copy the rest of your application code.
COPY . .

RUN mkdir -p logs && touch logs/app.log && chmod -R 775 logs/app.log

EXPOSE 8000

# Make entrypoint script executable
RUN chmod +x /server/entrypoint.sh

# (Optional) Uncomment below to switch to a non-root user for enhanced security.
# RUN useradd -m appuser
# USER appuser

# Run both migrations and the application using the entrypoint script
CMD ["/server/entrypoint.sh"]
