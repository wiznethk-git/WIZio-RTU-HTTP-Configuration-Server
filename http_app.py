import os
import socket
import json
from debug import dprint
from machine import Pin
from server import Server
from setup import SetUpWiznetChip
from validation import validate_ipv4
from device import Device

device = Device()
server = Server(device = device)

# Index
@server.add_route('GET', '/')
def index(_):
    dprint('Accessed index page.')
    path = 'template/index.html'
    with open(path, 'rb') as f:
        html = f.read()
    return server.response('text/html', html)

# Net Config
@server.add_route('GET', '/netconfig')
def netconfig(_):
    dprint('Accessed network configuration page.')
    path = 'template/netconfig.html'
    with open(path, 'rb') as f:
        html = f.read()
    return server.response('text/html', html)

@server.add_route('GET', '/netconfig/config')
def get_netconfig(_):
    dprint('Get network configuration details.')
    ip_addr, mask, gateway, dns = server.nic_config()
    data = json.dumps({
        'ip_addr': ip_addr,
        'subnet_mask': mask,
        'default_gateway': gateway,
        'dns': dns,
        'dhcp': server.is_dhcp
    })
    return server.response('application/json', data)


@server.add_route('POST', '/netconfig/config')
def set_netconfig(body):
    dprint('Change network configuration details.')
    try:
        body = json.loads(body)
    except Exception as e:
        return server.response('text/plain', status = '400 Bad Request')
    
    use_dhcp = body.get('dhcp', True)
    redirect = False
    error_msg = None
    if use_dhcp:
        task_args = (None,)
    else:
        config = (
            body.get('ip'),
            body.get('subnet_mask'),
            body.get('default_gateway'),
            body.get('dns')
        )
        redirect = True
        task_args = (config, use_dhcp)
        for i in config:
             is_valid, error_msg = validate_ipv4(i)
             if not is_valid:
                 break
    data = {}
    if not error_msg:
        task = (server.init_network, task_args)
        server.task.append(task)
        data['redirect'] = redirect
    else:
        data['error'] = True
        data['error_message'] = error_msg  
    return server.response('application/json', json.dumps(data))

# Digital IO
@server.add_route('GET', '/io')
def io_control(_):
    dprint('Accessed I/O Control page.')
    path = 'template/io.html'
    with open(path, 'rb') as f:
        html = f.read()
    return server.response('text/html', html)
    
@server.add_route('POST', '/io')
def set_io_output(body):
    dprint('Switch digital pin.')
    try:
        body = json.loads(body)
    except Exception as e:
        return server.response('text/plain', status = '400 Bad Request')
    pin_name = body.get('pin', 'RY1')
    pin_value = body.get('value', 0)
    value = server.device.write_dout(pin_name, pin_value)
    data = None
    if value != -1:
        data = json.dumps({'value': value})
        if server.mqtt_client:
            topic = 'pin_' + pin_name.lower()
            msg = str(pin_value)
            print(f'Publish topic of {topic} of value {msg}')
            server.mqtt_client.publish(topic, msg)
    else:
        data = json.dumps({
            'error': True,
            'error_msg': 'Error in writing value to '
        })
    return server.response('application/json', data)

@server.add_route('GET', '/io/state')
def io_control(_):
    dprint('Get I/O state.')
    data = {
        'output': [],
        'input': []
    }
    for idx in range(8):
        dout_pair = (f'RY{idx + 1}', server.device.read_dout_at(idx))
        din_pair = (f'IN{idx + 1}', server.device.read_din_at(idx))
        data['output'].append(dout_pair)
        data['input'].append(din_pair)
    data = json.dumps(data)        
    return server.response('application/json', data)

@server.add_route('GET', '/din')
def get_digital_input(_):
    dprint('Get digital input values')
    data = {}
    for idx in range(8):
        data[f'IN{idx + 1}'] = server.device.read_din_at(idx)
    data = json.dumps(data)
    dprint(data)
    return server.response('application/json', data)


# Analog IO
@server.add_route('GET', '/analog_io')
def analog_io(_):
    dprint('Accessed Analog I/O page.')
    path = 'template/analog.html'
    with open(path, 'rb') as f:
        html = f.read()
    return server.response('text/html', html)

@server.add_route('GET', '/analog_io/state')
def get_analog_in_state(_):
    dprint('Get analog input state.')
    data = json.dumps(server.device.read_ain_all())
    return server.response('application/json', data)

@server.add_route('POST', '/analog_out')
def analog_out(body):
    try:
        body = json.loads(body)
    except Exception as e:
        return server.response('text/plain', status = '400 Bad Request')
    index = int(body.get('index', 0))
    voltage = float(body.get('voltage', 0))
    success = server.device.write_aout_at(index, voltage)
    data = json.dumps({'success': success})
    return server.response("application/json", data)

# Serial
@server.add_route('GET', '/serial')
def serial(_):
    dprint('Accessed Serial page.')
    path = 'template/serial.html'
    with open(path, 'rb') as f:
        html = f.read()
    return server.response('text/html', html)

@server.add_route('POST', '/serial')
def serial_send(body):
    dprint('Sending uart message')
    try:
        body = json.loads(body)
    except Exception as e:
        return server.response('text/plain', status = '400 Bad Request')
    message = body.get('message', 'No data')
    server.device.send_uart_message(message.encode())
    return server.response('application/json', None)

@server.add_route('GET', '/serial/recv')
def serial_send(_):
    message = server.device.recv_uart_message()
    data = json.dumps({
        'message': message
    })
    return server.response('application/json', data)

# Storage
@server.add_route('GET', '/storage')
def storage(_):
    dprint('Accessed Storage page.')
    path = 'template/storage.html'
    with open(path, 'rb') as f:
        html = f.read()
    return server.response('text/html', html)

@server.add_route('POST', '/storage/write')
def write_to_eeprom(body):
    dprint('Writing to storage.')
    success = server.device.eeprom_write(body)
    dprint('Success write: ', server.device.eeprom_read())
    text = 'Success.' if success else 'Failed.'      
    return server.response('text/plain', text)

@server.add_route('GET', '/storage/read')
def read_from_eeprom(_):
    dprint('Reading from storage.')
    text = server.device.eeprom_read()
    return server.response('text/plain', text)


def start():
    while True:
        try:
            server.run()
        except (KeyboardInterrupt, OSError) as e:
            print(e)
            server.disconnect()
            break
        except Exception as e:
            dprint(e)
            server.disconnect()
            dprint('Restarting...')

