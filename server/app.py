from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify(message="Hello from Flask!")

@app.route('/api/data', methods=['POST'])
def receive_data():
    data = request.json
    # Process the data
    return jsonify(success=True, received=data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)