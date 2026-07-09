
function addMessageToBox(msg, direction){
	const box = document.getElementById('serial-messages');
	const span = document.createElement('span');
	if (direction == "send") {
		span.style.color = "blue";
	} else {
		span.style.color = "green";
	}
	span.textContent = msg + '\n';
	box.appendChild(span);
	box.appendChild(document.createElement('br'));
}


// Button
function onClickSendBtn(element){
	const input = element.previousElementSibling;
	let data = {};
	addMessageToBox(input.value, 'send');
	data.message = input.value;
	fetch("/serial",{
		method:'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data),
	})
		.then(response => {
			if (!response.ok){
				throw new Error("HTTP error! Status: " + response.status);
			}
		})
		.then(data => {
			addMessageToBox(data.message, "send");
		})
		.catch(error => {
			console.log(error)
		})
}
// Fetch data
document.addEventListener('DOMContentLoaded', ()=> {
	let err_count = 0;
	let started = false;
	let intervalId = setInterval(() => {
		if (started) return;
		started = true;
		fetch("/serial/recv")
			.then(response => {
				if (!response.ok){
					throw new Error("HTTP error! Status: " + response.status);
				}
				return response.json()
			})
			.then(data => {
				if (data.message){
					console.log(data.message)
					addMessageToBox(data.message, "recv");
				}
			})
			.catch(error => {
				err_count++;
				console.log('Error conunted. Num: ' + err_count);
				if (err_count > 5){
					clearInterval(intervalId);
				}
				console.log(error)
			})
			.finally(()=> {
				started = false;
			})

	}, 1000)
})