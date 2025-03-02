import logging
from server.main import app
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Starting FastAPI application on port 5001...")
    uvicorn.run("server.main:app", host="0.0.0.0", port=5001, reload=True, log_level="info")
    logger.info("FastAPI application stopped")