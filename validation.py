def validate_ipv4(ip):
    print('Validating: ', ip)
    if not isinstance(ip, str):
        msg = b'The given ip is not a string.'
        return (False, msg)
    seg = ip.split('.')
    if len(seg) != 4:
        msg = b'Ensure address are all in ipv4. (x.x.x.x)'
        return (False, msg)
    try:
        for i in seg:
            octet = int(i)
            if octet > 255 or octet < 0:
                msg = b'Ensure input is an ipv4 address.'
                return (False, msg)
    except (ValueError, TypeError):
        return (False, b'Ensure each digit is a number')
    return (True, None)
    