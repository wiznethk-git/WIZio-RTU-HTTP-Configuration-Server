const MAX_AOUT = 2;
const MAX_AIN = 4;


function onRecvAnalogIn(data){
	for (const [key, item] of Object.entries(data)) {
		// Paylod : {'AI0':{'value': x, 'mode': y}, ...}
		const idx = key.at(-1);
		const select = document.getElementById(`ai-mode-${idx}`);
		const options = select.children;
		const progress = document.getElementById(`ai-progress-${idx}`);
		const value = document.getElementById(`ai-value-${idx}`);

		const minValue = document.getElementById(`ai-min-${idx}`);
		const midValue = document.getElementById(`ai-mid-${idx}`);
		const maxValue = document.getElementById(`ai-max-${idx}`);

		if (item.mode == 0){ 	// Voltage Mode
			minValue.textContent = '0V';
			midValue.textContent = '5V';
			maxValue.textContent = '10V';

			value.textContent = parseFloat(item.value).toFixed(2) + 'V';
			progress.style.width = parseFloat(item.value).toFixed(2) / 10 * 100 + '%';
			options[0].selected = true;
			options[1].selected = false;


		} else {
			minValue.textContent = '0mA';
			midValue.textContent = '10mA';
			maxValue.textContent = '20mA';

			value.textContent = parseFloat(item.value).toFixed(2) + 'mA';	
			progress.style.width = parseFloat(item.value).toFixed(2) / 20 * 100 + '%';
			options[0].selected = false;
			options[1].selected = true;

		}

	}

}

function getOutputChannelData(value){
	const num = parseFloat(value);
	if (isNaN(num)) return 0;
	return num.toFixed(2);
}
function submitAnalogOutputToServer(slider){
	let data = {};
	data.index = slider.id.slice(-1);
	data.voltage = slider.value;
	fetch('/analog_out', {
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
			console.log('Recieved POST data');
			console.log(data);
		})
		.catch(error => {
			console.log(error);
		})
}


function onChangeSliderValue(slider, idx) {
	const progress = document.getElementById(`ao-progress-${idx}`);
	const slider_value = document.getElementById(`ao-value-${idx}`);
	const input = document.getElementById(`ao-input-${idx}`);
	const recv_value = getOutputChannelData(slider.value);
	slider_value.textContent = recv_value   + 'V';
	progress.style.width = recv_value * 10 + '%';
	input.value = recv_value;
}

function onPressAnalogOutputBtn(idx){
	const slider = document.getElementById(`ao-slider-${idx}`);
	const input = document.getElementById(`ao-input-${idx}`);
	const set_value = input.value;
	let target_value;
	if (set_value > 10) { 
		target_value = parseFloat(10).toFixed(2);
	} else if ((set_value < 0) || (set_value == "")) {
		target_value = parseFloat(0).toFixed(2);
	} else {
		target_value = parseFloat(set_value).toFixed(2);
	}
	slider.value = target_value;
	input.value = target_value;
	onChangeSliderValue(slider, idx);
	submitAnalogOutputToServer(slider);
}


// Add onchange to slider, and onPress to Analog OUT Buttons
document.addEventListener('DOMContentLoaded', ()=> {
	for(let i = 0; i < MAX_AOUT; i++){
		const slider = document.getElementById(`ao-slider-${i}`);
		const ao_button = document.getElementById(`ao-set-${i}`);
		slider.addEventListener('input', () => onChangeSliderValue(slider, i)); // Ensure function called only on input
		ao_button.addEventListener('click', () => onPressAnalogOutputBtn(i))
	}
	
})

// Add onchange to select option
document.addEventListener('DOMContentLoaded', ()=>{
	for (let i = 0; i < MAX_AIN; i++){
		const select = document.getElementById(`ai-mode-${i}`);
		select.addEventListener('change', ()=>{
			const slider_value = document.getElementById(`ai-value-${i}`);
			const slider_min = document.getElementById(`ai-min-${i}`);
			const slider_mid = document.getElementById(`ai-mid-${i}`);
			const slider_max = document.getElementById(`ai-max-${i}`);

			if (select.value == 'voltage'){
				slider_value.textContent = '0.00 V';
				slider_min.textContent = '0V';
				slider_mid.textContent = '5V';
				slider_max.textContent = '10V';
			}
			else {
				slider_value.textContent = '0.00 mA';
				slider_min.textContent = '0mA';
				slider_mid.textContent = '10mA';
				slider_max.textContent = '20mA';

			}



		})
	}
})



// Fetch state
document.addEventListener('DOMContentLoaded', () => {
	let err_count = 0;
	const intervalId = setInterval(() => {
		fetch('/analog_io/state')
			.then(response => {
				if (!response.ok){
					throw new Error('HTTP error. Status: ', response.status);
				}
				return response.json()
			})
			.then(data => {
				onRecvAnalogIn(data);
			})
			.catch(error => {
				err_count++;
				if (err_count == 5){
					clearInterval(intervalId);
					console.log('Stopped.');
				}
				console.log(error);
			});		
	}, 1000);
})