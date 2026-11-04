#!/usr/bin/env python3
"""Loopback-only demo proxy. HTTPS upstream certificate must be independently trusted."""
import argparse,http.server,http.client,ssl,socket,select,pathlib
p=argparse.ArgumentParser();p.add_argument('--device',required=True);p.add_argument('--ca-cert',required=True);p.add_argument('--port',type=int,default=10027);a=p.parse_args()
ctx=ssl.create_default_context(cafile=a.ca_cert);ctx.check_hostname=False;ctx.verify_flags|=ssl.VERIFY_X509_PARTIAL_CHAIN
root=pathlib.Path(__file__).resolve().parent
class Handler(http.server.BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):self.handle_request()
 def do_POST(self):self.handle_request()
 def do_OPTIONS(self):self.handle_request()
 def handle_request(self):
  if self.headers.get('Host') not in [f'127.0.0.1:{a.port}',f'localhost:{a.port}']:self.send_error(403);return
  if self.headers.get('Origin') not in [None, f'http://127.0.0.1:{a.port}', f'http://localhost:{a.port}']:self.send_error(403);return
  if self.path.startswith('/api/v1/'):
   if self.headers.get('Upgrade','').lower()=='websocket':return self.websocket()
   c=http.client.HTTPSConnection(a.device,context=ctx,timeout=20)
   headers={k:v for k,v in self.headers.items() if k.lower() not in ['host','connection','origin','referer']}
   headers['Origin']='https://'+a.device
   data=self.rfile.read(int(self.headers.get('Content-Length','0')))
   try:
    c.request(self.command,self.path,body=data or None,headers=headers);r=c.getresponse();body=r.read();self.send_response(r.status)
    for k,v in r.getheaders():
     if k.lower() not in ['transfer-encoding','connection','content-length','set-cookie']:self.send_header(k,v)
     elif k.lower()=='set-cookie':self.send_header(k,v.replace('; Secure','').replace('; secure',''))
    self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
   finally:c.close()
  else:
   name=self.path.split('?')[0];f={'/':root/'index.html','/index.html':root/'index.html','/receiver.js':root/'receiver.js','/hid.js':root/'hid.js','/app.js':root/'app.js','/i18n.js':root/'i18n.js'}.get(name)
   if not f:self.send_error(404);return
   body=f.read_bytes();self.send_response(200);self.send_header('Content-Type','text/javascript'if f.suffix=='.js'else'text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def websocket(self):
  upstream=ctx.wrap_socket(socket.create_connection((a.device,443),timeout=15),server_hostname=a.device)
  try:
   lines=[f'GET {self.path} HTTP/1.1',f'Host: {a.device}',f'Origin: https://{a.device}']+[k+': '+v for k,v in self.headers.items()if k.lower()not in ['host','origin','referer']]
   upstream.sendall(('\r\n'.join(lines)+'\r\n\r\n').encode());upstream.settimeout(None);self.connection.settimeout(None)
   while True:
    readable,_,_=select.select([upstream,self.connection],[],[],60)
    if not readable:break
    for source in readable:
     chunk=source.recv(65536)
     if not chunk:return
     (self.connection if source is upstream else upstream).sendall(chunk)
  finally:upstream.close();self.close_connection=True
http.server.ThreadingHTTPServer(('127.0.0.1',a.port),Handler).serve_forever()
