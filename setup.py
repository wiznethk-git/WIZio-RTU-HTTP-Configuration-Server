import network
import sys
from machine import SPI, Pin

def SetUpWiznetChip(config = None, dhcp = True):
    
    if config is None:
        config = (None, None, None, None)
    
    # Change the following based on your ipconfig
    NET_IP   = config[0] or "10.0.1.109"
    NET_SN   = config[1] or "255.255.255.0"
    NET_GW   = config[2] or "10.0.1.254"
    NET_DNS  = config[3] or "8.8.8.8"

    spi = SPI(2, baudrate=8_000_000, polarity=0, phase=0)

    cs  = Pin("PB12", Pin.OUT)
    rst = Pin("PD9", Pin.OUT)
    pwn = Pin("PE15", Pin.OUT, value = 0)

    nic = network.WIZNET5K(spi, cs, rst)

    # Reset the WIZnet chip
    is_dhcp = dhcp
    nic.active(True)
    
    # Please use your PC to Ping
    if dhcp:
        print('Network configuration: DHCP')
        try:
            nic.ifconfig("dhcp")
        except Exception as e:
            sys.print_exception(e)
            print('==== Failure in DHCP. Fallback to Static IP ====')
            nic.ifconfig((NET_IP, NET_SN, NET_GW, NET_DNS))
            is_dhcp = False
    else:
        print('Network configuration: Static')
        nic.ifconfig((NET_IP, NET_SN, NET_GW, NET_DNS))
        is_dhcp = False
        
    return nic, is_dhcp