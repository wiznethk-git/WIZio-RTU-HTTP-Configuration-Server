const messageBox = document.getElementById('storage-input');

function onClickStorageWriteBtn(e){
	const message = messageBox.value; 
	fetch('/storage/write',{
		method: 'POST',
		headers: {
			'Content-Type': 'text/plain'
		},
		body: message
	})
		.then(response => {
			if (!response.ok){
				throw new Error("HTTP error! Status: " + response.status);
			}
			return response.text()
		})
		.then(text => {
			console.log(text);
		})
		.catch(error => {
			console.log('Fetch error:', error);
		});
}

function onClickStorageReadBtn(e){
	fetch('/storage/read')
		.then(response => {
			if (!response.ok){
				throw new Error("HTTP error! Status: " + response.status);
			}
			return response.text()
		})
		.then(text => {
			messageBox.value = text;
		})
		.catch(error => {
			console.log('Fetch error:', error);
		});
}