from flask import Flask
from flask_cors import CORS, cross_origin
from flask.helpers import send_from_directory

app = Flask(__name__, static_folder='client-react/dist', static_url_path='')
CORS(app)# Enable CORS for all routes
@app.route('/')
@cross_origin()
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/users')
def get_users():
    return {"users": [
        {"id": 1, "first_name": "Alice", "last_name": "Smith"},
        {"id": 2, "first_name": "Bob", "last_name": "Johnson"},
        {"id": 3, "first_name": "Charlie", "last_name": "Brown"}
    ]}


if __name__ == '__main__':
    app.run(debug=True) 