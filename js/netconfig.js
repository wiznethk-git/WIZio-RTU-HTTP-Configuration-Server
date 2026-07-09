// Input Area
const ip_addr = document.getElementById("input-ip");
const mask = document.getElementById("input-mask");
const gateway = document.getElementById("input-gateway");
const dns = document.getElementById("input-dns");
const input_fields = [ip_addr, mask, gateway, dns];


// Radio
const radio_container = document.getElementById('radio-container');
const dhcp = document.getElementById('dhcp');
const static = document.getElementById('static');

// Button
const button = document.getElementById('btn-netconfig');

// Error message
const error_message = document.getElementById('netconfig-error');
const error_container = error_message.parentElement;


function onChangeDhcpRadio() {
	// Disable input fields if DHCP is used
	for (const field of input_fields) {
		field.disabled = dhcp.checked;
	}
}

function onSubmitNetConfig(){
	const data = {};
	if (static.checked) {
		data.dhcp = false;
		data.ip = ip_addr.value;
		data.subnet_mask = mask.value;
		data.default_gateway = gateway.value;
		data.dns = dns.value;
	}
	else {
		data.dhcp = true;
	}

	fetch('/netconfig/config', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data),
	})
		.then(response => {
			if (!response.ok) {
				throw new Error("HTTP error! Status: " + response.status);
			};
			return response.json()
		})
		.then(data => {
			console.log('Recieved post data.');	
			console.log(data);
			if (data.redirect) {
				if (data.dhcp) {
					console.log('Wait for DHCP signal.')
				}
				else {
					window.location.href = `http://${ip_addr.value}:80/netconfig`;	
				}	
			}
			else {
				// Output error message.
				error_container.hidden = false;
				error_message.textContent = data.error_message;
			}
		})
		.catch(error => {

		})
}


// Fetch network configurations
document.addEventListener('DOMContentLoaded', () => {
	fetch('/netconfig/config')
		.then(response => {
			if (!response.ok) {
				throw new Error("HTTP error! Status: " + response.status);
			};
			return response.json();
		})
		.then(data => {
			ip_addr.value = data.ip_addr || "0.0.0.0";
			mask.value = data.subnet_mask || "0.0.0.0";
			gateway.value = data.default_gateway || "0.0.0.0";
			dns.value = data.dns || "0.0.0.0";
			if (data.dhcp === true) {
				dhcp.checked = true;
				for (const field of input_fields) {
					field.disabled = true;
				}
			}
			else {
				static.checked = true;
				for (const field of input_fields) {
					field.disabled = false;
				}
			}

		})
		.catch(error => {
			ip_addr.value = '0.0.0.0';
			mask.value = '0.0.0.0';
			gateway.value = '0.0.0.0';
			dns.value = '0.0.0.0';
			dhcp.checked = true;
			for (const field of input_fields) {
				field.disabled = true;
			}
		})
})

document.addEventListener('DOMContentLoaded', () => {
	radio_container.addEventListener("change", onChangeDhcpRadio);
	button.addEventListener('click', onSubmitNetConfig);
})
