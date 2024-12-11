import os
from dotenv import load_dotenv
load_dotenv()

# Import the application factory function
from api_project import create_app

# Create an instance of the Flask app
app = create_app()

# main guard
if __name__ == "__main__":
    import uvicorn
    
    # Get port from Heroku environment, or use default
    port = int(os.environ.get("PORT", 2000))
    
    uvicorn.run(
        app, 
        host='0.0.0.0', 
        port=port,
        # Optional: add these for better logging and reload behavior
        log_level="info",
        reload=False  # Set to True for development, False for production
    )
