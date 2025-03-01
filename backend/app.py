from flask import Flask, request, jsonify
from call import call_bp
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv() 

# call blueprints
app.register_blueprint(call_bp, url_prefix='/call')


@app.route('/')
def index():
    # return dummy json response
    return jsonify({"message": "Hello, World!"})


if __name__ == '__main__':
    app.run(debug=True)