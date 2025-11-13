from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)# Enable CORS for all routes
@app.route('/')
def home():
    return "Welcome to the Newton-Raphson Method Server!"

@app.route('/api/users')
def get_users():
    return {"users": ["Alice", "Bob", "Charlie"]}

if __name__ == '__main__':
    app.run(debug=True) 