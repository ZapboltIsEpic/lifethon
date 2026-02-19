#!/usr/bin/env python3
"""
LifeThon Network Debugging Tool
Demonstrates: DNS lookup, TCP connection, traceroute concepts, socket programming
"""

import socket
import subprocess
import sys
import time
from urllib.parse import urlparse

def dns_lookup(hostname):
    """Demonstrate DNS resolution"""
    print(f"🔍 DNS Lookup for: {hostname}")
    try:
        ip_address = socket.gethostbyname(hostname)
        print(f"   ✅ Resolved to: {ip_address}")
        return ip_address
    except socket.gaierror as e:
        print(f"   ❌ DNS lookup failed: {e}")
        return None

def check_tcp_port(host, port, timeout=3):
    """Demonstrate TCP connection attempt"""
    print(f"\n🔍 TCP Connection Test: {host}:{port}")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    
    start_time = time.time()
    try:
        result = sock.connect_ex((host, port))
        end_time = time.time()
        connection_time = (end_time - start_time) * 1000  # ms
        
        if result == 0:
            print(f"   ✅ Port {port} is OPEN")
            print(f"   Connection time: {connection_time:.2f}ms")
            
            # Try to get service banner (if available)
            try:
                sock.send(b"GET / HTTP/1.0\r\n\r\n")
                banner = sock.recv(100).decode('utf-8', errors='ignore')
                if banner:
                    first_line = banner.split('\n')[0]
                    print(f"   Service response: {first_line[:50]}")
            except:
                pass
            
            return True
        else:
            print(f"   ❌ Port {port} is CLOSED or FILTERED")
            print(f"   Error code: {result}")
            return False
    except socket.timeout:
        print(f"   ❌ Connection timeout after {timeout}s")
        return False
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
        return False
    finally:
        sock.close()

def simple_traceroute(host, max_hops=10):
    """Demonstrate traceroute concept using TTL"""
    print(f"\n🔍 Traceroute to: {host} (max {max_hops} hops)")
    print("   This shows the network path packets take")
    
    try:
        # Get destination IP
        dest_ip = socket.gethostbyname(host)
        print(f"   Destination IP: {dest_ip}\n")
        
        for ttl in range(1, max_hops + 1):
            # Create ICMP socket (requires root on Linux)
            # For demo purposes, we'll use a simpler approach
            print(f"   Hop {ttl}: ", end='', flush=True)
            
            # Use system ping with TTL (platform-specific)
            try:
                if sys.platform == "win32":
                    cmd = f"ping -n 1 -i {ttl} {host}"
                else:
                    cmd = f"ping -c 1 -t {ttl} {host}"
                
                result = subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=2
                )
                
                # Simple check if we reached destination
                if dest_ip in result.stdout or "bytes from" in result.stdout.lower():
                    print(f"{dest_ip} (destination reached)")
                    break
                else:
                    print("* * * (timeout or no response)")
            except subprocess.TimeoutExpired:
                print("* * * (timeout)")
            except Exception as e:
                print(f"error: {e}")
                break
            
            if ttl == max_hops:
                print(f"\n   ⚠️  Reached max hops ({max_hops})")
    except socket.gaierror:
        print(f"   ❌ Cannot resolve hostname: {host}")

def check_backend_stack():
    """Check entire LifeThon backend stack"""
    print("=" * 60)
    print("LifeThon Network Stack Diagnostics")
    print("=" * 60)
    
    # Check localhost resolution
    dns_lookup("localhost")
    
    # Check backend API port
    check_tcp_port("localhost", 8081)
    
    # Check database port
    check_tcp_port("localhost", 5432)
    
    # Check frontend port
    check_tcp_port("localhost", 3000)
    
    print("\n" + "=" * 60)

def main():
    if len(sys.argv) > 1:
        target = sys.argv[1]
        
        # Parse if URL provided
        if target.startswith("http"):
            parsed = urlparse(target)
            hostname = parsed.hostname
            port = parsed.port or (443 if parsed.scheme == "https" else 80)
        else:
            hostname = target
            port = 80
        
        dns_lookup(hostname)
        check_tcp_port(hostname, port)
        
        # Traceroute (commented out for WSL1 compatibility)
        # simple_traceroute(hostname)
    else:
        # Default: check LifeThon stack
        check_backend_stack()

if __name__ == "__main__":
    main()