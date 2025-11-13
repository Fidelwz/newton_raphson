from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)# Enable CORS for all routes
@app.route('/')
def home():
    return "Welcome to the Newton-Raphson Method Server!"

@app.route('/api/users')
def get_users():
    return {"users": [
        {"id": 1, "first_name": "Alice", "last_name": "Smith"},
        {"id": 2, "first_name": "Bob", "last_name": "Johnson"},
        {"id": 3, "first_name": "Charlie", "last_name": "Brown"}
    ]}

if __name__ == '__main__':
    app.run(debug=True) 