#   Copyright (c) 2006-2007 Open Source Applications Foundation
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import dev_environment, json_tools, server_tools

def make_xmlrpc_client():
    import windmill
    import xmlrpclib
    proxy = windmill.tools.server_tools.ProxiedTransport('localhost:4444')
    xmlrpc_client = xmlrpclib.ServerProxy(windmill.settings['TEST_URL']+'/windmill-xmlrpc/',transport=proxy, allow_none=True)
    return xmlrpc_client        
    
def make_jsonrpc_client():
    import windmill
    proxy = windmill.tools.json_tools.JSONRPCTransport(uri=windmill.settings['TEST_URL']+'/windmill-jsonrpc/', proxy_uri='http://localhost:4444')
    jsonrpc_client = windmill.tools.json_tools.ServerProxy(transport=proxy)
    return jsonrpc_client
    
def start_browser():
    import windmill
    browser = windmill.browser.browser_tools.setup_firefox()
    return browser