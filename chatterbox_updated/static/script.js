String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}

let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

let current_channel = '';
let current_view = 'name';

let addChannelClick = (channel) => {
	channel.addEventListener('click', () => {
		document.querySelector('.heading').innerHTML = channel.innerHTML
		current_channel = channel.innerHTML
		document.querySelectorAll('.channel').forEach( (ch) => {
			ch.classList.add('d-none');
			document.querySelector('.messages .'+ch.innerHTML).classList.add('d-none');
		});
		document.querySelector('.messages .'+channel.innerHTML).classList.remove('d-none')
		document.querySelector('.channelFormRow').classList.add('d-none');
		document.querySelector('.messageFormRow').classList.remove('d-none');
		document.querySelector('.messages').classList.remove('d-none');
		document.querySelector('.'+channel.innerHTML).classList.remove('d-none');	
		current_view = 'chat'
		localStorage.setItem("channel", channel.innerHTML)			
	});
}

let switchToChannels = func => {
	document.querySelector('.nameHeading').innerHTML = 'Hi '+ localStorage.getItem("name");
	document.querySelector('.heading').innerHTML = 'Select channel';
	document.querySelector('#nameForm').classList.add('d-none');
	document.querySelector('.chatrooms').classList.remove('d-none');
	document.querySelector('.channelFormRow').classList.remove('d-none');
	current_view = 'channels'
}

let switchToChat = func => {
	let ch = document.querySelector('.channel[data-channel=' + localStorage.getItem("channel") + ']')
	if(ch != null){
		ch.click();
		current_view = 'chat';
	} else {
		localStorage.setItem("channel", '');
	}
}

let handleClose = (cl) => {    
	let data = {'message': cl.getAttribute('data-message'),
			'author': cl.getAttribute('data-author'),
			'channel': cl.getAttribute('data-channel'),
			'timestamp': cl.getAttribute('data-timestamp')
	   	};		
    socket.emit('delete message', data);
}

document.addEventListener('DOMContentLoaded', () => {
	socket.on('connect', () => {
		if(localStorage.getItem("name") !== null && localStorage.getItem("name") !== "") {
			switchToChannels();
		}

		document.querySelectorAll('.channel').forEach( (channel) =>  {
			addChannelClick(channel);
		});

		if(localStorage.getItem("channel") !== null && localStorage.getItem("channel") !== ""){
			switchToChat();
		}	

		document.querySelector('.back').addEventListener('click', () => {
			document.querySelector('.heading').innerHTML = 'Select channel';
			document.querySelector('.channelFormRow').classList.remove('d-none');
			document.querySelector('.chatrooms').classList.remove('d-none');
			document.querySelector('.messages').classList.add('d-none');
			document.querySelector('.messageFormRow').classList.add('d-none');
			document.querySelectorAll('.channel').forEach( (channel) => {
				document.querySelectorAll('.messages>div').forEach( (messages) => {
					if(!messages.classList.contains('d-none')){
						messages.classList.add('d-none');
					}
				})
				if(channel.classList.contains('d-none')){
					channel.classList.remove('d-none');
				}
			})
			current_view = 'channels'
			localStorage.setItem("channel", '')
		})

		document.querySelectorAll('.message').forEach( (message) => {
			if(message.getAttribute('data-author') == localStorage.getItem("name")){
				message.classList.add("self");
				let icon = '<ion-icon onClick="handleClose(this)" data-author="'+message.getAttribute('data-author');
				icon += '" data-message="'+message.getAttribute('data-message');
				icon += '" data-channel="'+message.getAttribute('data-channel');
				icon += '" data-timestamp="'+message.getAttribute('data-timestamp');
				icon += '" name="close-circle" class="close"></ion-icon>';
				message.innerHTML += icon;
			}
		});		
		document.querySelector('#nameForm').addEventListener('submit', (event) => {
			event.preventDefault();
			localStorage.setItem("name", document.querySelector('#inputName').value);
			document.querySelector('#inputName').value = '';
			switchToChannels();
		});	

		document.querySelector('#channelForm').addEventListener('submit', (event) => {
			event.preventDefault();
			const channel_name = document.querySelector("#channelName").value;
			document.querySelector("#channelName").value = '';
			socket.emit('add channel', {'channel_name': channel_name});
		});	

		document.querySelector('#messageForm').addEventListener('submit', (event) => {
			event.preventDefault();
			const message = document.querySelector("#message").value;
			document.querySelector("#message").value = '';
			let date = new Date;
			let minutes = date.getMinutes().toString().lpad("0", 2);
			let hours = (date.getHours() % 12).toString().lpad("0", 2);			
			let data = {'message': message,
						'author': localStorage.getItem("name"),
						'channel': current_channel,
						'timestamp': hours+':'+minutes
				   	};
			socket.emit('new message', data);
		});				
	});	

	socket.on('error', error => {
		alert(error);
	});		

	socket.on('announce channel', channel_name => {
	    let div = document.createElement('div')
		div.setAttribute("data-channel", channel_name)
	  	div.classList.add("alert", "alert-primary", "text-center", "channel")
	  	if(current_view == 'chat') {
	  		div.classList.add('d-none');
	  	}
	  	div.innerHTML = channel_name;
	    document.querySelector('.chatrooms').append(div);
	   	addChannelClick(div);

	    let div1 = document.createElement('div')
	    div1.classList.add("d-none", channel_name)
	    document.querySelector('.messages').append(div1);
	});	

	socket.on('load message', message => {
	    let div = document.createElement('div')
	    div.setAttribute('data-author', message.author)
	    div.setAttribute('data-message', message.message)
	    div.setAttribute('data-channel', message.channel)
	    div.setAttribute('data-timestamp', message.timestamp)
	  	div.classList.add("alert", "alert-primary", "message")
	  	div.innerHTML = message.message + ' <span class="author">' + message.author + '</span>';
	  	div.innerHTML += '<span class="timestamp">' + message.timestamp + '</span>';
	  	if(message.author == localStorage.getItem('name')) {
	  		div.classList.add("self");
	  		div.innerHTML += '<ion-icon data-timestamp="'+message.timestamp+'" data-author="'+message.author+'" data-message="'+message.message+'" data-channel="'+message.channel+'" name="close-circle" class="close"></ion-icon>';
	  	}
	    document.querySelector('.messages .'+ message.channel).append(div);	

	    document.querySelectorAll('.close').forEach( (cl) => {
			cl.addEventListener('click', () => {
				handleClose(cl)
			});
	    });
	});

	socket.on('refresh messages', message => {
		document.querySelector('.message[data-timestamp="'+message.timestamp+'"][data-message="'+message.message+'"][data-author="'+message.author+'"][data-channel="'+message.channel+'"]').remove();
	});
});