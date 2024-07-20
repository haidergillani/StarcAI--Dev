# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Import the application factory function
from api_project import create_app

# Create an instance of the Flask app
app = create_app()

# main guard
# port and host changed for deployment purposes
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=2000)
