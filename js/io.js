const inputElements = document.querySelectorAll('[id^="IN"]');
function onChangeToggleIO(e) {
	data = {};
	data.pin = e.id;
	data.value = e.checked;
	fetch('/io', {
		method:'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data),
	})
		.then(response=> {
			if (!response.ok) {
				throw new Error("HTTP error! Status: " + response.status);
			};
			return response.json()
		})
		.then(data => {
			e.checked = Boolean(data.value);
			updateToggleText(e);
		})
		.catch(error => {
			console.log(error);
			e.checked = false;
		})
}


async function fetchDigitalInputState(){
	try {
		const response = await fetch('/din')
	
		if (!response.ok){
			throw new Error("HTTP error! Status: " + response.status);
		}
		data = await response.json();
		Object.entries(data).forEach(([pinID, pinValue]) => {
			const textBox = document.getElementById(pinID);
			// 1 is Off, 0 is On.
			if (Boolean(pinValue)){
				textBox.textContent = "Off";
				textBox.style.color = "red";
			}
			else {
				textBox.textContent = "On";
				textBox.style.color = "lime";					
			}
		});
		return data;
	} catch (error) {
		console.error(error);
		throw error
	}
}

function updateToggleText(e) {
	const text = e.parentElement.nextElementSibling;
	if (e.checked) {
		text.textContent = "On";
		text.style.color = "lime";
	}
	else {
		text.textContent = "Off";
		text.style.color = "red";		
	}
}

function setToggleState(e, need_check) {
	e.checked = Boolean(need_check);
	updateToggleText(e);
}


// Fetch current state
document.addEventListener('DOMContentLoaded', () => {
	fetch("/io/state")
		.then(response => {
			if (!response.ok) {
				throw new Error("HTTP error! Status: " + response.status);
			};
			return response.json()
		})
		.then(data => {
			if (data.output) {
				data.output.forEach(item => {
					const checkbox = document.getElementById(item[0]);
					setToggleState(checkbox, item[1]);
				})
			}

			if (data.input) {
				data.input.forEach(item => {
					const textBox = document.getElementById(item[0]);
					// 1 is Off, 0 is On.
					if (Boolean(item[1])){
						textBox.textContent = "Off";
						textBox.style.color = "red";
					}
					else {
						textBox.textContent = "On";
						textBox.style.color = "lime";					
					}
				})
			}

		})
})

// Fetch input state on every 1 second
document.addEventListener('DOMContentLoaded', async () => {
	let err_count = 0;
	while (true) {
		try {
			const payload = await fetchDigitalInputState();
		} 
		catch (error) {
			err_count++;
            console.log("Skipping loop error layer, retrying next cycle...");
        	if (err_count >= 5) break
        }	

        // Enforce a strict minimum 1-second delay *between* requests
        await new Promise(resolve => setTimeout(resolve, 1000));
	}
})