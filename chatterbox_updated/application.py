import os
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
#app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# list of all channels
messages = {
    'general' : []
}

@app.route("/")
def index():
    return render_template("index.html", messages = messages)

@socketio.on("add channel")
def add_channel(channel_name):
    if channel_name['channel_name'] in messages:
        socketio.emit("error", "Channel name already exists")
    else:
        messages[channel_name['channel_name']] = []
        emit("announce channel", channel_name['channel_name'], broadcast=True)   

@socketio.on("new message")
def message(data):
    if data['channel'] not in messages:
        socketio.emit("error", "Channel name does not exist")
    else:
        if len(messages[data['channel']]) <= 100:
            messages[data['channel']].append({"author": data['author'], "message": data['message'], "timestamp": data['timestamp']})
            emit("load message", data, broadcast=True) 
        else:
            socketio.emit("error", "Not Allowed, Limit of 100 messages reached.")


@socketio.on("delete message")
def message(data):
    if data['channel'] not in messages:
        socketio.emit("error", "Channel name does not exist")
    else:
        el = {"author": data['author'], "message": data['message'], "timestamp": data['timestamp']}
        if el in messages[data['channel']]:
            messages[data['channel']].remove(el)
        emit("refresh messages", data, broadcast=True)                   

if __name__ == "__main__":
    socketio.run(app, debug=True)
